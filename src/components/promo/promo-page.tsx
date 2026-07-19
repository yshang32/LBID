"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"

import type { Locale } from "@/lib/i18n"
import { PromoAuthPanel, type PromoAuthMode } from "./promo-auth-panel"
import { PromoCanvas, type PromoCanvasHandle } from "./promo-canvas"
import { PROMO_FRAME_COUNT, promoStageFrames } from "./promo-manifest"
import { PromoStory, type PromoAudience } from "./promo-story"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

/** Scroll fractions reserved to hold the first and last frame. */
const HOLD_IN = 0.06
const HOLD_OUT = 0.07
const TRACK_HEIGHT = "900vh"

const stageMeta = [
  { key: "origin", index: "01", label: "ORIGIN VERIFIED", mode: "ORIGIN", headline: "Every trusted journey starts with verified demand.", headlineZh: "\u6bcf\u4e00\u6bb5\u53ef\u4fe1\u4efb\u7684\u904b\u8f38\uff0c\u90fd\u59cb\u65bc\u5df2\u9a57\u8b49\u7684\u9700\u6c42\u3002", side: "left" },
  { key: "air", index: "02", label: "AIR FREIGHT", mode: "AIR", headline: "Global demand takes flight.", headlineZh: "\u8b93\u5168\u7403\u9700\u6c42\u6b63\u5f0f\u8d77\u98db\u3002", side: "right" },
  { key: "ocean", index: "03", label: "OCEAN FREIGHT", mode: "SEA", headline: "Across every major trade route.", headlineZh: "\u9023\u63a5\u6bcf\u4e00\u689d\u91cd\u8981\u8cbf\u6613\u822a\u7dda\u3002", side: "left" },
  { key: "road", index: "04", label: "ROAD FREIGHT", mode: "ROAD", headline: "Matched with the right local capability.", headlineZh: "\u914d\u5c0d\u771f\u6b63\u5408\u9069\u7684\u672c\u5730\u904b\u529b\u3002", side: "right" },
  { key: "warehouse", index: "05", label: "DELIVERED", mode: "WHS", headline: "From overseas demand to successful delivery.", headlineZh: "\u5f9e\u6d77\u5916\u9700\u6c42\uff0c\u76f4\u81f3\u5b89\u5168\u4ea4\u4ed8\u3002", side: "left" },
] as const

const promoCopy = {
  en: {
    how: "How it works",
    clients: "For clients",
    forwarders: "For forwarders",
    login: "Login",
    create: "Create account",
    hero: <>Move cargo through capability,<br className="hidden sm:block" /> not connections.</>,
    final: <>Fair prices. Real capability.<br className="hidden sm:block" /> No connections needed.</>,
    support: "Sealed bidding for fair logistics partnerships.",
    action: "Start with LBID",
    cue: "Scroll to move cargo",
  },
  zh: {
    how: "\u904b\u4f5c\u65b9\u5f0f",
    clients: "\u8ca8\u4e3b\u9700\u6c42",
    forwarders: "\u8ca8\u4ee3\u6a5f\u6703",
    login: "\u767b\u5165",
    create: "\u5efa\u7acb\u5e33\u6236",
    hero: <>{"\u8b93\u50f9\u683c\u56de\u5230\u516c\u5e73\uff0c"}<br className="hidden sm:block" />{"\u8b93\u5be6\u529b\u53d6\u4ee3\u95dc\u4fc2\u3002"}</>,
    final: <>{"\u516c\u5e73\u50f9\u683c\u3002\u771f\u5be6\u80fd\u529b\u3002"}<br className="hidden sm:block" />{"\u4e0d\u518d\u4f9d\u8cf4\u95dc\u4fc2\u3002"}</>,
    support: "\u4ee5\u5bc6\u5c01\u7af6\u50f9\uff0c\u5efa\u7acb\u516c\u5e73\u7684\u7269\u6d41\u5408\u4f5c\u3002",
    action: "\u958b\u59cb\u4f7f\u7528 LBID",
    cue: "\u6efe\u52d5\u9801\u9762\u63a8\u9032\u8ca8\u904b",
  },
} as const

/** Frame-domain fraction [0,1] → scroll-domain fraction [0,1]. */
function toScroll(frameFraction: number) {
  return HOLD_IN + frameFraction * (1 - HOLD_IN - HOLD_OUT)
}

/** Stage windows in the scroll domain, derived from the generated manifest. */
function stageWindows(): { start: number; end: number }[] {
  const last = PROMO_FRAME_COUNT - 1
  return promoStageFrames.map((s) => ({ start: toScroll(s.start / last), end: toScroll(s.end / last) }))
}

/** 0→1→0 opacity over [a,b] with symmetric fade ramps. */
function fadeWindow(p: number, a: number, b: number, ramp: number) {
  if (p <= a || p >= b) return 0
  const rise = Math.min(1, (p - a) / ramp)
  const fall = Math.min(1, (b - p) / ramp)
  return Math.min(rise, fall)
}

function formatEta(fp: number) {
  const total = Math.max(0, Math.round((1 - fp) * 42 * 60)) // minutes
  const h = Math.floor(total / 60)
  const m = total % 60
  return `T-${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function PromoPage({ locale = "en", initialAuthMode }: { locale?: Locale; initialAuthMode?: PromoAuthMode }) {
  const copy = promoCopy[locale]
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<PromoAuthMode>(initialAuthMode || "login")
  const [audience, setAudience] = useState<PromoAudience>("client")
  const canvasRef = useRef<PromoCanvasHandle>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const stageRefs = useRef<(HTMLDivElement | null)[]>([])
  const stageLabelRef = useRef<HTMLSpanElement>(null)
  const modeRef = useRef<HTMLSpanElement>(null)
  const etaRef = useRef<HTMLSpanElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const bufferRef = useRef<HTMLSpanElement>(null)
  const hudRef = useRef<HTMLDivElement>(null)
  const otherLocale: Locale = locale === "zh" ? "en" : "zh"
  const openAuth = useCallback((mode: PromoAuthMode) => {
    setAuthMode(mode)
    setAuthOpen(true)
  }, [])
  const closeAuth = useCallback(() => setAuthOpen(false), [])

  useEffect(() => {
    const query = new URLSearchParams(window.location.search)
    const requestedMode = query.get("auth") || initialAuthMode
    if (requestedMode === "login" || requestedMode === "register" || requestedMode === "reset" || requestedMode === "update") {
      openAuth(requestedMode)
    }
  }, [initialAuthMode, openAuth])

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const windows = stageWindows()

    const apply = (p: number) => {
      const fp = Math.min(1, Math.max(0, (p - HOLD_IN) / (1 - HOLD_IN - HOLD_OUT)))
      canvasRef.current?.setProgress(fp)

      if (heroRef.current) {
        const op = p < 0.045 ? 1 : Math.max(0, 1 - (p - 0.045) / 0.05)
        heroRef.current.style.opacity = op.toFixed(3)
        heroRef.current.style.transform = `translateY(${((1 - op) * -26).toFixed(1)}px)`
      }
      if (cueRef.current) {
        cueRef.current.style.opacity = (p < 0.03 ? 1 : Math.max(0, 1 - (p - 0.03) / 0.03)).toFixed(3)
      }

      stageMeta.forEach((_, i) => {
        const el = stageRefs.current[i]
        if (!el) return
        const w = windows[i]
        const len = w.end - w.start
        const op = fadeWindow(p, w.start + len * 0.14, w.end - len * 0.1, 0.035)
        el.style.opacity = op.toFixed(3)
        el.style.transform = `translateY(${((1 - op) * 30).toFixed(1)}px)`
      })

      if (ctaRef.current) {
        const op = p < 0.92 ? 0 : Math.min(1, (p - 0.92) / 0.05)
        ctaRef.current.style.opacity = op.toFixed(3)
        ctaRef.current.style.pointerEvents = op > 0.5 ? "auto" : "none"
        ctaRef.current.style.transform = `translateY(${((1 - op) * 34).toFixed(1)}px)`
      }

      // HUD telemetry
      let stageIndex = 0
      windows.forEach((w, i) => {
        if (p >= w.start) stageIndex = i
      })
      const meta = stageMeta[stageIndex]
      if (stageLabelRef.current && stageLabelRef.current.textContent !== `${meta.index} · ${meta.label}`) {
        stageLabelRef.current.textContent = `${meta.index} · ${meta.label}`
      }
      if (modeRef.current && modeRef.current.textContent !== meta.mode) modeRef.current.textContent = meta.mode
      if (etaRef.current) etaRef.current.textContent = formatEta(fp)
      if (railRef.current) railRef.current.style.width = `${(fp * 100).toFixed(2)}%`
      if (hudRef.current) {
        const op = p < 0.03 ? 0 : Math.min(1, (p - 0.03) / 0.04)
        hudRef.current.style.opacity = op.toFixed(3)
      }
    }

    const proxy = { p: 0 }
    const tween = gsap.to(proxy, {
      p: 1,
      ease: "none",
      duration: 1,
      onUpdate: () => apply(proxy.p),
      scrollTrigger: {
        trigger: track,
        start: "top top",
        end: "bottom bottom",
        scrub: 1.05,
      },
    })

    const warmOnce = () => canvasRef.current?.warm()
    window.addEventListener("wheel", warmOnce, { once: true, passive: true })
    window.addEventListener("touchstart", warmOnce, { once: true, passive: true })
    window.addEventListener("keydown", warmOnce, { once: true })

    apply(0)
    requestAnimationFrame(() => ScrollTrigger.refresh())

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
      window.removeEventListener("wheel", warmOnce)
      window.removeEventListener("touchstart", warmOnce)
      window.removeEventListener("keydown", warmOnce)
    }
  }, [])

  function scrollToStory(id: string, nextAudience?: PromoAudience) {
    if (nextAudience) setAudience(nextAudience)
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
    })
  }

  return (
    <div className="relative bg-[#050a1a] text-white selection:bg-lgold/40">
      {/* Cinematic stage */}
      <div className="fixed inset-0">
        <PromoCanvas
          ref={canvasRef}
          className="block h-full w-full"
          onLoaded={(f) => {
            if (bufferRef.current) {
              bufferRef.current.textContent = f >= 1 ? "" : `BUFFER ${(f * 100).toFixed(0)}%`
            }
          }}
        />
      </div>

      {/* Header — logo top-left, Login top-right, always visible */}
      <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 border-b border-[#dfe3ea]/80 bg-white/90 px-5 py-4 shadow-[0_1px_0_rgba(15,23,42,0.04)] backdrop-blur-xl sm:px-9 sm:py-5">
        <Link href={`/${locale}`} aria-label="LBID home" className="pointer-events-auto flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/lbid-web-logo-clean.png"
            alt="LBID — Logistics Bidding Platform"
            className="h-8 w-auto sm:h-9"
          />
        </Link>
        <nav aria-label="Homepage sections" className="pointer-events-auto hidden items-center gap-7 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#52617a] lg:flex">
          <button type="button" onClick={() => scrollToStory("how-lbid")} className="transition hover:text-[#10254d]">{copy.how}</button>
          <button type="button" onClick={() => scrollToStory("for-both", "client")} className="transition hover:text-[#10254d]">{copy.clients}</button>
          <button type="button" onClick={() => scrollToStory("for-both", "forwarder")} className="transition hover:text-[#10254d]">{copy.forwarders}</button>
        </nav>
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
          <Link href={`/${otherLocale}`} className="hidden px-2 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#52617a] transition hover:text-[#10254d] sm:inline-flex">{locale === "zh" ? "EN" : "中文"}</Link>
          <button type="button" data-testid="promo-login" onClick={() => openAuth("login")} className="h-10 rounded-[4px] border border-[#b8c1cf] bg-white/70 px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#10254d] transition hover:-translate-y-px hover:border-[#10254d] hover:bg-white sm:px-5">{copy.login}</button>
          <button type="button" onClick={() => openAuth("register")} className="hidden h-10 rounded-[4px] bg-lgold px-5 text-[11px] font-bold uppercase tracking-[0.14em] text-[#08152f] shadow-[0_8px_28px_rgba(196,154,60,0.25)] transition hover:-translate-y-px hover:bg-[#d5b45c] sm:inline-flex sm:items-center">{copy.create}</button>
        </div>
      </header>

      {/* Copy overlays */}
      <div className="pointer-events-none fixed inset-0 z-30">
        {/* Hero */}
        <div ref={heroRef} className="absolute inset-x-0 top-[16%] mx-auto max-w-4xl px-6 text-center sm:top-[18%]">
          <p className="mb-5 text-[11px] uppercase tracking-[0.42em] text-lgold/90">
            LBID · Logistics Bidding Platform
          </p>
          <h1 className="text-4xl font-extralight leading-[1.08] tracking-tight sm:text-6xl md:text-7xl">{copy.hero}</h1>
        </div>

        {/* Stage copy — pinned during each transport stage */}
        {stageMeta.map((s, i) => (
          <div
            key={s.key}
            ref={(el) => {
              stageRefs.current[i] = el
            }}
            className={`absolute bottom-[20%] max-w-xl px-6 opacity-0 sm:bottom-[24%] ${
              s.side === "left" ? "left-0 sm:left-[7%] text-left" : "right-0 sm:right-[7%] text-right"
            }`}
          >
            <p className="mb-3 text-[11px] uppercase tracking-[0.42em] text-lgold/90">
              {s.index} · {s.label}
            </p>
            <h2 className="text-3xl font-extralight leading-tight tracking-tight sm:text-5xl">{locale === "zh" ? s.headlineZh : s.headline}</h2>
          </div>
        ))}

        {/* Final CTA */}
        <div
          ref={ctaRef}
          className="absolute inset-x-0 top-1/2 mx-auto max-w-3xl -translate-y-1/2 px-6 text-center opacity-0"
        >
          <h2 className="text-3xl font-extralight leading-[1.15] tracking-tight sm:text-5xl md:text-6xl">{copy.final}</h2>
          <p className="mt-5 text-sm uppercase tracking-[0.32em] text-white/70 sm:text-base">
            {copy.support}
          </p>
          <div className="mt-9">
            <button type="button" onClick={() => openAuth("register")} className="pointer-events-auto inline-block rounded-[4px] bg-lgold px-10 py-4 text-[13px] font-semibold uppercase tracking-[0.24em] text-lblue shadow-[0_0_44px_rgba(196,154,60,0.38)] transition hover:-translate-y-0.5 hover:bg-[#d5b45c]">
              {copy.action}
            </button>
          </div>
        </div>

        {/* Scroll cue */}
        <div ref={cueRef} className="absolute inset-x-0 bottom-9 flex flex-col items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.42em] text-white/70">{copy.cue}</span>
          <span className="h-9 w-px animate-pulse bg-gradient-to-b from-lgold to-transparent" />
        </div>

        {/* Logistics HUD */}
        <div
          ref={hudRef}
          className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 px-5 pb-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/75 opacity-0 sm:px-9 sm:pb-6"
        >
          <div className="flex min-w-0 flex-col gap-2">
            <span ref={stageLabelRef} className="whitespace-nowrap text-lgold">
              01 · ORIGIN VERIFIED
            </span>
            <span ref={bufferRef} className="text-white/40" />
          </div>
          <div className="hidden flex-1 items-center pb-1 sm:flex">
            <div className="relative h-px w-full bg-white/20">
              <div ref={railRef} className="absolute left-0 top-0 h-px bg-lgold shadow-[0_0_12px_rgba(196,154,60,0.9)]" style={{ width: "0%" }} />
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className="absolute top-1/2 h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50" style={{ left: `${(i / 4) * 100}%` }} />
              ))}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span>
              MODE <span ref={modeRef} className="text-lgold">ORIGIN</span>
            </span>
            <span>
              ETA <span ref={etaRef}>T-42:00</span>
            </span>
          </div>
        </div>
      </div>

      {/* Scroll track — scrolling down IS moving the cargo through the network */}
      <div ref={trackRef} style={{ height: TRACK_HEIGHT }} aria-hidden="true" />

      <PromoStory
        locale={locale}
        audience={audience}
        onAudienceChange={setAudience}
        onOpenAuth={openAuth}
      />

      {/* Real content for crawlers / no-JS */}
      <noscript>
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <h1>Move cargo through capability, not connections.</h1>
          <p>Fair prices. Real capability. No connections needed. Sealed bidding for fair logistics partnerships.</p>
          <a href={`/${locale}/auth?mode=register`}>Start with LBID</a>
        </div>
      </noscript>

      <PromoAuthPanel
        locale={locale}
        open={authOpen}
        initialMode={authMode}
        onClose={closeAuth}
        onAuthenticated={() => canvasRef.current?.setProgress(1)}
      />
    </div>
  )
}
