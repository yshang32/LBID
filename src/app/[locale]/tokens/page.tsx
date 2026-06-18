import { ArrowUpRight, Coins, Gem, Megaphone, RotateCcw, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LiveTokenWallet } from "@/components/tokens/live-token-wallet"
import { companyProfile, directoryBoosts, getMonthlyFreeTokenGrant } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4TokenPackages } from "@/lib/v4"

const copy = {
  zh: {
    badge: "Token Wallet",
    title: "Token 係 LBID 嘅行動貨幣。",
    intro: "1 token = 1 次普通 bid。免費 token 每月清零；付費 token 會保留。Priority Bid 用 2 tokens，Directory 置頂由 5 tokens 起。",
    free: "免費 Token",
    paid: "付費 Token",
    grant: "下月免費額度",
    reset: "月底清零",
    noExpiry: "不會每月過期",
    score: "信譽分",
    buy: "購買",
    firstBonus: "首購任何套裝額外 +10% tokens bonus",
    packages: "Token 套裝",
    boost: "Directory 置頂曝光",
    spend: "使用 Token",
    best: "最受歡迎",
    economics: "定價邏輯",
    economicsText: "月費 $388 + Basic 套裝 $380 = $768。中小 forwarder 一張單 GP 通常 $1,000-5,000，一個月成交 1 單已回本。",
  },
  en: {
    badge: "Token Wallet",
    title: "Tokens are LBID's action currency.",
    intro: "1 token = 1 regular bid. Free tokens reset monthly; paid tokens remain available. Priority Bid costs 2 tokens and Directory boosts start at 5 tokens.",
    free: "Free Tokens",
    paid: "Paid Tokens",
    grant: "Next free grant",
    reset: "Resets monthly",
    noExpiry: "No monthly expiry",
    score: "Reputation score",
    buy: "Buy",
    firstBonus: "First purchase bonus: +10% extra tokens",
    packages: "Token packages",
    boost: "Directory Boost",
    spend: "Spend tokens",
    best: "Popular",
    economics: "Pricing logic",
    economicsText: "Monthly $388 + Basic token pack $380 = $768. One logistics order usually returns HKD $1,000-5,000 GP, so one match can cover the monthly cost.",
  },
}

export default function TokensPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const freeGrant = getMonthlyFreeTokenGrant(companyProfile.reputationScore)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <WalletCard icon={Coins} label={t.free} value={`${companyProfile.tokenBalanceFree}`} meta={`${t.reset}: ${companyProfile.freeTokenResetAt}`} />
        <WalletCard icon={Gem} label={t.paid} value={`${companyProfile.tokenBalancePaid}`} meta={t.noExpiry} />
        <WalletCard icon={RotateCcw} label={t.grant} value={`${freeGrant}`} meta={`${t.score}: ${companyProfile.reputationScore}`} />
      </section>

      <LiveTokenWallet locale={locale} />

      <Card className="mt-6 border-lgold/30 bg-lgold/10">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-lgold" />
            <div>
              <div className="font-black text-lblue">{t.firstBonus}</div>
              <div className="text-sm text-muted-foreground">Starter / Basic / Popular / Growth / Business / Scale / Enterprise</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <Card>
          <CardHeader>
            <Coins className="h-5 w-5 text-lgold" />
            <CardTitle>{t.packages}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {v4TokenPackages.map((pack) => (
              <div key={pack.id} className={`relative rounded-lg border p-4 ${pack.popular ? "border-lgold/50 bg-lgold/10" : "border-lblue/10 bg-white"}`}>
                {pack.popular ? <Badge className="absolute right-3 top-3" variant="gold">{t.best}</Badge> : null}
                <div className="text-sm font-bold text-muted-foreground">{pack.name}</div>
                <div className="mt-2 text-4xl font-black text-lblue">{pack.tokens}</div>
                <div className="text-sm text-muted-foreground">tokens</div>
                <div className="mt-4 text-xl font-black text-lgold">{pack.price}</div>
                <div className="text-sm text-muted-foreground">{pack.unit}</div>
                <Button className="mt-4 w-full" variant="gold">
                  {t.buy} <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <Megaphone className="h-5 w-5 text-lgold" />
              <CardTitle>{t.boost}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {directoryBoosts.map((boost) => (
                <div key={boost.id} className="rounded-lg border border-lblue/10 bg-white p-4">
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

          <Card>
            <CardHeader>
              <CardTitle>{t.economics}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">
              {t.economicsText}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

function WalletCard({ icon: Icon, label, value, meta }: { icon: typeof Coins; label: string; value: string; meta: string }) {
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
