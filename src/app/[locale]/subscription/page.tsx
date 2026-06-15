import { CheckCircle2, Eye, Gem, ShieldCheck, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Membership",
    title: "三層會員，將 FOMO 變成行動。",
    intro: "v4 會員制度由 Read-only 觀察者開始，逐步轉化成月費會員和年費 VIP。年費重點係身份和優先權，不是單純送更多 token。",
    current: "目前狀態",
    choose: "選擇方案",
    recommended: "建議",
    observer: "Read-only 觀察者",
    monthly: "月費會員",
    annual: "年費會員",
    custom: "待確認",
    trial: "7 日試用中",
    expires: "試用到期",
    included: "完成 onboarding 已獲 10 paid tokens",
  },
  en: {
    badge: "Membership",
    title: "Three tiers that turn FOMO into action.",
    intro: "v4 starts with Read-only observers, then converts them into monthly members and annual VIPs. Annual value is identity and priority, not simply more tokens.",
    current: "Current status",
    choose: "Choose plan",
    recommended: "Recommended",
    observer: "Read-only Observer",
    monthly: "Monthly Member",
    annual: "Annual Member",
    custom: "To confirm",
    trial: "7-day trial",
    expires: "Trial ends",
    included: "Onboarding completion granted 10 paid tokens",
  },
}

export default function SubscriptionPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const plans = [
    {
      name: t.observer,
      price: "$68-98/月",
      icon: Eye,
      perks: ["瀏覽 Directory", "瀏覽 SR 列表", "瀏覽 Community", "睇到但做唔到"],
      blocked: ["不可發 SR", "不可 Bid", "不上 Directory"],
    },
    {
      name: t.monthly,
      price: "$388/月",
      icon: ShieldCheck,
      recommended: true,
      perks: ["公司上 Directory", "每月 5 free tokens", "每月 10 個 SR 配額", "完成配對 +2 tokens", "Quotation / Rate Card / 文件工具"],
      blocked: [],
    },
    {
      name: t.annual,
      price: "$3,880/年",
      icon: Gem,
      perks: ["月費全部功能", "完成配對 +4 tokens", "VIP 金色 Badge", "Priority Bid 半價 / 免費", "Directory 排名加權"],
      blocked: [],
    },
  ]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="max-w-4xl">
        <Badge variant="gold">{t.badge}</Badge>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
        <p className="mt-3 text-muted-foreground">{t.intro}</p>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[.78fr_1.22fr]">
        <Card className="border-lgold/30 bg-lgold/10">
          <CardHeader>
            <ShieldCheck className="h-5 w-5 text-lgold" />
            <CardTitle>{t.current}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Metric label="Status" value={t.trial} />
            <Metric label={t.expires} value="2026-06-19" />
            <Metric label="Tokens" value="10 paid + 8 free" />
            <p className="rounded-md border border-lgold/30 bg-white/70 p-3 text-sm font-semibold text-lblue">{t.included}</p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.recommended ? "border-lgold/50 bg-white" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <plan.icon className="h-6 w-6 text-lgold" />
                  {plan.recommended ? <Badge variant="gold">{t.recommended}</Badge> : null}
                </div>
                <CardTitle>{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-3xl font-black text-lblue">{plan.price}</div>
                <div className="space-y-2">
                  {plan.perks.map((perk) => (
                    <div key={perk} className="flex gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      <span>{perk}</span>
                    </div>
                  ))}
                  {plan.blocked.map((perk) => (
                    <div key={perk} className="flex gap-2 text-sm text-muted-foreground">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full" variant={plan.recommended ? "gold" : "outline"}>{t.choose}</Button>
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
    <div className="rounded-md border border-lblue/10 bg-white/70 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-black text-lblue">{value}</div>
    </div>
  )
}
