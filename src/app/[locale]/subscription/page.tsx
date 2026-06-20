"use client"

import { useState } from "react"
import { CheckCircle2, Crown, Gem, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "會員方案", title: "選擇適合你公司的會員方案", intro: "付款由 Stripe 安全處理。成功後，會員權限會由 LBID webhook 自動更新。",
    current: "目前狀態", trial: "7 日體驗", token: "10 paid + 8 free tokens", choose: "前往安全付款", managing: "正在建立付款...", manage: "管理訂閱",
    observer: "觀察者", monthly: "月費會員", annual: "全年會員", recommended: "推薦", error: "未能建立付款，請先登入並確認 Stripe 已設定。",
    observerPrice: "免費", monthlyPrice: "HKD 388 / 月", annualPrice: "HKD 3,880 / 年",
    observerPerks: ["瀏覽公司目錄", "查看公開需求", "查看社群"],
    monthlyPerks: ["每月 5 個免費 Token", "提交 sealed bid", "報價單與訂單工作區"],
    annualPerks: ["全年會員資格", "VIP 徽章與優先展示", "較高完成訂單獎勵"],
  },
  en: {
    badge: "Membership", title: "Choose the membership that fits your company", intro: "Payments are handled securely by Stripe. LBID updates access automatically after the webhook is confirmed.",
    current: "Current status", trial: "7-day trial", token: "10 paid + 8 free tokens", choose: "Secure checkout", managing: "Creating checkout...", manage: "Manage subscription",
    observer: "Observer", monthly: "Monthly Member", annual: "Annual Member", recommended: "Recommended", error: "Checkout could not be created. Sign in and confirm Stripe is configured.",
    observerPrice: "Free", monthlyPrice: "HKD 388 / month", annualPrice: "HKD 3,880 / year",
    observerPerks: ["Browse the directory", "View public requests", "Join the community"],
    monthlyPerks: ["5 free tokens each month", "Submit sealed bids", "Quotation and order workspace"],
    annualPerks: ["Annual member status", "VIP badge and priority display", "Higher completion rewards"],
  },
}

export default function SubscriptionPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [busy, setBusy] = useState<"monthly" | "annual" | "portal" | null>(null)
  const [error, setError] = useState("")
  const plans = [
    { id: "observer", name: t.observer, price: t.observerPrice, icon: ShieldCheck, perks: t.observerPerks },
    { id: "monthly", name: t.monthly, price: t.monthlyPrice, icon: Crown, perks: t.monthlyPerks, recommended: true },
    { id: "annual", name: t.annual, price: t.annualPrice, icon: Gem, perks: t.annualPerks },
  ] as const

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

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="max-w-3xl"><Badge variant="gold">{t.badge}</Badge><h1 className="mt-3 text-4xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1><p className="mt-3 text-muted-foreground">{t.intro}</p></section>
      <section className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="border-lgold/30 bg-lgold/10"><CardHeader><ShieldCheck className="h-5 w-5 text-lgold" /><CardTitle>{t.current}</CardTitle></CardHeader><CardContent className="space-y-3"><Metric label="Status" value={t.trial} /><Metric label="Tokens" value={t.token} /><Button className="w-full" variant="outline" disabled={busy !== null} onClick={openPortal}>{busy === "portal" ? t.managing : t.manage}</Button></CardContent></Card>
        <div className="grid gap-4 md:grid-cols-3">{plans.map((plan) => <Card key={plan.id} className={plan.recommended ? "border-lgold/50" : ""}><CardHeader><div className="flex items-start justify-between gap-2"><plan.icon className="h-6 w-6 text-lgold" />{plan.recommended ? <Badge variant="gold">{t.recommended}</Badge> : null}</div><CardTitle>{plan.name}</CardTitle></CardHeader><CardContent className="space-y-4"><div className="text-2xl font-black text-lblue">{plan.price}</div>{plan.perks.map((perk) => <div key={perk} className="flex gap-2 text-sm"><CheckCircle2 className="h-4 w-4 shrink-0 text-teal-700" />{perk}</div>)}{plan.id !== "observer" ? <Button className="mt-3 w-full" variant={plan.recommended ? "gold" : "outline"} disabled={busy !== null} onClick={() => checkout(plan.id)}>{busy === plan.id ? t.managing : t.choose}</Button> : null}</CardContent></Card>)}</div>
      </section>
      {error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p> : null}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-md border border-lblue/10 bg-white/70 p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-1 text-xl font-black text-lblue">{value}</div></div> }
