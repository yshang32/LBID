"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, CheckCircle2, Eye, LockKeyhole, Mail, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type CapabilityMode = "client" | "forwarder" | "both"
type AuthResult = { type: "register" | "login"; email: string; href: string } | null

const copy = {
  zh: {
    title: "登入 LBID",
    registerTitle: "建立試用帳戶",
    subtitle: "連接東南亞 Agency 與香港 Forwarder 的 sealed bidding logistics workspace。",
    eyebrow: "Matching-first logistics platform",
    newUser: "第一次使用 LBID？",
    signUp: "建立試用帳戶",
    backToLogin: "返回登入",
    email: "Email",
    password: "密碼",
    remember: "記住我",
    forgot: "忘記密碼？",
    signIn: "登入",
    company: "公司名稱",
    fullName: "聯絡人",
    capability: "公司能力",
    create: "建立帳戶",
    demo: "Demo mode",
    configured: "Supabase connected",
    demoText: "如已設定 Supabase env，登入會使用真實 Auth；否則可用 demo flow 預覽工作台。",
    loginReady: "已登入，可以進入工作台。",
    verifyTitle: "帳戶已建立",
    verifyBody: "如 Supabase 啟用了 email verification，請先完成驗證；否則可以直接繼續 onboarding。",
    dashboard: "進入工作台",
    onboarding: "繼續設定公司能力",
    working: "處理中...",
    promise: "公平報價。真實能力。可追蹤流程。",
    trust: ["Sealed bid", "Token ledger", "Order workspace"],
    modes: {
      client: "Client：發出 SR",
      forwarder: "Forwarder：承接 SR",
      both: "Client + Forwarder：雙重能力",
    },
  },
  en: {
    title: "Sign in to LBID",
    registerTitle: "Create trial account",
    subtitle: "A sealed bidding logistics workspace for Southeast Asian agencies and Hong Kong forwarders.",
    eyebrow: "Matching-first logistics platform",
    newUser: "New here?",
    signUp: "Start trial",
    backToLogin: "Back to sign in",
    email: "Email",
    password: "Password",
    remember: "Remember me",
    forgot: "Forgot your password?",
    signIn: "Sign In",
    company: "Company name",
    fullName: "Contact person",
    capability: "Company capabilities",
    create: "Create account",
    demo: "Demo mode",
    configured: "Supabase connected",
    demoText: "When Supabase is connected, this form uses real Auth. Demo workspace remains available for preview.",
    loginReady: "Signed in. Ready to enter the workspace.",
    verifyTitle: "Account created",
    verifyBody: "If email verification is enabled in Supabase, verify your email first. Otherwise continue to onboarding.",
    dashboard: "Go to workspace",
    onboarding: "Continue onboarding",
    working: "Working...",
    promise: "Fair pricing. Real capability. Traceable workflow.",
    trust: ["Sealed bid", "Token ledger", "Order workspace"],
    modes: {
      client: "Client: create SRs",
      forwarder: "Forwarder: bid on SRs",
      both: "Client + Forwarder: dual capability",
    },
  },
}

export default function LocalizedAuthPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const router = useRouter()
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [capabilityMode, setCapabilityMode] = useState<CapabilityMode>("both")
  const [company, setCompany] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<AuthResult>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const canBeClient = capabilityMode === "client" || capabilityMode === "both"
  const canBeForwarder = capabilityMode === "forwarder" || capabilityMode === "both"
  const defaultDashboardRole = canBeForwarder ? "forwarder" : "agency"

  async function getProfileDashboardHref() {
    const { response, body } = await apiJson("/api/company-profile")
    if (!response.ok || !body.companyProfile) return `/${locale}/onboarding`
    const profile = body.companyProfile
    if (profile.can_be_forwarder) return `/${locale}/dashboard?role=forwarder`
    if (profile.can_be_client) return `/${locale}/dashboard?role=agency`
    return `/${locale}/onboarding`
  }

  async function submitLogin() {
    if (!email || !password) return
    setError("")
    setLoading(true)
    const supabase = getSupabaseBrowserClient()

    if (supabase) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      const href = await getProfileDashboardHref()
      setResult({ type: "login", email, href })
      setLoading(false)
      router.push(href)
      return
    }

    const href = `/${locale}/dashboard?role=${defaultDashboardRole}`
    setLoading(false)
    setResult({ type: "login", email, href })
    router.push(href)
  }

  async function submitRegister() {
    if (!company || !fullName || !email || !password) return
    setError("")
    setLoading(true)
    const supabase = getSupabaseBrowserClient()

    if (supabase) {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { company_name: company, full_name: fullName, can_be_client: canBeClient, can_be_forwarder: canBeForwarder } },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      const { response, body } = await apiJson("/api/auth/bootstrap", {
        method: "POST",
        body: JSON.stringify({
          companyName: company,
          fullName,
          canBeClient,
          canBeForwarder,
        }),
      })

      if (!response.ok && body.error !== "NO_ACTIVE_SESSION") {
        setError(body.error || "Unable to prepare account")
        setLoading(false)
        return
      }
    }

    const href = hasSupabase ? `/${locale}/onboarding` : `/${locale}/dashboard?role=${defaultDashboardRole}`
    setLoading(false)
    setResult({ type: "register", email, href })
    router.push(href)
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-white text-lblue">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_440px]">
        <div className="hidden lg:block">
          <div className="inline-flex rounded-full border border-lblue/10 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-lgold shadow-sm">
            {t.eyebrow}
          </div>
          <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[1.04] tracking-tight text-lblue">
            {t.promise}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">{t.subtitle}</p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {t.trust.map((item) => (
              <div key={item} className="rounded-lg border border-lblue/10 bg-slate-50 p-4 text-sm font-bold text-lblue">
                <CheckCircle2 className="mb-3 h-5 w-5 text-lgold" />
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mx-auto w-full max-w-[440px]">
          <div className="mb-8 flex justify-center">
            <Image
              src="/assets/lbid-logo-enterprise-light.png"
              alt="LBID"
              width={260}
              height={78}
              className="h-[64px] w-auto object-contain"
              priority
            />
          </div>

          <div className="rounded-xl border border-lblue/10 bg-white p-7 shadow-[0_24px_70px_rgba(27,43,94,0.10)]">
            <div className="text-center">
              <h2 className="text-2xl font-black tracking-tight text-lblue">{mode === "login" ? t.title : t.registerTitle}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{t.subtitle}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {mode === "login" ? (
                  <>
                    {t.newUser}{" "}
                    <button className="font-bold text-lblue underline decoration-lgold/50 underline-offset-4 hover:text-lgold" onClick={() => setMode("register")}>
                      {t.signUp}
                    </button>
                  </>
                ) : (
                  <button className="font-bold text-lblue underline decoration-lgold/50 underline-offset-4 hover:text-lgold" onClick={() => setMode("login")}>
                    {t.backToLogin}
                  </button>
                )}
              </p>
            </div>

            <div className="mt-7 space-y-4">
              {mode === "register" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="space-y-2 text-sm font-bold text-lblue">
                      {t.company}
                      <Input value={company} onChange={(event) => setCompany(event.target.value)} />
                    </label>
                    <label className="space-y-2 text-sm font-bold text-lblue">
                      {t.fullName}
                      <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
                    </label>
                  </div>
                  <div className="space-y-2 text-sm font-bold text-lblue">
                    {t.capability}
                    <div className="grid gap-2">
                      {(["both", "client", "forwarder"] as CapabilityMode[]).map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setCapabilityMode(item)}
                          className={`rounded-md border px-3 py-2 text-left text-sm font-bold transition ${
                            capabilityMode === item ? "border-lgold/60 bg-lgold/15 text-lblue" : "border-lblue/10 bg-slate-50 text-muted-foreground hover:bg-white"
                          }`}
                        >
                          {t.modes[item]}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              <label className="space-y-2 text-sm font-bold text-lblue">
                {t.email}
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="pl-9" />
                </div>
              </label>

              <label className="space-y-2 text-sm font-bold text-lblue">
                {t.password}
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="pl-9 pr-9" />
                  <Eye className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                </div>
              </label>

              {mode === "login" ? (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-lblue/20" />
                    {t.remember}
                  </label>
                  <button className="font-semibold text-lblue hover:text-lgold">{t.forgot}</button>
                </div>
              ) : null}

              <Button className="h-11 w-full" variant="gold" disabled={loading} onClick={mode === "login" ? submitLogin : submitRegister}>
                {loading ? t.working : mode === "login" ? t.signIn : t.create}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {error ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}

            <div className="mt-5 rounded-lg border border-lblue/10 bg-slate-50 p-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 font-bold text-lblue">
                <ShieldCheck className="h-4 w-4 text-lgold" />
                {hasSupabase ? t.configured : t.demo}
              </div>
              <p className="mt-1 leading-5">{t.demoText}</p>
            </div>

            {result ? (
              <div className="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.type === "login" ? t.loginReady : t.verifyTitle}
                </div>
                <p className="mt-1 text-teal-700">{result.type === "login" ? result.email : t.verifyBody}</p>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link href={result.href}>{result.type === "login" ? t.dashboard : t.onboarding}</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
