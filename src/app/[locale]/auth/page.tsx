"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Mode = "login" | "register" | "reset" | "update"

const copy = {
  zh: {
    signIn: "登入", create: "建立帳戶", company: "公司名稱", contact: "聯絡人姓名", email: "工作電郵", password: "密碼", confirm: "確認密碼",
    forgot: "忘記密碼？", reset: "重設密碼", resetBody: "輸入你的工作電郵，我們會寄出安全的重設連結。", send: "發送重設連結", cancel: "返回登入",
    update: "設定新密碼", updateBody: "設定新密碼後重新登入。", save: "更新密碼", enter: "進入工作台", register: "建立公司帳戶",
    new: "還未有 LBID 帳戶？", have: "已經有帳戶？", back: "返回登入", terms: "建立帳戶即代表你同意 LBID 的服務條款與私隱政策。",
    resetSent: "如該電郵已註冊，我們已寄出重設連結。", updated: "密碼已更新，請重新登入。", confirmSent: "帳戶已建立。請先完成電郵驗證。",
    needs: "請填寫所有必填欄位，密碼最少 8 個字元。", mismatch: "兩次輸入的密碼不一致。", secure: "LBID 使用 Supabase Auth 保護你的帳戶。", language: "English",
  },
  en: {
    signIn: "Sign In", create: "Create Account", company: "Company Name", contact: "Contact Name", email: "Work Email", password: "Password", confirm: "Confirm Password",
    forgot: "Forgot password?", reset: "Reset your password", resetBody: "Enter your work email and we will send a secure reset link.", send: "Send Reset Link", cancel: "Back to sign in",
    update: "Set a new password", updateBody: "Choose a new secure password, then sign in again.", save: "Update Password", enter: "Enter Workspace", register: "Create Company Account",
    new: "New to LBID?", have: "Already have an account?", back: "Back to sign in", terms: "By registering you agree to LBID's Terms of Service and Privacy Policy.",
    resetSent: "If the account exists, a reset link has been sent.", updated: "Password updated. Please sign in again.", confirmSent: "Account created. Complete email verification before signing in.",
    needs: "Complete all fields and use a password of at least 8 characters.", mismatch: "Passwords do not match.", secure: "Authentication is securely handled by Supabase Auth.", language: "中文",
  },
} as const

export default function AuthPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
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

  const resetState = () => { setError(""); setNotice(""); setPassword(""); setConfirm("") }
  const switchMode = (next: Mode) => { resetState(); setMode(next) }

  async function workspaceHref() {
    const { response, body } = await apiJson("/api/company-profile")
    if (!response.ok || !body.companyProfile?.onboarding_completed) return `/${locale}/onboarding`
    return body.role === "admin" ? `/${locale}/dashboard?mode=admin` : `/${locale}/dashboard`
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    resetState()
    const supabase = getSupabaseBrowserClient()
    if (!supabase) { setError("SUPABASE_NOT_CONFIGURED"); return }
    if (mode === "register" && (!company.trim() || !name.trim() || !email || password.length < 8)) { setError(t.needs); return }
    if (mode === "register" && password !== confirm) { setError(t.mismatch); return }
    if (mode === "login" && (!email || !password)) { setError(t.needs); return }
    if (mode === "update" && password.length < 8) { setError(t.needs); return }
    setLoading(true)
    if (mode === "reset") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/${locale}/auth?mode=update` })
      setLoading(false)
      if (resetError) setError(resetError.message); else setNotice(t.resetSent)
      return
    }
    if (mode === "update") {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      setLoading(false)
      if (updateError) setError(updateError.message); else { setNotice(t.updated); setMode("login") }
      return
    }
    if (mode === "login") {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (loginError) { setLoading(false); setError(loginError.message); return }
      const href = await workspaceHref()
      setLoading(false)
      router.push(href)
      return
    }
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/${locale}/auth`, data: { company_name: company, full_name: name } } })
    if (signUpError) { setLoading(false); setError(signUpError.message); return }
    if (!data.session) { setLoading(false); setNotice(t.confirmSent); return }
    const bootstrap = await apiJson("/api/auth/bootstrap", { method: "POST", body: JSON.stringify({ companyName: company, fullName: name }) })
    setLoading(false)
    if (!bootstrap.response.ok) { setError(bootstrap.body.error || "ACCOUNT_BOOTSTRAP_FAILED"); return }
    router.push(`/${locale}/onboarding`)
  }

  const heading = mode === "login" ? t.signIn : mode === "register" ? t.create : mode === "reset" ? t.reset : t.update
  const isPasswordMode = mode === "login" || mode === "register" || mode === "update"

  return <main className="min-h-screen bg-[linear-gradient(150deg,#f0f2f8_0%,#eceef5_100%)] px-5 py-10 text-[#172038] sm:px-6">
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-[420px] flex-col justify-center">
      <div className="mb-5 flex h-[112px] justify-center overflow-hidden"><img src="/assets/lbid-figma-25jun-logo.png?v=20260625" alt="LBID Logistics Bidding Platform" className="-mt-9 block h-auto w-[360px] select-none mix-blend-multiply" draggable={false} /></div>
      <section className="overflow-hidden rounded-[20px] border border-[#dfe4ed] bg-white shadow-[0_8px_40px_rgba(0,0,0,.09),0_2px_8px_rgba(0,0,0,.05)]">
        <div className="h-[3px] bg-[linear-gradient(90deg,#0c1a3e_0%,#1e3a7a_55%,#c49a3c_100%)]" />
        {mode === "login" || mode === "register" ? <div className="flex border-b border-[#dfe4ed]"><Tab active={mode === "login"} onClick={() => switchMode("login")}>{t.signIn}</Tab><Tab active={mode === "register"} onClick={() => switchMode("register")}>{t.create}</Tab></div> : null}
        <AnimatePresence mode="wait"><motion.form key={mode} onSubmit={submit} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: .22, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col gap-4 p-7">
          {mode === "reset" || mode === "update" ? <div><h1 className="text-[16px] font-semibold text-[#172038]">{heading}</h1><p className="mt-1 text-[13px] text-[#8c98ac]">{mode === "reset" ? t.resetBody : t.updateBody}</p></div> : null}
          {mode === "register" ? <><Field label={t.company}><input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Pacific Forward Ltd." className="auth-input" autoFocus /></Field><Field label={t.contact}><input value={name} onChange={(event) => setName(event.target.value)} placeholder="Kenny Lam" className="auth-input" /></Field></> : null}
          {mode !== "update" ? <Field label={t.email}><input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" type="email" className="auth-input" autoFocus={mode !== "register"} required /></Field> : null}
          {isPasswordMode ? <Field label={t.password}><div className="relative"><input value={password} onChange={(event) => setPassword(event.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "Your password"} type={showPassword ? "text" : "password"} className="auth-input pr-10" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8c98ac] transition hover:text-[#172038]" aria-label="Toggle password visibility">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></Field> : null}
          {mode === "register" ? <Field label={t.confirm}><input value={confirm} onChange={(event) => setConfirm(event.target.value)} placeholder="Repeat password" type="password" className="auth-input" required /></Field> : null}
          {mode === "login" ? <div className="flex justify-end -mt-1"><button type="button" onClick={() => switchMode("reset")} className="text-[12px] font-medium text-[#0c1a3e] underline-offset-2 transition hover:underline">{t.forgot}</button></div> : null}
          <button disabled={loading} type="submit" className="mt-1 w-full rounded-xl bg-[#0c1a3e] py-3.5 text-[13.5px] font-semibold tracking-[.01em] text-white transition duration-200 hover:-translate-y-px hover:bg-[#172d63] hover:shadow-[0_6px_20px_rgba(12,26,62,.26)] disabled:cursor-not-allowed disabled:opacity-60">{loading ? "Working…" : mode === "login" ? t.enter : mode === "register" ? t.register : mode === "reset" ? t.send : t.save}</button>
          {mode === "reset" || mode === "update" ? <button type="button" onClick={() => switchMode("login")} className="text-center text-[12.5px] font-medium text-[#8c98ac] transition hover:text-[#172038]">{t.cancel}</button> : null}
          {mode === "register" ? <p className="text-center text-[11.5px] leading-relaxed text-[#8c98ac]">{t.terms}</p> : null}
          {error ? <Feedback error>{error}</Feedback> : null}{notice ? <Feedback>{notice}</Feedback> : null}
        </motion.form></AnimatePresence>
      </section>
      <div className="mt-5 flex items-start justify-center gap-2 text-center text-[11.5px] text-[#8c98ac]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#198754]" />{t.secure}</div>
      <Link href={`/${locale === "zh" ? "en" : "zh"}/auth`} className="mt-4 text-center text-[12px] font-medium text-[#0c1a3e] hover:underline">{t.language}</Link>
    </div>
  </main>
}

function Tab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) { return <button type="button" onClick={onClick} className={`flex-1 border-b-2 py-4 text-[13.5px] font-medium transition ${active ? "-mb-px border-[#0c1a3e] text-[#0c1a3e]" : "border-transparent text-[#8c98ac] hover:text-[#172038]"}`}>{children}</button> }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold tracking-[.02em] text-[#4c5870]">{label}{children}</label> }
function Feedback({ children, error = false }: { children: React.ReactNode; error?: boolean }) { return <p className={`flex items-start gap-2 rounded-xl border p-3 text-[12px] leading-5 ${error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>{error ? <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />}{children}</p> }
