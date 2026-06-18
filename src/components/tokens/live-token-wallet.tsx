"use client"

import { useEffect, useState } from "react"
import { Coins, Gem, Loader2, RotateCcw, Star } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"

type Locale = "zh" | "en"

const copy = {
  zh: {
    title: "Live token wallet",
    loading: "正在讀取 token balance",
    unauthenticated: "登入後會顯示真 token balance。",
    free: "Free",
    paid: "Paid",
    total: "Total",
    score: "Reputation",
  },
  en: {
    title: "Live token wallet",
    loading: "Loading token balance",
    unauthenticated: "Sign in to see live token balance.",
    free: "Free",
    paid: "Paid",
    total: "Total",
    score: "Reputation",
  },
}

export function LiveTokenWallet({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const [wallet, setWallet] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState("")

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { response, body } = await apiJson("/api/tokens")
      if (cancelled) return
      setLoading(false)

      if (!response.ok) {
        setMessage(response.status === 401 ? t.unauthenticated : body?.error || "TOKEN_LOAD_FAILED")
        return
      }

      setWallet(body.wallet)
    }

    load()
    return () => {
      cancelled = true
    }
  }, [t.unauthenticated])

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
            <Metric icon={Coins} label={t.free} value={wallet.free} />
            <Metric icon={Gem} label={t.paid} value={wallet.paid} />
            <Metric icon={RotateCcw} label={t.total} value={wallet.total} />
            <Metric icon={Star} label={t.score} value={wallet.reputationScore} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Coins; label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-lgold" />
        {label}
      </div>
      <div className="mt-2 text-3xl font-black text-lblue">{value ?? "--"}</div>
    </div>
  )
}
