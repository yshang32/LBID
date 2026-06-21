"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type AuthResult = { type: "register" | "login"; email: string; href: string } | null

const copy = {
  zh: {
    signIn: "登入 LBID", create: "建立公司帳戶", title: "公平的物流協作，從一個清楚的開始。",
    body: "為海外 Agency 與香港 Forwarder 建立有時限、可比較、可追溯的 sealed bidding workflow。",
    pointOne: "所有報價在截標前保持保密", pointTwo: "訂單、文件與追蹤留在同一工作區",
    newUser: "第一次使用？", start: "建立帳戶", back: "返回登入", email: "工作電郵", password: "密碼", company: "公司名稱", name: "聯絡人姓名",
    capability: "公司能力", client: "Client：建立需求", forwarder: "Forwarder：承接需求", both: "同時啟用兩種能力",
    submitLogin: "登入工作台", submitCreate: "建立帳戶", working: "處理中...", forgot: "忘記密碼？",
    trust: "您的資料會以 Supabase Auth 安全管理。", success: "帳戶已準備好", go: "前往工作台", continue: "繼續設定", error: "暫時未能完成，請再試一次。", language: "English",
  },
  en: {
    signIn: "Sign in to LBID", create: "Create a company account", title: "Fairer logistics collaboration begins with a clear process.",
    body: "A timed, comparable and traceable sealed-bid workflow for Southeast Asian agencies and Hong Kong forwarders.",
    pointOne: "Quotes remain private before the window closes", pointTwo: "Orders, documents and tracking stay in one workspace",
    newUser: "New to LBID?", start: "Create account", back: "Back to sign in", email: "Work email", password: "Password", company: "Company name", name: "Contact person",
    capability: "Company capabilities", client: "Client: create requests", forwarder: "Forwarder: bid on requests", both: "Enable both capabilities",
    submitLogin: "Enter workspace", submitCreate: "Create account", working: "Working...", forgot: "Forgot password?",
    trust: "Your account is securely managed through Supabase Auth.", success: "Your account is ready", go: "Enter workspace", continue: "Continue setup", error: "We could not complete that request. Please try again.", language: "中文",
  },
}

copy.zh = {
  signIn: "登入 LBID",
  create: "建立公司帳戶",
  title: "用清晰流程，建立更公平的物流合作。",
  body: "為東南亞 Agency 與香港 Forwarder 提供限時、可比較、可追蹤的 sealed bid 工作流。",
  pointOne: "截標前報價保持私密，避免惡性壓價",
  pointTwo: "訂單、文件、追蹤都留在同一個工作區",
  newUser: "第一次使用 LBID？",
  start: "建立帳戶",
  back: "返回登入",
  email: "工作電郵",
  password: "密碼",
  company: "公司名稱",
  name: "聯絡人",
  capability: "公司能力",
  client: "Client：建立需求",
  forwarder: "Forwarder：接單投標",
  both: "同時啟用兩種能力",
  submitLogin: "進入工作區",
  submitCreate: "建立帳戶",
  working: "處理中...",
  forgot: "忘記密碼？",
  trust: "你的帳戶由 Supabase Auth 安全管理。",
  success: "帳戶已建立",
  go: "進入工作區",
  continue: "繼續設定",
  error: "暫時未能完成操作，請稍後再試。",
  language: "English",
}

export default function LocalizedAuthPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const router = useRouter()
  const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const [mode, setMode] = useState<"login" | "register">("login")
  const [company, setCompany] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [result, setResult] = useState<AuthResult>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const canBeClient = true
  const canBeForwarder = true

  async function getProfileDashboardHref() {
    const { response, body } = await apiJson("/api/company-profile")
    if (!response.ok || !body.companyProfile) return `/${locale}/onboarding`
    return body.role === "admin" ? `/${locale}/dashboard?mode=admin` : `/${locale}/dashboard`
  }

  async function submit() {
    if (!email || !password || (mode === "register" && (!company || !fullName))) return
    setLoading(true); setError("")
    const supabase = getSupabaseBrowserClient()

    if (mode === "login") {
      if (supabase) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
        if (signInError) { setError(signInError.message); setLoading(false); return }
        const href = await getProfileDashboardHref()
        setResult({ type: "login", email, href }); setLoading(false); router.push(href); return
      }
      const href = `/${locale}/dashboard`
      setResult({ type: "login", email, href }); setLoading(false); router.push(href); return
    }

    if (supabase) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { company_name: company, full_name: fullName, can_be_client: canBeClient, can_be_forwarder: canBeForwarder } } })
      if (signUpError) { setError(signUpError.message); setLoading(false); return }
      const { response, body } = await apiJson("/api/auth/bootstrap", { method: "POST", body: JSON.stringify({ companyName: company, fullName, canBeClient, canBeForwarder }) })
      if (!response.ok && body.error !== "NO_ACTIVE_SESSION") { setError(body.error || t.error); setLoading(false); return }
    }
    const href = hasSupabase ? `/${locale}/onboarding` : `/${locale}/dashboard`
    setResult({ type: "register", email, href }); setLoading(false); router.push(href)
  }

  const otherLocale = locale === "zh" ? "en" : "zh"
  return (
    <main className="min-h-screen bg-white text-lblue">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href={`/${locale}`} aria-label="LBID home"><BrandMark markClassName="h-12 w-[180px]" /></Link><Link href={`/${otherLocale}/auth`} className="text-sm font-semibold text-slate-500 hover:text-lblue">{t.language}</Link></header>
      <section className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.8fr] lg:items-center lg:pt-16">
        <div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#957726]">LBID / SEA × HONG KONG</p><h1 className="mt-5 text-4xl font-semibold leading-[1.13] tracking-tight text-lblue sm:text-6xl">{t.title}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{t.body}</p><div className="mt-10 space-y-4 border-l border-lgold/60 pl-5 text-sm text-slate-600"><div className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#a17e22]" />{t.pointOne}</div><div className="flex gap-3"><CheckCircle2 className="h-5 w-5 shrink-0 text-[#a17e22]" />{t.pointTwo}</div></div></div>
        <section className="w-full max-w-md justify-self-end rounded-lg border border-lblue/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="flex items-center justify-between"><div><h2 className="text-2xl font-semibold text-lblue">{mode === "login" ? t.signIn : t.create}</h2><p className="mt-2 text-sm text-slate-500">{mode === "login" ? t.newUser : t.back}</p></div><button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError("") }} className="text-sm font-semibold text-lblue underline decoration-lgold underline-offset-4">{mode === "login" ? t.start : t.signIn}</button></div>
          <div className="mt-8 space-y-5">
            {mode === "register" ? <><label className="block text-sm font-semibold text-slate-700">{t.company}<Input className="mt-2" value={company} onChange={(event) => setCompany(event.target.value)} /></label><label className="block text-sm font-semibold text-slate-700">{t.name}<Input className="mt-2" value={fullName} onChange={(event) => setFullName(event.target.value)} /></label><div className="rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm leading-6 text-slate-600">Your company account can create shipment requests and submit bids. You can adjust these capabilities later in company settings.</div></> : null}
            <label className="block text-sm font-semibold text-slate-700">{t.email}<div className="relative mt-2"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div></label>
            <label className="block text-sm font-semibold text-slate-700">{t.password}<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div></label>
            {mode === "login" ? <button type="button" className="text-sm font-medium text-slate-500 hover:text-lblue">{t.forgot}</button> : null}
            <Button className="h-11 w-full" disabled={loading} onClick={submit}>{loading ? t.working : mode === "login" ? t.submitLogin : t.submitCreate}<ArrowRight className="h-4 w-4" /></Button>
            {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
            <div className="flex gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#a17e22]" />{t.trust}</div>
            {result ? <Link href={result.href} className="block rounded-md bg-[#edf7f4] p-3 text-sm font-semibold text-[#087765]">{result.type === "login" ? t.go : t.continue}</Link> : null}
          </div>
        </section>
      </section>
    </main>
  )
}
