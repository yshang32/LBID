"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

import { PROMO_FRAME_COUNT, promoFrameSrc, promoStageFrames } from "./promo-manifest"

export type PromoCanvasHandle = {
  /** Drive the film. p in [0, 1] maps linearly onto the frame sequence. */
  setProgress: (p: number) => void
  /** Begin fetching every remaining frame (called on first scroll intent). */
  warm: () => void
}

type Slot = { img: HTMLImageElement | null; ready: boolean; loading: boolean }

const DPR_CAP = 1.75
const SPINE_STEP = 24
const MAX_CONCURRENT_LOADS = 6
const MAX_PROGRESS_STEP = 0.014
const PROGRESS_EASE = 0.18

type Grade = { top: [number, number, number, number]; bottom: [number, number, number, number] }

/** Warm gold sunset → ocean blue → highway silver/navy → bright warehouse. */
const stageGrades: Grade[] = [
  { top: [244, 188, 116, 0.08], bottom: [16, 26, 62, 0.22] },
  { top: [255, 166, 84, 0.1], bottom: [12, 24, 58, 0.25] },
  { top: [96, 178, 235, 0.08], bottom: [7, 30, 64, 0.26] },
  { top: [172, 186, 205, 0.08], bottom: [12, 22, 52, 0.28] },
  { top: [255, 236, 205, 0.06], bottom: [14, 24, 54, 0.24] },
]

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function gradeAt(frameFraction: number): Grade {
  const count = promoStageFrames.length
  if (count === 0) return stageGrades[0]
  const scaled = Math.min(count - 1e-6, Math.max(0, frameFraction * count))
  const index = Math.floor(scaled)
  const local = scaled - index
  const current = stageGrades[Math.min(index, stageGrades.length - 1)]
  const next = stageGrades[Math.min(index + 1, stageGrades.length - 1)]
  // Blend across the last quarter of each stage so grades drift, never snap.
  const t = local < 0.75 ? 0 : (local - 0.75) / 0.25
  const mix = (a: [number, number, number, number], b: [number, number, number, number]) =>
    [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)] as [
      number,
      number,
      number,
      number,
    ]
  return { top: mix(current.top, next.top), bottom: mix(current.bottom, next.bottom) }
}

function rgba([r, g, b, a]: [number, number, number, number]) {
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a.toFixed(3)})`
}

export const PromoCanvas = forwardRef<
  PromoCanvasHandle,
  { className?: string; onFirstFrame?: () => void; onLoaded?: (fraction: number) => void }
>(function PromoCanvas({ className, onFirstFrame, onLoaded }, handle) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const slotsRef = useRef<(Slot | undefined)[]>([])
  const targetProgressRef = useRef(0)
  const displayProgressRef = useRef(0)
  const dirtyRef = useRef(true)
  const rafRef = useRef<number | null>(null)
  const loadQueueRef = useRef<number[]>([])
  const activeLoadsRef = useRef(0)
  const smallRef = useRef(false)
  const readyCountRef = useRef(0)
  const warmedRef = useRef(false)
  const firstFrameRef = useRef(false)
  const lastDrawnIndexRef = useRef(-1)
  const posterRef = useRef<HTMLImageElement | null>(null)
  const reducedMotionRef = useRef(false)
  const onFirstFrameRef = useRef(onFirstFrame)
  const onLoadedRef = useRef(onLoaded)
  onFirstFrameRef.current = onFirstFrame
  onLoadedRef.current = onLoaded

  useImperativeHandle(handle, () => ({
    setProgress(p: number) {
      const next = Math.min(1, Math.max(0, p))
      if (next === targetProgressRef.current && !dirtyRef.current) return
      targetProgressRef.current = next
      requestRender()
    },
    warm,
  }))

  function ensureLoaded(index: number, priority = false) {
    if (index < 0 || index >= PROMO_FRAME_COUNT) return
    const slots = slotsRef.current
    const existing = slots[index]
    if (existing) {
      if (priority && !existing.loading && !existing.ready) {
        const queue = loadQueueRef.current
        const queuedAt = queue.indexOf(index)
        if (queuedAt >= 0) queue.splice(queuedAt, 1)
        queue.unshift(index)
        pumpLoads()
      }
      return
    }
    slots[index] = { img: null, ready: false, loading: false }
    if (priority) loadQueueRef.current.unshift(index)
    else loadQueueRef.current.push(index)
    pumpLoads()
  }

  function pumpLoads() {
    while (activeLoadsRef.current < MAX_CONCURRENT_LOADS && loadQueueRef.current.length > 0) {
      const index = loadQueueRef.current.shift()
      if (index === undefined) return
      const slot = slotsRef.current[index]
      if (!slot || slot.loading || slot.ready) continue

      const img = new Image()
      img.decoding = "async"
      slot.img = img
      slot.loading = true
      activeLoadsRef.current += 1

      const finish = (ready: boolean) => {
        slot.loading = false
        slot.ready = ready
        activeLoadsRef.current -= 1
        if (ready) {
          readyCountRef.current += 1
          onLoadedRef.current?.(readyCountRef.current / PROMO_FRAME_COUNT)
          requestRender()
        }
        pumpLoads()
      }
      img.onload = () => finish(true)
      img.onerror = () => finish(false)
      img.src = promoFrameSrc(index, smallRef.current)
    }
  }

  function warm() {
    if (warmedRef.current) return
    warmedRef.current = true
    for (let index = 0; index < PROMO_FRAME_COUNT; index += 1) ensureLoaded(index)
  }

  function nearestReady(target: number): number {
    const slots = slotsRef.current
    if (slots[target]?.ready) return target
    for (let d = 1; d < PROMO_FRAME_COUNT; d++) {
      if (target - d >= 0 && slots[target - d]?.ready) return target - d
      if (target + d < PROMO_FRAME_COUNT && slots[target + d]?.ready) return target + d
    }
    return -1
  }

  function requestRender() {
    dirtyRef.current = true
    if (rafRef.current !== null || document.visibilityState === "hidden") return
    rafRef.current = requestAnimationFrame(function tick() {
      rafRef.current = null
      const delta = targetProgressRef.current - displayProgressRef.current
      const moving = Math.abs(delta) > 0.0005
      if (reducedMotionRef.current || !moving) {
        displayProgressRef.current = targetProgressRef.current
      } else {
        const eased = delta * PROGRESS_EASE
        displayProgressRef.current += Math.max(-MAX_PROGRESS_STEP, Math.min(MAX_PROGRESS_STEP, eased))
      }
      if (dirtyRef.current || moving) render()
      if (Math.abs(targetProgressRef.current - displayProgressRef.current) > 0.0005) {
        rafRef.current = requestAnimationFrame(tick)
      }
    })
  }

  function render() {
    dirtyRef.current = false
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP)
    const cw = canvas.clientWidth
    const ch = canvas.clientHeight
    if (cw === 0 || ch === 0) return
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
      canvas.width = Math.round(cw * dpr)
      canvas.height = Math.round(ch * dpr)
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const drawCover = (img: HTMLImageElement) => {
      const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight)
      const drawW = img.naturalWidth * scale
      const drawH = img.naturalHeight * scale
      ctx.drawImage(img, (cw - drawW) / 2, (ch - drawH) / 2, drawW, drawH)
    }

    if (reducedMotionRef.current) {
      if (posterRef.current?.complete && posterRef.current.naturalWidth > 0) drawCover(posterRef.current)
      return
    }

    const target = Math.round(displayProgressRef.current * (PROMO_FRAME_COUNT - 1))
    for (let offset = 1; offset <= 6; offset += 1) {
      ensureLoaded(Math.min(PROMO_FRAME_COUNT - 1, target + offset), true)
      ensureLoaded(Math.max(0, target - offset), true)
    }
    ensureLoaded(target, true)

    const previous = lastDrawnIndexRef.current
    const drawIndex = slotsRef.current[target]?.ready
      ? target
      : previous >= 0 && slotsRef.current[previous]?.ready
        ? previous
        : nearestReady(target)
    if (drawIndex < 0) {
      const poster = posterRef.current
      if (poster?.complete && poster.naturalWidth > 0) drawCover(poster)
      return
    }

    const { img } = slotsRef.current[drawIndex] as Slot
    if (!img) return
    drawCover(img)
    lastDrawnIndexRef.current = drawIndex

    // Stage color grade + vignette keep copy legible and the journey tonally continuous.
    const grade = gradeAt(target / Math.max(1, PROMO_FRAME_COUNT - 1))
    const tint = ctx.createLinearGradient(0, 0, 0, ch)
    tint.addColorStop(0, rgba(grade.top))
    tint.addColorStop(1, rgba(grade.bottom))
    ctx.fillStyle = tint
    ctx.fillRect(0, 0, cw, ch)

    const vignette = ctx.createRadialGradient(
      cw / 2,
      ch / 2,
      Math.min(cw, ch) * 0.44,
      cw / 2,
      ch / 2,
      Math.max(cw, ch) * 0.8,
    )
    vignette.addColorStop(0, "rgba(5,10,26,0)")
    vignette.addColorStop(1, "rgba(5,10,26,0.34)")
    ctx.fillStyle = vignette
    ctx.fillRect(0, 0, cw, ch)

    if (!firstFrameRef.current) {
      firstFrameRef.current = true
      onFirstFrameRef.current?.()
    }
  }

  useEffect(() => {
    smallRef.current = window.innerWidth <= 900
    reducedMotionRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const poster = new Image()
    poster.decoding = "async"
    poster.onload = requestRender
    poster.src = "/promo-poster.webp"
    posterRef.current = poster

    if (!reducedMotionRef.current) {
      ensureLoaded(0)
      for (let i = 0; i < PROMO_FRAME_COUNT; i += SPINE_STEP) ensureLoaded(i)
      ensureLoaded(PROMO_FRAME_COUNT - 1)
    }

    const canvas = canvasRef.current
    const observer = new ResizeObserver(() => requestRender())
    if (canvas) observer.observe(canvas)

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
      } else {
        requestRender()
      }
    }
    document.addEventListener("visibilitychange", handleVisibility)

    requestRender()

    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", handleVisibility)
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
})
