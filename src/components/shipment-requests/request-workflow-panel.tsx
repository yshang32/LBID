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

type Locale = "zh" | "en"
type ShipmentRequest = { id: string; agent_id: string; route?: { origin?: string; destination?: string }; cargo_details?: { cargo?: string; cargo_type?: string; mode?: string; weight_kg?: number; cbm?: number }; services_needed?: string[]; bid_deadline?: string; status?: string }

const copy = {
  zh: { back: "返回我的需求", title: "Shipment Request 詳情", progress: "流程進度", details: "貨運資料", services: "所需服務", deadline: "截標時間", loading: "正在載入需求資料", unavailable: "此需求暫時無法查看。", review: "等待平台審核", reviewNote: "平台確認需求資料後，系統會自動開啟固定三小時的密封競價。", open: "密封競價進行中", openNote: "Forwarder 只可提交一次密封報價；截標後你可比較所有有效報價。", compare: "比較報價", bid: "提交密封報價", closed: "競價已結束", awarded: "已選擇合作方", signIn: "請先登入。", mode: "運輸方式", weight: "重量", volume: "體積" },
  en: { back: "Back to my requests", title: "Shipment request details", progress: "Workflow progress", details: "Cargo details", services: "Services needed", deadline: "Bid deadline", loading: "Loading request", unavailable: "This request is unavailable.", review: "Awaiting platform review", reviewNote: "After platform review, LBID opens a fixed three-hour sealed bid window automatically.", open: "Sealed bidding is in progress", openNote: "Forwarders can submit one sealed bid. Compare valid quotes after the deadline.", compare: "Compare quotations", bid: "Submit sealed bid", closed: "Bidding has closed", awarded: "Awarded", signIn: "Please sign in.", mode: "Transport mode", weight: "Weight", volume: "Volume" },
}

export function RequestWorkflowPanel({ locale, requestId }: { locale: Locale; requestId: string }) {
  const t = copy[locale]
  const [state, setState] = useState({ loading: true, userId: "", request: null as ShipmentRequest | null, error: "" })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const client = getSupabaseBrowserClient()
      const { data } = client ? await client.auth.getSession() : { data: { session: null } }
      const { response, body } = await apiJson(`/api/shipment-requests/${requestId}`)
      if (cancelled) return
      setState({ loading: false, userId: data.session?.user.id || "", request: response.ok ? body.shipmentRequest || null : null, error: response.ok ? "" : body.error || "REQUEST_NOT_FOUND" })
    }
    load()
    return () => { cancelled = true }
  }, [requestId])

  if (state.loading) return <main className="mx-auto flex min-h-[45vh] w-full max-w-6xl items-center px-4 text-sm text-slate-500 sm:px-6"><Loader2 className="mr-2 h-5 w-5 animate-spin text-lblue" />{t.loading}</main>
  if (!state.request) return <main className="mx-auto w-full max-w-6xl px-4 pt-8 sm:px-6"><Button asChild variant="ghost"><Link href={`/${locale}/requests`}><ArrowLeft className="h-4 w-4" />{t.back}</Link></Button><p className="mt-8 text-slate-600">{state.error === "UNAUTHENTICATED" ? t.signIn : t.unavailable}</p></main>

  const request = state.request
  const owner = request.agent_id === state.userId
  const route = `${request.route?.origin || (locale === "zh" ? "出發地待定" : "Origin pending")} ${locale === "zh" ? "至" : "to"} ${request.route?.destination || "Hong Kong"}`
  const progress = workflowProgress(request.status)

  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10"><Button asChild variant="ghost"><Link href={`/${locale}/requests`}><ArrowLeft className="h-4 w-4" />{t.back}</Link></Button>
    <section className="mt-4 border-b border-lblue/10 pb-7"><div className="flex flex-wrap gap-2"><Badge variant={request.status === "OPEN" ? "teal" : "secondary"}>{statusLabel(request.status, locale)}</Badge><span className="font-mono text-xs leading-6 text-slate-400">{request.id}</span></div><h1 className="mt-3 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{route}</h1><p className="mt-2 text-slate-600">{request.cargo_details?.cargo || request.cargo_details?.cargo_type || "-"}</p></section>
    <section className="mt-7"><p className="text-sm font-semibold text-lblue">{t.progress}</p><div className="mt-4 grid gap-3 sm:grid-cols-5">{shipmentWorkflow.map((step, index) => { const complete = index <= progress; const current = index === progress; return <div key={step.key} className={`border p-3 ${current ? "border-[#c9a84c] bg-[#fcf8ec]" : complete ? "border-emerald-200 bg-emerald-50" : "border-lblue/10 bg-white"}`}><div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${complete ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-400"}`}>{complete ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</div><p className="mt-3 text-sm font-semibold text-lblue">{locale === "zh" ? step.zh : step.en}</p></div> })}</div></section>
    <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_340px]"><Card><CardContent className="p-5"><h2 className="font-semibold text-lblue">{t.details}</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><Detail label={t.mode} value={request.cargo_details?.mode || "-"} /><Detail label={t.weight} value={request.cargo_details?.weight_kg ? `${request.cargo_details.weight_kg} kg` : "-"} /><Detail label={t.volume} value={request.cargo_details?.cbm ? `${request.cargo_details.cbm} CBM` : "-"} /><Detail label={t.services} value={request.services_needed?.join(", ") || "-"} /><Detail label={t.deadline} value={request.bid_deadline ? new Date(request.bid_deadline).toLocaleString(locale === "zh" ? "zh-HK" : "en-HK", { dateStyle: "medium", timeStyle: "short" }) : "-"} /></dl></CardContent></Card><Card className="h-fit"><CardContent className="p-5">{owner ? <OwnerAction locale={locale} request={request} t={t} /> : <BidderAction locale={locale} request={request} t={t} />}</CardContent></Card></section>
  </main>
}

function OwnerAction({ locale, request, t }: { locale: Locale; request: ShipmentRequest; t: typeof copy.zh }) { const cancel = <CancelRequestButton locale={locale} requestId={request.id} awarded={request.status === "AWARDED"} />; if (request.status === "CLOSED") return <><p className="font-semibold text-lblue">{t.compare}</p><Button asChild className="mt-4 w-full"><Link href={`/${locale}/quotations/compare?srId=${request.id}`}>{t.compare}<ArrowRight className="h-4 w-4" /></Link></Button>{cancel}</>; if (request.status === "PENDING_REVIEW") return <><p className="flex items-center gap-2 font-semibold text-lblue"><Clock3 className="h-4 w-4 text-lgold" />{t.review}</p><p className="mt-3 text-sm leading-6 text-slate-600">{t.reviewNote}</p>{cancel}</>; return <><p className="flex items-center gap-2 font-semibold text-lblue"><Clock3 className="h-4 w-4 text-lgold" />{request.status === "AWARDED" ? t.awarded : t.open}</p><p className="mt-3 text-sm leading-6 text-slate-600">{t.openNote}</p>{cancel}</> }
function BidderAction({ locale, request, t }: { locale: Locale; request: ShipmentRequest; t: typeof copy.zh }) { if (request.status !== "OPEN") return <div className="flex items-center gap-2 text-sm text-slate-600"><LockKeyhole className="h-4 w-4" />{t.closed}</div>; return <><p className="font-semibold text-lblue">{t.bid}</p><Button asChild className="mt-4 w-full" variant="gold"><Link href={`/${locale}/marketplace/${request.id}`}>{t.bid}<ArrowRight className="h-4 w-4" /></Link></Button></> }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</dt><dd className="mt-1 text-sm font-medium text-lblue">{value}</dd></div> }
function CancelRequestButton({ locale, requestId, awarded }: { locale: Locale; requestId: string; awarded: boolean }) { const [open, setOpen] = useState(false); const [reason, setReason] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const t = locale === "zh" ? { button: awarded ? "申請取消／冷靜期審核" : "取消此需求", title: awarded ? "申請中標後取消" : "取消 Shipment Request", hint: awarded ? "取消中標後需求會交由平台審核，並計入三次拒絕額度。" : "取消後需求不會再出現在市場。", placeholder: "請說明取消原因", cancel: "返回", confirm: "提交申請", success: "已記錄。" } : { button: awarded ? "Request cancellation review" : "Cancel this request", title: awarded ? "Request post-award cancellation" : "Cancel shipment request", hint: awarded ? "Post-award cancellation is reviewed by LBID and counts toward the three-refusal allowance." : "Cancelled requests no longer appear in the marketplace.", placeholder: "Explain the reason", cancel: "Back", confirm: "Submit request", success: "Recorded." }; async function submit() { setBusy(true); setError(""); const { response, body } = await apiJson(`/api/shipment-requests/${requestId}/cancel`, { method: "POST", body: JSON.stringify({ reason }) }); setBusy(false); if (!response.ok) { setError(body.error || "REQUEST_FAILED"); return }; setError(t.success); setTimeout(() => window.location.reload(), 600) }; return <><Button className="mt-3 w-full" variant="outline" onClick={() => setOpen(true)}>{t.button}</Button>{open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-lblue/40 px-4"><Card className="w-full max-w-lg"><CardContent className="p-6"><h2 className="font-semibold text-lblue">{t.title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{t.hint}</p><textarea className="mt-4 min-h-28 w-full border border-lblue/15 p-3 text-sm" value={reason} placeholder={t.placeholder} onChange={(event) => setReason(event.target.value)} />{error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}<div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setOpen(false)}>{t.cancel}</Button><Button variant="gold" disabled={!reason.trim() || busy} onClick={submit}>{t.confirm}</Button></div></CardContent></Card></div> : null}</> }
