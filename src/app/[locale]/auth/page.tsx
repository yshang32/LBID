"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  LockKeyhole,
  Plane,
  Radio,
  ShieldCheck,
  Timer,
  WalletCards,
} from "lucide-react"

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

  function authRedirectUrl(next = `/${locale}/auth`) {
    const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "")
    const browserOrigin = window.location.origin
    const origin = configuredOrigin || browserOrigin
    return `${origin}${next.startsWith("/") ? next : `/${next}`}`
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
        redirectTo: authRedirectUrl(`/${locale}/auth?mode=update`),
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
        emailRedirectTo: authRedirectUrl(`/${locale}/auth`),
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
    <main className="relative min-h-screen overflow-hidden bg-[#f5f7fb] px-5 py-6 text-ink sm:px-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_16%,rgba(201,168,76,.22),transparent_24%),radial-gradient(circle_at_82%_12%,rgba(74,118,194,.18),transparent_26%),linear-gradient(135deg,#f8fafc_0%,#eef2f8_48%,#f7f0df_100%)]" />
        <div className="absolute inset-0 opacity-[.32] [background-image:linear-gradient(rgba(27,43,94,.07)_1px,transparent_1px),linear-gradient(90deg,rgba(27,43,94,.055)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="absolute left-[-10rem] top-[14%] h-[32rem] w-[72rem] rotate-[-17deg] rounded-full border border-navy/10" />
        <div className="absolute right-[-18rem] top-[18%] h-[30rem] w-[68rem] rotate-[19deg] rounded-full border border-gold/25" />
        <div className="absolute left-[18%] top-[24%] h-2.5 w-2.5 animate-[lbid-route_8s_ease-in-out_infinite] rounded-full bg-gold shadow-[0_0_0_7px_rgba(201,168,76,.12),0_0_28px_rgba(201,168,76,.55)]" />
        <div className="absolute right-[28%] top-[14%] h-2 w-2 animate-pulse rounded-full bg-[#3768a5] shadow-[0_0_0_7px_rgba(55,104,165,.10),0_0_24px_rgba(55,104,165,.42)]" />
        <div className="absolute bottom-[-10rem] left-[10%] h-[22rem] w-[22rem] rounded-full bg-white/40 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-[calc(100vh-3rem)] w-full max-w-[1240px] items-center gap-8 lg:grid-cols-[minmax(0,1fr)_430px] xl:gap-14">
        <section className="hidden min-w-0 lg:block">
          <div className="flex items-center justify-between">
            <div className="h-[108px] w-[360px] overflow-hidden">
              <img src="/assets/lbid-figma-25jun-logo.png?v=20260625" alt="LBID" className="-ml-10 -mt-10 block w-[390px] mix-blend-multiply" draggable={false} />
            </div>
            <div className="rounded-full border border-emerald/20 bg-white/70 px-3 py-1.5 text-[11.5px] font-semibold text-emerald shadow-[0_10px_28px_rgba(12,26,62,.05)] backdrop-blur">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald" />
              Bidding infrastructure online
            </div>
          </div>

          <div className="mt-10 grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div>
              <BadgePill>Sealed bid logistics platform</BadgePill>
              <h1 className="mt-5 max-w-3xl text-[58px] font-bold leading-[.98] tracking-[-2.2px] text-ink xl:text-[66px]">
                Fair prices. Real capability. No connections needed.
              </h1>
              <p className="mt-6 max-w-2xl text-[16px] leading-8 text-ink-2">{text.intro}</p>
            </div>

            <div className="relative self-end rounded-[26px] border border-white/70 bg-white/55 p-4 shadow-[0_24px_70px_rgba(12,26,62,.12)] backdrop-blur-xl">
              <div className="absolute -right-3 -top-3 grid h-11 w-11 place-items-center rounded-2xl bg-navy text-white shadow-[0_16px_34px_rgba(12,26,62,.25)]">
                <Plane className="h-5 w-5" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-gold-dark">Today&apos;s bid window</p>
              <div className="mt-4 rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-ink-3">HCM → HKG</span>
                  <span className="font-mono text-[13px] font-bold text-navy">02:48:13</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas">
                  <div className="h-full w-[72%] rounded-full bg-[linear-gradient(90deg,#0c1a3e,#c49a3c)]" />
                </div>
                <p className="mt-3 text-[12px] leading-5 text-ink-3">3 qualified forwarders invited. Prices remain sealed until close.</p>
              </div>
            </div>
          </div>

          <div className="mt-9 grid gap-3 xl:grid-cols-4">
            <FeatureCard icon={<LockKeyhole className="h-4 w-4" />} title="Sealed bids" body="Forwarders submit once. Competitor pricing stays hidden." />
            <FeatureCard icon={<WalletCards className="h-4 w-4" />} title="Token ledger" body="Each bid records token movement and transaction history." />
            <FeatureCard icon={<BadgeCheck className="h-4 w-4" />} title="Smart matching" body="Recommended bids are pushed by route and profile fit." />
            <FeatureCard icon={<ShieldCheck className="h-4 w-4" />} title="Order workspace" body="Documents, messages and audit trail stay in one place." />
          </div>

          <div className="mt-6 grid gap-3 xl:grid-cols-[1fr_1fr_1fr]">
            {[
              { title: "3-hour window", body: "Fixed urgency after admin approval", icon: Timer },
              { title: "Hybrid award", body: "Lowest quote highlighted, agency still chooses fit", icon: CheckCircle2 },
              { title: "SEA -> Hong Kong", body: "Built for regional agency demand", icon: Globe2 },
            ].map(({ title, body, icon: Icon }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/50 p-4 shadow-[0_12px_32px_rgba(12,26,62,.06)] backdrop-blur">
                <Icon className="h-5 w-5 flex-shrink-0 text-gold" />
                <div>
                  <p className="text-[13px] font-bold text-ink">{title}</p>
                  <p className="mt-0.5 text-[12px] leading-5 text-ink-3">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-[430px]">
          <div className="mb-5 flex h-[104px] justify-center overflow-hidden lg:hidden">
            <img src="/assets/lbid-figma-25jun-logo.png?v=20260625" alt="LBID" className="-mt-10 block w-[330px] mix-blend-multiply" draggable={false} />
          </div>

          <div className="mb-4 hidden items-center justify-between rounded-2xl border border-white/70 bg-white/55 px-4 py-3 shadow-[0_14px_34px_rgba(12,26,62,.07)] backdrop-blur lg:flex">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-gold-dark">Secure access</p>
              <p className="mt-0.5 text-[12px] text-ink-3">Sign in to your company workspace</p>
            </div>
            <Radio className="h-5 w-5 animate-pulse text-emerald" />
          </div>

          <div className="overflow-hidden rounded-[26px] border border-white/70 bg-white/82 shadow-[0_26px_80px_rgba(12,26,62,.16),0_2px_8px_rgba(12,26,62,.05)] backdrop-blur-xl">
            <div className="h-[3px] bg-[linear-gradient(90deg,#0c1a3e_0%,#1e3a7a_55%,#c49a3c_100%)]" />
            {mode === "login" || mode === "register" ? (
              <div className="flex border-b border-line">
                <Tab active={mode === "login"} onClick={() => switchMode("login")}>{text.login}</Tab>
                <Tab active={mode === "register"} onClick={() => switchMode("register")}>{text.register}</Tab>
              </div>
            ) : null}

            <form onSubmit={submit} className="flex flex-col gap-4 p-7">
              {mode === "login" || mode === "register" ? (
                <div className="mb-1">
                  <h2 className="text-[22px] font-bold tracking-[-.5px] text-ink">{mode === "login" ? "Welcome back." : "Build your LBID company account."}</h2>
                  <p className="mt-1.5 text-[13px] leading-6 text-ink-3">
                    {mode === "login" ? "Continue to live requests, sealed bids and order workspaces." : "One account can create shipment requests and submit forwarder bids."}
                  </p>
                </div>
              ) : null}

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

              <button disabled={loading} type="submit" className="group mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3.5 text-[13.5px] font-semibold tracking-[.01em] text-white transition duration-200 hover:-translate-y-px hover:bg-[#172d63] hover:shadow-[0_10px_24px_rgba(12,26,62,.28)] disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Working..." : mode === "login" ? text.enter : mode === "register" ? text.create : mode === "reset" ? text.sendReset : text.updatePassword}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
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

function FeatureCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="group rounded-2xl border border-white/70 bg-white/62 p-4 shadow-[0_16px_36px_rgba(12,26,62,.07)] backdrop-blur transition duration-200 hover:-translate-y-1 hover:bg-white/82 hover:shadow-[0_22px_48px_rgba(12,26,62,.11)]">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-soft text-navy transition duration-200 group-hover:bg-navy group-hover:text-white">{icon}</span>
      <p className="mt-4 text-[13px] font-bold text-ink">{title}</p>
      <p className="mt-1 text-[12px] leading-5 text-ink-3">{body}</p>
    </div>
  )
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
