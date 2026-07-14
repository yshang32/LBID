"use client"

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"

import { CROSSFADE, journeyScenes, type JourneyScene } from "./journey-data"

export type JourneyCanvasHandle = {
  /** Drive the film. p in [0, 1]. Cheap to call from ScrollTrigger onUpdate. */
  setProgress: (p: number) => void
  getProgress: () => number
  /** Begin fetching every remaining keyframe (called on first scroll intent). */
  warm: () => void
}

type LoadedImage = { img: HTMLImageElement; ready: boolean }

const DPR_CAP = 1.75

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t))
  return x * x * (3 - 2 * x)
}

export const JourneyCanvas = forwardRef<JourneyCanvasHandle, { className?: string; onFirstFrame?: () => void }>(
  function JourneyCanvas({ className, onFirstFrame }, handle) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const progressRef = useRef(0)
    const dirtyRef = useRef(true)
    const rafRef = useRef<number | null>(null)
    const imagesRef = useRef<LoadedImage[]>([])
    const firstFrameRef = useRef(false)
    const onFirstFrameRef = useRef(onFirstFrame)
    onFirstFrameRef.current = onFirstFrame

    useImperativeHandle(handle, () => ({
      setProgress(p: number) {
        const next = Math.min(1, Math.max(0, p))
        if (next === progressRef.current && !dirtyRef.current) return
        progressRef.current = next
        requestRender()
      },
      getProgress: () => progressRef.current,
      warm() {
        journeyScenes.forEach((_, index) => ensureLoaded(index))
      },
    }))

    function sourceFor(scene: JourneyScene) {
      const canvas = canvasRef.current
      return canvas && canvas.clientWidth <= 820 ? scene.srcSmall : scene.src
    }

    function ensureLoaded(index: number) {
      const store = imagesRef.current
      if (store[index]) return
      const scene = journeyScenes[index]
      const img = new Image()
      img.decoding = "async"
      const entry: LoadedImage = { img, ready: false }
      store[index] = entry
      img.onload = () => {
        entry.ready = true
        requestRender()
      }
      img.src = sourceFor(scene)
    }

    function requestRender() {
      dirtyRef.current = true
      if (rafRef.current !== null || document.visibilityState === "hidden") return
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null
        if (dirtyRef.current) render()
      })
    }

    function drawScene(
      ctx: CanvasRenderingContext2D,
      cw: number,
      ch: number,
      scene: JourneyScene,
      entry: LoadedImage,
      localT: number,
      alpha: number,
    ) {
      const t = smoothstep(localT)
      const { from, to } = scene.camera
      const cx = from.cx + (to.cx - from.cx) * t
      const cy = from.cy + (to.cy - from.cy) * t
      const zoom = from.zoom + (to.zoom - from.zoom) * t

      const iw = entry.img.naturalWidth
      const ih = entry.img.naturalHeight
      const scale = Math.max(cw / iw, ch / ih) * zoom
      const drawW = iw * scale
      const drawH = ih * scale
      let dx = cw / 2 - cx * iw * scale
      let dy = ch / 2 - cy * ih * scale
      dx = Math.min(0, Math.max(cw - drawW, dx))
      dy = Math.min(0, Math.max(ch - drawH, dy))

      ctx.globalAlpha = alpha
      ctx.drawImage(entry.img, dx, dy, drawW, drawH)

      const grade = ctx.createLinearGradient(0, 0, 0, ch)
      grade.addColorStop(0, scene.grade[0])
      grade.addColorStop(1, scene.grade[1])
      ctx.fillStyle = grade
      ctx.fillRect(0, 0, cw, ch)
      ctx.globalAlpha = 1
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

      const p = progressRef.current
      const count = journeyScenes.length
      const seg = 1 / count
      const index = Math.min(count - 1, Math.floor(p / seg))
      const localT = (p - index * seg) / seg

      ensureLoaded(index)
      if (index + 1 < count && localT > 0.5) ensureLoaded(index + 1)

      const current = imagesRef.current[index]
      const fadeStart = 1 - CROSSFADE
      const nextAlpha = index + 1 < count && localT > fadeStart ? smoothstep((localT - fadeStart) / CROSSFADE) : 0
      const next = nextAlpha > 0 ? imagesRef.current[index + 1] : undefined

      // Brand-toned placeholder keeps the stage calm while frames stream in.
      const base = ctx.createLinearGradient(0, 0, cw, ch)
      base.addColorStop(0, "#eef2f8")
      base.addColorStop(0.55, "#e6ecf5")
      base.addColorStop(1, "#dfe7f2")
      ctx.fillStyle = base
      ctx.fillRect(0, 0, cw, ch)

      if (current?.ready) {
        drawScene(ctx, cw, ch, journeyScenes[index], current, localT, 1)
        if (!firstFrameRef.current) {
          firstFrameRef.current = true
          onFirstFrameRef.current?.()
        }
      }
      if (next?.ready && nextAlpha > 0) {
        drawScene(ctx, cw, ch, journeyScenes[index + 1], next, 0, nextAlpha)
      }

      // Subtle edge vignette so HUD chips stay legible on bright frames.
      const vignette = ctx.createRadialGradient(cw / 2, ch / 2, Math.min(cw, ch) * 0.42, cw / 2, ch / 2, Math.max(cw, ch) * 0.78)
      vignette.addColorStop(0, "rgba(8,21,47,0)")
      vignette.addColorStop(1, "rgba(8,21,47,0.22)")
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, cw, ch)
    }

    useEffect(() => {
      ensureLoaded(0)

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

      const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback
      const idleId = idle
        ? idle(() => journeyScenes.forEach((_, i) => ensureLoaded(i)))
        : window.setTimeout(() => journeyScenes.forEach((_, i) => ensureLoaded(i)), 2600)

      requestRender()

      return () => {
        observer.disconnect()
        document.removeEventListener("visibilitychange", handleVisibility)
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current)
          rafRef.current = null
        }
        if (typeof idleId === "number" && !idle) window.clearTimeout(idleId)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return <canvas ref={canvasRef} className={className} aria-hidden="true" />
  },
)
