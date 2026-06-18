"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, CheckCircle2, Eye, LockKeyhole, Mail, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { isLocale, type Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Role = "agency" | "forwarder" | "admin"
type AuthResult = { type: "register" | "login"; role: Role; email: string } | null

const copy = {
  zh: {
    title: "登入 LBID",
    registerTitle: "建立試用帳戶",
    subtitle: "一個為東南亞 Agency 與香港 Forwarder 而設的 sealed bidding logistics workspace。",
    eyebrow: "Matching-first logistics platform",
    newUser: "第一次使用？",
    signUp: "建立試用",
    backToLogin: "返回登入",
    email: "Email",
    password: "密碼",
    remember: "記住我",
    forgot: "忘記密碼？",
    signIn: "登入",
    role: "身份",
    company: "公司名稱",
    fullName: "聯絡人",
    create: "建立 7 日試用",
    demo: "Demo mode",
    configured: "Supabase connected",
    demoText: "連接 Supabase 後會使用真實 Auth。未登入時仍可先預覽 demo workspace。",
    loginReady: "已登入，可以進入工作台。",
    verifyTitle: "試用帳戶已建立",
    verifyBody: "如 Supabase 啟用 email verification，請完成驗證後再進入 onboarding。",
    dashboard: "進入工作台",
    working: "處理中...",
    promise: "價格公平、能力透明、流程留痕。",
    trust: ["Sealed bid", "Token ledger", "Order workspace"],
    roles: [
      { value: "agency", label: "Client / Agency" },
      { value: "forwarder", label: "Forwarder" },
      { value: "admin", label: "Admin" },
    ],
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
    role: "Role",
    company: "Company name",
    fullName: "Contact person",
    create: "Create 7-day trial",
    demo: "Demo mode",
    configured: "Supabase connected",
    demoText: "When Supabase is connected, this form uses real Auth. Demo workspace remains available for preview.",
    loginReady: "Signed in. Ready to enter the workspace.",
    verifyTitle: "Trial account created",
    verifyBody: "If email verification is enabled in Supabase, verify your email before onboarding.",
    dashboard: "Go to workspace",
    working: "Working...",
    promise: "Fair pricing. Transparent capability. Traceable workflow.",
    trust: ["Sealed bid", "Token ledger", "Order workspace"],
    roles: [
      { value: "agency", label: "Client / Agency" },
      { value: "forwarder", label: "Forwarder" },
      { value: "admin", label: "Admin" },
    ],
  },
}

export default function LocalizedAuthPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const router = useRouter()
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [role, setRole] = useState<Role>("forwarder")
  const [company, setCompany] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<AuthResult>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const dashboardHref = `/${locale}/dashboard?role=${result?.role ?? role}`

  async function submitLogin() {
    if (!email || !password) return
    setError("")
    setLoading(true)
    const supabase = getSupabaseBrowserClient()

    if (supabase) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("role")
        .eq("id", signInData.user.id)
        .maybeSingle()

      const dbRole = userRow?.role as Role | undefined
      const nextRole = dbRole ?? role
      setResult({ type: "login", role: nextRole, email })
      setLoading(false)
      router.push(`/${locale}/dashboard?role=${nextRole}`)
      return
    }

    setLoading(false)
    setResult({ type: "login", role, email })
    router.push(`/${locale}/dashboard?role=${role}`)
  }

  async function submitRegister() {
    if (!company || !fullName || !email || !password) return
    setError("")
    setLoading(true)
    const supabase = getSupabaseBrowserClient()

    if (supabase) {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, company_name: company, full_name: fullName } },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (signUpData.user) {
        await supabase.from("users").upsert({
          id: signUpData.user.id,
          role,
          company_name: company,
          country: "Hong Kong",
          email,
          referral_code: `LBID-${signUpData.user.id.slice(0, 8)}`,
        })
      }
    }

    setLoading(false)
    setResult({ type: "register", role, email })
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
              <label className="space-y-2 text-sm font-bold text-lblue">
                {t.role}
                <Select value={role} onChange={(event) => setRole(event.target.value as Role)}>
                  {t.roles.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </Select>
              </label>

              {mode === "register" ? (
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
                  <Link href={dashboardHref}>{t.dashboard}</Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
