"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { BarChart3, BadgeCheck, CreditCard, Crown, Users, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Admin Console",
    title: "管理 forwarder 驗證、會員、付款和 marketplace quality。",
    forwarders: "Forwarders",
    verified: "已驗證",
    paid: "付費會員",
    winRate: "Quote win rate",
    payments: "待確認付款",
    queue: "Forwarder verification queue",
    review: "查看付款",
    approve: "Approve",
    reject: "Reject",
    public: "Public",
    private: "Private",
    loading: "載入 live queue...",
    demo: "未登入 Admin 時顯示 demo queue；登入後會讀取 Supabase company_profiles。",
  },
  en: {
    badge: "Admin Console",
    title: "Manage forwarder verification, membership, payments and marketplace quality.",
    forwarders: "Forwarders",
    verified: "Verified",
    paid: "Paid members",
    winRate: "Quote win rate",
    payments: "Pending payments",
    queue: "Forwarder verification queue",
    review: "Review payments",
    approve: "Approve",
    reject: "Reject",
    public: "Public",
    private: "Private",
    loading: "Loading live queue...",
    demo: "Demo queue is shown when not signed in as Admin. Signed-in Admin reads Supabase company_profiles.",
  },
}

export default function LocalizedAdminPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [forwarders, setForwarders] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState("")

  useEffect(() => {
    let mounted = true
    Promise.all([
      apiJson("/api/admin/forwarders"),
      apiJson("/api/admin/pending-payments"),
    ]).then(([forwarderResult, paymentResult]) => {
      if (!mounted) return
      setForwarders(Array.isArray(forwarderResult.body.forwarders) ? forwarderResult.body.forwarders : [])
      setPayments(Array.isArray(paymentResult.body.paymentIntents) ? paymentResult.body.paymentIntents : [])
      setLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  const verifiedCount = useMemo(() => forwarders.filter((item) => item.verificationStatus === "verified").length, [forwarders])

  async function verifyForwarder(id: string, action: "approve" | "reject") {
    setBusyId(id)
    const { response, body } = await apiJson(`/api/admin/forwarders/${id}/verify`, {
      method: "POST",
      body: JSON.stringify({ action }),
    })
    setBusyId("")

    if (!response.ok) {
      setForwarders((items) => items.map((item) => item.id === id ? { ...item, localError: body.error || "Unable to update" } : item))
      return
    }

    setForwarders((items) => items.map((item) => item.id === id ? {
      ...item,
      verificationStatus: body.profile?.verification_status || (action === "approve" ? "verified" : "rejected"),
      isPublic: body.profile?.is_public ?? item.isPublic,
      localError: "",
    } : item))
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <Badge variant="gold">{t.badge}</Badge>
      <h1 className="mt-4 max-w-5xl text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">{loading ? t.loading : t.demo}</p>

      <section className="mt-8 grid gap-4 md:grid-cols-5">
        <Metric icon={Users} label={t.forwarders} value={String(forwarders.length)} />
        <Metric icon={BadgeCheck} label={t.verified} value={String(verifiedCount)} />
        <Metric icon={Crown} label={t.paid} value="2" />
        <Metric icon={BarChart3} label={t.winRate} value="38%" />
        <Card className="border-white/10 bg-white/[0.045]">
          <CardContent className="p-5">
            <CreditCard className="h-5 w-5 text-lgold" />
            <div className="mt-3 text-sm text-muted-foreground">{t.payments}</div>
            <div className="text-3xl font-black text-lblue">{payments.length}</div>
            <Button asChild className="mt-3 w-full" size="sm" variant="outline">
              <Link href={`/${locale}/admin/pending-payments`}>{t.review}</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card className="mt-6 border-white/10 bg-white/[0.045]">
        <CardHeader>
          <CardTitle>{t.queue}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {forwarders.map((forwarder) => (
            <div key={forwarder.id} className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="font-semibold text-lblue">{forwarder.companyName}</div>
                <div className="text-sm text-muted-foreground">{forwarder.region}</div>
                {forwarder.localError ? <div className="mt-2 text-sm font-semibold text-red-700">{forwarder.localError}</div> : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={forwarder.verificationStatus === "verified" ? "teal" : forwarder.verificationStatus === "rejected" ? "secondary" : "gold"}>
                  {forwarder.verificationStatus}
                </Badge>
                <Badge variant={forwarder.isPublic ? "teal" : "secondary"}>{forwarder.isPublic ? t.public : t.private}</Badge>
                <Button size="sm" variant="outline" disabled={busyId === forwarder.id} onClick={() => verifyForwarder(forwarder.id, "reject")}>
                  <XCircle className="h-4 w-4" />
                  {t.reject}
                </Button>
                <Button size="sm" variant="gold" disabled={busyId === forwarder.id} onClick={() => verifyForwarder(forwarder.id, "approve")}>
                  <BadgeCheck className="h-4 w-4" />
                  {t.approve}
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <Card className="border-white/10 bg-white/[0.045]">
      <CardContent className="p-5">
        <Icon className="h-5 w-5 text-lgold" />
        <div className="mt-3 text-sm text-muted-foreground">{label}</div>
        <div className="text-3xl font-black text-lblue">{value}</div>
      </CardContent>
    </Card>
  )
}
