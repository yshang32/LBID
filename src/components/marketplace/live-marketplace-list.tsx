"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Clock3, LockKeyhole, Radar, Sparkles, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { getDemoWorkspace } from "@/lib/demo-workspace"

type Locale = "zh" | "en"
type ShipmentRequest = { id: string; route?: { origin?: string; destination?: string }; cargo_details?: { cargo?: string; cargo_type?: string; mode?: string }; services_needed?: string[]; bid_deadline?: string; status?: string }
type Recommendation = { id: string; match_score: number; reasons?: string[]; status?: string; shipment_requests?: ShipmentRequest | ShipmentRequest[] | null }

const copy = {
  zh: {
    empty: "\u73fe\u5728\u6c92\u6709\u958b\u653e\u7684\u7af6\u50f9\u9700\u6c42\u3002",
    recommendedEmpty: "\u7cfb\u7d71\u6b63\u5728\u70ba\u4f60\u6383\u63cf\u5408\u9069\u7684\u9700\u6c42\u3002",
    demo: "Demo data",
    load: "\u6b63\u5728\u6383\u63cf\u7af6\u50f9\u4efb\u52d9",
    recommended: "\u7cfb\u7d71\u63a8\u85a6",
    market: "\u5168\u90e8\u5e02\u5834",
    mission: "SEALED BID",
    open: "\u7af6\u50f9\u958b\u653e\u4e2d",
    bid: "\u9032\u5165 Bid Mode",
    sealed: "\u5176\u4ed6\u53c3\u8207\u8005\u8cc7\u6599\u5168\u90e8\u5bc6\u5c01\u3002",
    final: "FINAL WINDOW",
    match: "PROFILE MATCH",
    pushed: "PUSHED TO YOU",
  },
  en: {
    empty: "There are no open bid opportunities right now.",
    recommendedEmpty: "LBID is scanning for opportunities that fit your company profile.",
    demo: "Demo data",
    load: "Scanning bid missions",
    recommended: "Recommended for you",
    market: "All marketplace",
    mission: "SEALED BID",
    open: "Bidding open",
    bid: "Enter Bid Mode",
    sealed: "All competitor details remain sealed.",
    final: "FINAL WINDOW",
    match: "PROFILE MATCH",
    pushed: "PUSHED TO YOU",
  },
}

export function LiveMarketplaceList({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [requests, setRequests] = useState<ShipmentRequest[]>([])
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [activeTab, setActiveTab] = useState<"recommended" | "market">("recommended")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [demoMode, setDemoMode] = useState(false)

  useEffect(() => {
    let active = true
    Promise.all([apiJson("/api/shipment-requests"), apiJson("/api/recommendations")]).then(([requestsResult, recommendationsResult]) => {
      if (!active) return
      const demo = getDemoWorkspace()
      let liveRequests: ShipmentRequest[] = []
      let liveRecommendations: Recommendation[] = []
      if (requestsResult.response.ok) liveRequests = (requestsResult.body.shipmentRequests || []).filter((request: ShipmentRequest) => request.status === "OPEN")
      if (recommendationsResult.response.ok) {
        liveRecommendations = (recommendationsResult.body.recommendations || []).map((item: Recommendation) => ({ ...item, shipment_requests: Array.isArray(item.shipment_requests) ? item.shipment_requests[0] : item.shipment_requests })).filter((item: Recommendation) => item.shipment_requests)
      }
      if (!liveRequests.length && !liveRecommendations.length) {
        setRequests(demo.opportunities)
        setRecommendations(demo.recommendations)
        setDemoMode(true)
      } else {
        setRequests(liveRequests)
        setRecommendations(liveRecommendations)
        if (!liveRecommendations.length) setActiveTab("market")
      }
      setLoading(false)
    }).catch(() => {
      if (active) {
        const demo = getDemoWorkspace()
        setRequests(demo.opportunities)
        setRecommendations(demo.recommendations)
        setDemoMode(true)
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [t.empty])

  if (loading) return <p className="mt-6 text-sm text-slate-500">{t.load}</p>
  if (error) return <p className="mt-6 border border-dashed border-lblue/15 bg-white p-8 text-center text-sm text-slate-500">{error}</p>

  const selected = activeTab === "recommended" ? recommendations : requests
  return <section className="mt-6">
    <div className="bid-lane-switch" role="tablist" aria-label="Bid opportunity type">
      <button type="button" role="tab" aria-selected={activeTab === "recommended"} className={activeTab === "recommended" ? "bid-lane-option bid-lane-option-active" : "bid-lane-option"} onClick={() => setActiveTab("recommended")}><Sparkles className="h-4 w-4" />{t.recommended}<strong>{recommendations.length}</strong></button>
      <button type="button" role="tab" aria-selected={activeTab === "market"} className={activeTab === "market" ? "bid-lane-option bid-lane-option-active" : "bid-lane-option"} onClick={() => setActiveTab("market")}><Radar className="h-4 w-4" />{t.market}<strong>{requests.length}</strong></button>
      {demoMode ? <span className="ml-auto inline-flex items-center rounded-full border border-[#e4d29a] bg-[#fff8e8] px-3 py-1 text-[11px] font-semibold text-[#8a6718]">{t.demo}</span> : null}
    </div>
    {!selected.length ? <p className="mt-5 border border-dashed border-lblue/15 bg-white p-8 text-center text-sm text-slate-500">{activeTab === "recommended" ? t.recommendedEmpty : t.empty}</p> : <div className="mt-5 grid gap-4 lg:grid-cols-2">{activeTab === "recommended" ? recommendations.map((recommendation) => <MissionCard key={recommendation.id} locale={locale} request={recommendation.shipment_requests as ShipmentRequest} recommendation={recommendation} t={t} />) : requests.map((request) => <MissionCard key={request.id} locale={locale} request={request} t={t} />)}</div>}
  </section>
}

function MissionCard({ locale, request, recommendation, t }: { locale: Locale; request: ShipmentRequest; recommendation?: Recommendation; t: typeof copy.zh }) {
  const countdown = useCountdown(request.bid_deadline)
  const final = countdown.total > 0 && countdown.total <= 15 * 60 * 1000
  const route = `${request.route?.origin || "-"} \u2192 ${request.route?.destination || "Destination pending"}`
  const cargo = request.cargo_details?.cargo || request.cargo_details?.cargo_type || "-"
  return <Card className={`mission-list-card ${final ? "mission-list-card-final" : ""} ${recommendation ? "mission-list-card-recommended" : ""}`}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><Badge variant={recommendation ? "gold" : "secondary"}>{recommendation ? t.pushed : t.mission}</Badge><Badge variant="teal">{t.open}</Badge>{final ? <Badge variant="secondary">{t.final}</Badge> : null}</div><h2 className="mt-4 text-xl font-semibold text-lblue">{route}</h2><p className="mt-1 text-sm text-slate-600">{cargo}</p></div><div className="text-right"><Clock3 className="ml-auto h-4 w-4 text-[#b18a25]" /><p className="mt-1 font-mono text-lg font-semibold text-lblue">{countdown.label}</p></div></div>{recommendation ? <div className="bid-market-match mt-4"><Target className="h-5 w-5" /><div><p className="text-[11px] font-bold tracking-[.12em] text-[#8b6d1d]">{t.match} {recommendation.match_score}%</p><p className="mt-1 text-xs text-slate-600">{recommendation.reasons?.[0] || "Company profile matched"}</p></div></div> : null}<div className="mt-5 flex items-center justify-between border-t border-[#edf0f4] pt-4"><p className="flex items-center gap-2 text-xs text-slate-500"><LockKeyhole className="h-4 w-4 text-[#b18a25]" />{t.sealed}</p><Button asChild size="sm" variant="gold"><Link href={`/${locale}/marketplace/${request.id}`}><Radar className="h-4 w-4" />{t.bid}<ArrowRight className="h-4 w-4" /></Link></Button></div></CardContent></Card>
}

function useCountdown(deadline?: string) { const [now, setNow] = useState(Date.now()); useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer) }, []); const total = Math.max(0, deadline ? new Date(deadline).getTime() - now : 0); const h = Math.floor(total / 3600000); const m = Math.floor((total % 3600000) / 60000); const s = Math.floor((total % 60000) / 1000); return { total, label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` } }
