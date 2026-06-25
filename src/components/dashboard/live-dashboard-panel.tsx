"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Activity, Award, CheckCircle2, ChevronRight, Clock, Lock, Plane, Ship, TrendingUp } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { apiJson } from "@/lib/api-client"
import { getDemoWorkspace, isWorkspaceEmpty } from "@/lib/demo-workspace"

type Locale = "zh" | "en"
type ShipmentRequest = {
  id: string
  route?: { origin?: string; destination?: string }
  cargo_details?: { cargo?: string; cargo_type?: string; mode?: string; weight_kg?: number; cbm?: number }
  bid_deadline?: string
  created_at?: string
}
type Recommendation = { shipment_request_id: string; match_score: number; reasons?: string[]; shipment_requests?: ShipmentRequest | ShipmentRequest[] | null }

export function LiveDashboardPanel({ locale, mode }: { locale: Locale; mode: "company" | "admin" }) {
  const [workspace, setWorkspace] = useState<any>(null)

  useEffect(() => {
    let cancelled = false
    apiJson("/api/workspace")
      .then(({ response, body }) => {
        if (cancelled) return
        setWorkspace(response.ok && !isWorkspaceEmpty(body) ? body : getDemoWorkspace())
      })
      .catch(() => !cancelled && setWorkspace(getDemoWorkspace()))
    return () => {
      cancelled = true
    }
  }, [])

  if (mode === "admin") {
    return (
      <div className="flex flex-col gap-6 px-9 pb-14 pt-8">
        <h1 className="m-0 text-[28px] font-bold leading-[1.1] tracking-[-0.7px] text-ink">Admin Dashboard</h1>
        <div className="rounded-[20px] border border-line bg-white p-8 shadow-[0_8px_40px_rgba(0,0,0,0.06)]">Review platform requests, payments and accounts.</div>
      </div>
    )
  }

  const data = workspace || getDemoWorkspace()
  const recommendations = (data.recommendations || []) as Recommendation[]
  const opportunities = (data.opportunities || []) as ShipmentRequest[]
  const featured = recommendationRequest(recommendations[0]) || opportunities[0]
  const other = opportunities.filter((item) => item.id !== featured?.id).slice(0, 3)

  return (
    <div className="flex flex-col gap-0 px-9 pb-14 pt-8">
      <div className="mb-7">
        <h1 className="m-0 mb-2 text-[28px] font-bold leading-[1.1] tracking-[-0.7px] text-ink">Good morning, Kenny.</h1>
        <p className="text-[14px] font-normal text-ink-3">1 high-priority opportunity needs your attention today.</p>
      </div>

      <div className="mb-6">
        <StatsStrip />
      </div>

      <div className="mb-5">
        <HeroOpportunity locale={locale} request={featured} recommendation={recommendations[0]} demoMode={Boolean(data.demoMode)} />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[1fr_380px]">
        <PipelineQueue locale={locale} requests={other} />
        <RecentActivity />
      </div>
    </div>
  )
}

function StatsStrip() {
  const stats = [
    { icon: Activity, label: "Bids", value: "23", delta: "+4 last mo.", positive: true },
    { icon: TrendingUp, label: "Win Rate", value: "91%", delta: "+2pp last mo.", positive: true },
    { icon: Award, label: "Volume", value: "HKD 2.4M", delta: "Jun 2026", positive: false },
  ]
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {stats.map((stat, i) => (
        <motion.div key={stat.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-4 rounded-[14px] border border-line/70 bg-white/70 px-5 py-4 backdrop-blur-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-line hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-navy-soft">
            <stat.icon className="h-4 w-4 text-navy" strokeWidth={1.75} />
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.07em] text-ink-3">{stat.label}</span>
            <p className="text-[20px] font-bold leading-none tracking-[-0.5px] text-ink">{stat.value}</p>
            <p className={`mt-0.5 text-[11px] font-medium ${stat.positive ? "text-emerald" : "text-ink-3"}`}>{stat.delta}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function HeroOpportunity({ locale, request, recommendation, demoMode }: { locale: Locale; request?: ShipmentRequest; recommendation?: Recommendation; demoMode: boolean }) {
  const { m, s, total } = useCountdown(request?.bid_deadline)
  const [quote, setQuote] = useState(demoMode ? "24800" : "")
  const [submitted, setSubmitted] = useState(false)
  const isUrgent = total < 5 * 60
  const canSubmit = quote.trim() !== "" && Number(quote) > 0
  const details = request?.cargo_details || {}
  const reasons = recommendation?.reasons?.length ? recommendation.reasons : ["Air cargo capacity ≥ 400 kg verified", "SGN → HKG active route on record", "4.9★ avg. rating on HKG deliveries (32 jobs)", "IATA Cargo Agent certified"]
  const specs = [
    { label: "Weight", value: `${details.weight_kg || 500} kg` },
    { label: "Volume", value: `${details.cbm || 3} CBM` },
    { label: "Freight", value: details.mode || "Air" },
    { label: "Cargo", value: details.cargo_type || "General" },
    { label: "Pickup", value: "26 Jun" },
    { label: "Delivery", value: "27 Jun" },
  ]

  async function handleSubmit() {
    if (!canSubmit || !request) return
    if (demoMode) {
      setSubmitted(true)
      return
    }
    const { response } = await apiJson("/api/bids", { method: "POST", body: JSON.stringify({ sr_id: request.id, price: Number(quote), currency: "HKD" }) })
    if (response.ok) setSubmitted(true)
  }

  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} aria-label="Recommended shipment opportunity" className="relative overflow-hidden rounded-[20px] border border-line/80 bg-white" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.04)" }}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px] rounded-t-[20px]" style={{ background: "linear-gradient(90deg, #0C1A3E 0%, #1E3A7A 55%, #C49A3C 100%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-56" style={{ background: "linear-gradient(180deg, #FAFBFF 0%, transparent 100%)" }} />

      <div className="relative flex flex-col gap-0 px-8 pb-8 pt-9">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-gold" style={{ animation: "pulse 2.2s ease-in-out infinite" }} />
              <span className="select-none text-[10.5px] font-bold uppercase tracking-[0.09em] text-gold-dark">Recommended for You</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full border border-gold-border bg-gold-soft px-3 py-1">
              <Award className="h-3 w-3 flex-shrink-0 text-gold" strokeWidth={2.2} />
              <span className="select-none text-[11.5px] font-semibold text-gold-dark">{recommendation?.match_score || 94}% profile match</span>
            </div>
          </div>

          <motion.div animate={isUrgent ? { scale: [1, 1.025, 1] } : {}} transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }} className={`flex items-center gap-2 rounded-xl border px-4 py-2 transition-all duration-300 ${isUrgent ? "border-red-200 bg-red-50" : "border-line bg-white/80 shadow-[0_1px_4px_rgba(0,0,0,0.05)] backdrop-blur-sm"}`}>
            <Clock className={`h-3.5 w-3.5 flex-shrink-0 ${isUrgent ? "text-red-500" : "text-ink-3"}`} strokeWidth={2} />
            <span className={`font-mono text-[14px] font-bold tabular-nums tracking-[0.03em] ${isUrgent ? "text-red-700" : "text-ink"}`}>{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}</span>
            <span className={`text-[11px] ${isUrgent ? "text-red-400" : "text-ink-3"}`}>remaining</span>
          </motion.div>
        </div>

        <div className="mb-8 flex items-center">
          <div className="flex flex-1 flex-col gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">Origin</span>
            <p className="text-[26px] font-bold leading-[1.1] tracking-[-0.6px] text-ink">{request?.route?.origin || "Ho Chi Minh City"}</p>
            <p className="text-[13px] text-ink-2">SGN · Tan Son Nhat Intl.</p>
          </div>

          <div className="flex flex-col items-center gap-2 px-10">
            <div className="flex items-center gap-2">
              <div className="h-px w-14" style={{ background: "linear-gradient(90deg, #E2E6EE, #0C1A3E)" }} />
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy" style={{ boxShadow: "0 4px 16px rgba(12,26,62,0.30)" }}>
                <Plane className="h-4 w-4 text-white" strokeWidth={1.75} />
              </div>
              <div className="h-px w-14" style={{ background: "linear-gradient(90deg, #0C1A3E, #E2E6EE)" }} />
            </div>
            <span className="rounded-full bg-navy-soft px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em] text-navy">Air · ~2h 30m</span>
          </div>

          <div className="flex flex-1 flex-col items-end gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.09em] text-ink-3">Destination</span>
            <p className="text-[26px] font-bold leading-[1.1] tracking-[-0.6px] text-ink">{request?.route?.destination || "Hong Kong"}</p>
            <p className="text-[13px] text-ink-2">HKG · Hong Kong Intl. Airport</p>
          </div>
        </div>

        <div className="mb-7 flex items-center gap-0 border-y border-line-light py-5">
          {specs.map((spec, i) => (
            <div key={spec.label} className={`flex flex-col gap-1.5 ${i < specs.length - 1 ? "mr-8 border-r border-line pr-8" : ""}`}>
              <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-3">{spec.label}</span>
              <span className="text-[14px] font-semibold text-ink">{spec.value}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-10 xl:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <MatchArc pct={recommendation?.match_score || 94} />
              <div className="flex flex-1 flex-col gap-1 pt-1">
                <span className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-ink-3">Why you were selected</span>
                {reasons.slice(0, 4).map((reason, i) => (
                  <div key={reason} className="flex items-start gap-2">
                    <CheckCircle2 className={`mt-0.5 h-3.5 w-3.5 flex-shrink-0 ${i < 2 ? "text-emerald" : "text-emerald-mid"}`} strokeWidth={2.2} />
                    <span className={`text-[13px] leading-[1.4] ${i < 2 ? "font-medium text-ink" : "font-normal text-ink-2"}`}>{reason}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-3.5">
              <Lock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-ink-3" strokeWidth={2} />
              <p className="text-[12px] leading-[1.6] text-ink-2">
                Your quote is <strong className="font-semibold text-ink">sealed and confidential</strong>. The shipper sees only that qualified forwarders have responded — not the amount or your identity. Quotes are revealed only after the bidding window closes.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.09em] text-ink-3">Your Sealed Quote</span>
            <AnimatePresence mode="wait">
              {submitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col items-center gap-3 py-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-emerald/30 bg-emerald-soft"><CheckCircle2 className="h-6 w-6 text-emerald" strokeWidth={2} /></div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[14px] font-semibold text-ink">Quote Submitted</p>
                    <p className="text-[13px] text-ink-2">HKD {Number(quote).toLocaleString("en-HK", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <p className="px-4 text-[11.5px] leading-[1.55] text-ink-3">You'll be notified when the shipper makes their selection.</p>
                  <button className="flex items-center gap-1 text-[12px] font-medium text-navy transition-all duration-200 ease-in-out hover:underline">View receipt <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} /></button>
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
                  <div className="relative rounded-xl border-2 border-line bg-white transition-all duration-200 ease-in-out focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]">
                    <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 select-none text-[13px] font-semibold text-ink-3">HKD</span>
                    <input type="number" value={quote} onChange={(event) => setQuote(event.target.value)} onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") void handleSubmit() }} placeholder="0.00" aria-label="Quote amount in HKD" className="w-full rounded-xl bg-transparent py-4 pl-[52px] pr-4 text-[22px] font-semibold tracking-[-0.3px] text-ink outline-none placeholder:text-line [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>
                  <button onClick={handleSubmit} disabled={!canSubmit} className="w-full rounded-xl py-3.5 text-[13.5px] font-semibold tracking-[0.02em] text-white transition-all duration-200 ease-in-out hover:enabled:-translate-y-[1px] hover:enabled:shadow-[0_8px_28px_rgba(12,26,62,0.32)] active:enabled:translate-y-0 active:enabled:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40" style={{ background: "linear-gradient(135deg, #0C1A3E 0%, #1A3A7A 100%)", boxShadow: canSubmit ? "0 4px 16px rgba(12,26,62,0.24), inset 0 1px 0 rgba(255,255,255,0.08)" : "none" }}>Submit Sealed Quote</button>
                  <p className="text-center text-[10.5px] text-ink-3">⌘ Return to submit · Quote is binding upon acceptance</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function PipelineQueue({ locale, requests }: { locale: Locale; requests: ShipmentRequest[] }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-[13.5px] font-semibold text-ink">Other Opportunities</h2>
        <Link href={`/${locale}/marketplace`} className="flex items-center gap-0.5 text-[12px] font-medium text-navy transition-all duration-200 ease-in-out hover:underline">View all <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} /></Link>
      </div>
      <div className="flex flex-col gap-2">
        {requests.map((request, i) => <OpRow key={request.id} locale={locale} request={request} delay={i * 0.07} />)}
      </div>
    </div>
  )
}

function OpRow({ locale, request, delay }: { locale: Locale; request: ShipmentRequest; delay: number }) {
  const details = request.cargo_details || {}
  const type = details.mode || "Air"
  const match = request.id.includes("SHA") ? 82 : request.id.includes("BKK") ? 78 : 71
  return (
    <motion.article initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38, delay: 0.22 + delay, ease: [0.16, 1, 0.3, 1] }} className="group flex cursor-pointer items-center gap-3 rounded-[14px] border border-line bg-white px-5 py-4 transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-[#C8CDD8] hover:shadow-[0_4px_18px_rgba(0,0,0,0.07)]">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-canvas transition-colors duration-200 ease-in-out group-hover:bg-navy-soft">{type === "Air" ? <Plane className="h-4 w-4 text-ink-2 transition-colors duration-200 group-hover:text-navy" strokeWidth={1.75} /> : <Ship className="h-4 w-4 text-ink-2 transition-colors duration-200 group-hover:text-navy" strokeWidth={1.75} />}</div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[13.5px] font-medium leading-none text-ink">{request.route?.origin}<span className="mx-1.5 font-normal text-ink-3">→</span>{request.route?.destination}</p>
        <p className="text-[12px] text-ink-3">{details.weight_kg?.toLocaleString("en-HK") || 500} kg · {details.cbm || 3} CBM · {type}</p>
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-1.5">
        <span className={`text-[12.5px] font-semibold ${match >= 80 ? "text-emerald" : "text-blue-600"}`}>{match}% match</span>
        <div className="h-[3px] w-12 overflow-hidden rounded-full bg-line"><div className={`h-full rounded-full transition-all duration-700 ${match >= 80 ? "bg-emerald" : "bg-blue-600"}`} style={{ width: `${match}%` }} /></div>
        <div className="flex items-center gap-1"><Clock className="h-3 w-3 text-ink-3" strokeWidth={1.75} /><span className="text-[11px] text-ink-3">{formatDeadline(request.bid_deadline)}</span></div>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-line transition-colors duration-200 ease-in-out group-hover:text-navy" strokeWidth={2} />
    </motion.article>
  )
}

function RecentActivity() {
  const activities = [
    { title: "Quote accepted", detail: "Guangzhou → Sydney · Air Freight · HKD 24,800", time: "Yesterday, 4:32 PM", dot: "bg-emerald-soft text-emerald ring-emerald/20", symbol: "✓" },
    { title: "Route certification added", detail: "Vietnam corridor approved by LBID review team", time: "20 Jun", dot: "bg-navy-soft text-navy ring-navy/20", symbol: "★" },
    { title: "Profile verified", detail: "IATA credentials confirmed · Badge awarded", time: "18 Jun", dot: "bg-gold-soft text-gold-dark ring-gold/20", symbol: "✓" },
    { title: "Quote submitted", detail: "Manila → Hong Kong · Air · Under review", time: "17 Jun", dot: "bg-canvas text-ink-3 ring-line", symbol: "→" },
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between"><h2 className="text-[13.5px] font-semibold text-ink">Activity</h2><button className="flex items-center gap-0.5 text-[12px] font-medium text-navy transition-all duration-200 ease-in-out hover:underline">All <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} /></button></div>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.28, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_1px_4px_rgba(0,0,0,0.03)]">
        <div className="relative">
          <div aria-hidden className="absolute bottom-0 left-[30px] top-0 w-px bg-line-light" />
          {activities.map((activity, i) => (
            <div key={activity.title} className={`relative flex cursor-default items-start gap-3 px-4 py-3.5 transition-colors duration-150 ease-in-out hover:bg-canvas ${i < activities.length - 1 ? "border-b border-line-light" : ""}`}>
              <div className={`relative z-10 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ring-2 ${activity.dot}`}><span className="text-[10px] font-bold leading-none">{activity.symbol}</span></div>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5"><p className="text-[13px] font-medium leading-snug text-ink">{activity.title}</p><p className="truncate text-[11.5px] text-ink-2">{activity.detail}</p><p className="mt-0.5 text-[10.5px] text-ink-3">{activity.time}</p></div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

function MatchArc({ pct }: { pct: number }) {
  const r = 32
  const c = 2 * Math.PI * r
  const dash = (pct / 100) * c
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" aria-label={`${pct}% match`} style={{ filter: "drop-shadow(0 0 8px rgba(196,154,60,0.18))" }}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#F0EBD9" strokeWidth="4.5" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="#C49A3C" strokeWidth="4.5" strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`} transform="rotate(-90 40 40)" style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.16,1,0.3,1)" }} />
      <text x="40" y="37" textAnchor="middle" dominantBaseline="middle" fill="#7A5E18" fontSize="13.5" fontWeight="700" fontFamily="Inter, -apple-system, sans-serif" letterSpacing="-0.5">{pct}%</text>
      <text x="40" y="50" textAnchor="middle" dominantBaseline="middle" fill="#B8922A" fontSize="8" fontWeight="600" fontFamily="Inter, -apple-system, sans-serif" letterSpacing="0.02em">match</text>
    </svg>
  )
}

function useCountdown(deadline?: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const total = Math.max(0, Math.floor(((deadline ? new Date(deadline).getTime() : Date.now() + 14 * 60 * 1000) - now) / 1000))
  return { m: Math.floor(total / 60), s: total % 60, total }
}
function recommendationRequest(recommendation?: Recommendation) {
  const request = recommendation?.shipment_requests
  return Array.isArray(request) ? request[0] : request || undefined
}
function formatDeadline(deadline?: string) {
  if (!deadline) return "4h 20m"
  const seconds = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)}h`
  return `${Math.ceil(seconds / 86400)} days`
}
