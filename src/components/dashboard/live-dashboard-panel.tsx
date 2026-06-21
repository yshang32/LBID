"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, BriefcaseBusiness, CheckCircle2, Coins, Loader2, PackagePlus, RadioTower, Settings2, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Locale = "zh" | "en"
type Mode = "company" | "admin"

const copy = {
  zh: {
    companyBadge: "COMPANY WORKSPACE", adminBadge: "ADMIN WORKSPACE", title: "一個公司帳戶，管理兩種物流機會。", adminTitle: "平台營運工作台", intro: "同時發出 Shipment Request、比較報價，以及瀏覽合適的投標機會。", adminIntro: "管理付款、審核公司與維持平台運作質素。", loading: "正在載入工作台資料", signIn: "請登入以查看即時公司資料。", error: "暫時未能載入工作台資料。", live: "Live Supabase", myRequests: "我的需求", opportunities: "可投標機會", matches: "配對記錄", tokens: "Token 餘額", reputation: "信譽分數", create: "建立需求", market: "瀏覽市場", settings: "公司設定", admin: "付款審核", payments: "待處理付款", capability: "雙能力帳戶", client: "Client 能力", forwarder: "Forwarder 能力",
  },
  en: {
    companyBadge: "COMPANY WORKSPACE", adminBadge: "ADMIN WORKSPACE", title: "One company account, two logistics capabilities.", adminTitle: "Platform operations workspace", intro: "Create shipment requests, compare quotations and explore suitable bid opportunities from the same account.", adminIntro: "Manage payments, company verification and platform quality.", loading: "Loading workspace data", signIn: "Sign in to view live company data.", error: "Live workspace data is temporarily unavailable.", live: "Live Supabase", myRequests: "My requests", opportunities: "Bid opportunities", matches: "Match records", tokens: "Token balance", reputation: "Reputation", create: "Create request", market: "Open marketplace", settings: "Company settings", admin: "Review payments", payments: "Pending payments", capability: "Dual-capability account", client: "Client capability", forwarder: "Forwarder capability",
  },
}

export function LiveDashboardPanel({ locale, mode }: { locale: Locale; mode: Mode }) {
  const t = copy[locale]
  const [state, setState] = useState({ loading: true, authenticated: false, error: "", userId: "", requests: [] as any[], matches: [] as any[], profile: null as any, payments: [] as any[] })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = getSupabaseBrowserClient()
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }
      if (!data.session) { if (!cancelled) setState((current) => ({ ...current, loading: false })); return }
      const results = await Promise.all([
        apiJson("/api/shipment-requests"), apiJson("/api/match-records"), apiJson("/api/company-profile"),
        mode === "admin" ? apiJson("/api/admin/pending-payments") : Promise.resolve({ response: { ok: true }, body: { paymentIntents: [] } }),
      ])
      if (cancelled) return
      const failed = results.find((item) => !item.response.ok)
      if (failed) { setState((current) => ({ ...current, loading: false, authenticated: true, error: failed.body?.error || "LIVE_DATA_FAILED" })); return }
      setState({ loading: false, authenticated: true, error: "", userId: data.session.user.id, requests: results[0].body.shipmentRequests || [], matches: results[1].body.matchRecords || [], profile: results[2].body.companyProfile || null, payments: results[3].body.paymentIntents || [] })
    }
    load()
    return () => { cancelled = true }
  }, [mode])

  const ownRequests = state.requests.filter((request) => request.agent_id === state.userId)
  const bidOpportunities = state.requests.filter((request) => request.agent_id !== state.userId && request.status === "OPEN")
  const figures = mode === "admin"
    ? [{ label: t.payments, value: state.payments.length }, { label: t.matches, value: state.matches.length }, { label: t.tokens, value: "--" }, { label: t.reputation, value: "--" }]
    : [{ label: t.myRequests, value: ownRequests.length }, { label: t.opportunities, value: bidOpportunities.length }, { label: t.matches, value: state.matches.length }, { label: t.tokens, value: state.authenticated ? Number(state.profile?.token_balance_free || 0) + Number(state.profile?.token_balance_paid || 0) : "--" }]
  const prefix = `/${locale}`

  return <>
    <section className="border-b border-lblue/10 pb-8"><Badge variant="gold">{mode === "admin" ? t.adminBadge : t.companyBadge}</Badge><div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><h1 className="text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{mode === "admin" ? t.adminTitle : t.title}</h1><p className="mt-3 text-base leading-7 text-slate-600">{mode === "admin" ? t.adminIntro : t.intro}</p></div><div className="flex flex-wrap gap-3">{mode === "admin" ? <Button asChild><Link href={`${prefix}/admin/pending-payments`}><ShieldCheck className="h-4 w-4" />{t.admin}</Link></Button> : <><Button asChild><Link href={`${prefix}/inquiries/new`}><PackagePlus className="h-4 w-4" />{t.create}</Link></Button><Button asChild variant="outline"><Link href={`${prefix}/marketplace`}><BriefcaseBusiness className="h-4 w-4" />{t.market}</Link></Button></>}<Button asChild variant="ghost"><Link href={`${prefix}/onboarding`}><Settings2 className="h-4 w-4" />{t.settings}</Link></Button></div></div></section>
    <Card className="mt-8"><CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100"><div><div className="flex items-center gap-2"><RadioTower className="h-4 w-4 text-[#a17e22]" /><CardTitle>{state.loading ? t.loading : state.authenticated ? t.live : t.signIn}</CardTitle></div></div><Badge variant={state.authenticated ? "teal" : "secondary"}>{state.authenticated ? t.capability : "LBID"}</Badge></CardHeader><CardContent className="pt-5">{state.loading ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{t.loading}</div> : state.error ? <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{t.error}</div> : <><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{figures.map((item, index) => <div key={item.label} className="rounded-md border border-lblue/10 bg-slate-50 p-4">{index === 0 ? <PackagePlus className="h-4 w-4 text-lblue" /> : index === 1 ? <BriefcaseBusiness className="h-4 w-4 text-lblue" /> : index === 2 ? <CheckCircle2 className="h-4 w-4 text-lblue" /> : <Coins className="h-4 w-4 text-lblue" />}<p className="mt-3 text-sm text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-semibold text-lblue">{item.value}</p></div>)}</div>{mode === "company" && state.authenticated ? <div className="mt-5 flex flex-wrap gap-2"><Badge variant={state.profile?.can_be_client ? "teal" : "secondary"}>{t.client}</Badge><Badge variant={state.profile?.can_be_forwarder ? "teal" : "secondary"}>{t.forwarder}</Badge></div> : null}</>}</CardContent></Card>
  </>
}
