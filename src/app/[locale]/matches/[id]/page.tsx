import Link from "next/link"
import { CalendarClock, Handshake, PackagePlus, ReceiptText, Route, TableProperties, TrendingUp, type LucideIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateIntroductionFee, matchRecords, rateCards, reorders, volumeTracking } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Match Record",
    title: "一次配對，長期合作。",
    intro: "Winning bid 不只是一次訂單，而是建立 Preferred Partner、Rate Card、Introduction Period 和 Reorder tracking。",
    preferred: "Preferred Partner",
    sr: "來源 SR",
    partner: "配對雙方",
    route: "路線",
    winningBid: "勝出報價",
    introPeriod: "Introduction Period",
    rateCard: "Rate Card",
    reorder: "建立 Reorder",
    feeLogic: "Introduction Fee",
    volume: "Volume Tracking",
    orders: "Reorders",
    feeStatus: "收費狀態",
    back: "返回 Dashboard",
    validity: "有效期",
    minCharge: "最低收費",
    unitPrice: "單位價",
  },
  en: {
    badge: "Match Record",
    title: "Match once, trust long-term.",
    intro: "The winning bid becomes a Preferred Partner, Rate Card, Introduction Period and Reorder tracking relationship.",
    preferred: "Preferred Partner",
    sr: "Source SR",
    partner: "Matched parties",
    route: "Route",
    winningBid: "Winning bid",
    introPeriod: "Introduction Period",
    rateCard: "Rate Card",
    reorder: "Create Reorder",
    feeLogic: "Introduction Fee",
    volume: "Volume Tracking",
    orders: "Reorders",
    feeStatus: "Fee status",
    back: "Back to Dashboard",
    validity: "Validity",
    minCharge: "Minimum charge",
    unitPrice: "Unit price",
  },
}

export function generateStaticParams() {
  return [
    ...matchRecords.map((match) => ({ locale: "zh", id: match.id })),
    ...matchRecords.map((match) => ({ locale: "en", id: match.id })),
  ]
}

export default function MatchRecordPage({ params }: { params: { locale: string; id: string } }) {
  if (!isLocale(params.locale)) notFound()

  const locale = params.locale as Locale
  const t = copy[locale]
  const match = matchRecords.find((item) => item.id === params.id)
  if (!match) notFound()

  const rateCard = rateCards.find((item) => item.matchRecordId === match.id)
  const matchReorders = reorders.filter((item) => item.matchRecordId === match.id)
  const volume = volumeTracking.find((item) => item.matchRecordId === match.id)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/dashboard`}>{t.back}</Link>
          </Button>
          <Button variant="gold">
            <PackagePlus className="h-4 w-4" />
            {t.reorder}
          </Button>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <Summary icon={Handshake} label={t.partner} value={`${match.agency} x ${match.forwarder}`} />
        <Summary icon={Route} label={t.route} value={match.route} />
        <Summary icon={ReceiptText} label={t.winningBid} value={`${match.currency} ${match.winningBid.toLocaleString()}`} />
        <Summary icon={CalendarClock} label={t.introPeriod} value={`${match.introductionPeriodStart} - ${match.introductionPeriodEnd}`} />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <TableProperties className="h-5 w-5 text-lgold" />
            <CardTitle>{t.rateCard}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-black text-lblue">{rateCard?.route}</div>
                  <div className="text-sm text-muted-foreground">{rateCard?.lane}</div>
                </div>
                <Badge variant="teal">{t.preferred}</Badge>
              </div>
              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                <Metric label={t.unitPrice} value={formatRate(rateCard)} />
                <Metric label={t.minCharge} value={`${rateCard?.currency} ${rateCard?.minimumCharge.toLocaleString()}`} />
                <Metric label={t.validity} value={`${rateCard?.validFrom} - ${rateCard?.validTo}`} />
              </div>
            </div>
            <div className="rounded-lg border border-lgold/25 bg-lgold/10 p-4 text-sm leading-6 text-lblue">
              {locale === "zh"
                ? "Rate Card 由 winning bid 快照開始，之後可按貨量、淡旺季或服務範圍調整。"
                : "The Rate Card starts from the winning bid snapshot and can be adjusted by volume, seasonality or service scope."}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <ReceiptText className="h-5 w-5 text-lgold" />
            <CardTitle>{t.feeLogic}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matchReorders.map((order) => {
              const fee = calculateIntroductionFee(match.introductionPeriodStart, order.orderDate, order.agreedPrice)

              return (
                <div key={order.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-black text-lblue">{order.id}</div>
                      <div className="text-sm text-muted-foreground">{order.orderDate} · {order.volume} {order.unit}</div>
                    </div>
                    <Badge variant={order.feeStatus === "pending" ? "gold" : "teal"}>{order.feeStatus}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-4">
                    <Metric label="Value" value={`${order.currency} ${order.agreedPrice.toLocaleString()}`} />
                    <Metric label="Fee rate" value={`${Math.round(fee.feeRate * 100)}%`} />
                    <Metric label="Fee amount" value={`${order.currency} ${fee.feeAmount.toLocaleString()}`} />
                    <Metric label={t.feeStatus} value={order.feeStatus} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>

      <section className="mt-6">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <TrendingUp className="h-5 w-5 text-lgold" />
            <CardTitle>{t.volume}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <Metric label={t.orders} value={`${volume?.totalOrders ?? 0}`} />
            <Metric label="Total volume" value={volume?.totalVolume ?? "-"} />
            <Metric label="Total value" value={`${volume?.currency} ${volume?.totalValue.toLocaleString()}`} />
            <Metric label="Last order" value={volume?.lastOrderDate ?? "-"} />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function Summary({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardContent className="p-4">
        <Icon className="mb-3 h-5 w-5 text-lgold" />
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 font-bold text-lblue">{value}</div>
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-bold text-lblue">{value}</div>
    </div>
  )
}

function formatRate(rateCard: (typeof rateCards)[number] | undefined) {
  if (!rateCard) return "-"
  if ("pricePerKg" in rateCard) return `${rateCard.currency} ${rateCard.pricePerKg}/kg`
  return `${rateCard.currency} ${rateCard.pricePerCbm}/CBM`
}
