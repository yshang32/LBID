"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, PackageSearch, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type FormState = {
  mode: string
  origin: string
  destination: string
  shipDate: string
  cargoType: string
  commodity: string
  grossWeight: string
  volume: string
  pieces: string
  incoterm: string
  budget: string
  services: string[]
  notes: string
}

const services = ["customs_clearance", "warehousing", "local_delivery", "door_to_door", "cold_chain", "dangerous_goods"]

const text = {
  zh: {
    badge: "建立 Shipment Request",
    title: "用三步建立一個清楚的物流需求。",
    intro: "提交後會先由平台審核；確認資料後，系統才會開啟固定 3 小時的密封競價。",
    steps: ["運輸與路線", "貨物與服務", "確認並提交"],
    next: "下一步",
    back: "上一步",
    transport: "運輸與路線",
    cargo: "貨物與服務",
    confirm: "確認資料",
    mode: "運輸方式",
    origin: "出發地",
    destination: "目的地",
    shipDate: "預計出貨日期",
    cargoType: "貨物類型",
    commodity: "貨物描述",
    weight: "總毛重（kg）",
    volume: "總體積（CBM）",
    pieces: "件數／箱數",
    incoterm: "貿易條款",
    budget: "預算範圍",
    services: "需要的服務",
    notes: "補充要求",
    platformReview: "平台會先核對需求，確認後才開標。你不需要在這裡設定競價截止時間。",
    sealed: "開標後，Forwarder 只會看見運輸需求摘要；聯絡資料及完整地址會在中標後才解鎖。",
    submit: "提交供平台審核",
    submitting: "正在提交",
    submitted: "Shipment Request 已提交",
    submittedBody: "你的需求現正等待平台審核。通過後會自動開啟 3 小時密封競價。",
    openRequest: "查看需求狀態",
    dashboard: "返回工作台",
    required: "請先完成此步的必填資料。",
    serviceNames: ["清關", "倉儲", "香港本地派送", "門到門", "冷鏈", "危險品"],
  },
  en: {
    badge: "Create Shipment Request",
    title: "Create a clear logistics request in three steps.",
    intro: "LBID reviews each request first. Once confirmed, a fixed three-hour sealed bid window opens automatically.",
    steps: ["Route", "Cargo & services", "Review & submit"],
    next: "Continue",
    back: "Back",
    transport: "Transport and route",
    cargo: "Cargo and services",
    confirm: "Review your request",
    mode: "Shipment mode",
    origin: "Origin",
    destination: "Destination",
    shipDate: "Estimated ship date",
    cargoType: "Cargo type",
    commodity: "Commodity description",
    weight: "Total gross weight (kg)",
    volume: "Total volume (CBM)",
    pieces: "Pieces / cartons",
    incoterm: "Incoterm",
    budget: "Budget range",
    services: "Services needed",
    notes: "Additional requirements",
    platformReview: "The platform verifies the request before opening bidding. You do not set the bid deadline here.",
    sealed: "Before award, forwarders see only the requirement summary. Contacts and the full address unlock after award.",
    submit: "Submit for platform review",
    submitting: "Submitting",
    submitted: "Shipment request submitted",
    submittedBody: "Your request is waiting for platform review. A three-hour sealed bid window opens automatically after approval.",
    openRequest: "View request status",
    dashboard: "Return to workspace",
    required: "Complete the required fields before continuing.",
    serviceNames: ["Customs clearance", "Warehousing", "Hong Kong delivery", "Door-to-door", "Cold chain", "Dangerous goods"],
  },
}

export default function NewInquiryPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = text[locale]
  const [step, setStep] = useState(0)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [requestId, setRequestId] = useState("")
  const [form, setForm] = useState<FormState>({
    mode: "air",
    origin: "",
    destination: "Hong Kong",
    shipDate: dateForInput(7),
    cargoType: "general",
    commodity: "",
    grossWeight: "",
    volume: "",
    pieces: "",
    incoterm: "FOB",
    budget: "not_disclosed",
    services: ["customs_clearance"],
    notes: "",
  })

  const chargeableWeight = useMemo(() => {
    const gross = Number(form.grossWeight) || 0
    const volumetric = Math.round((Number(form.volume) || 0) * 167)
    return form.mode === "air" ? Math.max(gross, volumetric) : gross
  }, [form.grossWeight, form.mode, form.volume])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((current) => ({ ...current, [key]: value }))
  const canContinue = step === 0
    ? Boolean(form.origin.trim() && form.destination.trim() && form.shipDate)
    : step === 1
      ? Boolean(form.commodity.trim() && Number(form.grossWeight) > 0 && form.services.length > 0)
      : true

  function move(next: number) {
    if (next > step && !canContinue) {
      setError(t.required)
      return
    }
    setError("")
    setStep(next)
  }

  function toggleService(service: string) {
    set("services", form.services.includes(service) ? form.services.filter((item) => item !== service) : [...form.services, service])
  }

  async function submit() {
    if (!canContinue) {
      setError(t.required)
      return
    }
    setSubmitting(true)
    setError("")
    const { response, body } = await apiJson("/api/shipment-requests", {
      method: "POST",
      body: JSON.stringify({
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        shipDate: new Date(`${form.shipDate}T00:00:00`).toISOString(),
        cargoType: form.cargoType,
        commodity: form.commodity.trim(),
        grossWeight: Number(form.grossWeight),
        volume: Number(form.volume) || 0,
        pieces: Number(form.pieces) || 0,
        mode: form.mode,
        incoterm: form.incoterm,
        budget: form.budget,
        servicesNeeded: form.services,
        notes: form.notes.trim() || null,
      }),
    })
    setSubmitting(false)
    if (!response.ok) {
      setError(body.error || "REQUEST_CREATE_FAILED")
      return
    }
    setRequestId(body.shipmentRequest?.id || "")
  }

  if (requestId) {
    return <main className="mx-auto grid min-h-[70vh] w-full max-w-2xl place-items-center px-4 py-10"><Card className="w-full border-emerald-200"><CardHeader><CheckCircle2 className="h-7 w-7 text-emerald-600" /><CardTitle>{t.submitted}</CardTitle><CardDescription>{t.submittedBody}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="rounded-md bg-slate-50 p-4 font-mono text-sm text-lblue">{requestId}</div><Button asChild className="w-full" variant="gold"><Link href={`/${locale}/requests/${requestId}`}>{t.openRequest}<ArrowRight className="h-4 w-4" /></Link></Button><Button asChild className="w-full" variant="outline"><Link href={`/${locale}/dashboard`}>{t.dashboard}</Link></Button></CardContent></Card></main>
  }

  return <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-7 sm:px-6 lg:pb-10">
    <section className="border-b border-lblue/10 pb-7"><Badge variant="gold">{t.badge}</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{t.intro}</p></section>
    <ol className="mt-7 grid gap-3 sm:grid-cols-3">{t.steps.map((label, index) => <li key={label} className={`flex items-center gap-3 border p-3 ${index === step ? "border-[#c9a84c] bg-[#fcf8ec]" : index < step ? "border-emerald-200 bg-emerald-50" : "border-lblue/10 bg-white"}`}><span className={`grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${index <= step ? "bg-lblue text-white" : "bg-slate-100 text-slate-500"}`}>{index < step ? <CheckCircle2 className="h-4 w-4" /> : index + 1}</span><span className="text-sm font-semibold text-lblue">{label}</span></li>)}</ol>
    <Card className="mt-5"><CardHeader>{step === 0 ? <><ClipboardList className="h-5 w-5 text-lgold" /><CardTitle>{t.transport}</CardTitle></> : step === 1 ? <><PackageSearch className="h-5 w-5 text-lgold" /><CardTitle>{t.cargo}</CardTitle></> : <CardTitle>{t.confirm}</CardTitle>}</CardHeader><CardContent>
      {step === 0 ? <div className="grid gap-4 md:grid-cols-2"><Field label={t.mode}><Select value={form.mode} onChange={(event) => set("mode", event.target.value)}><option value="air">Air freight</option><option value="sea_fcl">Sea freight FCL</option><option value="sea_lcl">Sea freight LCL</option><option value="truck">Cross-border truck</option></Select></Field><Field label={t.shipDate}><Input type="date" value={form.shipDate} min={dateForInput(1)} onChange={(event) => set("shipDate", event.target.value)} /></Field><Field label={t.origin}><Input value={form.origin} autoComplete="address-level1" onChange={(event) => set("origin", event.target.value)} /></Field><Field label={t.destination}><Input value={form.destination} autoComplete="address-level1" onChange={(event) => set("destination", event.target.value)} /></Field><p className="md:col-span-2 rounded-md border border-[#e7cf8a] bg-[#fcf8ec] p-3 text-sm leading-6 text-[#6f5514]">{t.platformReview}</p></div> : null}
      {step === 1 ? <div className="grid gap-4 md:grid-cols-2"><Field label={t.cargoType}><Select value={form.cargoType} onChange={(event) => set("cargoType", event.target.value)}><option value="general">General cargo</option><option value="dangerous_goods">Dangerous goods</option><option value="cold_chain">Cold chain</option><option value="oversized">Oversized cargo</option></Select></Field><Field label={t.incoterm}><Select value={form.incoterm} onChange={(event) => set("incoterm", event.target.value)}><option>EXW</option><option>FOB</option><option>CIF</option><option>DAP</option><option>DDP</option></Select></Field><Field label={t.commodity}><Input value={form.commodity} onChange={(event) => set("commodity", event.target.value)} /></Field><Field label={t.pieces}><Input type="number" min="1" value={form.pieces} onChange={(event) => set("pieces", event.target.value)} /></Field><Field label={t.weight}><Input type="number" min="0" value={form.grossWeight} onChange={(event) => set("grossWeight", event.target.value)} /></Field><Field label={t.volume}><Input type="number" min="0" step="0.01" value={form.volume} onChange={(event) => set("volume", event.target.value)} /></Field><Field label={t.budget}><Select value={form.budget} onChange={(event) => set("budget", event.target.value)}><option value="not_disclosed">Prefer not to disclose</option><option value="under_5000">Under HKD 5,000</option><option value="5000_10000">HKD 5,000 - 10,000</option><option value="over_10000">Over HKD 10,000</option></Select></Field><div className="rounded-md border border-lgold/30 bg-lgold/10 p-3"><div className="text-sm text-slate-600">Chargeable weight</div><div className="mt-1 text-xl font-semibold text-lblue">{chargeableWeight.toLocaleString()} kg</div></div><fieldset className="md:col-span-2"><legend className="mb-2 text-sm font-semibold text-slate-700">{t.services}</legend><div className="grid gap-2 sm:grid-cols-2">{services.map((service, index) => <label key={service} className="flex items-center gap-3 border border-lblue/10 bg-slate-50 p-3 text-sm font-medium text-lblue"><input type="checkbox" checked={form.services.includes(service)} onChange={() => toggleService(service)} />{t.serviceNames[index]}</label>)}</div></fieldset><Field label={t.notes} className="md:col-span-2"><Textarea value={form.notes} onChange={(event) => set("notes", event.target.value)} /></Field></div> : null}
      {step === 2 ? <div className="space-y-4"><p className="rounded-md border border-lblue/10 bg-slate-50 p-4 text-sm leading-6 text-slate-600">{t.sealed}</p><dl className="grid gap-3 sm:grid-cols-2">{[[t.origin, form.origin], [t.destination, form.destination], [t.shipDate, form.shipDate], [t.commodity, form.commodity], [t.weight, `${form.grossWeight || 0} kg`], [t.services, form.services.map((service) => t.serviceNames[services.indexOf(service)]).join(", ")]].map(([label, value]) => <div key={label} className="border border-lblue/10 p-3"><dt className="text-xs font-medium text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-lblue">{value}</dd></div>)}</dl></div> : null}
      {error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">{step > 0 ? <Button variant="outline" onClick={() => move(step - 1)}><ArrowLeft className="h-4 w-4" />{t.back}</Button> : <span />}{step < 2 ? <Button onClick={() => move(step + 1)}>{t.next}<ArrowRight className="h-4 w-4" /></Button> : <Button variant="gold" disabled={submitting} onClick={submit}>{submitting ? t.submitting : t.submit}<Send className="h-4 w-4" /></Button>}</div>
    </CardContent></Card>
  </main>
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-semibold text-slate-700 ${className}`}><span className="mb-2 block">{label}</span>{children}</label>
}

function dateForInput(daysFromToday: number) {
  const date = new Date()
  date.setDate(date.getDate() + daysFromToday)
  return date.toISOString().slice(0, 10)
}
