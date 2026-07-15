"use client"

import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  Bell,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coins,
  Crown,
  FileText,
  Inbox,
  Lock,
  Network,
  MessageSquare,
  Package,
  Plane,
  Send,
  Ship,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Truck,
  Upload,
} from "lucide-react"

import { motion } from "motion/react"

import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"

type JsonRecord = Record<string, any>

type LiveWorkspace = {
  profile?: JsonRecord | null
  role?: string | null
  ownRequests?: JsonRecord[]
  opportunities?: JsonRecord[]
  orders?: JsonRecord[]
  recommendations?: JsonRecord[]
  bidCountByRequest?: Record<string, number>
  documentTypesByOrder?: Record<string, string[]>
}

type LoadState = "loading" | "ready" | "error"

const orderPipeline = [
  "confirmed",
  "shipment_booked",
  "in_transit",
  "arrived_hk",
  "customs_cleared",
  "delivered",
  "completed",
]

export function LiveDashboard({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [workspace, setWorkspace] = useState<LiveWorkspace>({})
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState<"overview" | "client" | "forwarder">("overview")

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
    return () => {
      active = false
    }
  }, [])

  const requests = workspace.ownRequests || []
  const opportunities = workspace.opportunities || []
  const orders = workspace.orders || []
  const docsByOrder = workspace.documentTypesByOrder || {}
  const companyName = workspace.profile?.company_name_en || workspace.profile?.company_name_zh || "LBID company"
  const waitingReview = requests.filter((item) => item.status === "PENDING_REVIEW").length
  const quoteReady = requests.filter((item) => item.status === "CLOSED").length
  const missingDocs = orders.filter((order) => {
    const docs = docsByOrder[order.id] || []
    return !["awb", "invoice", "packing_list", "packing-list"].every((type) => docs.includes(type))
  }).length
  const nextOpportunity = [...opportunities].sort((a, b) => secondsLeft(a.bid_deadline) - secondsLeft(b.bid_deadline))[0]
  const priorityHref = nextOpportunity ? `/${locale}/marketplace/${nextOpportunity.id}` : quoteReady ? `/${locale}/quotations/compare` : `/${locale}/inquiries/new`
  const priorityTitle = nextOpportunity ? routeText(nextOpportunity.route) : quoteReady ? "Award your next logistics partner" : "Create your next shipment request"
  const todayLabel = new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-HK", { weekday: "long", day: "numeric", month: "long" }).format(new Date())
  const isZh = locale === "zh"
  const focusHref = viewMode === "client"
    ? `/${locale}/inquiries/new`
    : nextOpportunity
      ? `/${locale}/marketplace/${nextOpportunity.id}`
      : viewMode === "forwarder"
        ? `/${locale}/marketplace`
        : quoteReady
          ? `/${locale}/quotations/compare`
          : `/${locale}/inquiries/new`
  const focusTitle = viewMode === "client"
    ? (isZh ? "建立需求，讓合適嘅 Forwarder 回應" : "Create demand and let qualified forwarders respond")
    : nextOpportunity
      ? routeText(nextOpportunity.route)
      : viewMode === "forwarder"
        ? (isZh ? "配對網絡正在尋找下一個機會" : "Your matching network is scanning for the next opportunity")
        : quoteReady
          ? (isZh ? "有報價等待你作出決定" : "Quotations are ready for your decision")
          : (isZh ? "你嘅物流網絡已經準備好" : "Your logistics network is ready")

  return (
    <TodayDashboardView
      locale={locale}
      state={state}
      error={error}
      workspace={workspace}
      companyName={companyName}
      todayLabel={todayLabel}
      viewMode={viewMode}
      setViewMode={setViewMode}
      focusHref={focusHref}
      focusTitle={focusTitle}
      nextOpportunity={nextOpportunity}
      waitingReview={waitingReview}
      opportunities={opportunities}
      quoteReady={quoteReady}
      missingDocs={missingDocs}
      orders={orders}
    />
  )

  /* Legacy Today layout retained temporarily while the new live canvas is validated. */
  return (
    <section className="min-h-screen bg-[#f5f7fa] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div className="mx-auto max-w-[1380px]">
        <header className="flex flex-col gap-5 border-b border-[#dfe4ec] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#64748b]"><CalendarDays className="h-3.5 w-3.5" />{todayLabel}</div>
            <h1 className="mt-2 text-[30px] font-semibold leading-tight tracking-[-0.8px] text-[#0b1736] sm:text-[36px]">Good morning, {firstName(companyName)}.</h1>
            <p className="mt-2 text-[13px] text-[#64748b]">Here is what changed, what needs attention, and where to act next.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/${locale}/marketplace`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#cfd6e2] bg-white px-4 text-[12px] font-semibold text-[#26344f] transition hover:border-[#9aa7ba] hover:bg-[#f8fafc] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b2a64]"><Briefcase className="h-3.5 w-3.5" />Browse opportunities</Link>
            <Link href={`/${locale}/inquiries/new`} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0b2a64] px-4 text-[12px] font-semibold text-white shadow-[0_5px_14px_rgba(11,42,100,0.16)] transition hover:bg-[#10377d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0b2a64]"><Package className="h-3.5 w-3.5" />New request</Link>
          </div>
        </header>

        {state === "error" ? <div className="mt-6"><StatePanel tone="error" title="Workspace could not load" body={error} /></div> : null}

        <section aria-label="Company status" className="mt-6 grid grid-cols-2 overflow-hidden rounded-xl border border-[#dfe4ec] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)] [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(odd)]:border-r lg:grid-cols-4 lg:[&>*]:border-b-0 lg:[&>*]:border-r lg:[&>*:last-child]:border-r-0">
          <DashboardStat label="Waiting review" value={waitingReview} helper="Shipment requests" icon={FileText} tone="blue" />
          <DashboardStat label="Bid windows" value={opportunities.length} helper="Open now" icon={Clock3} tone="green" />
          <DashboardStat label="Award decisions" value={quoteReady} helper="Quotes ready" icon={Award} tone="gold" />
          <DashboardStat label="Document gaps" value={missingDocs} helper="Orders affected" icon={Upload} tone="red" />
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <section className="overflow-hidden rounded-xl border border-[#dfe4ec] bg-white shadow-[0_5px_22px_rgba(15,23,42,0.045)]">
            <div className="flex items-center justify-between border-b border-[#e5e9f0] px-5 py-4 sm:px-6">
              <div>
                <h2 className="text-[16px] font-semibold text-[#0b1736]">Priority queue</h2>
                <p className="mt-1 text-[12px] text-[#758196]">Ordered by deadline and business impact</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#16825d]"><span className="h-1.5 w-1.5 rounded-full bg-[#20a676]" />Live</span>
            </div>
            <div className="divide-y divide-[#edf0f4]">
              <DashboardActionRow href={priorityHref} icon={nextOpportunity ? Plane : quoteReady ? Award : Package} title={priorityTitle} meta={nextOpportunity ? `${cargoText(nextOpportunity.cargo_details)} · ${timeLeft(nextOpportunity.bid_deadline)}` : quoteReady ? "Compare valid bids and select a logistics partner" : "Publish demand and start a sealed bid window"} action={nextOpportunity ? "Review" : quoteReady ? "Compare" : "Create"} priority />
              <DashboardActionRow href={`/${locale}/requests`} icon={FileText} title={`${waitingReview} request${waitingReview === 1 ? "" : "s"} waiting for review`} meta="Track approval and publishing status" action="View requests" />
              <DashboardActionRow href={`/${locale}/quotations/compare`} icon={Award} title={`${quoteReady} award decision${quoteReady === 1 ? "" : "s"} pending`} meta="Lowest valid quote is highlighted; final choice remains yours" action="Review quotes" />
              <DashboardActionRow href={`/${locale}/orders`} icon={Truck} title={`${missingDocs} order${missingDocs === 1 ? "" : "s"} with document gaps`} meta="Complete AWB, invoice and packing list requirements" action="Open orders" />
            </div>
          </section>

          <aside className="overflow-hidden rounded-xl border border-[#19345f] bg-[#0b2148] text-white shadow-[0_10px_30px_rgba(11,33,72,0.14)]">
            <div className="border-b border-white/10 px-5 py-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e1bd64]">Bid window</p>
              <h2 className="mt-1 text-[16px] font-semibold">{nextOpportunity ? "Next matched opportunity" : "No active match right now"}</h2>
            </div>
            {nextOpportunity ? (
              <div className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/[0.07] px-2.5 py-1.5 font-mono text-[11px]"><Clock3 className="h-3 w-3 text-[#e1bd64]" />{timeLeft(nextOpportunity.bid_deadline)}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/45">Sealed</span>
                </div>
                <div className="mt-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div><p className="text-[9px] uppercase tracking-[0.1em] text-white/40">From</p><p className="mt-1 text-[16px] font-semibold">{nextOpportunity.route?.origin || "Pending"}</p></div>
                  <ArrowRight className="h-4 w-4 text-[#e1bd64]" />
                  <div className="text-right"><p className="text-[9px] uppercase tracking-[0.1em] text-white/40">To</p><p className="mt-1 text-[16px] font-semibold">{nextOpportunity.route?.destination || nextOpportunity.route?.dest || "Destination pending"}</p></div>
                </div>
                <p className="mt-6 border-t border-white/10 pt-4 text-[12px] leading-5 text-white/55">{cargoText(nextOpportunity.cargo_details)}</p>
                <Link href={priorityHref} className="mt-5 flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-[12px] font-semibold text-[#0b2148] transition hover:bg-[#f4e5bd]">Open opportunity <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            ) : (
              <div className="p-5">
                <div className="border-l-2 border-[#e1bd64] pl-4">
                  <p className="text-[13px] font-medium">Your matching queue is clear.</p>
                  <p className="mt-2 text-[12px] leading-5 text-white/55">LBID will surface a route here when it matches your certified coverage and capacity.</p>
                </div>
                <Link href={`/${locale}/profile`} className="mt-6 flex h-10 items-center justify-center gap-2 rounded-lg border border-white/15 text-[12px] font-semibold transition hover:border-white/30 hover:bg-white/[0.06]">Review matching profile <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            )}
          </aside>
        </div>

        <section className="mt-6 overflow-hidden rounded-xl border border-[#dfe4ec] bg-white">
          <div className="flex items-center justify-between border-b border-[#e5e9f0] px-5 py-4 sm:px-6">
            <div><h2 className="text-[16px] font-semibold text-[#0b1736]">Company activity</h2><p className="mt-1 text-[12px] text-[#758196]">Current records from your LBID workspace</p></div>
            <Link href={`/${locale}/notifications`} className="text-[11px] font-semibold text-[#0b2a64] hover:underline">View notifications</Link>
          </div>
          <div className="grid divide-y divide-[#edf0f4] md:grid-cols-3 md:divide-x md:divide-y-0">
            {activityItems(workspace).map((item) => (
              <div key={item.title} className="flex gap-3 px-5 py-4 sm:px-6">
                <item.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#53627a]" />
                <div><p className="text-[13px] font-medium text-[#17213a]">{item.title}</p><p className="mt-1 text-[11px] leading-5 text-[#758196]">{item.meta}</p></div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

function DashboardStat({ label, value, helper, icon: Icon, tone }: { label: string; value: number; helper: string; icon: typeof Plane; tone: "blue" | "green" | "gold" | "red" }) {
  const tones = {
    blue: "bg-[#edf3fb] text-[#285a9f]",
    green: "bg-[#edf8f3] text-[#16825d]",
    gold: "bg-[#fbf5e8] text-[#9a6b13]",
    red: "bg-[#fbefef] text-[#b54a4a]",
  }
  return (
    <div className="flex min-h-[96px] items-center gap-3 border-[#e5e9f0] px-4 py-3 sm:min-h-[104px] sm:gap-4 sm:px-5 sm:py-4">
      <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg ${tones[tone]}`}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-[#64748b]">{label}</p>
        <div className="mt-1 flex items-baseline gap-2"><span className="text-[23px] font-semibold leading-none tracking-[-0.4px] text-[#0b1736]">{value}</span><span className="truncate text-[10px] text-[#8a95a7]">{helper}</span></div>
      </div>
    </div>
  )
}

function DashboardActionRow({ href, icon: Icon, title, meta, action, priority = false }: { href: string; icon: typeof Plane; title: string; meta: string; action: string; priority?: boolean }) {
  return (
    <Link href={href} className={`group relative flex items-center gap-4 px-5 py-4 transition hover:bg-[#f8fafc] sm:px-6 ${priority ? "bg-[#fbfcfe]" : ""}`}>
      {priority ? <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-[#c49a3c]" /> : null}
      <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg ${priority ? "bg-[#0b2a64] text-white" : "bg-[#eef2f7] text-[#53627a] group-hover:text-[#0b2a64]"}`}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#17213a]">{title}</p>
        <p className="mt-1 truncate text-[11px] text-[#758196]">{meta}</p>
      </div>
      <span className="hidden flex-shrink-0 text-[11px] font-semibold text-[#0b2a64] sm:inline">{action}</span>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-[#9aa5b5] transition group-hover:translate-x-0.5 group-hover:text-[#0b2a64]" />
    </Link>
  )
}

type TodayViewMode = "overview" | "client" | "forwarder"

function TodayDashboardView({ locale, state, error, workspace, companyName, todayLabel, viewMode, setViewMode, focusHref, focusTitle, nextOpportunity, waitingReview, opportunities, quoteReady, missingDocs, orders }: {
  locale: Locale
  state: LoadState
  error: string
  workspace: LiveWorkspace
  companyName: string
  todayLabel: string
  viewMode: TodayViewMode
  setViewMode: (mode: TodayViewMode) => void
  focusHref: string
  focusTitle: string
  nextOpportunity?: JsonRecord
  waitingReview: number
  opportunities: JsonRecord[]
  quoteReady: number
  missingDocs: number
  orders: JsonRecord[]
}) {
  const isZh = locale === "zh"

  return (
    <section className="relative min-h-screen overflow-hidden bg-[#f7f8f6] px-5 py-7 sm:px-8 lg:px-10 lg:py-9">
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(115deg,transparent_0%,transparent_49.7%,rgba(24,115,84,0.05)_50%,transparent_50.3%)] [background-size:92px_92px]" />
      <div className="relative mx-auto max-w-[1420px]">
        <header className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#718078]">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#15946b] opacity-30" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#15946b]" /></span>
              {isZh ? "LBID 即時網絡" : "LBID live network"}<span className="text-[#b4bcb6]">/</span>{todayLabel}
            </div>
            <h1 className="mt-3 max-w-[760px] font-serif text-[38px] font-normal leading-[1.03] text-[#101a2d] sm:text-[50px]">
              {isZh ? `${firstName(companyName)}，今日先處理最重要嘅一件事。` : `Good morning, ${firstName(companyName)}. Start with what matters.`}
            </h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-6 text-[#66716b]">{isZh ? "LBID 將需求、配對、密封報價同交付狀態整合成一個即時工作面。" : "Demand, matching, sealed quotes and delivery status are now one live operating surface."}</p>
          </div>
          <div className="flex w-full max-w-[455px] rounded-md border border-[#d9dfda] bg-white p-1 shadow-[0_8px_24px_rgba(28,45,38,0.06)]" role="group" aria-label={isZh ? "工作視圖" : "Workspace view"}>
            {(["overview", "client", "forwarder"] as const).map((mode) => {
              const labels = { overview: isZh ? "公司總覽" : "Overview", client: isZh ? "發出需求" : "Send cargo", forwarder: isZh ? "承接生意" : "Win business" }
              return <button key={mode} type="button" aria-pressed={viewMode === mode} onClick={() => setViewMode(mode)} className={`h-9 flex-1 rounded-[3px] px-3 text-[11px] font-semibold transition ${viewMode === mode ? "bg-[#10254d] text-white shadow-sm" : "text-[#6b756f] hover:bg-[#f2f4f1] hover:text-[#10254d]"}`}>{labels[mode]}</button>
            })}
          </div>
        </header>

        {state === "error" ? <div className="mt-6"><StatePanel tone="error" title={isZh ? "無法載入公司工作台" : "Workspace could not load"} body={error} /></div> : null}

        <div className="mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.75fr)]">
          <LiveNetworkCanvas locale={locale} mode={viewMode} opportunity={nextOpportunity} title={focusTitle} href={focusHref} quoteReady={quoteReady} />
          <div className="grid gap-5">
            <section className="grid grid-cols-2 gap-3" aria-label={isZh ? "工作狀態" : "Work status"}>
              <PulseMetric label={isZh ? "等待審核" : "Waiting review"} value={waitingReview} helper={isZh ? "需求" : "requests"} icon={FileText} tone="mint" />
              <PulseMetric label={isZh ? "競價窗口" : "Bid windows"} value={opportunities.length} helper={isZh ? "進行中" : "open now"} icon={Clock3} tone="gold" />
              <PulseMetric label={isZh ? "待選報價" : "Award decisions"} value={quoteReady} helper={isZh ? "等待決定" : "quotes ready"} icon={Award} tone="blue" />
              <PulseMetric label={isZh ? "文件缺口" : "Document gaps"} value={missingDocs} helper={isZh ? "訂單" : "orders"} icon={Upload} tone="coral" />
            </section>
            <section className="overflow-hidden rounded-md bg-[#111a19] text-white shadow-[0_18px_45px_rgba(17,26,25,0.16)]">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7fd0af]">{isZh ? "今日流程" : "Today's flow"}</p><h2 className="mt-1 text-[18px] font-medium">{isZh ? "下一步，已經排好。" : "Your next moves, ordered."}</h2></div>
                <Activity className="h-4 w-4 text-white/40" />
              </div>
              <div className="divide-y divide-white/10">
                <FlowRow href={`/${locale}/requests`} label={isZh ? "需求審核" : "Request review"} value={waitingReview} active={waitingReview > 0} />
                <FlowRow href={`/${locale}/marketplace`} label={isZh ? "配對及競價" : "Match and bid"} value={opportunities.length} active={opportunities.length > 0} />
                <FlowRow href={`/${locale}/quotations/compare`} label={isZh ? "選擇合作夥伴" : "Select partner"} value={quoteReady} active={quoteReady > 0} />
                <FlowRow href={`/${locale}/orders`} label={isZh ? "交付及文件" : "Delivery and documents"} value={orders.length} active={orders.length > 0} />
              </div>
            </section>
          </div>
        </div>

        <section className="mt-5 grid overflow-hidden rounded-md border border-[#dce2dd] bg-white md:grid-cols-3 md:divide-x md:divide-[#e4e8e5]">
          {activityItems(workspace).map((item) => (
            <div key={item.title} className="flex gap-3 border-b border-[#e4e8e5] px-5 py-4 last:border-b-0 md:border-b-0">
              <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[#f0f4f1] text-[#416659]"><item.icon className="h-3.5 w-3.5" /></span>
              <div><p className="text-[12px] font-semibold text-[#17231f]">{item.title}</p><p className="mt-1 text-[11px] leading-5 text-[#7b8580]">{item.meta}</p></div>
            </div>
          ))}
        </section>
      </div>
    </section>
  )
}

function LiveNetworkCanvas({ locale, mode, opportunity, title, href, quoteReady }: { locale: Locale; mode: TodayViewMode; opportunity?: JsonRecord; title: string; href: string; quoteReady: number }) {
  const isZh = locale === "zh"
  const origin = opportunity?.route?.origin || (mode === "client" ? (isZh ? "你嘅需求" : "Your demand") : (isZh ? "配對來源" : "Match origin"))
  const destination = opportunity?.route?.destination || opportunity?.route?.dest || (isZh ? "目的地待定" : "Destination pending")
  const hasMatch = Boolean(opportunity)
  const cta = mode === "client" ? (isZh ? "建立 Shipment Request" : "Create shipment request") : hasMatch ? (isZh ? "查看推薦機會" : "Open matched opportunity") : quoteReady ? (isZh ? "比較密封報價" : "Compare sealed quotes") : mode === "overview" ? (isZh ? "建立第一個需求" : "Create your first request") : (isZh ? "瀏覽接單市場" : "Browse opportunities")

  return (
    <section className="group relative min-h-[460px] overflow-hidden rounded-md border border-[#cad7cf] bg-[#e8efeb] p-6 shadow-[0_22px_55px_rgba(36,65,51,0.11)] sm:p-8">
      <div aria-hidden className="absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(43,84,64,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(43,84,64,0.08)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div aria-hidden className="absolute -left-[5%] top-[38%] h-px w-[115%] rotate-[-7deg] bg-[#4fb58c]/45 shadow-[0_0_0_8px_rgba(79,181,140,0.025)]" />
      <div aria-hidden className="absolute -left-[8%] top-[55%] h-px w-[118%] rotate-[5deg] bg-[#c7a243]/45" />
      <div aria-hidden className="absolute left-[12%] top-[72%] h-px w-full rotate-[-2deg] bg-[#7398c9]/35" />
      <div className="relative flex h-full min-h-[400px] flex-col">
        <div className="flex items-start justify-between gap-5">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-[#b9c9c0] bg-white/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#386957]"><Network className="h-3 w-3" />{hasMatch ? (isZh ? "已找到配對" : "Match found") : (isZh ? "網絡掃描中" : "Network scanning")}</span><h2 className="mt-5 max-w-[700px] font-serif text-[31px] font-normal leading-[1.08] text-[#11221c] sm:text-[40px]">{title}</h2></div>
          <span className="hidden rounded-full border border-[#bcc9c1] bg-white/55 px-3 py-1.5 font-mono text-[10px] text-[#50645a] sm:inline-flex">{hasMatch ? timeLeft(opportunity?.bid_deadline) : "LIVE"}</span>
        </div>
        <div className="my-auto grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-8 sm:gap-7">
          <div><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#718078]">{isZh ? "來源" : "Origin"}</p><p className="mt-2 text-[18px] font-semibold text-[#13241e] sm:text-[24px]">{origin}</p></div>
          <div className="flex items-center gap-2 sm:gap-4"><span className="hidden h-px w-12 bg-[#789187] sm:block" /><span className="grid h-12 w-12 place-items-center rounded-full bg-[#10254d] text-white shadow-[0_8px_25px_rgba(16,37,77,0.25)] transition duration-300 group-hover:-translate-y-1 group-hover:rotate-3">{opportunity?.mode === "sea" ? <Ship className="h-5 w-5" /> : <Plane className="h-5 w-5" />}</span><span className="hidden h-px w-12 bg-[#789187] sm:block" /></div>
          <div className="text-right"><p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#718078]">{isZh ? "目的地" : "Destination"}</p><p className="mt-2 text-[18px] font-semibold text-[#13241e] sm:text-[24px]">{destination}</p></div>
        </div>
        <div className="grid gap-4 border-t border-[#bdcbc3] pt-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><div className="flex flex-wrap gap-x-5 gap-y-2 text-[10px] font-semibold text-[#4b6459]"><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#18835f]" />{isZh ? "密封及保密" : "Sealed and private"}</span><span className="inline-flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-[#a0771d]" />{hasMatch ? timeLeft(opportunity?.bid_deadline) : quoteReady ? `${quoteReady} ${isZh ? "份報價待選" : "awards pending"}` : (isZh ? "等待合適配對" : "Awaiting qualified match")}</span></div><p className="mt-3 max-w-2xl text-[12px] leading-5 text-[#637168]">{hasMatch ? cargoText(opportunity?.cargo_details) : isZh ? "系統會按照路線、能力、認證同過往表現推薦最相關嘅工作，唔會用假數據填滿畫面。" : "LBID ranks real work by route, capability, certification and track record instead of filling the screen with fake data."}</p></div>
          <Link href={href} className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-[#10254d] px-5 text-[12px] font-semibold text-white shadow-[0_8px_22px_rgba(16,37,77,0.2)] transition hover:-translate-y-0.5 hover:bg-[#173464] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10254d]">{cta}<ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </section>
  )
}

function PulseMetric({ label, value, helper, icon: Icon, tone }: { label: string; value: number; helper: string; icon: typeof Plane; tone: "mint" | "gold" | "blue" | "coral" }) {
  const tones = { mint: "bg-[#dff3e9] text-[#147451]", gold: "bg-[#f5eaca] text-[#936b0f]", blue: "bg-[#e2ebf6] text-[#315f94]", coral: "bg-[#f6e4df] text-[#a94f3d]" }
  return <div className="min-h-[125px] rounded-md border border-[#dde3de] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#c7d1ca] hover:shadow-[0_12px_28px_rgba(31,55,43,0.07)]"><div className={`grid h-8 w-8 place-items-center rounded-[4px] ${tones[tone]}`}><Icon className="h-3.5 w-3.5" /></div><div className="mt-4 flex items-end justify-between gap-2"><div><p className="text-[11px] font-semibold text-[#59655f]">{label}</p><p className="mt-1 text-[10px] text-[#9aa39e]">{helper}</p></div><span className="font-serif text-[30px] leading-none text-[#15231d]">{value}</span></div></div>
}

function FlowRow({ href, label, value, active }: { href: string; label: string; value: number; active: boolean }) {
  return <Link href={href} className="group flex items-center gap-3 px-5 py-3.5 transition hover:bg-white/[0.055]"><span className={`h-2 w-2 rounded-full ${active ? "bg-[#66c7a3] shadow-[0_0_0_4px_rgba(102,199,163,0.12)]" : "bg-white/20"}`} /><span className="flex-1 text-[12px] font-medium text-white/80">{label}</span><span className="font-mono text-[11px] text-white/45">{value}</span><ChevronRight className="h-3.5 w-3.5 text-white/30 transition group-hover:translate-x-0.5 group-hover:text-white/70" /></Link>
}

export function LiveMarketplace({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [workspace, setWorkspace] = useState<LiveWorkspace>({})
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"all" | "air" | "sea">("all")
  const [sort, setSort] = useState<"match" | "deadline">("match")

  useEffect(() => {
    let active = true
    apiJson("/api/workspace").then(({ response, body }) => {
      if (!active) return
      setWorkspace(response.ok ? body : {})
      setState(response.ok ? "ready" : "error")
    })
    return () => {
      active = false
    }
  }, [])

  const recommendations = workspace.recommendations || []
  const scoreBySr = new Map(recommendations.map((item) => [item.shipment_request_id, Number(item.match_score || 0)]))
  const opportunitySource = (workspace.opportunities || []) as JsonRecord[]
  const opportunities: JsonRecord[] = opportunitySource
    .map((item): JsonRecord => ({ ...item, matchScore: scoreBySr.get(item.id) || 72 }))
    .filter((item: JsonRecord) => {
      const cargo = item.cargo_details || {}
      const haystack = `${routeText(item.route)} ${cargoText(cargo)} ${item.id}`.toLowerCase()
      const modeOk = mode === "all" || String(cargo.mode || "").toLowerCase() === mode
      return modeOk && haystack.includes(query.toLowerCase())
    })
    .sort((a: JsonRecord, b: JsonRecord) => sort === "match" ? Number(b.matchScore || 0) - Number(a.matchScore || 0) : secondsLeft(a.bid_deadline) - secondsLeft(b.bid_deadline))

  return (
    <WorkspaceSurface eyebrow="Opportunities" title="Live marketplace for sealed bids." intro="These SRs come from Supabase. Recommended matches are ranked by your profile fit, then deadline.">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <Plane className="h-4 w-4 text-ink-3" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search route, SR ID, cargo..." className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-ink-3" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "air", "sea"] as const).map((value) => (
            <button key={value} onClick={() => setMode(value)} className={`rounded-xl border px-3.5 py-2 text-[12px] font-bold capitalize transition ${mode === value ? "border-navy bg-navy text-white" : "border-line bg-white text-ink-2 hover:border-navy/30 hover:bg-navy-soft"}`}>{value}</button>
          ))}
          {(["match", "deadline"] as const).map((value) => (
            <button key={value} onClick={() => setSort(value)} className={`rounded-xl border px-3.5 py-2 text-[12px] font-bold capitalize transition ${sort === value ? "border-gold bg-gold-soft text-gold-dark" : "border-line bg-white text-ink-2 hover:border-gold-border"}`}>{value}</button>
          ))}
        </div>
      </div>

      {state === "loading" ? <StatePanel title="Loading live opportunities" body="Reading open shipment requests from Supabase." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Marketplace could not load" body="Check Supabase connection and user session." /> : null}
      {state === "ready" && opportunities.length === 0 ? <StatePanel title="No live SR available" body="Once Admin publishes shipment requests, forwarders will see bid opportunities here." icon={Plane} /> : null}

      <div className="grid gap-3">
        {opportunities.map((item, index) => (
          <LiveOpportunityRow key={item.id} locale={locale} item={item} index={index} />
        ))}
      </div>
    </WorkspaceSurface>
  )
}

export function LiveQuoteConsole({ locale, id }: { locale: Locale; id?: string }) {
  const params = useParams()
  const router = useRouter()
  const srId = id || String(params.id || "")
  const [state, setState] = useState<LoadState>("loading")
  const [request, setRequest] = useState<JsonRecord | null>(null)
  const [quote, setQuote] = useState("")
  const [transit, setTransit] = useState("")
  const [terms, setTerms] = useState("")
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    apiJson(`/api/shipment-requests/${srId}`).then(({ response, body }) => {
      if (!active) return
      if (!response.ok) {
        setState("error")
        setError(body.error || "SR_LOAD_FAILED")
        return
      }
      setRequest(body.shipmentRequest)
      setState("ready")
    })
    return () => {
      active = false
    }
  }, [srId])

  async function submitBid() {
    if (!request || !quote || Number(quote) <= 0) return
    setSaving(true)
    setNotice("")
    setError("")
    const { response, body } = await apiJson("/api/bids", {
      method: "POST",
      body: JSON.stringify({
        sr_id: request.id,
        price: Number(quote),
        currency: "HKD",
        transit_time: transit || null,
        terms: terms || null,
      }),
    })
    setSaving(false)
    if (!response.ok) {
      setError(body.error || "BID_SUBMIT_FAILED")
      return
    }
    setNotice(`Sealed bid submitted. Token transaction recorded. Bid ID: ${body.bid_id || body.bid?.id || "created"}`)
  }

  const cargo = request?.cargo_details || {}
  const canSubmit = state === "ready" && quote && Number(quote) > 0 && !saving

  return (
    <WorkspaceSurface eyebrow="Quote Console" title={request ? routeText(request.route) : "Loading SR..."} intro="Submit one sealed quote. Competitors cannot see your price or identity during the bid window.">
      {state === "loading" ? <StatePanel title="Loading shipment request" body="Preparing route, cargo and bid deadline." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Shipment request not available" body={error} /> : null}
      {request ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-[22px] border border-line bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <RouteBlock route={request.route} cargo={cargo} />
                <Countdown deadline={request.bid_deadline} />
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <InfoTile label="Weight" value={`${cargo.weight_kg || "-"} kg`} />
                <InfoTile label="Volume" value={`${cargo.cbm || "-"} CBM`} />
                <InfoTile label="Mode" value={modeLabel(cargo.mode)} />
                <InfoTile label="Cargo" value={cargo.cargo || cargo.cargo_type || "General"} />
              </div>
              <div className="rounded-[16px] border border-gold-border bg-gold-soft p-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-gold-dark">Why this is recommended</p>
                <ul className="mt-3 space-y-2 text-[13px] text-gold">
                  <li className="flex gap-2"><BadgeCheck className="h-4 w-4 flex-shrink-0" /> Route/cargo details are structured and ready for sealed bidding.</li>
                  <li className="flex gap-2"><BadgeCheck className="h-4 w-4 flex-shrink-0" /> Quote submission calls `/api/bids` and uses `submit_bid_with_token` RPC.</li>
                  <li className="flex gap-2"><BadgeCheck className="h-4 w-4 flex-shrink-0" /> One token is deducted only when Supabase confirms the bid transaction.</li>
                </ul>
              </div>
            </div>
          </section>

          <aside className="rounded-[22px] border border-line bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">Your sealed quote</p>
            <label className="mt-5 block text-[12px] font-bold text-ink-2">Total quote</label>
            <div className="mt-2 flex items-center rounded-xl border-2 border-line bg-white px-4 focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]">
              <span className="text-[13px] font-bold text-ink-3">HKD</span>
              <input type="number" value={quote} onChange={(event) => setQuote(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-4 text-[24px] font-bold outline-none placeholder:text-line" placeholder="0.00" />
            </div>
            <label className="mt-4 block text-[12px] font-bold text-ink-2">Transit time</label>
            <input value={transit} onChange={(event) => setTransit(event.target.value)} className="mt-2 w-full rounded-xl border-2 border-line px-4 py-3 text-[13px] outline-none focus:border-navy" placeholder="e.g. 2 days" />
            <label className="mt-4 block text-[12px] font-bold text-ink-2">Terms</label>
            <textarea value={terms} onChange={(event) => setTerms(event.target.value)} className="mt-2 w-full resize-none rounded-xl border-2 border-line px-4 py-3 text-[13px] outline-none focus:border-navy" rows={3} placeholder="Payment terms, inclusions, handling notes" />
            {error ? <InlineNotice tone="error" text={error} /> : null}
            {notice ? <InlineNotice tone="success" text={notice} /> : null}
            <button onClick={submitBid} disabled={!canSubmit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3.5 text-[13.5px] font-bold text-white transition hover:-translate-y-px hover:bg-navy-hover disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? "Submitting..." : "Submit sealed quote"} <Lock className="h-4 w-4" />
            </button>
            <p className="mt-3 text-[11.5px] leading-5 text-ink-3">Quote is private until the window closes. Submission is binding upon acceptance.</p>
          </aside>
        </div>
      ) : null}
    </WorkspaceSurface>
  )
}

export function LiveQuoteComparison({ locale }: { locale: Locale }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workspace, setWorkspace] = useState<LiveWorkspace>({})
  const [request, setRequest] = useState<JsonRecord | null>(null)
  const [bids, setBids] = useState<JsonRecord[]>([])
  const [state, setState] = useState<LoadState>("loading")
  const [selected, setSelected] = useState<JsonRecord | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      setState("loading")
      const srParam = searchParams.get("sr_id")
      const workspaceResult = await apiJson("/api/workspace")
      if (!active) return
      const ws = workspaceResult.response.ok ? workspaceResult.body : {}
      setWorkspace(ws)
      const candidate = srParam
        ? { id: srParam }
        : (ws.ownRequests || []).find((item: JsonRecord) => item.status === "CLOSED") || (ws.ownRequests || [])[0]
      if (!candidate?.id) {
        setState("ready")
        return
      }
      const [requestResult, bidsResult] = await Promise.all([
        apiJson(`/api/shipment-requests/${candidate.id}`),
        apiJson(`/api/bids?sr_id=${candidate.id}`),
      ])
      if (!active) return
      if (requestResult.response.ok) setRequest(requestResult.body.shipmentRequest)
      setBids(bidsResult.response.ok ? bidsResult.body.bids || [] : [])
      setState("ready")
    }
    void load()
    return () => {
      active = false
    }
  }, [searchParams])

  const sortedBids = [...bids].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  const lowest = sortedBids[0]

  async function acceptBid() {
    if (!selected) return
    setAccepting(true)
    setError("")
    const { response, body } = await apiJson(`/api/bids/${selected.id}/accept`, {
      method: "POST",
      body: JSON.stringify({ totalAmount: selected.price }),
    })
    setAccepting(false)
    if (!response.ok) {
      setError(body.error || "ACCEPT_BID_FAILED")
      return
    }
    router.push(`/${locale}/orders/${body.order?.id || ""}`)
  }

  return (
    <WorkspaceSurface eyebrow="Bid Comparison" title={request ? routeText(request.route) : "Compare sealed bids"} intro="The system highlights the lowest valid quote, but Agency can still choose a better service fit.">
      {state === "loading" ? <StatePanel title="Loading bids" body="Reading shipment request and sealed quotes from Supabase." /> : null}
      {state === "ready" && !request ? <StatePanel title="No request ready for comparison" body="Create an SR and wait for the bidding window to close before comparing bids." /> : null}
      {request ? (
        <>
          <div className="rounded-[20px] border border-line bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">{request.id}</p>
                <h2 className="mt-1 text-[20px] font-bold text-ink">{routeText(request.route)}</h2>
                <p className="mt-1 text-[13px] text-ink-3">{cargoText(request.cargo_details)} · {sortedBids.length} bids received</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-2 text-[12px] font-semibold text-ink-2">
                <Lock className="h-3.5 w-3.5" /> Contact unlocks after award
              </span>
            </div>
          </div>

          {sortedBids.length === 0 ? <StatePanel title="No bids submitted yet" body="When the bid window closes, valid sealed bids will appear here." /> : null}
          <div className="grid gap-4">
            {sortedBids.map((bid) => (
              <button key={bid.id} onClick={() => setSelected(bid)} className={`w-full rounded-[20px] border bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-px ${bid.id === lowest?.id ? "border-emerald/40" : "border-line"} ${selected?.id === bid.id ? "ring-2 ring-navy/25" : ""}`}>
                {bid.id === lowest?.id ? <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald"><Award className="h-3.5 w-3.5" /> Lowest valid bid</div> : null}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[15px] font-bold text-ink">Forwarder {shortId(bid.forwarder_id)}</p>
                    <p className="mt-1 text-[13px] text-ink-3">Transit {bid.transit_time || "Pending"} · Submitted {formatDate(bid.submitted_at)}</p>
                    <p className="mt-3 max-w-2xl rounded-xl border border-line-light bg-canvas px-3 py-2 text-[12.5px] text-ink-2">{bid.terms || "No special terms supplied."}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">Total quote</p>
                    <p className={`mt-1 text-[28px] font-bold tracking-[-0.7px] ${bid.id === lowest?.id ? "text-emerald" : "text-ink"}`}>HKD {Number(bid.price || 0).toLocaleString()}</p>
                    {bid.id !== lowest?.id && lowest ? <p className="text-[12px] text-ink-3">+HKD {(Number(bid.price || 0) - Number(lowest.price || 0)).toLocaleString()} vs lowest</p> : null}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="sticky bottom-6 rounded-[18px] border border-line bg-white/95 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur">
              {error ? <InlineNotice tone="error" text={error} /> : null}
              {selected.id !== lowest?.id ? <InlineNotice tone="warning" text={`You selected a non-lowest bid. Price difference: HKD ${(Number(selected.price || 0) - Number(lowest?.price || 0)).toLocaleString()}.`} /> : null}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-ink-2">Selected bid: <strong className="text-ink">HKD {Number(selected.price || 0).toLocaleString()}</strong></p>
                <button onClick={acceptBid} disabled={accepting} className="rounded-xl bg-navy px-5 py-3 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-navy-hover disabled:opacity-50">{accepting ? "Accepting..." : "Accept selected bid"}</button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </WorkspaceSurface>
  )
}

export function LiveOrderWorkspace({ id }: { id?: string }) {
  const params = useParams()
  const orderId = id || String(params.id || "")
  const [state, setState] = useState<LoadState>("loading")
  const [order, setOrder] = useState<JsonRecord | null>(null)
  const [documents, setDocuments] = useState<JsonRecord[]>([])
  const [messages, setMessages] = useState<JsonRecord[]>([])
  const [tracking, setTracking] = useState<JsonRecord[]>([])
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  async function load() {
    setState("loading")
    const [orderResult, docsResult, messagesResult, trackingResult] = await Promise.all([
      apiJson(`/api/orders/${orderId}`),
      apiJson(`/api/orders/${orderId}/documents`),
      apiJson(`/api/orders/${orderId}/messages`),
      apiJson(`/api/orders/${orderId}/tracking`),
    ])
    if (!orderResult.response.ok) {
      setError(orderResult.body.error || "ORDER_LOAD_FAILED")
      setState("error")
      return
    }
    setOrder(orderResult.body.order)
    setDocuments(docsResult.response.ok ? docsResult.body.documents || [] : [])
    setMessages(messagesResult.response.ok ? messagesResult.body.messages || [] : [])
    setTracking(trackingResult.response.ok ? trackingResult.body.tracking || [] : [])
    setState("ready")
  }

  useEffect(() => {
    if (orderId) void load()
  }, [orderId])

  async function sendMessage() {
    if (!message.trim()) return
    const content = message.trim()
    setMessage("")
    const { response, body } = await apiJson(`/api/orders/${orderId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
    if (!response.ok) {
      setError(body.error || "MESSAGE_SEND_FAILED")
      return
    }
    setMessages((current) => [...current, body.message])
  }

  async function advanceStatus() {
    if (!order) return
    const current = orderPipeline.indexOf(order.status)
    const next = orderPipeline[Math.min(current + 1, orderPipeline.length - 1)]
    const { response, body } = await apiJson(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    })
    if (!response.ok) {
      setError(body.error || "ORDER_STATUS_UPDATE_FAILED")
      return
    }
    setOrder(body.order)
    setNotice(`Order advanced to ${next}.`)
  }

  const quotation = Array.isArray(order?.quotations) ? order?.quotations[0] : order?.quotations
  const shipmentRequest = Array.isArray(quotation?.shipment_requests) ? quotation?.shipment_requests[0] : quotation?.shipment_requests

  return (
    <WorkspaceSurface eyebrow="Order Workspace" title={order ? `Order ${order.id}` : "Loading order"} intro="Status, documents, messages and tracking are connected to live order APIs.">
      {state === "loading" ? <StatePanel title="Loading order workspace" body="Reading order, documents, messages and tracking events." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Order could not load" body={error} /> : null}
      {order ? (
        <div className="grid gap-6">
          <section className="rounded-[22px] border border-line bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full border border-emerald/20 bg-emerald-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald">{order.status}</span>
                <h2 className="mt-4 text-[24px] font-bold text-ink">{routeText(shipmentRequest?.route)}</h2>
                <p className="mt-2 text-[13px] text-ink-3">{cargoText(shipmentRequest?.cargo_details)} · HKD {Number(quotation?.total_amount || 0).toLocaleString()}</p>
              </div>
              <button onClick={advanceStatus} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-navy-hover">
                Advance status <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 grid gap-2 lg:grid-cols-7">
              {orderPipeline.map((status, index) => {
                const activeIndex = Math.max(orderPipeline.indexOf(order.status), 0)
                const complete = index <= activeIndex
                return (
                  <div key={status} className={`rounded-xl border p-3 text-center text-[11px] font-bold capitalize ${complete ? "border-emerald/25 bg-emerald-soft text-emerald" : "border-line bg-canvas text-ink-3"}`}>
                    {status.replace(/_/g, " ")}
                  </div>
                )
              })}
            </div>
          </section>

          {error ? <InlineNotice tone="error" text={error} /> : null}
          {notice ? <InlineNotice tone="success" text={notice} /> : null}

          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <section className="rounded-[22px] border border-line bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-ink">Documents</h2>
                <span className="text-[12px] text-ink-3">{documents.length} uploaded</span>
              </div>
              <div className="mt-4 grid gap-3">
                {["AWB", "B/L", "Commercial Invoice", "Packing List"].map((type) => {
                  const doc = documents.find((item) => normalizeDocType(item.type) === normalizeDocType(type))
                  return (
                    <div key={type} className="flex items-center justify-between rounded-[14px] border border-line bg-canvas/50 p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-navy" />
                        <div>
                          <p className="text-[13px] font-bold text-ink">{type}</p>
                          <p className="text-[12px] text-ink-3">{doc ? `Uploaded ${formatDate(doc.created_at)}` : "Missing"}</p>
                        </div>
                      </div>
                      {doc ? <CheckCircle2 className="h-5 w-5 text-emerald" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[22px] border border-line bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <h2 className="text-[15px] font-bold text-ink">Messages</h2>
              <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 ? <p className="rounded-xl border border-line bg-canvas p-4 text-[13px] text-ink-3">No messages yet.</p> : null}
                {messages.map((item) => (
                  <div key={item.id} className="rounded-[14px] border border-line bg-canvas/60 p-3">
                    <p className="text-[13px] text-ink">{item.content}</p>
                    <p className="mt-1 text-[11px] text-ink-3">{formatDate(item.created_at)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendMessage() }} className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 text-[13px] outline-none focus:border-navy" placeholder="Send an order message" />
                <button onClick={sendMessage} className="rounded-xl bg-navy px-4 text-white transition hover:bg-navy-hover"><Send className="h-4 w-4" /></button>
              </div>
            </section>
          </div>

          <section className="rounded-[22px] border border-line bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-[15px] font-bold text-ink">Tracking events</h2>
            <div className="mt-4 grid gap-3">
              {tracking.length === 0 ? <p className="rounded-xl border border-line bg-canvas p-4 text-[13px] text-ink-3">No tracking events yet.</p> : null}
              {tracking.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-[14px] border border-line bg-canvas/60 p-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-navy" />
                  <div>
                    <p className="text-[13px] font-bold text-ink">{item.status}</p>
                    <p className="text-[12px] text-ink-3">{item.description}</p>
                    <p className="mt-1 text-[11px] text-ink-3">{formatDate(item.occurred_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </WorkspaceSurface>
  )
}

function WorkspaceSurface({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#eef2f8] px-5 py-8 sm:px-8 lg:px-9">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-72" style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 100%)" }} />
      <div className="relative mx-auto flex max-w-[1320px] flex-col gap-6">
        <motion.header initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-border bg-gold-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-gold-dark">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            {eyebrow}
          </span>
          <h1 className="mt-4 max-w-4xl text-[32px] font-bold leading-[1.06] tracking-[-1px] text-ink sm:text-[44px]">{title}</h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-ink-3">{intro}</p>
        </motion.header>
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col gap-6">
          {children}
        </motion.div>
      </div>
    </main>
  )
}

function Metric({ label, value, helper, icon: Icon }: { label: string; value: number | string; helper: string; icon: typeof Plane }) {
  return (
    <div className="group rounded-[18px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-navy/15 hover:shadow-[0_14px_34px_rgba(15,23,42,0.09)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-soft text-navy transition-colors duration-200 group-hover:bg-navy group-hover:text-white"><Icon className="h-4 w-4" /></span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-ink-3">{label}</p>
          <p className="mt-0.5 text-[24px] font-bold tracking-[-0.4px] text-ink">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-ink-3">{helper}</p>
    </div>
  )
}

function TaskRow({ href, icon: Icon, title, meta }: { href: string; icon: typeof Plane; title: string; meta: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between gap-4 rounded-[16px] border border-line bg-canvas/50 p-4 transition hover:-translate-y-px hover:border-navy/20 hover:bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-navy group-hover:bg-navy group-hover:text-white"><Icon className="h-4 w-4" /></span>
        <div>
          <p className="text-[13.5px] font-bold text-ink">{title}</p>
          <p className="mt-0.5 text-[12px] text-ink-3">{meta}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-ink-3" />
    </Link>
  )
}

function LiveOpportunityRow({ locale, item, index }: { locale: Locale; item: JsonRecord; index: number }) {
  const cargo = item.cargo_details || {}
  const mode = String(cargo.mode || "").toLowerCase()
  const Icon = mode === "sea" ? Ship : Plane
  return (
    <Link href={`/${locale}/marketplace/${item.id}`} className="group rounded-[18px] border border-line bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-navy/20 hover:shadow-[0_14px_36px_rgba(15,23,42,0.09)]" style={{ animationDelay: `${index * 35}ms` }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-canvas text-navy group-hover:bg-navy group-hover:text-white"><Icon className="h-5 w-5" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-bold text-ink">{routeText(item.route)}</h2>
              {(item.matchScore || 0) >= 85 ? <span className="rounded-full border border-gold-border bg-gold-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gold-dark">Recommended</span> : null}
            </div>
            <p className="mt-1 text-[13px] text-ink-3">{cargoText(cargo)} · SR {item.id}</p>
            <p className="mt-2 text-[12px] text-ink-3">Services: {Array.isArray(item.services_needed) && item.services_needed.length ? item.services_needed.join(", ") : "Not specified"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <span className="rounded-xl border border-emerald/20 bg-emerald-soft px-3 py-2 text-[12px] font-bold text-emerald">{item.matchScore || 72}% match</span>
          <span className={`rounded-xl border px-3 py-2 text-[12px] font-bold ${secondsLeft(item.bid_deadline) < 3600 ? "border-red-200 bg-red-50 text-red-600" : "border-line bg-canvas text-ink-2"}`}>{timeLeft(item.bid_deadline)}</span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-[12px] font-bold text-white">Bid <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </Link>
  )
}

function RouteBlock({ route, cargo }: { route: JsonRecord; cargo: JsonRecord }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">Origin</p>
          <p className="mt-1 text-[24px] font-bold text-ink">{route?.origin || "Origin pending"}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-navy text-white shadow-[0_8px_20px_rgba(12,26,62,0.25)]"><Plane className="h-5 w-5" /></span>
        <div className="sm:text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">Destination</p>
          <p className="mt-1 text-[24px] font-bold text-ink">{route?.destination || route?.dest || "Destination pending"}</p>
        </div>
      </div>
      <p className="text-[13px] text-ink-3">{cargoText(cargo)}</p>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-canvas px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">{label}</p>
      <p className="mt-1 text-[14px] font-bold text-ink">{value}</p>
    </div>
  )
}

function Countdown({ deadline }: { deadline?: string }) {
  const left = secondsLeft(deadline)
  return (
    <div className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-4 py-3 ${left < 3600 ? "border-red-200 bg-red-50 text-red-600" : "border-line bg-canvas text-ink-2"}`}>
      <Clock3 className="h-4 w-4" />
      <span className="font-mono text-[14px] font-bold">{timeLeft(deadline)}</span>
    </div>
  )
}

function StatePanel({ title, body, tone = "neutral", icon: Icon }: { title: string; body: string; tone?: "neutral" | "error"; icon?: typeof Plane }) {
  const ResolvedIcon = Icon || (tone === "error" ? AlertTriangle : Sparkles)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={`relative overflow-hidden rounded-[18px] border p-6 ${tone === "error" ? "border-red-200 bg-red-50" : "border-line bg-white"}`}
      style={{ boxShadow: tone === "error" ? "0 10px 28px rgba(220,38,38,0.07)" : "0 10px 32px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.03)" }}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-[3px]" style={{ background: tone === "error" ? "#dc2626" : "linear-gradient(90deg, #0C1A3E 0%, #1E3A7A 55%, #C49A3C 100%)" }} />
      <div className="flex items-start gap-3.5">
        <span className={`grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl ${tone === "error" ? "bg-red-100 text-red-600" : "bg-navy-soft text-navy"}`}>
          <ResolvedIcon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <p className={`text-[14px] font-bold ${tone === "error" ? "text-red-700" : "text-ink"}`}>{title}</p>
          <p className={`mt-1 text-[13px] ${tone === "error" ? "text-red-600" : "text-ink-2"}`}>{body}</p>
        </div>
      </div>
    </motion.div>
  )
}

function InlineNotice({ text, tone }: { text: string; tone: "success" | "error" | "warning" }) {
  const classes = tone === "success" ? "border-emerald/20 bg-emerald-soft text-emerald" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"
  return <p className={`mt-3 rounded-xl border px-3 py-2 text-[12.5px] font-semibold ${classes}`}>{text}</p>
}

function routeText(route?: JsonRecord) {
  if (!route) return "Route pending"
  return `${route.origin || "Origin pending"} -> ${route.destination || route.dest || "Destination pending"}`
}

function cargoText(cargo?: JsonRecord) {
  if (!cargo) return "Cargo details pending"
  const parts = [
    cargo.cargo || cargo.cargo_type || "General cargo",
    cargo.weight_kg ? `${cargo.weight_kg} kg` : null,
    cargo.cbm ? `${cargo.cbm} CBM` : null,
    modeLabel(cargo.mode),
  ].filter(Boolean)
  return parts.join(" · ")
}

function modeLabel(mode?: string) {
  const value = String(mode || "").toLowerCase()
  if (value === "sea") return "Sea"
  if (value === "air") return "Air"
  return "Mode pending"
}

function secondsLeft(deadline?: string) {
  if (!deadline) return Number.MAX_SAFE_INTEGER
  return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
}

function timeLeft(deadline?: string) {
  const seconds = secondsLeft(deadline)
  if (seconds === Number.MAX_SAFE_INTEGER) return "No deadline"
  if (seconds <= 0) return "Closed"
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} min left`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m left`
  return `${Math.ceil(seconds / 86400)} days left`
}

function firstName(name: string) {
  return name.split(/\s+/)[0] || "there"
}

function shortId(id?: string) {
  if (!id) return "unknown"
  return id.slice(0, 8)
}

function formatDate(value?: string) {
  if (!value) return "Pending"
  return new Intl.DateTimeFormat("en-HK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function normalizeDocType(value?: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

function activityItems(workspace: LiveWorkspace) {
  const requests = workspace.ownRequests || []
  const opportunities = workspace.opportunities || []
  const orders = workspace.orders || []
  return [
    { icon: FileText, title: `${requests.length} shipment request(s)`, meta: "Client-side demand queue from Supabase." },
    { icon: Lock, title: `${opportunities.length} open sealed opportunity(ies)`, meta: "Forwarder bidding queue from live SR records." },
    { icon: Package, title: `${orders.length} order workspace(s)`, meta: "Awarded work ready for documents and messages." },
  ]
}

export function LiveOrders({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [orders, setOrders] = useState<JsonRecord[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    apiJson("/api/workspace").then(({ response, body }) => {
      if (!active) return
      if (!response.ok) {
        setError(body.error || "WORKSPACE_LOAD_FAILED")
        setState("error")
        return
      }
      setOrders(body.orders || [])
      setState("ready")
    })
    return () => {
      active = false
    }
  }, [])

  return (
    <WorkspaceSurface eyebrow="Orders" title="Order workspaces." intro="Awarded shipments, pulled live from Supabase — documents, messages and tracking live inside each one.">
      {state === "loading" ? <StatePanel title="Loading orders" body="Reading awarded orders from Supabase." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Orders could not load" body={error} /> : null}
      {state === "ready" && orders.length === 0 ? <StatePanel title="No orders yet" body="Once a sealed bid is accepted, the resulting order workspace will appear here." icon={Truck} /> : null}
      <div className="grid gap-3">
        {orders.map((order) => (
          <LiveOrderRow key={order.id} locale={locale} order={order} />
        ))}
      </div>
    </WorkspaceSurface>
  )
}

function LiveOrderRow({ locale, order }: { locale: Locale; order: JsonRecord }) {
  const quotation = Array.isArray(order.quotations) ? order.quotations[0] : order.quotations
  const shipmentRequest = Array.isArray(quotation?.shipment_requests) ? quotation?.shipment_requests[0] : quotation?.shipment_requests
  const forwarderRecord = Array.isArray(quotation?.forwarder) ? quotation?.forwarder[0] : quotation?.forwarder
  const forwarderName = forwarderRecord?.company_name || `Forwarder ${shortId(quotation?.forwarder_id)}`
  return (
    <Link href={`/${locale}/orders/${order.id}`} className="group flex items-center justify-between gap-4 rounded-[18px] border border-line bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-navy/20 hover:shadow-[0_14px_36px_rgba(15,23,42,0.09)]">
      <div className="flex min-w-0 items-center gap-4">
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-canvas text-navy group-hover:bg-navy group-hover:text-white"><Truck className="h-5 w-5" /></span>
        <div className="min-w-0">
          <p className="text-[15px] font-bold text-ink">{routeText(shipmentRequest?.route)}</p>
          <p className="mt-1 text-[13px] text-ink-3">{cargoText(shipmentRequest?.cargo_details)} · with {forwarderName}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-ink-3">Order {shortId(order.id)} · {formatDate(order.created_at)}</p>
        </div>
      </div>
      <div className="flex flex-shrink-0 items-center gap-3">
        <span className="rounded-xl border border-emerald/20 bg-emerald-soft px-3 py-2 text-[12px] font-bold capitalize text-emerald">{String(order.status || "").replace(/_/g, " ")}</span>
        <p className="text-[15px] font-bold text-ink">HKD {Number(quotation?.total_amount || 0).toLocaleString()}</p>
        <ArrowRight className="h-4 w-4 text-ink-3" />
      </div>
    </Link>
  )
}

export function LiveMyRequests({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [workspace, setWorkspace] = useState<LiveWorkspace>({})
  const [error, setError] = useState("")

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
    return () => {
      active = false
    }
  }, [])

  const requests = workspace.ownRequests || []
  const bidCounts = workspace.bidCountByRequest || {}

  return (
    <WorkspaceSurface eyebrow="My Requests" title="Your shipment requests." intro="Every SR you have created, pulled live from Supabase - from live sealed bidding through comparison and award.">
      {state === "loading" ? <StatePanel title="Loading requests" body="Reading your shipment requests from Supabase." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Requests could not load" body={error} /> : null}
      {state === "ready" && requests.length === 0 ? <StatePanel title="No shipment requests yet" body="Create your first SR to start receiving sealed bids from forwarders." icon={FileText} /> : null}
      <div className="grid gap-3">
        {requests.map((item) => (
          <Link key={item.id} href={`/${locale}/requests/${item.id}`} className="group flex items-center justify-between gap-4 rounded-[18px] border border-line bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-navy/20 hover:shadow-[0_14px_36px_rgba(15,23,42,0.09)]">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-canvas text-navy group-hover:bg-navy group-hover:text-white"><FileText className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">{routeText(item.route)}</p>
                <p className="mt-1 text-[13px] text-ink-3">{cargoText(item.cargo_details)}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-ink-3">SR {shortId(item.id)} · {formatDate(item.created_at)}</p>
              </div>
            </div>
            <div className="flex flex-shrink-0 items-center gap-3">
              {item.status === "CLOSED" ? <span className="rounded-xl border border-gold-border bg-gold-soft px-3 py-2 text-[12px] font-bold text-gold-dark">{bidCounts[item.id] || 0} bids received</span> : null}
              <span className={`rounded-xl border px-3 py-2 text-[12px] font-bold capitalize ${statusTone(item.status)}`}>{String(item.status || "").replace(/_/g, " ").toLowerCase()}</span>
              <ArrowRight className="h-4 w-4 text-ink-3" />
            </div>
          </Link>
        ))}
      </div>
    </WorkspaceSurface>
  )
}

export function LiveRequestDetail({ locale, id }: { locale: Locale; id?: string }) {
  const params = useParams()
  const srId = id || String(params.id || "")
  const [state, setState] = useState<LoadState>("loading")
  const [request, setRequest] = useState<JsonRecord | null>(null)
  const [bidCount, setBidCount] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      setState("loading")
      const { response, body } = await apiJson(`/api/shipment-requests/${srId}`)
      if (!active) return
      if (!response.ok) {
        setError(body.error || "SR_LOAD_FAILED")
        setState("error")
        return
      }
      setRequest(body.shipmentRequest)
      if (body.shipmentRequest?.status === "CLOSED" || body.shipmentRequest?.status === "AWARDED") {
        const bidsResult = await apiJson(`/api/bids?sr_id=${srId}`)
        if (active && bidsResult.response.ok) setBidCount((bidsResult.body.bids || []).length)
      }
      setState("ready")
    }
    if (srId) void load()
    return () => {
      active = false
    }
  }, [srId])

  const cargo = request?.cargo_details || {}

  return (
    <WorkspaceSurface eyebrow="Request Detail" title={request ? routeText(request.route) : "Loading request..."} intro="Live status for this shipment request, pulled directly from Supabase by SR id.">
      {state === "loading" ? <StatePanel title="Loading shipment request" body="Reading route, cargo and status." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Request could not load" body={error} /> : null}
      {request ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <section className="rounded-[22px] border border-line bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between gap-4">
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${statusTone(request.status)}`}>{String(request.status || "").replace(/_/g, " ")}</span>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">SR {shortId(request.id)}</p>
            </div>
            <RouteBlock route={request.route} cargo={cargo} />
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoTile label="Weight" value={`${cargo.weight_kg || "-"} kg`} />
              <InfoTile label="Volume" value={`${cargo.cbm || "-"} CBM`} />
              <InfoTile label="Mode" value={modeLabel(cargo.mode)} />
            </div>
            <p className="mt-4 text-[12.5px] text-ink-3">Services: {Array.isArray(request.services_needed) && request.services_needed.length ? request.services_needed.join(", ") : "Not specified"}</p>
            <p className="mt-1 text-[12.5px] text-ink-3">Created {formatDate(request.created_at)}</p>
          </section>
          <aside className="rounded-[22px] border border-line bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">What happens next</p>
            {request.status === "PENDING_REVIEW" ? <StatePanel title="Waiting for admin review" body="LBID admin must approve this SR before the sealed-bid window opens." /> : null}
            {request.status === "OPEN" ? <Countdown deadline={request.bid_deadline} /> : null}
            {request.status === "CLOSED" ? (
              <div className="mt-4">
                <p className="text-[13px] text-ink-2">{bidCount} sealed bid(s) received. Compare and award below.</p>
                <Link href={`/${locale}/quotations/compare?sr_id=${request.id}`} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-4 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-navy-hover">
                  Compare bids <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
            {request.status === "AWARDED" ? <StatePanel title="Awarded" body="This request has been awarded. Check Orders for the resulting order workspace." /> : null}
          </aside>
        </div>
      ) : null}
    </WorkspaceSurface>
  )
}

export function LiveActiveBids({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [rows, setRows] = useState<JsonRecord[]>([])
  const [tab, setTab] = useState<"all" | "active" | "closing" | "deciding" | "awarded">("all")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      setState("loading")
      const bidsResult = await apiJson("/api/bids")
      if (!active) return
      if (!bidsResult.response.ok) {
        setError(bidsResult.body.error || "BIDS_LOAD_FAILED")
        setState("error")
        return
      }
      const bids: JsonRecord[] = bidsResult.body.bids || []
      const uniqueSrIds = Array.from(new Set(bids.map((bid) => bid.sr_id))).slice(0, 60)
      const requestResults = await Promise.all(uniqueSrIds.map((srId) => apiJson(`/api/shipment-requests/${srId}`)))
      if (!active) return
      const requestById = new Map<string, JsonRecord>()
      requestResults.forEach((result, index) => {
        if (result.response.ok) requestById.set(uniqueSrIds[index], result.body.shipmentRequest)
      })
      const merged = bids.map((bid) => ({ ...bid, shipmentRequest: requestById.get(bid.sr_id) || null }))
      setRows(merged)
      setState("ready")
    }
    void load()
    return () => {
      active = false
    }
  }, [])

  const bucket = (row: JsonRecord) => {
    const status = row.shipmentRequest?.status
    if (status === "AWARDED") return "awarded"
    if (status === "CLOSED") return "deciding"
    if (status === "OPEN" && secondsLeft(row.shipmentRequest?.bid_deadline) < 3600) return "closing"
    if (status === "OPEN") return "active"
    return "active"
  }
  const counts = { active: 0, closing: 0, deciding: 0, awarded: 0 }
  rows.forEach((row) => {
    const key = bucket(row) as keyof typeof counts
    counts[key] = (counts[key] || 0) + 1
  })
  const filtered = tab === "all" ? rows : rows.filter((row) => bucket(row) === tab)

  return (
    <WorkspaceSurface eyebrow="Active Bids" title="Your sealed bids." intro="Every quote you have submitted as a forwarder, pulled live from Supabase — your price stays private until the bid window closes.">
      <div className="flex flex-wrap gap-2">
        {([
          ["all", `${rows.length} all`],
          ["active", `${counts.active} active`],
          ["closing", `${counts.closing} closing soon`],
          ["deciding", `${counts.deciding} awaiting decision`],
          ["awarded", `${counts.awarded} awarded`],
        ] as const).map(([value, label]) => (
          <button key={value} onClick={() => setTab(value)} className={`rounded-xl border px-3.5 py-2 text-[12px] font-bold transition ${tab === value ? "border-navy bg-navy text-white" : "border-line bg-white text-ink-2 hover:border-navy/30 hover:bg-navy-soft"}`}>{label}</button>
        ))}
      </div>
      {state === "loading" ? <StatePanel title="Loading your sealed bids" body="Reading bids and related shipment requests from Supabase." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Active bids could not load" body={error} /> : null}
      {state === "ready" && filtered.length === 0 ? <StatePanel title="No sealed bids here" body="Submit a quote from the marketplace to see it tracked here." icon={Briefcase} /> : null}
      <div className="grid gap-3">
        {filtered.map((row) => (
          <Link key={row.id} href={`/${locale}/marketplace/${row.sr_id}`} className="group flex items-center justify-between gap-4 rounded-[18px] border border-line bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-navy/20 hover:shadow-[0_14px_36px_rgba(15,23,42,0.09)]">
            <div className="flex min-w-0 items-center gap-4">
              <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-canvas text-navy group-hover:bg-navy group-hover:text-white"><Briefcase className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-ink">{row.shipmentRequest ? routeText(row.shipmentRequest.route) : "Shipment request"}</p>
                <p className="mt-1 text-[13px] text-ink-3">Your quote HKD {Number(row.price || 0).toLocaleString()} · Transit {row.transit_time || "Pending"}</p>
                <p className="mt-1 text-[11px] uppercase tracking-[0.08em] text-ink-3">Submitted {formatDate(row.submitted_at)}</p>
              </div>
            </div>
            <span className={`rounded-xl border px-3 py-2 text-[12px] font-bold capitalize ${statusTone(row.shipmentRequest?.status)}`}>{bucketLabel(bucket(row))}</span>
          </Link>
        ))}
      </div>
    </WorkspaceSurface>
  )
}

export function LiveTokenWallet({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [wallet, setWallet] = useState<JsonRecord | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    apiJson("/api/tokens").then(({ response, body }) => {
      if (!active) return
      if (!response.ok) {
        setError(body.error || "WALLET_LOAD_FAILED")
        setState("error")
        return
      }
      setWallet(body.wallet)
      setState("ready")
    })
    return () => {
      active = false
    }
  }, [])

  const transactions: JsonRecord[] = wallet?.transactions || []

  return (
    <WorkspaceSurface eyebrow="Token Wallet" title="Your token balance." intro="Free and paid token balances, plus every transaction, pulled live from Supabase.">
      {state === "loading" ? <StatePanel title="Loading wallet" body="Reading your token balance and ledger." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Wallet could not load" body={error} /> : null}
      {wallet ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Total tokens" value={wallet.total ?? 0} helper="Free + paid balance" icon={Coins} />
            <Metric label="Free tokens" value={wallet.free ?? 0} helper={wallet.freeTokenResetAt ? `Resets ${formatDate(wallet.freeTokenResetAt)}` : "Monthly allotment"} icon={Sparkles} />
            <Metric label="Paid tokens" value={wallet.paid ?? 0} helper="Purchased credits" icon={Award} />
          </div>
          <section className="rounded-[22px] border border-line bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <h2 className="text-[15px] font-bold text-ink">Transaction ledger</h2>
            <div className="mt-4 grid gap-2">
              {transactions.length === 0 ? <p className="rounded-xl border border-line bg-canvas p-4 text-[13px] text-ink-3">No token transactions yet.</p> : null}
              {transactions.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-[14px] border border-line-light bg-canvas/60 p-3">
                  <div>
                    <p className="text-[13px] font-bold capitalize text-ink">{String(item.type || "").replace(/_/g, " ")}</p>
                    <p className="mt-0.5 text-[12px] text-ink-3">{item.source || "system"} · {formatDate(item.created_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[14px] font-bold ${Number(item.amount || 0) < 0 ? "text-red-600" : "text-emerald"}`}>{Number(item.amount || 0) > 0 ? "+" : ""}{item.amount}</p>
                    <p className="text-[11px] text-ink-3">Balance {item.balance_after}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </WorkspaceSurface>
  )
}

export function LiveSubscription({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [subscription, setSubscription] = useState<JsonRecord | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    apiJson("/api/subscriptions").then(({ response, body }) => {
      if (!active) return
      if (!response.ok) {
        setError(body.error || "SUBSCRIPTION_LOAD_FAILED")
        setState("error")
        return
      }
      setSubscription(body.subscription)
      setState("ready")
    })
    return () => {
      active = false
    }
  }, [])

  const isTrialActive = subscription?.status === "trial" && subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()
  const isActive = subscription?.status === "active"

  return (
    <WorkspaceSurface eyebrow="Membership" title="Your plan." intro="Plan, status and renewal date, pulled live from Supabase — not a placeholder badge.">
      {state === "loading" ? <StatePanel title="Loading membership" body="Reading your subscription from Supabase." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Membership could not load" body={error} /> : null}
      {state === "ready" && !subscription ? <StatePanel title="No active subscription" body="You are on the free tier. Upgrade to unlock more monthly tokens and priority placement." icon={Crown} /> : null}
      {subscription ? (
        <section className="rounded-[22px] border border-line bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-soft text-navy"><Crown className="h-5 w-5" /></span>
              <div>
                <p className="text-[18px] font-bold capitalize text-ink">{subscription.plan || "Free"} plan</p>
                <p className="text-[12.5px] text-ink-3">Status: {isTrialActive ? "Trial active" : isActive ? "Active" : String(subscription.status || "inactive")}</p>
              </div>
            </div>
            {(isTrialActive || isActive) ? <span className="rounded-full border border-emerald/20 bg-emerald-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald">Live</span> : null}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {isTrialActive ? <InfoTile label="Trial ends" value={formatDate(subscription.trial_ends_at)} /> : null}
            {subscription.current_period_end ? <InfoTile label="Renews" value={formatDate(subscription.current_period_end)} /> : null}
            <InfoTile label="Member since" value={formatDate(subscription.created_at)} />
          </div>
        </section>
      ) : null}
    </WorkspaceSurface>
  )
}

export function LiveNotifications({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [notifications, setNotifications] = useState<JsonRecord[]>([])
  const [error, setError] = useState("")

  async function load() {
    setState("loading")
    const { response, body } = await apiJson("/api/notifications")
    if (!response.ok) {
      setError(body.error || "NOTIFICATIONS_LOAD_FAILED")
      setState("error")
      return
    }
    setNotifications(body.notifications || [])
    setState("ready")
  }

  useEffect(() => {
    void load()
  }, [])

  async function markRead(item: JsonRecord) {
    if (item.read_at) return
    setNotifications((current) => current.map((entry) => (entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry)))
    await apiJson("/api/notifications", { method: "PATCH", body: JSON.stringify({ id: item.id }) })
  }

  async function markAllRead() {
    setNotifications((current) => current.map((entry) => ({ ...entry, read_at: entry.read_at || new Date().toISOString() })))
    await apiJson("/api/notifications", { method: "PATCH", body: JSON.stringify({ all: true }) })
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length

  return (
    <WorkspaceSurface eyebrow="Notifications" title="Your notifications." intro="Every account event — SR review, new bids, awards, order updates — pulled live from Supabase.">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-3">{unreadCount} unread</p>
        {unreadCount > 0 ? <button onClick={markAllRead} className="rounded-xl border border-line bg-white px-3.5 py-2 text-[12px] font-bold text-ink-2 transition hover:border-navy/30 hover:bg-navy-soft">Mark all read</button> : null}
      </div>
      {state === "loading" ? <StatePanel title="Loading notifications" body="Reading your notifications from Supabase." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Notifications could not load" body={error} /> : null}
      {state === "ready" && notifications.length === 0 ? <StatePanel title="No notifications yet" body="Activity on your requests, bids and orders will show up here." icon={Bell} /> : null}
      <div className="grid gap-2">
        {notifications.map((item) => {
          const content = (
            <div className={`flex gap-3 rounded-[14px] border p-4 transition ${item.read_at ? "border-line-light bg-canvas/40" : "border-navy/15 bg-navy-soft/40"}`}>
              <Bell className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.read_at ? "text-ink-3" : "text-navy"}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13.5px] font-bold text-ink">{item.title}</p>
                  {!item.read_at ? <span className="h-2 w-2 flex-shrink-0 rounded-full bg-gold" /> : null}
                </div>
                <p className="mt-1 text-[12.5px] text-ink-3">{item.body}</p>
                <p className="mt-1 text-[11px] text-ink-3">{formatDate(item.created_at)}</p>
              </div>
            </div>
          )
          return item.href ? (
            <Link key={item.id} href={item.href} onClick={() => void markRead(item)}>{content}</Link>
          ) : (
            <button key={item.id} onClick={() => void markRead(item)} className="text-left">{content}</button>
          )
        })}
      </div>
    </WorkspaceSurface>
  )
}

function statusTone(status?: string) {
  const value = String(status || "").toUpperCase()
  if (value === "OPEN") return "border-emerald/20 bg-emerald-soft text-emerald"
  if (value === "CLOSED") return "border-gold-border bg-gold-soft text-gold-dark"
  if (value === "AWARDED") return "border-navy/20 bg-navy-soft text-navy"
  if (value === "PENDING_REVIEW") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-line bg-canvas text-ink-2"
}

function bucketLabel(bucket: string) {
  if (bucket === "active") return "Active"
  if (bucket === "closing") return "Closing soon"
  if (bucket === "deciding") return "Awaiting decision"
  if (bucket === "awarded") return "Awarded"
  return bucket
}
