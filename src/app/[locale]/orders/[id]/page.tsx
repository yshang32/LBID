"use client"

import Link from "next/link"
import { CheckCircle2, FileCheck2, MessageSquare, PackageCheck, Star } from "lucide-react"

import { LiveOrderPanel } from "@/components/orders/live-order-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"
import { getLocalizedDocumentChecklist } from "@/lib/localized-data"

const copy = {
  zh: {
    badge: "Order workspace",
    title: "Order workspace：文件、訊息和狀態保持可追蹤。",
    intro: "Bid accepted 後，Match Record 會轉成 Order。雙方可以在這裡管理狀態、文件、訊息和完成後 review。",
    forwarder: "Winning forwarder",
    agency: "Client / Agency",
    route: "Route",
    cargo: "Cargo",
    total: "Accepted quotation",
    status: "Order status",
    documents: "Document checklist",
    manageDocuments: "管理文件",
    uploaded: "Uploaded",
    pending: "Pending",
    messages: "Order messages",
    openMessages: "打開 message thread",
    review: "Completion review",
    leaveReview: "提交 review",
    role: "Platform role: workflow_platform_not_carrier_of_record",
    statuses: ["confirmed", "shipment_booked", "in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"],
  },
  en: {
    badge: "Order workspace",
    title: "Order workspace: documents, messages and status stay traceable.",
    intro: "After bid acceptance, the Match Record becomes an Order. Both parties manage status, documents, messages and completion review here.",
    forwarder: "Winning forwarder",
    agency: "Agency",
    route: "Route",
    cargo: "Cargo",
    total: "Accepted quotation",
    status: "Order status",
    documents: "Document checklist",
    manageDocuments: "Manage documents",
    uploaded: "Uploaded",
    pending: "Pending",
    messages: "Order messages",
    openMessages: "Open message thread",
    review: "Completion review",
    leaveReview: "Leave review",
    role: "Platform role: workflow_platform_not_carrier_of_record",
    statuses: ["confirmed", "shipment_booked", "in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"],
  },
}

export default function OrderWorkspacePage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const documents = getLocalizedDocumentChecklist(locale)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="flex flex-col gap-5 rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)] md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card className="md:w-80">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Order reference</div>
            <div className="break-all font-mono text-xl font-black text-lgold">{params.id}</div>
            <div className="mt-2 rounded-md border border-lblue/10 bg-slate-50 p-2 text-xs text-muted-foreground">{t.role}</div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-4 md:grid-cols-4">
        <Summary label={t.forwarder} value="HarbourLink Cargo" />
        <Summary label={t.agency} value="Saigon Freight Agency" />
        <Summary label={t.route} value="Ho Chi Minh City -> Hong Kong" />
        <Summary label={t.total} value="HKD 12,800" />
      </section>

      <LiveOrderPanel locale={locale} orderId={params.id} />

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <PackageCheck className="h-5 w-5 text-lgold" />
            <CardTitle>{t.status}</CardTitle>
            <CardDescription>{t.cargo}: Electronic components, 500kg / 3CBM</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {t.statuses.map((status, index) => (
              <div key={status} className={`rounded-md border p-3 text-left text-xs font-semibold ${index <= 1 ? "border-lgold/50 bg-lgold/15 text-[#6f5514]" : "border-lblue/10 bg-slate-50 text-muted-foreground"}`}>
                <CheckCircle2 className="mb-2 h-4 w-4" />
                {status}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <FileCheck2 className="h-5 w-5 text-lgold" />
              <CardTitle>{t.documents}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {documents.map((document, index) => (
                <div key={document} className="flex items-center justify-between rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm">
                  <span>{document}</span>
                  <Badge variant={index < 2 ? "teal" : "gold"}>{index < 2 ? t.uploaded : t.pending}</Badge>
                </div>
              ))}
              <Button asChild className="w-full" variant="outline">
                <Link href={`/${locale}/orders/${params.id}/documents`}>{t.manageDocuments}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <MessageSquare className="h-5 w-5 text-lgold" />
              <CardTitle>{t.messages}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full" variant="gold">
                <Link href={`/${locale}/orders/${params.id}/messages`}>{t.openMessages}</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Star className="h-5 w-5 text-lgold" />
              <CardTitle>{t.review}</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-1 text-lgold">
              <div className="flex flex-1 gap-1">
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-5 w-5 fill-current" />)}
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/${locale}/orders/${params.id}/review`}>{t.leaveReview}</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="mt-1 font-bold text-lblue">{value}</div>
      </CardContent>
    </Card>
  )
}
