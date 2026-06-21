"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Coins, Loader2, PackagePlus, Settings2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { statusLabel } from "@/lib/shipment-workflow"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Locale = "zh" | "en"
type Mode = "company" | "admin"
type Request = { id: string; agent_id: string; route?: { origin?: string; destination?: string }; cargo_details?: { cargo?: string; cargo_type?: string }; status?: string }
type Match = { id: string; shipment_request_id: string; stage?: string; rate_card_snapshot?: { order_id?: string } }

const copy = {
  zh: {
    label: "公司工作台", title: "從需求到交付，一個地方完成。", intro: "你的公司可同時發出需求和承接報價；系統會按每個項目的下一步，把工作排在前面。", create: "建立 Shipment Request", market: "查看接單市場", settings: "公司設定", loading: "正在載入工作台", signIn: "請登入以查看公司工作流程。", myRequests: "我的需求", opportunities: "可投標需求", orders: "進行中訂單", open: "開啟", noRequests: "暫未建立需求", noOpportunities: "目前沒有可投標需求", noOrders: "目前沒有已確認訂單", wallet: "Token 餘額", client: "Client 能力", forwarder: "Forwarder 能力", admin: "平台管理", adminIntro: "管理付款審核、公司驗證及平台營運。", reviewPayments: "審核付款",
  },
  en: {
    label: "Company workspace", title: "From request to delivery, in one place.", intro: "Your company can create shipment requests and submit bids. The workspace puts the next action for each workflow first.", create: "Create shipment request", market: "Browse marketplace", settings: "Company settings", loading: "Loading workspace", signIn: "Sign in to view your company workflow.", myRequests: "My requests", opportunities: "Bid opportunities", orders: "Active orders", open: "Open", noRequests: "No requests created yet", noOpportunities: "No bid opportunities right now", noOrders: "No confirmed orders yet", wallet: "Token balance", client: "Client capability", forwarder: "Forwarder capability", admin: "Platform operations", adminIntro: "Manage payment reviews, company verification and platform operations.", reviewPayments: "Review payments",
  },
}

export function LiveDashboardPanel({ locale, mode }: { locale: Locale; mode: Mode }) {
  const t = copy[locale]
  const prefix = `/${locale}`
  const [state, setState] = useState({ loading: true, signedIn: false, userId: "", requests: [] as Request[], matches: [] as Match[], profile: null as any, error: "" })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const client = getSupabaseBrowserClient()
      const { data } = client ? await client.auth.getSession() : { data: { session: null } }
      if (!data.session) { if (!cancelled) setState((current) => ({ ...current, loading: false })); return }
      const [requests, matches, profile] = await Promise.all([apiJson("/api/shipment-requests"), apiJson("/api/match-records"), apiJson("/api/company-profile")])
      if (cancelled) return
      const failed = [requests, matches, profile].find((result) => !result.response.ok)
      if (failed) { setState({ loading: false, signedIn: true, userId: data.session.user.id, requests: [], matches: [], profile: null, error: failed.body?.error || "WORKSPACE_UNAVAILABLE" }); return }
      setState({ loading: false, signedIn: true, userId: data.session.user.id, requests: requests.body.shipmentRequests || [], matches: matches.body.matchRecords || [], profile: profile.body.companyProfile || null, error: "" })
    }
    load()
    return () => { cancelled = true }
  }, [])

  const ownRequests = state.requests.filter((request) => request.agent_id === state.userId).slice(0, 3)
  const opportunities = state.requests.filter((request) => request.agent_id !== state.userId && request.status === "OPEN").slice(0, 3)
  const orders = state.matches.slice(0, 3)
  const tokens = Number(state.profile?.token_balance_free || 0) + Number(state.profile?.token_balance_paid || 0)

  if (mode === "admin") return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="flex flex-col gap-4 border-b border-lblue/10 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a17e22]">LBID admin</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.admin}</h1><p className="mt-2 text-slate-600">{t.adminIntro}</p></div><Button asChild><Link href={`${prefix}/admin/pending-payments`}>{t.reviewPayments}<ArrowRight className="h-4 w-4" /></Link></Button></section></main>

  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="flex flex-col gap-5 border-b border-lblue/10 pb-7 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a17e22]">{t.label}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title}</h1><p className="mt-3 leading-7 text-slate-600">{t.intro}</p></div><div className="flex flex-wrap gap-2"><Button asChild><Link href={`${prefix}/inquiries/new`}><PackagePlus className="h-4 w-4" />{t.create}</Link></Button><Button asChild variant="outline"><Link href={`${prefix}/marketplace`}><BriefcaseBusiness className="h-4 w-4" />{t.market}</Link></Button><Button asChild variant="ghost"><Link href={`${prefix}/profile`}><Settings2 className="h-4 w-4" />{t.settings}</Link></Button></div></section>{state.loading ? <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{t.loading}</div> : !state.signedIn || state.error ? <div className="border border-dashed border-lblue/15 bg-white px-5 py-12 text-center text-sm text-slate-500">{state.error || t.signIn}</div> : <><section className="mt-6 grid gap-3 sm:grid-cols-3"><Metric icon={<PackagePlus className="h-4 w-4" />} label={t.myRequests} value={ownRequests.length} /><Metric icon={<BriefcaseBusiness className="h-4 w-4" />} label={t.opportunities} value={opportunities.length} /><Metric icon={<Coins className="h-4 w-4" />} label={t.wallet} value={tokens} /></section><section className="mt-7 grid gap-5 lg:grid-cols-3"><WorkflowList title={t.myRequests} empty={t.noRequests} href={`${prefix}/requests`} rows={ownRequests.map((request) => ({ id: request.id, title: route(request), detail: statusLabel(request.status, locale), href: `${prefix}/requests/${request.id}`, badge: request.status }))} locale={locale} /><WorkflowList title={t.opportunities} empty={t.noOpportunities} href={`${prefix}/marketplace`} rows={opportunities.map((request) => ({ id: request.id, title: route(request), detail: request.cargo_details?.cargo || request.cargo_details?.cargo_type || "General cargo", href: `${prefix}/marketplace/${request.id}`, badge: statusLabel(request.status, locale) }))} locale={locale} /><WorkflowList title={t.orders} empty={t.noOrders} href={`${prefix}/orders`} rows={orders.map((match) => ({ id: match.id, title: match.rate_card_snapshot?.order_id || match.id, detail: `SR ${match.shipment_request_id}`, href: match.rate_card_snapshot?.order_id ? `${prefix}/orders/${match.rate_card_snapshot.order_id}` : `${prefix}/orders`, badge: match.stage || "confirmed" }))} locale={locale} /></section><div className="mt-6 flex flex-wrap gap-2"><Badge variant={state.profile?.can_be_client ? "teal" : "secondary"}>{t.client}</Badge><Badge variant={state.profile?.can_be_forwarder ? "teal" : "secondary"}>{t.forwarder}</Badge></div></>}</main>
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) { return <Card><CardContent className="p-4"><div className="text-lblue">{icon}</div><p className="mt-3 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-lblue">{value}</p></CardContent></Card> }
function WorkflowList({ title, empty, href, rows, locale }: { title: string; empty: string; href: string; rows: { id: string; title: string; detail: string; href: string; badge: string }[]; locale: Locale }) { const open = locale === "zh" ? "查看全部" : "View all"; return <Card><CardContent className="p-5"><div className="flex items-center justify-between"><h2 className="font-semibold text-lblue">{title}</h2><Link className="text-xs font-semibold text-[#8b6d1d] hover:text-lblue" href={href}>{open}</Link></div>{rows.length ? <div className="mt-4 divide-y divide-slate-100">{rows.map((row) => <Link key={row.id} href={row.href} className="block py-3 first:pt-0 last:pb-0"><div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-lblue">{row.title}</p><p className="mt-1 truncate text-xs text-slate-500">{row.detail}</p></div><Badge variant="secondary">{row.badge}</Badge></div></Link>)}</div> : <p className="mt-5 min-h-14 text-sm leading-6 text-slate-500">{empty}</p>}</CardContent></Card> }
function route(request: Request) { return `${request.route?.origin || "Origin"} → ${request.route?.destination || "Hong Kong"}` }
