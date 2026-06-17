"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, Clock3, FileLock2, LockKeyhole, Rocket, ShieldCheck, Star, Users } from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4ShipmentRequests, v4Status } from "@/lib/v4"

const copy = {
  zh: {
    back: "返回接單市場",
    verified: "已驗證 Client",
    deadline: "截標倒數",
    slots: "名額",
    left: "剩",
    cargo: "貨物資訊",
    location: "地點",
    budget: "預算",
    mode: "運輸方式",
    masked: "中標後解鎖完整地址",
    sealedTitle: "已有 Bid",
    sealedExplain: "其他 Forwarder 嘅報價對你隱藏，避免價格戰底層化。",
    yourBid: "你嘅 Bid",
    price: "輸入報價",
    transit: "Transit Time",
    remarks: "條款備註",
    submit: "立即提交 Bid -1 Token",
    priority: "Priority Bid -2 Tokens",
    confirmTitle: "確認你嘅 Bid",
    tokenCost: "費用",
    remaining: "提交後剩餘 Token",
    confirm: "確認提交",
    edit: "返回修改",
    success: "Bid 已提交！Client 會收到密封報價通知。",
  },
  en: {
    back: "Back to Marketplace",
    verified: "Verified Client",
    deadline: "Deadline",
    slots: "Slots",
    left: "left",
    cargo: "Cargo information",
    location: "Location",
    budget: "Budget",
    mode: "Transport mode",
    masked: "Full address unlocks after award",
    sealedTitle: "Existing bids",
    sealedExplain: "Other forwarder prices are hidden from you to avoid race-to-the-bottom pricing.",
    yourBid: "Your Bid",
    price: "Bid amount",
    transit: "Transit Time",
    remarks: "Terms and remarks",
    submit: "Submit Bid -1 Token",
    priority: "Priority Bid -2 Tokens",
    confirmTitle: "Confirm your Bid",
    tokenCost: "Cost",
    remaining: "Remaining tokens after submission",
    confirm: "Confirm submission",
    edit: "Back to edit",
    success: "Bid submitted. The client will receive the sealed quotation notice.",
  },
}

export default function MarketplaceDetailPage({ params }: { params: { locale: string; id: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale as Locale
  const t = copy[locale]
  const request = v4ShipmentRequests.find((item) => item.id === params.id) ?? makeLiveRequest(params.id)
  if (!request) notFound()

  const [amount, setAmount] = useState("1500")
  const [transit, setTransit] = useState("5 days")
  const [remarks, setRemarks] = useState("Includes local delivery and document handling.")
  const [confirming, setConfirming] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [bidId, setBidId] = useState("")
  const remaining = request.totalSlots - request.usedSlots
  const filled = Math.round((request.usedSlots / request.totalSlots) * 100)
  const remainingTokens = Math.max(0, v4Status.tokens - request.tokenCost)

  const hiddenBids = useMemo(() => [
    { name: "Forwarder A", score: 42, transit: "5-7 days" },
    { name: "Forwarder B", score: 38, transit: "6 days" },
    { name: "Forwarder C", score: 51, transit: "4-5 days" },
  ].slice(0, request.usedSlots), [request.usedSlots])

  async function submitBid() {
    setSubmitting(true)
    setError("")

    const { response, body } = await apiJson("/api/bids", {
      method: "POST",
      body: JSON.stringify({
        sr_id: params.id,
        price: Number(amount),
        currency: "HKD",
        transit_time: transit,
        terms: remarks,
      }),
    })

    setSubmitting(false)
    if (!response.ok) {
      setError(body.error || "Unable to submit bid")
      return
    }

    setBidId(body.bid_id || body.bid?.id || "")
    setConfirming(false)
    setSubmitted(true)
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <Button asChild variant="ghost">
        <Link href={`/${locale}/marketplace`}>
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
      </Button>

      <section className="mt-4 rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge variant="gold">{request.id}</Badge>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-lblue sm:text-6xl">
              {locale === "zh" ? request.lane : request.laneEn}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="teal">{t.verified} #0091</Badge>
              <Badge variant="secondary">Score {request.reputationRequired}+</Badge>
              <Badge variant="secondary">{request.flags}</Badge>
            </div>
          </div>
          <div className="rounded-md bg-red-50 px-4 py-3 text-right text-red-700">
            <div className="flex items-center justify-end gap-2 text-sm font-black uppercase">
              <Clock3 className="h-4 w-4" />
              {t.deadline}
            </div>
            <div className="font-mono text-3xl font-black">{request.deadline}</div>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between text-sm font-semibold">
            <span>{t.slots}: {request.usedSlots}/{request.totalSlots}</span>
            <span className={remaining <= 2 ? "text-red-600" : "text-lblue"}>{t.left} {remaining}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${remaining <= 2 ? "bg-red-600" : "bg-lgold"}`} style={{ width: `${filled}%` }} />
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>{t.cargo}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Info label="Cargo" value={request.cargo} />
              <Info label={t.mode} value={request.mode} />
              <Info label="Volume" value={request.id === "SR-2026-00123" ? "20ft FCL" : "15-20 CBM range"} />
              <Info label="Target date" value="2026 年 7 月第 2 週" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.location}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Info label="Visible route" value={request.routeMask} />
              <Info label="Full address" value={t.masked} />
              <Info label={t.budget} value={`${request.budgetLevel} medium-high`} />
              <Info label={t.mode} value={request.mode} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <FileLock2 className="h-5 w-5 text-lgold" />
              <CardTitle>{t.sealedTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm text-muted-foreground">
                <LockKeyhole className="mr-1 inline h-4 w-4 text-lgold" />
                {t.sealedExplain}
              </div>
              {hiddenBids.map((bid) => (
                <div key={bid.name} className="rounded-md border border-lblue/10 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-black text-lblue">{bid.name} <span className="text-muted-foreground">({bid.score})</span></div>
                    <Badge variant="secondary">****</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">Transit Time: {bid.transit}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit border-lgold/30">
          <CardHeader>
            <CardTitle>{t.yourBid}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="space-y-2 text-sm font-semibold">
              {t.price}
              <Input value={amount} onChange={(event) => setAmount(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              {t.transit}
              <Input value={transit} onChange={(event) => setTransit(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              {t.remarks}
              <Textarea value={remarks} onChange={(event) => setRemarks(event.target.value)} />
            </label>
            <Button className="w-full" variant="gold" onClick={() => setConfirming(true)}>
              {t.submit}
            </Button>
            <Button className="w-full" variant="outline">
              <Rocket className="h-4 w-4" />
              {t.priority}
            </Button>
            {submitted ? (
              <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
                <CheckCircle2 className="mr-1 inline h-4 w-4" />
                {t.success}
                {bidId ? <div className="mt-1 break-all font-mono text-xs">Bid ID: {bidId}</div> : null}
                {bidId ? (
                  <Button asChild className="mt-3 w-full" variant="outline">
                    <Link href={`/${locale}/quotations/compare?bidId=${bidId}`}>Review / accept bid</Link>
                  </Button>
                ) : null}
              </div>
            ) : null}
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </section>

      {confirming ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-lblue/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-lblue/10 bg-white p-5 shadow-2xl">
            <h2 className="text-2xl font-black text-lblue">{t.confirmTitle}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <ConfirmLine label={t.price} value={`HKD ${Number(amount || 0).toLocaleString()}`} />
              <ConfirmLine label={t.transit} value={transit} />
              <ConfirmLine label={t.tokenCost} value={`${request.tokenCost} Token`} />
              <ConfirmLine label={t.remaining} value={`${remainingTokens}`} />
            </div>
            <div className="mt-5 flex gap-2">
              <Button className="flex-1" variant="outline" onClick={() => setConfirming(false)}>{t.edit}</Button>
              <Button className="flex-1" variant="gold" disabled={submitting} onClick={submitBid}>
                {submitting ? "Submitting..." : t.confirm}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

function makeLiveRequest(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return null

  return {
    id,
    lane: "即時 SR",
    laneEn: "Live shipment request",
    flags: "Live",
    cargo: "Shipment request created from LBID",
    routeMask: "Origin -> Hong Kong",
    mode: "Air / Sea",
    deadline: "3h",
    usedSlots: 0,
    totalSlots: 5,
    reputationRequired: 0,
    budgetLevel: "sealed",
    tokenCost: 1,
    hot: false,
  }
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-slate-50 p-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-black text-lblue">{value}</div>
    </div>
  )
}

function ConfirmLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-lblue/10 bg-slate-50 p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-black text-lblue">{value}</span>
    </div>
  )
}
