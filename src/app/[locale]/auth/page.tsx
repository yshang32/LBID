"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  MailCheck,
  Play,
  RotateCcw,
  SkipForward,
} from "lucide-react"

import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { JourneyCanvas, type JourneyCanvasHandle } from "@/components/auth/journey/journey-canvas"
import { JourneyHud, type JourneyHudHandle } from "@/components/auth/journey/journey-hud"
import { journeyPoster, journeyShipmentId } from "@/components/auth/journey/journey-data"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

type Mode = "login" | "register" | "reset" | "update"
type JourneyMode = "full" | "ambient" | "static"

const SEEN_KEY = "lbid.journey.seen.v1"
const PROGRESS_KEY = "lbid.journey.progress.v1"
const REMEMBER_KEY = "lbid.auth.remember-email"

const copy = {
  en: {
    welcome: "Welcome to LBID",
    support: "Manage demand, sealed bids and delivery from one logistics workspace.",
    positioning: "Fair prices. Real capability. No connections needed.",
    positioningSub: "Sealed bidding for fair logistics partnerships.",
    signIn: "Sign in",
    createAccount: "Create account",
    email: "Work email",
    password: "Password",
    confirmPassword: "Confirm password",
    company: "Company name",
    country: "Country or region",
    remember: "Remember me",
    forgot: "Forgot password?",
    signInAction: "Sign in",
    createAction: "Create account",
    terms: "I accept the LBID Terms of Service and Privacy Policy.",
    dualNote: "One company account can create shipment requests, submit bids, or both. Capabilities are set during onboarding.",
    reset: "Reset password",
    resetBody: "Enter your work email and we will send a secure reset link.",
    sendReset: "Send reset link",
    update: "Set new password",
    updateBody: "Choose a new password, then sign in again.",
    updateAction: "Update password",
    back: "Back to sign in",
    working: "Working…",
    needFields: "Please complete the required fields. Password must be at least 8 characters.",
    mismatch: "Passwords do not match.",
    needTerms: "Please accept the terms to continue.",
    invalidCredentials: "Email or password is incorrect.",
    networkError: "Network error. Check your connection and try again.",
    resetSent: "If the account exists, a reset link has been sent.",
    updated: "Password updated. Please sign in again.",
    confirmTitle: "Confirm your email",
    confirmBody: "We sent a verification link to",
    confirmHint: "Open it to activate your company account, then sign in.",
    backToSignIn: "Back to sign in",
    connected: "You’re connected.",
    connectedSub: "Delivered · entering your workspace",
    skip: "Skip journey",
    replay: "Replay journey",
    scrollHint: "Scroll to follow the shipment",
    expand: "Experience the shipment journey",
    collapse: "Hide journey",
    secure: "Authentication is handled by Supabase Auth. LBID never stores plaintext passwords.",
    language: "繁體中文",
  },
  zh: {
    welcome: "歡迎回到 LBID",
    support: "在同一個工作台管理需求、密封競價及物流交付。",
    positioning: "讓價格回到公平，讓實力取代關係。",
    positioningSub: "以密封競價建立公平的物流合作。",
    signIn: "登入",
    createAccount: "建立帳戶",
    email: "工作電郵",
    password: "密碼",
    confirmPassword: "確認密碼",
    company: "公司名稱",
    country: "國家或地區",
    remember: "記住我",
    forgot: "忘記密碼？",
    signInAction: "登入",
    createAction: "建立帳戶",
    terms: "我接受 LBID 服務條款及私隱政策。",
    dualNote: "同一公司帳戶可建立貨運需求、提交報價，或同時啟用兩者。能力設定於登入後的引導流程完成。",
    reset: "重設密碼",
    resetBody: "輸入工作電郵，我們會傳送安全重設連結。",
    sendReset: "傳送重設連結",
    update: "設定新密碼",
    updateBody: "設定新密碼後請重新登入。",
    updateAction: "更新密碼",
    back: "返回登入",
    working: "處理中…",
    needFields: "請完成必填欄位，密碼至少 8 個字元。",
    mismatch: "兩次輸入的密碼不一致。",
    needTerms: "請先接受條款再繼續。",
    invalidCredentials: "電郵或密碼不正確。",
    networkError: "網絡錯誤，請檢查連線後再試。",
    resetSent: "如帳戶存在，重設連結已發送。",
    updated: "密碼已更新，請重新登入。",
    confirmTitle: "請確認你的電郵",
    confirmBody: "驗證連結已發送至",
    confirmHint: "開啟連結啟用公司帳戶後即可登入。",
    backToSignIn: "返回登入",
    connected: "你已連接 LBID 物流網絡。",
    connectedSub: "已送達・正在進入工作台",
    skip: "跳過旅程",
    replay: "重播旅程",
    scrollHint: "捲動跟隨貨件",
    expand: "體驗貨運旅程",
    collapse: "收起旅程",
    secure: "身份驗證由 Supabase Auth 處理，LBID 絕不儲存明文密碼。",
    language: "English",
  },
}

const countries = [
  "Hong Kong",
  "Mainland China",
  "Taiwan",
  "Vietnam",
  "Thailand",
  "Indonesia",
  "Malaysia",
  "Philippines",
  "Singapore",
  "Cambodia",
  "Other",
]

export default function AuthPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const router = useRouter()

  const [mode, setMode] = useState<Mode>("login")
  const [view, setView] = useState<"form" | "confirmEmail">("form")
  const [company, setCompany] = useState("")
  const [country, setCountry] = useState("Hong Kong")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [remember, setRemember] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  const [journeyMode, setJourneyMode] = useState<JourneyMode>("full")
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [mounted, setMounted] = useState(false)

  const trackRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const veilRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<JourneyCanvasHandle>(null)
  const hudRef = useRef<JourneyHudHandle>(null)
  const progressProxy = useRef({ p: 0 })
  const departingRef = useRef(false)

  const applyProgress = useCallback((p: number) => {
    progressProxy.current.p = p
    canvasRef.current?.setProgress(p)
    hudRef.current?.update(p)
    if (hintRef.current) hintRef.current.style.opacity = p < 0.04 ? "1" : "0"
  }, [])

  const markSeen = useCallback(() => {
    try {
      localStorage.setItem(SEEN_KEY, "1")
    } catch {}
  }, [])

  // Restore querystring modes + remembered email + returning-user journey mode.
  useEffect(() => {
    const query = window.location.search
    if (query.includes("mode=register")) setMode("register")
    if (query.includes("mode=update") || query.includes("type=recovery")) setMode("update")

    try {
      const saved = localStorage.getItem(REMEMBER_KEY)
      if (saved) {
        setEmail(saved)
        setRemember(true)
      }
    } catch {}

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let seen = false
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1"
    } catch {}
    setJourneyMode(reduced ? "static" : seen ? "ambient" : "full")
    setMounted(true)
  }, [])

  // Persist cinematic progress so returning visitors resume where they left off.
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(PROGRESS_KEY, String(progressProxy.current.p))
      } catch {}
    }
    window.addEventListener("pagehide", save)
    document.addEventListener("visibilitychange", save)
    return () => {
      window.removeEventListener("pagehide", save)
      document.removeEventListener("visibilitychange", save)
    }
  }, [])

  // Scroll-scrubbed journey (desktop always; mobile once expanded).
  useEffect(() => {
    if (!mounted || journeyMode !== "full") return
    const track = trackRef.current
    if (!track) return

    const isDesktop = window.matchMedia("(min-width: 1024px)").matches
    if (!isDesktop && !mobileExpanded) return

    canvasRef.current?.warm()
    const trigger = ScrollTrigger.create({
      trigger: track,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.9,
      onUpdate(self) {
        applyProgress(self.progress)
        if (self.progress > 0.985) markSeen()
      },
    })
    applyProgress(trigger.progress)
    return () => trigger.kill()
  }, [mounted, journeyMode, mobileExpanded, applyProgress, markSeen])

  // Ambient mode: short drift to the delivered frame instead of a full replay.
  useEffect(() => {
    if (!mounted || journeyMode !== "ambient") return
    let from = 0.78
    try {
      const saved = parseFloat(localStorage.getItem(PROGRESS_KEY) || "")
      if (!Number.isNaN(saved)) from = Math.max(0.72, Math.min(saved, 0.95))
    } catch {}
    applyProgress(from)
    const tween = gsap.to(progressProxy.current, {
      p: 1,
      duration: 1.7,
      ease: "power2.out",
      delay: 0.35,
      onUpdate: () => applyProgress(progressProxy.current.p),
    })
    return () => {
      tween.kill()
    }
  }, [mounted, journeyMode, applyProgress])

  function skipJourney() {
    markSeen()
    gsap.to(progressProxy.current, {
      p: 1,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => applyProgress(progressProxy.current.p),
    })
    window.scrollTo({ top: 0, behavior: "auto" })
    setJourneyMode("ambient")
  }

  function replayJourney() {
    window.scrollTo({ top: 0, behavior: "auto" })
    applyProgress(0)
    setJourneyMode("full")
    setMobileExpanded(true)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }

  function resetMessages() {
    setError("")
    setNotice("")
  }

  function switchMode(next: Mode) {
    resetMessages()
    setPassword("")
    setConfirm("")
    setView("form")
    setMode(next)
  }

  async function workspaceHref() {
    try {
      const { response, body } = await apiJson("/api/company-profile")
      if (!response.ok) return `/${locale}/dashboard`
      return body.role === "admin" ? `/${locale}/dashboard?mode=admin` : `/${locale}/dashboard`
    } catch {
      return `/${locale}/dashboard`
    }
  }

  function authRedirectUrl(next = `/${locale}/auth`) {
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
    const browserOrigin = window.location.origin
    const origin = configuredOrigin || browserOrigin
    return `${origin}${next.startsWith("/") ? next : `/${next}`}`
  }

  function departToWorkspace(href: string) {
    if (departingRef.current) return
    departingRef.current = true
    markSeen()
    if (veilRef.current) veilRef.current.style.pointerEvents = "auto"

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reduced || journeyMode === "static") {
      if (veilRef.current) gsap.set(veilRef.current, { autoAlpha: 1 })
      window.setTimeout(() => router.push(href), 650)
      return
    }

    const tl = gsap.timeline()
    tl.to(progressProxy.current, {
      p: 1,
      duration: 1.25,
      ease: "power2.inOut",
      onUpdate: () => applyProgress(progressProxy.current.p),
    })
    if (stageRef.current) {
      tl.fromTo(stageRef.current, { scale: 1 }, { scale: 1.012, duration: 1.1, ease: "power2.inOut" }, 0)
    }
    if (veilRef.current) {
      tl.to(veilRef.current, { autoAlpha: 1, duration: 0.5, ease: "power2.out" }, "-=0.55")
    }
    tl.call(() => router.push(href), [], "+=0.7")
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetMessages()

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Supabase is not configured for this environment.")
      return
    }

    if (mode === "register") {
      if (!company.trim() || !email || password.length < 8) {
        setError(t.needFields)
        return
      }
      if (password !== confirm) {
        setError(t.mismatch)
        return
      }
      if (!acceptTerms) {
        setError(t.needTerms)
        return
      }
    }
    if (mode === "login" && (!email || !password)) {
      setError(t.needFields)
      return
    }
    if (mode === "reset" && !email) {
      setError(t.needFields)
      return
    }
    if (mode === "update" && password.length < 8) {
      setError(t.needFields)
      return
    }

    setLoading(true)

    try {
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: authRedirectUrl(`/${locale}/auth?mode=update`),
        })
        setLoading(false)
        if (resetError) setError(resetError.message)
        else setNotice(t.resetSent)
        return
      }

      if (mode === "update") {
        const { error: updateError } = await supabase.auth.updateUser({ password })
        setLoading(false)
        if (updateError) setError(updateError.message)
        else {
          setNotice(t.updated)
          setMode("login")
        }
        return
      }

      if (mode === "login") {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) {
          setLoading(false)
          setError(/invalid/i.test(loginError.message) ? t.invalidCredentials : loginError.message)
          return
        }
        try {
          if (remember) localStorage.setItem(REMEMBER_KEY, email)
          else localStorage.removeItem(REMEMBER_KEY)
        } catch {}
        const href = await workspaceHref()
        setLoading(false)
        departToWorkspace(href)
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: authRedirectUrl(`/${locale}/auth`),
          data: { company_name: company, country },
        },
      })
      if (signUpError) {
        setLoading(false)
        setError(signUpError.message)
        return
      }
      if (!data.session) {
        setLoading(false)
        setView("confirmEmail")
        return
      }

      const bootstrap = await apiJson("/api/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({ companyName: company, country }),
      })
      setLoading(false)
      if (!bootstrap.response.ok) {
        setError(bootstrap.body.error || "Account bootstrap failed.")
        return
      }
      departToWorkspace(`/${locale}/onboarding`)
    } catch {
      setLoading(false)
      setError(t.networkError)
    }
  }

  const showJourneyMotion = journeyMode !== "static"
  const fullJourney = journeyMode === "full"
  const passwordField = mode === "login" || mode === "register" || mode === "update"

  return (
    <main className="relative min-h-screen bg-[#f7f8fa] text-ink">
      <div className="mx-auto grid w-full max-w-[1720px] gap-5 px-4 pb-10 pt-4 sm:px-6 lg:grid-cols-[minmax(0,1.62fr)_minmax(392px,1fr)] lg:gap-6">
        {/* ——— Cinematic journey column ——— */}
        <section className="order-2 min-w-0 lg:order-1">
          <div className="mb-3 flex items-center justify-between lg:hidden">
            <button
              type="button"
              onClick={() => {
                setMobileExpanded((value) => !value)
                requestAnimationFrame(() => ScrollTrigger.refresh())
              }}
              className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-[12.5px] font-semibold text-navy shadow-sm transition hover:border-[#b7c8e4]"
            >
              {mobileExpanded ? <ChevronDown className="h-4 w-4 rotate-180 transition" /> : <Play className="h-4 w-4" />}
              {mobileExpanded ? t.collapse : t.expand}
            </button>
            <span className="font-mono text-[11px] font-semibold text-ink-3">{journeyShipmentId}</span>
          </div>

          <div
            ref={trackRef}
            className={
              fullJourney
                ? `relative ${mobileExpanded ? "h-[320vh]" : "h-auto"} lg:h-[460vh]`
                : "relative h-auto"
            }
          >
            <div
              className={
                fullJourney
                  ? `${mobileExpanded ? "sticky top-[4vh] h-[66vh]" : "relative h-[52vw] max-h-[420px]"} lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:max-h-none`
                  : "relative h-[52vw] max-h-[420px] lg:h-[calc(100vh-2rem)] lg:max-h-none"
              }
            >
              <div ref={stageRef} className="journey-stage h-full w-full">
                {mounted && showJourneyMotion ? (
                  <JourneyCanvas ref={canvasRef} className="journey-canvas" />
                ) : (
                  <img
                    src={journeyPoster}
                    alt="LBID shipment journey — sealed cargo leaving a Southeast Asian facility at dawn"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                )}

                {/* Logo chip over the stage */}
                <div className="pointer-events-none absolute left-4 top-4 z-10 sm:left-6 sm:top-6">
                  <div className="rounded-md border border-white/40 bg-white/88 px-3 py-2 shadow-[0_8px_24px_rgba(8,21,47,.2)] backdrop-blur">
                    <img src="/assets/lbid-web-logo-clean.png" alt="LBID" className="h-6 w-auto mix-blend-multiply sm:h-7" draggable={false} />
                  </div>
                </div>

                {/* Journey controls */}
                <div className="absolute left-4 top-[7.1rem] z-10 sm:left-6 sm:top-[7.9rem]">
                  {mounted && showJourneyMotion && (
                    fullJourney ? (
                      <button type="button" onClick={skipJourney} className="journey-skip">
                        <SkipForward className="h-3.5 w-3.5" /> {t.skip}
                      </button>
                    ) : (
                      <button type="button" onClick={replayJourney} className="journey-skip">
                        <RotateCcw className="h-3.5 w-3.5" /> {t.replay}
                      </button>
                    )
                  )}
                </div>

                {mounted && showJourneyMotion && <JourneyHud ref={hudRef} locale={locale} />}

                {mounted && fullJourney && (
                  <div ref={hintRef} className={`journey-scroll-hint transition-opacity duration-500 ${mobileExpanded ? "" : "!hidden lg:!flex"}`}>
                    {t.scrollHint}
                  </div>
                )}
              </div>

              {/* Positioning statement below stage on desktop start */}
            </div>
          </div>

          <div className="mt-4 hidden items-baseline justify-between gap-6 lg:flex">
            <p className="text-[15px] font-semibold tracking-[-.2px] text-ink">
              {t.positioning}
              <span className="ml-3 text-[13px] font-normal text-ink-3">{t.positioningSub}</span>
            </p>
            <p className="font-mono text-[11.5px] text-ink-3">{journeyShipmentId} · SEA → HKG</p>
          </div>
        </section>

        {/* ——— Authentication column ——— */}
        <section className="order-1 min-w-0 lg:order-2">
          <div className="lg:sticky lg:top-4">
            <div className="relative">
              <div className="journey-auth-card relative overflow-hidden">
                <div className="h-[3px] bg-[linear-gradient(90deg,#10254d_0%,#1e3a7a_55%,#c9a84c_100%)]" />

                <div className="px-6 pb-6 pt-6 sm:px-7">
                  <img src="/assets/lbid-web-logo-clean.png" alt="LBID" className="h-8 w-auto mix-blend-multiply" draggable={false} />
                  <h1 className="mt-4 text-[24px] font-bold tracking-[-.4px] text-[#10254d]">{t.welcome}</h1>
                  <p className="mt-1.5 text-[13px] leading-6 text-ink-2">{t.support}</p>
                </div>

                {view === "confirmEmail" ? (
                  <div className="flex flex-col items-center gap-3 px-7 pb-9 pt-2 text-center">
                    <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-soft text-emerald">
                      <MailCheck className="h-7 w-7" />
                    </span>
                    <h2 className="text-[17px] font-bold text-ink">{t.confirmTitle}</h2>
                    <p className="text-[13px] leading-6 text-ink-2">
                      {t.confirmBody} <span className="font-semibold text-ink">{email}</span>
                    </p>
                    <p className="text-[12.5px] leading-5 text-ink-3">{t.confirmHint}</p>
                    <button type="button" onClick={() => switchMode("login")} className="mt-2 text-[13px] font-semibold text-navy underline-offset-2 hover:underline">
                      {t.backToSignIn}
                    </button>
                  </div>
                ) : (
                  <>
                    {(mode === "login" || mode === "register") && (
                      <div className="flex border-b border-t border-line">
                        <Tab active={mode === "login"} onClick={() => switchMode("login")}>{t.signIn}</Tab>
                        <Tab active={mode === "register"} onClick={() => switchMode("register")}>{t.createAccount}</Tab>
                      </div>
                    )}

                    <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-6 sm:px-7">
                      {(mode === "reset" || mode === "update") && (
                        <div>
                          <h2 className="text-[16px] font-bold text-ink">{mode === "reset" ? t.reset : t.update}</h2>
                          <p className="mt-1 text-[13px] leading-6 text-ink-3">{mode === "reset" ? t.resetBody : t.updateBody}</p>
                        </div>
                      )}

                      {mode !== "update" && (
                        <Field label={t.email}>
                          <input
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="you@company.com"
                            type="email"
                            autoComplete="email"
                            className="journey-input"
                            required
                          />
                        </Field>
                      )}

                      {passwordField && (
                        <Field label={t.password}>
                          <div className="relative">
                            <input
                              value={password}
                              onChange={(event) => setPassword(event.target.value)}
                              placeholder={mode === "register" ? "••••••••  (8+)" : "••••••••"}
                              type={showPassword ? "text" : "password"}
                              autoComplete={mode === "login" ? "current-password" : "new-password"}
                              className="journey-input pr-10"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((value) => !value)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 transition hover:text-ink"
                              aria-label="Toggle password visibility"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </Field>
                      )}

                      {mode === "register" && (
                        <>
                          <Field label={t.confirmPassword}>
                            <input
                              value={confirm}
                              onChange={(event) => setConfirm(event.target.value)}
                              type="password"
                              autoComplete="new-password"
                              className="journey-input"
                              required
                            />
                          </Field>
                          <Field label={t.company}>
                            <input
                              value={company}
                              onChange={(event) => setCompany(event.target.value)}
                              placeholder="Pacific Forward Ltd."
                              className="journey-input"
                              required
                            />
                          </Field>
                          <Field label={t.country}>
                            <select value={country} onChange={(event) => setCountry(event.target.value)} className="journey-input">
                              {countries.map((item) => (
                                <option key={item} value={item}>{item}</option>
                              ))}
                            </select>
                          </Field>
                          <label className="flex items-start gap-2.5 text-[12.5px] leading-5 text-ink-2">
                            <input
                              type="checkbox"
                              checked={acceptTerms}
                              onChange={(event) => setAcceptTerms(event.target.checked)}
                              className="mt-0.5 h-4 w-4 rounded border-[#cdd6e4] accent-[#10254d]"
                            />
                            {t.terms}
                          </label>
                          <p className="rounded-md border border-line bg-canvas px-3 py-2.5 text-[12px] leading-5 text-ink-3">{t.dualNote}</p>
                        </>
                      )}

                      {mode === "login" && (
                        <div className="-mt-1 flex items-center justify-between">
                          <label className="flex items-center gap-2 text-[12.5px] text-ink-2">
                            <input
                              type="checkbox"
                              checked={remember}
                              onChange={(event) => setRemember(event.target.checked)}
                              className="h-4 w-4 rounded border-[#cdd6e4] accent-[#10254d]"
                            />
                            {t.remember}
                          </label>
                          <button type="button" onClick={() => switchMode("reset")} className="text-[12.5px] font-medium text-navy underline-offset-2 transition hover:underline">
                            {t.forgot}
                          </button>
                        </div>
                      )}

                      <button disabled={loading} type="submit" className="journey-primary-button group mt-1">
                        {loading
                          ? t.working
                          : mode === "login"
                            ? t.signInAction
                            : mode === "register"
                              ? t.createAction
                              : mode === "reset"
                                ? t.sendReset
                                : t.updateAction}
                        {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
                      </button>

                      {(mode === "reset" || mode === "update") && (
                        <button type="button" onClick={() => switchMode("login")} className="text-center text-[12.5px] font-medium text-ink-3 transition hover:text-ink">
                          {t.back}
                        </button>
                      )}

                      {error ? <Feedback error>{error}</Feedback> : null}
                      {notice ? <Feedback>{notice}</Feedback> : null}
                    </form>
                  </>
                )}

                {/* Success veil — refined completion moment */}
                <div ref={veilRef} className="journey-success-veil">
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-soft text-emerald">
                    <CheckCircle2 className="h-9 w-9" />
                  </span>
                  <p className="text-[19px] font-bold tracking-[-.3px] text-[#10254d]">{t.connected}</p>
                  <p className="font-mono text-[12px] font-semibold text-emerald">
                    {journeyShipmentId} · {t.connectedSub}
                  </p>
                  <span className="mt-1 h-[2px] w-24 overflow-hidden rounded-full bg-line">
                    <span className="block h-full w-full origin-left animate-[journey-line_1.2s_ease-out_forwards] bg-gold" />
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-start justify-center gap-2 text-center text-[11.5px] leading-5 text-ink-3">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
                {t.secure}
              </div>
              <Link href={`/${locale === "zh" ? "en" : "zh"}/auth`} className="mt-3 block text-center text-[12px] font-medium text-navy hover:underline">
                {t.language}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

function Tab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 border-b-2 py-3.5 text-[13.5px] font-semibold transition ${active ? "-mb-px border-[#10254d] text-[#10254d]" : "border-transparent text-ink-3 hover:text-ink"}`}
    >
      {children}
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold tracking-[.02em] text-ink-2">
      {label}
      {children}
    </label>
  )
}

function Feedback({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return (
    <p className={`flex items-start gap-2 rounded-md border p-3 text-[12px] leading-5 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`} role="alert">
      {error ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
      {children}
    </p>
  )
}
