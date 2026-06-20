"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, Coins, Gem, Gift, Megaphone, RotateCcw, Sparkles, Users } from "lucide-react"

import { LiveTokenWallet } from "@/components/tokens/live-token-wallet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiJson } from "@/lib/api-client"
import { companyProfile, getMonthlyFreeTokenGrant } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4TokenPackages } from "@/lib/v4"

type PointReward = { id: string; label: string; points: number; type: string }
type PointEvent = { id: string; type: string; source: string; points: number; created_at: string }
type Referral = { id: string; referred_email: string; status: string; points_awarded?: number; created_at: string }

const copy = {
  zh: {
    badge: "Token Wallet",
    title: "Token、積分、推薦獎勵集中管理",
    intro: "Token 用於 sealed bid 及 Directory boost；積分由完成訂單、好評、快速回覆及推薦獲得，可兌換曝光、折扣和活動名額。",
    free: "免費 Token",
    paid: "付費 Token",
    grant: "下次免費發放",
    reset: "每月重置",
    noExpiry: "不會每月過期",
    score: "信譽分",
    buy: "購買",
    firstBonus: "首購任何套裝額外 +10% tokens bonus",
    packages: "Token 套裝",
    boost: "Directory Boost",
    spend: "使用",
    spending: "處理中...",
    best: "熱門",
    points: "積分中心",
    pointsIntro: "積分是長期貢獻的回報，不會取代 Token；Token 是即時交易動作，積分是忠誠度及增長工具。",
    balance: "可用積分",
    redeem: "兌換",
    redeemed: "兌換成功",
    activity: "積分紀錄",
    referral: "推薦夥伴",
    referralIntro: "每個用戶都有唯一推薦碼。當被推薦公司加入並完成交易後，系統會發放積分。",
    referralCode: "推薦碼",
    referredEmail: "夥伴 Email",
    invite: "送出推薦",
    invited: "推薦已記錄",
    economics: "定價邏輯",
    economicsText: "月費 + Token 套裝令 LBID 收入與實際交易活動連動。Forwarder 只有在有意 bid / boost 時才花費，平台亦可用積分鼓勵好服務和轉介紹。",
    error: "操作未能完成，請稍後再試。",
  },
  en: {
    badge: "Token Wallet",
    title: "Manage tokens, points and referrals",
    intro: "Tokens power sealed bids and Directory boosts. Points are earned through completed orders, strong reviews, fast responses and referrals, then redeemed for growth perks.",
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
    spend: "Spend",
    spending: "Processing...",
    best: "Popular",
    points: "Points centre",
    pointsIntro: "Points reward long-term contribution. They do not replace tokens: tokens trigger marketplace actions, while points drive loyalty and growth.",
    balance: "Point balance",
    redeem: "Redeem",
    redeemed: "Reward redeemed",
    activity: "Point activity",
    referral: "Refer a partner",
    referralIntro: "Each user has a unique referral code. Points are awarded when the referred company joins and transacts.",
    referralCode: "Referral code",
    referredEmail: "Partner email",
    invite: "Send referral",
    invited: "Referral recorded",
    economics: "Pricing logic",
    economicsText: "Membership plus token packs links LBID revenue to real transaction activity. Forwarders spend only when bidding or boosting, while points reward strong service and referrals.",
    error: "Action failed. Please try again.",
  },
}

export default function TokensPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const freeGrant = getMonthlyFreeTokenGrant(companyProfile.reputationScore)
  const [points, setPoints] = useState<{ balance: number; rewards: PointReward[]; events: PointEvent[]; referralCode?: string }>({
    balance: 0,
    rewards: [],
    events: [],
  })
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [referralCode, setReferralCode] = useState("")
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    refreshGrowthData()
  }, [])

  async function refreshGrowthData() {
    const [{ body: pointBody }, { body: referralBody }] = await Promise.all([
      apiJson("/api/points"),
      apiJson("/api/referrals"),
    ])
    setPoints({
      balance: Number(pointBody.balance || 0),
      rewards: Array.isArray(pointBody.rewards) ? pointBody.rewards : [],
      events: Array.isArray(pointBody.events) ? pointBody.events : [],
      referralCode: pointBody.referralCode,
    })
    setReferralCode(referralBody.referralCode || pointBody.referralCode || "LBID-DEMO")
    setReferrals(Array.isArray(referralBody.referrals) ? referralBody.referrals : [])
  }

  async function spendBoost(duration: "1day" | "7day") {
    setBusy(`boost-${duration}`)
    setError("")
    setMessage("")
    const { response, body } = await apiJson("/api/tokens/boost", {
      method: "POST",
      body: JSON.stringify({ duration }),
    })
    setBusy("")
    if (!response.ok) {
      setError(body.error || t.error)
      return
    }
    setMessage(`${t.boost}: ${duration}`)
  }

  async function redeem(rewardId: string) {
    setBusy(rewardId)
    setError("")
    setMessage("")
    const { response, body } = await apiJson("/api/points", {
      method: "POST",
      body: JSON.stringify({ rewardId }),
    })
    setBusy("")
    if (!response.ok) {
      setError(body.error || t.error)
      return
    }
    setMessage(body.reward?.label || t.redeemed)
    await refreshGrowthData()
  }

  async function submitReferral() {
    if (!email) return
    setBusy("referral")
    setError("")
    setMessage("")
    const { response, body } = await apiJson("/api/referrals", {
      method: "POST",
      body: JSON.stringify({ email }),
    })
    setBusy("")
    if (!response.ok) {
      setError(body.error || t.error)
      return
    }
    setEmail("")
    setMessage(t.invited)
    await refreshGrowthData()
  }

  const boosts = useMemo(() => [
    { id: "1day", label: "1-day Directory Boost", cost: "5 tokens", scoreBonus: 1000 },
    { id: "7day", label: "7-day Directory Boost", cost: "25 tokens", scoreBonus: 1000 },
  ] as const, [])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
        <Badge variant="gold">{t.badge}</Badge>
        <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <WalletCard icon={Coins} label={t.free} value={`${companyProfile.tokenBalanceFree}`} meta={`${t.reset}: ${companyProfile.freeTokenResetAt}`} />
        <WalletCard icon={Gem} label={t.paid} value={`${companyProfile.tokenBalancePaid}`} meta={t.noExpiry} />
        <WalletCard icon={RotateCcw} label={t.grant} value={`${freeGrant}`} meta={`${t.score}: ${companyProfile.reputationScore}`} />
      </section>

      <LiveTokenWallet locale={locale} />

      {message || error ? (
        <div className={`mt-5 rounded-md border p-3 text-sm font-semibold ${error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-800"}`}>
          {error || message}
        </div>
      ) : null}

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

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
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
              {boosts.map((boost) => (
                <div key={boost.id} className="rounded-lg border border-lblue/10 bg-white p-4">
                  <div className="font-bold text-lblue">{boost.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">Ranking bonus +{boost.scoreBonus}</div>
                  <div className="mt-3 flex items-center justify-between">
                    <Badge variant="gold">{boost.cost}</Badge>
                    <Button size="sm" variant="outline" disabled={busy === `boost-${boost.id}`} onClick={() => spendBoost(boost.id)}>
                      {busy === `boost-${boost.id}` ? t.spending : t.spend}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.economics}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-7 text-muted-foreground">{t.economicsText}</CardContent>
          </Card>
        </div>
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <Gift className="h-5 w-5 text-lgold" />
            <CardTitle>{t.points}</CardTitle>
            <CardDescription>{t.pointsIntro}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-lgold/30 bg-lgold/10 p-4">
              <div className="text-sm text-muted-foreground">{t.balance}</div>
              <div className="text-4xl font-black text-lblue">{points.balance.toLocaleString()}</div>
            </div>
            <div className="grid gap-3">
              {points.rewards.map((reward) => (
                <div key={reward.id} className="flex items-center justify-between rounded-lg border border-lblue/10 bg-white p-4">
                  <div>
                    <div className="font-bold text-lblue">{reward.label}</div>
                    <div className="text-sm text-muted-foreground">{reward.points.toLocaleString()} points</div>
                  </div>
                  <Button size="sm" variant="outline" disabled={busy === reward.id} onClick={() => redeem(reward.id)}>
                    {busy === reward.id ? t.spending : t.redeem}
                  </Button>
                </div>
              ))}
            </div>
            <div>
              <div className="mb-2 text-sm font-bold text-lblue">{t.activity}</div>
              <div className="space-y-2">
                {points.events.slice(0, 4).map((event) => (
                  <div key={event.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm">
                    <span>{event.source}</span>
                    <span className={event.points >= 0 ? "font-bold text-teal-700" : "font-bold text-red-700"}>{event.points > 0 ? "+" : ""}{event.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Users className="h-5 w-5 text-lgold" />
            <CardTitle>{t.referral}</CardTitle>
            <CardDescription>{t.referralIntro}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-lblue/10 bg-slate-50 p-4">
              <div className="text-sm text-muted-foreground">{t.referralCode}</div>
              <div className="font-mono text-2xl font-black text-lgold">{referralCode || points.referralCode || "LBID-DEMO"}</div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input type="email" value={email} placeholder={t.referredEmail} onChange={(event) => setEmail(event.target.value)} />
              <Button variant="gold" disabled={!email || busy === "referral"} onClick={submitReferral}>
                {busy === "referral" ? t.spending : t.invite}
              </Button>
            </div>
            <div className="space-y-2">
              {referrals.map((referral) => (
                <div key={referral.id} className="flex items-center justify-between rounded-md border border-lblue/10 bg-white p-3 text-sm">
                  <span>{referral.referred_email}</span>
                  <Badge variant={referral.status === "rewarded" ? "teal" : "gold"}>{referral.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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
