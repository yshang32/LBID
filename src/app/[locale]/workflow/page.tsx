"use client"

import { useState } from "react"
import { Bell, CheckCircle2, ClipboardList, FileCheck2, FileText, MessageSquare, PackageCheck, Send, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"
import { getLocalizedDocumentChecklist, getLocalizedQuotation } from "@/lib/localized-data"

const copy = {
  zh: {
    badge: "詢價 → 報價 → 訂單",
    title: "LBID 核心交易流程。",
    intro: "Agency 提交結構化詢價後，系統通知配對貨代報價，並進入 PDF 報價、訂單追蹤、訊息、文件和評價流程。",
    notify: "通知配對貨代",
    inquiry: "Agency 詢價",
    inquiryDesc: "必填貨物、路線、服務和截止時間。",
    origin: "出發地",
    destination: "目的地",
    cargoType: "貨物類型",
    general: "普貨",
    dangerous: "危險品",
    cold: "冷鏈",
    mode: "運輸方式",
    air: "空運",
    sea: "海運",
    weight: "重量",
    deadline: "截止時間",
    services: "需要服務",
    submit: "提交詢價",
    quote: "專業報價",
    quoteDesc: "分項報價會生成 PDF quotation 俾 Agency 審核。",
    total: "報價總額",
    pdf: "生成 PDF",
    accept: "接受報價",
    accepted: "已接受",
    pipeline: "訂單狀態",
    statuses: ["已確認", "已訂艙", "運送中", "抵港", "已清關", "已送達", "已完成"],
    documents: "文件管理",
    documentsDesc: "出貨前 24 小時自動提醒。",
    uploaded: "已上傳",
    pending: "待補",
    upload: "上傳文件",
    messages: "訂單訊息",
    messagesDesc: "每張訂單獨立訊息欄，唔需要外部 email。",
    sampleMsg: "Forwarder：AWB 草稿已準備好，請確認 shipper 資料。",
    draftMsg: "請確認 AWB 草稿及冷鏈處理時間。",
    send: "發送訊息",
    notifications: "通知與評價",
    notificationText: "Resend email + 站內通知會在報價、接受、狀態更新和文件未齊時發出。",
    review: "完成後評價",
    activity: "流程記錄",
    activityEmpty: "按下流程按鈕後，記錄會即時顯示在這裡。",
    events: {
      notify: "已通知 3 間配對 Forwarder。",
      submit: "詢價已提交，狀態進入 sealed quotation window。",
      pdf: "Quotation PDF 已生成：QT-HK-8821.pdf。",
      accept: "Agency 已接受最低有效報價，訂單已建立。",
      upload: "文件清單已更新，待補文件會觸發提醒。",
      send: "訊息已加入訂單 thread。",
    },
  },
  en: {
    badge: "Inquiry to quotation to order",
    title: "Run the core LBID transaction flow.",
    intro: "A structured agency inquiry triggers matched forwarder quotations, a PDF quote pack, order tracking, messaging, documents and review.",
    notify: "Notify matched forwarders",
    inquiry: "Agency inquiry",
    inquiryDesc: "Required cargo, route, service and deadline fields.",
    origin: "Origin",
    destination: "Destination",
    cargoType: "Cargo type",
    general: "General cargo",
    dangerous: "Dangerous goods",
    cold: "Cold chain",
    mode: "Mode",
    air: "Air",
    sea: "Sea",
    weight: "Weight",
    deadline: "Deadline",
    services: "Services needed",
    submit: "Submit inquiry",
    quote: "Professional quotation",
    quoteDesc: "Line-item pricing becomes a PDF quotation for agency review.",
    total: "Total quotation",
    pdf: "Generate PDF",
    accept: "Accept quotation",
    accepted: "Accepted",
    pipeline: "Order pipeline",
    statuses: ["confirmed", "shipment_booked", "in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"],
    documents: "Documents",
    documentsDesc: "Auto-reminder 24h before ship date.",
    uploaded: "Uploaded",
    pending: "Pending",
    upload: "Upload document",
    messages: "Order messages",
    messagesDesc: "No external email needed for order discussion.",
    sampleMsg: "Forwarder: AWB draft is ready. Please confirm shipper details.",
    draftMsg: "Please confirm AWB draft and cold-chain handling window.",
    send: "Send message",
    notifications: "Notifications and review",
    notificationText: "Email via Resend + in-app notification centre will fire on quotation, acceptance, status update and missing document reminder.",
    review: "Completion review",
    activity: "Activity log",
    activityEmpty: "Workflow actions will appear here.",
    events: {
      notify: "Notified 3 matched forwarders.",
      submit: "Inquiry submitted and moved into the sealed quotation window.",
      pdf: "Quotation PDF generated: QT-HK-8821.pdf.",
      accept: "Agency accepted the lowest valid quotation and an order was created.",
      upload: "Document checklist updated; missing items will trigger reminders.",
      send: "Message added to the order thread.",
    },
  },
}

export default function LocalizedWorkflowPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const quotation = getLocalizedQuotation(locale)
  const documentChecklist = getLocalizedDocumentChecklist(locale)
  const [accepted, setAccepted] = useState(false)
  const [activeStatus, setActiveStatus] = useState(0)
  const [message, setMessage] = useState(t.draftMsg)
  const [activity, setActivity] = useState<string[]>([])
  const total = quotation.lineItems.reduce((sum, item) => sum + item.amount, 0)

  function addActivity(event: string) {
    setActivity((items) => [event, ...items].slice(0, 5))
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Button variant="gold" onClick={() => addActivity(t.events.notify)}>
          <Send className="h-4 w-4" />
          {t.notify}
        </Button>
      </div>
      <section className="mt-8 grid gap-5 lg:grid-cols-[420px_1fr]">
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <ClipboardList className="h-5 w-5 text-lgold" />
            <CardTitle>{t.inquiry}</CardTitle>
            <CardDescription>{t.inquiryDesc}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">{t.origin}<Input defaultValue="Ho Chi Minh City" /></label>
              <label className="space-y-2 text-sm font-semibold">{t.destination}<Input defaultValue="Hong Kong" /></label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">
                {t.cargoType}
                <Select defaultValue="cold">
                  <option value="general">{t.general}</option>
                  <option value="dg">{t.dangerous}</option>
                  <option value="cold">{t.cold}</option>
                </Select>
              </label>
              <label className="space-y-2 text-sm font-semibold">
                {t.mode}
                <Select defaultValue="air">
                  <option value="air">{t.air}</option>
                  <option value="sea">{t.sea}</option>
                </Select>
              </label>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">{t.weight}<Input defaultValue="420 kg" /></label>
              <label className="space-y-2 text-sm font-semibold">
                {t.deadline}
                <Select defaultValue="48">
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                </Select>
              </label>
            </div>
            <label className="space-y-2 text-sm font-semibold">
              {t.services}
              <Textarea defaultValue={locale === "zh" ? "冷鏈倉儲、清關、本地派送、POD 上傳" : "Cold storage, customs clearance, local delivery, POD upload"} />
            </label>
            <Button variant="gold" onClick={() => addActivity(t.events.submit)}>{t.submit}</Button>
          </CardContent>
        </Card>
        <div className="grid gap-5">
          <Card className="border-white/10 bg-white/[0.055]">
            <CardHeader>
              <FileText className="h-5 w-5 text-lgold" />
              <CardTitle>{t.quote}</CardTitle>
              <CardDescription>{t.quoteDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-white/10">
                {quotation.lineItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between border-b border-white/10 px-4 py-3 last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="font-mono font-bold">HKD {item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm text-muted-foreground">{t.total}</div>
                  <div className="text-3xl font-black text-lgold">HKD {total.toLocaleString()}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => addActivity(t.events.pdf)}><FileText className="h-4 w-4" />{t.pdf}</Button>
                  <Button
                    variant={accepted ? "secondary" : "gold"}
                    onClick={() => {
                      setAccepted(true)
                      addActivity(t.events.accept)
                    }}
                  >
                    {accepted ? t.accepted : t.accept}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/[0.045]">
            <CardHeader>
              <PackageCheck className="h-5 w-5 text-lgold" />
              <CardTitle>{t.pipeline}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-7">
              {t.statuses.map((status, index) => (
                <button
                  key={status}
                  className={`rounded-lg border p-3 text-left text-xs font-semibold transition ${index <= activeStatus ? "border-lgold/50 bg-lgold/15 text-lgold" : "border-white/10 bg-white/[0.035] text-muted-foreground"}`}
                  onClick={() => setActiveStatus(index)}
                >
                  <CheckCircle2 className="mb-2 h-4 w-4" />
                  {status}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
      <section className="mt-5 grid gap-5 lg:grid-cols-4">
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <FileCheck2 className="h-5 w-5 text-lgold" />
            <CardTitle>{t.documents}</CardTitle>
            <CardDescription>{t.documentsDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {documentChecklist.map((doc, index) => (
              <div key={doc} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <span>{doc}</span>
                <Badge variant={index < 2 ? "teal" : "gold"}>{index < 2 ? t.uploaded : t.pending}</Badge>
              </div>
            ))}
            <Button className="w-full" variant="outline" onClick={() => addActivity(t.events.upload)}>{t.upload}</Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <MessageSquare className="h-5 w-5 text-lgold" />
            <CardTitle>{t.messages}</CardTitle>
            <CardDescription>{t.messagesDesc}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">{t.sampleMsg}</div>
            <Textarea value={message} onChange={(event) => setMessage(event.target.value)} />
            <Button className="w-full" variant="gold" onClick={() => addActivity(t.events.send)}>{t.send}</Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <Bell className="h-5 w-5 text-lgold" />
            <CardTitle>{t.notifications}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm">{t.notificationText}</div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t.review}</span>
              <div className="flex gap-1 text-lgold">
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="h-4 w-4 fill-current" />)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardHeader>
            <CardTitle>{t.activity}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {activity.length === 0 ? (
              <div className="text-muted-foreground">{t.activityEmpty}</div>
            ) : (
              activity.map((item, index) => (
                <div key={`${item}-${index}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  {item}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
