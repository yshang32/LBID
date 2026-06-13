import { Banknote, CheckCircle2, Clock, CreditCard, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Pending Payments",
    title: "FPS / PayMe 手動付款確認。",
    intro: "MVP 階段由 Admin 檢查付款 reference 或 screenshot，再確認 subscription 或 token purchase。",
    confirm: "Confirm",
    reject: "Reject",
    pending: "Pending",
    method: "付款方式",
    amount: "金額",
    type: "類型",
    proof: "付款證明",
  },
  en: {
    badge: "Pending Payments",
    title: "Manual FPS / PayMe payment confirmation.",
    intro: "During MVP, Admin checks the payment reference or screenshot before confirming a subscription or token purchase.",
    confirm: "Confirm",
    reject: "Reject",
    pending: "Pending",
    method: "Method",
    amount: "Amount",
    type: "Type",
    proof: "Proof",
  },
}

const pendingPayments = [
  {
    id: "pi-demo-fps-sub",
    company: "HarbourLink Cargo",
    type: "subscription",
    method: "FPS",
    amount: "HKD 188",
    reference: "LBID-FPS-188-0612",
    proof: "fps-proof-demo.png",
  },
  {
    id: "pi-demo-payme-token",
    company: "Kowloon Gateway Logistics",
    type: "token_purchase",
    method: "PayMe",
    amount: "HKD 1,000",
    reference: "LBID-PAYME-1000-0612",
    proof: "payme-proof-demo.png",
  },
]

export default function PendingPaymentsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <Badge variant="gold">{t.badge}</Badge>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>

      <section className="mt-8 grid gap-4">
        {pendingPayments.map((payment) => (
          <Card key={payment.id} className="border-white/10 bg-white/[0.055]">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>{payment.company}</CardTitle>
                  <div className="mt-1 font-mono text-sm text-muted-foreground">{payment.reference}</div>
                </div>
                <Badge variant="gold">
                  <Clock className="mr-1 h-3 w-3" />
                  {t.pending}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="grid gap-3 md:grid-cols-4">
                <Metric icon={CreditCard} label={t.type} value={payment.type} />
                <Metric icon={Banknote} label={t.method} value={payment.method} />
                <Metric icon={CreditCard} label={t.amount} value={payment.amount} />
                <Metric icon={Clock} label={t.proof} value={payment.proof} />
              </div>
              <div className="flex gap-2">
                <Button variant="outline">
                  <XCircle className="h-4 w-4" />
                  {t.reject}
                </Button>
                <Button variant="gold">
                  <CheckCircle2 className="h-4 w-4" />
                  {t.confirm}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof CreditCard; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <Icon className="h-4 w-4 text-lgold" />
      <div className="mt-2 text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-bold text-lblue">{value}</div>
    </div>
  )
}
