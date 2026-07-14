"use client"

import { forwardRef, useImperativeHandle, useRef, useState } from "react"
import { FileCheck2, Lock, Plane, Ship } from "lucide-react"

import type { Locale } from "@/lib/i18n"
import { journeyShipmentId, journeyStages, journeyWaypoints, stageIndexFor } from "./journey-data"

export type JourneyHudHandle = {
  update: (progress: number) => void
}

/**
 * Fixed operational HUD over the cinematic stage. Percent and rail fill are
 * driven imperatively per scroll tick; text chips re-render only when the
 * shipment stage actually changes.
 */
export const JourneyHud = forwardRef<JourneyHudHandle, { locale: Locale }>(function JourneyHud({ locale }, handle) {
  const [stageIndex, setStageIndex] = useState(0)
  const stageIndexRef = useRef(0)
  const percentRef = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLDivElement>(null)
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([])
  const zh = locale === "zh"

  useImperativeHandle(handle, () => ({
    update(progress: number) {
      if (percentRef.current) percentRef.current.textContent = `${Math.round(progress * 100)}%`
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`
      journeyWaypoints.forEach((waypoint, i) => {
        const dot = dotRefs.current[i]
        if (dot) dot.dataset.reached = progress >= waypoint.at - 0.005 ? "true" : "false"
      })
      const nextStage = stageIndexFor(progress)
      if (nextStage !== stageIndexRef.current) {
        stageIndexRef.current = nextStage
        setStageIndex(nextStage)
      }
    },
  }))

  const stage = journeyStages[stageIndex]
  const delivered = stage.key === "delivered"

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="journey-chip mt-[3.2rem] sm:mt-[3.6rem]">
          <span className="journey-chip-label">{zh ? "貨件編號" : "Shipment"}</span>
          <span className="font-mono text-[12px] font-semibold tracking-[.04em]">{journeyShipmentId}</span>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="journey-chip">
            <span className="flex items-center gap-1.5 text-[#2b6a8f]">
              <Plane className="h-3 w-3" />
              <Ship className="h-3 w-3" />
            </span>
            <span className="journey-chip-label">{zh ? "運輸模式" : "Mode"}</span>
            <span className="text-[12px] font-semibold">{zh ? stage.mode.zh : stage.mode.en}</span>
          </div>
          <div className="journey-chip">
            <Lock className="h-3 w-3 text-gold-dark" />
            <span className="text-[11.5px] font-semibold">{zh ? stage.bid.zh : stage.bid.en}</span>
          </div>
          <div className="journey-chip">
            <FileCheck2 className={`h-3 w-3 ${delivered ? "text-emerald" : "text-[#2b6a8f]"}`} />
            <span className="text-[11.5px] font-semibold">{zh ? stage.docs.zh : stage.docs.en}</span>
          </div>
        </div>
      </div>

      <div className="journey-hud-bottom">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/70">{zh ? "目前狀態" : "Current stage"}</p>
            <p className={`mt-1 text-[17px] font-semibold tracking-[-.2px] sm:text-[19px] ${delivered ? "text-[#7fe0b8]" : "text-white"}`}>
              {zh ? stage.label.zh : stage.label.en}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-white/70">{zh ? "路線進度" : "Route progress"}</p>
            <p className="mt-1 font-mono text-[17px] font-semibold text-white sm:text-[19px]">
              <span ref={percentRef}>0%</span>
              <span className="ml-3 text-[12px] font-medium text-white/75">ETA <span className="font-mono">{stage.eta}</span></span>
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div className="relative h-[3px] overflow-hidden rounded-full bg-white/25">
            <div ref={fillRef} className="journey-rail-fill" />
          </div>
          <div className="mt-2 flex justify-between">
            {journeyWaypoints.map((waypoint, i) => (
              <span key={waypoint.en} className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[.1em] text-white/80">
                <span ref={(el) => { dotRefs.current[i] = el }} className="journey-waypoint-dot" data-reached={i === 0 ? "true" : "false"} />
                <span className="hidden sm:inline">{zh ? waypoint.zh : waypoint.en}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
})
