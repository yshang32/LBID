"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Clock3, Loader2, Send, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type Request = { id: string; route?: { origin?: string; destination?: string }; cargo_details?: { cargo?: string; cargo_type?: string; mode?: string; weight_kg?: number }; services_needed?: string[]; created_at?: string }

export default function AdminShipmentRequestsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const t = locale === "zh" ? { badge: "ADMIN / SR REVIEW", title: "審核 Shipment Requests", intro: "發佈後會立即開啟固定 3 小時密封競價窗口。只有 OPEN 需求會出現在 Forwarder Marketplace。", loading: "載入審核佇列中", empty: "目前沒有等待審核的需求。", publish: "發佈並開啟 3 小時競價", reject: "拒絕", error: "未能更新需求。" } : { badge: "ADMIN / SR REVIEW", title: "Review shipment requests", intro: "Publishing opens a fixed three-hour sealed bid window. Only OPEN requests appear in the Forwarder marketplace.", loading: "Loading review queue", empty: "No shipment requests are awaiting review.", publish: "Publish and open 3-hour window", reject: "Reject", error: "Unable to update request." }

  useEffect(() => { let cancelled = false; apiJson("/api/admin/shipment-requests").then(({ response, body }) => { if (cancelled) return; if (!response.ok) setError(body.error || t.error); else setRequests(body.shipmentRequests || []); setLoading(false) }); return () => { cancelled = true } }, [t.error])
  async function review(id: string, action: "publish" | "reject") { setBusy(id); setError(""); const { response, body } = await apiJson("/api/admin/shipment-requests", { method: "PATCH", body: JSON.stringify({ id, action }) }); setBusy(""); if (!response.ok) { setError(body.error || t.error); return }; setRequests((items) => items.filter((item) => item.id !== id)) }
  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="border-b border-lblue/10 pb-7"><Badge variant="gold">{t.badge}</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{t.intro}</p></section>{loading ? <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{t.loading}</div> : error ? <p className="mt-6 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : !requests.length ? <p className="mt-10 border border-dashed border-lblue/15 bg-white p-10 text-center text-sm text-slate-500">{t.empty}</p> : <section className="mt-6 space-y-3">{requests.map((request) => <Card key={request.id}><CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-center gap-2"><Badge variant="gold"><Clock3 className="mr-1 h-3 w-3" />PENDING REVIEW</Badge><span className="font-mono text-xs text-slate-400">{request.id}</span></div><h2 className="mt-3 font-semibold text-lblue">{request.route?.origin || "Origin"} → {request.route?.destination || "Hong Kong"}</h2><p className="mt-1 text-sm text-slate-600">{request.cargo_details?.cargo || request.cargo_details?.cargo_type || "General cargo"}{request.cargo_details?.weight_kg ? ` · ${request.cargo_details.weight_kg} kg` : ""}</p><p className="mt-2 text-xs text-slate-500">{request.services_needed?.join(" · ") || "No extra services"}</p></div><div className="flex flex-wrap items-center gap-2"><Button variant="outline" disabled={busy === request.id} onClick={() => review(request.id, "reject")}><XCircle className="h-4 w-4" />{t.reject}</Button><Button variant="gold" disabled={busy === request.id} onClick={() => review(request.id, "publish")}>{busy === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{t.publish}</Button></div></CardContent></Card>)}</section>}</main>
}
