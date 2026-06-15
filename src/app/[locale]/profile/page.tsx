import Link from "next/link"
import { BadgeCheck, Building2, Coins, Gem, LineChart, ShieldCheck, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { companyProfile, getMonthlyFreeTokenGrant, rateCards } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4Status } from "@/lib/v4"

const copy = {
  zh: {
    badge: "Company Profile",
    title: "公司 Profile 同時係信譽資產。",
    intro: "用家會透過 Profile 判斷你是否值得邀請 sealed bid。這裡集中管理公開資料、reputation、Directory 排名、Token 和會員狀態。",
    reputation: "Reputation score",
    rank: "Directory 排名",
    subscription: "會員狀態",
    tokens: "Token balance",
    monthlyGrant: "下月 Token grant",
    manageTokens: "管理 Tokens",
    subscriptionCta: "管理訂閱",
    tabs: ["公開公司資料", "服務優勢", "Quotation 設定", "Rate Cards"],
    public: "Public profile",
    verified: "Reputation badge",
    disclosure: "聯絡資料會在 Match award 後才完整解鎖，避免未成交前繞過平台。",
  },
  en: {
    badge: "Company Profile",
    title: "Your company profile is a reputation asset.",
    intro: "Clients use the profile to decide whether to invite you into sealed bids. Manage public data, reputation, Directory rank, tokens and membership here.",
    reputation: "Reputation score",
    rank: "Directory rank",
    subscription: "Subscription",
    tokens: "Token balance",
    monthlyGrant: "Next free token grant",
    manageTokens: "Manage Tokens",
    subscriptionCta: "Manage Subscription",
    tabs: ["Company", "Advantages", "Quotation Setup", "Rate Cards"],
    public: "Public profile",
    verified: "Reputation badge",
    disclosure: "Full contacts unlock only after match award to keep pre-award workflow inside LBID.",
  },
}

export default function ProfilePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const totalTokens = companyProfile.tokenBalanceFree + companyProfile.tokenBalancePaid
  const monthlyGrant = getMonthlyFreeTokenGrant(companyProfile.reputationScore)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card className="border-lgold/30 bg-lgold/10">
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-lblue/10 bg-white">
                <Building2 className="h-7 w-7 text-lblue" />
              </div>
              <div>
                <div className="text-xl font-black text-lblue">{companyProfile.companyName}</div>
                <div className="text-sm text-muted-foreground">{companyProfile.region}</div>
              </div>
            </div>
            <p className="text-sm text-lblue">{companyProfile.slogan}</p>
            <div className="flex flex-wrap gap-2">
              {companyProfile.advantageTags.map((tag) => <Badge key={tag} variant="teal">{tag}</Badge>)}
            </div>
            <div className="rounded-md border border-lblue/10 bg-white p-3 text-sm text-muted-foreground">{t.disclosure}</div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <StatusCard icon={Star} label={t.reputation} value={`${companyProfile.reputationScore}`} meta={companyProfile.reputationScore >= 50 ? t.verified : "Growing"} />
        <StatusCard icon={LineChart} label={t.rank} value={`#${companyProfile.directoryRank}`} meta="HK cold-chain lane" />
        <StatusCard icon={ShieldCheck} label={t.subscription} value={locale === "zh" ? v4Status.membership : "Monthly Member"} meta={`Until ${companyProfile.trialEndsAt}`} />
        <StatusCard icon={Coins} label={t.tokens} value={`${v4Status.tokens}`} meta={`${companyProfile.tokenBalanceFree} free / ${companyProfile.tokenBalancePaid} paid`} />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.public}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              {t.tabs.map((tab) => (
                <div key={tab} className="rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm font-semibold text-lblue">
                  {tab}
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild variant="outline">
                <Link href={`/${locale}/tokens`}>
                  <Gem className="h-4 w-4" />
                  {t.manageTokens}
                </Link>
              </Button>
              <Button asChild variant="gold">
                <Link href={`/${locale}/subscription`}>
                  <BadgeCheck className="h-4 w-4" />
                  {t.subscriptionCta}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rate Cards</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rateCards.map((rateCard) => (
              <div key={rateCard.id} className="rounded-md border border-lblue/10 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-black text-lblue">{rateCard.route}</div>
                    <div className="text-sm text-muted-foreground">{rateCard.lane}</div>
                  </div>
                  <Badge variant="gold">{rateCard.currency}</Badge>
                </div>
                <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                  <Metric label="Minimum" value={`${rateCard.currency} ${rateCard.minimumCharge.toLocaleString()}`} />
                  <Metric label="Valid" value={`${rateCard.validFrom} - ${rateCard.validTo}`} />
                  <Metric label={t.monthlyGrant} value={`${monthlyGrant} tokens`} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function StatusCard({ icon: Icon, label, value, meta }: { icon: typeof Star; label: string; value: string; meta: string }) {
  return (
    <Card>
      <CardHeader>
        <Icon className="h-5 w-5 text-lgold" />
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-black text-lblue">{value}</div>
        <div className="mt-1 text-sm text-muted-foreground">{meta}</div>
      </CardContent>
    </Card>
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
