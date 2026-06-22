"use client"

import { useEffect, useState } from "react"
import { Banknote, CheckCircle2, Clock3, CreditCard, ExternalLink, Loader2, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type Payment = { id: string; company_name?: string | null; email?: string | null; type: string; payment_method: string; amount: number; currency: string; fps_reference?: string | null; proof_url?: string | null; related_plan?: { plan_id?: string } | null; related_token_package?: { tokens?: number } | null }

const text = {
  zh: { badge: "ADMIN / PAYMENT REVIEW", title: "確認真實付款，不使用示例資料。", intro: "此頁只顯示仍待確認的 FPS、PayMe 或 Stripe payment intent。確認後才會發放會員資格或 Token。", empty: "目前沒有待確認付款。", loading: "正在讀取付款資料", confirm: "確認付款", reject: "拒絕付款", proof: "查看憑證", type: "類型", method: "付款方式", amount: "金額", effect: "生效項目", error: "未能處理付款。", confirmed: "已確認", rejected: "已拒絕" },
  en: { badge: "ADMIN / PAYMENT REVIEW", title: "Review real payments, never demo records.", intro: "Only pending FPS, PayMe or Stripe payment intents appear here. Membership or token access is granted only after confirmation.", empty: "No payments require review.", loading: "Loading payments", confirm: "Confirm payment", reject: "Reject payment", proof: "View proof", type: "Type", method: "Method", amount: "Amount", effect: "Effect", error: "Payment could not be processed.", confirmed: "Confirmed", rejected: "Rejected" },
}

export default function PendingPaymentsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = text[locale]
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [result, setResult] = useState<Record<string, "confirmed" | "rejected">>({})

  useEffect(() => {
    let cancelled = false
    apiJson("/api/admin/pending-payments").then(({ response, body }) => {
      if (cancelled) return
      if (!response.ok) setError(body.error || t.error)
      else setPayments(Array.isArray(body.paymentIntents) ? body.paymentIntents : [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [t.error])

  async function review(payment: Payment, action: "confirm" | "reject") {
    setBusy(payment.id)
    setError("")
    const { response, body } = await apiJson("/api/admin/pending-payments", { method: "POST", body: JSON.stringify({ action, paymentIntentId: payment.id }) })
    setBusy("")
    if (!response.ok) {
      setError(body.error || t.error)
      return
    }
    setResult((current) => ({ ...current, [payment.id]: action === "confirm" ? "confirmed" : "rejected" }))
    setPayments((current) => current.filter((item) => item.id !== payment.id))
  }

  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="border-b border-lblue/10 pb-7"><Badge variant="gold">{t.badge}</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{t.intro}</p></section>
    {loading ? <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{t.loading}</div> : error ? <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : payments.length === 0 ? <p className="mt-8 border border-dashed border-lblue/15 bg-white p-10 text-center text-sm text-slate-500">{t.empty}</p> : <section className="mt-6 space-y-3">{payments.map((payment) => <Card key={payment.id}><CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle>{payment.company_name || payment.email || "LBID member"}</CardTitle><p className="mt-1 font-mono text-xs text-slate-500">{payment.fps_reference || payment.id}</p></div><Badge variant="gold"><Clock3 className="mr-1 h-3 w-3" />Pending</Badge></div></CardHeader><CardContent className="grid gap-4 lg:grid-cols-[1fr_auto]"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Metric icon={CreditCard} label={t.type} value={payment.type} /><Metric icon={Banknote} label={t.method} value={payment.payment_method?.toUpperCase() || "-"} /><Metric icon={CreditCard} label={t.amount} value={`${payment.currency || "HKD"} ${Number(payment.amount || 0).toLocaleString()}`} /><Metric icon={CheckCircle2} label={t.effect} value={payment.type === "token_purchase" ? `+${payment.related_token_package?.tokens || 0} tokens` : payment.related_plan?.plan_id || "subscription"} /></div><div className="flex flex-wrap items-end gap-2">{payment.proof_url ? <Button asChild variant="outline"><a href={payment.proof_url} target="_blank" rel="noreferrer">{t.proof}<ExternalLink className="h-4 w-4" /></a></Button> : null}<Button variant="outline" disabled={busy === payment.id} onClick={() => review(payment, "reject")}><XCircle className="h-4 w-4" />{t.reject}</Button><Button variant="gold" disabled={busy === payment.id} onClick={() => review(payment, "confirm")}>{busy === payment.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{t.confirm}</Button></div></CardContent></Card>)}</section>}
  </main>
}

function Metric({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) {
  return <div className="border border-lblue/10 bg-slate-50 p-3"><Icon className="h-4 w-4 text-lgold" /><div className="mt-2 text-xs text-slate-500">{label}</div><div className="mt-1 break-words text-sm font-semibold text-lblue">{value}</div></div>
}
