import Link from "next/link"
import { ArrowUpRight, Coins, Gem, Megaphone, RotateCcw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { companyProfile, directoryBoosts, getMonthlyFreeTokenGrant, tokenPackages } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Token Wallet",
    title: "Token 是 LBID 的報價和曝光成本控制。",
    intro: "1 token = 提交 1 次 sealed bid。Free token 每月按 reputation 重置，use-it-or-lose-it；paid token 可保留。",
    free: "Free tokens",
    paid: "Paid tokens",
    grant: "下月免費 token",
    buy: "購買",
    boost: "Directory Boost",
    spend: "使用 token",
    profile: "查看 Profile",
  },
  en: {
    badge: "Token Wallet",
    title: "Tokens control bidding and directory exposure.",
    intro: "1 token = 1 sealed bid submission. Free tokens reset monthly by reputation and are use-it-or-lose-it; paid tokens remain available.",
    free: "Free tokens",
    paid: "Paid tokens",
    grant: "Next free grant",
    buy: "Buy",
    boost: "Directory Boost",
    spend: "Spend tokens",
    profile: "View Profile",
  },
}

export default function TokensPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const freeGrant = getMonthlyFreeTokenGrant(companyProfile.reputationScore)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${locale}/profile`}>
            {t.profile} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <WalletCard icon={Coins} label={t.free} value={`${companyProfile.tokenBalanceFree}`} meta={`Reset: ${companyProfile.freeTokenResetAt}`} />
        <WalletCard icon={Gem} label={t.paid} value={`${companyProfile.tokenBalancePaid}`} meta="No monthly expiry" />
        <WalletCard icon={RotateCcw} label={t.grant} value={`${freeGrant}`} meta={`Reputation score: ${companyProfile.reputationScore}`} />
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <Coins className="h-5 w-5 text-lgold" />
            <CardTitle>Token packages</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {tokenPackages.map((pack) => (
              <div key={pack.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="text-3xl font-black text-lblue">{pack.tokens}</div>
                <div className="text-sm text-muted-foreground">tokens</div>
                <div className="mt-4 font-bold text-lgold">{pack.price}</div>
                <div className="text-sm text-muted-foreground">{pack.unitPrice}</div>
                <div className="mt-3 text-sm">{pack.bestFor}</div>
                <Button className="mt-4 w-full" variant="gold">{t.buy}</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <Megaphone className="h-5 w-5 text-lgold" />
            <CardTitle>{t.boost}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {directoryBoosts.map((boost) => (
              <div key={boost.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <div className="font-bold text-lblue">{boost.label}</div>
                <div className="mt-1 text-sm text-muted-foreground">Ranking bonus +{boost.scoreBonus}</div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="gold">{boost.cost}</Badge>
                  <Button size="sm" variant="outline">{t.spend}</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function WalletCard({ icon: Icon, label, value, meta }: { icon: typeof Coins; label: string; value: string; meta: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
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
