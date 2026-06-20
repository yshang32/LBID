"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CheckCircle2, Clock3, MapPin, PackageCheck, Plus, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type TrackingEvent = {
  id?: string
  status: string
  location?: string
  description: string
  occurred_at?: string
  occurredAt?: string
}

const statuses = ["confirmed", "shipment_booked", "in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"]

const copy = {
  zh: {
    badge: "Shipment tracking",
    title: "貨件追蹤時間線",
    intro: "每個 order 都有獨立追蹤事件。Forwarder 更新狀態後，Agency 會收到 in-app notification，之後可再接航空公司 / carrier API。",
    timeline: "Tracking timeline",
    update: "新增追蹤事件",
    status: "狀態",
    location: "地點",
    description: "描述",
    save: "新增事件",
    saving: "儲存中...",
    back: "返回 Order",
    documents: "文件管理",
    awb: "Smart AWB",
    empty: "暫時未有追蹤事件",
    error: "未能更新追蹤事件，請稍後再試。",
    carrierReady: "Carrier API ready",
    carrierText: "目前先支援手動更新；未來可接航空公司、船公司或 last-mile tracking provider webhook。",
  },
  en: {
    badge: "Shipment tracking",
    title: "Shipment tracking timeline",
    intro: "Each order has its own tracking events. When forwarders update status, agencies receive in-app notifications. This can later connect to carrier APIs.",
    timeline: "Tracking timeline",
    update: "Add tracking event",
    status: "Status",
    location: "Location",
    description: "Description",
    save: "Add event",
    saving: "Saving...",
    back: "Back to Order",
    documents: "Documents",
    awb: "Smart AWB",
    empty: "No tracking events yet",
    error: "Unable to update tracking. Please try again.",
    carrierReady: "Carrier API ready",
    carrierText: "Manual updates are supported now; airline, ocean carrier or last-mile webhooks can be connected later.",
  },
}

export default function TrackingPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [events, setEvents] = useState<TrackingEvent[]>([])
  const [form, setForm] = useState({ status: "in_transit", location: "HKG", description: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    refresh()
  }, [])

  async function refresh() {
    const { response, body } = await apiJson(`/api/orders/${params.id}/tracking`)
    if (response.ok) setEvents(Array.isArray(body.tracking) ? body.tracking : [])
  }

  async function addEvent() {
    if (!form.description) return
    setLoading(true)
    setError("")
    const { response, body } = await apiJson(`/api/orders/${params.id}/tracking`, {
      method: "POST",
      body: JSON.stringify(form),
    })
    setLoading(false)
    if (!response.ok) {
      setError(body.error || t.error)
      return
    }
    setForm((current) => ({ ...current, description: "" }))
    await refresh()
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
        <Badge variant="gold">{t.badge}</Badge>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <Truck className="h-5 w-5 text-lgold" />
            <CardTitle>{t.timeline}</CardTitle>
            <CardDescription>{params.id}</CardDescription>
          </CardHeader>
          <CardContent>
            {events.length ? (
              <div className="space-y-3">
                {events.map((event, index) => (
                  <div key={`${event.id || event.status}-${index}`} className="grid gap-3 rounded-lg border border-lblue/10 bg-slate-50 p-4 sm:grid-cols-[auto_1fr]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lgold/15 text-lgold">
                      {index === events.length - 1 ? <PackageCheck className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={index === events.length - 1 ? "gold" : "teal"}>{event.status}</Badge>
                        {event.location ? (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-lblue">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 font-semibold text-lblue">{event.description}</p>
                      <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock3 className="h-3.5 w-3.5" />
                        {new Date(event.occurred_at || event.occurredAt || Date.now()).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-lblue/20 bg-slate-50 p-8 text-center text-muted-foreground">{t.empty}</div>
            )}
          </CardContent>
        </Card>

        <aside className="space-y-5">
          <Card>
            <CardHeader>
              <Plus className="h-5 w-5 text-lgold" />
              <CardTitle>{t.update}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="space-y-2 text-sm font-semibold text-lblue">
                {t.status}
                <Select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                </Select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-lblue">
                {t.location}
                <Input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              </label>
              <label className="space-y-2 text-sm font-semibold text-lblue">
                {t.description}
                <Textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
              </label>
              {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
              <Button className="w-full" variant="gold" disabled={loading || !form.description} onClick={addEvent}>
                {loading ? t.saving : t.save}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-lgold/30 bg-lgold/10">
            <CardHeader>
              <CardTitle>{t.carrierReady}</CardTitle>
              <CardDescription>{t.carrierText}</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardContent className="grid gap-2 p-5">
              <Button asChild variant="outline">
                <Link href={`/${locale}/orders/${params.id}`}>{t.back}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/orders/${params.id}/documents`}>{t.documents}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/orders/${params.id}/awb`}>{t.awb}</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  )
}
