"use client"

import gsap from "gsap"
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  BellRing,
  Bookmark,
  CheckCircle2,
  Coins,
  Crown,
  FileCheck2,
  Flame,
  PackageCheck,
  Plane,
  Radar,
  Search,
  Sparkles,
  TimerReset,
} from "lucide-react"
import Link from "next/link"
import { forwardRef, useEffect, useMemo, useRef, useState, type ReactNode } from "react"

import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"

type JsonRecord = Record<string, any>
type Workspace = {
  userId?: string
  profile?: JsonRecord | null
  subscription?: JsonRecord | null
  opportunities?: JsonRecord[]
  recommendations?: JsonRecord[]
  bids?: JsonRecord[]
  orders?: JsonRecord[]
}
type Opportunity = JsonRecord & {
  matchScore: number | null
  matchReasons: string[]
  submitted: boolean
  resultStatus?: string | null
}
type Tab = "recommended" | "all" | "bids" | "closing" | "results" | "watchlist"
type LoadState = "loading" | "ready" | "error"

const TOKEN_COST = 1

const zh = {
  title: "\u7af6\u50f9\u6307\u63ee\u4e2d\u5fc3",
  subtitle: "\u771f\u5be6\u6a5f\u6703\u3001\u5bc6\u5c01\u5831\u50f9\u3001\u516c\u5e73\u7af6\u722d\u3002",
  search: "\u641c\u5c0b\u822a\u7dda\u3001\u6a5f\u5834\u3001\u6e2f\u53e3\u3001\u8ca8\u7269\u6216 SR ID...",
  tokenBalance: "Token \u9918\u984d",
  topUp: "\u5132\u503c",
  eligible: "\u53ef\u7af6\u50f9\u6a5f\u6703",
  closing: "1 \u5c0f\u6642\u5167\u622a\u6a19",
  recommended: "\u7cfb\u7d71\u63a8\u85a6",
  submitted: "\u5df2\u63d0\u4ea4\u5831\u50f9",
  orders: "\u5f97\u6a19\u8a02\u55ae",
  alerts: "\u91cd\u8981\u52d5\u614b",
  viewAlerts: "\u67e5\u770b\u5168\u90e8\u52d5\u614b",
  tabs: ["\u70ba\u4f60\u63a8\u85a6", "\u5168\u90e8\u6a5f\u6703", "\u6211\u7684\u5831\u50f9", "\u5373\u5c07\u622a\u6a19", "\u7d50\u679c", "\u89c0\u5bdf\u6e05\u55ae"],
  sortMatch: "\u914d\u5c0d\u5ea6",
  sortDeadline: "\u622a\u6a19\u6642\u9593",
  selected: "\u5df2\u9078\u6a5f\u6703",
  general: "\u516c\u958b\u6a5f\u6703",
  closingIn: "\u8ddd\u96e2\u622a\u6a19",
  whyMatched: "\u914d\u5c0d\u539f\u56e0",
  eligibility: "\u7af6\u50f9\u8cc7\u683c",
  viewScope: "\u67e5\u770b\u5b8c\u6574\u9700\u6c42",
  viewBid: "\u67e5\u770b\u5df2\u63d0\u4ea4\u5831\u50f9",
  watch: "\u52a0\u5165\u89c0\u5bdf\u6e05\u55ae",
  watching: "\u5df2\u52a0\u5165\u89c0\u5bdf",
  tokenRequired: "1 Token \u6240\u9700",
  atomicDebit: "\u4ea4\u6613\u5f0f\u6263\u9664",
  noFake: "\u6b64\u9801\u53ea\u986f\u793a Supabase \u7684\u771f\u5be6 SR\uff0c\u4e0d\u6703\u4f7f\u7528\u793a\u7bc4\u6a5f\u6703\u5145\u6578\u3002",
  load: "\u6b63\u5728\u8f09\u5165\u5be6\u6642\u6a5f\u6703...",
  origin: "\u51fa\u767c\u5730",
  destination: "\u76ee\u7684\u5730",
  topMatch: "\u4eca\u65e5\u6700\u4f73\u914d\u5c0d",
  calculated: "\u6839\u64da\u4f60\u7684\u516c\u53f8\u6a94\u6848\u8a08\u7b97",
  noScore: "\u672a\u7372\u5206\u914d\u63a8\u85a6\u5206\u6578",
  submitBefore: "\u8acb\u5728\u622a\u6a19\u524d\u63d0\u4ea4\u6700\u7d42\u5bc6\u5c01\u5831\u50f9\u3002",
  notScored: "\u6b64 SR \u53ef\u4ee5\u700f\u89bd\uff0c\u4f46\u4e0d\u5c6c\u65bc\u7cfb\u7d71\u8a08\u5206\u63a8\u85a6\u3002",
  eligibleStatus: "\u7b26\u5408\u8cc7\u683c",
  submittedStatus: "\u5df2\u63d0\u4ea4",
  recommendedTag: "\u63a8\u85a6",
  closingSoon: "\u5373\u5c07\u622a\u6a19",
  verifiedClient: "\u5df2\u9a57\u8b49 Client",
  onboardedClient: "\u5df2\u5b8c\u6210\u5165\u99d0 Client",
  scopeLocked: "\u9700\u6c42\u5df2\u9396\u5b9a",
  sealed: "\u5bc6\u5c01\u7af6\u50f9",
  termsPending: "\u8cbf\u6613\u689d\u6b3e\u5f85\u5b9a",
  generalCargo: "\u4e00\u822c\u8ca8\u7269",
  air: "\u7a7a\u904b",
  sea: "\u6d77\u904b",
  road: "\u9678\u904b",
  lowRisk: "\u4f4e\u98a8\u96aa",
  mediumRisk: "\u4e2d\u98a8\u96aa",
  highRisk: "\u9ad8\u98a8\u96aa",
  critical: "\u5373\u5c07\u622a\u6a19",
  highUrgency: "\u9ad8\u5ea6\u7dca\u6025",
  moderateUrgency: "\u4e2d\u5ea6\u7dca\u6025",
  plentyTime: "\u6642\u9593\u5145\u8db3",
  charged: "\u53ea\u6703\u5728\u5831\u50f9\u6210\u529f\u63d0\u4ea4\u5f8c\u6263\u9664\uff0c\u4e26\u8a18\u9304\u65bc Token ledger\u3002",
  noCritical: "\u76ee\u524d\u6c92\u6709\u5373\u5c07\u622a\u6a19\u7684\u6a5f\u6703",
  allWindowsSafe: "\u6240\u6709\u7af6\u50f9\u8996\u7a97\u4ecd\u6709\u5145\u8db3\u6642\u9593",
  reviewBefore: "\u8acb\u5728\u8996\u7a97\u95dc\u9589\u524d\u5b8c\u6210\u6aa2\u8996",
  waitingScored: "\u6b63\u5728\u7b49\u5f85\u65b0\u7684\u8a08\u5206\u914d\u5c0d",
  recommendationsProfile: "\u63a8\u85a6\u6839\u64da\u5df2\u9a57\u8b49\u7684\u516c\u53f8\u6a94\u6848",
  noNewScope: "\u76ee\u524d\u6c92\u6709\u65b0\u9700\u6c42",
  newLiveRequest: "\u65b0\u7684\u5be6\u6642\u8ca8\u904b\u9700\u6c42",
}

const en = {
  title: "Bidding Command Center",
  subtitle: "Real opportunities. Sealed bids. Fair competition.",
  search: "Search route, airport, port, cargo or SR ID...",
  tokenBalance: "Token balance",
  topUp: "Top up",
  eligible: "Eligible opportunities",
  closing: "Closing within 1 hour",
  recommended: "Recommended matches",
  submitted: "Submitted bids",
  orders: "Awarded orders",
  alerts: "Important activity",
  viewAlerts: "View all activity",
  tabs: ["Recommended", "All opportunities", "My bids", "Closing soon", "Results", "Watchlist"],
  sortMatch: "Match score",
  sortDeadline: "Deadline",
  selected: "Selected opportunity",
  general: "General opportunity",
  closingIn: "Bidding closes in",
  whyMatched: "Why matched",
  eligibility: "Bid eligibility",
  viewScope: "View full scope",
  viewBid: "View submitted bid",
  watch: "Add to watchlist",
  watching: "Watching",
  tokenRequired: "1 Token required",
  atomicDebit: "Atomic debit",
  noFake: "This view only shows real Supabase shipment requests. Demo opportunities are never inserted here.",
  load: "Loading live opportunities...",
  origin: "Origin",
  destination: "Destination",
  topMatch: "Top match of the day",
  calculated: "Calculated from your company profile",
  noScore: "No recommendation score assigned",
  submitBefore: "Submit your final sealed quote before this deadline.",
  notScored: "This SR is available to browse but is not a scored recommendation.",
  eligibleStatus: "Eligible",
  submittedStatus: "Submitted",
  recommendedTag: "Recommended",
  closingSoon: "Closing soon",
  verifiedClient: "Verified Client",
  onboardedClient: "Onboarded Client",
  scopeLocked: "Scope Locked",
  sealed: "Sealed Bidding",
  termsPending: "Terms pending",
  generalCargo: "General cargo",
  air: "Air",
  sea: "Sea",
  road: "Road",
  lowRisk: "Low Risk",
  mediumRisk: "Medium Risk",
  highRisk: "High Risk",
  critical: "Critical deadline",
  highUrgency: "High urgency",
  moderateUrgency: "Moderate urgency",
  plentyTime: "Plenty of time",
  charged: "Charged only after successful submission and recorded in the token ledger.",
  noCritical: "No critical deadlines",
  allWindowsSafe: "All live windows have more time",
  reviewBefore: "Review before the window closes",
  waitingScored: "Waiting for a scored match",
  recommendationsProfile: "Recommendations use your verified profile",
  noNewScope: "No new scope",
  newLiveRequest: "New live shipment request",
}

export function BiddingCommandCenter({ locale }: { locale: Locale }) {
  const rootRef = useRef<HTMLElement>(null)
  const selectedPanelRef = useRef<HTMLElement>(null)
  const [state, setState] = useState<LoadState>("loading")
  const [workspace, setWorkspace] = useState<Workspace>({})
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<Tab>("recommended")
  const [mode, setMode] = useState<"all" | "air" | "sea">("all")
  const [sort, setSort] = useState<"match" | "deadline">("match")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [now, setNow] = useState(() => Date.now())
  const isZh = locale === "zh"
  const copy = isZh ? zh : en

  useEffect(() => {
    let active = true
    apiJson("/api/workspace").then(({ response, body }) => {
      if (!active) return
      if (!response.ok) {
        setError(body.error || "WORKSPACE_LOAD_FAILED")
        setState("error")
        return
      }
      setWorkspace(body)
      setState("ready")
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!workspace.userId) return
    const stored = window.localStorage.getItem(`lbid-watchlist-${workspace.userId}`)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) setWatchlist(parsed.map(String))
    } catch {
      window.localStorage.removeItem(`lbid-watchlist-${workspace.userId}`)
    }
  }, [workspace.userId])

  const recommendationByRequest = useMemo(() => {
    const map = new Map<string, { score: number; reasons: string[] }>()
    for (const recommendation of workspace.recommendations || []) {
      map.set(String(recommendation.shipment_request_id), {
        score: Number(recommendation.match_score || 0),
        reasons: Array.isArray(recommendation.reasons) ? recommendation.reasons : [],
      })
    }
    return map
  }, [workspace.recommendations])

  const submittedIds = useMemo(() => new Set((workspace.bids || []).map((bid) => String(bid.sr_id))), [workspace.bids])

  const liveOpportunities = useMemo<Opportunity[]>(() => (workspace.opportunities || []).map((item) => {
    const match = recommendationByRequest.get(String(item.id))
    return {
      ...item,
      matchScore: match?.score ?? null,
      matchReasons: match?.reasons ?? [],
      submitted: submittedIds.has(String(item.id)),
    }
  }), [recommendationByRequest, submittedIds, workspace.opportunities])

  const resultOpportunities = useMemo<Opportunity[]>(() => (workspace.bids || [])
    .filter((bid) => bid.shipment_requests?.status && bid.shipment_requests.status !== "OPEN")
    .map((bid) => ({
      ...(bid.shipment_requests || {}),
      id: bid.sr_id,
      matchScore: recommendationByRequest.get(String(bid.sr_id))?.score ?? null,
      matchReasons: recommendationByRequest.get(String(bid.sr_id))?.reasons ?? [],
      submitted: true,
      resultStatus: bid.shipment_requests?.status,
    })), [recommendationByRequest, workspace.bids])

  const filtered = useMemo(() => {
    const source = tab === "results" ? resultOpportunities : liveOpportunities
    return source.filter((item) => {
      const remaining = secondsLeft(item.bid_deadline, now)
      const cargoMode = String(item.cargo_details?.mode || "").toLowerCase()
      const modeMatch = mode === "all" || cargoMode === mode
      const queryMatch = opportunitySearchText(item).includes(query.trim().toLowerCase())
      const tabMatch = tab === "recommended" ? item.matchScore !== null
        : tab === "bids" ? item.submitted
          : tab === "closing" ? remaining > 0 && remaining <= 3600
            : tab === "watchlist" ? watchlist.includes(String(item.id))
              : true
      return modeMatch && queryMatch && tabMatch
    }).sort((a, b) => sort === "match"
      ? (b.matchScore ?? -1) - (a.matchScore ?? -1)
      : secondsLeft(a.bid_deadline, now) - secondsLeft(b.bid_deadline, now))
  }, [liveOpportunities, mode, now, query, resultOpportunities, sort, tab, watchlist])

  const featured = filtered.find((item) => item.matchScore !== null) || filtered[0] || null
  const standardRows = featured ? filtered.filter((item) => item.id !== featured.id) : []
  const selected = filtered.find((item) => item.id === selectedId) || featured
  const tokenBalance = Number(workspace.profile?.token_balance_free || 0) + Number(workspace.profile?.token_balance_paid || 0)
  const closingCount = liveOpportunities.filter((item) => {
    const remaining = secondsLeft(item.bid_deadline, now)
    return remaining > 0 && remaining <= 3600
  }).length

  useEffect(() => {
    if (state !== "ready" || !rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: "power3.out" } })
      timeline
        .fromTo("[data-bcc-heading]", { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.45 })
        .fromTo("[data-bcc-alert]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.4 }, "-=0.2")
        .fromTo("[data-bcc-metric]", { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.35, stagger: 0.05 }, "-=0.2")
        .fromTo("[data-bcc-feature]", { autoAlpha: 0, scale: 0.985, y: 12 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.55 }, "-=0.1")
      gsap.to("[data-bcc-plane]", { x: 8, y: -2, duration: 1.8, repeat: -1, yoyo: true, ease: "sine.inOut" })
      gsap.to("[data-bcc-glow]", { opacity: 0.72, scale: 1.08, duration: 2.1, repeat: -1, yoyo: true, ease: "sine.inOut" })
      gsap.to("[data-bcc-urgent]", { boxShadow: "0 0 0 7px rgba(220,52,43,0)", duration: 1.1, repeat: -1, ease: "power1.out" })
    }, rootRef)
    return () => context.revert()
  }, [state])

  useEffect(() => {
    if (!selectedPanelRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    gsap.fromTo(selectedPanelRef.current, { autoAlpha: 0.72, x: 12 }, { autoAlpha: 1, x: 0, duration: 0.32, ease: "power2.out" })
  }, [selected?.id])

  useEffect(() => {
    if (state !== "ready" || !rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const context = gsap.context(() => {
      gsap.fromTo("[data-bcc-row]", { autoAlpha: 0.65, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.3, stagger: 0.035, ease: "power2.out" })
    }, rootRef)
    return () => context.revert()
  }, [mode, sort, tab, state])

  function toggleWatch(id: string) {
    const next = watchlist.includes(id) ? watchlist.filter((value) => value !== id) : [...watchlist, id]
    setWatchlist(next)
    if (workspace.userId) window.localStorage.setItem(`lbid-watchlist-${workspace.userId}`, JSON.stringify(next))
  }

  const stats = [
    { label: copy.eligible, value: liveOpportunities.filter((item) => !item.submitted).length, icon: Radar, tone: "blue" },
    { label: copy.closing, value: closingCount, icon: TimerReset, tone: closingCount ? "red" : "slate" },
    { label: copy.recommended, value: liveOpportunities.filter((item) => item.matchScore !== null).length, icon: Sparkles, tone: "gold" },
    { label: copy.submitted, value: (workspace.bids || []).length, icon: FileCheck2, tone: "violet" },
    { label: copy.orders, value: (workspace.orders || []).length, icon: Award, tone: "green" },
  ] as const

  if (state === "loading") return <CommandShell><LoadingState label={copy.load} /></CommandShell>
  if (state === "error") return <CommandShell><ErrorState error={error} /></CommandShell>

  return (
    <main ref={rootRef} className="min-h-screen bg-[#f4f6fa] px-4 py-5 text-[#17233a] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1540px]">
        <header data-bcc-heading className="grid gap-4 xl:grid-cols-[minmax(280px,1fr)_minmax(360px,520px)_auto] xl:items-center">
          <div>
            <h1 className="text-[30px] font-bold leading-none tracking-0 text-[#142039] sm:text-[38px]">{copy.title}</h1>
            <p className="mt-2 text-[12px] text-[#5f6d83]">{copy.subtitle}</p>
          </div>
          <label className="flex h-12 items-center gap-3 rounded-[8px] border border-[#dde2ea] bg-white px-4 shadow-[0_5px_18px_rgba(24,37,67,0.045)] transition focus-within:border-[#9ba9bd] focus-within:shadow-[0_0_0_3px_rgba(35,55,89,0.08)]">
            <Search className="h-4 w-4 text-[#647289]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#98a2b3]" />
          </label>
          <div className="flex items-center gap-3">
            <div className="min-w-[170px] rounded-[8px] border border-[#e6dfd4] bg-[#fffdf9] px-4 py-2.5 shadow-[0_5px_18px_rgba(99,72,30,0.05)]">
              <p className="text-[8px] font-bold uppercase tracking-[0.09em] text-[#776447]">{copy.tokenBalance}</p>
              <div className="mt-1 flex items-center gap-2"><Coins className="h-5 w-5 text-[#c58222]" /><strong className="text-[21px] tabular-nums">{tokenBalance}</strong><span className="text-[9px] text-[#68758a]">Token</span><Link href={`/${locale}/tokens`} className="ml-auto rounded-[5px] border border-[#e6d8bf] px-2 py-1 text-[8px] font-bold text-[#745329] transition hover:bg-[#fff3dd]">{copy.topUp}</Link></div>
            </div>
            <MembershipCard subscription={workspace.subscription || {}} />
          </div>
        </header>

        <ActivityRail locale={locale} items={liveOpportunities} closingCount={closingCount} copy={copy} />

        <section className="mt-3 grid overflow-hidden rounded-[9px] border border-[#e0e4eb] bg-white shadow-[0_8px_22px_rgba(24,37,67,0.04)] sm:grid-cols-2 xl:grid-cols-5">
          {stats.map((item) => <Metric key={item.label} {...item} />)}
        </section>

        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="min-w-0">
            <div className="flex flex-col gap-3 border-b border-[#dfe3ea] lg:flex-row lg:items-end lg:justify-between">
              <div className="flex min-w-0 gap-1 overflow-x-auto" role="tablist" aria-label="Opportunity views">
                {(["recommended", "all", "bids", "closing", "results", "watchlist"] as Tab[]).map((value, index) => (
                  <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)} className={`whitespace-nowrap border-b-2 px-3 py-3 text-[11px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c38b2c]/30 ${tab === value ? "border-[#c88d27] text-[#17233a]" : "border-transparent text-[#66748a] hover:text-[#25344d]"}`}>{copy.tabs[index]}{value === "closing" && closingCount ? <span className="ml-2 rounded-full bg-[#e43a31] px-1.5 py-0.5 text-[8px] text-white">{closingCount}</span> : null}</button>
                ))}
              </div>
              <div className="mb-2 flex flex-wrap gap-2">
                <div className="flex rounded-[6px] border border-[#dfe3ea] bg-white p-1">
                  {(["all", "air", "sea"] as const).map((value) => <button key={value} onClick={() => setMode(value)} className={`rounded-[4px] px-2.5 py-1.5 text-[9px] font-bold capitalize transition ${mode === value ? "bg-[#172846] text-white" : "text-[#66748a] hover:bg-[#f1f4f8]"}`}>{value}</button>)}
                </div>
                <select value={sort} onChange={(event) => setSort(event.target.value as "match" | "deadline")} className="h-9 rounded-[6px] border border-[#dfe3ea] bg-white px-3 text-[9px] font-semibold text-[#425168] outline-none focus:border-[#a8b3c3]">
                  <option value="match">{copy.sortMatch}</option>
                  <option value="deadline">{copy.sortDeadline}</option>
                </select>
              </div>
            </div>

            {featured ? (
              <div className="mt-3 space-y-2.5">
                <FeaturedOpportunity item={featured} now={now} selected={selected?.id === featured.id} watched={watchlist.includes(String(featured.id))} onSelect={() => setSelectedId(String(featured.id))} onWatch={() => toggleWatch(String(featured.id))} copy={copy} />
                {standardRows.map((item) => <OpportunityRow key={item.id} item={item} now={now} selected={selected?.id === item.id} watched={watchlist.includes(String(item.id))} onSelect={() => setSelectedId(String(item.id))} onWatch={() => toggleWatch(String(item.id))} copy={copy} />)}
              </div>
            ) : <EmptyState copy={copy} canForward={Boolean(workspace.profile?.can_be_forwarder && workspace.profile?.onboarding_completed)} />}
          </section>

          {selected ? <SelectedOpportunityPanel ref={selectedPanelRef} item={selected} now={now} locale={locale} profile={workspace.profile || {}} subscription={workspace.subscription || {}} tokenBalance={tokenBalance} watched={watchlist.includes(String(selected.id))} onWatch={() => toggleWatch(String(selected.id))} copy={copy} /> : null}
        </div>
      </div>
    </main>
  )
}

function CommandShell({ children }: { children: ReactNode }) {
  return <main className="min-h-screen bg-[#f4f6fa] px-5 py-8"><div className="mx-auto max-w-[1540px]">{children}</div></main>
}

function LoadingState({ label }: { label: string }) {
  return <div className="space-y-3"><div className="h-16 animate-pulse rounded-[9px] bg-white" /><div className="h-24 animate-pulse rounded-[9px] bg-white" /><div className="h-[420px] animate-pulse rounded-[9px] bg-[#e7ebf2]" /><p className="text-center text-[11px] text-[#718096]">{label}</p></div>
}

function ErrorState({ error }: { error: string }) {
  return <div className="rounded-[9px] border border-[#efc3bd] bg-[#fff4f2] p-6"><div className="flex gap-3"><AlertTriangle className="h-5 w-5 text-[#c74839]" /><div><p className="text-[13px] font-bold text-[#8e3027]">Command Center could not load</p><p className="mt-1 text-[11px] text-[#a85449]">{error}</p></div></div></div>
}

function ActivityRail({ locale, items, closingCount, copy }: { locale: Locale; items: Opportunity[]; closingCount: number; copy: typeof en }) {
  const top = [...items].filter((item) => item.matchScore !== null).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))[0]
  const recent = [...items].sort((a, b) => new Date(String(b.created_at)).getTime() - new Date(String(a.created_at)).getTime())[0]
  const alerts = [
    { icon: Flame, tone: "orange", title: closingCount ? `${closingCount} ${copy.closing}` : copy.noCritical, meta: closingCount ? copy.reviewBefore : copy.allWindowsSafe },
    { icon: Plane, tone: "blue", title: top ? `${routeParts(top).originCode} -> ${routeParts(top).destinationCode}` : copy.waitingScored, meta: top ? `${top.matchScore}% Match` : copy.recommendationsProfile },
    { icon: PackageCheck, tone: "green", title: recent ? `SR ${shortId(recent.id)}` : copy.noNewScope, meta: recent ? copy.newLiveRequest : copy.noNewScope },
  ] as const
  return <section data-bcc-alert className="mt-5 grid overflow-hidden rounded-[9px] border border-[#e0e4eb] bg-white shadow-[0_8px_22px_rgba(24,37,67,0.04)] lg:grid-cols-[170px_1fr_1fr_1fr_auto]">
    <div className="flex items-center gap-2 border-b border-[#e6e9ef] px-4 py-3 lg:border-b-0 lg:border-r"><BellRing className="h-4 w-4 text-[#b87b20]" /><span className="text-[10px] font-bold text-[#28354b]">{copy.alerts}</span></div>
    {alerts.map(({ icon: Icon, tone, title, meta }) => <div key={title} className="flex min-w-0 items-center gap-3 border-b border-[#e6e9ef] px-4 py-3 lg:border-b-0 lg:border-r"><span className={`grid h-8 w-8 flex-shrink-0 place-items-center rounded-[6px] ${tone === "orange" ? "bg-[#fff0df] text-[#d27919]" : tone === "blue" ? "bg-[#eaf2ff] text-[#3570c6]" : "bg-[#e7f6f1] text-[#198567]"}`}><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-[10px] font-bold text-[#26344b]">{title}</p><p className="mt-0.5 truncate text-[8.5px] text-[#778297]">{meta}</p></div></div>)}
    <Link href={`/${locale}/notifications`} className="flex items-center justify-center gap-2 px-4 py-3 text-[9px] font-bold text-[#3a4860] transition hover:bg-[#f7f8fa]">{copy.viewAlerts}<ArrowRight className="h-3.5 w-3.5" /></Link>
  </section>
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Radar; tone: "blue" | "red" | "gold" | "violet" | "green" | "slate" }) {
  const tones = { blue: "bg-[#e8f0ff] text-[#376cc0]", red: "bg-[#fff0ed] text-[#dc3e32]", gold: "bg-[#fff2dc] text-[#c77a18]", violet: "bg-[#f1edff] text-[#7458bd]", green: "bg-[#e7f6ef] text-[#16845e]", slate: "bg-[#eef1f5] text-[#647289]" }
  return <div data-bcc-metric className="flex min-h-[82px] items-center gap-3 border-b border-[#e7eaf0] px-4 py-3 transition hover:bg-[#fafbfd] sm:border-r xl:border-b-0 last:border-r-0"><span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-[7px] ${tones[tone]}`}><Icon className="h-4 w-4" /></span><div><p className="text-[8.5px] font-semibold text-[#627087]">{label}</p><p className="mt-1 text-[22px] font-bold leading-none tabular-nums text-[#142039]">{value}</p></div></div>
}

function MembershipCard({ subscription }: { subscription: JsonRecord }) {
  const active = subscription.status === "active" || subscription.status === "trial"
  const label = subscription.status === "trial" ? "Trial" : subscription.plan === "annual" ? "Annual" : subscription.plan === "monthly" ? "Monthly" : "Free"
  return <div className="hidden min-w-[125px] items-center gap-2 rounded-[8px] border border-[#e7dfd1] bg-white px-3 py-3 shadow-[0_5px_18px_rgba(24,37,67,0.04)] 2xl:flex"><Crown className="h-5 w-5 text-[#bf8425]" /><div><p className="text-[8px] uppercase text-[#7b8798]">Membership</p><p className="text-[10px] font-bold text-[#28354b]">{label}</p></div>{active ? <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-[#16845e]" /> : null}</div>
}

function FeaturedOpportunity({ item, now, selected, watched, onSelect, onWatch, copy }: OpportunityProps) {
  const route = routeParts(item)
  const cargo = item.cargo_details || {}
  const remaining = secondsLeft(item.bid_deadline, now)
  return <article data-bcc-feature data-bcc-row className={`relative overflow-hidden rounded-[11px] border bg-[#12191d] text-white shadow-[0_16px_42px_rgba(15,22,27,0.16)] transition ${selected ? "border-[#d9b25f]" : "border-[#2b3438]"}`}>
    <div data-bcc-glow className="pointer-events-none absolute -left-10 bottom-[-80px] h-52 w-80 rounded-full bg-[#b47718]/20 blur-3xl" />
    <button type="button" onClick={onSelect} className="relative grid w-full gap-5 p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#e0b557] lg:grid-cols-[145px_minmax(0,1fr)_220px] lg:items-center">
      <div className="flex flex-col items-center gap-2"><span className="rounded-[4px] border border-[#947331] bg-[#28261f] px-2 py-1 text-[8px] font-bold uppercase tracking-[0.08em] text-[#efca78]">{copy.topMatch}</span><ScoreRing score={item.matchScore} featured /></div>
      <div className="min-w-0">
        <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]"><div><p className="text-[9px] text-[#9fa9ac]">{copy.origin}</p><p className="mt-1 text-[25px] font-bold text-[#f2d58e]">{route.originCode}</p><p className="text-[10px] text-[#d7dbd9]">{route.origin}</p></div><div className="relative flex items-center gap-3"><span className="h-px w-10 bg-[#ae8a46]" /><Plane data-bcc-plane className="h-7 w-7 text-[#f3c866]" /><span className="h-px w-10 bg-[#ae8a46]" /></div><div className="sm:text-right"><p className="text-[9px] text-[#9fa9ac]">{copy.destination}</p><p className="mt-1 text-[25px] font-bold text-[#f2d58e]">{route.destinationCode}</p><p className="text-[10px] text-[#d7dbd9]">{route.destination}</p></div></div>
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[9px] text-[#e0e3df]"><span>{modeLabel(cargo.mode, copy)}</span><span>{cargo.incoterm || copy.termsPending}</span><span>{cargo.cargo || cargo.cargo_type || copy.generalCargo}</span><span>{cargo.weight_kg || "--"} kg</span><span>{cargo.cbm || "--"} CBM</span></div>
        <div className="mt-4 flex flex-wrap gap-1.5"><TrustBadge label={item.client_verified ? copy.verifiedClient : copy.onboardedClient} tone="green" /><TrustBadge label={copy.scopeLocked} tone="violet" /><TrustBadge label={copy.sealed} tone="gold" /><TrustBadge label={riskLabel(cargo, copy)} tone={riskLabel(cargo, copy) === copy.lowRisk ? "green" : "amber"} /></div>
      </div>
      <div className="border-t border-white/10 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0"><p className="text-[9px] font-bold uppercase text-[#c9b57d]">{copy.closingIn}</p><p className={`mt-2 font-mono text-[30px] font-bold tabular-nums ${remaining <= 900 ? "text-[#ff6d5f]" : "text-[#f1c875]"}`}>{formatCountdown(remaining)}</p><p className="mt-2 text-[9px] text-[#b7bebc]">{urgencyLabel(remaining, copy)}</p><UrgencyDots remaining={remaining} dark /><div className="mt-4 flex items-center justify-between"><span className="text-[13px] font-bold text-[#e5bf68]">{TOKEN_COST} Token</span><span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#66cca6]">{item.submitted ? copy.submittedStatus : copy.eligibleStatus}<CheckCircle2 className="h-3.5 w-3.5" /></span></div></div>
    </button>
    <button type="button" onClick={onWatch} aria-label={watched ? "Remove from watchlist" : "Add to watchlist"} className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-[#e2c77e] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e2c77e]"><Bookmark className={`h-4 w-4 ${watched ? "fill-current" : ""}`} /></button>
  </article>
}

function OpportunityRow({ item, now, selected, watched, onSelect, onWatch, copy }: OpportunityProps) {
  const route = routeParts(item)
  const cargo = item.cargo_details || {}
  const remaining = secondsLeft(item.bid_deadline, now)
  const urgent = remaining > 0 && remaining <= 900
  return <article data-bcc-row className={`relative rounded-[9px] border bg-white shadow-[0_6px_18px_rgba(24,37,67,0.04)] transition hover:-translate-y-px hover:shadow-[0_11px_25px_rgba(24,37,67,0.08)] ${selected ? "border-[#c99a46]" : "border-[#e0e4eb]"}`}>
    <button type="button" onClick={onSelect} className="grid w-full gap-4 p-4 pr-14 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c99a46]/40 sm:grid-cols-[74px_minmax(0,1fr)_150px_86px] sm:items-center">
      <ScoreRing score={item.matchScore} />
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{item.matchScore !== null ? <span className="rounded-[4px] bg-[#eef4ff] px-1.5 py-0.5 text-[7.5px] font-bold uppercase text-[#3562a8]">{copy.recommendedTag}</span> : null}{urgent ? <span className="rounded-[4px] bg-[#fff0ed] px-1.5 py-0.5 text-[7.5px] font-bold uppercase text-[#d93830]">{copy.closingSoon}</span> : null}</div><p className="mt-1 truncate text-[13px] font-bold text-[#142039]">{route.origin} ({route.originCode}) <span className="px-1 text-[#8792a3]">-&gt;</span> {route.destination} ({route.destinationCode})</p><p className="mt-1 truncate text-[9px] text-[#6b788d]">{modeLabel(cargo.mode, copy)} | {cargo.incoterm || copy.termsPending} | {cargo.cargo || cargo.cargo_type || copy.generalCargo} | {cargo.weight_kg || "--"} kg | {cargo.cbm || "--"} CBM</p><div className="mt-2 flex flex-wrap gap-1"><TrustBadge label={item.client_verified ? copy.verifiedClient : copy.onboardedClient} tone="green" /><TrustBadge label={copy.scopeLocked} tone="violet" /><TrustBadge label={copy.sealed} tone="blue" /><TrustBadge label={riskLabel(cargo, copy)} tone={riskLabel(cargo, copy) === copy.lowRisk ? "green" : "amber"} /></div></div>
      <div><p className={`text-[8px] font-bold uppercase ${urgent ? "text-[#d92e2e]" : "text-[#617087]"}`}>{copy.closingIn}</p><p data-bcc-urgent={urgent ? "" : undefined} className={`mt-1 w-fit rounded-[4px] font-mono text-[18px] font-bold tabular-nums ${urgent ? "bg-[#fff0ed] px-1.5 text-[#d92e2e]" : "text-[#142039]"}`}>{formatCountdown(remaining)}</p><p className="mt-1 text-[8px] text-[#7c8798]">{urgencyLabel(remaining, copy)}</p><UrgencyDots remaining={remaining} /></div>
      <div className="text-right"><p className="text-[11px] font-bold text-[#8a5921]">{TOKEN_COST} Token</p><p className={`mt-4 inline-flex items-center gap-1 text-[9px] font-bold ${item.submitted ? "text-[#3562a8]" : "text-[#13845e]"}`}>{item.submitted ? copy.submittedStatus : copy.eligibleStatus}<CheckCircle2 className="h-3.5 w-3.5" /></p></div>
    </button>
    <button type="button" onClick={onWatch} aria-label={watched ? "Remove from watchlist" : "Add to watchlist"} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full text-[#6f7b8d] transition hover:bg-[#f0f3f8] hover:text-[#bd841f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bd841f]/30 sm:top-1/2 sm:-translate-y-1/2"><Bookmark className={`h-4 w-4 ${watched ? "fill-[#d3a246] text-[#d3a246]" : ""}`} /></button>
  </article>
}

const SelectedOpportunityPanel = forwardRef<HTMLElement, { item: Opportunity; now: number; locale: Locale; profile: JsonRecord; subscription: JsonRecord; tokenBalance: number; watched: boolean; onWatch: () => void; copy: typeof en }>(function SelectedOpportunityPanel({ item, now, locale, profile, subscription, tokenBalance, watched, onWatch, copy }, ref) {
  const route = routeParts(item)
  const cargo = item.cargo_details || {}
  const remaining = secondsLeft(item.bid_deadline, now)
  const subscriptionValid = subscription.status === "active" || (subscription.status === "trial" && new Date(subscription.trial_ends_at || 0).getTime() > now)
  const isZh = locale === "zh"
  const checks = [
    { label: isZh ? "Forwarder \u80fd\u529b\u53ca\u5165\u99d0\u8cc7\u6599\u5df2\u5b8c\u6210" : "Forwarder capability and onboarding", ok: Boolean(profile.can_be_forwarder && profile.onboarding_completed) },
    { label: isZh ? "\u6703\u54e1\u6216\u8a66\u7528\u8cc7\u683c\u6709\u6548" : "Active membership or trial", ok: subscriptionValid },
    { label: isZh ? `Token \u9918\u984d\u8db3\u5920 (${tokenBalance})` : `Sufficient token balance (${tokenBalance})`, ok: tokenBalance >= TOKEN_COST },
    { label: isZh ? "\u7af6\u50f9\u8996\u7a97\u4ecd\u7136\u958b\u653e" : "Bidding window remains open", ok: remaining > 0 },
    { label: isZh ? "\u672a\u66fe\u5c0d\u6b64 SR \u63d0\u4ea4\u5831\u50f9" : "No previous bid for this SR", ok: !item.submitted },
  ]
  const eligible = checks.every((check) => check.ok)
  return <aside ref={ref} className="h-fit rounded-[10px] border border-[#e0e4eb] bg-white p-5 shadow-[0_12px_32px_rgba(24,37,67,0.07)] xl:sticky xl:top-5">
    <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#778297]">{copy.selected}</p>{item.matchScore !== null ? <p className="mt-3 text-[30px] font-bold leading-none text-[#17233a]">{item.matchScore}% <span className="text-[15px]">Match</span></p> : <p className="mt-3 text-[18px] font-bold text-[#17233a]">{copy.general}</p>}<p className="mt-2 text-[10px] text-[#637087]">{item.matchScore !== null ? copy.calculated : copy.noScore}</p></div><span className="rounded-[4px] border border-[#d7d0ee] bg-[#f7f4ff] px-2 py-1 text-[8px] font-bold text-[#64519b]">{copy.scopeLocked}</span></div>
    <div className="mt-5 border-y border-[#e8eaf0] py-4"><p className="text-[15px] font-bold text-[#12213a]">{route.originCode} <span className="px-2 text-[#909aab]">-&gt;</span> {route.destinationCode}</p><p className="mt-1 text-[9px] text-[#69758a]">{route.origin} | {route.destination}</p><p className="mt-3 text-[9px] text-[#48566e]">{modeLabel(cargo.mode, copy)} | {cargo.incoterm || copy.termsPending} | {cargo.weight_kg || "--"} kg | {cargo.cbm || "--"} CBM</p></div>
    <div className="mt-4 rounded-[8px] border border-[#eee5d5] bg-[#fffcf7] p-4"><p className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#7d6745]">{copy.closingIn}</p><p className={`mt-2 font-mono text-[23px] font-bold tabular-nums ${remaining <= 900 ? "text-[#d92e2e]" : "text-[#563d24]"}`}>{formatCountdown(remaining)}</p><p className="mt-2 text-[8.5px] text-[#756b5e]">{copy.submitBefore}</p></div>
    <div className="mt-5"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#2b3850]">{copy.whyMatched}</p><div className="mt-3 space-y-2">{item.matchReasons.length ? item.matchReasons.map((reason) => <div key={reason} className="flex gap-2 text-[9.5px] text-[#526078]"><BadgeCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#17835f]" /><span>{localizeReason(reason, isZh)}</span></div>) : <p className="text-[9.5px] leading-5 text-[#7a8495]">{copy.notScored}</p>}</div></div>
    <div className="mt-5 border-t border-[#e8eaf0] pt-4"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#2b3850]">{copy.eligibility}</p><div className="mt-3 space-y-2">{checks.map((check) => <div key={check.label} className="flex items-center justify-between gap-3 text-[9.5px]"><span className="text-[#526078]">{check.label}</span>{check.ok ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-[#13845e]" /> : <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-[#d15b39]" />}</div>)}</div></div>
    <div className="mt-5 border-t border-[#e8eaf0] pt-4"><div className="flex items-center justify-between"><span className="text-[11px] font-bold text-[#6f4921]">{copy.tokenRequired}</span><span className="rounded-[4px] bg-[#fff3dd] px-2 py-1 text-[7.5px] font-bold uppercase text-[#9a6817]">{copy.atomicDebit}</span></div><p className="mt-2 text-[8.5px] leading-4 text-[#7a8495]">{copy.charged}</p></div>
    <Link href={`/${locale}/marketplace/${item.id}`} className={`mt-5 flex h-11 items-center justify-center gap-2 rounded-[7px] text-[11px] font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${eligible ? "bg-[linear-gradient(135deg,#101b24,#3c2b17)] shadow-[0_10px_24px_rgba(35,29,20,0.2)] focus-visible:ring-[#8e6d35]" : "bg-[#32405a] focus-visible:ring-[#32405a]"}`}>{item.submitted ? copy.viewBid : copy.viewScope}<ArrowRight className="h-4 w-4" /></Link>
    <button type="button" onClick={onWatch} className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-[7px] border border-[#ded7ca] bg-white text-[10px] font-semibold text-[#3a465a] transition hover:bg-[#fffaf0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ba8a36]/25"><Bookmark className={`h-4 w-4 ${watched ? "fill-[#c39235] text-[#c39235]" : ""}`} />{watched ? copy.watching : copy.watch}</button>
  </aside>
})

type OpportunityProps = { item: Opportunity; now: number; selected: boolean; watched: boolean; onSelect: () => void; onWatch: () => void; copy: typeof en }

function ScoreRing({ score, featured = false }: { score: number | null; featured?: boolean }) {
  const value = score ?? 0
  const color = value >= 85 ? "#c99a3f" : value >= 70 ? "#168875" : "#3f68ad"
  return <div className={`grid flex-shrink-0 place-items-center rounded-full p-[7px] ${featured ? "h-[118px] w-[118px]" : "h-[64px] w-[64px]"}`} style={{ background: `conic-gradient(${color} ${value * 3.6}deg, ${featured ? "#403728" : "#e8ebf0"} 0deg)` }}><div className={`grid h-full w-full place-items-center rounded-full ${featured ? "bg-[#151b1d] text-[#f1ca78]" : "bg-white text-[#17233a]"}`}><span className={`${featured ? "text-[32px]" : "text-[19px]"} font-bold tabular-nums`}>{score === null ? "--" : `${score}%`}</span></div></div>
}

function TrustBadge({ label, tone }: { label: string; tone: "green" | "blue" | "violet" | "gold" | "amber" }) {
  const tones = { green: "border-[#8bcab5]/55 bg-[#e9f7f2] text-[#176b55]", blue: "border-[#abc4e8]/60 bg-[#edf4ff] text-[#315d99]", violet: "border-[#c7b9e6]/55 bg-[#f4f0fb] text-[#68558e]", gold: "border-[#d7b766]/55 bg-[#fff6df] text-[#8b661c]", amber: "border-[#e6ba8e]/55 bg-[#fff1e5] text-[#a45f2d]" }
  return <span className={`rounded-[4px] border px-1.5 py-0.5 text-[7.5px] font-bold ${tones[tone]}`}>{label}</span>
}

function UrgencyDots({ remaining, dark = false }: { remaining: number; dark?: boolean }) {
  const filled = remaining <= 900 ? 10 : remaining <= 3600 ? 7 : remaining <= 6 * 3600 ? 4 : 2
  return <div className="mt-2 flex gap-1" aria-label={`Urgency level ${filled} of 10`}>{Array.from({ length: 10 }, (_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index < filled ? remaining <= 900 ? "bg-[#e34135]" : remaining <= 3600 ? "bg-[#ed9c29]" : dark ? "bg-[#dfb452]" : "bg-[#6387bd]" : dark ? "bg-white/15" : "bg-[#e2e6ed]"}`} />)}</div>
}

function EmptyState({ copy, canForward }: { copy: typeof en; canForward: boolean }) {
  return <div className="mt-3 rounded-[10px] border border-[#e0e4eb] bg-white px-6 py-12 text-center shadow-[0_8px_24px_rgba(24,37,67,0.045)]"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#eef2f8] text-[#33486c]"><Radar className="h-5 w-5" /></span><h2 className="mt-4 text-[15px] font-bold text-[#17233a]">{canForward ? "No opportunities in this view" : "Complete your Forwarder setup"}</h2><p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-[#748096]">{canForward ? copy.noFake : "Enable Forwarder capability and finish onboarding to access live opportunities."}</p></div>
}

function routeParts(item: JsonRecord) {
  const route = item.route || {}
  const rawOrigin = String(route.origin || "Origin pending")
  const rawDestination = String(route.destination || route.dest || "Destination pending")
  return {
    origin: cleanLocationName(rawOrigin),
    destination: cleanLocationName(rawDestination),
    originCode: locationCode(route.origin_code || rawOrigin),
    destinationCode: locationCode(route.destination_code || rawDestination),
  }
}

function locationCode(value: string) {
  const match = String(value).match(/\(([A-Z0-9]{3,5})\)/)
  if (match) return match[1]
  const cleaned = String(value).replace(/[^A-Za-z]/g, "").toUpperCase()
  return cleaned.slice(0, 3) || "---"
}

function cleanLocationName(value: string) { return String(value).replace(/\s*\([A-Z0-9]{3,5}\)\s*$/, "").trim() }

function shortId(value: unknown) { const text = String(value || ""); return text.length > 12 ? `${text.slice(0, 8)}...` : text }
function secondsLeft(deadline: unknown, now: number) { const value = new Date(String(deadline || 0)).getTime(); return Number.isFinite(value) ? Math.max(0, Math.floor((value - now) / 1000)) : 0 }
function formatCountdown(seconds: number) { const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const rest = seconds % 60; return [hours, minutes, rest].map((value) => String(value).padStart(2, "0")).join(" : ") }
function opportunitySearchText(item: JsonRecord) { const cargo = item.cargo_details || {}; const route = item.route || {}; return `${item.id} ${route.origin} ${route.destination} ${route.dest} ${cargo.cargo} ${cargo.cargo_type} ${cargo.mode} ${(item.services_needed || []).join(" ")}`.toLowerCase() }
function modeLabel(value: unknown, copy: typeof en) { const mode = String(value || "").toLowerCase(); return mode === "sea" ? copy.sea : mode === "road" ? copy.road : copy.air }
function riskLabel(cargo: JsonRecord, copy: typeof en) { const text = JSON.stringify(cargo).toLowerCase(); if (text.includes("danger") || text.includes("hazard") || text.includes("battery")) return copy.highRisk; if (text.includes("cold") || text.includes("temperature") || text.includes("fragile")) return copy.mediumRisk; return copy.lowRisk }
function urgencyLabel(remaining: number, copy: typeof en) { if (remaining <= 900) return copy.critical; if (remaining <= 3600) return copy.highUrgency; if (remaining <= 6 * 3600) return copy.moderateUrgency; return copy.plentyTime }
function localizeReason(reason: string, isZh: boolean) {
  if (!isZh) return reason
  const reasons: Record<string, string> = {
    "Route coverage matches this shipment": "\u4f60\u7684\u670d\u52d9\u822a\u7dda\u8986\u84cb\u6b64\u8ca8\u4ef6",
    "Destination is within your stated coverage": "\u76ee\u7684\u5730\u5c6c\u65bc\u4f60\u7533\u5831\u7684\u670d\u52d9\u7bc4\u570d",
    "Required services match your company profile": "\u6240\u9700\u670d\u52d9\u7b26\u5408\u4f60\u7684\u516c\u53f8\u80fd\u529b",
    "Transport mode matches your stated capability": "\u904b\u8f38\u6a21\u5f0f\u7b26\u5408\u4f60\u7533\u5831\u7684\u80fd\u529b",
    "Company reputation strengthens this match": "\u516c\u53f8\u4fe1\u8b7d\u5206\u6578\u63d0\u5347\u6b64\u6b21\u914d\u5c0d",
    "Verified company profile": "\u516c\u53f8\u6a94\u6848\u5df2\u901a\u904e\u9a57\u8b49",
  }
  return reasons[reason] || reason
}
