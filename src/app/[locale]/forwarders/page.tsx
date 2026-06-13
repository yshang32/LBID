"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowUpRight, BadgeCheck, Filter, MapPin, Search, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { calculateDirectoryScore } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"
import { getLocalizedForwarders } from "@/lib/localized-data"

const copy = {
  zh: {
    badge: "Public Directory",
    title: "用 reputation、服務範圍和 ranking 找香港 Forwarder。",
    intro: "Directory 排名會受 reputation、會員狀態、最近報價活躍度和 boost 影響；Agent 可先瀏覽，再用 SR 邀請 sealed bid。",
    saved: "已儲存篩選",
    searchPlaceholder: "搜尋貨代、服務、地區...",
    allServices: "所有服務",
    air: "空運",
    sea: "海運",
    cold: "冷鏈",
    allTiers: "所有會員",
    search: "搜尋",
    completed: "完成訂單",
    response: "回覆時間",
    view: "查看 Profile",
    results: "個結果",
    noResults: "沒有 Forwarder 符合目前條件。",
    reset: "重設",
    rank: "Directory score",
    boosted: "Boosted",
  },
  en: {
    badge: "Public Directory",
    title: "Find Hong Kong forwarders by reputation, coverage and ranking.",
    intro: "Directory ranking is affected by reputation, membership status, recent bidding activity and boosts. Agents can browse first, then invite sealed bids through an SR.",
    saved: "Saved filters",
    searchPlaceholder: "Search forwarder, service, coverage...",
    allServices: "All services",
    air: "Air freight",
    sea: "Sea freight",
    cold: "Cold chain",
    allTiers: "All tiers",
    search: "Search",
    completed: "Completed",
    response: "Response",
    view: "View profile",
    results: "results",
    noResults: "No forwarders match the current filters.",
    reset: "Reset",
    rank: "Directory score",
    boosted: "Boosted",
  },
}

export default function LocalizedForwardersPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const prefix = `/${locale}`
  const forwarders = getLocalizedForwarders(locale)
  const [query, setQuery] = useState("")
  const [service, setService] = useState("all")
  const [tier, setTier] = useState("all")

  const normalizedQuery = query.trim().toLowerCase()
  const filteredForwarders = forwarders.filter((forwarder) => {
    const searchable = [
      forwarder.name,
      forwarder.description,
      forwarder.tier,
      ...forwarder.badges,
      ...forwarder.coverage,
      ...forwarder.services,
    ].join(" ").toLowerCase()
    const matchesQuery = normalizedQuery ? searchable.includes(normalizedQuery) : true
    const matchesService = service === "all" ? true : forwarder.services.some((item) => item.toLowerCase().includes(service))
    const matchesTier = tier === "all" ? true : forwarder.tier.toLowerCase() === tier

    return matchesQuery && matchesService && matchesTier
  })

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
          {t.saved}
        </Button>
      </div>
      <Card className="mt-8 border-white/10 bg-white/[0.055]">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px_auto_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder={t.searchPlaceholder} value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <Select value={service} onChange={(event) => setService(event.target.value)}>
            <option value="all">{t.allServices}</option>
            <option value="air">{t.air}</option>
            <option value="sea">{t.sea}</option>
            <option value="cold">{t.cold}</option>
          </Select>
          <Select value={tier} onChange={(event) => setTier(event.target.value)}>
            <option value="all">{t.allTiers}</option>
            <option value="free">Free</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="partner">Partner</option>
          </Select>
          <Button variant="gold">{t.search}</Button>
          <Button variant="outline" onClick={() => { setQuery(""); setService("all"); setTier("all") }}>{t.reset}</Button>
        </CardContent>
      </Card>
      <div className="mt-5 text-sm text-muted-foreground">
        {filteredForwarders.length} {t.results}
      </div>
      {filteredForwarders.length === 0 ? (
        <Card className="mt-4 border-white/10 bg-white/[0.045]">
          <CardContent className="p-8 text-center text-muted-foreground">{t.noResults}</CardContent>
        </Card>
      ) : (
        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          {filteredForwarders.map((forwarder) => {
            const activeBoost = forwarder.tier === "Partner"
            const directoryScore = Math.round(calculateDirectoryScore({
              reputationScore: forwarder.rating * 10,
              membershipBonus: forwarder.tier === "Premium" || forwarder.tier === "Partner" ? 20 : 10,
              recentBidCount: forwarder.completedOrders % 10,
              activeBoost,
            }))

            return (
              <Card key={forwarder.slug} className="border-white/10 bg-white/[0.045]">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant={forwarder.tier === "Premium" || forwarder.tier === "Partner" ? "gold" : "secondary"}>
                        {forwarder.tier}
                      </Badge>
                      <CardTitle className="mt-3">{forwarder.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1 rounded-md bg-lgold/15 px-2 py-1 text-sm font-bold text-lgold">
                      <Star className="h-4 w-4 fill-current" />
                      {forwarder.rating}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-lgold/25 bg-lgold/10 p-3 text-sm">
                    <span className="font-semibold text-lblue">{t.rank}</span>
                    <span className="font-mono font-black text-lgold">{directoryScore}</span>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{forwarder.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {activeBoost ? <Badge variant="gold">{t.boosted}</Badge> : null}
                    {forwarder.badges.map((badge) => (
                      <Badge key={badge} variant="teal">
                        <BadgeCheck className="mr-1 h-3 w-3" />
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                      <div className="text-muted-foreground">{t.completed}</div>
                      <div className="text-xl font-black">{forwarder.completedOrders}</div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                      <div className="text-muted-foreground">{t.response}</div>
                      <div className="text-xl font-black">{forwarder.responseTime}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-lgold" />
                    {forwarder.coverage.join(", ")}
                  </div>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`${prefix}/forwarders/${forwarder.slug}`}>
                      {t.view} <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}
    </main>
  )
}
