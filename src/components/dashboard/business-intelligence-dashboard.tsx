"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Award,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileWarning,
  Globe2,
  PackageCheck,
  Plane,
  Plus,
  RefreshCw,
  Route,
  Send,
  Ship,
  Target,
  TrendingDown,
  TrendingUp,
  Truck,
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
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("overview")
  const [period, setPeriod] = useState<Period>("6m")
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<IntelligenceRoute>(intelligenceRoutes[0])
  const t = ui[locale]

  const loadWorkspace = useCallback(async () => {
    setLoading(true)
    try {
      const { response, body } = await apiJson("/api/workspace")
      const live = response.ok ? body : null
      setWorkspace(live && !isWorkspaceEmpty(live) ? live : getDemoWorkspace())
    } catch {
      setWorkspace(getDemoWorkspace())
    } finally {
      setUpdatedAt(new Date())
      setLoading(false)
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
  const statusText = workspace.demoMode ? t.sample : t.live
  const updateText = updatedAt?.toLocaleTimeString(locale === "zh" ? "zh-HK" : "en-HK", { hour: "2-digit", minute: "2-digit" }) || "--:--"

  const exportDashboard = () => {
    const rows = [
      ["metric", "value", "change"],
      ...model.kpis.map((item) => [item.label, item.value, item.delta]),
    ]
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n")
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const anchor = document.createElement("a")
    anchor.href = href
    anchor.download = "lbid-dashboard.csv"
    anchor.click()
    URL.revokeObjectURL(href)
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#f8f9fc_0%,#f1f5fa_48%,#fbfbfd_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px]">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#8290a8]">
              <span className={`h-2 w-2 rounded-full ${workspace.demoMode ? "bg-[#f4a63a]" : "bg-[#37b878]"}`} />
              {statusText}<span className="text-[#c2cad8]">/</span>{t.updated} {updateText}
            </div>
            <h1 className="mt-3 text-[30px] font-semibold leading-tight text-[#111a33] sm:text-[34px]">{t.greeting}, {firstName}.</h1>
            <p className="mt-1.5 text-[13px] leading-6 text-[#6f7d95]">{t.intro}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center rounded-[8px] border border-[#e5e9f2] bg-white p-1 shadow-[0_8px_24px_rgba(31,47,84,0.06)]" role="group" aria-label="Dashboard capability view">
              {(Object.keys(views) as ViewMode[]).map((view) => (
                <button key={view} type="button" aria-pressed={viewMode === view} onClick={() => setViewMode(view)} className={`h-8 rounded-[6px] px-3 text-[10.5px] font-semibold transition ${viewMode === view ? "bg-[#eef0ff] text-[#5362eb]" : "text-[#718097] hover:bg-[#f7f8fb] hover:text-[#16213d]"}`}>{views[view]}</button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => void loadWorkspace()} disabled={loading} title="Refresh" className="grid h-10 w-10 place-items-center rounded-[8px] border border-[#e5e9f2] bg-white text-[#64718a] shadow-[0_8px_24px_rgba(31,47,84,0.06)] transition hover:border-[#cfd6e5] hover:text-[#5362eb] disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button>
              <button type="button" onClick={exportDashboard} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#e5e9f2] bg-white px-4 text-[11px] font-semibold text-[#26334d] shadow-[0_8px_24px_rgba(31,47,84,0.06)] transition hover:border-[#cfd6e5] hover:text-[#5362eb]"><Download className="h-4 w-4" />{t.export}</button>
              <Link href={`/${locale}/inquiries/new`} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[linear-gradient(135deg,#6b64f5,#5368ff)] px-4 text-[11px] font-semibold text-white shadow-[0_10px_24px_rgba(83,98,235,0.24)] transition hover:brightness-105"><Plus className="h-4 w-4" />{t.newRequest}</Link>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Key performance indicators">
          {model.kpis.map((kpi, index) => <KpiCard key={kpi.label} kpi={kpi} featured={index === 0} />)}
        </section>

        <div className="mt-3 grid gap-3 xl:grid-cols-12">
          <DashboardCard className="xl:col-span-9" title={locale === "zh" ? "即時航線情報" : "Live route intelligence"} intro={locale === "zh" ? "點選航線查看需求、回應、交付表現及風險" : "Select a lane to inspect demand, responses, delivery performance and risk"} action={<Link href={`/${locale}/network-map`} className="text-[11px] font-semibold text-[#315ee8] transition hover:text-[#234ac3] hover:underline">{locale === "zh" ? "展開地圖" : "Open full map"}</Link>}>
            <div className="mt-4"><RouteIntelligenceMap locale={locale} selectedRouteId={selectedRoute.id} onRouteSelect={setSelectedRoute} /></div>
          </DashboardCard>

          <section className="overflow-hidden rounded-[8px] border border-[#e4e8ef] bg-white shadow-[0_12px_34px_rgba(31,47,84,0.065)] xl:col-span-3">
            <RouteDetailPanel locale={locale} route={selectedRoute} compact />
          </section>

          <DashboardCard className="xl:col-span-6" title={t.trendTitle} intro={t.trendIntro} action={<span className="rounded-[6px] bg-[#eef2ff] px-3 py-1.5 text-[10.5px] font-semibold text-[#5966e8]">{t.periods[period]}</span>}>
            <div className="mt-4 flex flex-wrap gap-5 text-[11px] font-medium text-[#748198]">
              <LegendDot color={palette.blue} label={t.pipeline} />
              <LegendDot color={palette.violet} label={t.awarded} />
              <LegendDot color={palette.cyan} label={t.completed} />
            </div>
            <div className="mt-3 h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={model.trend} margin={{ top: 12, right: 10, left: 0, bottom: 4 }}>
                  <CartesianGrid vertical={false} stroke="#e8ecf4" strokeDasharray="3 6" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#718096", fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#718096", fontSize: 11 }} tickFormatter={(value) => compactNumber(Number(value))} width={58} />
                  <Tooltip content={<TrendTooltip locale={locale} />} cursor={{ stroke: "#c8d0df", strokeDasharray: "4 4" }} />
                  <Line type="monotone" dataKey="pipeline" stroke={palette.blue} strokeWidth={2.8} dot={false} activeDot={{ r: 5, fill: palette.blue, stroke: "white", strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="awarded" stroke={palette.violet} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: palette.violet, stroke: "white", strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="completed" stroke={palette.cyan} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: palette.cyan, stroke: "white", strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>

          <DashboardCard className="xl:col-span-3" title={t.funnelTitle} intro={locale === "zh" ? "由合資格機會至完成訂單" : "From eligible opportunity to completed order"} action={<span className="text-[10.5px] font-medium text-[#8490a5]">{t.periods[period]}</span>}>
            <div className="mt-3 h-[252px]">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip content={<FunnelTooltip />} />
                  <Funnel dataKey="value" data={model.funnel} isAnimationActive={false}>
                    {model.funnel.map((item) => <Cell key={item.label} fill={item.color} />)}
                    <LabelList position="center" dataKey="value" fill="#ffffff" fontSize={12} fontWeight={700} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#edf0f5] pt-3">
              {model.funnel.map((item, index) => <div key={item.label} className="flex items-center justify-between gap-2 text-[10.5px]"><span className="truncate text-[#66748c]">{item.label}</span><strong className="text-[#26344e]">{index ? `${Math.round(item.value / Math.max(model.funnel[0].value, 1) * 100)}%` : "100%"}</strong></div>)}
            </div>
          </DashboardCard>

          <DashboardCard className="xl:col-span-3" title={t.valueTitle} intro={locale === "zh" ? "按已中標訂單金額" : "By awarded order value"}>
            <ValueDonut locale={locale} routes={model.routes} />
          </DashboardCard>

          <DashboardCard className="xl:col-span-4" title={t.deadlineTitle} intro={locale === "zh" ? "按緊急程度排序" : "Prioritised by urgency"} action={<Link href={`/${locale}/notifications`} className="text-[10.5px] font-semibold text-[#5966e8] hover:underline">{t.viewAll}</Link>}>
            <DeadlineList items={model.deadlines} />
          </DashboardCard>

          <DashboardCard className="xl:col-span-4" title={t.routesTitle} action={<span className="text-[10.5px] text-[#8490a5]">{locale === "zh" ? "按中標額" : "By awarded value"}</span>}>
            <RouteRanking locale={locale} routes={model.routes} />
          </DashboardCard>

          <DashboardCard className="xl:col-span-4" title={t.deliveryTitle} action={<span className="text-[10.5px] text-[#8490a5]">{locale === "zh" ? "本期間" : "This period"}</span>}>
            <PerformanceRows locale={locale} />
          </DashboardCard>

          <section className="overflow-hidden rounded-[8px] border border-[#e7ebf3] bg-white shadow-[0_10px_30px_rgba(31,47,84,0.06)] xl:col-span-12">
            <div className="flex items-center justify-between border-b border-[#edf0f5] px-5 py-4">
              <div><h2 className="text-[14px] font-semibold text-[#18233e]">{t.tableTitle}</h2><p className="mt-1 text-[11px] text-[#8793a7]">{locale === "zh" ? "可直接進入相關工作區處理" : "Open the related workspace to take action"}</p></div>
              <Link href={`/${locale}/orders`} className="text-[10.5px] font-semibold text-[#5966e8] hover:underline">{t.viewAll}</Link>
            </div>
            <ActiveOrdersTable locale={locale} orders={model.activeOrders} />
          </section>
        </div>
      </div>
    </main>
  )
}

function DashboardCard({ title, intro, action, className = "", children }: { title: string; intro?: string; action?: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`min-w-0 rounded-[8px] border border-[#e4e8ef] bg-white p-5 shadow-[0_12px_34px_rgba(31,47,84,0.065)] ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><h2 className="truncate text-[14px] font-semibold text-[#18233e]">{title}</h2>{intro ? <p className="mt-1 text-[11px] leading-5 text-[#7c899d]">{intro}</p> : null}</div>
        {action}
      </div>
      {children}
    </section>
  )
}

function KpiCard({ kpi, featured = false }: { kpi: Kpi; featured?: boolean }) {
  const DeltaIcon = kpi.positive ? TrendingUp : TrendingDown
  const data = kpi.series.map((value, index) => ({ index, value }))
  const gradientId = `kpi-${kpi.label.replace(/[^a-z0-9]/gi, "")}`
  return (
    <article className={`group min-w-0 rounded-[8px] border p-4 shadow-[0_10px_28px_rgba(31,47,84,0.055)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_15px_34px_rgba(31,47,84,0.09)] ${featured ? "border-[#123b46] bg-[linear-gradient(145deg,#12333c,#0c2534_60%,#153a46)]" : "border-[#e4e8ef] bg-white hover:border-[#d6dce8]"}`}>
      <div className="flex items-start gap-3">
        <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full ${featured ? "bg-white/10" : ""}`} style={{ color: featured ? "#5be0c9" : kpi.color, backgroundColor: featured ? undefined : kpi.soft }}><kpi.icon className="h-4 w-4" /></span>
        <div className="min-w-0"><p className={`truncate text-[10.5px] font-semibold ${featured ? "text-[#b9cbd0]" : "text-[#5e6b82]"}`}>{kpi.label}</p><p className={`mt-1.5 text-[24px] font-semibold leading-none tabular-nums ${featured ? "text-[#f3d087]" : "text-[#111a31]"}`}>{kpi.value}</p><span className={`mt-2 inline-flex items-center gap-1 text-[10px] font-semibold ${featured ? "text-[#5be0c9]" : kpi.positive ? "text-[#18a56a]" : "text-[#e25757]"}`}><DeltaIcon className="h-3.5 w-3.5" />{kpi.delta}</span></div>
      </div>
      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 1, left: 1, bottom: 0 }}>
            <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={kpi.color} stopOpacity={0.24} /><stop offset="100%" stopColor={kpi.color} stopOpacity={0} /></linearGradient></defs>
            <Area type="monotone" dataKey="value" stroke={kpi.color} strokeWidth={1.7} fill={`url(#${gradientId})`} dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  )
}

function PeriodControl({ locale, period, onChange }: { locale: Locale; period: Period; onChange: (period: Period) => void }) {
  return <select value={period} onChange={(event) => onChange(event.target.value as Period)} className="h-7 rounded-[6px] border border-[#e6eaf2] bg-white px-2 text-[9.5px] font-medium text-[#4d5b73] outline-none focus:border-[#7a83f4]">{(["30d", "90d", "6m"] as Period[]).map((item) => <option key={item} value={item}>{ui[locale].periods[item]}</option>)}</select>
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: color }} />{label}</span>
}

function RouteRanking({ locale, routes }: { locale: Locale; routes: RoutePoint[] }) {
  const rows = routes.length ? routes : sampleRoutes(locale)
  return <div className="mt-5 space-y-[18px]">{rows.slice(0, 5).map((route, index) => <div key={route.route} className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3"><span className="text-[10.5px] text-[#8d98a9]">{index + 1}</span><div className="min-w-0"><div className="flex items-center justify-between gap-2"><p className="truncate text-[11px] font-semibold text-[#26334d]">{route.route}</p><span className="text-[9.5px] font-semibold text-[#20a66a]">↑ {7 + index * 2}.3%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#eef1f6]"><div className="h-full rounded-full" style={{ width: `${Math.max(route.share, 8)}%`, backgroundColor: route.color }} /></div></div><span className="text-[10.5px] font-semibold tabular-nums text-[#35425a]">{formatHkd(route.value)}</span></div>)}</div>
}

function PerformanceRows({ locale }: { locale: Locale }) {
  const rows = locale === "zh" ? [["準時交付", 98.6], ["文件齊備", 97.1], ["準時更新狀態", 95.8], ["清關效率", 94.3], ["客戶確認", 93.7]] : [["On-time delivery", 98.6], ["Document readiness", 97.1], ["Status updates", 95.8], ["Customs efficiency", 94.3], ["Client confirmation", 93.7]]
  return <div className="mt-5 space-y-4">{rows.map(([label, value], index) => <div key={String(label)} className="grid grid-cols-[22px_minmax(0,1fr)_42px] items-center gap-3"><span className="grid h-5 w-5 place-items-center rounded-[5px] bg-[#eef3ff] text-[9px] font-bold text-[#5966e8]">{index + 1}</span><div><div className="flex items-center justify-between text-[11px] font-medium text-[#35425a]"><span>{label}</span></div><div className="mt-2 h-2 rounded-full bg-[#eef1f6]"><div className="h-full rounded-full bg-[#45bd78]" style={{ width: `${Number(value)}%` }} /></div></div><span className="text-right text-[10.5px] font-semibold text-[#27344d]">{value}%</span></div>)}</div>
}

function ValueDonut({ locale, routes }: { locale: Locale; routes: RoutePoint[] }) {
  const total = routes.reduce((sum, route) => sum + route.value, 0) || 2750000
  const data = [
    { name: locale === "zh" ? "空運" : "Air freight", value: 46, color: palette.blue },
    { name: locale === "zh" ? "海運" : "Sea freight", value: 28, color: palette.violet },
    { name: locale === "zh" ? "陸運" : "Road freight", value: 18, color: palette.cyan },
    { name: locale === "zh" ? "其他" : "Other", value: 8, color: palette.orange },
  ]
  return <div className="mt-4 grid grid-cols-[160px_minmax(0,1fr)] items-center gap-3"><div className="relative h-[180px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" innerRadius={50} outerRadius={73} paddingAngle={1} isAnimationActive={false}>{data.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-content-center text-center"><span className="text-[9px] text-[#8b96a9]">HKD</span><strong className="text-[17px] text-[#17223c]">{compactNumber(total)}</strong></div></div><div className="space-y-3.5">{data.map((item) => <div key={item.name} className="flex items-center justify-between gap-2 text-[10.5px]"><span className="inline-flex min-w-0 items-center gap-2 text-[#66748b]"><span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: item.color }} /><span className="truncate">{item.name}</span></span><strong className="text-[#27344d]">{item.value}%</strong></div>)}</div></div>
}

function DeadlineList({ items }: { items: DeadlineItem[] }) {
  return <div className="mt-4 divide-y divide-[#edf0f5]">{items.slice(0, 4).map((item) => <Link key={item.id} href={item.href} className="group flex min-h-14 items-center gap-3 py-3 transition hover:bg-[#fafbfe] first:pt-1"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-[6px] text-[9px] font-bold" style={{ color: item.tone, backgroundColor: `${item.tone}18` }}>{item.type}</span><span className="min-w-0 flex-1"><span className="block truncate text-[11px] font-semibold text-[#2a3750] group-hover:text-[#5966e8]">{item.title}</span><span className="mt-1 block truncate text-[9.5px] text-[#8d98aa]">{item.meta}</span></span><span className="flex-shrink-0 text-right text-[10px] font-semibold" style={{ color: item.tone }}>{item.value}</span></Link>)}</div>
}

function ActiveOrdersTable({ locale, orders }: { locale: Locale; orders: JsonRecord[] }) {
  const t = ui[locale]
  const rows = orders.length ? orders.slice(0, 5) : sampleOrders()
  return <div className="overflow-x-auto"><table className="w-full min-w-[960px] border-collapse text-left"><thead><tr className="border-b border-[#edf0f5] text-[10px] font-medium text-[#7b879a]"><th className="px-5 py-3.5">ID</th><th className="px-4 py-3.5">{t.route}</th><th className="px-4 py-3.5">{t.cargo}</th><th className="px-4 py-3.5">{t.deadline}</th><th className="px-4 py-3.5">{t.bids}</th><th className="px-4 py-3.5">{t.value}</th><th className="px-4 py-3.5">{t.status}</th><th className="px-4 py-3.5 text-right">{t.action}</th></tr></thead><tbody>{rows.map((order, index) => { const quotation = firstRecord(order.quotations); const request = firstRecord(quotation?.shipment_requests); return <tr key={order.id || index} className="border-b border-[#f0f2f6] text-[11px] text-[#39465d] transition hover:bg-[#f8f9ff]"><td className="px-5 py-4 font-semibold text-[#5362eb]">{shortId(order.id)}</td><td className="px-4 py-4 font-medium text-[#25324b]">{routeLabel(request?.route, locale)}</td><td className="px-4 py-4">{cargoLabel(request?.cargo_details)}</td><td className="px-4 py-4">{formatShortDate(request?.bid_deadline || order.created_at, locale)}</td><td className="px-4 py-4 tabular-nums">{request?.bid_count || 4 + index}</td><td className="px-4 py-4 font-semibold tabular-nums">{formatHkd(numberValue(quotation?.total_amount) || 248000 - index * 31000)}</td><td className="px-4 py-4"><span className="inline-flex items-center gap-1.5 text-[#1d9c62]"><span className="h-1.5 w-1.5 rounded-full bg-[#38b978]" />{statusLabel(String(order.status || "confirmed"), locale)}</span></td><td className="px-4 py-4 text-right"><Link href={`/${locale}/orders/${order.id}`} aria-label={`${locale === "zh" ? "查看" : "View"} ${shortId(order.id)}`} className="inline-flex h-8 min-w-8 items-center justify-center rounded-[6px] font-semibold text-[#5966e8] transition hover:bg-[#eef1ff]">•••</Link></td></tr> })}</tbody></table></div>
}

function TrendTooltip({ active, payload, label, locale }: { active?: boolean; payload?: Array<{ value?: number; dataKey?: string; color?: string }>; label?: string; locale: Locale }) {
  if (!active || !payload?.length) return null
  const labels: Record<string, string> = { pipeline: ui[locale].pipeline, awarded: ui[locale].awarded, completed: ui[locale].completed }
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
