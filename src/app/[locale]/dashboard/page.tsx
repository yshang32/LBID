import Link from "next/link"
import { BarChart3, Coins, Handshake, PackagePlus, Radar, ReceiptText, ShieldCheck, Star, TrendingUp } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { calculateIntroductionFee, companyProfile, inquiries, matchRecords, matchStages, reorders, volumeTracking } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"

type Role = "agency" | "forwarder" | "admin"

const roleSet = new Set<Role>(["agency", "forwarder", "admin"])

const copy = {
  zh: {
    badge: "Matching-first dashboard",
    title: {
      agency: "Agent 工作台",
      forwarder: "HK Forwarder 工作台",
      admin: "LBID 管理台",
    },
    intro: {
      agency: "先用 Shipment Request 找到合適香港 Forwarder，再把勝出報價轉成 Preferred Partner、Rate Card 和 Reorder。",
      forwarder: "集中處理開放中的 SR、已配對客戶、Introduction Period 收費和長期貨量。",
      admin: "監察 SR 配對、Forwarder 質素、平台介紹費和長期合作數據。",
    },
    primary: {
      agency: "建立新 SR",
      forwarder: "提交 sealed bid",
      admin: "查看管理台",
    },
    secondary: "查看 Match Record",
    openSr: "Open SR",
    partners: "Preferred Partners",
    reorders: "Reorders",
    fee: "Introduction Fee",
    volume: "Volume Tracking",
    quality: "Quality Review",
    latestPartners: "最近配對",
    preferred: "Preferred Partner",
    introPeriod: "Introduction Period",
    reorderCta: "從 Partner Reorder",
    feePending: "待收平台介紹費",
    noConnection: "一次配對，長期合作",
    wallet: "Token / Reputation",
    freeTokens: "Free",
    paidTokens: "Paid",
    reputation: "Reputation",
    progress: "Match progress",
  },
  en: {
    badge: "Matching-first dashboard",
    title: {
      agency: "Agent workspace",
      forwarder: "HK Forwarder workspace",
      admin: "LBID admin console",
    },
    intro: {
      agency: "Use a Shipment Request to discover the right Hong Kong forwarder, then turn the winning bid into a Preferred Partner, Rate Card and Reorders.",
      forwarder: "Manage open SRs, matched agents, introduction-period fees and long-term volume.",
      admin: "Monitor SR matching, forwarder quality, platform introduction fees and relationship volume.",
    },
    primary: {
      agency: "Create new SR",
      forwarder: "Submit sealed bid",
      admin: "Open admin",
    },
    secondary: "View Match Record",
    openSr: "Open SR",
    partners: "Preferred Partners",
    reorders: "Reorders",
    fee: "Introduction Fee",
    volume: "Volume Tracking",
    quality: "Quality Review",
    latestPartners: "Latest matches",
    preferred: "Preferred Partner",
    introPeriod: "Introduction Period",
    reorderCta: "Reorder from Partner",
    feePending: "Pending platform fee",
    noConnection: "Match once, trust long-term",
    wallet: "Token / Reputation",
    freeTokens: "Free",
    paidTokens: "Paid",
    reputation: "Reputation",
    progress: "Match progress",
  },
}

export default function LocalizedDashboardPage({
  params,
  searchParams,
}: {
  params: { locale: string }
  searchParams: { role?: string }
}) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const role = roleSet.has(searchParams.role as Role) ? (searchParams.role as Role) : "agency"
  const t = copy[locale]
  const prefix = `/${locale}`
  const cards = getCards(role, t)
  const firstMatch = matchRecords[0]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title[role]}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro[role]}</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-lblue">
            <Handshake className="h-4 w-4 text-lgold" />
            {t.noConnection}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="gold">
            <Link href={role === "agency" ? `${prefix}/inquiries/new` : role === "admin" ? `${prefix}/admin` : `${prefix}/quotations/new`}>
              {t.primary[role]}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`${prefix}/matches/${firstMatch.id}`}>{t.secondary}</Link>
          </Button>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="border-white/10 bg-white/[0.045]">
            <CardHeader>
              <card.icon className="h-5 w-5 text-lgold" />
              <CardTitle>{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-lblue">{card.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{card.meta}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[.85fr_1.15fr]">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <Coins className="h-5 w-5 text-lgold" />
            <CardTitle>{t.wallet}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Metric label={t.freeTokens} value={`${companyProfile.tokenBalanceFree}`} />
            <Metric label={t.paidTokens} value={`${companyProfile.tokenBalancePaid}`} />
            <Metric label={t.reputation} value={`${companyProfile.reputationScore}`} />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <Star className="h-5 w-5 text-lgold" />
            <CardTitle>{t.progress}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-5">
              {matchStages.map((stage, index) => (
                <div key={stage} className={`rounded-lg border p-3 text-xs font-semibold ${index <= 2 ? "border-lgold/50 bg-lgold/15 text-lgold" : "border-white/10 bg-white/[0.035] text-muted-foreground"}`}>
                  <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-white font-mono">{index + 1}</div>
                  {stage}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <CardTitle>{t.latestPartners}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {matchRecords.map((match) => (
              <Link
                key={match.id}
                href={`${prefix}/matches/${match.id}`}
                className="block rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:border-lgold/40 hover:bg-lgold/10"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-black text-lblue">{match.agency} x {match.forwarder}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{match.route} · {match.cargoLane}</div>
                  </div>
                  <Badge variant="teal">{t.preferred}</Badge>
                </div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                  <Metric label={t.introPeriod} value={`${match.introductionPeriodStart} - ${match.introductionPeriodEnd}`} />
                  <Metric label={t.reorders} value={`${reorders.filter((order) => order.matchRecordId === match.id).length}`} />
                  <Metric label={t.volume} value={volumeTracking.find((item) => item.matchRecordId === match.id)?.totalVolume ?? "-"} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <CardTitle>{role === "agency" ? t.reorderCta : t.feePending}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reorders.map((order) => {
              const match = matchRecords.find((item) => item.id === order.matchRecordId)
              const fee = calculateIntroductionFee(match?.introductionPeriodStart ?? order.orderDate, order.orderDate, order.agreedPrice)

              return (
                <div key={order.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-lblue">{order.id}</div>
                      <div className="text-sm text-muted-foreground">{match?.route}</div>
                    </div>
                    <Badge variant={order.feeStatus === "pending" ? "gold" : "teal"}>{order.feeStatus}</Badge>
                  </div>
                  <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                    <Metric label="Order value" value={`${order.currency} ${order.agreedPrice.toLocaleString()}`} />
                    <Metric label="Fee rate" value={`${Math.round(fee.feeRate * 100)}%`} />
                    <Metric label="Fee" value={`${order.currency} ${fee.feeAmount.toLocaleString()}`} />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground">{label}</div>
      <div className="font-bold text-lblue">{value}</div>
    </div>
  )
}

function getCards(role: Role, t: typeof copy.en) {
  if (role === "admin") {
    return [
      { label: t.openSr, value: inquiries.length.toString(), meta: "awaiting match quality review", icon: Radar },
      { label: t.fee, value: "HKD 1.3k", meta: "pending introduction fees", icon: ReceiptText },
      { label: t.quality, value: "96%", meta: "verified partner coverage", icon: ShieldCheck },
    ]
  }

  if (role === "forwarder") {
    return [
      { label: t.openSr, value: "5", meta: "open for sealed bidding", icon: Radar },
      { label: t.partners, value: matchRecords.length.toString(), meta: "active relationship records", icon: Handshake },
      { label: t.fee, value: "HKD 1.3k", meta: "pending this month", icon: ReceiptText },
    ]
  }

  return [
    { label: t.openSr, value: inquiries.length.toString(), meta: "active shipment requests", icon: PackagePlus },
    { label: t.partners, value: matchRecords.length.toString(), meta: "preferred partners available", icon: Handshake },
    { label: t.volume, value: "HKD 53.4k", meta: "tracked relationship value", icon: TrendingUp },
  ]
}
