"use client"

import { useState } from "react"
import Link from "next/link"
import { Bell, Calculator, CheckCircle2, ClipboardList, PackageSearch, Plane, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "New Inquiry",
    title: "建立香港物流詢價。",
    intro: "輸入貨物、路線、貿易條款和所需服務。空運會自動計算 chargeable weight。",
    basics: "Shipment basics",
    cargo: "Cargo details",
    terms: "Trade terms",
    services: "Services required",
    matching: "Matching preview",
    result: "提交結果",
    mode: "運輸方式",
    originCountry: "出發國家",
    originCity: "出發港口 / 機場 / 城市",
    destination: "目的地",
    shipDate: "預計出貨日期",
    cargoType: "貨物類型",
    commodity: "貨物描述",
    hsCode: "HS Code",
    grossWeight: "總毛重 kg",
    volume: "總體積 CBM",
    pieces: "件數 / 箱數",
    dimensions: "每箱尺寸 cm",
    incoterms: "Incoterms",
    special: "特別要求",
    transit: "Preferred transit time",
    budget: "Budget indication",
    deadline: "Response deadline",
    chargeable: "Chargeable weight",
    formula: "空運 volumetric = CBM x 167，取 gross weight 和 volumetric 較高者。",
    submit: "提交詢價並通知 Forwarder",
    submitted: "詢價已建立",
    reference: "Reference number",
    compare: "查看報價比較",
    notify: "系統會通知最合適的 Forwarder，Forwarder 看不到你的 budget indication。",
    matched: "預計通知 3 間匹配 Forwarder",
    openWindow: "報價窗口：48 小時",
    hiddenBudget: "Budget 只用於內部 matching，不會顯示給 Forwarder。",
    serviceOptions: ["Origin Pickup", "Export Customs Clearance", "Air / Ocean Freight", "Import Customs Clearance HK", "Airport / Port Handling HK", "Warehousing HK", "Local Delivery HK", "Door-to-Door"],
  },
  en: {
    badge: "New Inquiry",
    title: "Create a Hong Kong logistics inquiry.",
    intro: "Enter cargo, route, trade terms and services needed. Air freight calculates chargeable weight automatically.",
    basics: "Shipment basics",
    cargo: "Cargo details",
    terms: "Trade terms",
    services: "Services required",
    matching: "Matching preview",
    result: "Submission result",
    mode: "Shipment mode",
    originCountry: "Origin country",
    originCity: "Origin port / airport / city",
    destination: "Destination",
    shipDate: "Estimated ship date",
    cargoType: "Cargo type",
    commodity: "Commodity description",
    hsCode: "HS Code",
    grossWeight: "Total gross weight kg",
    volume: "Total volume CBM",
    pieces: "Pieces / cartons",
    dimensions: "Dimensions per carton cm",
    incoterms: "Incoterms",
    special: "Special requirements",
    transit: "Preferred transit time",
    budget: "Budget indication",
    deadline: "Response deadline",
    chargeable: "Chargeable weight",
    formula: "Air volumetric = CBM x 167; LBID uses the higher of gross and volumetric weight.",
    submit: "Submit inquiry and notify forwarders",
    submitted: "Inquiry created",
    reference: "Reference number",
    compare: "View quotation comparison",
    notify: "LBID will notify the best matching forwarders. Forwarders cannot see your budget indication.",
    matched: "Estimated 3 matched forwarders notified",
    openWindow: "Quotation window: 48 hours",
    hiddenBudget: "Budget is only used for internal matching and is never shown to forwarders.",
    serviceOptions: ["Origin Pickup", "Export Customs Clearance", "Air / Ocean Freight", "Import Customs Clearance HK", "Airport / Port Handling HK", "Warehousing HK", "Local Delivery HK", "Door-to-Door"],
  },
}

export default function NewInquiryPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [mode, setMode] = useState("air")
  const [grossWeight, setGrossWeight] = useState(500)
  const [volume, setVolume] = useState(3)
  const [selectedServices, setSelectedServices] = useState<string[]>(["Air / Ocean Freight", "Import Customs Clearance HK", "Local Delivery HK"])
  const [submitted, setSubmitted] = useState(false)
  const volumetricWeight = Math.round(volume * 167)
  const chargeableWeight = mode === "air" ? Math.max(grossWeight, volumetricWeight) : grossWeight

  function toggleService(service: string) {
    setSelectedServices((items) => items.includes(service) ? items.filter((item) => item !== service) : [...items, service])
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card className="border-white/10 bg-white/[0.055]">
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
                <option value="both">Both</option>
              </Select>
            </label>
            <label className="space-y-2 text-sm font-semibold">{t.originCountry}<Select defaultValue="India"><option>India</option><option>Vietnam</option><option>Malaysia</option><option>Indonesia</option><option>Philippines</option><option>Thailand</option></Select></label>
            <label className="space-y-2 text-sm font-semibold">{t.originCity}<Input defaultValue="Mumbai (BOM)" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.destination}<Input value="Hong Kong (HKG)" readOnly /></label>
            <label className="space-y-2 text-sm font-semibold">{t.shipDate}<Input type="date" defaultValue="2026-06-18" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.deadline}<Input type="datetime-local" defaultValue="2026-06-12T18:00" /></label>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <PackageSearch className="h-5 w-5 text-lgold" />
            <CardTitle>{t.cargo}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">{t.cargoType}<Select defaultValue="electronics"><option>General Cargo</option><option value="electronics">Electronics</option><option>Dangerous Goods</option><option>Cold Chain</option><option>Oversized</option></Select></label>
            <label className="space-y-2 text-sm font-semibold">{t.commodity}<Input defaultValue="Electronic components, non-hazardous" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.hsCode}<Input defaultValue="854190" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.pieces}<Input type="number" defaultValue="10" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.grossWeight}<Input type="number" value={grossWeight} onChange={(event) => setGrossWeight(Number(event.target.value) || 0)} /></label>
            <label className="space-y-2 text-sm font-semibold">{t.volume}<Input type="number" value={volume} onChange={(event) => setVolume(Number(event.target.value) || 0)} /></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">{t.dimensions}<Input defaultValue="60 x 45 x 40 cm" /></label>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <ClipboardList className="h-5 w-5 text-lgold" />
            <CardTitle>{t.terms}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">{t.incoterms}<Select defaultValue="FOB"><option>EXW</option><option>FOB</option><option>CIF</option><option>DAP</option><option>DDP</option></Select></label>
            <label className="space-y-2 text-sm font-semibold">{t.transit}<Select defaultValue="3-5"><option>No preference</option><option>Under 3 days</option><option value="3-5">3-5 days</option><option>Flexible</option></Select></label>
            <label className="space-y-2 text-sm font-semibold">{t.budget}<Select defaultValue="hidden"><option>Under USD500</option><option>USD500-1000</option><option>USD1000-2000</option><option>USD2000+</option><option value="hidden">Prefer not to say</option></Select></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">{t.special}<Textarea defaultValue="Fragile items, handle with care" /></label>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <CardTitle>{t.services}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {t.serviceOptions.map((service) => (
              <label key={service} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <input type="checkbox" checked={selectedServices.includes(service)} onChange={() => toggleService(service)} />
                <span className="text-sm font-semibold">{service}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-5">
        <Card className="sticky top-24 border-lgold/30 bg-lgold/10">
          <CardHeader>
            <Calculator className="h-5 w-5 text-lgold" />
            <CardTitle>{t.chargeable}</CardTitle>
            <CardDescription>{t.formula}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm text-muted-foreground">Gross</div>
              <div className="text-2xl font-black">{grossWeight.toLocaleString()} kg</div>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm text-muted-foreground">Volumetric</div>
              <div className="text-2xl font-black">{volumetricWeight.toLocaleString()} kg</div>
            </div>
            <div className="rounded-lg border border-lgold/30 bg-lgold/15 p-4">
              <div className="text-sm text-muted-foreground">{t.chargeable}</div>
              <div className="text-4xl font-black text-lgold">{chargeableWeight.toLocaleString()} kg</div>
            </div>
            <Button className="w-full" variant="gold" onClick={() => setSubmitted(true)}>
              <Send className="h-4 w-4" />
              {t.submit}
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <Bell className="h-5 w-5 text-lgold" />
            <CardTitle>{t.matching}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-lgold" />{t.matched}</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-lgold" />{t.openWindow}</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-lgold" />{t.hiddenBudget}</div>
          </CardContent>
        </Card>
        {submitted ? (
          <Card className="border-teal-400/30 bg-teal-400/10">
            <CardHeader>
              <CheckCircle2 className="h-5 w-5 text-teal-300" />
              <CardTitle>{t.submitted}</CardTitle>
              <CardDescription>{t.notify}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">{t.reference}</div>
              <div className="font-mono text-2xl font-black text-lgold">LBID-INQ-2026-0001</div>
              <Button asChild className="mt-4" variant="gold">
                <Link href={`/${locale}/quotations/compare`}>{t.compare}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </aside>
    </main>
  )
}
