"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { ArrowRight, BriefcaseBusiness, CheckCircle2, CircleDot, ClipboardCheck, Clock3, Coins, FileWarning, Loader2, LockKeyhole, PackagePlus, Settings2, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { apiJson } from "@/lib/api-client"
import { statusLabel } from "@/lib/shipment-workflow"

type Locale = "zh" | "en"
type Request = { id: string; route?: { origin?: string; destination?: string }; cargo_details?: { cargo?: string; cargo_type?: string; weight?: string; volume?: string; mode?: string }; status: string }
type Order = { id: string; status: string; quotations?: { shipment_requests?: { route?: { origin?: string; destination?: string } } } }
type Recommendation = { id: string; shipment_request_id: string; match_score: number; reasons?: string[]; shipment_requests?: Request | Request[] | null }
type Action = { id: string; title: string; body: string; href: string; label: string; primary?: boolean }

const copy = {
  zh: {
    label: "公司工作台", greeting: "今日最值得你處理的機會。", intro: "LBID 會把最符合公司能力的需求放在前面，讓你先看見下一步。", loading: "正在準備你的工作台", signIn: "請先登入以查看公司工作台。", next: "接下來要做甚麼", create: "建立 Shipment Request", market: "瀏覽接單市場", settings: "公司設定", requests: "我的需求", opportunities: "可投標機會", orders: "進行中訂單", wallet: "Token 餘額", noRequests: "尚未建立需求。", noOpportunities: "目前沒有可投標需求。", noOrders: "目前沒有進行中訂單。", viewAll: "查看全部", client: "Client 能力", forwarder: "Forwarder 能力", review: "需求審核", accounts: "帳戶管理", payments: "付款審核", allClear: "目前沒有需要立即處理的事項。", recommended: "系統為你推薦", open: "可密封出價", match: "配對度", why: "為甚麼推薦給你", private: "報價在截標前保持密封，其他 Forwarder 不會看到你的價錢或條款。", actions: {
      onboarding: ["完成公司設定", "先補齊公司資料與服務能力，才可開始真實流程。", "完成設定"], pending: ["需求正等待平台審核", "通過審核後，系統會開啟固定三小時的密封競價窗口。", "查看需求"], open: ["密封競價正在進行", "你的需求正收集報價，截標後可比較有效報價。", "查看進度"], closed: ["報價已可比較", "競價窗口已關閉，現在可按價格、能力及時效選擇合作方。", "比較報價"], opportunity: ["有新的投標機會", "查看公開需求摘要，並在限時內提交一次密封報價。", "查看需求"], documents: ["訂單文件需要處理", "請檢查 AWB/B/L、Commercial Invoice 及 Packing List。", "管理文件"],
    },
  },
  en: {
    label: "Company workspace", greeting: "One opportunity worth your attention.", intro: "LBID brings the work that best fits your company to the front, so the next move is always clear.", loading: "Preparing your workspace", signIn: "Sign in to view your company workspace.", next: "What needs your attention", create: "Create shipment request", market: "Browse marketplace", settings: "Company settings", requests: "My requests", opportunities: "Bid opportunities", orders: "Active orders", wallet: "Token balance", noRequests: "No requests yet.", noOpportunities: "No bid opportunities right now.", noOrders: "No active orders yet.", viewAll: "View all", client: "Client capability", forwarder: "Forwarder capability", review: "Review requests", accounts: "Accounts", payments: "Payment review", allClear: "No actions need your attention right now.", recommended: "Recommended for you", open: "Open for sealed bid", match: "Profile match", why: "Why you were selected", private: "Your quote remains sealed until the bid window closes. Other forwarders cannot see your price or terms.", actions: {
      onboarding: ["Complete company setup", "Finish company information and capabilities before starting live workflows.", "Complete setup"], pending: ["Request is awaiting review", "A fixed three-hour sealed bid window opens after platform approval.", "View request"], open: ["Sealed bidding is in progress", "Your request is collecting bids. Compare valid quotes when the window closes.", "View progress"], closed: ["Quotes are ready to compare", "The bid window has closed. Compare price, capability and transit time now.", "Compare quotes"], opportunity: ["A new bid opportunity is available", "Review the public request summary and submit one sealed bid.", "View request"], documents: ["Order documents need attention", "Check the AWB/B/L, Commercial Invoice and Packing List.", "Manage documents"],
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
  if (!data && !error) return <main className="mx-auto flex min-h-[45vh] w-full max-w-6xl items-center px-4 text-sm text-ink-3 sm:px-6"><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t.loading}</main>
  if (error) return <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6"><p className="rounded-lg border border-dashed border-lblue/15 bg-white p-8 text-center text-sm text-ink-3">{error === "UNAUTHENTICATED" ? t.signIn : error}</p></main>

  const ownRequests = (data.ownRequests || []) as Request[]
  const opportunities = (data.opportunities || []) as Request[]
  const recommendations = (data.recommendations || []) as Recommendation[]
  const orders = (data.orders || []) as Order[]
  const actions = nextActions(data.profile, ownRequests, opportunities, recommendations, orders, data.bidCountByRequest || {}, data.documentTypesByOrder || {}, t, prefix)
  const tokens = Number(data.profile?.token_balance_free || 0) + Number(data.profile?.token_balance_paid || 0)
  const recommendedRequest = requestFromRecommendation(recommendations[0])
  const featured = recommendedRequest || opportunities[0]
  const featuredHref = recommendedRequest ? `${prefix}/marketplace/${recommendations[0].shipment_request_id}` : featured ? `${prefix}/marketplace/${featured.id}` : `${prefix}/marketplace`
  const match = recommendations[0]?.match_score
  const reasons = recommendations[0]?.reasons?.filter(Boolean).slice(0, 3) || []

  return <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:pb-12">
    <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="lbid-eyebrow">{t.label}</p><h1 className="mt-3 text-[clamp(2rem,3.2vw,3rem)] font-bold tracking-[-0.04em] text-lblue">{t.greeting}</h1><p className="mt-3 max-w-2xl text-[15px] leading-7 text-ink-2">{t.intro}</p></div><div className="flex flex-wrap gap-2"><Button asChild><Link href={`${prefix}/inquiries/new`}><PackagePlus className="h-4 w-4" />{t.create}</Link></Button><Button asChild variant="outline"><Link href={`${prefix}/marketplace`}><BriefcaseBusiness className="h-4 w-4" />{t.market}</Link></Button><Button asChild variant="ghost"><Link href={`${prefix}/profile`}><Settings2 className="h-4 w-4" />{t.settings}</Link></Button></div></section>

    <section className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<PackagePlus className="h-4 w-4" />} label={t.requests} value={ownRequests.length} /><Metric icon={<BriefcaseBusiness className="h-4 w-4" />} label={t.opportunities} value={opportunities.length} /><Metric icon={<ClipboardCheck className="h-4 w-4" />} label={t.orders} value={orders.length} /><Metric icon={<Coins className="h-4 w-4" />} label={t.wallet} value={tokens} /></section>

    {featured ? <WorkspaceHero locale={locale} t={t} request={featured} href={featuredHref} match={match} reasons={reasons} /> : <EmptyOpportunity locale={locale} t={t} href={`${prefix}/marketplace`} />}

    <section className="mt-8"><div className="mb-3 flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-lgold" /><h2 className="text-base font-semibold text-lblue">{t.next}</h2></div>{actions.length ? <div className="grid gap-3 lg:grid-cols-2">{actions.map((item) => <ActionCard key={item.id} item={item} />)}</div> : <div className="lbid-surface p-6 text-sm text-ink-2">{t.allClear}</div>}</section>

    <section className="mt-8 grid gap-4 xl:grid-cols-3"><WorkflowList t={t} title={t.requests} empty={t.noRequests} href={`${prefix}/requests`} rows={ownRequests.slice(0, 3).map((item) => ({ id: item.id, title: route(item, locale), detail: statusLabel(item.status, locale), href: `${prefix}/requests/${item.id}`, badge: item.status }))} /><WorkflowList t={t} title={t.opportunities} empty={t.noOpportunities} href={`${prefix}/marketplace`} rows={opportunities.slice(0, 3).map((item) => ({ id: item.id, title: route(item, locale), detail: cargo(item), href: `${prefix}/marketplace/${item.id}`, badge: statusLabel(item.status, locale) }))} /><WorkflowList t={t} title={t.orders} empty={t.noOrders} href={`${prefix}/orders`} rows={orders.slice(0, 3).map((item) => ({ id: item.id, title: route(item.quotations?.shipment_requests || {}, locale), detail: item.status, href: `${prefix}/orders/${item.id}`, badge: item.status }))} /></section>
    <div className="mt-6 flex flex-wrap gap-2"><Badge variant={data.profile?.can_be_client ? "teal" : "secondary"}>{t.client}</Badge><Badge variant={data.profile?.can_be_forwarder ? "teal" : "secondary"}>{t.forwarder}</Badge></div>
  </main>
}

function WorkspaceHero({ locale, t, request, href, match, reasons }: { locale: Locale; t: typeof copy.zh; request: Request; href: string; match?: number; reasons: string[] }) {
  const origin = request.route?.origin || (locale === "zh" ? "出發地待定" : "Origin pending")
  const destination = request.route?.destination || "Hong Kong"
  const details = request.cargo_details || {}
  const shownReasons = reasons.length ? reasons : [locale === "zh" ? "公司服務能力與需求相符" : "Your company capability matches this request", locale === "zh" ? "此需求目前開放公平密封競價" : "This request is open for fair sealed bidding"]
  const specs = [[locale === "zh" ? "重量" : "Weight", details.weight || "-"], [locale === "zh" ? "體積" : "Volume", details.volume || "-"], [locale === "zh" ? "運輸" : "Freight", details.mode || "-"], [locale === "zh" ? "貨物" : "Cargo", details.cargo || details.cargo_type || "-"]]
  return <section className="relative mt-7 overflow-hidden rounded-[20px] border border-line/80 bg-white shadow-[0_8px_40px_rgba(0,0,0,.09),0_2px_8px_rgba(0,0,0,.05)]"><div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#0c1a3e_0%,#1e3a7a_55%,#c49a3c_100%)]" /><div className="relative px-6 pb-8 pt-9 lg:px-8"><div className="mb-8 flex flex-wrap items-center justify-between gap-3"><div className="flex flex-wrap items-center gap-3"><span className="inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[.09em] text-lgold"><span className="h-1.5 w-1.5 rounded-full bg-lgold" />{match ? t.recommended : t.open}</span>{match ? <span className="inline-flex items-center gap-1.5 rounded-full border border-[#e8d9a0] bg-[#fdf8ec] px-3 py-1 text-[11.5px] font-semibold text-[#7a5e18]"><Target className="h-3 w-3" />{match}% {t.match}</span> : null}</div><span className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold tabular-nums text-ink shadow-[0_1px_4px_rgba(0,0,0,.05)]"><Clock3 className="h-3.5 w-3.5 text-ink-3" />{locale === "zh" ? "競價開放中" : "Bidding open"}</span></div><div className="grid items-center gap-6 lg:grid-cols-[1fr_auto_1fr]"><div><p className="text-[10px] font-semibold uppercase tracking-[.09em] text-ink-3">{locale === "zh" ? "出發地" : "Origin"}</p><h2 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-[-.025em] text-ink">{origin}</h2></div><div className="flex flex-col items-center gap-2"><div className="flex items-center gap-2"><span className="h-px w-10 bg-[linear-gradient(90deg,#e2e6ee,#0c1a3e)] sm:w-14" /><span className="grid h-10 w-10 place-items-center rounded-full bg-lblue text-white shadow-[0_4px_16px_rgba(12,26,62,.30)]"><ArrowRight className="h-4 w-4" /></span><span className="h-px w-10 bg-[linear-gradient(90deg,#0c1a3e,#e2e6ee)] sm:w-14" /></div><span className="rounded-full bg-[#eef1f8] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[.06em] text-lblue">{details.mode || (locale === "zh" ? "運輸" : "Freight")}</span></div><div className="text-left lg:text-right"><p className="text-[10px] font-semibold uppercase tracking-[.09em] text-ink-3">{locale === "zh" ? "目的地" : "Destination"}</p><h2 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-[-.025em] text-ink">{destination}</h2></div></div><div className="mt-8 grid grid-cols-2 divide-x divide-y divide-line-light border-y border-line-light sm:grid-cols-4 sm:divide-y-0">{specs.map(([label, value]) => <div key={label} className="px-4 py-4 first:pl-0 sm:first:pl-0"><p className="text-[10px] font-semibold uppercase tracking-[.08em] text-ink-3">{label}</p><p className="mt-1 text-sm font-semibold text-ink">{value}</p></div>)}</div><div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]"><div className="flex gap-4"><div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-[4.5px] border-[#f0ebd9] bg-white text-center shadow-[0_0_8px_rgba(196,154,60,.12)]"><div><p className="text-lg font-bold leading-none text-[#7a5e18]">{match || "--"}{match ? "%" : ""}</p><p className="mt-1 text-[8px] font-semibold text-[#b8922a]">MATCH</p></div></div><div><p className="text-[10px] font-bold uppercase tracking-[.09em] text-ink-3">{t.why}</p><div className="mt-2 space-y-1.5">{shownReasons.map((reason) => <p key={reason} className="flex items-start gap-2 text-[13px] leading-[1.4] text-ink-2"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald" />{reason}</p>)}</div></div></div><div><p className="text-[10px] font-bold uppercase tracking-[.09em] text-ink-3">{locale === "zh" ? "你的密封報價" : "Your sealed quote"}</p><div className="mt-3 rounded-xl border-2 border-line bg-white p-3 transition focus-within:border-lblue focus-within:shadow-[0_0_0_3px_rgba(12,26,62,.08)]"><p className="flex items-center gap-2 text-xs leading-5 text-ink-2"><LockKeyhole className="h-3.5 w-3.5 shrink-0 text-ink-3" />{t.private}</p></div><Button asChild className="mt-3 w-full"><Link href={href}>{locale === "zh" ? "查看並提交報價" : "Review and bid"}<ArrowRight className="h-4 w-4" /></Link></Button></div></div></div></section>
}

function EmptyOpportunity({ locale, t, href }: { locale: Locale; t: typeof copy.zh; href: string }) { return <section className="lbid-surface mt-7 flex flex-col items-start justify-between gap-4 p-7 sm:flex-row sm:items-center"><div><p className="lbid-eyebrow">{locale === "zh" ? "接單市場" : "MARKETPLACE"}</p><h2 className="mt-2 text-xl font-semibold text-lblue">{locale === "zh" ? "新機會出現時，系統會優先放在這裡。" : "New high-fit opportunities will appear here first."}</h2></div><Button asChild variant="outline"><Link href={href}>{t.market}<ArrowRight className="h-4 w-4" /></Link></Button></section> }

function ActionCard({ item }: { item: Action }) { return <article className={`lbid-surface lbid-surface-interactive flex gap-4 p-5 ${item.primary ? "border-[#e8d9a0] bg-[#fdfaf1]" : ""}`}><div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#eef1f8] text-lblue"><FileWarning className="h-4 w-4" /></div><div className="min-w-0 flex-1"><h3 className="font-semibold text-lblue">{item.title}</h3><p className="mt-1 text-sm leading-6 text-ink-2">{item.body}</p><Button asChild className="mt-4" size="sm" variant={item.primary ? "gold" : "outline"}><Link href={item.href}>{item.label}<ArrowRight className="h-4 w-4" /></Link></Button></div></article> }

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) { return <article className="lbid-surface lbid-surface-interactive flex items-center gap-4 p-4"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#eef1f8] text-lblue">{icon}</div><div><p className="text-[11px] font-semibold uppercase tracking-[.07em] text-ink-3">{label}</p><p className="mt-1 text-xl font-bold tracking-[-.025em] text-ink">{value}</p></div></article> }

function WorkflowList({ t, title, empty, href, rows }: { t: typeof copy.zh; title: string; empty: string; href: string; rows: { id: string; title: string; detail: string; href: string; badge: string }[] }) { return <section className="lbid-surface overflow-hidden"><div className="flex items-center justify-between border-b border-line-light px-5 py-4"><h2 className="font-semibold text-lblue">{title}</h2><Link className="inline-flex items-center gap-1 text-xs font-semibold text-[#7a5e18] transition hover:text-lblue" href={href}>{t.viewAll}<ArrowRight className="h-3.5 w-3.5" /></Link></div>{rows.length ? <div>{rows.map((row) => <Link key={row.id} href={row.href} className="group flex items-start gap-3 border-b border-line-light px-5 py-4 last:border-b-0 transition hover:bg-[#f8f9fc]"><CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-ink-3 group-hover:text-lblue" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{row.title}</p><p className="mt-1 truncate text-xs text-ink-3">{row.detail}</p></div><Badge variant="secondary">{row.badge}</Badge></Link>)}</div> : <p className="min-h-24 px-5 py-6 text-sm leading-6 text-ink-3">{empty}</p>}</section> }

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
  if (recommended) add(`recommended-${recommended.id}`, [t.recommended, t.why, localeLabel(t, "View recommendation")], `${prefix}/marketplace/${recommended.shipment_request_id}`, true)
  if (opportunities[0]) add(`opportunity-${opportunities[0].id}`, t.actions.opportunity, `${prefix}/marketplace/${opportunities[0].id}`)
  const missing = orders.find((order) => { const uploaded = (documents[order.id] || []).join(" ").toLowerCase(); return !/(awb|b\/l)/.test(uploaded) || !uploaded.includes("invoice") || !uploaded.includes("packing") })
  if (missing) add(`documents-${missing.id}`, t.actions.documents, `${prefix}/orders/${missing.id}/documents`)
  return actions.slice(0, 4)
}

function localeLabel(t: typeof copy.zh, fallback: string) { return t.label === copy.zh.label ? "查看推薦" : fallback }
function requestFromRecommendation(recommendation?: Recommendation) { const value = recommendation?.shipment_requests; return Array.isArray(value) ? value[0] : value || undefined }
function route(item: { route?: { origin?: string; destination?: string } }, locale: Locale) { const origin = item.route?.origin || (locale === "zh" ? "出發地待定" : "Origin pending"); const destination = item.route?.destination || "Hong Kong"; return `${origin} \u2192 ${destination}` }
function cargo(item: Request) { const details = item.cargo_details || {}; return [details.weight, details.volume, details.mode, details.cargo || details.cargo_type].filter(Boolean).join(" \u00b7 ") || "Shipment details available" }

function AdminWorkspace({ locale, prefix, t }: { locale: Locale; prefix: string; t: typeof copy.zh }) { const title = locale === "zh" ? "平台營運" : "Platform operations"; const intro = locale === "zh" ? "審核需求、帳戶能力與真實付款確認。" : "Review requests, account capabilities and real payment confirmations."; return <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="lbid-surface p-7"><p className="lbid-eyebrow">LBID ADMIN</p><h1 className="mt-3 text-3xl font-bold text-lblue">{title}</h1><p className="mt-3 text-ink-2">{intro}</p><div className="mt-6 flex flex-wrap gap-2"><Button asChild><Link href={`${prefix}/admin/shipment-requests`}>{t.review}</Link></Button><Button asChild variant="outline"><Link href={`${prefix}/admin/accounts`}>{t.accounts}</Link></Button><Button asChild variant="outline"><Link href={`${prefix}/admin/pending-payments`}>{t.payments}</Link></Button></div></section></main> }
