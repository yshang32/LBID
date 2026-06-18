"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Clock3, LockKeyhole, Rocket, ShieldCheck, Star, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { v4ShipmentRequests } from "@/lib/v4"

type Locale = "zh" | "en"

type LiveRequest = {
  id: string
  route?: { origin?: string; destination?: string }
  cargo_details?: { cargo?: string; cargo_type?: string; weight_kg?: number; cbm?: number; budget?: string }
  services_needed?: string[]
  bid_deadline?: string
  status?: string
}

const copy = {
  zh: {
    bid: "提交 sealed bid",
    priority: "Priority Bid",
    sealed: "Sealed bid：競爭者報價會保持隱藏，限時完結後才揭示結果。",
    detail: "查看 SR 詳情",
    deadline: "Deadline",
    slots: "slots",
    left: "left",
    live: "Live",
    empty: "暫時未有 open SR。",
  },
  en: {
    bid: "Submit sealed bid",
    priority: "Priority Bid",
    sealed: "Sealed bid: competitor prices stay hidden until the bid window closes.",
    detail: "View SR detail",
    deadline: "Deadline",
    slots: "slots",
    left: "left",
    live: "Live",
    empty: "No open SRs yet.",
  },
}

export function LiveMarketplaceList({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [liveRequests, setLiveRequests] = useState<LiveRequest[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { response, body } = await apiJson("/api/shipment-requests")
      if (!cancelled && response.ok) {
        setLiveRequests(body.shipmentRequests || [])
        setLoaded(true)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const cards = useMemo(() => {
    if (!loaded || liveRequests.length === 0) return v4ShipmentRequests.map((request) => ({ type: "demo" as const, request }))
    return liveRequests.map((request) => ({ type: "live" as const, request }))
  }, [liveRequests, loaded])

  if (loaded && liveRequests.length === 0 && v4ShipmentRequests.length === 0) {
    return <div className="rounded-lg border border-lblue/10 bg-white p-6 text-muted-foreground">{t.empty}</div>
  }

  return (
    <section className="mt-6 grid gap-4 lg:grid-cols-3">
      {cards.map((card) => {
        if (card.type === "live") {
          return <LiveCard key={card.request.id} request={card.request} locale={locale} />
        }
        return <DemoCard key={card.request.id} request={card.request} locale={locale} />
      })}
    </section>
  )
}

function LiveCard({ request, locale }: { request: LiveRequest; locale: Locale }) {
  const t = copy[locale]
  const origin = request.route?.origin || "Origin"
  const destination = request.route?.destination || "Hong Kong"
  const cargo = request.cargo_details?.cargo || request.cargo_details?.cargo_type || "General cargo"
  const deadline = request.bid_deadline ? new Date(request.bid_deadline).toLocaleString(locale === "zh" ? "zh-HK" : "en-HK", { dateStyle: "short", timeStyle: "short" }) : "3h"

  return (
    <Card className="border-lgold/35">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant="gold">{t.live}</Badge>
            <CardTitle className="mt-3">{origin} → {destination}</CardTitle>
          </div>
          <Deadline label={t.deadline} value={deadline} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-semibold text-lblue">{cargo}</div>
          <div className="text-sm text-muted-foreground">
            {(request.services_needed || []).join(", ") || "Service details pending"}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Mini icon={Star} label="Budget" value={request.cargo_details?.budget || "Sealed"} />
          <Mini icon={Users} label="Status" value={request.status || "OPEN"} />
        </div>
        <SealedNote text={t.sealed} />
        <Actions locale={locale} id={request.id} />
      </CardContent>
    </Card>
  )
}

function DemoCard({ request, locale }: { request: typeof v4ShipmentRequests[number]; locale: Locale }) {
  const t = copy[locale]
  const remaining = request.totalSlots - request.usedSlots
  const filled = Math.round((request.usedSlots / request.totalSlots) * 100)

  return (
    <Card className={request.hot ? "border-red-200" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <Badge variant={request.hot ? "gold" : "secondary"}>{request.id}</Badge>
            <CardTitle className="mt-3">{locale === "zh" ? request.lane : request.laneEn}</CardTitle>
          </div>
          <Deadline label={t.deadline} value={request.deadline} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="font-semibold text-lblue">{request.cargo}</div>
          <div className="text-sm text-muted-foreground">{request.routeMask}</div>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-sm font-semibold">
            <span>{request.usedSlots}/{request.totalSlots} {t.slots}</span>
            <span className={remaining <= 2 ? "text-red-600" : "text-lblue"}>{t.left} {remaining}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${remaining <= 2 ? "bg-red-600" : "bg-lgold"}`} style={{ width: `${filled}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Mini icon={Star} label="Score" value={`>= ${request.reputationRequired}`} />
          <Mini icon={Users} label="Budget" value={request.budgetLevel} />
        </div>
        <SealedNote text={t.sealed} />
        <Actions locale={locale} id={request.id} />
      </CardContent>
    </Card>
  )
}

function Deadline({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-red-50 px-2 py-1 text-right text-red-700">
      <Clock3 className="ml-auto h-4 w-4" />
      <div className="text-[10px] font-bold uppercase">{label}</div>
      <div className="font-mono text-sm font-black">{value}</div>
    </div>
  )
}

function Mini({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-white p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3 w-3 text-lgold" />
        {label}
      </div>
      <div className="font-black text-lblue">{value}</div>
    </div>
  )
}

function SealedNote({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm text-muted-foreground">
      <LockKeyhole className="mr-1 inline h-4 w-4 text-lgold" />
      {text}
    </div>
  )
}

function Actions({ locale, id }: { locale: Locale; id: string }) {
  const t = copy[locale]
  return (
    <div className="flex flex-col gap-2">
      <Button asChild variant="gold">
        <Link href={`/${locale}/marketplace/${id}`}>{t.bid}</Link>
      </Button>
      <Button asChild variant="outline">
        <Link href={`/${locale}/marketplace/${id}`}>
          <Rocket className="h-4 w-4" />
          {t.priority}
        </Link>
      </Button>
      <Button asChild variant="ghost">
        <Link href={`/${locale}/marketplace/${id}`}>{t.detail}</Link>
      </Button>
    </div>
  )
}
