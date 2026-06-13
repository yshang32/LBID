import Link from "next/link"
import { notFound } from "next/navigation"
import { Award, BadgeCheck, MapPin, MessageSquare, PackageCheck, Star, Timer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { isLocale, locales, type Locale } from "@/lib/i18n"
import { forwarders } from "@/lib/data"
import { getLocalizedForwarders, getLocalizedPointRules } from "@/lib/localized-data"

const copy = {
  zh: {
    member: "會員",
    reviews: "則評價",
    completed: "已完成訂單",
    response: "平均回覆",
    points: "Profile 積分",
    coverage: "服務範圍",
    badges: "徽章",
    invite: "邀請報價",
    create: "建立詢價",
    message: "聯絡貨代",
    engine: "積分機制",
    referral: "推薦碼",
  },
  en: {
    member: "member",
    reviews: "reviews",
    completed: "Completed orders",
    response: "Avg response",
    points: "Profile points",
    coverage: "Service coverage",
    badges: "Badges",
    invite: "Invite to quote",
    create: "Create inquiry",
    message: "Message forwarder",
    engine: "Points engine",
    referral: "Referral code",
  },
}

export function generateStaticParams() {
  return locales.flatMap((locale) => forwarders.map((forwarder) => ({ locale, slug: forwarder.slug })))
}

export default function LocalizedForwarderProfilePage({ params }: { params: { locale: string; slug: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const forwarder = getLocalizedForwarders(locale).find((item) => item.slug === params.slug)
  const pointRules = getLocalizedPointRules(locale)
  if (!forwarder) notFound()

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-6">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <Badge variant="gold">{forwarder.tier} {t.member}</Badge>
                <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{forwarder.name}</h1>
                <p className="mt-4 max-w-2xl text-muted-foreground">{forwarder.description}</p>
              </div>
              <div className="rounded-lg border border-lgold/30 bg-lgold/15 p-4 text-center">
                <div className="flex items-center justify-center gap-1 text-2xl font-black text-lgold">
                  <Star className="h-5 w-5 fill-current" />
                  {forwarder.rating}
                </div>
                <div className="text-sm text-muted-foreground">{forwarder.reviews} {t.reviews}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Metric icon={PackageCheck} label={t.completed} value={String(forwarder.completedOrders)} />
            <Metric icon={Timer} label={t.response} value={forwarder.responseTime} />
            <Metric icon={Award} label={t.points} value="8,420" />
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-white/10 bg-white/[0.045]">
            <CardHeader>
              <CardTitle>{t.coverage}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {forwarder.coverage.map((place) => (
                <div key={place} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <MapPin className="h-4 w-4 text-lgold" />
                  {place}
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.045]">
            <CardHeader>
              <CardTitle>{t.badges}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {forwarder.badges.map((badge) => (
                <Badge key={badge} variant="teal">
                  <BadgeCheck className="mr-1 h-3 w-3" />
                  {badge}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
      <aside className="space-y-4">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <CardTitle>{t.invite}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full" variant="gold">
              <Link href={`/${locale}/workflow`}>{t.create}</Link>
            </Button>
            <Button className="w-full" variant="outline">
              <MessageSquare className="h-4 w-4" />
              {t.message}
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <CardTitle>{t.engine}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            {pointRules.map((rule) => (
              <div key={rule}>{rule}</div>
            ))}
            <Separator />
            <div>{t.referral}: <span className="font-mono text-lgold">LBID-{forwarder.slug.slice(0, 4).toUpperCase()}</span></div>
          </CardContent>
        </Card>
      </aside>
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
      <Icon className="h-5 w-5 text-lgold" />
      <div className="mt-3 text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  )
}
