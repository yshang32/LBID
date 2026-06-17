"use client"

import Link from "next/link"
import { useState } from "react"
import { AlertTriangle, BellRing, CheckCircle2, Clock, FileCheck2, UploadCloud } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type DocumentItem = {
  id: string
  name: string
  required: boolean
  uploaded: boolean
  confirmed: boolean
}

const baseDocuments: DocumentItem[] = [
  { id: "awb", name: "AWB / B/L", required: true, uploaded: true, confirmed: true },
  { id: "invoice", name: "Commercial Invoice", required: true, uploaded: true, confirmed: false },
  { id: "packing", name: "Packing List", required: true, uploaded: false, confirmed: false },
  { id: "co", name: "Certificate of Origin", required: false, uploaded: false, confirmed: false },
]

const copy = {
  zh: {
    badge: "Document management",
    title: "訂單文件管理。",
    intro: "每張訂單有獨立文件清單。缺少必要文件時，系統會在 ship date 前 24 小時自動提醒雙方。",
    order: "Order reference",
    storage: "Production storage path",
    checklist: "文件清單",
    upload: "上傳文件",
    awb: "智能 AWB 填寫",
    uploaded: "已上傳",
    missing: "待補",
    optional: "可選",
    required: "必須",
    confirmed: "已確認",
    confirm: "電子確認",
    reminder: "提醒狀態",
    reminderText: "Packing List 尚未上傳，將在出貨前 24 小時觸發 email + 站內通知。",
    sendReminder: "立即發送提醒",
    reminderSent: "提醒已加入通知中心",
    progress: "文件完成率",
    next: "下一步",
    complete: "文件已齊",
    incomplete: "仍有必須文件待補",
    back: "返回訂單工作區",
    note: "Demo 版只顯示狀態變化；真實版本會寫入 Supabase Storage 和 documents table。",
  },
  en: {
    badge: "Document management",
    title: "Manage order documents.",
    intro: "Each order has its own document checklist. Missing required documents trigger reminders 24 hours before ship date.",
    order: "Order reference",
    storage: "Production storage path",
    checklist: "Document checklist",
    upload: "Upload document",
    awb: "Smart AWB fill",
    uploaded: "Uploaded",
    missing: "Missing",
    optional: "Optional",
    required: "Required",
    confirmed: "Confirmed",
    confirm: "E-confirm",
    reminder: "Reminder status",
    reminderText: "Packing List is still missing and will trigger email + in-app reminder 24 hours before ship date.",
    sendReminder: "Send reminder now",
    reminderSent: "Reminder queued in notification center",
    progress: "Document progress",
    next: "Next step",
    complete: "All required documents ready",
    incomplete: "Required documents still missing",
    back: "Back to order workspace",
    note: "The demo only changes local UI state; production writes to Supabase Storage and the documents table.",
  },
}

export default function OrderDocumentsPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [documents, setDocuments] = useState(baseDocuments)
  const [reminderSent, setReminderSent] = useState(false)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const requiredComplete = documents.filter((doc) => doc.required).every((doc) => doc.uploaded)
  const progress = Math.round((documents.filter((doc) => doc.uploaded).length / documents.length) * 100)

  async function markUploaded(id: string) {
    const item = documents.find((document) => document.id === id)
    if (!item) return

    setSavingId(id)
    setError("")
    const { response, body } = await apiJson(`/api/orders/${params.id}/documents`, {
      method: "POST",
      body: JSON.stringify({
        type: item.name,
        fileUrl: `https://example.com/lbid/${params.id}/${id}.pdf`,
      }),
    })

    setSavingId("")
    if (!response.ok) {
      setError(body.error || "Unable to save document")
      return
    }

    setDocuments((items) => items.map((document) => document.id === id ? { ...document, uploaded: true } : document))
  }

  function confirmDocument(id: string) {
    setDocuments((items) => items.map((item) => item.id === id ? { ...item, confirmed: true } : item))
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card className="border-white/10 bg-white/[0.045] md:w-96">
          <CardContent className="space-y-2 p-4">
            <div>
              <div className="text-sm text-muted-foreground">{t.order}</div>
              <div className="font-mono text-xl font-black text-lgold">{params.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.storage}</div>
              <div className="font-mono text-xs text-muted-foreground">/order-docs/{params.id}/</div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <FileCheck2 className="h-5 w-5 text-lgold" />
            <CardTitle>{t.checklist}</CardTitle>
            <CardDescription>{t.note}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="grid gap-3 rounded-lg border border-lblue/10 bg-slate-50 p-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{document.name}</h2>
                    <Badge variant={document.required ? "gold" : "secondary"}>{document.required ? t.required : t.optional}</Badge>
                    <Badge variant={document.uploaded ? "teal" : "secondary"}>{document.uploaded ? t.uploaded : t.missing}</Badge>
                    {document.confirmed ? <Badge variant="teal">{t.confirmed}</Badge> : null}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <Input type="file" className="max-w-sm" />
                    <Button variant="outline" disabled={savingId === document.id} onClick={() => markUploaded(document.id)}>
                      <UploadCloud className="h-4 w-4" />
                      {savingId === document.id ? "Saving..." : t.upload}
                    </Button>
                  </div>
                </div>
                <Button variant={document.confirmed ? "secondary" : "gold"} disabled={!document.uploaded} onClick={() => confirmDocument(document.id)}>
                  <CheckCircle2 className="h-4 w-4" />
                  {document.confirmed ? t.confirmed : t.confirm}
                </Button>
              </div>
            ))}
            {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
          </CardContent>
        </Card>
        <aside className="space-y-5">
          <Card className={requiredComplete ? "border-teal-400/30 bg-teal-400/10" : "border-lgold/30 bg-lgold/10"}>
            <CardHeader>
              {requiredComplete ? <CheckCircle2 className="h-5 w-5 text-teal-300" /> : <AlertTriangle className="h-5 w-5 text-lgold" />}
              <CardTitle>{requiredComplete ? t.complete : t.incomplete}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.progress}</CardTitle>
              <CardDescription>{progress}%</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-lgold" style={{ width: `${progress}%` }} />
              </div>
            </CardContent>
          </Card>
          <Button asChild className="w-full" variant="gold">
            <Link href={`/${locale}/orders/${params.id}/awb`}>{t.awb}</Link>
          </Button>
          <Card>
            <CardHeader>
              <Clock className="h-5 w-5 text-lgold" />
              <CardTitle>{t.reminder}</CardTitle>
              <CardDescription>{requiredComplete ? t.complete : reminderSent ? t.reminderSent : t.reminderText}</CardDescription>
            </CardHeader>
            {!requiredComplete ? (
              <CardContent>
                <Button className="w-full" variant="outline" onClick={() => setReminderSent(true)}>
                  <BellRing className="h-4 w-4" />
                  {reminderSent ? t.reminderSent : t.sendReminder}
                </Button>
              </CardContent>
            ) : null}
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t.next}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <Button asChild variant="outline">
                <Link href={`/${locale}/orders/${params.id}/messages`}>Open messages</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/orders/${params.id}/review`}>Completion review</Link>
              </Button>
            </CardContent>
          </Card>
          <Button asChild className="w-full" variant="outline">
            <Link href={`/${locale}/orders/${params.id}`}>{t.back}</Link>
          </Button>
        </aside>
      </section>
    </main>
  )
}
