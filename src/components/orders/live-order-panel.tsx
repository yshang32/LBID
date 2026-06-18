"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"

type Locale = "zh" | "en"

const statuses = ["confirmed", "shipment_booked", "in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"]

const copy = {
  zh: {
    title: "Live order status",
    loading: "正在載入 order 資料",
    unauthenticated: "登入後可以查看真實 order、documents 和 messages 資料。",
    documents: "Documents",
    messages: "Messages",
    saveFailed: "狀態更新失敗",
    order: "Order",
    saving: "儲存中...",
    statusLabels: {
      confirmed: "Confirmed",
      shipment_booked: "Shipment booked",
      in_transit: "In transit",
      arrived_hk: "Arrived HK",
      customs_cleared: "Customs cleared",
      delivered: "Delivered",
      completed: "Completed",
    },
  },
  en: {
    title: "Live order status",
    loading: "Loading order data",
    unauthenticated: "Sign in to see live order, document and message data.",
    documents: "Documents",
    messages: "Messages",
    saveFailed: "Status update failed",
    order: "Order",
    saving: "Saving...",
    statusLabels: {
      confirmed: "Confirmed",
      shipment_booked: "Shipment booked",
      in_transit: "In transit",
      arrived_hk: "Arrived HK",
      customs_cleared: "Customs cleared",
      delivered: "Delivered",
      completed: "Completed",
    },
  },
}

export function LiveOrderPanel({ locale, orderId }: { locale: Locale; orderId: string }) {
  const t = copy[locale]
  const [order, setOrder] = useState<any | null>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
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

      setOrder(orderResult.body.order)
      setDocuments(docsResult.response.ok ? docsResult.body.documents || [] : [])
      setMessages(messagesResult.response.ok ? messagesResult.body.messages || [] : [])
    }

    load()
    return () => {
      cancelled = true
    }
  }, [orderId, t.unauthenticated])

  const activeIndex = useMemo(() => Math.max(0, statuses.indexOf(order?.status || "confirmed")), [order?.status])

  async function updateStatus(status: string) {
    setSaving(status)
    setError("")
    const { response, body } = await apiJson(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
    setSaving("")

    if (!response.ok) {
      setError(body?.error || t.saveFailed)
      return
    }

    setOrder(body.order)
  }

  return (
    <Card className="mt-5 border-lblue/10 bg-white">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{orderId}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 rounded-md border border-lblue/10 bg-slate-50 p-4 text-sm font-semibold text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-lgold" />
            {t.loading}
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-md border border-lgold/25 bg-lgold/10 p-4 text-sm text-[#6f5514]">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div>{error}</div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-4 lg:grid-cols-7">
              {statuses.map((status, index) => (
                <Button key={status} variant={index <= activeIndex ? "gold" : "outline"} className="h-auto min-h-16 justify-start whitespace-normal text-left" disabled={saving === status} onClick={() => updateStatus(status)}>
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {saving === status ? t.saving : t.statusLabels[status as keyof typeof t.statusLabels]}
                </Button>
              ))}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Metric label={t.order} value={t.statusLabels[(order?.status || "confirmed") as keyof typeof t.statusLabels] || order?.status || "confirmed"} />
              <Metric label={t.documents} value={documents.length} />
              <Metric label={t.messages} value={messages.length} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-slate-50 p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <Badge className="mt-2" variant="teal">{value}</Badge>
    </div>
  )
}
