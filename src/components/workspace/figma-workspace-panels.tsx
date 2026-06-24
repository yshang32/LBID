"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Activity, ArrowRight, BarChart2, CheckCircle2, Clock3, Loader2, MapPin, Radar, Route, WalletCards } from "lucide-react"

import { apiJson } from "@/lib/api-client"

type Locale = "zh" | "en"
type Request = { id: string; route?: { origin?: string; destination?: string }; cargo_details?: { cargo?: string; cargo_type?: string; mode?: string; weight_kg?: number; cbm?: number }; bid_deadline?: string; status?: string; created_at?: string }
type Bid = { id: string; sr_id: string; price?: number; currency?: string; transit_time?: string; submitted_at?: string }
type Workspace = { profile?: { service_routes?: string[]; service_types?: string[]; token_balance_free?: number; token_balance_paid?: number }; ownRequests?: Request[]; opportunities?: Request[]; orders?: { id: string; status: string; created_at?: string }[]; recommendations?: { match_score?: number }[] }

const text = {
  zh: { active: "已提交競價", activeIntro: "所有密封報價會在截止前保持保密。提交後不可修改。", empty: "目前沒有已提交的競價。", market: "查看接單機會", quote: "密封報價", submitted: "已提交", deadline: "截止時間", routes: "我的航線", routesIntro: "公司檔案中的服務航線，LBID 以此推薦合適需求。", noRoutes: "尚未設定航線。", profile: "前往公司檔案", analytics: "業務分析", analyticsIntro: "根據你的真實需求、競價與訂單資料整理。", requests: "發出需求", opportunities: "可競價需求", orders: "訂單", recommendations: "系統推薦", tokens: "可用 Token", noData: "完成首個需求或競價後，這裡會開始顯示趨勢。" },
  en: { active: "Active Bids", activeIntro: "Every submitted quote remains sealed until the window closes. A submitted quote cannot be edited.", empty: "You have no submitted bids yet.", market: "Browse opportunities", quote: "Sealed quote", submitted: "Submitted", deadline: "Bid deadline", routes: "My Routes", routesIntro: "Routes in your company profile are used to recommend relevant opportunities.", noRoutes: "No service routes have been added yet.", profile: "Open company profile", analytics: "Analytics", analyticsIntro: "A truthful view of your requests, bids and orders, drawn from your live workspace.", requests: "Requests", opportunities: "Open opportunities", orders: "Orders", recommendations: "Recommendations", tokens: "Available tokens", noData: "Complete a request or sealed bid and trends will begin to appear here." },
} as const

export function ActiveBidsPanel({ locale }: { locale: Locale }) {
  const t = text[locale]
  const [bids, setBids] = useState<Bid[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { let active = true; Promise.all([apiJson("/api/bids"), apiJson("/api/workspace")]).then(([bidResult, workspaceResult]) => { if (!active) return; setBids(bidResult.response.ok ? bidResult.body.bids || [] : []); const workspace = workspaceResult.body as Workspace; setRequests([...(workspace.opportunities || []), ...(workspace.ownRequests || [])]); setLoading(false) }).catch(() => active && setLoading(false)); return () => { active = false } }, [])
  const requestById = useMemo(() => new Map(requests.map((item) => [item.id, item])), [requests])
  return <WorkspacePage eyebrow="SEALED BIDDING" title={t.active} intro={t.activeIntro}>{loading ? <Loading /> : !bids.length ? <Empty label={t.empty} href={`/${locale}/marketplace`} action={t.market} /> : <div className="mt-7 grid gap-3">{bids.map((bid) => { const request = requestById.get(bid.sr_id); return <Link key={bid.id} href={`/${locale}/marketplace/${bid.sr_id}`} className="group grid gap-4 rounded-[14px] border border-[#dfe4ed] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#bdc7d8] hover:shadow-[0_10px_28px_rgba(12,26,62,.08)] sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"><span><span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#a17e22]"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />{t.submitted}</span><strong className="mt-2 block text-[17px] text-[#172038]">{routeName(request)}</strong><small className="mt-1 block text-[12px] text-[#7e8ba1]">{request?.cargo_details?.cargo || request?.cargo_details?.cargo_type || "General cargo"}</small></span><span className="rounded-xl bg-[#f4f6fa] px-4 py-3"><small className="block text-[10px] font-bold uppercase tracking-[.08em] text-[#8c98ac]">{t.quote}</small><strong className="mt-1 block text-[14px] text-[#172038]">{bid.currency || "HKD"} {Number(bid.price || 0).toLocaleString("en-HK")}</strong></span><span className="flex items-center gap-2 text-[12px] text-[#7e8ba1]"><Clock3 className="h-4 w-4" />{formatDate(request?.bid_deadline || bid.submitted_at)}<ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-0.5" /></span></Link> })}</div>}</WorkspacePage>
}

export function RoutesPanel({ locale }: { locale: Locale }) {
  const t = text[locale]
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  useEffect(() => { apiJson("/api/workspace").then(({ body }) => setWorkspace(body)).catch(() => setWorkspace({})) }, [])
  if (!workspace) return <WorkspacePage eyebrow="COMPANY COVERAGE" title={t.routes} intro={t.routesIntro}><Loading /></WorkspacePage>
  const routes = workspace.profile?.service_routes || []
  const services = workspace.profile?.service_types || []
  return <WorkspacePage eyebrow="COMPANY COVERAGE" title={t.routes} intro={t.routesIntro}>{!routes.length ? <Empty label={t.noRoutes} href={`/${locale}/profile`} action={t.profile} /> : <div className="mt-7 grid gap-3 md:grid-cols-2">{routes.map((item) => <article key={item} className="rounded-[14px] border border-[#dfe4ed] bg-white p-5 shadow-[0_1px_5px_rgba(0,0,0,.03)]"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#eef1f8] text-[#0c1a3e]"><Route className="h-5 w-5" /></span><h2 className="mt-4 text-[17px] font-semibold text-[#172038]">{item}</h2><p className="mt-2 text-[12px] leading-5 text-[#7e8ba1]">{services.length ? services.join(" · ") : "Service capability pending"}</p><span className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />Active coverage</span></article>)}</div>}</WorkspacePage>
}

export function AnalyticsPanel({ locale }: { locale: Locale }) {
  const t = text[locale]
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [bids, setBids] = useState<Bid[]>([])
  useEffect(() => { Promise.all([apiJson("/api/workspace"), apiJson("/api/bids")]).then(([workspaceResult, bidsResult]) => { setWorkspace(workspaceResult.body); setBids(bidsResult.response.ok ? bidsResult.body.bids || [] : []) }).catch(() => setWorkspace({})) }, [])
  if (!workspace) return <WorkspacePage eyebrow="BUSINESS SIGNALS" title={t.analytics} intro={t.analyticsIntro}><Loading /></WorkspacePage>
  const metrics = [{ label: t.requests, value: workspace.ownRequests?.length || 0, icon: MapPin }, { label: t.opportunities, value: workspace.opportunities?.length || 0, icon: Radar }, { label: t.orders, value: workspace.orders?.length || 0, icon: Activity }, { label: t.recommendations, value: workspace.recommendations?.length || 0, icon: BarChart2 }, { label: t.tokens, value: Number(workspace.profile?.token_balance_free || 0) + Number(workspace.profile?.token_balance_paid || 0), icon: WalletCards }, { label: t.active, value: bids.length, icon: CheckCircle2 }]
  const hasData = metrics.some((metric) => metric.value > 0)
  return <WorkspacePage eyebrow="BUSINESS SIGNALS" title={t.analytics} intro={t.analyticsIntro}><div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{metrics.map((metric) => <article key={metric.label} className="rounded-[14px] border border-[#dfe4ed] bg-white p-5"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f0f2f8] text-[#0c1a3e]"><metric.icon className="h-4 w-4" /></span><p className="mt-4 text-[10px] font-bold uppercase tracking-[.1em] text-[#8c98ac]">{metric.label}</p><strong className="mt-1 block text-[26px] leading-none tracking-[-.6px] text-[#172038]">{metric.value}</strong></article>)}</div>{!hasData ? <p className="mt-5 rounded-xl border border-dashed border-[#d3dae6] bg-white px-5 py-5 text-center text-[13px] text-[#7e8ba1]">{t.noData}</p> : null}</WorkspacePage>
}

function WorkspacePage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) { return <main className="mx-auto w-full max-w-[1280px] px-5 pb-16 pt-9 sm:px-8 lg:px-9"><section className="border-b border-[#dfe4ed] pb-7"><p className="text-[10.5px] font-bold uppercase tracking-[.13em] text-[#a17e22]">{eyebrow}</p><h1 className="mt-2 text-[30px] font-bold tracking-[-.7px] text-[#172038]">{title}</h1><p className="mt-2 max-w-2xl text-[14px] leading-6 text-[#7e8ba1]">{intro}</p></section>{children}</main> }
function Loading() { return <div className="mt-8 flex items-center gap-2 text-[13px] text-[#7e8ba1]"><Loader2 className="h-4 w-4 animate-spin" />Loading workspace data</div> }
function Empty({ label, href, action }: { label: string; href: string; action: string }) { return <section className="mt-7 rounded-[14px] border border-dashed border-[#d3dae6] bg-white px-5 py-12 text-center"><p className="text-[13px] text-[#7e8ba1]">{label}</p><Link href={href} className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0c1a3e] hover:underline">{action}<ArrowRight className="h-4 w-4" /></Link></section> }
function routeName(request?: Request) { return `${request?.route?.origin || "Origin"} → ${request?.route?.destination || "Hong Kong"}` }
function formatDate(value?: string) { return value ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "Time pending" }
