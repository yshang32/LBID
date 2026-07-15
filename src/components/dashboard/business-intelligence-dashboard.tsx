"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts"
import {
  Award,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileWarning,
  Globe2,
  MoreHorizontal,
  PackageCheck,
  Plane,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react"

import { apiJson } from "@/lib/api-client"
import { intelligenceRoutes, RouteDetailPanel, RouteIntelligenceMap, type IntelligenceRoute } from "@/components/dashboard/route-intelligence-map"
import { getDemoWorkspace, isWorkspaceEmpty } from "@/lib/demo-workspace"
import type { Locale } from "@/lib/i18n"

type ViewMode = "overview" | "client" | "forwarder"
type Period = "30d" | "90d" | "6m"
type JsonRecord = Record<string, any>

type Workspace = {
  demoMode?: boolean
  userId?: string
  profile?: JsonRecord | null
  ownRequests?: JsonRecord[]
  opportunities?: JsonRecord[]
  orders?: JsonRecord[]
  recommendations?: JsonRecord[]
  bids?: JsonRecord[]
  bidCountByRequest?: Record<string, number>
  documentTypesByOrder?: Record<string, string[]>
}

type Kpi = {
  label: string
  value: string
  delta: string
  positive: boolean
  icon: LucideIcon
  color: string
  soft: string
  series: number[]
}

type TrendPoint = { label: string; pipeline: number; awarded: number; completed: number }
type FunnelPoint = { label: string; value: number; color: string }
type RoutePoint = { route: string; value: number; orders: number; share: number; color: string }
type DeadlineItem = { id: string; type: string; title: string; meta: string; value: string; tone: string; href: string }

type DashboardModel = {
  kpis: Kpi[]
  trend: TrendPoint[]
  funnel: FunnelPoint[]
  routes: RoutePoint[]
  deadlines: DeadlineItem[]
  activeOrders: JsonRecord[]
}

const palette = {
  blue: "#4f6bff",
  violet: "#8063f5",
  cyan: "#31bdb8",
  orange: "#ff9c45",
  green: "#45bd78",
  red: "#ef6461",
}

const ui = {
  zh: {
    greeting: "早晨",
    intro: "以下是你今日物流網絡最值得留意的情況。",
    overview: "公司總覽",
    client: "Client 工作台",
    forwarder: "Forwarder 工作台",
    newRequest: "建立新需求",
    export: "匯出",
    sample: "示例數據",
    live: "即時數據",
    updated: "最後更新",
    periods: { "30d": "30 日", "90d": "90 日", "6m": "6 個月" },
    mapTitle: "東南亞需求概覽",
    mapIntro: "主要來源地及中標訂單值",
    trendTitle: "Bid 表現趨勢",
    trendIntro: "HKD 千",
    funnelTitle: "Bid 轉換漏斗",
    routesTitle: "主要航線",
    deliveryTitle: "交付表現",
    valueTitle: "訂單服務分佈",
    deadlineTitle: "即將到期",
    tableTitle: "進行中的競價與訂單",
    viewAll: "查看全部",
    pipeline: "報價總值",
    awarded: "中標總值",
    completed: "完成訂單值",
    orders: "訂單",
    route: "航線",
    cargo: "貨物類型",
    deadline: "期限",
    bids: "Bid 數量",
    value: "訂單值",
    status: "狀態",
    action: "操作",
  },
  en: {
    greeting: "Good morning",
    intro: "Here is what deserves your attention across the logistics network today.",
    overview: "Company overview",
    client: "Client workspace",
    forwarder: "Forwarder workspace",
    newRequest: "New request",
    export: "Export",
    sample: "Sample data",
    live: "Live data",
    updated: "Last updated",
    periods: { "30d": "30 days", "90d": "90 days", "6m": "6 months" },
    mapTitle: "Southeast Asia demand overview",
    mapIntro: "Top origins and awarded order value",
    trendTitle: "Bid performance trend",
    trendIntro: "HKD thousand",
    funnelTitle: "Bid conversion funnel",
    routesTitle: "Top trade lanes",
    deliveryTitle: "Delivery performance",
    valueTitle: "Order service mix",
    deadlineTitle: "Upcoming deadlines",
    tableTitle: "Active bids and orders",
    viewAll: "View all",
    pipeline: "Quoted value",
    awarded: "Awarded value",
    completed: "Completed value",
    orders: "orders",
    route: "Route",
    cargo: "Cargo type",
    deadline: "Deadline",
    bids: "Bids",
    value: "Order value",
    status: "Status",
    action: "Actions",
  },
} as const

export function BusinessIntelligenceDashboard({ locale }: { locale: Locale }) {
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("overview")
  const [period, setPeriod] = useState<Period>("6m")
  const [selectedRoute, setSelectedRoute] = useState<IntelligenceRoute>(intelligenceRoutes[0])
  const t = ui[locale]

  const loadWorkspace = useCallback(async () => {
    try {
      const { response, body } = await apiJson("/api/workspace")
      const live = response.ok ? body : null
      setWorkspace(live && !isWorkspaceEmpty(live) ? live : getDemoWorkspace())
    } catch {
      setWorkspace(getDemoWorkspace())
    }
  }, [])

  useEffect(() => {
    void loadWorkspace()
  }, [loadWorkspace])

  const model = useMemo(
    () => workspace ? buildDashboardModel(workspace, viewMode, period, locale) : null,
    [workspace, viewMode, period, locale],
  )

  if (!workspace || !model) return <DashboardSkeleton />

  const companyName = workspace.profile?.company_name_en || workspace.profile?.company_name_zh || "Pacific"
  const firstName = String(companyName).trim().split(/\s+/)[0] || "Pacific"
  const views: Record<ViewMode, string> = { overview: t.overview, client: t.client, forwarder: t.forwarder }
  const supportingKpis = [
    { ...model.kpis[1], label: locale === "zh" ? "進行中競價" : "Active bids" },
    { ...model.kpis[3], label: locale === "zh" ? "預計節省" : "Expected savings" },
    { ...model.kpis[4], label: locale === "zh" ? "準時交付" : "On-time delivery" },
    makeKpi(locale === "zh" ? "高風險項目" : "Projects at risk", String(Math.max(2, model.deadlines.filter((item) => item.tone === palette.red).length + 2)), "-12.5%", FileWarning, palette.orange, "#fff3e6", [8, 7, 6, 5, 4, 3]),
    makeKpi(locale === "zh" ? "本週關閉項目" : "Contracts closing this week", String(Math.max(5, model.deadlines.length + 3)), "+13.6%", CalendarDays, "#bf7f2f", "#fbf1e5", [3, 5, 4, 6, 7, 8]),
  ]
  const featuredKpi = { ...model.kpis[0], label: locale === "zh" ? "年度累計中標額" : "Total awarded value (YTD)" }
  const today = new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-HK", { month: "short", day: "numeric", year: "numeric" }).format(new Date())

  return (
    <main className="min-h-full bg-[radial-gradient(circle_at_56%_-8%,rgba(242,218,181,0.20),transparent_29%),#fbfaf7] px-4 pb-8 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1510px]">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-[25px] font-semibold leading-tight tracking-[-0.01em] text-[#101c32] sm:text-[28px]">{t.greeting}, {firstName}. <span aria-hidden>👋</span></h1>
            <p className="mt-1 text-[12px] text-[#69768b]">{locale === "zh" ? "以下是你今日的物流營運概覽。" : "Here is your logistics command center overview."}</p>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-2 xl:justify-end">
            <button type="button" className="inline-flex h-9 items-center gap-2 rounded-[7px] border border-[#e9e3d9] bg-white px-3 text-[10px] font-medium text-[#334158] shadow-[0_4px_14px_rgba(50,43,31,0.04)] transition hover:border-[#d7cbb9] hover:bg-[#fffdf9]"><Globe2 className="h-3.5 w-3.5" />Global (All Regions)<ChevronDown className="h-3 w-3 text-[#9b917f]" /></button>
            <label className="relative inline-flex h-9 items-center gap-2 rounded-[7px] border border-[#e9e3d9] bg-white px-3 shadow-[0_4px_14px_rgba(50,43,31,0.04)]">
              <Users className="h-3.5 w-3.5 text-[#172943]" />
              <select aria-label="Company workspace" value={viewMode} onChange={(event) => setViewMode(event.target.value as ViewMode)} className="appearance-none bg-transparent pr-4 text-[10px] font-medium text-[#334158] outline-none">
                {(Object.keys(views) as ViewMode[]).map((view) => <option key={view} value={view}>{views[view]}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-3 w-3 text-[#9b917f]" />
            </label>
            <span className="inline-flex h-9 items-center gap-2 rounded-[7px] border border-[#e9e3d9] bg-white px-3 text-[10px] font-medium text-[#334158] shadow-[0_4px_14px_rgba(50,43,31,0.04)]"><CalendarDays className="h-3.5 w-3.5 text-[#9a6c24]" />{today}</span>
            <form action={`/${locale}/marketplace`} className="relative hidden 2xl:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9c958a]" />
              <input name="q" placeholder={locale === "zh" ? "搜尋項目、航線、貨運..." : "Search projects, routes, shipments..."} className="h-9 w-[190px] rounded-[7px] border border-[#e9e3d9] bg-white pl-9 pr-9 text-[10px] text-[#334158] outline-none shadow-[0_4px_14px_rgba(50,43,31,0.04)] transition placeholder:text-[#a8a095] focus:border-[#c99a43] focus:ring-2 focus:ring-[#c99a43]/10" />
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded bg-[#f7f4ee] px-1 py-0.5 text-[7.5px] text-[#988f81]">⌘K</kbd>
            </form>
            <Link href={`/${locale}/notifications`} aria-label={locale === "zh" ? "通知" : "Notifications"} className="relative grid h-9 w-9 place-items-center rounded-[7px] text-[#26364e] transition hover:bg-white"><Bell className="h-4 w-4" /><span className="absolute right-0.5 top-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-[#e74f3f] px-0.5 text-[7px] font-bold text-white">3</span></Link>
            <Link href={`/${locale}/inquiries/new`} className="inline-flex h-9 items-center gap-2 rounded-[7px] bg-[#102544] px-4 text-[10px] font-semibold text-white shadow-[0_8px_18px_rgba(16,37,68,0.18)] transition hover:-translate-y-px hover:bg-[#19375e]"><Plus className="h-3.5 w-3.5" />{t.newRequest}<ChevronDown className="h-3 w-3 text-white/60" /></Link>
          </div>
        </header>

        <section className="mt-4 grid gap-3 xl:grid-cols-[290px_minmax(0,1.65fr)_minmax(300px,1fr)]" aria-label="Key performance indicators">
          <FeaturedKpiCard kpi={featuredKpi} />
          <div className="grid self-start overflow-hidden rounded-[9px] border border-[#ece6dc] bg-white shadow-[0_8px_24px_rgba(53,43,28,0.045)] sm:grid-cols-3">
            {supportingKpis.slice(0, 3).map((kpi, index) => <CompactKpiCard key={kpi.label} kpi={kpi} divided={index > 0} />)}
          </div>
          <div className="grid self-start overflow-hidden rounded-[9px] border border-[#ece6dc] bg-white shadow-[0_8px_24px_rgba(53,43,28,0.045)] sm:grid-cols-2">
            {supportingKpis.slice(3).map((kpi, index) => <CompactKpiCard key={kpi.label} kpi={kpi} divided={index > 0} />)}
          </div>
        </section>

        <section className="mt-3 grid gap-3 xl:-mt-[38px] xl:grid-cols-12">
          <div className="overflow-hidden rounded-[9px] border border-[#e9e3d9] bg-white shadow-[0_10px_28px_rgba(50,42,31,0.05)] xl:col-span-9">
            <RouteIntelligenceMap locale={locale} selectedRouteId={selectedRoute.id} onRouteSelect={setSelectedRoute} dashboard />
          </div>

          <section className="overflow-hidden rounded-[9px] border border-[#e9e3d9] bg-white shadow-[0_10px_28px_rgba(50,42,31,0.05)] xl:col-span-3">
            <RouteDetailPanel locale={locale} route={selectedRoute} compact />
          </section>
        </section>

        <section className="mt-3 grid gap-3 xl:grid-cols-12">
          <DashboardCard className="xl:col-span-3" title={locale === "zh" ? "需要處理" : "Needs attention"} action={<span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#fff0e8] px-1 text-[9px] font-bold text-[#ef6547]">{Math.max(model.deadlines.length, 6)}</span>}>
            <DeadlineList items={model.deadlines} locale={locale} />
          </DashboardCard>
          <DashboardCard className="xl:col-span-2" title={locale === "zh" ? "競價流程" : "Bid pipeline"} action={<PeriodControl locale={locale} period={period} onChange={setPeriod} />}>
            <PipelineSummary funnel={model.funnel} locale={locale} />
          </DashboardCard>
          <DashboardCard className="xl:col-span-2" title={locale === "zh" ? "中標與落選" : "Awarded vs lost"} action={<span className="text-[9px] text-[#998f7e]">{t.periods[period]}</span>}>
            <AwardedLostDonut funnel={model.funnel} locale={locale} />
          </DashboardCard>
          <DashboardCard className="xl:col-span-2" title={locale === "zh" ? "節省趨勢" : "Savings trend"} action={<span className="text-[9px] text-[#998f7e]">{locale === "zh" ? "本年度" : "This year"}</span>}>
            <SavingsTrend trend={model.trend} locale={locale} />
          </DashboardCard>
          <DashboardCard className="xl:col-span-3" title={t.routesTitle} action={<span className="text-[9px] text-[#998f7e]">{locale === "zh" ? "按中標額" : "By spend"}</span>}>
            <RouteRanking locale={locale} routes={model.routes} />
          </DashboardCard>

        </section>

        <section className="mt-3 overflow-hidden rounded-[9px] border border-[#e9e3d9] bg-white shadow-[0_10px_28px_rgba(50,42,31,0.045)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eee9e1] px-4 py-3">
            <div className="flex flex-wrap items-center gap-3"><h2 className="text-[14px] font-semibold text-[#18243a]">{locale === "zh" ? "進行中項目" : "Active projects"}</h2><button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-[#e8e2d8] bg-white px-2.5 text-[9px] text-[#5e697b]">{locale === "zh" ? "全部地區" : "All regions"}<ChevronDown className="h-3 w-3" /></button><button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-[#e8e2d8] bg-white px-2.5 text-[9px] text-[#5e697b]">{locale === "zh" ? "全部模式" : "All modes"}<ChevronDown className="h-3 w-3" /></button><button type="button" className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-[#e8e2d8] bg-white px-2.5 text-[9px] text-[#5e697b]"><SlidersHorizontal className="h-3 w-3" />{locale === "zh" ? "篩選" : "Filters"}</button></div>
            <Link href={`/${locale}/orders`} className="inline-flex h-7 items-center gap-1.5 rounded-[6px] border border-[#e8e2d8] px-3 text-[9px] font-medium text-[#334158] transition hover:border-[#cabfae] hover:bg-[#fffdf9]">{t.viewAll}<ChevronDown className="h-3 w-3" /></Link>
          </div>
          <ActiveOrdersTable locale={locale} orders={model.activeOrders} />
        </section>
      </div>
    </main>
  )
}

function DashboardCard({ title, intro, action, className = "", children }: { title: string; intro?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`min-w-0 rounded-[9px] border border-[#e9e3d9] bg-white p-4 shadow-[0_8px_24px_rgba(50,42,31,0.045)] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="truncate text-[12px] font-semibold text-[#18243a]">{title}</h2>{intro ? <p className="mt-1 text-[9.5px] leading-4 text-[#7c899d]">{intro}</p> : null}</div>
        {action}
      </div>
      {children}
    </section>
  )
}

function FeaturedKpiCard({ kpi }: { kpi: Kpi }) {
  const DeltaIcon = kpi.positive ? TrendingUp : TrendingDown
  const data = kpi.series.map((value, index) => ({ index, value }))
  return (
    <article className="group relative z-10 min-h-[160px] overflow-hidden rounded-[9px] border border-[#153b43] bg-[radial-gradient(circle_at_85%_12%,rgba(44,203,181,0.17),transparent_35%),linear-gradient(145deg,#11343b,#0b2632_66%,#123844)] px-5 py-4 shadow-[0_12px_28px_rgba(14,45,52,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(14,45,52,0.2)]">
      <p className="text-[10px] font-medium uppercase tracking-[0.03em] text-[#d4e3e1]">{kpi.label}</p>
      <p className="mt-2 text-[31px] font-semibold leading-none tracking-[-0.02em] text-[#f3cf81]">{kpi.value}</p>
      <div className="absolute inset-x-4 bottom-3 h-[64px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 1, left: 1, bottom: 0 }}>
            <defs><linearGradient id="featured-kpi-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16c3b2" stopOpacity={0.35} /><stop offset="100%" stopColor="#16c3b2" stopOpacity={0} /></linearGradient></defs>
            <Area type="monotone" dataKey="value" stroke="#16c3b2" strokeWidth={1.7} fill="url(#featured-kpi-fill)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <span className="absolute bottom-3 left-5 inline-flex items-center gap-1 rounded-full bg-[#1a645f]/70 px-2 py-1 text-[9px] font-semibold text-[#8de6d4]"><DeltaIcon className="h-3 w-3" />{kpi.delta}<span className="font-normal text-white/55">vs last 30 days</span></span>
    </article>
  )
}

function CompactKpiCard({ kpi, divided }: { kpi: Kpi; divided: boolean }) {
  const DeltaIcon = kpi.positive ? TrendingUp : TrendingDown
  return <article className={`flex min-h-[112px] min-w-0 items-start gap-3 px-4 py-3.5 transition hover:bg-[#fffdf9] ${divided ? "border-t border-[#eee9e1] sm:border-l sm:border-t-0" : ""}`}><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full" style={{ color: kpi.color, backgroundColor: kpi.soft }}><kpi.icon className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="text-[9px] font-medium leading-4 text-[#536075]">{kpi.label}</p><p className="mt-1.5 text-[22px] font-semibold leading-none tracking-[-0.01em] text-[#101b31]">{kpi.value}</p><span className={`mt-2 inline-flex items-center gap-1 text-[8.5px] font-semibold ${kpi.positive ? "text-[#1a9a62]" : "text-[#e05245]"}`}><DeltaIcon className="h-3 w-3" />{kpi.delta}</span><p className="mt-0.5 text-[7.5px] text-[#9a9388]">vs last 30 days</p></div></article>
}

function PeriodControl({ locale, period, onChange }: { locale: Locale; period: Period; onChange: (period: Period) => void }) {
  return <select value={period} onChange={(event) => onChange(event.target.value as Period)} className="h-6 rounded-[5px] border border-[#ece6dc] bg-[#fffdfa] px-1.5 text-[8.5px] font-medium text-[#6c756f] outline-none focus:border-[#c99a43]">{(["30d", "90d", "6m"] as Period[]).map((item) => <option key={item} value={item}>{ui[locale].periods[item]}</option>)}</select>
}

function PipelineSummary({ funnel, locale }: { funnel: FunnelPoint[]; locale: Locale }) {
  const total = Math.max(funnel[0]?.value || 0, 1)
  return <div className="mt-3"><p className="text-[26px] font-semibold leading-none text-[#152139]">{funnel[0]?.value || 0}</p><p className="mt-1 text-[8.5px] text-[#7e8998]">{locale === "zh" ? "總商機" : "Total opportunities"}</p><div className="mt-3 flex h-3.5 overflow-hidden rounded-[4px] bg-[#f0ede7]">{funnel.map((item) => <span key={item.label} title={`${item.label}: ${item.value}`} style={{ width: `${Math.max(item.value / total * 100, 8)}%`, backgroundColor: item.color }} />)}</div><div className="mt-3 grid grid-cols-4 gap-1">{funnel.map((item) => <div key={item.label} className="min-w-0"><p className="text-[12px] font-semibold text-[#1d2940]">{item.value}</p><p className="truncate text-[7px] text-[#8a938f]">{item.label}</p></div>)}</div><div className="mt-3 flex items-center justify-between border-t border-[#eee9e1] pt-2.5 text-[8.5px]"><span className="text-[#7f897f]">{locale === "zh" ? "轉換率" : "Conversion rate"}</span><strong className="text-[#152139]">{Math.round((funnel[2]?.value || 0) / total * 100)}% <span className="ml-1 text-[#1b9b66]">↑ 4.2%</span></strong></div></div>
}

function AwardedLostDonut({ funnel, locale }: { funnel: FunnelPoint[]; locale: Locale }) {
  const base = Math.max(funnel[1]?.value || funnel[0]?.value || 1, 1)
  const awarded = Math.min(funnel[2]?.value || 0, base)
  const lost = Math.max(base - awarded, 0)
  const awardedRate = Math.round(awarded / base * 100)
  const data = [{ name: locale === "zh" ? "中標" : "Awarded", value: awarded, color: "#18aa95" }, { name: locale === "zh" ? "落選" : "Lost", value: lost, color: "#ef5b4f" }]
  return <div className="mt-2"><div className="relative mx-auto h-[102px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" innerRadius={31} outerRadius={45} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><strong className="text-[16px] text-[#18243a]">{base}</strong><span className="text-[7.5px] text-[#8a938f]">{locale === "zh" ? "總計" : "Total"}</span></div></div><div className="space-y-1.5">{data.map((item) => <div key={item.name} className="flex items-center justify-between text-[8.5px]"><span className="inline-flex items-center gap-1.5 text-[#687487]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span><strong className="text-[#26334a]">{Math.round(item.value / base * 100)}% ({item.value})</strong></div>)}</div><div className="mt-2.5 flex items-center justify-between border-t border-[#eee9e1] pt-2.5 text-[8.5px]"><span className="text-[#7f897f]">{locale === "zh" ? "中標率" : "Win rate"}</span><strong className="text-[#152139]">{awardedRate}% <span className="ml-1 text-[#1b9b66]">↑ 6.3%</span></strong></div></div>
}

function SavingsTrend({ trend, locale }: { trend: TrendPoint[]; locale: Locale }) {
  const data = trend.map((item) => ({ ...item, savings: Math.round(item.awarded * 0.12) }))
  const total = sum(data.map((item) => item.savings))
  return <div className="mt-2"><div className="h-[128px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 8, right: 5, left: 0, bottom: 0 }}><defs><linearGradient id="savings-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#20aa9d" stopOpacity={0.28} /><stop offset="100%" stopColor="#20aa9d" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#eeeae3" strokeDasharray="2 5" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#9a9388", fontSize: 7.5 }} interval={2} /><Tooltip content={<TrendTooltip locale={locale} />} /><Area type="monotone" dataKey="savings" stroke="#18a99b" strokeWidth={2} fill="url(#savings-fill)" dot={false} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div><div className="mt-2 flex items-center justify-between border-t border-[#eee9e1] pt-2.5"><span className="text-[8.5px] text-[#7f897f]">{locale === "zh" ? "總節省" : "Total savings"}</span><strong className="text-[12px] text-[#17243b]">{formatHkd(total)} <span className="ml-1 text-[8.5px] text-[#1b9b66]">↑ 15.3%</span></strong></div></div>
}

function RouteRanking({ locale, routes }: { locale: Locale; routes: RoutePoint[] }) {
  const rows = routes.length ? routes : sampleRoutes(locale)
  return <div className="mt-3 space-y-3">{rows.slice(0, 5).map((route, index) => <div key={route.route} className="grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-2"><span className="text-[8.5px] text-[#9b9489]">{index + 1}</span><div className="min-w-0"><p className="truncate text-[9.5px] font-medium text-[#344157]">{route.route}</p><div className="mt-1 h-1 overflow-hidden rounded-full bg-[#f0ede8]"><div className="h-full rounded-full" style={{ width: `${Math.max(route.share, 8)}%`, backgroundColor: route.color }} /></div></div><span className="text-[9px] font-semibold tabular-nums text-[#35425a]">{formatHkd(route.value)}</span></div>)}</div>
}

function DeadlineList({ items, locale }: { items: DeadlineItem[]; locale: Locale }) {
  const fallback: DeadlineItem[] = [
    { id: "attention-1", type: "!", title: locale === "zh" ? "競價將於 48 小時內結束" : "Bids closing in 48 hours", meta: locale === "zh" ? "5 個項目" : "5 projects", value: locale === "zh" ? "今日 18:00" : "Today 18:00", tone: "#ef5b4f", href: `/${locale}/marketplace` },
    { id: "attention-2", type: "△", title: locale === "zh" ? "項目低於利潤目標" : "Projects below margin target", meta: locale === "zh" ? "3 個項目" : "3 projects", value: locale === "zh" ? "明日" : "Tomorrow", tone: "#f29a2e", href: `/${locale}/analytics` },
    { id: "attention-3", type: "DOC", title: locale === "zh" ? "逾期文件" : "Overdue documents", meta: locale === "zh" ? "7 個項目" : "7 projects", value: locale === "zh" ? "2 日前" : "2 days ago", tone: "#ef6547", href: `/${locale}/orders` },
    { id: "attention-4", type: "TRK", title: locale === "zh" ? "延誤貨運" : "Delayed shipments", meta: locale === "zh" ? "4 票貨運" : "4 shipments", value: locale === "zh" ? "運送中" : "In transit", tone: "#f0a02e", href: `/${locale}/orders` },
    { id: "attention-5", type: "RISK", title: locale === "zh" ? "供應商合規警告" : "Supplier compliance warnings", meta: locale === "zh" ? "3 個供應商" : "3 suppliers", value: locale === "zh" ? "需要處理" : "Action needed", tone: "#ef5b4f", href: `/${locale}/forwarders` },
    { id: "attention-6", type: "OK", title: locale === "zh" ? "等待審批" : "Approvals waiting", meta: locale === "zh" ? "6 個需求" : "6 requests", value: locale === "zh" ? "需要處理" : "Action needed", tone: "#24a66d", href: `/${locale}/requests` },
  ]
  const rows = [...items, ...fallback.filter((fallbackItem) => !items.some((item) => item.id === fallbackItem.id))].slice(0, 6)
  return <div className="mt-2 divide-y divide-[#eee9e1]">{rows.map((item) => <Link key={item.id} href={item.href} className="group grid min-h-7 grid-cols-[18px_minmax(0,1fr)_auto_auto] items-center gap-2 py-1.5 transition hover:bg-[#fffaf3]"><span className="grid h-4.5 w-4.5 place-items-center rounded-[4px] text-[6px] font-bold" style={{ color: item.tone, backgroundColor: `${item.tone}16` }}>{item.type}</span><span className="min-w-0 truncate text-[8.5px] font-medium text-[#3e4a5e] group-hover:text-[#9a6417]">{item.title}</span><span className="hidden truncate text-[7.3px] text-[#92998f] 2xl:block">{item.meta}</span><span className="flex-shrink-0 text-right text-[7.5px] font-medium" style={{ color: item.tone }}>{item.value}</span></Link>)}</div>
}

function ActiveOrdersTable({ locale, orders }: { locale: Locale; orders: JsonRecord[] }) {
  const rows = orders.length ? orders.slice(0, 5) : sampleOrders()
  const owners = ["Ava Wong", "Jason Li", "Mandy Cheung", "Kenji Sato", "Daniel Ho"]
  const risks = locale === "zh" ? ["中", "低", "高", "中", "低"] : ["Medium", "Low", "High", "Medium", "Low"]
  return <div className="overflow-x-auto"><table className="w-full min-w-[1180px] border-collapse text-left"><thead><tr className="border-b border-[#eee9e1] text-[8px] font-medium text-[#818b98]"><th className="px-4 py-2.5">{locale === "zh" ? "項目編號" : "Project ID"}</th><th className="px-3 py-2.5">{locale === "zh" ? "航線" : "Route"}</th><th className="px-3 py-2.5">{locale === "zh" ? "需求類型" : "Request type"}</th><th className="px-3 py-2.5">{locale === "zh" ? "負責人" : "Project owner"}</th><th className="px-3 py-2.5">{locale === "zh" ? "截止" : "Deadline"}</th><th className="px-3 py-2.5"># Bids</th><th className="px-3 py-2.5">{locale === "zh" ? "最佳報價" : "Best bid (HKD)"}</th><th className="px-3 py-2.5">{locale === "zh" ? "目標節省" : "Target savings"}</th><th className="px-3 py-2.5">{locale === "zh" ? "狀態" : "Status"}</th><th className="px-3 py-2.5">{locale === "zh" ? "風險" : "Risk"}</th><th className="px-3 py-2.5">{locale === "zh" ? "下一步" : "Next action"}</th><th className="w-10 px-3 py-2.5" /></tr></thead><tbody>{rows.map((order, index) => { const quotation = firstRecord(order.quotations); const request = firstRecord(quotation?.shipment_requests); const risk = risks[index % risks.length]; const riskColor = risk === "High" || risk === "高" ? "#ef5b4f" : risk === "Medium" || risk === "中" ? "#f1a02d" : "#1da870"; const route = routeLabel(request?.route, locale); return <tr key={order.id || index} className="border-b border-[#f1ede7] text-[8.8px] text-[#455166] transition hover:bg-[#fffcf7]"><td className="px-4 py-2.5 font-semibold text-[#355bc5]">PRJ-{shortId(order.id)}</td><td className="px-3 py-2.5 font-medium text-[#26354a]"><span className="inline-flex items-center gap-1.5"><Plane className="h-3 w-3 text-[#264f80]" />{route}</span></td><td className="px-3 py-2.5 text-[#315fd0]">{cargoLabel(request?.cargo_details)}</td><td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#e8eef8] text-[6.5px] font-bold text-[#2e496c]">{owners[index % owners.length].split(" ").map((part) => part[0]).join("")}</span>{owners[index % owners.length]}</span></td><td className="px-3 py-2.5">{formatShortDate(request?.bid_deadline || order.created_at, locale)} <span className="ml-1 text-[#ed654b]">{2 + index * 3} days left</span></td><td className="px-3 py-2.5 tabular-nums">{request?.bid_count || 9 + index * 3}</td><td className="px-3 py-2.5 font-semibold tabular-nums">{formatHkd(numberValue(quotation?.total_amount) || 1850000 - index * 210000)}</td><td className="px-3 py-2.5 font-semibold text-[#1b9b66]">{12 + index}%</td><td className="px-3 py-2.5"><span className="rounded-[5px] bg-[#eef0ff] px-2 py-1 text-[#5263df]">{statusLabel(String(order.status || "confirmed"), locale)}</span></td><td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5" style={{ color: riskColor }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: riskColor }} />{risk}</span></td><td className="px-3 py-2.5 font-medium text-[#334158]">{locale === "zh" ? "檢視競價" : "Review bids"}</td><td className="px-3 py-2.5"><Link href={`/${locale}/orders/${order.id}`} aria-label={`${locale === "zh" ? "查看" : "View"} ${shortId(order.id)}`} className="grid h-7 w-7 place-items-center rounded-[5px] text-[#7d8692] transition hover:bg-[#f1eee8] hover:text-[#28374d]"><MoreHorizontal className="h-3.5 w-3.5" /></Link></td></tr> })}</tbody></table></div>
}

function TrendTooltip({ active, payload, label, locale }: { active?: boolean; payload?: Array<{ value?: number; dataKey?: string; color?: string }>; label?: string; locale: Locale }) {
  if (!active || !payload?.length) return null
  const labels: Record<string, string> = { pipeline: ui[locale].pipeline, awarded: ui[locale].awarded, completed: ui[locale].completed, savings: locale === "zh" ? "節省" : "Savings" }
  return <div className="min-w-[180px] rounded-[7px] border border-[#e1e6ef] bg-white/95 p-3 shadow-[0_12px_30px_rgba(31,47,84,0.14)] backdrop-blur"><p className="mb-2 text-[9px] font-semibold text-[#536078]">{label}</p>{payload.map((item) => <div key={item.dataKey} className="mt-1 flex items-center justify-between gap-4 text-[8.5px]"><span className="inline-flex items-center gap-1.5 text-[#738097]"><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: item.color }} />{labels[item.dataKey || ""]}</span><strong className="text-[#27344d]">{formatHkd(Number(item.value || 0))}</strong></div>)}</div>
}

function FunnelTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload?: FunnelPoint }> }) {
  const item = payload?.[0]?.payload
  return active && item ? <div className="rounded-[6px] border border-[#e1e6ef] bg-white px-3 py-2 text-[9px] shadow-lg"><span className="text-[#6f7c92]">{item.label}</span><strong className="ml-3 text-[#27344d]">{item.value}</strong></div> : null
}

function DashboardSkeleton() {
  return <main className="min-h-screen bg-[#f5f7fc] px-4 py-6 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1600px] animate-pulse"><div className="h-8 w-72 rounded bg-[#e8ebf3]" /><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-32 rounded-[8px] bg-white" />)}</div><div className="mt-3 grid gap-3 xl:grid-cols-12"><div className="h-[350px] rounded-[8px] bg-white xl:col-span-4" /><div className="h-[350px] rounded-[8px] bg-white xl:col-span-5" /><div className="h-[350px] rounded-[8px] bg-white xl:col-span-3" /></div></div></main>
}

function buildDashboardModel(workspace: Workspace, mode: ViewMode, period: Period, locale: Locale): DashboardModel {
  if (workspace.demoMode) return sampleModel(mode, period, locale, workspace)
  const requests = workspace.ownRequests || []
  const bids = workspace.bids || []
  const orders = relevantOrders(workspace, mode)
  const activeOrders = orders.filter((order) => !["completed", "cancelled"].includes(String(order.status || "").toLowerCase()))
  const awardedValue = sum(orders.map(orderValue))
  const completed = orders.filter((order) => String(order.status).toLowerCase() === "completed")
  const completedValue = sum(completed.map(orderValue))
  const bidsReceived = sum(requests.map((request) => workspace.bidCountByRequest?.[request.id] || 0))
  const closedBids = bids.filter((bid) => !["OPEN", "PENDING_REVIEW"].includes(String(firstRecord(bid.shipment_requests)?.status || "OPEN").toUpperCase()))
  const winRate = closedBids.length ? Math.round(orders.length / closedBids.length * 100) : 0
  const responseMinutes = Math.round(average(bids.map(bidResponseMinutes).filter((value) => value >= 0)))
  const opportunityCount = (workspace.opportunities || []).length
  const actionCount = buildDeadlines(workspace, locale).length

  const labels = {
    overview: locale === "zh" ? ["中標總值", "開放競價", "進行中訂單", "完成訂單值", "準時交付率"] : ["Awarded value", "Open bid windows", "Active orders", "Completed value", "On-time delivery"],
    client: locale === "zh" ? ["已接受運費", "收到 Bid", "進行中需求", "完成交付值", "準時交付率"] : ["Accepted spend", "Bids received", "Active requests", "Completed delivery value", "On-time delivery"],
    forwarder: locale === "zh" ? ["中標總值", "已提交 Bid", "進行中訂單", "中標率", "平均回應時間"] : ["Awarded value", "Bids submitted", "Active orders", "Win rate", "Average response"],
  }[mode]
  const kpis = mode === "client"
    ? [makeKpi(labels[0], formatHkd(awardedValue), "+12.6%", Award, palette.blue, "#eef1ff", [18, 24, 22, 31, 36, 42]), makeKpi(labels[1], String(bidsReceived), "+8.7%", BriefcaseBusiness, palette.violet, "#f2efff", [11, 14, 13, 18, 21, 26]), makeKpi(labels[2], String(requests.length), "+5.3%", Send, palette.cyan, "#e9fbfa", [7, 9, 8, 11, 12, 14]), makeKpi(labels[3], formatHkd(completedValue), "+15.8%", PackageCheck, palette.orange, "#fff4e9", [12, 16, 18, 21, 25, 31]), makeKpi(labels[4], "96.2%", "+3.4%", CheckCircle2, palette.green, "#eaf8f0", [84, 86, 89, 88, 92, 96])]
    : mode === "forwarder"
      ? [makeKpi(labels[0], formatHkd(awardedValue), "+15.4%", Award, palette.blue, "#eef1ff", [20, 26, 24, 34, 40, 48]), makeKpi(labels[1], String(bids.length), "+8.7%", Send, palette.violet, "#f2efff", [8, 11, 13, 15, 18, 23]), makeKpi(labels[2], String(activeOrders.length), "+5.3%", Truck, palette.cyan, "#e9fbfa", [3, 4, 5, 5, 7, 9]), makeKpi(labels[3], `${winRate}%`, "+4.2 pts", Target, palette.orange, "#fff4e9", [18, 21, 19, 25, 28, winRate]), makeKpi(labels[4], responseMinutes ? `${responseMinutes}m` : "--", "7m faster", Clock3, palette.green, "#eaf8f0", [42, 38, 35, 31, 27, responseMinutes || 24])]
      : [makeKpi(labels[0], formatHkd(awardedValue), "+12.6%", Award, palette.blue, "#eef1ff", [18, 24, 22, 31, 36, 42]), makeKpi(labels[1], String(opportunityCount), "+8.7%", BriefcaseBusiness, palette.violet, "#f2efff", [7, 8, 11, 10, 15, 18]), makeKpi(labels[2], String(activeOrders.length), "+5.3%", Truck, palette.cyan, "#e9fbfa", [3, 4, 5, 5, 7, 9]), makeKpi(labels[3], formatHkd(completedValue), "+15.8%", PackageCheck, palette.orange, "#fff4e9", [12, 16, 18, 21, 25, 31]), makeKpi(labels[4], actionCount ? "94.8%" : "96.2%", "+3.4%", CheckCircle2, palette.green, "#eaf8f0", [84, 86, 89, 88, 92, 96])]

  return { kpis, trend: buildTrend(workspace, mode, period, locale), funnel: buildFunnel(workspace, mode, locale), routes: buildRoutes(workspace, mode, locale), deadlines: buildDeadlines(workspace, locale), activeOrders }
}

function sampleModel(mode: ViewMode, period: Period, locale: Locale, workspace: Workspace): DashboardModel {
  const scale = period === "30d" ? 0.28 : period === "90d" ? 0.58 : 1
  const labels = mode === "client"
    ? (locale === "zh" ? ["已接受運費", "收到 Bid", "進行中需求", "節省金額", "準時交付率"] : ["Accepted spend", "Bids received", "Active requests", "Awarded savings", "On-time delivery"])
    : mode === "forwarder"
      ? (locale === "zh" ? ["中標總值", "已提交 Bid", "進行中訂單", "中標率", "平均回應時間"] : ["Awarded value", "Bids submitted", "Active orders", "Win rate", "Average response"])
      : (locale === "zh" ? ["中標總值", "開放競價", "進行中訂單", "節省金額", "準時交付率"] : ["Awarded value", "Active bids", "Active orders", "Awarded savings", "On-time delivery"])
  const kpis = [
    makeKpi(labels[0], formatHkd(4200000 * scale), "+12.6%", Award, palette.blue, "#eef1ff", [18, 23, 21, 28, 31, 42, 39, 48]),
    makeKpi(labels[1], mode === "client" ? "64" : "23", "+8.7%", BriefcaseBusiness, palette.violet, "#f2efff", [9, 12, 11, 15, 14, 18, 19, 23]),
    makeKpi(labels[2], "9", "+5.3%", Truck, palette.cyan, "#e9fbfa", [3, 4, 5, 4, 6, 7, 7, 9]),
    makeKpi(labels[3], mode === "forwarder" ? "31.8%" : formatHkd(610000 * scale), mode === "forwarder" ? "+4.2 pts" : "+15.8%", mode === "forwarder" ? Target : PackageCheck, palette.orange, "#fff4e9", [12, 16, 15, 20, 22, 26, 25, 31]),
    makeKpi(labels[4], mode === "forwarder" ? "18m" : "96.2%", mode === "forwarder" ? "7m faster" : "+3.4%", CheckCircle2, palette.green, "#eaf8f0", [82, 85, 87, 86, 91, 90, 93, 96]),
  ]
  const trendBase = [[280, 210, 150], [360, 250, 170], [440, 320, 220], [390, 300, 240], [520, 370, 280], [610, 440, 330], [560, 410, 350], [690, 500, 390], [740, 540, 430], [810, 590, 470], [920, 680, 540], [1080, 790, 620]]
  const months = locale === "zh" ? ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const trend = months.map((label, index) => ({ label, pipeline: trendBase[index][0] * 1000 * scale, awarded: trendBase[index][1] * 1000 * scale, completed: trendBase[index][2] * 1000 * scale }))
  const funnelLabels = mode === "client" ? (locale === "zh" ? ["已建立需求", "收到 Bid", "已選擇", "已交付"] : ["Requests", "Bids received", "Awarded", "Delivered"]) : (locale === "zh" ? ["合資格機會", "已提交 Bid", "中標", "已完成"] : ["Eligible", "Bids submitted", "Awarded", "Completed"])
  const funnel = funnelLabels.map((label, index) => ({ label, value: [342, 246, 98, 57][index], color: [palette.blue, palette.violet, palette.cyan, palette.orange][index] }))
  const routes = sampleRoutes(locale).map((route) => ({ ...route, value: route.value * scale }))
  return { kpis, trend, funnel, routes, deadlines: buildDeadlines(workspace, locale), activeOrders: sampleOrders() }
}

function buildTrend(workspace: Workspace, mode: ViewMode, period: Period, locale: Locale): TrendPoint[] {
  const buckets = trendBuckets(period, locale)
  for (const bid of workspace.bids || []) {
    if (mode === "client") continue
    const bucket = bucketFor(buckets, dateValue(bid.submitted_at))
    if (bucket) bucket.pipeline += numberValue(bid.price)
  }
  for (const order of relevantOrders(workspace, mode)) {
    const bucket = bucketFor(buckets, dateValue(order.created_at))
    if (!bucket) continue
    const value = orderValue(order)
    bucket.awarded += value
    if (String(order.status).toLowerCase() === "completed") bucket.completed += value
    if (mode === "client") bucket.pipeline += value
  }
  return buckets.map(({ label, pipeline, awarded, completed }) => ({ label, pipeline, awarded, completed }))
}

function buildFunnel(workspace: Workspace, mode: ViewMode, locale: Locale): FunnelPoint[] {
  const requests = workspace.ownRequests || []
  const bids = workspace.bids || []
  const orders = relevantOrders(workspace, mode)
  const completed = orders.filter((order) => String(order.status).toLowerCase() === "completed").length
  const labels = mode === "client" ? (locale === "zh" ? ["已建立需求", "已發布", "已選擇", "已交付"] : ["Requests", "Published", "Awarded", "Delivered"]) : (locale === "zh" ? ["合資格機會", "已提交 Bid", "中標", "已完成"] : ["Eligible", "Bids submitted", "Awarded", "Completed"])
  const values = mode === "client" ? [requests.length, requests.filter((item) => String(item.status).toUpperCase() === "OPEN").length, orders.length, completed] : [(workspace.opportunities || []).length, bids.length, orders.length, completed]
  return labels.map((label, index) => ({ label, value: values[index], color: [palette.blue, palette.violet, palette.cyan, palette.orange][index] }))
}

function buildRoutes(workspace: Workspace, mode: ViewMode, locale: Locale): RoutePoint[] {
  const map = new Map<string, { value: number; orders: number }>()
  for (const order of relevantOrders(workspace, mode)) {
    const quotation = firstRecord(order.quotations)
    const request = firstRecord(quotation?.shipment_requests)
    const route = routeLabel(request?.route, locale)
    const row = map.get(route) || { value: 0, orders: 0 }
    row.value += orderValue(order)
    row.orders += 1
    map.set(route, row)
  }
  const rows = Array.from(map, ([route, data]) => ({ route, ...data })).sort((a, b) => b.value - a.value).slice(0, 5)
  const max = Math.max(...rows.map((row) => row.value), 1)
  return rows.map((row, index) => ({ ...row, share: row.value / max * 100, color: [palette.blue, palette.violet, palette.cyan, palette.orange, palette.green][index] }))
}

function buildDeadlines(workspace: Workspace, locale: Locale): DeadlineItem[] {
  const opportunities = [...(workspace.opportunities || [])].sort((a, b) => dateValue(a.bid_deadline) - dateValue(b.bid_deadline))
  const items: DeadlineItem[] = opportunities.slice(0, 2).map((item, index) => ({ id: `bid-${item.id}`, type: "Bid", title: routeLabel(item.route, locale), meta: shortId(item.id), value: timeLeft(item.bid_deadline, locale), tone: index ? palette.violet : palette.red, href: `/${locale}/marketplace/${item.id}` }))
  const missing = (workspace.orders || []).find((order) => { const docs = (workspace.documentTypesByOrder?.[order.id] || []).map((item) => String(item).toLowerCase()); return !docs.includes("packing_list") })
  if (missing) items.push({ id: `doc-${missing.id}`, type: "DOC", title: locale === "zh" ? "Packing List 尚未上傳" : "Packing List missing", meta: shortId(missing.id), value: "24h", tone: palette.orange, href: `/${locale}/orders/${missing.id}` })
  if (items.length < 4) items.push(
    { id: "demo-1", type: "Bid", title: "Vietnam → Hong Kong", meta: "SR-2026-0201", value: "12m", tone: palette.red, href: `/${locale}/marketplace` },
    { id: "demo-2", type: "DOC", title: locale === "zh" ? "Commercial Invoice 待確認" : "Commercial Invoice pending", meta: "ORD-2026-1048", value: "2d", tone: palette.orange, href: `/${locale}/orders` },
    { id: "demo-3", type: "ETA", title: "Taipei → Hong Kong", meta: "ORD-2026-1044", value: "4d", tone: palette.green, href: `/${locale}/orders` },
  )
  return Array.from(new Map(items.map((item) => [item.id, item])).values()).slice(0, 4)
}

function sampleRoutes(locale: Locale): RoutePoint[] {
  const destination = locale === "zh" ? "香港" : "Hong Kong"
  return [
    { route: `${locale === "zh" ? "越南" : "Vietnam"} → ${destination}`, value: 980000, orders: 8, share: 100, color: palette.blue },
    { route: `${locale === "zh" ? "台灣" : "Taiwan"} → ${destination}`, value: 740000, orders: 6, share: 76, color: palette.violet },
    { route: `${locale === "zh" ? "馬來西亞" : "Malaysia"} → ${destination}`, value: 560000, orders: 5, share: 57, color: palette.cyan },
    { route: `${locale === "zh" ? "泰國" : "Thailand"} → ${destination}`, value: 380000, orders: 3, share: 39, color: palette.orange },
    { route: `${locale === "zh" ? "菲律賓" : "Philippines"} → ${destination}`, value: 290000, orders: 2, share: 30, color: palette.green },
  ]
}

function sampleOrders(): JsonRecord[] {
  return [
    { id: "ORD-2026-1048", status: "in_transit", created_at: new Date().toISOString(), quotations: { total_amount: 248000, shipment_requests: { route: { origin: "Ho Chi Minh City", destination: "Hong Kong" }, cargo_details: { cargo_type: "Electronics" } } } },
    { id: "ORD-2026-1044", status: "customs_cleared", created_at: new Date().toISOString(), quotations: { total_amount: 186000, shipment_requests: { route: { origin: "Taipei", destination: "Hong Kong" }, cargo_details: { cargo_type: "Components" } } } },
    { id: "ORD-2026-1039", status: "shipment_booked", created_at: new Date().toISOString(), quotations: { total_amount: 324000, shipment_requests: { route: { origin: "Kuala Lumpur", destination: "Hong Kong" }, cargo_details: { cargo_type: "Machinery" } } } },
  ]
}

function makeKpi(label: string, value: string, delta: string, icon: LucideIcon, color: string, soft: string, series: number[]): Kpi {
  return { label, value, delta, positive: !delta.startsWith("-"), icon, color, soft, series }
}

function relevantOrders(workspace: Workspace, mode: ViewMode) {
  const orders = workspace.orders || []
  if (!workspace.userId || mode === "overview") return orders
  return orders.filter((order) => {
    const quotation = firstRecord(order.quotations)
    const request = firstRecord(quotation?.shipment_requests)
    return mode === "client" ? request?.agent_id === workspace.userId : quotation?.forwarder_id === workspace.userId
  })
}

function trendBuckets(period: Period, locale: Locale) {
  const end = Date.now()
  const days = period === "30d" ? 30 : period === "90d" ? 90 : 183
  const start = end - days * 86400000
  const width = (end - start) / 6
  return Array.from({ length: 6 }, (_, index) => { const bucketStart = start + index * width; const bucketEnd = bucketStart + width; return { start: bucketStart, end: bucketEnd, label: new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-HK", period === "6m" ? { month: "short" } : { day: "numeric", month: "short" }).format(new Date(bucketEnd - 1)), pipeline: 0, awarded: 0, completed: 0 } })
}

function bucketFor<T extends { start: number; end: number }>(buckets: T[], date: number) { return buckets.find((bucket) => date >= bucket.start && date < bucket.end) }
function firstRecord(value: any): JsonRecord | null { return !value ? null : Array.isArray(value) ? value[0] || null : value }
function orderValue(order: JsonRecord) { return numberValue(firstRecord(order.quotations)?.total_amount) }
function bidResponseMinutes(bid: JsonRecord) { const request = firstRecord(bid.shipment_requests); const start = dateValue(request?.created_at); const end = dateValue(bid.submitted_at); return start && end ? Math.max(0, (end - start) / 60000) : -1 }
function dateValue(value: unknown) { const date = value ? new Date(String(value)).getTime() : 0; return Number.isFinite(date) ? date : 0 }
function numberValue(value: unknown) { const number = Number(value || 0); return Number.isFinite(number) ? number : 0 }
function sum(values: number[]) { return values.reduce((total, value) => total + value, 0) }
function average(values: number[]) { return values.length ? sum(values) / values.length : 0 }
function formatHkd(value: number) { return `HKD ${compactNumber(value)}` }
function compactNumber(value: number) { return new Intl.NumberFormat("en-HK", { notation: value >= 10000 ? "compact" : "standard", maximumFractionDigits: value >= 10000 ? 1 : 0 }).format(value) }
function routeLabel(route: JsonRecord | null | undefined, locale: Locale) { const origin = route?.origin || (locale === "zh" ? "待定出發地" : "Origin pending"); const destination = route?.destination || route?.dest || (locale === "zh" ? "待定目的地" : "Destination pending"); return `${origin} → ${destination}` }
function cargoLabel(cargo: JsonRecord | null | undefined) { return String(cargo?.cargo_type || cargo?.cargo || cargo?.type || "General cargo") }
function shortId(value: unknown) { const text = String(value || ""); return text.length > 16 ? `${text.slice(0, 8)}…${text.slice(-4)}` : text }
function timeLeft(deadline: unknown, locale: Locale) { const minutes = Math.max(0, Math.floor((dateValue(deadline) - Date.now()) / 60000)); if (minutes < 60) return `${minutes}m`; const hours = Math.floor(minutes / 60); return locale === "zh" ? `${hours} 小時` : `${hours}h` }
function formatShortDate(value: unknown, locale: Locale) { const date = dateValue(value); return date ? new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-HK", { month: "short", day: "numeric" }).format(new Date(date)) : "--" }
function statusLabel(status: string, locale: Locale) { const labels: Record<string, { zh: string; en: string }> = { confirmed: { zh: "已確認", en: "Confirmed" }, shipment_booked: { zh: "已訂艙", en: "Shipment booked" }, in_transit: { zh: "運送中", en: "In transit" }, arrived_hk: { zh: "已到香港", en: "Arrived HK" }, customs_cleared: { zh: "已清關", en: "Customs cleared" }, delivered: { zh: "已送達", en: "Delivered" }, completed: { zh: "已完成", en: "Completed" } }; return labels[status.toLowerCase()]?.[locale] || status.replaceAll("_", " ") }
