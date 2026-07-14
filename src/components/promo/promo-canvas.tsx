"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

import { PROMO_FRAME_COUNT, promoFrameSrc, promoStageFrames } from "./promo-manifest"

export type PromoCanvasHandle = {
  /** Drive the film. p in [0, 1] maps linearly onto the frame sequence. */
  setProgress: (p: number) => void
  /** Begin fetching every remaining frame (called on first scroll intent). */
  warm: () => void
}

type Slot = { img: HTMLImageElement; ready: boolean }

const DPR_CAP = 1.75
const SPINE_STEP = 24
const WARM_BATCH = 8

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
  const progressRef = useRef(0)
  const dirtyRef = useRef(true)
  const rafRef = useRef<number | null>(null)
  const smallRef = useRef(false)
  const readyCountRef = useRef(0)
  const warmedRef = useRef(false)
  const firstFrameRef = useRef(false)
  const posterRef = useRef<HTMLImageElement | null>(null)
  const reducedMotionRef = useRef(false)
  const onFirstFrameRef = useRef(onFirstFrame)
  const onLoadedRef = useRef(onLoaded)
  onFirstFrameRef.current = onFirstFrame
  onLoadedRef.current = onLoaded

  useImperativeHandle(handle, () => ({
    setProgress(p: number) {
      const next = Math.min(1, Math.max(0, p))
      if (next === progressRef.current && !dirtyRef.current) return
      progressRef.current = next
      requestRender()
    },
    warm,
  }))

  function ensureLoaded(index: number) {
    if (index < 0 || index >= PROMO_FRAME_COUNT) return
    const slots = slotsRef.current
    if (slots[index]) return
    const img = new Image()
    img.decoding = "async"
    const slot: Slot = { img, ready: false }
    slots[index] = slot
    img.onload = () => {
      slot.ready = true
      readyCountRef.current += 1
      onLoadedRef.current?.(readyCountRef.current / PROMO_FRAME_COUNT)
      requestRender()
    }
    img.src = promoFrameSrc(index, smallRef.current)
  }

  function warm() {
    if (warmedRef.current) return
    warmedRef.current = true
    let next = 0
    const pump = () => {
      let queued = 0
      while (next < PROMO_FRAME_COUNT && queued < WARM_BATCH) {
        if (!slotsRef.current[next]) {
          ensureLoaded(next)
          queued += 1
        }
        next += 1
      }
      if (next < PROMO_FRAME_COUNT) window.setTimeout(pump, 120)
    }
    pump()
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
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      if (dirtyRef.current) render()
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

    // Deep-navy base keeps edges calm while frames stream in.
    const base = ctx.createLinearGradient(0, 0, 0, ch)
    base.addColorStop(0, "#0a1229")
    base.addColorStop(1, "#050a1a")
    ctx.fillStyle = base
    ctx.fillRect(0, 0, cw, ch)

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

    const target = Math.round(progressRef.current * (PROMO_FRAME_COUNT - 1))
    ensureLoaded(target)
    ensureLoaded(Math.min(PROMO_FRAME_COUNT - 1, target + 1))
    ensureLoaded(Math.max(0, target - 1))

    const drawIndex = nearestReady(target)
    if (drawIndex < 0) {
      if (posterRef.current?.complete && posterRef.current.naturalWidth > 0) drawCover(posterRef.current)
      return
    }

    const { img } = slotsRef.current[drawIndex] as Slot
    drawCover(img)

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
