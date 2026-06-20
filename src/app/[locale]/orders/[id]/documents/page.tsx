"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertTriangle, BellRing, CheckCircle2, Clock, FileCheck2, UploadCloud } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { apiJson, getAuthHeaders } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type DocumentItem = {
  id: string
  name: string
  required: boolean
  uploaded: boolean
  confirmed: boolean
  fileUrl?: string
}

const baseDocuments: DocumentItem[] = [
  { id: "awb", name: "AWB / B/L", required: true, uploaded: false, confirmed: false },
  { id: "invoice", name: "Commercial Invoice", required: true, uploaded: false, confirmed: false },
  { id: "packing", name: "Packing List", required: true, uploaded: false, confirmed: false },
  { id: "co", name: "Certificate of Origin", required: false, uploaded: false, confirmed: false },
]

const copy = {
  zh: {
    badge: "Document management",
    title: "管理 order documents",
    intro: "每個 order 都有獨立 document checklist。必需文件未齊時，可在出貨前 24 小時觸發 email + in-app reminder。",
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
    reminderText: "仍有必需文件未齊，系統應在 ship date 前 24 小時提醒雙方。",
    sendReminder: "Send reminder now",
    reminderSent: "Reminder queued in notification center",
    progress: "Document progress",
    next: "Next step",
    complete: "All required documents ready",
    incomplete: "Required documents still missing",
    back: "返回 order workspace",
    note: "Production 會寫入 Supabase Storage 和 documents table。",
    chooseFile: "請先選擇文件",
    saving: "Saving...",
    openMessages: "Open messages",
    completionReview: "Completion review",
    liveFailed: "暫時未能載入 live documents，先顯示 checklist。",
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
    reminderText: "Required documents are still missing and should trigger email + in-app reminders 24 hours before ship date.",
    sendReminder: "Send reminder now",
    reminderSent: "Reminder queued in notification center",
    progress: "Document progress",
    next: "Next step",
    complete: "All required documents ready",
    incomplete: "Required documents still missing",
    back: "Back to order workspace",
    note: "Production writes to Supabase Storage and the documents table.",
    chooseFile: "Please choose a file first",
    saving: "Saving...",
    openMessages: "Open messages",
    completionReview: "Completion review",
    liveFailed: "Unable to load live documents. Showing checklist for now.",
  },
}

export default function OrderDocumentsPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [documents, setDocuments] = useState(baseDocuments)
  const [reminderSent, setReminderSent] = useState(false)
  const [savingId, setSavingId] = useState("")
  const [error, setError] = useState("")
  const [reminderLoading, setReminderLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({})

  useEffect(() => {
    let mounted = true
    apiJson(`/api/orders/${params.id}/documents`).then(({ response, body }) => {
      if (!mounted) return
      if (!response.ok) {
        if (response.status !== 401) setError(t.liveFailed)
        return
      }
      const liveDocs = Array.isArray(body.documents) ? body.documents : []
      setDocuments((items) => items.map((item) => {
        const live = liveDocs.find((doc: any) => String(doc.type).toLowerCase().includes(item.name.toLowerCase().split(" ")[0]))
        return live ? { ...item, uploaded: true, confirmed: true, fileUrl: live.file_url } : item
      }))
    })
    return () => {
      mounted = false
    }
  }, [params.id, t.liveFailed])

  const requiredComplete = documents.filter((doc) => doc.required).every((doc) => doc.uploaded)
  const progress = Math.round((documents.filter((doc) => doc.uploaded).length / documents.length) * 100)

  async function markUploaded(id: string) {
    const item = documents.find((document) => document.id === id)
    if (!item) return
    const file = selectedFiles[id]
    if (!file) {
      setError(t.chooseFile)
      return
    }

    setSavingId(id)
    setError("")
    const authHeaders = await getAuthHeaders()
    const formData = new FormData()
    formData.append("type", item.name)
    formData.append("file", file)

    const response = await fetch(`/api/orders/${params.id}/documents`, {
      method: "POST",
      headers: authHeaders,
      body: formData,
    })
    const body = await response.json().catch(() => ({}))

    setSavingId("")
    if (!response.ok) {
      setError(body.error || "Unable to save document")
      return
    }

    setDocuments((items) => items.map((document) => document.id === id ? { ...document, uploaded: true, fileUrl: body.document?.file_url } : document))
  }

  function confirmDocument(id: string) {
    setDocuments((items) => items.map((item) => item.id === id ? { ...item, confirmed: true } : item))
  }

  async function sendReminder() {
    setReminderLoading(true)
    setError("")
    const { response, body } = await apiJson(`/api/orders/${params.id}/documents/reminder`, {
      method: "POST",
      body: JSON.stringify({}),
    })
    setReminderLoading(false)
    if (!response.ok) {
      setError(body.error || "Unable to queue reminder")
      return
    }
    setReminderSent(true)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="flex flex-col gap-5 rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)] md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card className="md:w-96">
          <CardContent className="space-y-2 p-4">
            <div>
              <div className="text-sm text-muted-foreground">{t.order}</div>
              <div className="break-all font-mono text-xl font-black text-lgold">{params.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.storage}</div>
              <div className="font-mono text-xs text-muted-foreground">/order-docs/{params.id}/</div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
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
                    <h2 className="font-bold text-lblue">{document.name}</h2>
                    <Badge variant={document.required ? "gold" : "secondary"}>{document.required ? t.required : t.optional}</Badge>
                    <Badge variant={document.uploaded ? "teal" : "secondary"}>{document.uploaded ? t.uploaded : t.missing}</Badge>
                    {document.confirmed ? <Badge variant="teal">{t.confirmed}</Badge> : null}
                  </div>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <Input type="file" className="max-w-sm" onChange={(event) => setSelectedFiles((items) => ({ ...items, [document.id]: event.target.files?.[0] || null }))} />
                    <Button variant="outline" disabled={savingId === document.id} onClick={() => markUploaded(document.id)}>
                      <UploadCloud className="h-4 w-4" />
                      {savingId === document.id ? t.saving : t.upload}
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
          <Card className={requiredComplete ? "border-teal-200 bg-teal-50" : "border-lgold/30 bg-lgold/10"}>
            <CardHeader>
              {requiredComplete ? <CheckCircle2 className="h-5 w-5 text-teal-700" /> : <AlertTriangle className="h-5 w-5 text-lgold" />}
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
                <Button className="w-full" variant="outline" disabled={reminderLoading} onClick={sendReminder}>
                  <BellRing className="h-4 w-4" />
                  {reminderLoading ? t.saving : reminderSent ? t.reminderSent : t.sendReminder}
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
                <Link href={`/${locale}/orders/${params.id}/messages`}>{t.openMessages}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/orders/${params.id}/review`}>{t.completionReview}</Link>
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
