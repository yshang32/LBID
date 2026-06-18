"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Bell, Calculator, CheckCircle2, ClipboardList, Coins, PackageSearch, Plane, Send, ShieldCheck, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4Status } from "@/lib/v4"

const copy = {
  zh: {
    badge: "Create Shipment Request",
    title: "以 Client 身份建立一張 SR。",
    intro: "每間公司都可以同時是 Client 和 Forwarder。提交後，LBID 會把 SR 放入 sealed bidding 流程，讓合資格 Forwarder 在限時內提交報價。",
    basics: "SR 基本資料",
    cargo: "貨物資料",
    commercial: "商業條件",
    matching: "配對預覽",
    mode: "運輸模式",
    origin: "出發地",
    destination: "目的地",
    shipDate: "預計出貨日期",
    deadline: "Bid 截止時間",
    cargoType: "貨物類型",
    commodity: "貨物描述",
    grossWeight: "總毛重 kg",
    volume: "總體積 CBM",
    pieces: "件數 / 箱數",
    incoterms: "Incoterms",
    budget: "預算範圍",
    services: "需要服務",
    notes: "額外要求",
    chargeable: "Chargeable weight",
    formula: "空運 volumetric = CBM x 167。LBID 會用 gross weight 和 volumetric weight 之間較高者。",
    quota: "本月 SR quota",
    quotaText: "Standard member 每月有 5 張 SR。超出 quota 後，每張 SR 扣 1 Token。",
    quotaUsed: "已使用 4 / 5",
    costFree: "今次不扣 Token",
    costOver: "額外建立 -1 Token",
    submit: "提交 SR",
    submitting: "提交中...",
    submitted: "SR 已建立",
    reference: "SR reference",
    viewMarket: "查看 SR / Marketplace",
    dashboard: "Client dashboard",
    notice: "審核或發布後，Forwarder 只會先看到路線、貨物類型、範圍和 bid window。完整聯絡資料只會在 award 後解鎖。",
    matched: "預計可配對 5 個合資格 Forwarder",
    window: "固定 3 小時 sealed bid window",
    hidden: "Client 名稱、聯絡人和完整地址會先隱藏",
    tokenAfter: "提交後 Token 餘額",
    serviceOptions: ["清關", "倉儲", "香港本地派送", "Door-to-Door", "冷鏈", "危險品"],
  },
  en: {
    badge: "Create Shipment Request",
    title: "Create an SR as the Client side.",
    intro: "Every company can be both Client and Forwarder. After submission, LBID opens a sealed bidding workflow for qualified forwarders.",
    basics: "SR basics",
    cargo: "Cargo details",
    commercial: "Commercial conditions",
    matching: "Matching preview",
    mode: "Shipment mode",
    origin: "Origin",
    destination: "Destination",
    shipDate: "Estimated ship date",
    deadline: "Bid deadline",
    cargoType: "Cargo type",
    commodity: "Commodity description",
    grossWeight: "Total gross weight kg",
    volume: "Total volume CBM",
    pieces: "Pieces / cartons",
    incoterms: "Incoterms",
    budget: "Budget range",
    services: "Services needed",
    notes: "Additional requirements",
    chargeable: "Chargeable weight",
    formula: "Air volumetric = CBM x 167. LBID uses the higher of gross and volumetric weight.",
    quota: "Monthly SR quota",
    quotaText: "Standard members get 5 SRs per month. Extra SRs cost 1 token.",
    quotaUsed: "Used 4 / 5",
    costFree: "No token cost this time",
    costOver: "Extra SR -1 Token",
    submit: "Submit SR",
    submitting: "Submitting...",
    submitted: "SR created",
    reference: "SR reference",
    viewMarket: "View SR / Marketplace",
    dashboard: "Client dashboard",
    notice: "After review or publish, forwarders first see route, cargo category, ranges and bid window only. Full contacts unlock after award.",
    matched: "Estimated 5 qualified forwarders matched",
    window: "Fixed 3-hour sealed bid window",
    hidden: "Client name, contact and full address are hidden first",
    tokenAfter: "Token balance after submit",
    serviceOptions: ["Customs clearance", "Warehousing", "HK local delivery", "Door-to-Door", "Cold chain", "Dangerous goods"],
  },
}

export default function NewInquiryPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [mode, setMode] = useState("air")
  const [grossWeight, setGrossWeight] = useState(420)
  const [volume, setVolume] = useState(3)
  const [selectedServices, setSelectedServices] = useState<string[]>([t.serviceOptions[0], t.serviceOptions[2]])
  const [overQuota, setOverQuota] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [origin, setOrigin] = useState("Ho Chi Minh City, Vietnam")
  const [destination, setDestination] = useState("Hong Kong, Kwai Chung / Airport area")
  const [shipDate, setShipDate] = useState("2026-07-08")
  const [bidDeadline, setBidDeadline] = useState("2026-07-07T18:00")
  const [commodity, setCommodity] = useState("Chilled food samples, non-DG")
  const [pieces, setPieces] = useState("18")
  const [notes, setNotes] = useState("Temperature controlled handling preferred. Client contact unlocks after award only.")
  const [srReference, setSrReference] = useState("SR-2026-00126")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const volumetricWeight = Math.round(volume * 167)
  const chargeableWeight = mode === "air" ? Math.max(grossWeight, volumetricWeight) : grossWeight
  const tokenAfterSubmit = useMemo(() => Math.max(0, v4Status.tokens - (overQuota ? 1 : 0)), [overQuota])

  function toggleService(service: string) {
    setSelectedServices((items) => items.includes(service) ? items.filter((item) => item !== service) : [...items, service])
  }

  async function submitShipmentRequest() {
    setSubmitting(true)
    setError("")

    const { response, body } = await apiJson("/api/shipment-requests", {
      method: "POST",
      body: JSON.stringify({
        mode,
        origin,
        destination,
        shipDate: new Date(`${shipDate}T00:00:00`).toISOString(),
        bidDeadline: new Date(bidDeadline).toISOString(),
        commodity,
        grossWeight,
        volume,
        pieces: Number(pieces) || 0,
        servicesNeeded: selectedServices,
        notes,
        status: "OPEN",
      }),
    })

    setSubmitting(false)
    if (!response.ok) {
      setError(body.error || "Unable to submit shipment request")
      return
    }

    setSrReference(body.shipmentRequest?.id || "SR-2026-00126")
    setSubmitted(true)
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[1fr_360px] lg:pb-10">
      <section className="space-y-5">
        <div className="rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>

        <Card>
          <CardHeader>
            <Plane className="h-5 w-5 text-lgold" />
            <CardTitle>{t.basics}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">
              {t.mode}
              <Select value={mode} onChange={(event) => setMode(event.target.value)}>
                <option value="air">Air Freight</option>
                <option value="sea-fcl">Sea Freight FCL</option>
                <option value="sea-lcl">Sea Freight LCL</option>
                <option value="truck">Cross-border Truck</option>
              </Select>
            </label>
            <label className="space-y-2 text-sm font-semibold">{t.origin}<Input value={origin} onChange={(event) => setOrigin(event.target.value)} /></label>
            <label className="space-y-2 text-sm font-semibold">{t.destination}<Input value={destination} onChange={(event) => setDestination(event.target.value)} /></label>
            <label className="space-y-2 text-sm font-semibold">{t.shipDate}<Input type="date" value={shipDate} onChange={(event) => setShipDate(event.target.value)} /></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">{t.deadline}<Input type="datetime-local" value={bidDeadline} onChange={(event) => setBidDeadline(event.target.value)} /></label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <PackageSearch className="h-5 w-5 text-lgold" />
            <CardTitle>{t.cargo}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">{t.cargoType}<Select defaultValue="general"><option value="general">General Cargo</option><option>Dangerous Goods</option><option>Cold Chain</option><option>Oversized</option></Select></label>
            <label className="space-y-2 text-sm font-semibold">{t.commodity}<Input value={commodity} onChange={(event) => setCommodity(event.target.value)} /></label>
            <label className="space-y-2 text-sm font-semibold">{t.pieces}<Input type="number" value={pieces} onChange={(event) => setPieces(event.target.value)} /></label>
            <label className="space-y-2 text-sm font-semibold">{t.grossWeight}<Input type="number" value={grossWeight} onChange={(event) => setGrossWeight(Number(event.target.value) || 0)} /></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">{t.volume}<Input type="number" value={volume} onChange={(event) => setVolume(Number(event.target.value) || 0)} /></label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <ClipboardList className="h-5 w-5 text-lgold" />
            <CardTitle>{t.commercial}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">{t.incoterms}<Select defaultValue="FOB"><option>EXW</option><option>FOB</option><option>CIF</option><option>DAP</option><option>DDP</option></Select></label>
            <label className="space-y-2 text-sm font-semibold">{t.budget}<Select defaultValue="medium"><option>HKD 3,000 - 6,000</option><option value="medium">HKD 6,000 - 12,000</option><option>HKD 12,000+</option><option>Prefer not to show</option></Select></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">{t.notes}<Textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.services}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {t.serviceOptions.map((service) => (
              <label key={service} className="flex cursor-pointer items-center gap-3 rounded-md border border-lblue/10 bg-slate-50 p-3">
                <input type="checkbox" checked={selectedServices.includes(service)} onChange={() => toggleService(service)} />
                <span className="text-sm font-semibold text-lblue">{service}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-5">
        <Card className="sticky top-24 border-lgold/30 bg-white">
          <CardHeader>
            <Calculator className="h-5 w-5 text-lgold" />
            <CardTitle>{t.chargeable}</CardTitle>
            <CardDescription>{t.formula}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Metric label="Gross" value={`${grossWeight.toLocaleString()} kg`} />
            <Metric label="Volumetric" value={`${volumetricWeight.toLocaleString()} kg`} />
            <div className="rounded-md border border-lgold/30 bg-lgold/10 p-4">
              <div className="text-sm text-muted-foreground">{t.chargeable}</div>
              <div className="mt-1 text-3xl font-black text-lblue">{chargeableWeight.toLocaleString()} kg</div>
            </div>
            <Button className="w-full" variant="gold" disabled={submitting} onClick={submitShipmentRequest}>
              <Send className="h-4 w-4" />
              {submitting ? t.submitting : t.submit}
            </Button>
            {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Coins className="h-5 w-5 text-lgold" />
            <CardTitle>{t.quota}</CardTitle>
            <CardDescription>{t.quotaText}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border border-lblue/10 bg-slate-50 p-3">
              <div className="text-sm text-muted-foreground">{t.quotaUsed}</div>
              <div className="mt-2 h-2 rounded-full bg-white">
                <div className="h-full w-4/5 rounded-full bg-lgold" />
              </div>
            </div>
            <label className="flex items-center gap-3 rounded-md border border-lblue/10 bg-white p-3 text-sm font-semibold text-lblue">
              <input type="checkbox" checked={overQuota} onChange={(event) => setOverQuota(event.target.checked)} />
              {overQuota ? t.costOver : t.costFree}
            </label>
            <Metric label={t.tokenAfter} value={`${tokenAfterSubmit}`} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Bell className="h-5 w-5 text-lgold" />
            <CardTitle>{t.matching}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <Line text={t.matched} />
            <Line text={t.window} />
            <Line text={t.hidden} />
            <div className="rounded-md border border-lblue/10 bg-slate-50 p-3">
              <ShieldCheck className="mr-1 inline h-4 w-4 text-lgold" />
              {t.notice}
            </div>
          </CardContent>
        </Card>

        {submitted ? (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <Sparkles className="h-5 w-5 text-green-700" />
              <CardTitle>{t.submitted}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{t.reference}</div>
              <div className="break-all font-mono text-2xl font-black text-lblue">{srReference}</div>
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild variant="gold">
                  <Link href={`/${locale}/marketplace/${srReference}`}>{t.viewMarket}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/${locale}/dashboard?role=agency`}>{t.dashboard}</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </aside>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-slate-50 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-black text-lblue">{value}</div>
    </div>
  )
}

function Line({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
      {text}
    </div>
  )
}
