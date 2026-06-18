"use client"

import { useEffect, useState } from "react"
import { Building2, CheckCircle2, Coins, Loader2, Star } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"

type Locale = "zh" | "en"

const copy = {
  zh: {
    title: "Live company profile",
    loading: "正在讀取公司資料",
    unauthenticated: "登入後會顯示真公司 profile。",
    company: "Company",
    tokens: "Tokens",
    reputation: "Reputation",
    onboarding: "Onboarding",
    complete: "Completed",
    pending: "Pending",
  },
  en: {
    title: "Live company profile",
    loading: "Loading company profile",
    unauthenticated: "Sign in to see your live company profile.",
    company: "Company",
    tokens: "Tokens",
    reputation: "Reputation",
    onboarding: "Onboarding",
    complete: "Completed",
    pending: "Pending",
  },
}

export function LiveProfileSummary({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { response, body } = await apiJson("/api/company-profile")
      if (cancelled) return
      setLoading(false)

      if (!response.ok) {
        setMessage(response.status === 401 ? t.unauthenticated : body?.error || "PROFILE_LOAD_FAILED")
        return
      }

      if (!body.companyProfile?.user_id) {
        setMessage(t.unauthenticated)
        return
      }

      setProfile(body.companyProfile)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [t.unauthenticated])

  const totalTokens = Number(profile?.token_balance_free || 0) + Number(profile?.token_balance_paid || 0)
  const companyName = profile?.company_name_en || profile?.company_name_zh || "LBID member"

  return (
    <Card className="mt-6 border-lblue/10 bg-white">
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-lgold" />
            {t.loading}
          </div>
        ) : message ? (
          <div className="rounded-md border border-lgold/25 bg-lgold/10 p-4 text-sm text-[#6f5514]">{message}</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-4">
            <Metric icon={Building2} label={t.company} value={companyName} />
            <Metric icon={Coins} label={t.tokens} value={totalTokens} />
            <Metric icon={Star} label={t.reputation} value={profile.reputation_score ?? 0} />
            <Metric icon={CheckCircle2} label={t.onboarding} value={profile.onboarding_completed ? t.complete : t.pending} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-lgold" />
        {label}
      </div>
      <div className="mt-2 break-words text-2xl font-black text-lblue">{value}</div>
    </div>
  )
}
