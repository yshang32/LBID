"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Mode = "login" | "register" | "reset" | "update"

export default function AuthPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [company, setCompany] = useState("")
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const isChinese = locale === "zh"
  const t = isChinese
    ? { signIn: "登入 LBID", create: "建立公司帳戶", reset: "重設密碼", update: "設定新密碼", title: "以公平、可追溯的方式處理物流合作。", body: "LBID 讓海外物流公司與香港 Forwarder 以密封報價完成需求、比較、配對及訂單管理。", email: "工作電郵", password: "密碼", company: "公司名稱", name: "聯絡人姓名", login: "登入工作台", register: "建立帳戶", forgot: "忘記密碼？", back: "返回登入", sendReset: "發送重設連結", savePassword: "更新密碼", working: "處理中...", new: "第一次使用？", have: "已有帳戶？", toCreate: "建立帳戶", toLogin: "登入", resetBody: "輸入你的工作電郵，我們會發送安全的密碼重設連結。", updateBody: "請設定一個新的安全密碼，然後重新登入。", resetSent: "如這個電郵已註冊，我們已發送密碼重設連結。", updated: "密碼已更新，請使用新密碼登入。", confirm: "帳戶建立成功。請查看電郵並完成驗證後登入。", trust: "帳戶驗證與登入由 Supabase Auth 安全處理。", language: "English", capability: "同一公司帳戶可同時建立需求及提交密封報價。" }
    : { signIn: "Sign in to LBID", create: "Create company account", reset: "Reset password", update: "Set a new password", title: "A fairer, traceable logistics workflow.", body: "LBID connects overseas agencies and Hong Kong forwarders through sealed bidding, clear comparison and one operational record.", email: "Work email", password: "Password", company: "Company name", name: "Contact person", login: "Enter workspace", register: "Create account", forgot: "Forgot password?", back: "Back to sign in", sendReset: "Send reset link", savePassword: "Update password", working: "Working...", new: "New to LBID?", have: "Already have an account?", toCreate: "Create account", toLogin: "Sign in", resetBody: "Enter your work email and we will send a secure password reset link.", updateBody: "Choose a new secure password, then sign in again.", resetSent: "If this email is registered, we have sent a password reset link.", updated: "Password updated. Please sign in with your new password.", confirm: "Account created. Check your email and complete verification before signing in.", trust: "Account authentication is securely handled by Supabase Auth.", language: "繁中", capability: "One company account can create requests and submit sealed bids." }

  useEffect(() => {
    const query = window.location.search
    if (query.includes("mode=register")) setMode("register")
    if (query.includes("mode=update") || query.includes("type=recovery")) setMode("update")
  }, [])

  async function getNextHref() {
    const { response, body } = await apiJson("/api/company-profile")
    if (!response.ok || !body.companyProfile || !body.companyProfile.onboarding_completed) return `/${locale}/onboarding`
    return body.role === "admin" ? `/${locale}/dashboard?mode=admin` : `/${locale}/dashboard`
  }

  async function submit() {
    setError(""); setNotice(""); setLoading(true)
    const supabase = getSupabaseBrowserClient()
    if (!supabase) { setError("SUPABASE_NOT_CONFIGURED"); setLoading(false); return }

    if (mode === "reset") {
      if (!email) { setError(t.email); setLoading(false); return }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/${locale}/auth?mode=update` })
      setLoading(false)
      if (resetError) setError(resetError.message); else setNotice(t.resetSent)
      return
    }
    if (mode === "update") {
      if (password.length < 8) { setError(isChinese ? "密碼至少需要 8 個字元。" : "Password must be at least 8 characters."); setLoading(false); return }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      setLoading(false)
      if (updateError) setError(updateError.message); else { setNotice(t.updated); setMode("login"); setPassword("") }
      return
    }
    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) { setError(loginError.message); setLoading(false); return }
      const href = await getNextHref()
      setLoading(false); router.push(href)
      return
    }
    if (!company.trim() || !fullName.trim() || !email || password.length < 8) { setError(isChinese ? "請填寫所有欄位，密碼至少 8 個字元。" : "Complete all fields and use a password of at least 8 characters."); setLoading(false); return }
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/${locale}/auth`, data: { company_name: company, full_name: fullName } } })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (!data.session) { setLoading(false); setNotice(t.confirm); return }
    const { response, body } = await apiJson("/api/auth/bootstrap", { method: "POST", body: JSON.stringify({ companyName: company, fullName }) })
    setLoading(false)
    if (!response.ok) { setError(body.error || "ACCOUNT_BOOTSTRAP_FAILED"); return }
    router.push(`/${locale}/onboarding`)
  }

  const switchMode = (next: Mode) => { setMode(next); setError(""); setNotice(""); setPassword("") }
  const otherLocale = locale === "zh" ? "en" : "zh"
  const isFormMode = mode === "login" || mode === "register"
  const heading = mode === "login" ? t.signIn : mode === "register" ? t.create : mode === "reset" ? t.reset : t.update

  return <main className="min-h-screen bg-white text-lblue"><header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8"><Link href={`/${locale}/auth`} aria-label="LBID"><BrandMark markClassName="h-12 w-[180px]" /></Link><Link href={`/${otherLocale}/auth`} className="text-sm font-semibold text-slate-500 hover:text-lblue">{t.language}</Link></header><section className="mx-auto grid max-w-7xl gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_.8fr] lg:items-center lg:pt-16"><div className="max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#957726]">LBID / SEA × HONG KONG</p><h1 className="mt-5 text-4xl font-semibold leading-[1.13] tracking-tight text-lblue sm:text-6xl">{t.title}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">{t.body}</p><div className="mt-10 border-l border-[#c9a84c] pl-5 text-sm leading-7 text-slate-600">{t.capability}</div></div><section className="w-full max-w-md justify-self-end rounded-lg border border-lblue/10 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8"><div className="flex items-start justify-between gap-4"><div><h2 className="text-2xl font-semibold text-lblue">{heading}</h2><p className="mt-2 text-sm text-slate-500">{mode === "reset" ? t.resetBody : mode === "update" ? t.updateBody : mode === "login" ? t.new : t.have}</p></div>{!isFormMode ? <Button variant="ghost" size="sm" onClick={() => switchMode("login")}><ArrowLeft className="h-4 w-4" />{t.back}</Button> : <button type="button" onClick={() => switchMode(mode === "login" ? "register" : "login")} className="shrink-0 text-sm font-semibold text-lblue underline decoration-[#c9a84c] underline-offset-4">{mode === "login" ? t.toCreate : t.toLogin}</button>}</div><div className="mt-8 space-y-5">{mode === "register" ? <><Field label={t.company}><Input value={company} onChange={(event) => setCompany(event.target.value)} /></Field><Field label={t.name}><Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></Field></> : null}{mode !== "update" ? <Field label={t.email}><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" /></div></Field> : null}{mode !== "reset" ? <Field label={t.password}><div className="relative"><LockKeyhole className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input className="pl-9" type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></div></Field> : null}{mode === "login" ? <button type="button" onClick={() => switchMode("reset")} className="text-sm font-medium text-slate-500 hover:text-lblue">{t.forgot}</button> : null}<Button className="h-11 w-full" disabled={loading} onClick={submit}>{loading ? t.working : mode === "login" ? t.login : mode === "register" ? t.register : mode === "reset" ? t.sendReset : t.savePassword}{mode === "reset" ? <KeyRound className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</Button>{error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}{notice ? <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">{notice}</p> : null}<div className="flex gap-2 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#a17e22]" />{t.trust}</div></div></section></section></main>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">{label}</span>{children}</label> }
