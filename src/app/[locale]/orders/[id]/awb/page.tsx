"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Calculator, CheckCircle2, Download, FileText, Plane, Send, Truck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getAuthHeaders } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Smart AWB",
    title: "智能 AWB 填寫及 PDF 生成",
    intro: "輸入 shipper、consignee、路線和貨物資料，LBID 會自動計算體積重及計費重，並生成標準化 AWB PDF。",
    parties: "寄件人 / 收件人",
    cargo: "貨物資料",
    calculation: "重量計算",
    preview: "AWB 輸出",
    generate: "生成 AWB PDF",
    generating: "生成中...",
    generated: "AWB PDF 已生成",
    saved: "已存入文件清單",
    download: "開啟 / 下載 PDF",
    back: "返回文件管理",
    tracking: "查看貨件追蹤",
    shipper: "Shipper",
    consignee: "Consignee",
    route: "Departure / Destination",
    pieces: "件數",
    gross: "實重 kg",
    length: "長 cm",
    width: "闊 cm",
    height: "高 cm",
    commodity: "貨物名稱",
    handling: "處理指示",
    volumetric: "體積重",
    chargeable: "計費重",
    formula: "空運體積重 = 長 x 闊 x 高 x 件數 / 6000",
    error: "未能生成 AWB，請稍後再試。",
    liveNote: "登入後會上傳 PDF 到 Supabase Storage 並寫入 documents table；未登入時會直接回傳 PDF preview。",
  },
  en: {
    badge: "Smart AWB",
    title: "Smart AWB fill and PDF generation",
    intro: "Enter shipper, consignee, route and cargo details. LBID calculates volumetric and chargeable weight, then generates a standard AWB PDF.",
    parties: "Shipper / Consignee",
    cargo: "Cargo details",
    calculation: "Weight calculation",
    preview: "AWB output",
    generate: "Generate AWB PDF",
    generating: "Generating...",
    generated: "AWB PDF generated",
    saved: "Saved to document checklist",
    download: "Open / download PDF",
    back: "Back to documents",
    tracking: "View shipment tracking",
    shipper: "Shipper",
    consignee: "Consignee",
    route: "Departure / Destination",
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
    error: "Unable to generate AWB. Please try again.",
    liveNote: "Signed-in users upload the PDF to Supabase Storage and write a documents row; guests receive a direct PDF preview.",
  },
}

export default function AwbPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [form, setForm] = useState({
    shipper: "ABC Company, Mumbai, India",
    consignee: "Hong Kong Buyer Limited, Kwai Chung, Hong Kong",
    route: "BOM / HKG",
    pieces: 10,
    grossWeight: 500,
    length: 60,
    width: 45,
    height: 40,
    commodity: "Electronic components",
    handling: "Fragile items. Keep dry. Handle with care.",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [pdfUrl, setPdfUrl] = useState("")
  const [saved, setSaved] = useState(false)

  const volumetric = useMemo(() => Math.ceil((form.length * form.width * form.height * form.pieces) / 6000), [form])
  const chargeable = Math.max(form.grossWeight, volumetric)

  function update(key: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function generatePdf() {
    setLoading(true)
    setError("")
    setSaved(false)
    try {
      const authHeaders = await getAuthHeaders()
      const response = await fetch(`/api/orders/${params.id}/awb`, {
        method: "POST",
        headers: { "content-type": "application/json", ...authHeaders },
        body: JSON.stringify(form),
      })
      const contentType = response.headers.get("content-type") || ""

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || t.error)
      }

      if (contentType.includes("application/json")) {
        const body = await response.json()
        setPdfUrl(body.pdfUrl || "")
        setSaved(Boolean(body.document))
      } else {
        const blob = await response.blob()
        setPdfUrl(URL.createObjectURL(blob))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[1fr_380px] lg:pb-10">
      <section className="space-y-5">
        <div className="rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>

        <Card>
          <CardHeader>
            <Plane className="h-5 w-5 text-lgold" />
            <CardTitle>{t.parties}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold text-lblue">
              {t.shipper}
              <Textarea value={form.shipper} onChange={(event) => update("shipper", event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-semibold text-lblue">
              {t.consignee}
              <Textarea value={form.consignee} onChange={(event) => update("consignee", event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-semibold text-lblue md:col-span-2">
              {t.route}
              <Input value={form.route} onChange={(event) => update("route", event.target.value)} />
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Calculator className="h-5 w-5 text-lgold" />
            <CardTitle>{t.cargo}</CardTitle>
            <CardDescription>{t.formula}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <NumberField label={t.pieces} value={form.pieces} onChange={(value) => update("pieces", value)} />
            <NumberField label={t.gross} value={form.grossWeight} onChange={(value) => update("grossWeight", value)} />
            <label className="space-y-2 text-sm font-semibold text-lblue">
              {t.commodity}
              <Input value={form.commodity} onChange={(event) => update("commodity", event.target.value)} />
            </label>
            <NumberField label={t.length} value={form.length} onChange={(value) => update("length", value)} />
            <NumberField label={t.width} value={form.width} onChange={(value) => update("width", value)} />
            <NumberField label={t.height} value={form.height} onChange={(value) => update("height", value)} />
            <label className="space-y-2 text-sm font-semibold text-lblue md:col-span-3">
              {t.handling}
              <Textarea value={form.handling} onChange={(event) => update("handling", event.target.value)} />
            </label>
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
            <Metric label={t.gross} value={`${form.grossWeight.toLocaleString()} kg`} />
            <div className="rounded-lg border border-lgold/30 bg-white p-4">
              <div className="text-sm text-muted-foreground">{t.chargeable}</div>
              <div className="text-4xl font-black text-lgold">{chargeable.toLocaleString()} kg</div>
            </div>
            <Button className="w-full" variant="gold" disabled={loading} onClick={generatePdf}>
              <Send className="h-4 w-4" />
              {loading ? t.generating : t.generate}
            </Button>
            {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <FileText className="h-5 w-5 text-lgold" />
            <CardTitle>{t.preview}</CardTitle>
            <CardDescription>{t.liveNote}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="rounded-lg border border-lblue/10 bg-slate-50 p-3">
              <div className="font-mono text-lgold">AWB-{params.id.slice(-6).toUpperCase()}</div>
              <div>{form.route} · {form.pieces} pcs · {chargeable} kg</div>
            </div>
            {pdfUrl ? (
              <>
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">
                  <CheckCircle2 className="h-4 w-4" />
                  {saved ? t.saved : t.generated}
                </div>
                <Button asChild className="w-full" variant="outline">
                  <a href={pdfUrl} target="_blank" rel="noreferrer">
                    <Download className="h-4 w-4" />
                    {t.download}
                  </a>
                </Button>
              </>
            ) : null}
            <Button asChild className="w-full" variant="outline">
              <Link href={`/${locale}/orders/${params.id}/tracking`}>
                <Truck className="h-4 w-4" />
                {t.tracking}
              </Link>
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/${locale}/orders/${params.id}/documents`}>{t.back}</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </main>
  )
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="space-y-2 text-sm font-semibold text-lblue">
      {label}
      <Input type="number" min={0} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} />
    </label>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-lblue/10 bg-white p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-black text-lblue">{value}</div>
    </div>
  )
}
