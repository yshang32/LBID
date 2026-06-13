"use client"

import Link from "next/link"
import { useState } from "react"
import { Calculator, CheckCircle2, FileText, Plane, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Smart AWB",
    title: "智能 AWB 填寫表單。",
    intro: "輸入 shipper、consignee 和貨物資料，LBID 自動計算 volumetric / chargeable weight，並生成標準 AWB preview。",
    parties: "Shipper / Consignee",
    cargo: "Cargo details",
    calculation: "Weight calculation",
    preview: "AWB preview",
    generate: "生成 AWB PDF preview",
    generated: "AWB PDF preview 已生成",
    back: "返回文件管理",
    shipper: "Shipper",
    consignee: "Consignee",
    airport: "Airport of departure / destination",
    pieces: "Pieces",
    gross: "Gross weight kg",
    length: "Length cm",
    width: "Width cm",
    height: "Height cm",
    commodity: "Commodity",
    handling: "Handling information",
    volumetric: "Volumetric weight",
    chargeable: "Chargeable weight",
    formula: "Air cargo volumetric = L x W x H x pieces / 6000",
    note: "Demo 版生成 preview；production 會用 React-PDF / Puppeteer 產生正式 PDF 並寫入 documents table。",
  },
  en: {
    badge: "Smart AWB",
    title: "Smart AWB fill form.",
    intro: "Enter shipper, consignee and cargo details. LBID calculates volumetric / chargeable weight and generates a standard AWB preview.",
    parties: "Shipper / Consignee",
    cargo: "Cargo details",
    calculation: "Weight calculation",
    preview: "AWB preview",
    generate: "Generate AWB PDF preview",
    generated: "AWB PDF preview generated",
    back: "Back to documents",
    shipper: "Shipper",
    consignee: "Consignee",
    airport: "Airport of departure / destination",
    pieces: "Pieces",
    gross: "Gross weight kg",
    length: "Length cm",
    width: "Width cm",
    height: "Height cm",
    commodity: "Commodity",
    handling: "Handling information",
    volumetric: "Volumetric weight",
    chargeable: "Chargeable weight",
    formula: "Air cargo volumetric = L x W x H x pieces / 6000",
    note: "The demo generates a preview; production uses React-PDF / Puppeteer and writes the PDF record to the documents table.",
  },
}

export default function AwbPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [pieces, setPieces] = useState(10)
  const [gross, setGross] = useState(500)
  const [length, setLength] = useState(60)
  const [width, setWidth] = useState(45)
  const [height, setHeight] = useState(40)
  const [generated, setGenerated] = useState(false)
  const volumetric = Math.ceil((length * width * height * pieces) / 6000)
  const chargeable = Math.max(gross, volumetric)

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px]">
      <section className="space-y-5">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <Plane className="h-5 w-5 text-lgold" />
            <CardTitle>{t.parties}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">{t.shipper}<Textarea defaultValue="ABC Company, Mumbai, India" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.consignee}<Textarea defaultValue="Hong Kong Buyer Limited, Kwai Chung, Hong Kong" /></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">{t.airport}<Input defaultValue="BOM / HKG" /></label>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <Calculator className="h-5 w-5 text-lgold" />
            <CardTitle>{t.cargo}</CardTitle>
            <CardDescription>{t.formula}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-semibold">{t.pieces}<Input type="number" value={pieces} onChange={(event) => setPieces(Number(event.target.value) || 0)} /></label>
            <label className="space-y-2 text-sm font-semibold">{t.gross}<Input type="number" value={gross} onChange={(event) => setGross(Number(event.target.value) || 0)} /></label>
            <label className="space-y-2 text-sm font-semibold">{t.commodity}<Input defaultValue="Electronic components" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.length}<Input type="number" value={length} onChange={(event) => setLength(Number(event.target.value) || 0)} /></label>
            <label className="space-y-2 text-sm font-semibold">{t.width}<Input type="number" value={width} onChange={(event) => setWidth(Number(event.target.value) || 0)} /></label>
            <label className="space-y-2 text-sm font-semibold">{t.height}<Input type="number" value={height} onChange={(event) => setHeight(Number(event.target.value) || 0)} /></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-3">{t.handling}<Textarea defaultValue="Fragile items. Keep dry. Handle with care." /></label>
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-5">
        <Card className="sticky top-24 border-lgold/30 bg-lgold/10">
          <CardHeader>
            <Calculator className="h-5 w-5 text-lgold" />
            <CardTitle>{t.calculation}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Metric label={t.volumetric} value={`${volumetric.toLocaleString()} kg`} />
            <Metric label={t.gross} value={`${gross.toLocaleString()} kg`} />
            <div className="rounded-lg border border-lgold/30 bg-lgold/15 p-4">
              <div className="text-sm text-muted-foreground">{t.chargeable}</div>
              <div className="text-4xl font-black text-lgold">{chargeable.toLocaleString()} kg</div>
            </div>
            <Button className="w-full" variant="gold" onClick={() => setGenerated(true)}>
              <Send className="h-4 w-4" />
              {t.generate}
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <FileText className="h-5 w-5 text-lgold" />
            <CardTitle>{t.preview}</CardTitle>
            <CardDescription>{t.note}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <div className="font-mono text-lgold">AWB-DEMO-{params.id.slice(-4)}</div>
              <div>BOM → HKG · {pieces} pcs · {chargeable} kg</div>
            </div>
            {generated ? (
              <div className="flex items-center gap-2 rounded-lg border border-teal-400/30 bg-teal-400/10 p-3 text-teal-200">
                <CheckCircle2 className="h-4 w-4" />
                {t.generated}
              </div>
            ) : null}
            <Button asChild className="w-full" variant="outline">
              <Link href={`/${locale}/orders/${params.id}/documents`}>{t.back}</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  )
}
