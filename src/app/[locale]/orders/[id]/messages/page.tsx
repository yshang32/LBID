"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCheck, Clock, MessageSquare, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type Message = {
  id: string
  sender: "Agency" | "Forwarder" | "System"
  content: string
  time: string
  system?: boolean
  read?: boolean
}

const initialMessages: Message[] = [
  {
    id: "sys-1",
    sender: "System",
    content: "Order created from accepted quotation.",
    time: "10:24",
    system: true,
    read: true,
  },
]

const copy = {
  zh: {
    badge: "Order messages",
    title: "訂單訊息",
    intro: "每張訂單都有獨立訊息欄。重要節點會留下系統紀錄，減少外部 email 溝通。",
    order: "Order reference",
    participants: "Participants",
    agency: "Agency",
    forwarder: "Forwarder",
    thread: "Message thread",
    compose: "輸入訊息",
    send: "發送訊息",
    read: "已讀",
    unread: "未讀",
    realtime: "下一步可加入 Supabase Realtime 訂閱 messages table。",
    guarded: "偵測到外部聯絡資料，建議把交易溝通留在 LBID 內。",
    back: "返回訂單工作台",
    placeholder: "例如：請確認 AWB 草稿、船期或文件狀態。",
  },
  en: {
    badge: "Order messages",
    title: "Order message thread.",
    intro: "Each order has its own message thread. Key events create system records so both parties can avoid external email.",
    order: "Order reference",
    participants: "Participants",
    agency: "Agency",
    forwarder: "Forwarder",
    thread: "Message thread",
    compose: "Type message",
    send: "Send message",
    read: "Read",
    unread: "Unread",
    realtime: "Next step: subscribe to the messages table with Supabase Realtime.",
    guarded: "External contact details detected. Keep trade communication inside LBID.",
    back: "Back to order workspace",
    placeholder: "Example: Please confirm AWB draft, ship date or document status.",
  },
}

export default function OrderMessagesPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState(locale === "zh" ? "請確認 AWB 草稿和 pickup window。" : "Please confirm AWB draft and pickup window.")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const contactDetected = /(\+?\d[\d\s-]{7,}|@|whatsapp|wa\.me|email)/i.test(draft)

  async function sendMessage() {
    const content = draft.trim()
    if (!content) return

    setSending(true)
    setError("")
    const { response, body } = await apiJson(`/api/orders/${params.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })

    setSending(false)
    if (!response.ok) {
      setError(body.error || "Unable to send message")
      return
    }

    setMessages((items) => [
      ...items,
      {
        id: body.message?.id || `msg-${Date.now()}`,
        sender: "Agency",
        content,
        time: body.message?.created_at ? new Date(body.message.created_at).toLocaleTimeString() : "Now",
        read: false,
      },
    ])
    setDraft("")
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-5">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card>
          <CardHeader>
            <MessageSquare className="h-5 w-5 text-lgold" />
            <CardTitle>{t.thread}</CardTitle>
            <CardDescription>{t.realtime}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg border p-4 ${message.system ? "border-lgold/30 bg-lgold/10" : message.sender === "Agency" ? "border-teal-400/20 bg-teal-400/10" : "border-lblue/10 bg-slate-50"}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={message.system ? "gold" : message.sender === "Agency" ? "teal" : "secondary"}>{message.sender}</Badge>
                    <span className="text-xs text-muted-foreground">{message.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {message.read ? <CheckCheck className="h-3 w-3 text-teal-300" /> : <Clock className="h-3 w-3 text-lgold" />}
                    {message.read ? t.read : t.unread}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6">{message.content}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-5">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <div className="text-sm text-muted-foreground">{t.order}</div>
              <div className="break-all font-mono text-xl font-black text-lgold">{params.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.participants}</div>
              <div className="mt-2 grid gap-2 text-sm">
                <div className="rounded-md border border-lblue/10 bg-slate-50 p-2">{t.agency}</div>
                <div className="rounded-md border border-lblue/10 bg-slate-50 p-2">{t.forwarder}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>{t.compose}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.placeholder} />
            {contactDetected ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{t.guarded}</div> : null}
            {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
            <Button className="w-full" variant="gold" disabled={sending} onClick={sendMessage}>
              <Send className="h-4 w-4" />
              {sending ? "Sending..." : t.send}
            </Button>
            <Button asChild className="w-full" variant="outline">
              <Link href={`/${locale}/orders/${params.id}`}>{t.back}</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </main>
  )
}
