import Link from "next/link"
import { ArrowRight, BriefcaseBusiness, Clock3, FileText, PackagePlus, ShieldCheck, Star, Wallet } from "lucide-react"

import { LiveDashboardPanel } from "@/components/dashboard/live-dashboard-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4Matches, v4ShipmentRequests, v4Status } from "@/lib/v4"

type Role = "agency" | "forwarder" | "admin"

const copy = {
  zh: {
    agency: { badge: "CLIENT WORKSPACE", title: "你的下一個物流決定", body: "建立需求、比較報價，並在同一個工作區追蹤交接。", primary: "建立 Shipment Request", secondary: "比較已收報價", focus: "待處理需求" },
    forwarder: { badge: "FORWARDER WORKSPACE", title: "把時間留給值得跟進的需求", body: "優先處理即將截標的 Shipment Request，讓你的實力在公平比較中被看見。", primary: "查看接單市場", secondary: "管理 Token 錢包", focus: "即將截標" },
    admin: { badge: "ADMIN WORKSPACE", title: "讓平台保持可信與流暢", body: "先處理付款與公司驗證，再擴大高品質需求與供應。", primary: "查看待確認付款", secondary: "管理 Forwarder 驗證", focus: "營運優先事項" },
    metrics: ["可處理需求", "進行中配對", "Token 餘額", "信譽分數"],
    opportunity: "推薦機會", deadline: "距離截標", sealed: "報價保密至截標", route: "路線", cargo: "貨物", activity: "進行中的工作", viewAll: "查看全部", open: "開啟工作區", review: "檢視需求", status: "狀態",
  },
  en: {
    agency: { badge: "CLIENT WORKSPACE", title: "Your next logistics decision", body: "Create requests, compare quotes and manage every handover in one workspace.", primary: "Create Shipment Request", secondary: "Compare received quotes", focus: "Requests to review" },
    forwarder: { badge: "FORWARDER WORKSPACE", title: "Give your time to the opportunities that matter", body: "Prioritise closing shipment requests and let capability speak through a fair comparison.", primary: "Open marketplace", secondary: "Manage token wallet", focus: "Closing soon" },
    admin: { badge: "ADMIN WORKSPACE", title: "Keep the platform trusted and moving", body: "Clear payments and company verification first, then grow high-quality demand and supply.", primary: "Review pending payments", secondary: "Verify forwarders", focus: "Operations priority" },
    metrics: ["Available requests", "Active matches", "Token balance", "Reputation"],
    opportunity: "Recommended opportunity", deadline: "Closes in", sealed: "Quotes stay sealed until close", route: "Route", cargo: "Cargo", activity: "Active work", viewAll: "View all", open: "Open workspace", review: "Review request", status: "Status",
  },
}

const roleLinks = {
  agency: { primary: "inquiries/new", secondary: "quotations/compare", primaryIcon: PackagePlus },
  forwarder: { primary: "marketplace", secondary: "tokens", primaryIcon: BriefcaseBusiness },
  admin: { primary: "admin/pending-payments", secondary: "admin", primaryIcon: FileText },
}

export default function LocalizedDashboardPage({ params, searchParams }: { params: { locale: string }; searchParams?: { role?: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const role: Role = searchParams?.role === "agency" || searchParams?.role === "admin" ? searchParams.role : "forwarder"
  const t = copy[locale]
  const current = t[role]
  const links = roleLinks[role]
  const prefix = `/${locale}`
  const request = v4ShipmentRequests[1]
  const PrimaryIcon = links.primaryIcon
  const metricValues = [role === "admin" ? "8" : "4", "2", String(v4Status.tokens), String(v4Status.reputation)]

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-12 pt-9 sm:px-8 lg:px-10">
      <section className="border-b border-lblue/10 pb-8"><Badge variant="gold" className="border border-lgold/30 bg-[#fcf8ec] text-[#725b1d]">{current.badge}</Badge><div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-2xl"><h1 className="text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{current.title}</h1><p className="mt-3 text-base leading-7 text-slate-600">{current.body}</p></div><div className="flex flex-wrap gap-3"><Button asChild><Link href={`${prefix}/${links.primary}`}><PrimaryIcon className="h-4 w-4" />{current.primary}</Link></Button><Button asChild variant="outline"><Link href={`${prefix}/${links.secondary}`}>{current.secondary}</Link></Button></div></div></section>

      <section className="grid border-b border-lblue/10 md:grid-cols-4">{t.metrics.map((label, index) => <div key={label} className="border-b border-lblue/10 py-5 md:border-b-0 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-lblue">{metricValues[index]}</p></div>)}</section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <Card><CardHeader className="flex-row items-center justify-between space-y-0"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{t.focus}</p><CardTitle className="mt-2">{t.opportunity}</CardTitle></div><Badge variant="gold">{request.mode}</Badge></CardHeader><CardContent><div className="flex flex-col gap-5 border-t border-slate-100 pt-5 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-semibold text-lblue">{request.laneEn}</h2><p className="mt-2 text-sm text-slate-600">{request.cargo}</p></div><div className="rounded-md border border-[#ecdca9] bg-[#fdf9ed] px-3 py-2 text-right text-[#725b1d]"><div className="flex items-center justify-end gap-1 text-xs font-semibold"><Clock3 className="h-3.5 w-3.5" />{t.deadline}</div><div className="mt-1 font-mono text-lg font-semibold">{request.deadline}</div></div></div><div className="mt-6 grid gap-3 sm:grid-cols-3"><Detail icon={ShieldCheck} label={t.sealed} /><Detail icon={Star} label={`${t.status}: ${request.usedSlots}/${request.totalSlots}`} /><Detail icon={Wallet} label={`${request.tokenCost} Token`} /></div><div className="mt-6 flex gap-3"><Button asChild><Link href={`${prefix}/marketplace/${request.id}`}>{t.review}<ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link href={`${prefix}/marketplace`}>{t.viewAll}</Link></Button></div></CardContent></Card>
        <Card><CardHeader><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">LBID</p><CardTitle className="mt-2">{t.activity}</CardTitle></CardHeader><CardContent className="space-y-1">{v4Matches.map((match) => <Link key={match.id} href={`${prefix}/matches/${match.id}`} className="block rounded-md border border-transparent px-3 py-3 transition hover:border-lblue/10 hover:bg-slate-50"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-lblue">{match.title}</p><p className="mt-1 text-sm text-slate-500">{match.route}</p></div><Chevron status={match.status} /></div></Link>)}</CardContent></Card>
      </section>
      <LiveDashboardPanel locale={locale} role={role} />
    </main>
  )
}

function Detail({ icon: Icon, label }: { icon: typeof ShieldCheck; label: string }) { return <div className="flex items-center gap-2 rounded-md bg-slate-50 p-3 text-sm text-slate-600"><Icon className="h-4 w-4 text-lblue" />{label}</div> }
function Chevron({ status }: { status: string }) { return <div className="flex shrink-0 items-center gap-1 text-xs font-medium text-slate-500"><span className="hidden sm:inline">{status}</span><ArrowRight className="h-4 w-4 text-lblue" /></div> }
