"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCheck, Clock, MessageSquare, Paperclip, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"

type Message = {
  id: string
  sender: "Agency" | "Forwarder" | "System"
  content: string
  time: string
  system?: boolean
  attachment?: string
  read?: boolean
}

const initialMessages: Message[] = [
  {
    id: "sys-1",
    sender: "System",
    content: "Order created from accepted quotation LBID-Q-2026-0001.",
    time: "10:24",
    system: true,
    read: true,
  },
  {
    id: "msg-1",
    sender: "Forwarder",
    content: "Booking request received. We are checking BOM-HKG space for the requested ship date.",
    time: "10:31",
    read: true,
  },
  {
    id: "msg-2",
    sender: "Agency",
    content: "Please confirm if pickup from Mumbai warehouse is included.",
    time: "10:36",
    read: true,
  },
  {
    id: "msg-3",
    sender: "Forwarder",
    content: "Confirmed. Pickup within Mumbai city limits is included. AWB draft attached for checking.",
    time: "10:42",
    attachment: "AWB-DEMO-0001.pdf",
    read: false,
  },
]

const copy = {
  zh: {
    badge: "Order messages",
    title: "訂單訊息欄。",
    intro: "每張訂單有獨立訊息 thread。重要節點會自動產生 system message，雙方無需再用外部 email。",
    order: "Order reference",
    participants: "Participants",
    agency: "ABC Company",
    forwarder: "HarbourLink Cargo",
    thread: "Message thread",
    compose: "輸入訊息",
    send: "發送訊息",
    attach: "附件",
    read: "已讀",
    unread: "未讀",
    realtime: "Production 會用 Supabase Realtime 訂閱 messages table。",
    back: "返回訂單工作區",
    placeholder: "例如：請確認 AWB 草稿、ship date 或文件狀態。",
    sentPrefix: "Agency",
  },
  en: {
    badge: "Order messages",
    title: "Order message thread.",
    intro: "Each order has its own message thread. Key events create system messages so both parties can avoid external email.",
    order: "Order reference",
    participants: "Participants",
    agency: "ABC Company",
    forwarder: "HarbourLink Cargo",
    thread: "Message thread",
    compose: "Type message",
    send: "Send message",
    attach: "Attachment",
    read: "Read",
    unread: "Unread",
    realtime: "Production subscribes to the messages table with Supabase Realtime.",
    back: "Back to order workspace",
    placeholder: "Example: Please confirm AWB draft, ship date or document status.",
    sentPrefix: "Agency",
  },
}

export default function OrderMessagesPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState(locale === "zh" ? "請確認 AWB 草稿和 pickup window。" : "Please confirm AWB draft and pickup window.")

  function sendMessage() {
    const content = draft.trim()
    if (!content) return

    setMessages((items) => [
      ...items,
      {
        id: `msg-${Date.now()}`,
        sender: "Agency",
        content,
        time: "Now",
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
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <MessageSquare className="h-5 w-5 text-lgold" />
            <CardTitle>{t.thread}</CardTitle>
            <CardDescription>{t.realtime}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`rounded-lg border p-4 ${message.system ? "border-lgold/30 bg-lgold/10" : message.sender === "Agency" ? "border-teal-400/20 bg-teal-400/10" : "border-white/10 bg-white/[0.035]"}`}
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
                {message.attachment ? (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-lgold">
                    <Paperclip className="h-4 w-4" />
                    {message.attachment}
                  </div>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-5">
        <Card className="border-white/10 bg-white/[0.045]">
          <CardContent className="space-y-3 p-4">
            <div>
              <div className="text-sm text-muted-foreground">{t.order}</div>
              <div className="font-mono text-xl font-black text-lgold">{params.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.participants}</div>
              <div className="mt-2 grid gap-2 text-sm">
                <div className="rounded-md border border-white/10 bg-white/[0.035] p-2">{t.agency}</div>
                <div className="rounded-md border border-white/10 bg-white/[0.035] p-2">{t.forwarder}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="sticky top-24 border-white/10 bg-white/[0.055]">
          <CardHeader>
            <CardTitle>{t.compose}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.placeholder} />
            <Input type="file" />
            <Button className="w-full" variant="gold" onClick={sendMessage}>
              <Send className="h-4 w-4" />
              {t.send}
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
