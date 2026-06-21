"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2, Crown, Gem, PartyPopper, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

export default function SubscriptionPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const prefix = `/${locale}`
  const [busy, setBusy] = useState<"monthly" | "annual" | "portal" | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const t = locale === "zh"
    ? { badge: "會員方案", title: "為公司選擇合適的會員方案", intro: "付款由 Stripe 安全處理；確認後，LBID 會自動更新你的會員權限。", trial: "7 天試用", tokens: "5 個免費 Token", monthly: "月費會員", annual: "年費會員", monthlyPrice: "HKD 388 / 月", annualPrice: "HKD 3,880 / 年", checkout: "安全付款", managing: "正在建立付款...", portal: "管理訂閱", successTitle: "升級成功，歡迎加入 LBID。", successBody: "你的付款已收到，會員權限正由安全付款系統確認。完成後，你的公司帳戶會立即享有相應功能。", continue: "返回工作台", openProfile: "查看公司檔案", error: "未能建立付款。請確認你已登入，並完成 Stripe 設定。" }
    : { badge: "Membership", title: "Choose a membership for your company", intro: "Payments are handled securely by Stripe. LBID updates access automatically after confirmation.", trial: "7-day trial", tokens: "5 free tokens", monthly: "Monthly member", annual: "Annual member", monthlyPrice: "HKD 388 / month", annualPrice: "HKD 3,880 / year", checkout: "Secure checkout", managing: "Creating checkout...", portal: "Manage subscription", successTitle: "Welcome to your upgraded LBID membership.", successBody: "We have received your payment. Your membership is being confirmed securely and the corresponding access will activate automatically.", continue: "Return to workspace", openProfile: "View company profile", error: "Checkout could not be created. Confirm you are signed in and Stripe is configured." }

  useEffect(() => setSuccess(window.location.search.includes("checkout=success")), [])

  async function checkout(planId: "monthly" | "annual") {
    setBusy(planId); setError("")
    const { response, body } = await apiJson("/api/subscriptions/checkout", { method: "POST", body: JSON.stringify({ planId }) })
    if (response.ok && body.checkout_url) window.location.assign(body.checkout_url)
    else { setBusy(null); setError(body.error || t.error) }
  }
  async function openPortal() {
    setBusy("portal"); setError("")
    const { response, body } = await apiJson("/api/subscriptions/portal", { method: "POST" })
    if (response.ok && body.url) window.location.assign(body.url)
    else { setBusy(null); setError(body.error || t.error) }
  }

  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10">{success ? <section className="mx-auto max-w-2xl py-12 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fcf2ce] text-[#9a7517]"><PartyPopper className="h-8 w-8" /></div><Badge className="mt-6" variant="gold">LBID MEMBER</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.successTitle}</h1><p className="mx-auto mt-4 max-w-xl leading-7 text-slate-600">{t.successBody}</p><div className="mt-8 flex justify-center gap-3"><Button asChild><Link href={`${prefix}/dashboard`}>{t.continue}<ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link href={`${prefix}/profile`}>{t.openProfile}</Link></Button></div></section> : <><section className="max-w-3xl border-b border-lblue/10 pb-7"><Badge variant="gold">{t.badge}</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title}</h1><p className="mt-3 text-slate-600">{t.intro}</p></section><section className="mt-7 grid gap-5 lg:grid-cols-[.72fr_1fr_1fr]"><Card className="bg-slate-50"><CardHeader><ShieldCheck className="h-6 w-6 text-lblue" /><CardTitle>{t.trial}</CardTitle></CardHeader><CardContent className="text-sm leading-6 text-slate-600">{t.tokens}</CardContent></Card><PlanCard icon={Crown} name={t.monthly} price={t.monthlyPrice} busy={busy === "monthly"} onClick={() => checkout("monthly")} button={t.checkout} managing={t.managing} featured /><PlanCard icon={Gem} name={t.annual} price={t.annualPrice} busy={busy === "annual"} onClick={() => checkout("annual")} button={t.checkout} managing={t.managing} /></section><div className="mt-6"><Button variant="outline" disabled={busy !== null} onClick={openPortal}>{busy === "portal" ? t.managing : t.portal}</Button></div>{error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}</>}</main>
}

function PlanCard({ icon: Icon, name, price, busy, onClick, button, managing, featured = false }: { icon: typeof Crown; name: string; price: string; busy: boolean; onClick: () => void; button: string; managing: string; featured?: boolean }) { return <Card className={featured ? "border-[#c9a84c]" : ""}><CardHeader><Icon className="h-6 w-6 text-[#a17e22]" /><CardTitle>{name}</CardTitle></CardHeader><CardContent><p className="text-2xl font-semibold text-lblue">{price}</p><div className="mt-5 space-y-2 text-sm text-slate-600"><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Sealed bid access</p><p className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Company workflow tools</p></div><Button className="mt-6 w-full" variant={featured ? "gold" : "outline"} disabled={busy} onClick={onClick}>{busy ? managing : button}</Button></CardContent></Card> }
