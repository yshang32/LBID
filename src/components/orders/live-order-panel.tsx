"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, FileText, Loader2, MessageSquare } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Locale = "zh" | "en"
const statuses = ["confirmed", "shipment_booked", "in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"]
const copy = {
  zh: { title: "即時訂單狀態", loading: "正在載入訂單資料", unauthenticated: "請先登入以查看訂單、文件及訊息。", failed: "未能更新訂單狀態", current: "目前狀態", route: "路線", cargo: "貨物", quote: "已接受報價", documents: "文件", messages: "訊息", saving: "儲存中", note: "只有得標的 Forwarder 可以按順序更新運輸狀態。", status: { confirmed: "已確認", shipment_booked: "已訂艙", in_transit: "運輸中", arrived_hk: "已抵達香港", customs_cleared: "已完成清關", delivered: "已送達", completed: "已完成" } },
  en: { title: "Live order status", loading: "Loading order data", unauthenticated: "Sign in to see live order, document and message data.", failed: "Status update failed", current: "Current status", route: "Route", cargo: "Cargo", quote: "Accepted quotation", documents: "Documents", messages: "Messages", saving: "Saving", note: "Only the awarded forwarder can update fulfillment status in sequence.", status: { confirmed: "Confirmed", shipment_booked: "Shipment booked", in_transit: "In transit", arrived_hk: "Arrived at destination", customs_cleared: "Customs cleared", delivered: "Delivered", completed: "Completed" } },
}

export function LiveOrderPanel({ locale, orderId }: { locale: Locale; orderId: string }) {
  const t = copy[locale]
  const [order, setOrder] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [userId, setUserId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState("")

  useEffect(() => {
    let cancelled = false
    async function load() {
      const client = getSupabaseBrowserClient()
      const { data: sessionData } = client ? await client.auth.getSession() : { data: { session: null } }
      const [orderResult, docsResult, messagesResult] = await Promise.all([apiJson(`/api/orders/${orderId}`), apiJson(`/api/orders/${orderId}/documents`), apiJson(`/api/orders/${orderId}/messages`)])
      if (cancelled) return
      setLoading(false)
      if (!orderResult.response.ok) { setError(orderResult.response.status === 401 ? t.unauthenticated : orderResult.body?.error || "ORDER_LOAD_FAILED"); return }
      setUserId(sessionData.session?.user.id || "")
      setOrder(orderResult.body.order)
      setDocuments(docsResult.response.ok ? docsResult.body.documents || [] : [])
      setMessages(messagesResult.response.ok ? messagesResult.body.messages || [] : [])
    }
    load()
    return () => { cancelled = true }
  }, [orderId, t.unauthenticated])

  const activeIndex = useMemo(() => Math.max(0, statuses.indexOf(order?.status || "confirmed")), [order?.status])
  const canManage = Boolean(userId && order?.quotations?.forwarder_id === userId)
  const quotation = order?.quotations
  const request = quotation?.shipment_requests
  const status = (order?.status || "confirmed") as keyof typeof t.status

  async function updateStatus(nextStatus: string) {
    setSaving(nextStatus); setError("")
    const { response, body } = await apiJson(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status: nextStatus }) })
    setSaving("")
    if (!response.ok) { setError(body?.error || t.failed); return }
    setOrder(body.order)
  }

  return <Card className="mt-5 border-lblue/10 bg-white"><CardHeader><CardTitle>{t.title}</CardTitle><CardDescription className="font-mono">{orderId}</CardDescription></CardHeader><CardContent>{loading ? <div className="flex items-center gap-2 rounded-md border border-lblue/10 bg-slate-50 p-4 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin text-lgold" />{t.loading}</div> : error ? <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4" />{error}</div> : <><div className="grid gap-3 md:grid-cols-4"><Metric label={t.route} value={`${request?.route?.origin || "-"} ${locale === "zh" ? "至" : "to"} ${request?.route?.destination || "-"}`} /><Metric label={t.cargo} value={request?.cargo_details?.cargo || request?.cargo_details?.cargo_type || "-"} /><Metric label={t.quote} value={quotation?.total_amount != null ? `HKD ${Number(quotation.total_amount).toLocaleString()}` : "-"} /><Metric label={t.current} value={t.status[status]} /></div><p className="mt-5 text-sm text-slate-600">{t.note}</p><div className="mt-3 grid gap-3 md:grid-cols-4 lg:grid-cols-7">{statuses.map((item, index) => <Button key={item} variant={index <= activeIndex ? "gold" : "outline"} className="h-auto min-h-16 justify-start whitespace-normal text-left" disabled={!canManage || index !== activeIndex + 1 || saving === item} onClick={() => updateStatus(item)}><CheckCircle2 className="h-4 w-4 shrink-0" />{saving === item ? t.saving : t.status[item as keyof typeof t.status]}</Button>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Metric label={t.documents} value={documents.length} icon={<FileText className="h-4 w-4" />} /><Metric label={t.messages} value={messages.length} icon={<MessageSquare className="h-4 w-4" />} /></div></>}</CardContent></Card>
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) { return <div className="rounded-md border border-lblue/10 bg-slate-50 p-3"><div className="flex items-center gap-2 text-sm text-slate-500">{icon}{label}</div><div className="mt-1 break-words font-semibold text-lblue">{value}</div></div> }
