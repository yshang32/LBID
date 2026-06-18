"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Coins, Loader2, PackageCheck, RadioTower, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Role = "agency" | "forwarder" | "admin"
type Locale = "zh" | "en"

type LiveState = {
  loading: boolean
  authenticated: boolean
  error: string
  shipmentRequests: any[]
  matchRecords: any[]
  companyProfile: any | null
  paymentIntents: any[]
}

const initialState: LiveState = {
  loading: true,
  authenticated: false,
  error: "",
  shipmentRequests: [],
  matchRecords: [],
  companyProfile: null,
  paymentIntents: [],
}

const copy = {
  zh: {
    title: "即時工作區",
    loading: "正在載入 Supabase 工作區資料",
    demo: "登入真實帳號後，這裡會顯示你的 live workspace data。",
    error: "暫時未能載入即時資料",
    live: "Live Supabase",
    agencyPrimary: "我的 SR",
    forwarderPrimary: "可投標 SR",
    adminPrimary: "待處理付款",
    matches: "Match records",
    tokens: "Token balance",
    reputation: "Reputation",
    openMarketplace: "打開 Marketplace",
    createSr: "建立 SR",
    adminQueue: "打開 Admin queue",
  },
  en: {
    title: "Live workspace",
    loading: "Loading Supabase workspace data",
    demo: "Sign in to a real account to replace demo data with live workspace data.",
    error: "Live data is temporarily unavailable",
    live: "Live Supabase",
    agencyPrimary: "My SRs",
    forwarderPrimary: "Biddable SRs",
    adminPrimary: "Pending payments",
    matches: "Match records",
    tokens: "Token balance",
    reputation: "Reputation",
    openMarketplace: "Open Marketplace",
    createSr: "Create SR",
    adminQueue: "Open Admin queue",
  },
}

export function LiveDashboardPanel({ locale, role }: { locale: Locale; role: Role }) {
  const t = copy[locale]
  const [state, setState] = useState<LiveState>(initialState)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const supabase = getSupabaseBrowserClient()
      const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } }

      if (!data.session) {
        if (!cancelled) setState({ ...initialState, loading: false, authenticated: false })
        return
      }

      try {
        const [requests, matches, profile, payments] = await Promise.all([
          apiJson("/api/shipment-requests"),
          apiJson("/api/match-records"),
          apiJson("/api/company-profile"),
          role === "admin" ? apiJson("/api/admin/pending-payments") : Promise.resolve({ response: { ok: true }, body: { paymentIntents: [] } }),
        ])

        const failed = [requests, matches, profile, payments].find((item) => !item.response.ok)
        if (failed) throw new Error(failed.body?.error || "LIVE_DATA_FAILED")

        if (!cancelled) {
          setState({
            loading: false,
            authenticated: true,
            error: "",
            shipmentRequests: requests.body.shipmentRequests || [],
            matchRecords: matches.body.matchRecords || [],
            companyProfile: profile.body.companyProfile || null,
            paymentIntents: payments.body.paymentIntents || [],
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            ...initialState,
            loading: false,
            authenticated: true,
            error: error instanceof Error ? error.message : "LIVE_DATA_FAILED",
          })
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [role])

  const primaryMetric = useMemo(() => {
    if (role === "admin") return { label: t.adminPrimary, value: state.paymentIntents.length }
    return { label: role === "agency" ? t.agencyPrimary : t.forwarderPrimary, value: state.shipmentRequests.length }
  }, [role, state.paymentIntents.length, state.shipmentRequests.length, t.adminPrimary, t.agencyPrimary, t.forwarderPrimary])

  const tokenBalance = Number(state.companyProfile?.token_balance_free || 0) + Number(state.companyProfile?.token_balance_paid || 0)

  return (
    <Card className="mt-5 border-lblue/10 bg-white shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <div className="flex items-center gap-2">
            <RadioTower className="h-4 w-4 text-lgold" />
            <CardTitle>{t.title}</CardTitle>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.loading ? t.loading : state.authenticated ? t.live : t.demo}
          </p>
        </div>
        <Badge variant={state.authenticated ? "teal" : "secondary"}>{state.authenticated ? t.live : "Demo"}</Badge>
      </CardHeader>
      <CardContent>
        {state.loading ? (
          <div className="flex items-center gap-2 rounded-md border border-lblue/10 bg-slate-50 p-4 text-sm font-semibold text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-lgold" />
            {t.loading}
          </div>
        ) : state.error ? (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div>
              <div className="font-black">{t.error}</div>
              <div className="mt-1 font-mono text-xs">{state.error}</div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            <LiveMetric icon={PackageCheck} label={primaryMetric.label} value={primaryMetric.value} />
            <LiveMetric icon={ShieldCheck} label={t.matches} value={state.matchRecords.length} />
            <LiveMetric icon={Coins} label={t.tokens} value={state.authenticated ? tokenBalance : "--"} />
            <LiveMetric icon={CheckCircle2} label={t.reputation} value={state.companyProfile?.reputation_score ?? "--"} />
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {role === "agency" ? (
            <Button asChild variant="gold" size="sm">
              <Link href={`/${locale}/inquiries/new`}>{t.createSr}</Link>
            </Button>
          ) : role === "admin" ? (
            <Button asChild variant="gold" size="sm">
              <Link href={`/${locale}/admin/pending-payments`}>{t.adminQueue}</Link>
            </Button>
          ) : (
            <Button asChild variant="gold" size="sm">
              <Link href={`/${locale}/marketplace`}>{t.openMarketplace}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function LiveMetric({ icon: Icon, label, value }: { icon: typeof PackageCheck; label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4 text-lgold" />
        {label}
      </div>
      <div className="mt-2 text-3xl font-black text-lblue">{value}</div>
    </div>
  )
}
