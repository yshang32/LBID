"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Activity, ArrowRight, BarChart2, CheckCircle2, Clock3, Loader2, MapPin, Radar, Route, WalletCards } from "lucide-react"

import { apiJson } from "@/lib/api-client"
import { getDemoWorkspace, isWorkspaceEmpty } from "@/lib/demo-workspace"

type Locale = "zh" | "en"
type Request = {
  id: string
  route?: { origin?: string; destination?: string }
  cargo_details?: { cargo?: string; cargo_type?: string; mode?: string; weight_kg?: number; cbm?: number }
  bid_deadline?: string
  status?: string
  created_at?: string
}
type Bid = { id: string; sr_id: string; price?: number; currency?: string; transit_time?: string; submitted_at?: string }
type Workspace = {
  demoMode?: boolean
  profile?: { service_routes?: string[]; service_types?: string[]; token_balance_free?: number; token_balance_paid?: number }
  ownRequests?: Request[]
  opportunities?: Request[]
  orders?: { id: string; status: string; created_at?: string }[]
  recommendations?: { match_score?: number }[]
  bids?: Bid[]
}

const text = {
  zh: {
    demo: "Demo data",
    active: "Active Bids",
    activeIntro: "所有已提交報價都會保持密封，直至競價窗口完結。提交後不可修改。",
    empty: "你暫時未提交任何 bid。",
    market: "瀏覽接單市場",
    quote: "密封報價",
    submitted: "已提交",
    deadline: "截標時間",
    routes: "我的航線",
    routesIntro: "公司檔案內的航線和服務能力，會用來推送更合適的接單機會。",
    noRoutes: "尚未加入服務航線。",
    profile: "打開公司檔案",
    analytics: "Analytics",
    analyticsIntro: "用真實 workspace 資料顯示需求、報價、訂單和推薦狀態。",
    requests: "我的需求",
    opportunities: "可接需求",
    orders: "訂單",
    recommendations: "推薦機會",
    tokens: "可用 Token",
    noData: "完成第一張需求或密封報價後，趨勢會開始出現。",
    activeCoverage: "已啟用覆蓋",
  },
  en: {
    demo: "Demo data",
    active: "Active Bids",
    activeIntro: "Every submitted quote remains sealed until the window closes. A submitted quote cannot be edited.",
    empty: "You have no submitted bids yet.",
    market: "Browse opportunities",
    quote: "Sealed quote",
    submitted: "Submitted",
    deadline: "Bid deadline",
    routes: "My Routes",
    routesIntro: "Routes in your company profile are used to recommend relevant opportunities.",
    noRoutes: "No service routes have been added yet.",
    profile: "Open company profile",
    analytics: "Analytics",
    analyticsIntro: "A truthful view of your requests, bids and orders, drawn from your live workspace.",
    requests: "Requests",
    opportunities: "Open opportunities",
    orders: "Orders",
    recommendations: "Recommendations",
    tokens: "Available tokens",
    noData: "Complete a request or sealed bid and trends will begin to appear here.",
    activeCoverage: "Active coverage",
  },
} as const

export function ActiveBidsPanel({ locale }: { locale: Locale }) {
  const t = text[locale]
  const [bids, setBids] = useState<Bid[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [demoMode, setDemoMode] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.all([apiJson("/api/bids"), apiJson("/api/workspace")])
      .then(([bidResult, workspaceResult]) => {
        if (!active) return
        const workspace = workspaceResult.body as Workspace
        const liveBids = bidResult.response.ok ? bidResult.body.bids || [] : []
        if (!liveBids.length || !workspaceResult.response.ok || isWorkspaceEmpty(workspace)) {
          const demo = getDemoWorkspace()
          setBids(demo.bids)
          setRequests([...demo.opportunities, ...demo.ownRequests])
          setDemoMode(true)
        } else {
          setBids(liveBids)
          setRequests([...(workspace.opportunities || []), ...(workspace.ownRequests || [])])
        }
        setLoading(false)
      })
      .catch(() => {
        if (!active) return
        const demo = getDemoWorkspace()
        setBids(demo.bids)
        setRequests([...demo.opportunities, ...demo.ownRequests])
        setDemoMode(true)
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const requestById = useMemo(() => new Map(requests.map((item) => [item.id, item])), [requests])
  return (
    <WorkspacePage eyebrow="SEALED BIDDING" title={t.active} intro={t.activeIntro} demoLabel={demoMode ? t.demo : ""}>
      {loading ? <Loading /> : !bids.length ? <Empty label={t.empty} href={`/${locale}/marketplace`} action={t.market} /> : (
        <div className="mt-7 grid gap-3">
          {bids.map((bid) => {
            const request = requestById.get(bid.sr_id)
            return (
              <Link key={bid.id} href={`/${locale}/marketplace/${bid.sr_id}`} className="group grid gap-4 rounded-[16px] border border-[#dfe4ed] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#bdc7d8] hover:shadow-[0_10px_28px_rgba(12,26,62,.08)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
                <span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#a17e22]"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{t.submitted}</span>
                  <strong className="mt-2 block text-[17px] text-[#172038]">{routeName(request)}</strong>
                  <small className="mt-1 block text-[12px] text-[#7e8ba1]">{request?.cargo_details?.cargo || request?.cargo_details?.cargo_type || "General cargo"} · {bid.transit_time || "Transit pending"}</small>
                </span>
                <span className="rounded-xl bg-[#f4f6fa] px-4 py-3">
                  <small className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#8c98ac]">{t.quote}</small>
                  <strong className="mt-1 block text-[14px] text-[#172038]">{bid.currency || "HKD"} {Number(bid.price || 0).toLocaleString("en-HK")}</strong>
                </span>
                <span className="flex items-center gap-2 text-[12px] text-[#7e8ba1]"><Clock3 className="h-4 w-4" />{formatDate(request?.bid_deadline || bid.submitted_at)}<ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" /></span>
              </Link>
            )
          })}
        </div>
      )}
    </WorkspacePage>
  )
}

export function RoutesPanel({ locale }: { locale: Locale }) {
  const t = text[locale]
  const [workspace, setWorkspace] = useState<Workspace | null>(null)

  useEffect(() => {
    apiJson("/api/workspace").then(({ response, body }) => {
      setWorkspace(response.ok && !isWorkspaceEmpty(body) ? body : getDemoWorkspace())
    }).catch(() => setWorkspace(getDemoWorkspace()))
  }, [])

  if (!workspace) return <WorkspacePage eyebrow="COMPANY COVERAGE" title={t.routes} intro={t.routesIntro}><Loading /></WorkspacePage>
  const routes = workspace.profile?.service_routes || []
  const services = workspace.profile?.service_types || []
  return (
    <WorkspacePage eyebrow="COMPANY COVERAGE" title={t.routes} intro={t.routesIntro} demoLabel={workspace.demoMode ? t.demo : ""}>
      {!routes.length ? <Empty label={t.noRoutes} href={`/${locale}/profile`} action={t.profile} /> : (
        <div className="mt-7 grid gap-3 md:grid-cols-2">
          {routes.map((item) => (
            <article key={item} className="rounded-[16px] border border-[#dfe4ed] bg-white p-5 shadow-[0_1px_5px_rgba(0,0,0,.03)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(12,26,62,.08)]">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef1f8] text-[#0c1a3e]"><Route className="h-5 w-5" /></span>
              <h2 className="mt-4 text-[17px] font-semibold text-[#172038]">{item}</h2>
              <p className="mt-2 text-[12px] leading-5 text-[#7e8ba1]">{services.length ? services.join(" · ") : "Service capability pending"}</p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />{t.activeCoverage}</span>
            </article>
          ))}
        </div>
      )}
    </WorkspacePage>
  )
}

export function AnalyticsPanel({ locale }: { locale: Locale }) {
  const t = text[locale]
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [bids, setBids] = useState<Bid[]>([])

  useEffect(() => {
    Promise.all([apiJson("/api/workspace"), apiJson("/api/bids")])
      .then(([workspaceResult, bidsResult]) => {
        const liveWorkspace = workspaceResult.body as Workspace
        const liveBids = bidsResult.response.ok ? bidsResult.body.bids || [] : []
        if (!workspaceResult.response.ok || isWorkspaceEmpty(liveWorkspace)) {
          const demo = getDemoWorkspace()
          setWorkspace(demo)
          setBids(demo.bids)
        } else {
          setWorkspace(liveWorkspace)
          setBids(liveBids)
        }
      })
      .catch(() => {
        const demo = getDemoWorkspace()
        setWorkspace(demo)
        setBids(demo.bids)
      })
  }, [])

  if (!workspace) return <WorkspacePage eyebrow="BUSINESS SIGNALS" title={t.analytics} intro={t.analyticsIntro}><Loading /></WorkspacePage>
  const metrics = [
    { label: t.requests, value: workspace.ownRequests?.length || 0, icon: MapPin },
    { label: t.opportunities, value: workspace.opportunities?.length || 0, icon: Radar },
    { label: t.orders, value: workspace.orders?.length || 0, icon: Activity },
    { label: t.recommendations, value: workspace.recommendations?.length || 0, icon: BarChart2 },
    { label: t.tokens, value: Number(workspace.profile?.token_balance_free || 0) + Number(workspace.profile?.token_balance_paid || 0), icon: WalletCards },
    { label: t.active, value: bids.length, icon: CheckCircle2 },
  ]
  const hasData = metrics.some((metric) => metric.value > 0)
  return (
    <WorkspacePage eyebrow="BUSINESS SIGNALS" title={t.analytics} intro={t.analyticsIntro} demoLabel={workspace.demoMode ? t.demo : ""}>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-[16px] border border-[#dfe4ed] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(12,26,62,.08)]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f0f2f8] text-[#0c1a3e]"><metric.icon className="h-4 w-4" /></span>
            <p className="mt-4 text-[10px] font-bold uppercase tracking-[.1em] text-[#8c98ac]">{metric.label}</p>
            <strong className="mt-1 block text-[26px] leading-none tracking-[-.6px] text-[#172038]">{metric.value}</strong>
          </article>
        ))}
      </div>
      {!hasData ? <p className="mt-5 rounded-xl border border-dashed border-[#d3dae6] bg-white px-5 py-5 text-center text-[13px] text-[#7e8ba1]">{t.noData}</p> : null}
    </WorkspacePage>
  )
}

function WorkspacePage({ eyebrow, title, intro, demoLabel, children }: { eyebrow: string; title: string; intro: string; demoLabel?: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-9 sm:px-8 lg:px-9">
      <section className="border-b border-[#dfe4ed] pb-7">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[10.5px] font-bold uppercase tracking-[.13em] text-[#a17e22]">{eyebrow}</p>
          {demoLabel ? <span className="rounded-full border border-[#e4d29a] bg-[#fff8e8] px-2 py-0.5 text-[10px] font-semibold text-[#8a6718]">{demoLabel}</span> : null}
        </div>
        <h1 className="mt-2 text-[30px] font-bold tracking-[-.7px] text-[#172038]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#7e8ba1]">{intro}</p>
      </section>
      {children}
    </main>
  )
}
function Loading() {
  return <div className="mt-8 flex items-center gap-2 text-[13px] text-[#7e8ba1]"><Loader2 className="h-4 w-4 animate-spin" />Loading workspace data</div>
}
function Empty({ label, href, action }: { label: string; href: string; action: string }) {
  return <section className="mt-7 rounded-[14px] border border-dashed border-[#d3dae6] bg-white px-5 py-12 text-center"><p className="text-[13px] text-[#7e8ba1]">{label}</p><Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0c1a3e] hover:underline">{action}<ArrowRight className="h-4 w-4" /></Link></section>
}
function routeName(request?: Request) {
  return `${request?.route?.origin || "Origin"} → ${request?.route?.destination || "Destination"}`
}
function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "Time pending"
}
