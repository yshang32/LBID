"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, FileCheck2, MessageSquare, PackageCheck, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"
import { getLocalizedDocumentChecklist } from "@/lib/localized-data"

const copy = {
  zh: {
    badge: "Order workspace",
    title: "訂單工作區：文件、訊息、狀態都要留痕。",
    intro: "Bid 被接受後，Match Record 會轉成 Order。雙方在同一個工作區處理狀態、文件、訊息和完成後評價。",
    forwarder: "中標 Forwarder",
    agency: "Client / Agent",
    route: "路線",
    cargo: "貨物",
    total: "中標報價",
    status: "訂單狀態",
    documents: "文件清單",
    manageDocuments: "管理文件",
    uploaded: "已上傳",
    pending: "待補",
    messages: "訂單訊息",
    openMessages: "打開訊息欄",
    send: "發送訊息",
    review: "完成後評價",
    leaveReview: "提交評價",
    statuses: ["confirmed", "shipment_booked", "in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"],
    message: "請確認 booking 資料和 ship date。",
    role: "平台角色：workflow_platform_not_carrier_of_record",
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
    send: "Send message",
    review: "Completion review",
    leaveReview: "Leave review",
    statuses: ["confirmed", "shipment_booked", "in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"],
    message: "Please confirm booking details and ship date.",
    role: "Platform role: workflow_platform_not_carrier_of_record",
  },
}

export default function OrderWorkspacePage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const documents = getLocalizedDocumentChecklist(locale)
  const [activeStatus, setActiveStatus] = useState(1)
  const [message, setMessage] = useState(t.message)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card className="md:w-80">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">Order reference</div>
            <div className="font-mono text-xl font-black text-lgold">{params.id}</div>
            <div className="mt-2 rounded-md border border-lblue/10 bg-slate-50 p-2 text-xs text-muted-foreground">{t.role}</div>
          </CardContent>
        </Card>
      </section>
      <section className="mt-8 grid gap-4 md:grid-cols-4">
        <Summary label={t.forwarder} value="HarbourLink Cargo" />
        <Summary label={t.agency} value="Saigon Freight Agency" />
        <Summary label={t.route} value="Ho Chi Minh City -> Hong Kong" />
        <Summary label={t.total} value="HKD 12,800" />
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <PackageCheck className="h-5 w-5 text-lgold" />
            <CardTitle>{t.status}</CardTitle>
            <CardDescription>{t.cargo}: Electronic components, 500kg / 3CBM</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {t.statuses.map((status, index) => (
              <button
                key={status}
                className={`rounded-md border p-3 text-left text-xs font-semibold transition ${index <= activeStatus ? "border-lgold/50 bg-lgold/15 text-[#6f5514]" : "border-lblue/10 bg-slate-50 text-muted-foreground"}`}
                onClick={() => setActiveStatus(index)}
              >
                <CheckCircle2 className="mb-2 h-4 w-4" />
                {status}
              </button>
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
            <CardContent className="space-y-3">
              <div className="rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm text-muted-foreground">Forwarder: AWB draft will be ready after booking confirmation.</div>
              <Textarea value={message} onChange={(event) => setMessage(event.target.value)} />
              <Button className="w-full" variant="gold">{t.send}</Button>
              <Button asChild className="w-full" variant="outline">
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
