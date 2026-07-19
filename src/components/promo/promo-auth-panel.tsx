"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff, X } from "lucide-react"

import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export type PromoAuthMode = "login" | "register" | "reset" | "update"
type AuthMode = PromoAuthMode | "confirm"

type PromoAuthPanelProps = {
  locale: Locale
  open: boolean
  initialMode: PromoAuthMode
  onClose: () => void
  onAuthenticated?: () => void
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

const zh = {
  close: "\u95dc\u9589",
  closeAuth: "\u95dc\u9589\u767b\u5165\u8996\u7a97",
  loginEyebrow: "\u9032\u5165 LBID \u5de5\u4f5c\u5340",
  registerEyebrow: "\u5efa\u7acb\u516c\u53f8\u5e33\u6236",
  resetEyebrow: "\u5e33\u6236\u5b89\u5168",
  updateEyebrow: "\u5e33\u6236\u5b89\u5168",
  loginTitle: "\u6b61\u8fce\u56de\u4f86\u3002",
  registerTitle: "\u958b\u59cb\u516c\u5e73\u914d\u5c0d\u3002",
  resetTitle: "\u91cd\u8a2d\u5bc6\u78bc",
  updateTitle: "\u8a2d\u5b9a\u65b0\u5bc6\u78bc",
  supporting: "\u4e00\u500b\u516c\u53f8\u5e33\u6236\u53ef\u540c\u6642\u767c\u51fa\u9700\u6c42\u3001\u63d0\u4ea4\u5bc6\u5c01\u5831\u50f9\uff0c\u6216\u555f\u7528\u5169\u7a2e\u80fd\u529b\u3002",
  resetSupporting: "\u8f38\u5165\u5de5\u4f5c\u96fb\u90f5\uff0c\u6211\u5011\u6703\u767c\u9001\u5b89\u5168\u7684\u91cd\u8a2d\u9023\u7d50\u3002",
  updateSupporting: "\u8f38\u5165\u65b0\u5bc6\u78bc\u5b8c\u6210\u5e33\u6236\u5b89\u5168\u66f4\u65b0\u3002",
  loginTab: "\u767b\u5165",
  registerTab: "\u5efa\u7acb\u5e33\u6236",
  company: "\u516c\u53f8\u540d\u7a31",
  email: "\u5de5\u4f5c\u96fb\u90f5",
  region: "\u570b\u5bb6\u6216\u5730\u5340",
  password: "\u5bc6\u78bc",
  confirmPassword: "\u78ba\u8a8d\u5bc6\u78bc",
  remember: "\u8a18\u4f4f\u6211",
  forgot: "\u5fd8\u8a18\u5bc6\u78bc\uff1f",
  terms: "\u6211\u540c\u610f LBID \u670d\u52d9\u689d\u6b3e\u53ca\u79c1\u96b1\u653f\u7b56\u3002",
  loginAction: "\u9032\u5165\u5de5\u4f5c\u5340",
  registerAction: "\u5efa\u7acb\u516c\u53f8\u5e33\u6236",
  resetAction: "\u767c\u9001\u91cd\u8a2d\u9023\u7d50",
  updateAction: "\u66f4\u65b0\u5bc6\u78bc",
  working: "\u8655\u7406\u4e2d...",
  back: "\u8fd4\u56de\u767b\u5165",
  confirmTitle: "\u78ba\u8a8d\u4f60\u7684\u5de5\u4f5c\u96fb\u90f5",
  confirmBody: "\u9a57\u8b49\u9023\u7d50\u5df2\u767c\u9001\u81f3",
  required: "\u8acb\u8f38\u5165\u5de5\u4f5c\u96fb\u90f5\u53ca\u5bc6\u78bc\u3002",
  registerRequired: "\u8acb\u5b8c\u6210\u516c\u53f8\u8cc7\u6599\uff1b\u5bc6\u78bc\u81f3\u5c11\u9700\u8981 8 \u500b\u5b57\u5143\u3002",
  passwordRequired: "\u5bc6\u78bc\u81f3\u5c11\u9700\u8981 8 \u500b\u5b57\u5143\u3002",
  mismatch: "\u5169\u6b21\u8f38\u5165\u7684\u5bc6\u78bc\u4e0d\u4e00\u81f4\u3002",
  acceptRequired: "\u8acb\u5148\u540c\u610f\u670d\u52d9\u689d\u6b3e\u53ca\u79c1\u96b1\u653f\u7b56\u3002",
  incorrect: "\u96fb\u90f5\u6216\u5bc6\u78bc\u4e0d\u6b63\u78ba\u3002",
  resetSent: "\u5982\u679c\u5e33\u6236\u5b58\u5728\uff0c\u91cd\u8a2d\u9023\u7d50\u5df2\u767c\u9001\u3002",
  updated: "\u5bc6\u78bc\u5df2\u66f4\u65b0\uff0c\u8acb\u4f7f\u7528\u65b0\u5bc6\u78bc\u767b\u5165\u3002",
  connected: "\u5df2\u9023\u63a5 LBID\uff0c\u6b63\u5728\u9032\u5165\u4f60\u7684\u5de5\u4f5c\u5340\u3002",
  show: "\u986f\u793a\u5bc6\u78bc",
  hide: "\u96b1\u85cf\u5bc6\u78bc",
}

const en = {
  close: "Close",
  closeAuth: "Close authentication",
  loginEyebrow: "Enter the LBID workspace",
  registerEyebrow: "Create company account",
  resetEyebrow: "Account security",
  updateEyebrow: "Account security",
  loginTitle: "Welcome back.",
  registerTitle: "Start matching fairly.",
  resetTitle: "Reset your password",
  updateTitle: "Set a new password",
  supporting: "One company account can create demand, submit sealed bids, or enable both capabilities.",
  resetSupporting: "Enter your work email and we will send a secure reset link.",
  updateSupporting: "Choose a new password to finish securing your account.",
  loginTab: "Login",
  registerTab: "Create account",
  company: "Company name",
  email: "Work email",
  region: "Country or region",
  password: "Password",
  confirmPassword: "Confirm password",
  remember: "Remember me",
  forgot: "Forgot password?",
  terms: "I accept the LBID Terms of Service and Privacy Policy.",
  loginAction: "Enter workspace",
  registerAction: "Create company account",
  resetAction: "Send reset link",
  updateAction: "Update password",
  working: "Working...",
  back: "Back to login",
  confirmTitle: "Confirm your work email",
  confirmBody: "A verification link was sent to",
  required: "Enter your work email and password.",
  registerRequired: "Complete the company details. Password must contain at least 8 characters.",
  passwordRequired: "Password must contain at least 8 characters.",
  mismatch: "Passwords do not match.",
  acceptRequired: "Accept the Terms of Service and Privacy Policy to continue.",
  incorrect: "Email or password is incorrect.",
  resetSent: "If the account exists, a reset link has been sent.",
  updated: "Password updated. Sign in with your new password.",
  connected: "You are connected. Opening your LBID workspace.",
  show: "Show password",
  hide: "Hide password",
}

export function PromoAuthPanel({ locale, open, initialMode, onClose, onAuthenticated }: PromoAuthPanelProps) {
  const copy = locale === "zh" ? zh : en
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [company, setCompany] = useState("")
  const [country, setCountry] = useState("Hong Kong")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [remember, setRemember] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    if (!open) return
    setMode(initialMode)
    setError("")
    setNotice("")
    const remembered = localStorage.getItem("lbid.auth.remember-email")
    if (remembered) {
      setEmail(remembered)
      setRemember(true)
    }
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const closeOnEscape = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", closeOnEscape)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [initialMode, onClose, open])

  async function destination() {
    try {
      const { response, body } = await apiJson("/api/company-profile")
      if (!response.ok || !body.companyProfile?.onboarding_completed) return `/${locale}/onboarding`
      return body.role === "admin" ? `/${locale}/dashboard?mode=admin` : `/${locale}/dashboard`
    } catch {
      return `/${locale}/onboarding`
    }
  }

  async function completeAuthentication(target: string) {
    setNotice(copy.connected)
    onAuthenticated?.()
    await new Promise((resolve) => window.setTimeout(resolve, 700))
    window.location.assign(target)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setNotice("")
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return setError("Supabase is not configured for this environment.")

    if (mode === "reset") {
      if (!email) return setError(copy.required)
      setLoading(true)
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/auth?mode=update`,
      })
      setLoading(false)
      return resetError ? setError(resetError.message) : setNotice(copy.resetSent)
    }

    if (mode === "update") {
      if (password.length < 8) return setError(copy.passwordRequired)
      if (password !== confirmation) return setError(copy.mismatch)
      setLoading(true)
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setLoading(false)
        return setError(updateError.message)
      }
      await supabase.auth.signOut()
      setLoading(false)
      setPassword("")
      setConfirmation("")
      setMode("login")
      return setNotice(copy.updated)
    }

    if (mode === "register") {
      if (!company.trim() || !email || password.length < 8) return setError(copy.registerRequired)
      if (password !== confirmation) return setError(copy.mismatch)
      if (!acceptTerms) return setError(copy.acceptRequired)
    } else if (!email || !password) {
      return setError(copy.required)
    }

    setLoading(true)
    try {
      if (mode === "login") {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
        if (loginError) throw loginError
        if (remember) localStorage.setItem("lbid.auth.remember-email", email)
        else localStorage.removeItem("lbid.auth.remember-email")
        const metadata = data.user?.user_metadata || {}
        await apiJson("/api/auth/bootstrap", {
          method: "POST",
          body: JSON.stringify({
            companyName: metadata.company_name || metadata.companyName || "LBID Company",
            country: metadata.country || "Hong Kong",
          }),
        })
        await completeAuthentication(await destination())
        return
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}?auth=login&confirmed=1`,
          data: { company_name: company.trim(), country },
        },
      })
      if (signUpError) throw signUpError
      if (!data.session) {
        setMode("confirm")
        return
      }
      const bootstrap = await apiJson("/api/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({ companyName: company.trim(), country }),
      })
      if (!bootstrap.response.ok) throw new Error(bootstrap.body.error || "Account bootstrap failed.")
      await completeAuthentication(`/${locale}/onboarding`)
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "AUTH_FAILED"
      setError(/invalid/i.test(message) ? copy.incorrect : message)
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null
  const register = mode === "register"
  const reset = mode === "reset"
  const update = mode === "update"

  return (
    <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-labelledby="promo-auth-title">
      <button type="button" aria-label={copy.closeAuth} className="absolute inset-0 bg-[#030713]/65 backdrop-blur-[3px]" onClick={onClose} />
      <section className="absolute inset-y-0 right-0 flex w-full max-w-[460px] flex-col overflow-y-auto border-l border-white/10 bg-[#fbfbfa] text-[#111827] shadow-[-28px_0_80px_rgba(0,0,0,0.3)]">
        <div className="flex items-center justify-between border-b border-[#e1e4e8] px-6 py-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/lbid-web-logo-clean.png" alt="LBID Logistics Bidding Platform" className="h-9 w-auto" />
          <button type="button" onClick={onClose} aria-label={copy.close} className="grid h-9 w-9 place-items-center rounded-full border border-[#d9dee5] text-[#536074] transition hover:border-[#9aa5b5] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315d9a]"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 py-9 sm:px-9">
          {mode === "confirm" ? (
            <div>
              <span className="grid h-12 w-12 place-items-center rounded-full bg-[#e8f6ef] text-[#16825d]"><CheckCircle2 className="h-6 w-6" /></span>
              <h2 id="promo-auth-title" className="mt-6 font-serif text-[34px] font-normal leading-tight text-[#0c1d3f]">{copy.confirmTitle}</h2>
              <p className="mt-4 text-[14px] leading-6 text-[#667085]">{copy.confirmBody} <strong>{email}</strong>.</p>
              <button type="button" onClick={() => setMode("login")} className="mt-8 inline-flex h-11 items-center gap-2 rounded-[4px] bg-[#10254d] px-5 text-[13px] font-semibold text-white">{copy.back}<ArrowRight className="h-4 w-4" /></button>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a87918]">{update ? copy.updateEyebrow : reset ? copy.resetEyebrow : register ? copy.registerEyebrow : copy.loginEyebrow}</p>
              <h2 id="promo-auth-title" className="mt-3 font-serif text-[36px] font-normal leading-[1.05] text-[#0c1d3f]">{update ? copy.updateTitle : reset ? copy.resetTitle : register ? copy.registerTitle : copy.loginTitle}</h2>
              <p className="mt-4 text-[13px] leading-6 text-[#667085]">{update ? copy.updateSupporting : reset ? copy.resetSupporting : copy.supporting}</p>

              {!reset && !update && <div className="mt-7 grid grid-cols-2 border-b border-[#dfe3e8]">
                <button type="button" onClick={() => setMode("login")} className={`border-b-2 py-3 text-[12px] font-semibold ${!register ? "border-[#10254d] text-[#10254d]" : "border-transparent text-[#8b95a5]"}`}>{copy.loginTab}</button>
                <button type="button" onClick={() => setMode("register")} className={`border-b-2 py-3 text-[12px] font-semibold ${register ? "border-[#10254d] text-[#10254d]" : "border-transparent text-[#8b95a5]"}`}>{copy.registerTab}</button>
              </div>}

              <form onSubmit={submit} className="mt-6 space-y-4">
                {register && <Field label={copy.company} id="promo-company"><input id="promo-company" value={company} onChange={(event) => setCompany(event.target.value)} autoComplete="organization" className={inputClass} /></Field>}
                {!update && <Field label={copy.email} id="promo-email"><input id="promo-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className={inputClass} /></Field>}
                {register && <Field label={copy.region} id="promo-country"><select id="promo-country" value={country} onChange={(event) => setCountry(event.target.value)} className={inputClass}>{countries.map((item) => <option key={item}>{item}</option>)}</select></Field>}
                {!reset && <Field label={copy.password} id="promo-password"><div className="relative"><input id="promo-password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={register || update ? "new-password" : "current-password"} className={`${inputClass} pr-11`} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? copy.hide : copy.show} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#8a95a6]"><span aria-hidden="true">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</span></button></div></Field>}
                {(register || update) && <Field label={copy.confirmPassword} id="promo-confirm"><input id="promo-confirm" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" className={inputClass} /></Field>}

                {!register && !reset && !update && <div className="flex items-center justify-between gap-4 text-[11px]"><label className="flex items-center gap-2 text-[#657084]"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="accent-[#10254d]" />{copy.remember}</label><button type="button" onClick={() => setMode("reset")} className="font-semibold text-[#28528d] hover:underline">{copy.forgot}</button></div>}
                {register && <label className="flex items-start gap-2 text-[11px] leading-5 text-[#657084]"><input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1 accent-[#10254d]" />{copy.terms}</label>}

                {error && <div role="alert" className="flex gap-2 rounded-[5px] border border-[#f0c9c4] bg-[#fff5f3] p-3 text-[11px] leading-5 text-[#a53f31]"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />{error}</div>}
                {notice && <div role="status" className="flex gap-2 rounded-[5px] border border-[#bfe3d4] bg-[#f0faf6] p-3 text-[11px] leading-5 text-[#157455]"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />{notice}</div>}

                <button type="submit" disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-[4px] bg-[#10254d] text-[13px] font-semibold text-white transition hover:-translate-y-px hover:bg-[#173664] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45b7d1] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">{loading ? copy.working : update ? copy.updateAction : reset ? copy.resetAction : register ? copy.registerAction : copy.loginAction}<ArrowRight className="h-4 w-4" /></button>
                {(reset || update) && <button type="button" onClick={() => setMode("login")} className="w-full py-2 text-[11px] font-semibold text-[#526075] hover:underline">{copy.back}</button>}
              </form>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

const inputClass = "mt-2 h-11 w-full rounded-[5px] border border-[#d8dee7] bg-white px-3 text-[13px] outline-none transition focus:border-[#315d9a] focus:ring-2 focus:ring-[#315d9a]/15"

function Field({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return <div><label htmlFor={id} className="text-[11px] font-semibold text-[#39465a]">{label}</label>{children}</div>
}
