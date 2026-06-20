"use client"

import { useState } from "react"
import { Calculator, CheckCircle2, Coins, FileText, LockKeyhole, Plus, Send, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { companyProfile } from "@/lib/data"
import { isLocale, type Locale } from "@/lib/i18n"

type LineItem = {
  id: string
  description: string
  unit: string
  quantity: number
  unitPrice: number
}

const copy = {
  zh: {
    badge: "Forwarder quotation",
    title: "提交標準化物流報價",
    intro: "根據 Agency 詢價建立 line-item quotation。內部成本備註只給 Forwarder 自己參考，不會顯示給 Agency 或其他 Forwarder。",
    inquiry: "Inquiry summary",
    quotation: "Quotation details",
    lineItems: "Line items",
    ops: "Operational details",
    validUntil: "Valid until",
    transit: "Estimated transit time",
    carrier: "Proposed carrier",
    pol: "Port of loading",
    pod: "Port of discharge",
    agencyRemarks: "Notes to Agency",
    internalNote: "Encrypted internal note",
    description: "Service description",
    unit: "Unit",
    qty: "Qty",
    unitPrice: "Unit price USD",
    amount: "Amount",
    add: "Add line item",
    submit: "Submit quotation and generate PDF",
    total: "Quotation total",
    pdf: "PDF generated",
    reference: "Quotation reference",
    submitted: "Quotation submitted successfully",
    confirmTitle: "確認提交 sealed quotation",
    confirmBody: "提交後會扣 1 Token，報價會鎖定。其他 Forwarder 仍然看不到你的價格。",
    confirmSubmit: "確認提交 -1 Token",
    edit: "返回修改",
    remaining: "提交後剩餘 Token",
    pdfPreview: "PDF Preview",
    sealed: "其他 Forwarder 看不到你的報價。Agency 只會看到最終報價內容。",
    hidden: "Internal note 只會作內部成本參考，不會出現在 PDF。",
    tokenUsage: "Token 使用",
    tokenDesc: "提交 sealed bid 會使用 1 token。",
    submitting: "提交中...",
    error: "未能提交報價",
    summary: {
      ref: "LBID-INQ-2026-0001",
      route: "Mumbai (BOM) → Hong Kong (HKG)",
      cargo: "Electronic components, 500kg / 3CBM",
      chargeable: "Chargeable weight: 501 kg",
      deadline: "Response deadline: 12 Jun 2026 18:00",
    },
  },
  en: {
    badge: "Forwarder quotation",
    title: "Submit an itemised logistics quotation.",
    intro: "Build a line-item quotation from the agency inquiry. Internal cost notes stay private to the forwarder and are never shown to the agency or other forwarders.",
    inquiry: "Inquiry summary",
    quotation: "Quotation details",
    lineItems: "Line items",
    ops: "Operational details",
    validUntil: "Valid until",
    transit: "Estimated transit time",
    carrier: "Proposed carrier",
    pol: "Port of loading",
    pod: "Port of discharge",
    agencyRemarks: "Notes to Agency",
    internalNote: "Encrypted internal note",
    description: "Service description",
    unit: "Unit",
    qty: "Qty",
    unitPrice: "Unit price USD",
    amount: "Amount",
    add: "Add line item",
    submit: "Submit quotation and generate PDF",
    total: "Quotation total",
    pdf: "PDF generated",
    reference: "Quotation reference",
    submitted: "Quotation submitted successfully",
    confirmTitle: "Confirm sealed quotation submission",
    confirmBody: "Submitting spends 1 token and locks the quote. Other forwarders still cannot see your price.",
    confirmSubmit: "Confirm submit -1 Token",
    edit: "Back to edit",
    remaining: "Remaining tokens",
    pdfPreview: "PDF Preview",
    sealed: "Other forwarders cannot see your quotation. The agency only sees your final quotation content.",
    hidden: "Internal notes stay private and never appear in the PDF.",
    tokenUsage: "Token usage",
    tokenDesc: "Submitting a sealed bid spends 1 token.",
    submitting: "Submitting...",
    error: "Unable to submit quotation",
    summary: {
      ref: "LBID-INQ-2026-0001",
      route: "Mumbai (BOM) → Hong Kong (HKG)",
      cargo: "Electronic components, 500kg / 3CBM",
      chargeable: "Chargeable weight: 501 kg",
      deadline: "Response deadline: 12 Jun 2026 18:00",
    },
  },
}

const initialLineItems: LineItem[] = [
  { id: "air", description: "Air Freight (BOM-HKG)", unit: "kg", quantity: 501, unitPrice: 1.6 },
  { id: "handling", description: "Airport Handling (HKG)", unit: "lot", quantity: 1, unitPrice: 300 },
  { id: "customs", description: "Import Customs Clearance", unit: "lot", quantity: 1, unitPrice: 400 },
  { id: "delivery", description: "Local Delivery (HKG)", unit: "trip", quantity: 1, unitPrice: 200 },
]

export default function NewQuotationPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [lineItems, setLineItems] = useState<LineItem[]>(initialLineItems)
  const [submitted, setSubmitted] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submittedQuotation, setSubmittedQuotation] = useState<any>(null)
  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const tokenBalance = companyProfile.tokenBalanceFree + companyProfile.tokenBalancePaid

  function updateLineItem(id: string, field: keyof LineItem, value: string) {
    setLineItems((items) => items.map((item) => {
      if (item.id !== id) return item
      if (field === "quantity" || field === "unitPrice") return { ...item, [field]: Number(value) || 0 }
      return { ...item, [field]: value }
    }))
  }

  function addLineItem() {
    setLineItems((items) => [...items, { id: `item-${Date.now()}`, description: "Fuel Surcharge", unit: "lot", quantity: 1, unitPrice: 100 }])
  }

  function removeLineItem(id: string) {
    setLineItems((items) => items.filter((item) => item.id !== id))
  }

  async function submitQuotation() {
    setSubmitting(true)
    setSubmitError("")
    const { response, body } = await apiJson("/api/quotations", {
      method: "POST",
      body: JSON.stringify({
        shipmentRequestId: t.summary.ref,
        lineItems,
        totalAmount: total,
      }),
    })

    setSubmitting(false)
    if (!response.ok) {
      setSubmitError(body.error || t.error)
      return
    }

    setSubmittedQuotation(body.quotation)
    setConfirming(false)
    setSubmitted(true)
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>

        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <LockKeyhole className="h-5 w-5 text-lgold" />
            <CardTitle>{t.inquiry}</CardTitle>
            <CardDescription>{t.sealed}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {Object.values(t.summary).map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm">{item}</div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <FileText className="h-5 w-5 text-lgold" />
            <CardTitle>{t.quotation}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">{t.validUntil}<Input type="date" defaultValue="2026-06-20" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.transit}<Input defaultValue="3-5 business days" /></label>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <Calculator className="h-5 w-5 text-lgold" />
            <CardTitle>{t.lineItems}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lineItems.map((item) => (
              <div key={item.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 lg:grid-cols-[1.4fr_80px_80px_120px_120px_auto]">
                <label className="space-y-1 text-xs font-semibold text-muted-foreground">{t.description}<Input value={item.description} onChange={(event) => updateLineItem(item.id, "description", event.target.value)} /></label>
                <label className="space-y-1 text-xs font-semibold text-muted-foreground">{t.unit}<Input value={item.unit} onChange={(event) => updateLineItem(item.id, "unit", event.target.value)} /></label>
                <label className="space-y-1 text-xs font-semibold text-muted-foreground">{t.qty}<Input type="number" value={item.quantity} onChange={(event) => updateLineItem(item.id, "quantity", event.target.value)} /></label>
                <label className="space-y-1 text-xs font-semibold text-muted-foreground">{t.unitPrice}<Input type="number" value={item.unitPrice} onChange={(event) => updateLineItem(item.id, "unitPrice", event.target.value)} /></label>
                <div className="space-y-1 text-xs font-semibold text-muted-foreground">
                  {t.amount}
                  <div className="flex h-10 items-center rounded-md border border-white/10 bg-background px-3 font-mono text-sm text-foreground">USD {formatUsd(item.quantity * item.unitPrice)}</div>
                </div>
                <Button size="icon" variant="outline" onClick={() => removeLineItem(item.id)} aria-label="Remove line item">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" onClick={addLineItem}>
              <Plus className="h-4 w-4" />
              {t.add}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <CardTitle>{t.ops}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">{t.carrier}<Input defaultValue="Emirates / Cathay Pacific" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.pol}<Input defaultValue="Mumbai (BOM)" /></label>
            <label className="space-y-2 text-sm font-semibold">{t.pod}<Input defaultValue="Hong Kong (HKG)" /></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">{t.agencyRemarks}<Textarea defaultValue="We have weekly consolidation ex-Mumbai every Tuesday. Price includes origin pickup within Mumbai city limits." /></label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">
              {t.internalNote}
              <Textarea defaultValue="Buy rate USD 1.10/kg; margin USD 0.50/kg. Not shown to agency." />
              <span className="text-xs text-muted-foreground">{t.hidden}</span>
            </label>
          </CardContent>
        </Card>
      </section>

      <aside className="space-y-5">
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <LockKeyhole className="h-5 w-5 text-lgold" />
            <CardTitle>{t.tokenUsage}</CardTitle>
            <CardDescription>{t.tokenDesc}</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <Metric label="Free" value={String(companyProfile.tokenBalanceFree)} />
            <Metric label="Paid" value={String(companyProfile.tokenBalancePaid)} />
          </CardContent>
        </Card>

        <Card className="sticky top-24 border-lgold/30 bg-lgold/10">
          <CardHeader>
            <Calculator className="h-5 w-5 text-lgold" />
            <CardTitle>{t.total}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-lgold/30 bg-lgold/15 p-4">
              <div className="text-sm text-muted-foreground">USD</div>
              <div className="text-5xl font-black text-lgold">{formatUsd(total)}</div>
            </div>
            <Button className="w-full" variant="gold" onClick={() => setConfirming(true)}>
              <Send className="h-4 w-4" />
              {t.submit}
            </Button>
          </CardContent>
        </Card>

        {submitted ? (
          <Card className="border-teal-400/30 bg-teal-400/10">
            <CardHeader>
              <CheckCircle2 className="h-5 w-5 text-teal-700" />
              <CardTitle>{t.submitted}</CardTitle>
              <CardDescription>{t.pdf}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">{t.reference}</div>
              <div className="break-all font-mono text-2xl font-black text-lgold">{submittedQuotation?.id || "LBID-Q-2026-0001"}</div>
              {submittedQuotation?.pdfUrl ? (
                <Button asChild className="w-full" variant="outline">
                  <a href={submittedQuotation.pdfUrl} target="_blank" rel="noreferrer">{t.pdfPreview}</a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </aside>

      {confirming ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-lblue/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-lg border border-lblue/10 bg-white p-5 shadow-2xl">
            <h2 className="text-2xl font-black text-lblue">{t.confirmTitle}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t.confirmBody}</p>
            <div className="mt-4 grid gap-3 text-sm">
              <ConfirmLine label={t.total} value={`USD ${formatUsd(total)}`} />
              <ConfirmLine label="Token cost" value="1 Token" />
              <ConfirmLine label={t.remaining} value={`${Math.max(0, tokenBalance - 1)}`} />
            </div>
            <div className="mt-5 rounded-md border border-lblue/10 bg-slate-50 p-4">
              <div className="flex items-center gap-2 font-black text-lblue">
                <FileText className="h-4 w-4 text-lgold" />
                {t.pdfPreview}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{companyProfile.companyName} · {t.summary.route} · USD {formatUsd(total)}</div>
            </div>
            {submitError ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{submitError}</div> : null}
            <div className="mt-5 flex gap-2">
              <Button className="flex-1" variant="outline" disabled={submitting} onClick={() => setConfirming(false)}>{t.edit}</Button>
              <Button className="flex-1" variant="gold" disabled={submitting} onClick={submitQuotation}>
                <Coins className="h-4 w-4" />
                {submitting ? t.submitting : t.confirmSubmit}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <div className="text-muted-foreground">{label}</div>
      <div className="text-2xl font-black text-lblue">{value}</div>
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

function formatUsd(amount: number) {
  return amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
