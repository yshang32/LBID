"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, Loader2, LockKeyhole } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { shipmentWorkflow, statusLabel, workflowProgress } from "@/lib/shipment-workflow"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type ShipmentRequest = { id: string; agent_id: string; route?: { origin?: string; destination?: string }; cargo_details?: { cargo?: string; cargo_type?: string; mode?: string; weight_kg?: number; cbm?: number }; services_needed?: string[]; bid_deadline?: string; status?: string }

export function RequestWorkflowPanel({ locale, requestId }: { locale: "zh" | "en"; requestId: string }) {
  const [state, setState] = useState({ loading: true, signedIn: false, userId: "", request: null as ShipmentRequest | null, error: "" })
  const copy = locale === "zh" ? { back: "返回我的需求", title: "Shipment Request 流程", progress: "目前進度", detail: "需求資料", service: "所需服務", deadline: "競價截止", ownerOpen: "競價正在進行", ownerOpenNote: "Forwarder 目前只能提交一次密封報價；截止後你可以比較所有有效報價。", ownerClosed: "比較報價", ownerAwarded: "前往訂單", bidderOpen: "提交密封報價", bidderClosed: "競價已結束", load: "載入需求流程", unavailable: "無法讀取這個需求。" } : { back: "Back to my requests", title: "Shipment request workflow", progress: "Current progress", detail: "Request details", service: "Services needed", deadline: "Bid deadline", ownerOpen: "Bidding is in progress", ownerOpenNote: "Forwarders can submit one sealed bid. You can compare valid quotes after the deadline.", ownerClosed: "Compare quotations", ownerAwarded: "Open order", bidderOpen: "Submit sealed bid", bidderClosed: "Bidding has closed", load: "Loading request workflow", unavailable: "This request is unavailable." }

  useEffect(() => {
    let cancelled = false
    async function load() {
      const client = getSupabaseBrowserClient()
      const { data } = client ? await client.auth.getSession() : { data: { session: null } }
      const { response, body } = await apiJson(`/api/shipment-requests/${requestId}`)
      if (cancelled) return
      if (!response.ok || !body.shipmentRequest) { setState({ loading: false, signedIn: Boolean(data.session), userId: data.session?.user.id || "", request: null, error: body.error || "REQUEST_NOT_FOUND" }); return }
      setState({ loading: false, signedIn: Boolean(data.session), userId: data.session?.user.id || "", request: body.shipmentRequest, error: "" })
    }
    load()
    return () => { cancelled = true }
  }, [requestId])

  if (state.loading) return <main className="mx-auto flex min-h-[50vh] w-full max-w-6xl items-center px-4 sm:px-6"><Loader2 className="mr-2 h-5 w-5 animate-spin text-lblue" />{copy.load}</main>
  if (!state.request) return <main className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6"><Button asChild variant="ghost"><Link href={`/${locale}/requests`}><ArrowLeft className="h-4 w-4" />{copy.back}</Link></Button><p className="mt-8 text-slate-600">{copy.unavailable}</p></main>

  const request = state.request
  const owner = request.agent_id === state.userId
  const progress = workflowProgress(request.status)
  const route = `${request.route?.origin || "Origin"} → ${request.route?.destination || "Hong Kong"}`
  const orderId = typeof (request as any).order_id === "string" ? (request as any).order_id : ""

  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10"><Button asChild variant="ghost"><Link href={`/${locale}/requests`}><ArrowLeft className="h-4 w-4" />{copy.back}</Link></Button><section className="mt-4 border-b border-lblue/10 pb-7"><div className="flex flex-wrap gap-2"><Badge variant={request.status === "OPEN" ? "teal" : "secondary"}>{statusLabel(request.status, locale)}</Badge><span className="font-mono text-xs leading-6 text-slate-400">{request.id}</span></div><h1 className="mt-3 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{route}</h1><p className="mt-2 text-slate-600">{request.cargo_details?.cargo || request.cargo_details?.cargo_type || "General cargo"}</p></section><section className="mt-7"><p className="text-sm font-semibold text-lblue">{copy.progress}</p><div className="mt-4 grid gap-3 sm:grid-cols-5">{shipmentWorkflow.map((step, index) => { const complete = index <= progress; const current = index === progress; return <div key={step.key} className={`border p-3 ${current ? "border-[#c9a84c] bg-[#fcf8ec]" : complete ? "border-emerald-200 bg-emerald-50" : "border-lblue/10 bg-white"}`}><div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${complete ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>{complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</div><p className="mt-3 text-sm font-semibold text-lblue">{locale === "zh" ? step.zh : step.en}</p></div> })}</div></section><section className="mt-7 grid gap-5 lg:grid-cols-[1fr_340px]"><Card><CardContent className="p-5"><h2 className="font-semibold text-lblue">{copy.detail}</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Detail label="Mode" value={request.cargo_details?.mode || "Air / Sea"} /><Detail label="Weight" value={request.cargo_details?.weight_kg ? `${request.cargo_details.weight_kg} kg` : "-"} /><Detail label="Volume" value={request.cargo_details?.cbm ? `${request.cargo_details.cbm} CBM` : "-"} /><Detail label={copy.service} value={request.services_needed?.join(", ") || "-"} /><Detail label={copy.deadline} value={request.bid_deadline ? new Date(request.bid_deadline).toLocaleString(locale === "zh" ? "zh-HK" : "en-HK", { dateStyle: "medium", timeStyle: "short" }) : "-"} /></dl></CardContent></Card><Card className="h-fit"><CardContent className="p-5">{owner ? <OwnerAction locale={locale} request={request} copy={copy} orderId={orderId} /> : <BidderAction locale={locale} request={request} copy={copy} />}</CardContent></Card></section></main>
}

function OwnerAction({ locale, request, copy, orderId }: { locale: "zh" | "en"; request: ShipmentRequest; copy: any; orderId: string }) { if (request.status === "AWARDED" && orderId) return <><p className="font-semibold text-lblue">{copy.ownerAwarded}</p><Button asChild className="mt-4 w-full"><Link href={`/${locale}/orders/${orderId}`}>{copy.ownerAwarded}<ArrowRight className="h-4 w-4" /></Link></Button></>; if (request.status === "CLOSED") return <><p className="font-semibold text-lblue">{copy.ownerClosed}</p><Button asChild className="mt-4 w-full"><Link href={`/${locale}/quotations/compare?srId=${request.id}`}>{copy.ownerClosed}<ArrowRight className="h-4 w-4" /></Link></Button></>; return <><div className="flex items-center gap-2 text-sm font-semibold text-lblue"><Clock3 className="h-4 w-4 text-[#a17e22]" />{copy.ownerOpen}</div><p className="mt-3 text-sm leading-6 text-slate-600">{copy.ownerOpenNote}</p></> }
function BidderAction({ locale, request, copy }: { locale: "zh" | "en"; request: ShipmentRequest; copy: any }) { if (request.status !== "OPEN") return <div className="flex items-center gap-2 text-sm text-slate-600"><LockKeyhole className="h-4 w-4" />{copy.bidderClosed}</div>; return <><p className="font-semibold text-lblue">{copy.bidderOpen}</p><Button asChild className="mt-4 w-full" variant="gold"><Link href={`/${locale}/marketplace/${request.id}`}>{copy.bidderOpen}<ArrowRight className="h-4 w-4" /></Link></Button></> }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-lblue">{value}</dd></div> }
