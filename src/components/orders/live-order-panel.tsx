"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, FileText, Loader2, MessageSquare } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Locale = "zh" | "en"
const statuses = ["confirmed", "shipment_booked", "in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"]

const copy = {
  zh: {
    title: "訂單即時狀態",
    loading: "正在讀取訂單資料",
    unauthenticated: "請登入以查看訂單、文件和訊息資料。",
    documents: "文件",
    messages: "訊息",
    saveFailed: "未能更新訂單狀態",
    current: "目前狀態",
    saving: "正在儲存",
    fulfillmentNote: "只有得標 Forwarder 可按次序更新物流狀態。",
    statusLabels: { confirmed: "已確認", shipment_booked: "已訂艙", in_transit: "運輸中", arrived_hk: "已到香港", customs_cleared: "已完成清關", delivered: "已送達", completed: "已完成" },
  },
  en: {
    title: "Live order status",
    loading: "Loading order data",
    unauthenticated: "Sign in to see live order, document and message data.",
    documents: "Documents",
    messages: "Messages",
    saveFailed: "Status update failed",
    current: "Current status",
    saving: "Saving",
    fulfillmentNote: "Only the awarded forwarder can update fulfillment status in sequence.",
    statusLabels: { confirmed: "Confirmed", shipment_booked: "Shipment booked", in_transit: "In transit", arrived_hk: "Arrived Hong Kong", customs_cleared: "Customs cleared", delivered: "Delivered", completed: "Completed" },
  },
}

export function LiveOrderPanel({ locale, orderId }: { locale: Locale; orderId: string }) {
  const t = copy[locale]
  const [order, setOrder] = useState<any | null>(null)
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
      const [orderResult, docsResult, messagesResult] = await Promise.all([
        apiJson(`/api/orders/${orderId}`),
        apiJson(`/api/orders/${orderId}/documents`),
        apiJson(`/api/orders/${orderId}/messages`),
      ])
      if (cancelled) return
      setLoading(false)
      if (orderResult.response.status === 401) {
        setError(t.unauthenticated)
        return
      }
      if (!orderResult.response.ok) {
        setError(orderResult.body?.error || "ORDER_LOAD_FAILED")
        return
      }
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

  async function updateStatus(status: string) {
    setSaving(status)
    setError("")
    const { response, body } = await apiJson(`/api/orders/${orderId}`, { method: "PATCH", body: JSON.stringify({ status }) })
    setSaving("")
    if (!response.ok) {
      setError(body?.error || t.saveFailed)
      return
    }
    setOrder(body.order)
  }

  return <Card className="mt-5 border-lblue/10 bg-white"><CardHeader><CardTitle>{t.title}</CardTitle><CardDescription className="font-mono">{orderId}</CardDescription></CardHeader><CardContent>
    {loading ? <div className="flex items-center gap-2 rounded-md border border-lblue/10 bg-slate-50 p-4 text-sm font-semibold text-slate-600"><Loader2 className="h-4 w-4 animate-spin text-lgold" />{t.loading}</div> : error ? <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 h-4 w-4" />{error}</div> : <>
      <div className="grid gap-3 md:grid-cols-4"><Metric label="Route" value={`${request?.route?.origin || "-"} to ${request?.route?.destination || "-"}`} /><Metric label="Cargo" value={request?.cargo_details?.cargo || request?.cargo_details?.cargo_type || "-"} /><Metric label="Quote" value={`${quotation?.total_amount?.toLocaleString?.() || "-"}`} /><Metric label={t.current} value={t.statusLabels[(order?.status || "confirmed") as keyof typeof t.statusLabels]} /></div>
      <p className="mt-5 text-sm text-slate-600">{t.fulfillmentNote}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-4 lg:grid-cols-7">{statuses.map((status, index) => <Button key={status} variant={index <= activeIndex ? "gold" : "outline"} className="h-auto min-h-16 justify-start whitespace-normal text-left" disabled={!canManage || index !== activeIndex + 1 || saving === status} onClick={() => updateStatus(status)}><CheckCircle2 className="h-4 w-4 shrink-0" />{saving === status ? t.saving : t.statusLabels[status as keyof typeof t.statusLabels]}</Button>)}</div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><Metric label={t.documents} value={documents.length} icon={<FileText className="h-4 w-4" />} /><Metric label={t.messages} value={messages.length} icon={<MessageSquare className="h-4 w-4" />} /></div>
    </>}
  </CardContent></Card>
}

function Metric({ label, value, icon }: { label: string; value: string | number; icon?: React.ReactNode }) {
  return <div className="rounded-md border border-lblue/10 bg-slate-50 p-3"><div className="flex items-center gap-2 text-sm text-slate-500">{icon}{label}</div><div className="mt-1 break-words font-semibold text-lblue">{value}</div></div>
}
