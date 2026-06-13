import Link from "next/link"
import { CheckCircle2, CreditCard, ShieldCheck, TimerReset } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { subscriptionPlans } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Subscription",
    title: "先試用 7 日，再決定是否成為 LBID Member。",
    intro: "完成 onboarding 後會自動建立 trial，送 10 paid tokens。Trial 到期後如未啟用訂閱，帳戶降回 Free/Guest，只能瀏覽 Directory 和基本 SR 資訊。",
    trial: "7 日試用",
    included: "完成 onboarding 即送 10 tokens",
    mvp: "MVP 階段以 admin 手動確認付款；之後可接 Stripe。",
    choose: "選擇方案",
    current: "目前狀態",
    expires: "Trial 到期日",
  },
  en: {
    badge: "Subscription",
    title: "Start with a 7-day trial, then become an LBID Member.",
    intro: "Completing onboarding creates a trial and grants 10 paid tokens. When the trial expires without an active subscription, the account falls back to Free/Guest browsing mode.",
    trial: "7-day trial",
    included: "Onboarding completion grants 10 tokens",
    mvp: "MVP uses admin payment confirmation; Stripe can be connected later.",
    choose: "Choose plan",
    current: "Current status",
    expires: "Trial ends",
  },
}

export default function SubscriptionPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="max-w-3xl">
        <Badge variant="gold">{t.badge}</Badge>
        <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
        <p className="mt-4 text-muted-foreground">{t.intro}</p>
      </section>

      <section className="mt-8 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="border-lgold/30 bg-lgold/10">
          <CardHeader>
            <TimerReset className="h-5 w-5 text-lgold" />
            <CardTitle>{t.current}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Metric label="Status" value="Trial" />
            <Metric label={t.expires} value="2026-06-19" />
            <Metric label="Tokens" value="10 paid + 8 free" />
            <p className="rounded-lg border border-lgold/30 bg-white/60 p-3 text-sm text-lblue">{t.mvp}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {subscriptionPlans.map((plan) => (
            <Card key={plan.id} className="border-white/10 bg-white/[0.055]">
              <CardHeader>
                <CreditCard className="h-5 w-5 text-lgold" />
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-3xl font-black text-lblue">{plan.price}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t.trial} · {plan.includedTokens} tokens</div>
                </div>
                <div className="space-y-2">
                  {plan.perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-lgold" />
                      {perk}
                    </div>
                  ))}
                </div>
                <Button asChild className="w-full" variant="gold">
                  <Link href={`/${locale}/profile`}>
                    <ShieldCheck className="h-4 w-4" />
                    {t.choose}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-black text-lblue">{value}</div>
    </div>
  )
}
