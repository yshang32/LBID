"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, CheckCircle2, Circle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Notification centre",
    title: "通知中心",
    intro: "集中顯示 quotation、order、documents、messages 和 payment 的重要狀態。",
    empty: "暫時未有通知。",
    unauthenticated: "未登入時會顯示 demo 狀態；登入後會讀取 Supabase notifications table。",
    open: "打開",
    markRead: "標記已讀",
    markAll: "全部標記已讀",
    loading: "載入中...",
  },
  en: {
    badge: "Notification centre",
    title: "Notification centre",
    intro: "A single place for quotation, order, document, message and payment updates.",
    empty: "No notifications yet.",
    unauthenticated: "Demo state is shown when signed out. Signed-in users read from the Supabase notifications table.",
    open: "Open",
    markRead: "Mark read",
    markAll: "Mark all read",
    loading: "Loading...",
  },
}

export default function NotificationsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [notifications, setNotifications] = useState<any[]>([])
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    apiJson("/api/notifications").then(({ body }) => {
      if (!mounted) return
      setNotifications(Array.isArray(body.notifications) ? body.notifications : [])
      setAuthenticated(Boolean(body.authenticated))
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  async function markRead(id?: string) {
    const { response } = await apiJson("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ id, all: !id }),
    })
    if (!response.ok) return
    const now = new Date().toISOString()
    setNotifications((items) => items.map((item) => (!id || item.id === id ? { ...item, read_at: item.read_at || now } : item)))
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="rounded-lg border border-lblue/10 bg-white/88 p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="gold">{t.badge}</Badge>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
            <p className="mt-3 max-w-3xl text-muted-foreground">{authenticated ? t.intro : t.unauthenticated}</p>
          </div>
          {authenticated && notifications.some((item) => !item.read_at) ? (
            <Button variant="outline" onClick={() => markRead()}>
              <CheckCircle2 className="h-4 w-4" />
              {t.markAll}
            </Button>
          ) : null}
        </div>
      </section>

      <section className="mt-5 space-y-3">
        {loading ? (
          <Card>
            <CardContent className="p-5 text-muted-foreground">{t.loading}</CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-5 text-muted-foreground">
              <Bell className="h-5 w-5 text-lgold" />
              {t.empty}
            </CardContent>
          </Card>
        ) : notifications.map((item) => (
          <Card key={item.id}>
            <CardHeader className="flex-row items-start gap-3 space-y-0">
              {item.read_at ? <CheckCircle2 className="mt-1 h-5 w-5 text-teal-700" /> : <Circle className="mt-1 h-5 w-5 text-lgold" />}
              <div className="flex-1">
                <CardTitle>{item.title}</CardTitle>
                <CardDescription>{item.body}</CardDescription>
              </div>
              {item.href ? (
                <Button asChild variant="outline" size="sm">
                  <Link href={item.href}>{t.open}</Link>
                </Button>
              ) : null}
              {!item.read_at ? (
                <Button variant="ghost" size="sm" onClick={() => markRead(item.id)}>{t.markRead}</Button>
              ) : null}
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  )
}
