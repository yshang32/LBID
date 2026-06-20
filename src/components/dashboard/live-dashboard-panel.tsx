"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Coins, Loader2, PackageCheck, RadioTower, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Role = "agency" | "forwarder" | "admin"
type Locale = "zh" | "en"

const copy = {
  zh: { title: "即時工作區", loading: "正在載入工作區資料", demo: "登入真實帳戶後，這裡會顯示你的即時工作區資料。", error: "暫時未能載入即時資料", live: "Live Supabase", requests: "可處理需求", matches: "配對記錄", tokens: "Token 餘額", reputation: "信譽分數", create: "建立需求", market: "開啟接單市場", admin: "查看 Admin queue", profile: "管理能力" },
  en: { title: "Live workspace", loading: "Loading workspace data", demo: "Sign in to a real account to replace demo figures with live workspace data.", error: "Live data is temporarily unavailable", live: "Live Supabase", requests: "Available requests", matches: "Match records", tokens: "Token balance", reputation: "Reputation", create: "Create request", market: "Open marketplace", admin: "Open Admin queue", profile: "Manage capabilities" },
}

export function LiveDashboardPanel({ locale, role }: { locale: Locale; role: Role }) {
  const t = copy[locale]
  const [state, setState] = useState({ loading: true, authenticated: false, error: "", requests: [] as any[], matches: [] as any[], profile: null as any, payments: [] as any[] })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const supabase = getSupabaseBrowserClient()
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }
      if (!data.session) { if (!cancelled) setState((item) => ({ ...item, loading: false })); return }
      const results = await Promise.all([apiJson("/api/shipment-requests"), apiJson("/api/match-records"), apiJson("/api/company-profile"), role === "admin" ? apiJson("/api/admin/pending-payments") : Promise.resolve({ response: { ok: true }, body: { paymentIntents: [] } })])
      if (cancelled) return
      const failed = results.find((item) => !item.response.ok)
      if (failed) { setState((item) => ({ ...item, loading: false, authenticated: true, error: failed.body?.error || "LIVE_DATA_FAILED" })); return }
      setState({ loading: false, authenticated: true, error: "", requests: results[0].body.shipmentRequests || [], matches: results[1].body.matchRecords || [], profile: results[2].body.companyProfile || null, payments: results[3].body.paymentIntents || [] })
    }
    load()
    return () => { cancelled = true }
  }, [role])

  const figures = [
    { icon: PackageCheck, label: t.requests, value: role === "admin" ? state.payments.length : state.requests.length },
    { icon: ShieldCheck, label: t.matches, value: state.matches.length },
    { icon: Coins, label: t.tokens, value: state.authenticated ? Number(state.profile?.token_balance_free || 0) + Number(state.profile?.token_balance_paid || 0) : "--" },
    { icon: CheckCircle2, label: t.reputation, value: state.authenticated ? state.profile?.reputation_score ?? "--" : "--" },
  ]
  const prefix = `/${locale}`

  return <Card className="mt-8"><CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100"><div><div className="flex items-center gap-2"><RadioTower className="h-4 w-4 text-[#a17e22]" /><CardTitle>{t.title}</CardTitle></div><p className="mt-1 text-sm text-slate-500">{state.loading ? t.loading : state.authenticated ? t.live : t.demo}</p></div><Badge variant={state.authenticated ? "teal" : "secondary"}>{state.authenticated ? t.live : "Demo"}</Badge></CardHeader><CardContent className="pt-5">{state.loading ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{t.loading}</div> : state.error ? <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"><AlertCircle className="h-4 w-4" />{t.error}</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{figures.map((item) => <div key={item.label} className="rounded-md border border-lblue/10 bg-slate-50 p-4"><item.icon className="h-4 w-4 text-lblue" /><p className="mt-3 text-sm text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-semibold text-lblue">{item.value}</p></div>)}</div>}<div className="mt-5 flex flex-wrap gap-3"><Button asChild size="sm"><Link href={`${prefix}/${role === "agency" ? "inquiries/new" : role === "admin" ? "admin/pending-payments" : "marketplace"}`}>{role === "agency" ? t.create : role === "admin" ? t.admin : t.market}</Link></Button><Button asChild size="sm" variant="outline"><Link href={`${prefix}/onboarding`}>{t.profile}</Link></Button></div></CardContent></Card>
}
