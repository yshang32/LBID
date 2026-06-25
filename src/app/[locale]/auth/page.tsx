"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Eye, EyeOff, LockKeyhole, Plane } from "lucide-react"

import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Mode = "login" | "register" | "reset" | "update"

const text = {
  login: "Sign In",
  register: "Create Account",
  reset: "Reset password",
  update: "Set new password",
  company: "Company name",
  contact: "Contact name",
  email: "Work email",
  password: "Password",
  confirm: "Confirm password",
  enter: "Enter workspace",
  create: "Create company account",
  sendReset: "Send reset link",
  updatePassword: "Update password",
  forgot: "Forgot password?",
  back: "Back to sign in",
  secure: "Authentication is handled by Supabase Auth. LBID never stores plaintext passwords.",
  intro: "A sealed-bid logistics workspace for companies that can create requests, submit quotes, or do both.",
  needFields: "Please complete the required fields. Password must be at least 8 characters.",
  mismatch: "Passwords do not match.",
  resetBody: "Enter your work email and we will send a secure reset link.",
  updateBody: "Choose a new password, then sign in again.",
  resetSent: "If the account exists, a reset link has been sent.",
  updated: "Password updated. Please sign in again.",
  confirmSent: "Account created. Complete email verification before signing in.",
}

export default function AuthPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [company, setCompany] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  useEffect(() => {
    const query = window.location.search
    if (query.includes("mode=register")) setMode("register")
    if (query.includes("mode=update") || query.includes("type=recovery")) setMode("update")
  }, [])

  function resetMessages() {
    setError("")
    setNotice("")
  }

  function switchMode(next: Mode) {
    resetMessages()
    setPassword("")
    setConfirm("")
    setMode(next)
  }

  async function workspaceHref() {
    const { response, body } = await apiJson("/api/company-profile")
    if (!response.ok || !body.companyProfile?.onboarding_completed) return `/${locale}/onboarding`
    return body.role === "admin" ? `/${locale}/dashboard?mode=admin` : `/${locale}/dashboard`
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetMessages()

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Supabase is not configured for this environment.")
      return
    }

    if (mode === "register" && (!company.trim() || !name.trim() || !email || password.length < 8)) {
      setError(text.needFields)
      return
    }
    if (mode === "register" && password !== confirm) {
      setError(text.mismatch)
      return
    }
    if (mode === "login" && (!email || !password)) {
      setError(text.needFields)
      return
    }
    if (mode === "reset" && !email) {
      setError(text.needFields)
      return
    }
    if (mode === "update" && password.length < 8) {
      setError(text.needFields)
      return
    }

    setLoading(true)

    if (mode === "reset") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/${locale}/auth?mode=update`,
      })
      setLoading(false)
      if (resetError) setError(resetError.message)
      else setNotice(text.resetSent)
      return
    }

    if (mode === "update") {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      setLoading(false)
      if (updateError) setError(updateError.message)
      else {
        setNotice(text.updated)
        setMode("login")
      }
      return
    }

    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) {
        setLoading(false)
        setError(loginError.message)
        return
      }
      const href = await workspaceHref()
      setLoading(false)
      router.push(href)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/${locale}/auth`,
        data: { company_name: company, full_name: name },
      },
    })
    if (signUpError) {
      setLoading(false)
      setError(signUpError.message)
      return
    }
    if (!data.session) {
      setLoading(false)
      setNotice(text.confirmSent)
      return
    }

    const bootstrap = await apiJson("/api/auth/bootstrap", {
      method: "POST",
      body: JSON.stringify({ companyName: company, fullName: name }),
    })
    setLoading(false)
    if (!bootstrap.response.ok) {
      setError(bootstrap.body.error || "Account bootstrap failed.")
      return
    }
    router.push(`/${locale}/onboarding`)
  }

  const title = mode === "login" ? text.login : mode === "register" ? text.register : mode === "reset" ? text.reset : text.update
  const passwordMode = mode === "login" || mode === "register" || mode === "update"

  return (
    <main className="min-h-screen overflow-hidden bg-[linear-gradient(150deg,#f0f2f8_0%,#eceef5_100%)] px-5 py-8 text-ink sm:px-6">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <section className="hidden lg:block">
          <div className="mb-10 h-[112px] overflow-hidden">
            <img src="/assets/lbid-figma-25jun-logo.png?v=20260625" alt="LBID" className="-ml-9 -mt-9 block w-[380px] mix-blend-multiply" draggable={false} />
          </div>
          <BadgePill>Sealed bid logistics platform</BadgePill>
          <h1 className="mt-5 max-w-3xl text-[56px] font-bold leading-[1.02] tracking-[-1.8px] text-ink">
            Fair prices. Real capability. No connections needed.
          </h1>
          <p className="mt-5 max-w-xl text-[15px] leading-7 text-ink-2">{text.intro}</p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {["Sealed bids", "Token ledger", "Order workspace"].map((item, index) => (
              <div key={item} className="rounded-2xl border border-line bg-white/70 p-4 shadow-[0_10px_28px_rgba(12,26,62,.05)]">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-navy-soft text-navy">{index === 0 ? <LockKeyhole className="h-4 w-4" /> : index === 1 ? <CheckCircle2 className="h-4 w-4" /> : <Plane className="h-4 w-4" />}</span>
                <p className="mt-3 text-[12px] font-semibold text-ink">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[420px]">
          <div className="mb-5 flex h-[104px] justify-center overflow-hidden lg:hidden">
            <img src="/assets/lbid-figma-25jun-logo.png?v=20260625" alt="LBID" className="-mt-10 block w-[330px] mix-blend-multiply" draggable={false} />
          </div>

          <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[0_8px_40px_rgba(0,0,0,.09),0_2px_8px_rgba(0,0,0,.05)]">
            <div className="h-[3px] bg-[linear-gradient(90deg,#0c1a3e_0%,#1e3a7a_55%,#c49a3c_100%)]" />
            {mode === "login" || mode === "register" ? (
              <div className="flex border-b border-line">
                <Tab active={mode === "login"} onClick={() => switchMode("login")}>{text.login}</Tab>
                <Tab active={mode === "register"} onClick={() => switchMode("register")}>{text.register}</Tab>
              </div>
            ) : null}

            <form onSubmit={submit} className="flex flex-col gap-4 p-7">
              {mode === "reset" || mode === "update" ? (
                <div>
                  <h2 className="text-[16px] font-semibold text-ink">{title}</h2>
                  <p className="mt-1 text-[13px] text-ink-3">{mode === "reset" ? text.resetBody : text.updateBody}</p>
                </div>
              ) : null}

              {mode === "register" ? (
                <>
                  <Field label={text.company}><input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Pacific Forward Ltd." className="auth-input" autoFocus /></Field>
                  <Field label={text.contact}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Kenny Lam" className="auth-input" /></Field>
                </>
              ) : null}

              {mode !== "update" ? (
                <Field label={text.email}><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" type="email" className="auth-input" autoFocus={mode !== "register"} required /></Field>
              ) : null}

              {passwordMode ? (
                <Field label={text.password}>
                  <div className="relative">
                    <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "Your password"} type={showPassword ? "text" : "password"} className="auth-input pr-10" required />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-3 transition hover:text-ink" aria-label="Toggle password visibility">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </Field>
              ) : null}

              {mode === "register" ? <Field label={text.confirm}><input value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repeat password" type="password" className="auth-input" required /></Field> : null}
              {mode === "login" ? <div className="-mt-1 flex justify-end"><button type="button" onClick={() => switchMode("reset")} className="text-[12px] font-medium text-navy underline-offset-2 transition hover:underline">{text.forgot}</button></div> : null}

              <button disabled={loading} type="submit" className="mt-1 w-full rounded-xl bg-navy py-3.5 text-[13.5px] font-semibold tracking-[.01em] text-white transition duration-200 hover:-translate-y-px hover:bg-[#172d63] hover:shadow-[0_6px_20px_rgba(12,26,62,.26)] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Working..." : mode === "login" ? text.enter : mode === "register" ? text.create : mode === "reset" ? text.sendReset : text.updatePassword}
              </button>

              {mode === "reset" || mode === "update" ? <button type="button" onClick={() => switchMode("login")} className="text-center text-[12.5px] font-medium text-ink-3 transition hover:text-ink">{text.back}</button> : null}
              {mode === "register" ? <p className="text-center text-[11.5px] leading-relaxed text-ink-3">By registering you agree to LBID's Terms of Service and Privacy Policy.</p> : null}
              {error ? <Feedback error>{error}</Feedback> : null}
              {notice ? <Feedback>{notice}</Feedback> : null}
            </form>
          </div>

          <div className="mt-5 flex items-start justify-center gap-2 text-center text-[11.5px] text-ink-3">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />
            {text.secure}
          </div>
          <Link href={`/${locale === "zh" ? "en" : "zh"}/auth`} className="mt-4 block text-center text-[12px] font-medium text-navy hover:underline">
            {locale === "zh" ? "English" : "Chinese"}
          </Link>
        </section>
      </div>
    </main>
  )
}

function BadgePill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex rounded-full border border-gold-border bg-gold-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gold-dark">{children}</span>
}

function Tab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`flex-1 border-b-2 py-4 text-[13.5px] font-medium transition ${active ? "-mb-px border-navy text-navy" : "border-transparent text-ink-3 hover:text-ink"}`}>{children}</button>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold tracking-[.02em] text-ink-2">{label}{children}</label>
}

function Feedback({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <p className={`flex items-start gap-2 rounded-xl border p-3 text-[12px] leading-5 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />}{children}</p>
}
