"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  Activity,
  Award,
  CheckCircle2,
  ChevronRight,
  CircleCheck,
  Clock3,
  FileCheck,
  LockKeyhole,
  Package,
  Plane,
  Ship,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { motion } from "motion/react"

import { Button } from "@/components/ui/button"
import { apiJson } from "@/lib/api-client"
import { getDemoWorkspace, isWorkspaceEmpty } from "@/lib/demo-workspace"

type Locale = "zh" | "en"
type ShipmentRequest = {
  id: string
  route?: { origin?: string; destination?: string }
  cargo_details?: { cargo?: string; cargo_type?: string; weight?: string | number; weight_kg?: string | number; volume?: string | number; cbm?: string | number; mode?: string }
  bid_deadline?: string
  status: string
  created_at?: string
}
type Order = { id: string; status: string; created_at?: string }
type Recommendation = { id: string; shipment_request_id: string; match_score: number; reasons?: string[]; shipment_requests?: ShipmentRequest | ShipmentRequest[] | null }

const copy = {
  zh: {
    greeting: "今日工作台",
    intro: "LBID 已把最值得處理的競價、訂單和文件提醒放到最前面。",
    loading: "正在準備工作台",
    demo: "Demo data",
    requests: "我的需求",
    opportunities: "可接需求",
    orders: "進行中訂單",
    tokens: "可用 Token",
    recommended: "系統推薦給你",
    match: "Profile match",
    origin: "出發地",
    destination: "目的地",
    remaining: "剩餘",
    open: "競價開放中",
    weight: "重量",
    volume: "體積",
    freight: "運輸",
    cargo: "貨物",
    pickup: "建立",
    why: "為什麼推送給你",
    sealedQuote: "你的密封報價",
    privacy: "報價全程密封。Agency 只會知道有合資格 forwarder 回覆，截標前看不到金額、條款或身份。",
    amount: "HKD",
    submit: "提交密封報價",
    submitting: "正在密封報價",
    submitted: "報價已提交",
    submittedBody: "LBID 會在 Agency 選擇後通知你。",
    quoteError: "未能提交報價，請稍後再試。",
    quoteRequired: "請先輸入有效報價。",
    other: "其他機會",
    activity: "最新活動",
    all: "查看全部",
    noOpportunities: "暫時沒有其他公開需求。新需求會在這裡出現。",
    noActivity: "你的報價、訂單和公司里程碑會在這裡出現。",
    details: "查看詳情",
    unknown: "待確認",
    noFeatured: "暫時沒有合適機會",
    noFeaturedBody: "LBID 會按你的公司能力、服務航線和往績推薦新需求。",
    browse: "瀏覽接單市場",
    active: "競價中",
    orderActive: "訂單進行中",
    profileReady: "公司能力已啟用",
    statNotes: ["等待處理或審核", "正在開放的密封競價", "正在交付的訂單", "每次報價使用 1 Token"],
    finalAlert: "最後競價窗口。請檢查金額並提交密封報價。",
    urgentAlert: "競價快要完結。現在提交才可參與這張單。",
  },
  en: {
    greeting: "Today workspace",
    intro: "LBID brings the most valuable bids, orders and document reminders to the front.",
    loading: "Preparing your workspace",
    demo: "Demo data",
    requests: "My requests",
    opportunities: "Opportunities",
    orders: "Active orders",
    tokens: "Available tokens",
    recommended: "Recommended for you",
    match: "Profile match",
    origin: "Origin",
    destination: "Destination",
    remaining: "remaining",
    open: "Bidding open",
    weight: "Weight",
    volume: "Volume",
    freight: "Freight",
    cargo: "Cargo",
    pickup: "Created",
    why: "Why you were selected",
    sealedQuote: "Your sealed quote",
    privacy: "Your quote is sealed and confidential. Other forwarders cannot see your amount, terms, or identity until the bid window closes.",
    amount: "HKD",
    submit: "Submit sealed quote",
    submitting: "Sealing your quote",
    submitted: "Quote submitted",
    submittedBody: "We will notify you when the agency makes a selection.",
    quoteError: "We could not submit the quote. Please try again.",
    quoteRequired: "Enter a valid quote amount first.",
    other: "Other opportunities",
    activity: "Activity",
    all: "View all",
    noOpportunities: "There are no other public requests right now. New requests will appear here.",
    noActivity: "Your quotes, orders and profile milestones will appear here.",
    details: "View details",
    unknown: "To be confirmed",
    noFeatured: "No suitable opportunity right now",
    noFeaturedBody: "We will recommend new requests based on your capabilities, service routes, and record.",
    browse: "Browse marketplace",
    active: "Open now",
    orderActive: "Order in progress",
    profileReady: "Company capabilities enabled",
    statNotes: ["Awaiting action or review", "Open sealed-bid requests", "Orders in fulfilment", "One Token per submitted bid"],
    finalAlert: "Final bidding window. Review and submit your sealed quote.",
    urgentAlert: "Window closing. Submit your quote now to participate.",
  },
}

export function LiveDashboardPanel({ locale, mode }: { locale: Locale; mode: "company" | "admin" }) {
  const t = copy[locale]
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiJson("/api/workspace")
      .then(({ response, body }) => {
        if (cancelled) return
        if (!response.ok || isWorkspaceEmpty(body)) setData(getDemoWorkspace())
        else setData(body)
      })
      .catch(() => !cancelled && setData(getDemoWorkspace()))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  if (mode === "admin") return <AdminWorkspace locale={locale} />
  if (loading) {
    return (
      <main className="flex min-h-[54vh] items-center text-sm text-ink-3">
        <Clock3 className="mr-2 h-4 w-4 animate-spin" />
        {t.loading}
      </main>
    )
  }

  const ownRequests = (data.ownRequests || []) as ShipmentRequest[]
  const opportunities = (data.opportunities || []) as ShipmentRequest[]
  const recommendations = (data.recommendations || []) as Recommendation[]
  const orders = (data.orders || []) as Order[]
  const recommended = recommendations.map(requestFromRecommendation).find(Boolean)
  const featured = recommended || opportunities[0]
  const featuredMatch = recommendations.find((item) => item.shipment_request_id === featured?.id)
  const queue = opportunities.filter((item) => item.id !== featured?.id).slice(0, 3)
  const tokens = Number(data.profile?.token_balance_free || 0) + Number(data.profile?.token_balance_paid || 0)
  const activity = buildActivity(ownRequests, orders, data.profile, t)

  return (
    <main className="mx-auto w-full max-w-[1440px] pb-16 pt-8">
      <section className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[30px] font-bold leading-[1.05] tracking-[-.8px] text-ink">{t.greeting}</h1>
            {data.demoMode ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e4d29a] bg-[#fff8e8] px-2.5 py-1 text-[11px] font-semibold text-[#8a6718]">
                <Sparkles className="h-3.5 w-3.5" />
                {t.demo}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-[14px] text-ink-3">{t.intro}</p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/${locale}/marketplace`}>
            {t.browse}
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      <StatsStrip t={t} requests={ownRequests.length} opportunities={opportunities.length} orders={orders.length} tokens={tokens} />

      {featured ? <HeroOpportunity locale={locale} t={t} request={featured} match={featuredMatch?.match_score} reasons={featuredMatch?.reasons || []} demoMode={Boolean(data.demoMode)} /> : <EmptyFeatured prefix={`/${locale}`} t={t} />}

      <section className="mt-6 grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <OpportunityQueue locale={locale} t={t} prefix={`/${locale}`} opportunities={queue} />
        <ActivityFeed t={t} events={activity} />
      </section>
    </main>
  )
}

function StatsStrip({ t, requests, opportunities, orders, tokens }: { t: typeof copy.zh; requests: number; opportunities: number; orders: number; tokens: number }) {
  const stats = [
    { label: t.requests, value: requests, note: t.statNotes[0], icon: Package, tone: "text-lblue" },
    { label: t.opportunities, value: opportunities, note: t.statNotes[1], icon: TrendingUp, tone: "text-emerald" },
    { label: t.orders, value: orders, note: t.statNotes[2], icon: Activity, tone: "text-lblue" },
    { label: t.tokens, value: tokens, note: t.statNotes[3], icon: Wallet, tone: "text-[#9a7517]" },
  ]

  return (
    <section className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article key={stat.label} className="flex items-center gap-4 rounded-[16px] border border-line/70 bg-white/80 px-5 py-4 backdrop-blur-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#cfd6e5] hover:bg-white hover:shadow-[0_10px_26px_rgba(12,26,62,.07)]">
          <div className={`grid h-10 w-10 place-items-center rounded-[12px] bg-[#eef1f8] ${stat.tone}`}>
            <stat.icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold uppercase tracking-[.08em] text-ink-3">{stat.label}</p>
            <p className="mt-0.5 text-[22px] font-bold leading-none tracking-[-.5px] text-ink">{stat.value}</p>
            <p className="mt-1 text-[11px] text-ink-3">{stat.note}</p>
          </div>
        </article>
      ))}
    </section>
  )
}

function HeroOpportunity({ locale, t, request, match, reasons, demoMode }: { locale: Locale; t: typeof copy.zh; request: ShipmentRequest; match?: number; reasons: string[]; demoMode: boolean }) {
  const [amount, setAmount] = useState(demoMode ? "24800" : "")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const remaining = useCountdown(request.bid_deadline)
  const finalWindow = remaining.total > 0 && remaining.total <= 15 * 60
  const finalMinutes = remaining.total > 0 && remaining.total <= 5 * 60
  const details = request.cargo_details || {}
  const score = match || 0
  const fallbackReasons = locale === "zh" ? ["公司能力與此需求匹配", "你的路線和服務資料已被系統識別為合適"] : ["Your company capabilities align with this request", "Your routes and service profile have been identified as a fit"]
  const specs = [
    [t.weight, displayValue(details.weight ?? details.weight_kg)],
    [t.volume, displayValue(details.volume ?? details.cbm)],
    [t.freight, String(details.mode || t.unknown)],
    [t.cargo, String(details.cargo || details.cargo_type || t.unknown)],
    [t.pickup, request.created_at ? new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-GB", { day: "numeric", month: "short" }).format(new Date(request.created_at)) : t.unknown],
  ]

  async function submitQuote() {
    const price = Number(amount)
    if (!Number.isFinite(price) || price <= 0) {
      setError(t.quoteRequired)
      return
    }
    if (demoMode) {
      setSubmitted(true)
      return
    }
    setSubmitting(true)
    setError("")
    const { response, body } = await apiJson("/api/bids", { method: "POST", body: JSON.stringify({ sr_id: request.id, price, currency: "HKD" }) })
    setSubmitting(false)
    if (!response.ok) {
      setError(body.error || t.quoteError)
      return
    }
    setSubmitted(true)
  }

  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className={`relative overflow-hidden rounded-[22px] bg-white shadow-[0_18px_60px_rgba(12,26,62,.10),0_2px_8px_rgba(12,26,62,.05)] ${finalMinutes ? "border border-red-200" : finalWindow ? "border border-[#f0d990]" : "border border-line/80"}`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,#FAFBFF_0%,transparent_100%)]" />
      <div className="relative px-6 pb-8 pt-9 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[.09em] text-lgold">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lgold" />
              {match ? t.recommended : t.open}
            </span>
            {match ? <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8d9a0] bg-[#fdf8ec] px-3 py-1 text-[11.5px] font-semibold text-[#7a5e18]"><Award className="h-3 w-3" />{match}% {t.match}</span> : null}
          </div>
          <motion.div animate={finalMinutes ? { scale: [1, 1.02, 1] } : { scale: 1 }} transition={finalMinutes ? { repeat: Infinity, duration: 2.2, ease: "easeInOut" } : { duration: 0.4 }} className={`flex items-center gap-2 rounded-xl border px-4 py-2 ${finalMinutes ? "border-red-200 bg-red-50 text-red-800 shadow-[0_0_22px_rgba(220,38,38,.14)]" : finalWindow ? "border-[#f0d990] bg-[#fffbf0] text-[#7a5e18]" : "border-line bg-white/80 text-ink"}`}>
            <Clock3 className={`h-3.5 w-3.5 ${finalMinutes ? "text-red-600" : finalWindow ? "text-lgold" : "text-ink-3"}`} />
            <span className="font-mono text-sm font-bold tabular-nums">{remaining.label}</span>
            <span className="text-[11px] opacity-70">{t.remaining}</span>
          </motion.div>
        </div>

        {finalWindow && !submitted ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className={`mb-5 rounded-xl border px-4 py-3 text-[12.5px] font-medium ${finalMinutes ? "border-red-200 bg-red-50 text-red-900" : "border-[#f0d990] bg-[#fffbf0] text-[#7a5e18]"}`}>
            {finalMinutes ? t.urgentAlert : t.finalAlert}
          </motion.div>
        ) : null}

        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.09em] text-ink-3">{t.origin}</p>
            <h2 className="mt-2 text-[28px] font-bold leading-[1.05] tracking-[-.7px] text-ink">{request.route?.origin || t.unknown}</h2>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="h-px w-12 bg-[linear-gradient(90deg,#E2E6EE,#0C1A3E)]" />
              <span className="grid h-11 w-11 place-items-center rounded-full bg-lblue text-white shadow-[0_4px_16px_rgba(12,26,62,.30)]"><Plane className="h-4 w-4" /></span>
              <span className="h-px w-12 bg-[linear-gradient(90deg,#0C1A3E,#E2E6EE)]" />
            </div>
            <span className="rounded-full bg-[#eef1f8] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[.06em] text-lblue">{details.mode || t.unknown}</span>
          </div>
          <div className="lg:text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[.09em] text-ink-3">{t.destination}</p>
            <h2 className="mt-2 text-[28px] font-bold leading-[1.05] tracking-[-.7px] text-ink">{request.route?.destination || "Hong Kong"}</h2>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 divide-x divide-y divide-line-light border-y border-line-light sm:grid-cols-5 sm:divide-y-0">
          {specs.map(([label, value]) => (
            <div key={label} className="px-4 py-4 first:pl-0">
              <p className="text-[10px] font-semibold uppercase tracking-[.08em] text-ink-3">{label}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <MatchRing score={score} />
              <div className="min-w-0 pt-1">
                <p className="mb-2.5 text-[10px] font-bold uppercase tracking-[.09em] text-ink-3">{t.why}</p>
                {(reasons.filter(Boolean).slice(0, 4).length ? reasons.filter(Boolean).slice(0, 4) : fallbackReasons).map((reason) => (
                  <p key={reason} className="mb-1.5 flex items-start gap-2 text-[13px] leading-[1.4] text-ink-2">
                    <CircleCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" strokeWidth={2.2} />
                    {reason}
                  </p>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2.5 rounded-xl border border-line bg-canvas p-3.5">
              <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-3" />
              <p className="text-[12px] leading-[1.6] text-ink-2">{t.privacy}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.09em] text-ink-3">{t.sealedQuote}</p>
            {submitted ? (
              <motion.div initial={{ opacity: 0, scale: 0.93 }} animate={{ opacity: 1, scale: 1 }} className="mt-3 overflow-hidden rounded-xl border border-line bg-white">
                <div className="border-b border-line bg-[linear-gradient(180deg,#edfaf3,#f7fdf9)] px-5 py-5 text-center">
                  <span className="mx-auto grid h-11 w-11 place-items-center rounded-full border border-emerald/25 bg-white shadow-[0_2px_10px_rgba(26,125,74,.12)]"><CheckCircle2 className="h-5 w-5 text-emerald" /></span>
                  <p className="mt-3 text-sm font-semibold text-ink">{t.submitted}</p>
                  <p className="mt-1 text-[11.5px] text-ink-3">{t.submittedBody}</p>
                </div>
                <p className="flex items-center gap-1.5 px-4 py-3 text-[11.5px] text-lblue"><FileCheck className="h-3.5 w-3.5" />Sealed quote receipt created</p>
              </motion.div>
            ) : (
              <>
                <div className="relative mt-3 rounded-xl border-2 border-line bg-white transition duration-200 focus-within:border-lblue focus-within:shadow-[0_0_0_3px_rgba(12,26,62,.08)]">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink-3">{t.amount}</span>
                  <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" type="number" min="0" placeholder="0.00" aria-label={t.sealedQuote} className="w-full rounded-xl bg-transparent py-4 pl-[52px] pr-4 text-[22px] font-semibold tracking-[-.3px] text-ink outline-none placeholder:text-line" />
                </div>
                <Button onClick={submitQuote} disabled={submitting || remaining.total <= 0} className={`mt-3 w-full rounded-xl py-3.5 shadow-[0_4px_16px_rgba(12,26,62,.24)] hover:-translate-y-px ${finalMinutes ? "bg-[linear-gradient(135deg,#3b0a0a,#991b1b)] hover:bg-red-900" : ""}`}>
                  {submitting ? t.submitting : t.submit}
                </Button>
                {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
                <p className="mt-3 text-center text-[10.5px] text-ink-3"><Link className="hover:text-lblue hover:underline" href={`/${locale}/marketplace/${request.id}`}>{t.details}</Link></p>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function OpportunityQueue({ locale, t, prefix, opportunities }: { locale: Locale; t: typeof copy.zh; prefix: string; opportunities: ShipmentRequest[] }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[13.5px] font-semibold text-ink">{t.other}</h2>
        <Link href={`${prefix}/marketplace`} className="inline-flex items-center gap-0.5 text-[12px] font-medium text-lblue hover:underline">{t.all}<ChevronRight className="h-3.5 w-3.5" /></Link>
      </div>
      {opportunities.length ? <div className="space-y-2">{opportunities.map((item) => <OpportunityRow key={item.id} locale={locale} item={item} prefix={prefix} />)}</div> : <div className="rounded-[14px] border border-dashed border-line bg-white px-5 py-10 text-center text-sm text-ink-3">{t.noOpportunities}</div>}
    </section>
  )
}

function OpportunityRow({ locale, item, prefix }: { locale: Locale; item: ShipmentRequest; prefix: string }) {
  const details = item.cargo_details || {}
  const air = String(details.mode || "").toLowerCase().includes("air")
  return (
    <Link href={`${prefix}/marketplace/${item.id}`} className="group flex items-center gap-3 rounded-[14px] border border-line bg-white px-5 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-[#c8cdd8] hover:shadow-[0_4px_18px_rgba(0,0,0,.07)]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-canvas text-ink-2 transition group-hover:bg-[#eef1f8] group-hover:text-lblue">{air ? <Plane className="h-4 w-4" /> : <Ship className="h-4 w-4" />}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-medium leading-none text-ink">{route(item, locale)}</span>
        <span className="mt-1 block truncate text-[12px] text-ink-3">{[displayValue(details.weight ?? details.weight_kg), displayValue(details.volume ?? details.cbm), details.mode].filter(Boolean).join(" · ")}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1"><span className="text-[11px] font-medium text-ink-3">{formatDeadline(item.bid_deadline, locale)}</span><span className="h-[3px] w-12 overflow-hidden rounded-full bg-line"><span className="block h-full w-3/4 rounded-full bg-emerald" /></span></span>
      <ChevronRight className="h-4 w-4 shrink-0 text-line transition group-hover:text-lblue" />
    </Link>
  )
}

function ActivityFeed({ t, events }: { t: typeof copy.zh; events: { id: string; title: string; detail: string; time: string; kind: "success" | "gold" | "navy" | "neutral" }[] }) {
  const style = { success: "bg-emerald-soft text-emerald ring-emerald/20", gold: "bg-[#fdf8ec] text-[#9a7517] ring-[#e8d9a0]", navy: "bg-[#eef1f8] text-lblue ring-lblue/15", neutral: "bg-canvas text-ink-3 ring-line" }
  return (
    <section>
      <div className="mb-4 flex items-center justify-between"><h2 className="text-[13.5px] font-semibold text-ink">{t.activity}</h2><span className="text-[12px] font-medium text-lblue">{t.all}<ChevronRight className="inline h-3.5 w-3.5" /></span></div>
      {events.length ? <div className="overflow-hidden rounded-[14px] border border-line bg-white shadow-[0_1px_4px_rgba(0,0,0,.03)]">{events.map((event, index) => <div key={event.id} className={`flex items-start gap-3 px-4 py-3.5 ${index < events.length - 1 ? "border-b border-line-light" : ""}`}><span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ring-2 ${style[event.kind]}`}><CircleCheck className="h-3.5 w-3.5" /></span><span className="min-w-0"><span className="block text-[13px] font-medium leading-snug text-ink">{event.title}</span><span className="mt-0.5 block truncate text-[11.5px] text-ink-2">{event.detail}</span><span className="mt-1 block text-[10.5px] text-ink-3">{event.time}</span></span></div>)}</div> : <div className="rounded-[14px] border border-dashed border-line bg-white px-5 py-10 text-center text-sm text-ink-3">{t.noActivity}</div>}
    </section>
  )
}

function MatchRing({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score))
  const circumference = 2 * Math.PI * 32
  return <div className="grid h-20 w-20 shrink-0 place-items-center"><svg viewBox="0 0 80 80" className="h-20 w-20"><circle cx="40" cy="40" r="32" fill="none" stroke="#f0ebd9" strokeWidth="4.5" /><circle cx="40" cy="40" r="32" fill="none" stroke="#c49a3c" strokeLinecap="round" strokeWidth="4.5" strokeDasharray={`${(pct / 100) * circumference} ${circumference}`} transform="rotate(-90 40 40)" /><text x="40" y="37" textAnchor="middle" fill="#7a5e18" fontSize="13.5" fontWeight="700">{score ? `${score}%` : "--"}</text><text x="40" y="50" textAnchor="middle" fill="#b8922a" fontSize="8" fontWeight="600">MATCH</text></svg></div>
}

function EmptyFeatured({ prefix, t }: { prefix: string; t: typeof copy.zh }) {
  return <section className="rounded-[20px] border border-dashed border-line bg-white px-8 py-12 text-center"><Award className="mx-auto h-6 w-6 text-lgold" /><h2 className="mt-3 text-xl font-semibold text-ink">{t.noFeatured}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-ink-3">{t.noFeaturedBody}</p><Button asChild variant="outline" className="mt-5"><Link href={`${prefix}/marketplace`}>{t.browse}<ChevronRight className="h-4 w-4" /></Link></Button></section>
}

function AdminWorkspace({ locale }: { locale: Locale }) {
  return <main className="rounded-[20px] border border-line bg-white p-8"><p className="text-[11px] font-semibold uppercase tracking-[.1em] text-lgold">LBID ADMIN</p><h1 className="mt-2 text-3xl font-bold text-ink">{locale === "zh" ? "平台營運工作台" : "Platform operations"}</h1><p className="mt-3 text-sm text-ink-2">{locale === "zh" ? "審核需求、公司能力、付款確認和平台風險。" : "Review requests, company capabilities, and payment confirmations."}</p></main>
}

function requestFromRecommendation(recommendation?: Recommendation) {
  const request = recommendation?.shipment_requests
  return Array.isArray(request) ? request[0] : request || undefined
}
function displayValue(value: unknown) {
  return value === undefined || value === null || value === "" ? "-" : String(value)
}
function route(item: ShipmentRequest, locale: Locale) {
  return `${item.route?.origin || (locale === "zh" ? "出發地待確認" : "Origin pending")} → ${item.route?.destination || "Hong Kong"}`
}
function formatDeadline(deadline: string | undefined, locale: Locale) {
  if (!deadline) return locale === "zh" ? "時間待定" : "Time pending"
  const seconds = Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
  if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)}h`
  return `${Math.ceil(seconds / 86400)}d`
}
function useCountdown(deadline?: string) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])
  const total = Math.max(0, Math.floor(((deadline ? new Date(deadline).getTime() : now) - now) / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return { total, label: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}` }
}
function buildActivity(requests: ShipmentRequest[], orders: Order[], profile: any, t: typeof copy.zh) {
  const events: { id: string; title: string; detail: string; time: string; kind: "success" | "gold" | "navy" | "neutral" }[] = []
  for (const order of orders.slice(0, 2)) events.push({ id: `order-${order.id}`, title: t.orderActive, detail: order.status.replaceAll("_", " "), time: formatDate(order.created_at), kind: "success" })
  for (const request of requests.slice(0, 2)) events.push({ id: `request-${request.id}`, title: request.status === "OPEN" ? t.active : t.requests, detail: route(request, "en"), time: formatDate(request.created_at), kind: "navy" })
  if (profile?.onboarding_completed) events.push({ id: "profile", title: t.profileReady, detail: profile.company_name_en || "LBID", time: "", kind: "gold" })
  return events.slice(0, 4)
}
function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(new Date(value)) : ""
}
