"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { CheckCircle2, Eye, LockKeyhole, Mail, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { isLocale, type Locale } from "@/lib/i18n"

type Role = "agency" | "forwarder" | "admin"
type AuthResult = { type: "register" | "login"; role: Role; email: string } | null

const copy = {
  zh: {
    title: "登入 LBID",
    subtitle: "連接東南亞 Agent 與香港 Forwarder 的 matching-first logistics network。",
    newUser: "未有帳戶？",
    signUp: "申請試用",
    email: "Email",
    password: "密碼",
    remember: "記住我",
    forgot: "忘記密碼？",
    signIn: "登入",
    role: "登入身份",
    registerTitle: "建立試用帳戶",
    company: "公司名稱",
    fullName: "聯絡人",
    create: "建立 7 日試用",
    demo: "Demo mode",
    configured: "Supabase connected",
    demoText: "未設定 Supabase env 時，表單會以 demo flow 顯示。",
    loginReady: "已登入，可以進入工作台。",
    verifyTitle: "試用帳戶已建立",
    verifyBody: "完成 email verification 後即可進入 onboarding，並獲得 10 tokens。",
    dashboard: "進入工作台",
    trust: ["Sealed bid", "Token ledger", "Preferred partner"],
    roles: [
      { value: "agency", label: "Agency" },
      { value: "forwarder", label: "Forwarder" },
      { value: "admin", label: "Admin" },
    ],
  },
  en: {
    title: "Sign in to LBID",
    subtitle: "A matching-first logistics network connecting Southeast Asian agents with Hong Kong forwarders.",
    newUser: "New to LBID?",
    signUp: "Start trial",
    email: "Email",
    password: "Password",
    remember: "Remember me",
    forgot: "Forgot your password?",
    signIn: "Sign In",
    role: "Role",
    registerTitle: "Create trial account",
    company: "Company name",
    fullName: "Contact person",
    create: "Create 7-day trial",
    demo: "Demo mode",
    configured: "Supabase connected",
    demoText: "Forms stay in demo flow until Supabase env vars are configured.",
    loginReady: "Signed in. Ready to enter the workspace.",
    verifyTitle: "Trial account created",
    verifyBody: "After email verification, onboarding unlocks and 10 tokens are granted.",
    dashboard: "Go to workspace",
    trust: ["Sealed bid", "Token ledger", "Preferred partner"],
    roles: [
      { value: "agency", label: "Agency" },
      { value: "forwarder", label: "Forwarder" },
      { value: "admin", label: "Admin" },
    ],
  },
}

export default function LocalizedAuthPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [role, setRole] = useState<Role>("forwarder")
  const [company, setCompany] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<AuthResult>(null)

  const dashboardHref = `/${locale}/dashboard?role=${result?.role ?? role}`

  function submitLogin() {
    if (!email || !password) return
    setResult({ type: "login", role, email })
  }

  function submitRegister() {
    if (!company || !fullName || !email || !password) return
    setResult({ type: "register", role, email })
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#050607] text-white">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl place-items-center px-4 py-14 sm:px-6">
        <div className="w-full max-w-[440px]">
          <div className="mb-12 flex justify-center">
            <Image
              src="/assets/lbid-logo-enterprise-dark.png"
              alt="LBID"
              width={260}
              height={78}
              className="h-[76px] w-auto object-contain drop-shadow-[0_0_24px_rgba(148,163,184,0.18)]"
              priority
            />
          </div>

          <div className="rounded-xl border border-white/10 bg-[#111216] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="text-center">
              <h1 className="text-2xl font-black tracking-tight">{mode === "login" ? t.title : t.registerTitle}</h1>
              <p className="mt-2 text-sm text-[#8f96a3]">{t.subtitle}</p>
              <p className="mt-3 text-sm text-[#8f96a3]">
                {mode === "login" ? (
                  <>
                    {t.newUser}{" "}
                    <button className="font-semibold text-[#62a8ff] hover:text-[#8ec2ff]" onClick={() => setMode("register")}>
                      {t.signUp}
                    </button>
                  </>
                ) : (
                  <button className="font-semibold text-[#62a8ff] hover:text-[#8ec2ff]" onClick={() => setMode("login")}>
                    {t.title}
                  </button>
                )}
              </p>
            </div>

            <div className="mt-8 space-y-5">
              <label className="space-y-2 text-sm font-bold text-white">
                {t.role}
                <Select
                  value={role}
                  onChange={(event) => setRole(event.target.value as Role)}
                  className="border-[#2a2d36] bg-[#17191f] text-white shadow-none focus-visible:ring-[#3c82f6]"
                >
                  {t.roles.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </Select>
              </label>

              {mode === "register" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-bold text-white">
                    {t.company}
                    <Input value={company} onChange={(event) => setCompany(event.target.value)} className="border-[#2a2d36] bg-[#17191f] text-white shadow-none focus-visible:ring-[#3c82f6]" />
                  </label>
                  <label className="space-y-2 text-sm font-bold text-white">
                    {t.fullName}
                    <Input value={fullName} onChange={(event) => setFullName(event.target.value)} className="border-[#2a2d36] bg-[#17191f] text-white shadow-none focus-visible:ring-[#3c82f6]" />
                  </label>
                </div>
              ) : null}

              <label className="space-y-2 text-sm font-bold text-white">
                {t.email}
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#697080]" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="border-[#2a2d36] bg-[#17191f] pl-9 text-white shadow-none placeholder:text-[#697080] focus-visible:ring-[#3c82f6]"
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm font-bold text-white">
                {t.password}
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-[#697080]" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="border-[#2a2d36] bg-[#17191f] pl-9 pr-9 text-white shadow-none placeholder:text-[#697080] focus-visible:ring-[#3c82f6]"
                  />
                  <Eye className="absolute right-3 top-3 h-4 w-4 text-[#697080]" />
                </div>
              </label>

              {mode === "login" ? (
                <div className="flex items-center justify-between text-sm text-[#9aa1ae]">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#3a3d47] bg-[#17191f]" />
                    {t.remember}
                  </label>
                  <button className="font-semibold text-[#62a8ff] hover:text-[#8ec2ff]">{t.forgot}</button>
                </div>
              ) : null}

              <Button
                className="h-12 w-full border border-[#3d6fb5] bg-transparent text-[#62a8ff] shadow-none hover:bg-[#162235] hover:text-[#8ec2ff]"
                onClick={mode === "login" ? submitLogin : submitRegister}
              >
                {mode === "login" ? t.signIn : t.create}
              </Button>
            </div>

            <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-[#8f96a3]">
              <div className="flex items-center gap-2 font-semibold text-[#c7ccd6]">
                <ShieldCheck className="h-4 w-4 text-[#c9a84c]" />
                {hasSupabase ? t.configured : t.demo}
              </div>
              <p className="mt-1">{t.demoText}</p>
            </div>

            {result ? (
              <div className="mt-5 rounded-lg border border-[#2d6d53] bg-[#0e211b] p-4 text-sm text-[#d9fff0]">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  {result.type === "login" ? t.loginReady : t.verifyTitle}
                </div>
                <p className="mt-1 text-[#9ecfbd]">{result.type === "login" ? result.email : t.verifyBody}</p>
                <Button asChild className="mt-4 w-full bg-[#c9a84c] text-[#171104] hover:bg-[#b9973e]">
                  <Link href={dashboardHref}>{t.dashboard}</Link>
                </Button>
              </div>
            ) : null}
          </div>

          <div className="mt-12 grid grid-cols-3 items-center gap-6 opacity-40">
            {t.trust.map((item) => (
              <div key={item} className="text-center text-xs font-bold uppercase tracking-[0.18em] text-[#9aa1ae]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
