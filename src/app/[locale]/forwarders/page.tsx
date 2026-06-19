"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { ArrowUpRight, BadgeCheck, Filter, Loader2, MapPin, Search, ShieldCheck, Star, Zap } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { apiJson } from "@/lib/api-client"
import { calculateDirectoryScore } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"
import { getLocalizedForwarders } from "@/lib/localized-data"

type DirectoryCompany = {
  slug: string
  name: string
  rating: number
  reviews: number
  completedOrders: number
  badges: string[]
  tier: string
  coverage: string[]
  services: string[]
  responseTime: string
  description: string
  directoryScore: number
  boosted: boolean
  source: "live" | "demo"
}

type LiveDirectoryRow = {
  user_id?: string
  company_name_zh?: string | null
  company_name_en?: string | null
  region?: string | null
  service_routes?: string[] | null
  service_types?: string[] | null
  slogan?: string | null
  description?: string | null
  advantage_tags?: string[] | null
  certifications?: string[] | null
  reputation_score?: number | null
  is_public?: boolean | null
}

const copy = {
  zh: {
    badge: "Public Directory",
    title: "按信譽、服務能力和覆蓋範圍尋找香港 Forwarder。",
    intro: "Directory 會顯示公開 forwarder profile。Agency 可以先比較能力，再透過 SR 邀請 sealed bid。",
    saved: "Saved filters",
    searchPlaceholder: "搜尋 forwarder、服務、覆蓋地區...",
    allServices: "所有服務",
    air: "空運",
    sea: "海運",
    cold: "冷鏈",
    allTiers: "所有等級",
    free: "Free",
    standard: "Standard",
    premium: "Premium",
    partner: "Partner",
    search: "搜尋",
    completed: "完成訂單",
    response: "回覆時間",
    view: "查看 Profile",
    results: "個結果",
    noResults: "未有 forwarder 符合目前篩選。",
    reset: "重設",
    rank: "Directory score",
    boosted: "Boosted",
    live: "Live",
    demo: "Demo",
    createSr: "建立 SR 邀請 Bid",
    sealed: "先比較能力。完整聯絡資料只會在 award 後解鎖。",
    loading: "正在載入 live directory...",
  },
  en: {
    badge: "Public Directory",
    title: "Find Hong Kong forwarders by reputation, capability and coverage.",
    intro: "The directory shows public forwarder profiles. Agencies can compare capability first, then invite sealed bids through an SR.",
    saved: "Saved filters",
    searchPlaceholder: "Search forwarder, service, coverage...",
    allServices: "All services",
    air: "Air freight",
    sea: "Sea freight",
    cold: "Cold chain",
    allTiers: "All tiers",
    free: "Free",
    standard: "Standard",
    premium: "Premium",
    partner: "Partner",
    search: "Search",
    completed: "Completed",
    response: "Response",
    view: "View profile",
    results: "results",
    noResults: "No forwarders match the current filters.",
    reset: "Reset",
    rank: "Directory score",
    boosted: "Boosted",
    live: "Live",
    demo: "Demo",
    createSr: "Create SR to invite bid",
    sealed: "Review capability first. Full contacts unlock after award.",
    loading: "Loading live directory...",
  },
}

export default function LocalizedForwardersPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const prefix = `/${locale}`
  const demoForwarders = useMemo(() => getLocalizedForwarders(locale).map((forwarder) => mapDemoForwarder(forwarder)), [locale])
  const [liveForwarders, setLiveForwarders] = useState<DirectoryCompany[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [query, setQuery] = useState("")
  const [service, setService] = useState("all")
  const [tier, setTier] = useState("all")
  const [sort, setSort] = useState("score")

  useEffect(() => {
    let cancelled = false

    async function loadDirectory() {
      const { response, body } = await apiJson("/api/directory")
      if (cancelled) return

      setLoaded(true)
      if (!response.ok) {
        setLoadError(body.error || "DIRECTORY_LOAD_FAILED")
        return
      }

      const rows = Array.isArray(body.directory) ? (body.directory as LiveDirectoryRow[]) : []
      setLiveForwarders(rows.map((row) => mapLiveDirectoryRow(row, locale)))
    }

    loadDirectory()
    return () => {
      cancelled = true
    }
  }, [locale])

  const directory = liveForwarders.length > 0 ? liveForwarders : demoForwarders
  const normalizedQuery = query.trim().toLowerCase()

  const filteredForwarders = useMemo(() => {
    return directory
      .filter((forwarder) => {
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
      .sort((a, b) => {
        if (sort === "rating") return b.rating - a.rating
        if (sort === "orders") return b.completedOrders - a.completedOrders
        return b.directoryScore - a.directoryScore
      })
  }, [directory, normalizedQuery, service, sort, tier])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={liveForwarders.length > 0 ? "teal" : "secondary"}>{liveForwarders.length > 0 ? t.live : t.demo}</Badge>
            {loaded ? null : <Badge variant="secondary"><Loader2 className="mr-1 h-3 w-3 animate-spin" />{t.loading}</Badge>}
            {loadError ? <Badge variant="gold">{loadError}</Badge> : null}
          </div>
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4" />
          {t.saved}
        </Button>
      </div>

      <Card className="mt-8">
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_170px_150px_150px_auto]">
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
            <option value="free">{t.free}</option>
            <option value="standard">{t.standard}</option>
            <option value="premium">{t.premium}</option>
            <option value="partner">{t.partner}</option>
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="score">{t.rank}</option>
            <option value="rating">Rating</option>
            <option value="orders">{t.completed}</option>
          </Select>
          <Button variant="outline" onClick={() => { setQuery(""); setService("all"); setTier("all"); setSort("score") }}>{t.reset}</Button>
        </CardContent>
      </Card>

      <div className="mt-5 text-sm text-muted-foreground">
        {filteredForwarders.length} {t.results}
      </div>

      {filteredForwarders.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="p-8 text-center text-muted-foreground">{t.noResults}</CardContent>
        </Card>
      ) : (
        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          {filteredForwarders.map((forwarder) => (
            <Card key={forwarder.slug} className="bg-white">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={forwarder.tier === "premium" || forwarder.tier === "partner" ? "gold" : "secondary"}>
                        {formatTier(forwarder.tier, locale)}
                      </Badge>
                      <Badge variant={forwarder.source === "live" ? "teal" : "secondary"}>{forwarder.source === "live" ? t.live : t.demo}</Badge>
                    </div>
                    <CardTitle className="mt-3">{forwarder.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1 rounded-md bg-lgold/15 px-2 py-1 text-sm font-bold text-lgold">
                    <Star className="h-4 w-4 fill-current" />
                    {forwarder.rating.toFixed(1)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-lgold/25 bg-lgold/10 p-3 text-sm">
                    <div className="flex items-center gap-1 font-semibold text-[#6f5514]">
                      <ShieldCheck className="h-4 w-4" />
                      {t.rank}
                    </div>
                    <div className="mt-1 font-mono text-2xl font-black text-lblue">{forwarder.directoryScore}</div>
                  </div>
                  <div className="rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm">
                    <div className="flex items-center gap-1 font-semibold text-muted-foreground">
                      <Zap className="h-4 w-4 text-lgold" />
                      Token bid
                    </div>
                    <div className="mt-1 font-black text-lblue">1 Token</div>
                  </div>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{forwarder.description}</p>
                <div className="flex flex-wrap gap-2">
                  {forwarder.boosted ? <Badge variant="gold">{t.boosted}</Badge> : null}
                  {forwarder.badges.map((badge) => (
                    <Badge key={badge} variant="teal">
                      <BadgeCheck className="mr-1 h-3 w-3" />
                      {badge}
                    </Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border border-lblue/10 bg-slate-50 p-3">
                    <div className="text-muted-foreground">{t.completed}</div>
                    <div className="text-xl font-black">{forwarder.completedOrders}</div>
                  </div>
                  <div className="rounded-md border border-lblue/10 bg-slate-50 p-3">
                    <div className="text-muted-foreground">{t.response}</div>
                    <div className="text-xl font-black">{forwarder.responseTime}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-lgold" />
                  {forwarder.coverage.join(", ")}
                </div>
                <p className="rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm text-muted-foreground">{t.sealed}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button asChild variant="gold">
                    <Link href={`${prefix}/inquiries/new`}>{t.createSr}</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`${prefix}/forwarders/${forwarder.slug}`}>
                      {t.view} <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>
      )}
    </main>
  )
}

function mapDemoForwarder(forwarder: ReturnType<typeof getLocalizedForwarders>[number]): DirectoryCompany {
  const tier = forwarder.tier.toLowerCase()
  const boosted = tier === "partner"
  const directoryScore = Math.round(calculateDirectoryScore({
    reputationScore: forwarder.rating * 10,
    membershipBonus: tier === "premium" || tier === "partner" ? 20 : 10,
    recentBidCount: forwarder.completedOrders % 10,
    activeBoost: boosted,
  }))

  return {
    ...forwarder,
    tier,
    directoryScore,
    boosted,
    source: "demo",
  }
}

function mapLiveDirectoryRow(row: LiveDirectoryRow, locale: Locale): DirectoryCompany {
  const name = (locale === "zh" ? row.company_name_zh : row.company_name_en) || row.company_name_en || row.company_name_zh || "Forwarder"
  const tags = [...(row.advantage_tags || []), ...(row.certifications || [])].filter(Boolean)
  const reputation = Number(row.reputation_score || 0)
  const boosted = tags.some((tag) => tag.toLowerCase().includes("partner") || tag.toLowerCase().includes("boost"))
  const directoryScore = Math.round(calculateDirectoryScore({
    reputationScore: reputation,
    membershipBonus: boosted ? 20 : 10,
    recentBidCount: 0,
    activeBoost: boosted,
  }))

  return {
    slug: row.user_id || slugify(name),
    name,
    rating: Math.max(0, Math.min(5, reputation / 20 || 4.2)),
    reviews: 0,
    completedOrders: 0,
    badges: tags.length ? tags : ["Verified"],
    tier: boosted ? "partner" : "standard",
    coverage: row.service_routes?.length ? row.service_routes : [row.region || "Hong Kong"],
    services: row.service_types?.length ? row.service_types : ["General freight"],
    responseTime: "Live",
    description: row.description || row.slogan || "Public LBID forwarder profile.",
    directoryScore,
    boosted,
    source: "live",
  }
}

function formatTier(tier: string, locale: Locale) {
  if (locale === "en") {
    if (tier === "standard") return "Standard"
    if (tier === "premium") return "Premium"
    if (tier === "free") return "Free"
    if (tier === "partner") return "Partner"
    return tier
  }
  if (tier === "standard") return "Standard"
  if (tier === "premium") return "Premium"
  if (tier === "free") return "Free"
  if (tier === "partner") return "Partner"
  return tier
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
}
