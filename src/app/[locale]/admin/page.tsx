import Link from "next/link"
import { BarChart3, BadgeCheck, CreditCard, Crown, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"
import { getLocalizedForwarders, getLocalizedMembershipTiers } from "@/lib/localized-data"

const copy = {
  zh: {
    badge: "Admin Console",
    title: "管理 Forwarder 驗證、會員、付款和 marketplace quality。",
    forwarders: "Forwarders",
    verified: "已驗證",
    paid: "付費會員",
    winRate: "Quote win rate",
    payments: "待確認付款",
    queue: "Forwarder 驗證隊列",
    review: "查看",
    tiers: "會員等級",
  },
  en: {
    badge: "Admin Console",
    title: "Manage forwarder verification, membership, payments and marketplace quality.",
    forwarders: "Forwarders",
    verified: "Verified",
    paid: "Paid members",
    winRate: "Quote win rate",
    payments: "Pending payments",
    queue: "Forwarder verification queue",
    review: "Review",
    tiers: "Membership tiers",
  },
}

export default function LocalizedAdminPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const forwarders = getLocalizedForwarders(locale)
  const membershipTiers = getLocalizedMembershipTiers(locale)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <Badge variant="gold">{t.badge}</Badge>
      <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
      <section className="mt-8 grid gap-4 md:grid-cols-5">
        <Metric icon={Users} label={t.forwarders} value={String(forwarders.length)} />
        <Metric icon={BadgeCheck} label={t.verified} value="3" />
        <Metric icon={Crown} label={t.paid} value="2" />
        <Metric icon={BarChart3} label={t.winRate} value="38%" />
        <Card className="border-white/10 bg-white/[0.045]">
          <CardContent className="p-5">
            <CreditCard className="h-5 w-5 text-lgold" />
            <div className="mt-3 text-sm text-muted-foreground">{t.payments}</div>
            <div className="text-3xl font-black text-lblue">2</div>
            <Button asChild className="mt-3 w-full" size="sm" variant="outline">
              <Link href={`/${locale}/admin/pending-payments`}>{t.review}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <CardTitle>{t.queue}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {forwarders.map((forwarder) => (
              <div key={forwarder.slug} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-lblue">{forwarder.name}</div>
                  <div className="text-sm text-muted-foreground">{forwarder.coverage.join(", ")}</div>
                </div>
                <div className="flex gap-2">
                  <Badge variant="teal">{forwarder.tier}</Badge>
                  <Button size="sm" variant="outline">{t.review}</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <CardTitle>{t.tiers}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {membershipTiers.map((tier) => (
              <div key={tier.name} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lblue">{tier.name}</span>
                  <Badge variant="gold">{tier.price}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-lgold" />
        <div className="mt-3 text-sm text-muted-foreground">{label}</div>
        <div className="text-3xl font-black text-lblue">{value}</div>
      </CardContent>
    </Card>
  )
}
