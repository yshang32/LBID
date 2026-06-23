"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, Coins, FileWarning, Loader2, PackagePlus, Settings2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { statusLabel } from "@/lib/shipment-workflow"

type Locale = "zh" | "en"
type Request = { id: string; route?: { origin?: string; destination?: string }; cargo_details?: { cargo?: string; cargo_type?: string }; status: string }
type Order = { id: string; status: string; quotations?: { shipment_requests?: { route?: { origin?: string; destination?: string } } } }
type Recommendation = { id: string; shipment_request_id: string; match_score: number; reasons?: string[]; shipment_requests?: Request | Request[] | null }
type Action = { id: string; title: string; body: string; href: string; label: string; primary?: boolean }

const copy = {
  zh: {
    label: "公司工作台", title: "現在最需要處理的是甚麼？", intro: "系統會按需求、報價、訂單及文件狀態，將下一步工作放在最前。",
    loading: "正在整理你的工作台", signIn: "請先登入以查看公司工作台。", next: "下一步工作", create: "建立 Shipment Request", market: "查看接單市場", settings: "公司設定",
    requests: "我的需求", opportunities: "可投標需求", orders: "進行中訂單", wallet: "Token 餘額", noRequests: "尚未建立需求。", noOpportunities: "目前沒有可投標需求。", noOrders: "目前沒有進行中的訂單。", viewAll: "查看全部",
    client: "Client 能力", forwarder: "Forwarder 能力", review: "需求審核", accounts: "帳戶管理", payments: "付款審核",
    allClear: "暫時沒有需要立即處理的工作。",
    actions: {
      onboarding: ["完成公司設定", "先完成公司資料及啟用能力，才可以開始使用平台流程。", "前往設定"],
      pending: ["需求正在等待審核", "平台確認資料後，系統會自動開啟固定三小時的密封競價。", "查看需求"],
      open: ["密封競價進行中", "你的需求正在收集報價。截標後即可比較所有有效報價。", "查看進度"],
      closed: ["已有報價等待選擇", "競價已結束。現在可比較價格、時效及服務能力，再選擇合作方。", "比較報價"],
      opportunity: ["有新的投標機會", "查看公開的貨運需求摘要，並在限時內提交一次密封報價。", "查看需求"],
      documents: ["訂單文件尚未齊全", "請檢查 AWB/B/L、Commercial Invoice 及 Packing List。", "管理文件"],
    },
  },
  en: {
    label: "Company workspace", title: "What needs your attention now?", intro: "LBID brings the next action from your requests, quotations, orders and document checklist to the front.",
    loading: "Preparing your workspace", signIn: "Sign in to view your company workspace.", next: "Next actions", create: "Create shipment request", market: "Browse marketplace", settings: "Company settings",
    requests: "My requests", opportunities: "Bid opportunities", orders: "Active orders", wallet: "Token balance", noRequests: "No requests yet.", noOpportunities: "No bid opportunities right now.", noOrders: "No active orders yet.", viewAll: "View all",
    client: "Client capability", forwarder: "Forwarder capability", review: "Review queue", accounts: "Accounts", payments: "Payment review", allClear: "No actions need your attention right now.",
    actions: {
      onboarding: ["Complete company setup", "Finish company information and capabilities before starting live workflows.", "Complete setup"],
      pending: ["Request is awaiting review", "A fixed three-hour sealed bid window opens after platform approval.", "View request"],
      open: ["Sealed bidding is in progress", "Your request is collecting bids. Compare valid quotes when the window closes.", "View progress"],
      closed: ["Quotes are ready to compare", "The bid window has closed. Compare price, capability and transit time now.", "Compare quotes"],
      opportunity: ["A new bid opportunity is available", "Review the public request summary and submit one sealed bid.", "View request"],
      documents: ["Order documents need attention", "Check the AWB/B/L, Commercial Invoice and Packing List.", "Manage documents"],
    },
  },
}

export function LiveDashboardPanel({ locale, mode }: { locale: Locale; mode: "company" | "admin" }) {
  const t = copy[locale]
  const prefix = `/${locale}`
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    apiJson("/api/workspace").then(({ response, body }) => {
      if (cancelled) return
      if (!response.ok) setError(body.error || "WORKSPACE_UNAVAILABLE")
      else setData(body)
    })
    return () => { cancelled = true }
  }, [])

  if (mode === "admin") return <AdminWorkspace locale={locale} prefix={prefix} t={t} />
  if (!data && !error) return <main className="mx-auto flex min-h-[45vh] w-full max-w-6xl items-center px-4 text-sm text-slate-500 sm:px-6"><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.loading}</main>
  if (error) return <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"><p className="border border-dashed border-lblue/15 bg-white p-8 text-center text-sm text-slate-500">{error === "UNAUTHENTICATED" ? t.signIn : error}</p></main>

  const ownRequests = (data.ownRequests || []) as Request[]
  const opportunities = (data.opportunities || []) as Request[]
  const recommendations = (data.recommendations || []) as Recommendation[]
  const orders = (data.orders || []) as Order[]
  const actions = nextActions(data.profile, ownRequests, opportunities, recommendations, orders, data.bidCountByRequest || {}, data.documentTypesByOrder || {}, t, prefix)
  const tokens = Number(data.profile?.token_balance_free || 0) + Number(data.profile?.token_balance_paid || 0)

  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10">
    <section className="flex flex-col gap-5 border-b border-lblue/10 pb-7 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a17e22]">{t.label}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title}</h1><p className="mt-3 leading-7 text-slate-600">{t.intro}</p></div><div className="flex flex-wrap gap-2"><Button asChild><Link href={`${prefix}/inquiries/new`}><PackagePlus className="h-4 w-4" />{t.create}</Link></Button><Button asChild variant="outline"><Link href={`${prefix}/marketplace`}><BriefcaseBusiness className="h-4 w-4" />{t.market}</Link></Button><Button asChild variant="ghost"><Link href={`${prefix}/profile`}><Settings2 className="h-4 w-4" />{t.settings}</Link></Button></div></section>
    <section className="mt-6"><div className="mb-3 flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-lgold" /><h2 className="font-semibold text-lblue">{t.next}</h2></div>{actions.length ? <div className="grid gap-3 lg:grid-cols-2">{actions.map((item) => <Card key={item.id} className={item.primary ? "border-lgold/35 bg-[#fcf8ec]" : "bg-white"}><CardContent className="flex gap-4 p-5"><div className="mt-0.5"><FileWarning className="h-5 w-5 text-lgold" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold text-lblue">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p><Button asChild className="mt-4" size="sm" variant={item.primary ? "gold" : "outline"}><Link href={item.href}>{item.label}<ArrowRight className="h-4 w-4" /></Link></Button></div></CardContent></Card>)}</div> : <Card><CardContent className="p-6 text-sm text-slate-600">{t.allClear}</CardContent></Card>}</section>
    {recommendations.length ? <section className="bid-recommended-next mt-6"><div className="flex items-start gap-3"><div className="bid-recommended-score">{recommendations[0].match_score}%</div><div><p className="text-xs font-bold tracking-[.12em] text-[#a17e22]">PROFILE MATCH</p><h2 className="mt-1 text-lg font-semibold text-lblue">{locale === "zh" ? "\u7cfb\u7d71\u63a8\u85a6\u7684\u4efb\u52d9\u6b63\u7b49\u4f60\u8655\u7406" : "A recommended mission is waiting for you"}</h2><p className="mt-1 text-sm text-slate-600">{recommendations[0].reasons?.[0] || "Company profile matched"}</p><Button asChild className="mt-3" size="sm" variant="gold"><Link href={`${prefix}/marketplace/${recommendations[0].shipment_request_id}`}>{locale === "zh" ? "\u67e5\u770b\u63a8\u85a6" : "View recommendation"}<ArrowRight className="h-4 w-4" /></Link></Button></div></div></section> : null}
    <section className="mt-6 grid gap-3 sm:grid-cols-3"><Metric icon={<PackagePlus className="h-4 w-4" />} label={t.requests} value={ownRequests.length} /><Metric icon={<BriefcaseBusiness className="h-4 w-4" />} label={t.opportunities} value={opportunities.length} /><Metric icon={<Coins className="h-4 w-4" />} label={t.wallet} value={tokens} /></section>
    <section className="mt-7 grid gap-5 lg:grid-cols-3"><WorkflowList t={t} title={t.requests} empty={t.noRequests} href={`${prefix}/requests`} rows={ownRequests.slice(0, 3).map((item) => ({ id: item.id, title: route(item, locale), detail: statusLabel(item.status, locale), href: `${prefix}/requests/${item.id}`, badge: item.status }))} /><WorkflowList t={t} title={t.opportunities} empty={t.noOpportunities} href={`${prefix}/marketplace`} rows={opportunities.slice(0, 3).map((item) => ({ id: item.id, title: route(item, locale), detail: item.cargo_details?.cargo || item.cargo_details?.cargo_type || "-", href: `${prefix}/marketplace/${item.id}`, badge: statusLabel(item.status, locale) }))} /><WorkflowList t={t} title={t.orders} empty={t.noOrders} href={`${prefix}/orders`} rows={orders.slice(0, 3).map((item) => ({ id: item.id, title: route(item.quotations?.shipment_requests || {}, locale), detail: item.status, href: `${prefix}/orders/${item.id}`, badge: item.status }))} /></section>
    <div className="mt-6 flex flex-wrap gap-2"><Badge variant={data.profile?.can_be_client ? "teal" : "secondary"}>{t.client}</Badge><Badge variant={data.profile?.can_be_forwarder ? "teal" : "secondary"}>{t.forwarder}</Badge></div>
  </main>
}

function nextActions(profile: any, ownRequests: Request[], opportunities: Request[], recommendations: Recommendation[], orders: Order[], bidCounts: Record<string, number>, documents: Record<string, string[]>, t: typeof copy.zh, prefix: string) {
  const actions: Action[] = []
  const add = (id: string, values: string[], href: string, primary = false) => actions.push({ id, title: values[0], body: values[1], label: values[2], href, primary })
  if (!profile?.onboarding_completed) add("onboarding", t.actions.onboarding, `${prefix}/onboarding`, true)
  const pending = ownRequests.find((item) => item.status === "PENDING_REVIEW")
  if (pending) add(`pending-${pending.id}`, t.actions.pending, `${prefix}/requests/${pending.id}`)
  const open = ownRequests.find((item) => item.status === "OPEN")
  if (open) add(`open-${open.id}`, t.actions.open, `${prefix}/requests/${open.id}`)
  const closed = ownRequests.find((item) => item.status === "CLOSED" && Number(bidCounts[item.id] || 0) > 0)
  if (closed) add(`closed-${closed.id}`, t.actions.closed, `${prefix}/quotations/compare?srId=${closed.id}`, true)
  const recommended = recommendations[0]
  if (recommended) add(`recommended-${recommended.id}`, ["\u7cfb\u7d71\u63a8\u85a6\u7af6\u50f9", "LBID \u5df2\u6839\u64da\u516c\u53f8\u6a94\u6848\u63a8\u9001\u9ad8\u914d\u5c0d\u4efb\u52d9\u3002", "\u67e5\u770b\u63a8\u85a6"], `${prefix}/marketplace/${recommended.shipment_request_id}`, true)
  if (opportunities[0]) add(`opportunity-${opportunities[0].id}`, t.actions.opportunity, `${prefix}/marketplace/${opportunities[0].id}`)
  const missing = orders.find((order) => { const uploaded = (documents[order.id] || []).join(" ").toLowerCase(); return !/(awb|b\/l)/.test(uploaded) || !uploaded.includes("invoice") || !uploaded.includes("packing") })
  if (missing) add(`documents-${missing.id}`, t.actions.documents, `${prefix}/orders/${missing.id}/documents`)
  return actions.slice(0, 4)
}

function route(item: { route?: { origin?: string; destination?: string } }, locale: Locale) { return `${item.route?.origin || (locale === "zh" ? "出發地待定" : "Origin pending")} ${locale === "zh" ? "至" : "to"} ${item.route?.destination || "Hong Kong"}` }
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) { return <Card><CardContent className="p-4"><div className="text-lblue">{icon}</div><p className="mt-3 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-lblue">{value}</p></CardContent></Card> }
function WorkflowList({ t, title, empty, href, rows }: { t: typeof copy.zh; title: string; empty: string; href: string; rows: { id: string; title: string; detail: string; href: string; badge: string }[] }) { return <Card><CardContent className="p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-lblue">{title}</h2><Link className="text-xs font-semibold text-[#8b6d1d] hover:text-lblue" href={href}>{t.viewAll}</Link></div>{rows.length ? <div className="mt-4 divide-y divide-slate-100">{rows.map((row) => <Link key={row.id} href={row.href} className="block py-3 first:pt-0 last:pb-0"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-lblue">{row.title}</p><p className="mt-1 truncate text-xs text-slate-500">{row.detail}</p></div><Badge variant="secondary">{row.badge}</Badge></div></Link>)}</div> : <p className="mt-5 min-h-14 text-sm leading-6 text-slate-500">{empty}</p>}</CardContent></Card> }
function AdminWorkspace({ locale, prefix, t }: { locale: Locale; prefix: string; t: typeof copy.zh }) { const title = locale === "zh" ? "平台營運工作台" : "Platform operations"; const intro = locale === "zh" ? "集中處理需求審核、帳戶能力及真實付款確認。" : "Review requests, account capabilities and real payment confirmations."; return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="border-b border-lblue/10 pb-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a17e22]">LBID ADMIN</p><h1 className="mt-2 text-3xl font-semibold text-lblue">{title}</h1><p className="mt-2 text-slate-600">{intro}</p><div className="mt-5 flex flex-wrap gap-2"><Button asChild><Link href={`${prefix}/admin/shipment-requests`}>{t.review}</Link></Button><Button asChild variant="outline"><Link href={`${prefix}/admin/accounts`}>{t.accounts}</Link></Button><Button asChild variant="outline"><Link href={`${prefix}/admin/pending-payments`}>{t.payments}</Link></Button></div></section></main> }
