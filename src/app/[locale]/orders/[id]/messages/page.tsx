"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { CheckCheck, Clock, MessageSquare, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Message = {
  id: string
  sender: "Agency" | "Forwarder" | "System"
  content: string
  time: string
  system?: boolean
  read?: boolean
}

const initialMessages: Message[] = [
  { id: "sys-1", sender: "System", content: "Order created from accepted quotation.", time: "10:24", system: true, read: true },
]

const copy = {
  zh: {
    badge: "Order messages",
    title: "Order message thread",
    intro: "每個 order 都有獨立訊息欄。重要事件會形成 system record，雙方不需要再靠外部 email 追蹤。",
    order: "Order reference",
    participants: "Participants",
    agency: "Agency",
    forwarder: "Forwarder",
    thread: "Message thread",
    compose: "輸入訊息",
    send: "Send message",
    sending: "Sending...",
    read: "Read",
    unread: "Unread",
    realtime: "下一步可接 Supabase Realtime，讓訊息即時更新。",
    realtimeOn: "Supabase Realtime 已連接，訊息會自動更新。",
    guarded: "偵測到外部聯絡資料。Phase 1 建議保持交易溝通在 LBID 內。",
    back: "返回 order workspace",
    placeholder: "例如：請確認 AWB draft、ship date 或文件狀態。",
    defaultDraft: "請確認 AWB draft 和 pickup window。",
    loadFailed: "暫時未能載入 live messages，先顯示本地 thread。",
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
    sending: "Sending...",
    read: "Read",
    unread: "Unread",
    realtime: "Next step: subscribe to the messages table with Supabase Realtime.",
    realtimeOn: "Supabase Realtime connected. Messages update automatically.",
    guarded: "External contact details detected. Keep trade communication inside LBID.",
    back: "Back to order workspace",
    placeholder: "Example: Please confirm AWB draft, ship date or document status.",
    defaultDraft: "Please confirm AWB draft and pickup window.",
    loadFailed: "Unable to load live messages. Showing local thread for now.",
  },
}

export default function OrderMessagesPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState(t.defaultDraft)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [realtimeReady, setRealtimeReady] = useState(false)
  const contactDetected = /(\+?\d[\d\s-]{7,}|@|whatsapp|wa\.me|email)/i.test(draft)

  useEffect(() => {
    let mounted = true
    apiJson(`/api/orders/${params.id}/messages`).then(({ response, body }) => {
      if (!mounted) return
      if (!response.ok) {
        if (response.status !== 401) setError(t.loadFailed)
        return
      }
      const liveMessages = Array.isArray(body.messages) ? body.messages : []
      if (liveMessages.length > 0) {
        setMessages(liveMessages.map((message: any) => ({
          id: message.id,
          sender: "Agency",
          content: message.content,
          time: message.created_at ? new Date(message.created_at).toLocaleTimeString() : "",
          read: true,
        })))
      }
    })
    return () => {
      mounted = false
    }
  }, [params.id, t.loadFailed])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const channel = supabase
      .channel(`order-messages-${params.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `order_id=eq.${params.id}` },
        (payload) => {
          const row: any = payload.new
          setMessages((items) => {
            if (items.some((item) => item.id === row.id)) return items
            return [
              ...items,
              {
                id: row.id,
                sender: "Forwarder",
                content: row.content,
                time: row.created_at ? new Date(row.created_at).toLocaleTimeString() : "Now",
                read: true,
              },
            ]
          })
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeReady(true)
      })

    return () => {
      setRealtimeReady(false)
      supabase.removeChannel(channel)
    }
  }, [params.id])

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
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[1fr_340px] lg:pb-10">
      <section className="space-y-5">
        <div className="rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card>
          <CardHeader>
            <MessageSquare className="h-5 w-5 text-lgold" />
            <CardTitle>{t.thread}</CardTitle>
            <CardDescription>{realtimeReady ? t.realtimeOn : t.realtime}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-lg border p-4 ${message.system ? "border-lgold/30 bg-lgold/10" : message.sender === "Agency" ? "border-teal-200 bg-teal-50" : "border-lblue/10 bg-slate-50"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={message.system ? "gold" : message.sender === "Agency" ? "teal" : "secondary"}>{message.sender}</Badge>
                    <span className="text-xs text-muted-foreground">{message.time}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {message.read ? <CheckCheck className="h-3 w-3 text-teal-700" /> : <Clock className="h-3 w-3 text-lgold" />}
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
              {sending ? t.sending : t.send}
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
