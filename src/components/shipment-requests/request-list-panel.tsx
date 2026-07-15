"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Loader2, PackagePlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { statusLabel } from "@/lib/shipment-workflow"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type ShipmentRequest = { id: string; agent_id: string; route?: { origin?: string; destination?: string }; cargo_details?: { cargo?: string; cargo_type?: string; mode?: string; weight_kg?: number }; bid_deadline?: string; status?: string; created_at?: string }

export function RequestListPanel({ locale }: { locale: "zh" | "en" }) {
  const [state, setState] = useState({ loading: true, signedIn: false, requests: [] as ShipmentRequest[], error: "" })
  const prefix = `/${locale}`
  const copy = locale === "zh" ? { title: "我的 Shipment Requests", intro: "由提交、審核、競價到選擇報價，所有進度都在這裡。", create: "建立需求", signIn: "請先登入以查看公司需求。", empty: "尚未建立任何需求。", open: "查看流程", load: "載入需求中" } : { title: "My shipment requests", intro: "Track every request from submission through bidding and award.", create: "Create request", signIn: "Sign in to view your company requests.", empty: "No shipment requests yet.", open: "Open workflow", load: "Loading requests" }

  useEffect(() => {
    let cancelled = false
    async function load() {
      const client = getSupabaseBrowserClient()
      const { data } = client ? await client.auth.getSession() : { data: { session: null } }
      if (!data.session) { if (!cancelled) setState({ loading: false, signedIn: false, requests: [], error: "" }); return }
      const { response, body } = await apiJson("/api/shipment-requests")
      if (cancelled) return
      if (!response.ok) { setState({ loading: false, signedIn: true, requests: [], error: body.error || "REQUESTS_UNAVAILABLE" }); return }
      const requests = (body.shipmentRequests || []).filter((request: ShipmentRequest) => request.agent_id === data.session?.user.id)
      setState({ loading: false, signedIn: true, requests, error: "" })
    }
    load()
    return () => { cancelled = true }
  }, [])

  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="flex flex-col gap-4 border-b border-lblue/10 pb-7 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a17e22]">LBID workflow</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{copy.title}</h1><p className="mt-2 text-slate-600">{copy.intro}</p></div><Button asChild><Link href={`${prefix}/inquiries/new`}><PackagePlus className="h-4 w-4" />{copy.create}</Link></Button></section><section className="mt-6 space-y-3">{state.loading ? <Loading label={copy.load} /> : !state.signedIn ? <Empty label={copy.signIn} /> : state.error ? <Empty label={state.error} /> : !state.requests.length ? <Empty label={copy.empty} /> : state.requests.map((request) => <RequestRow key={request.id} request={request} locale={locale} openLabel={copy.open} />)}</section></main>
}

function RequestRow({ request, locale, openLabel }: { request: ShipmentRequest; locale: "zh" | "en"; openLabel: string }) {
  const route = `${request.route?.origin || "Origin"} → ${request.route?.destination || "Destination"}`
  const cargo = request.cargo_details?.cargo || request.cargo_details?.cargo_type || (locale === "zh" ? "一般貨物" : "General cargo")
  return <Card><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Badge variant={request.status === "OPEN" ? "teal" : "secondary"}>{statusLabel(request.status, locale)}</Badge><span className="font-mono text-xs text-slate-400">{request.id}</span></div><h2 className="mt-3 text-lg font-semibold text-lblue">{route}</h2><p className="mt-1 text-sm text-slate-600">{cargo}{request.cargo_details?.weight_kg ? ` · ${request.cargo_details.weight_kg} kg` : ""}</p></div><div className="text-sm text-slate-500">{request.bid_deadline ? new Date(request.bid_deadline).toLocaleString(locale === "zh" ? "zh-HK" : "en-HK", { dateStyle: "medium", timeStyle: "short" }) : ""}</div><Button asChild variant="outline"><Link href={`/${locale}/requests/${request.id}`}>{openLabel}<ArrowRight className="h-4 w-4" /></Link></Button></CardContent></Card>
}

function Loading({ label }: { label: string }) { return <div className="flex items-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{label}</div> }
function Empty({ label }: { label: string }) { return <div className="border border-dashed border-lblue/15 bg-white px-5 py-12 text-center text-sm text-slate-500">{label}</div> }
