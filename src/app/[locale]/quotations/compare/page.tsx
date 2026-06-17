"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Award, CheckCircle2, FileText, ShieldCheck, Star, Timer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type Quote = {
  id: string
  forwarder: string
  total: number
  transit: string
  rating: number
  verified: boolean
  pdf: string
}

const quotes: Quote[] = [
  { id: "QT-HK-8821", forwarder: "HarbourLink Cargo", total: 1801.6, transit: "3-5 days", rating: 4.9, verified: true, pdf: "QT-HK-8821.pdf" },
  { id: "QT-HK-8824", forwarder: "Kowloon Gateway Logistics", total: 1920, transit: "4-6 days", rating: 4.7, verified: true, pdf: "QT-HK-8824.pdf" },
  { id: "QT-HK-8829", forwarder: "Aeroport Express Forwarding", total: 2050, transit: "2-4 days", rating: 4.8, verified: true, pdf: "QT-HK-8829.pdf" },
]

const copy = {
  zh: {
    badge: "Quotation comparison",
    title: "比較收到的 Forwarder 報價。",
    intro: "Agency 可以按總價、時效、評分和 verified 狀態比較報價。預設由最低總價排序。",
    inquiry: "Inquiry",
    route: "Mumbai (BOM) → Hong Kong (HKG)",
    cargo: "Electronic components, 500kg / 3CBM",
    ref: "LBID-INQ-2026-0001",
    lowest: "最低報價",
    verified: "已驗證",
    total: "總價",
    transit: "預計時間",
    rating: "評分",
    pdf: "查看 PDF",
    accept: "接受報價",
    accepted: "已接受",
    sort: "排序",
    byPrice: "最低價",
    byTransit: "最快時效",
    byRating: "最高評分",
    shortlist: "加入 shortlist",
    shortlisted: "已加入 shortlist",
    confirmTitle: "Order 已建立",
    confirmBody: "Winning Forwarder 會收到通知；其他 Forwarder 會收到未被選中通知。",
    orderRef: "Order reference",
    next: "查看訂單工作區",
    note: "Forwarder 之間看不到彼此報價。Agency 只會在自己的 inquiry 內看到比較表。",
  },
  en: {
    badge: "Quotation comparison",
    title: "Compare received forwarder quotations.",
    intro: "Agencies compare total price, transit time, rating and verified status. The table is sorted by lowest total by default.",
    inquiry: "Inquiry",
    route: "Mumbai (BOM) → Hong Kong (HKG)",
    cargo: "Electronic components, 500kg / 3CBM",
    ref: "LBID-INQ-2026-0001",
    lowest: "Lowest quote",
    verified: "Verified",
    total: "Total",
    transit: "Transit",
    rating: "Rating",
    pdf: "View PDF",
    accept: "Accept quotation",
    accepted: "Accepted",
    sort: "Sort",
    byPrice: "Lowest price",
    byTransit: "Fastest transit",
    byRating: "Highest rating",
    shortlist: "Shortlist",
    shortlisted: "Shortlisted",
    confirmTitle: "Order created",
    confirmBody: "The winning forwarder is notified; other forwarders receive a not-selected update.",
    orderRef: "Order reference",
    next: "View order workspace",
    note: "Forwarders cannot see each other's quotations. Agencies only see comparison inside their own inquiry.",
  },
}

export default function QuotationComparePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [acceptedQuote, setAcceptedQuote] = useState<Quote | null>(null)
  const [sort, setSort] = useState<"price" | "transit" | "rating">("price")
  const [shortlisted, setShortlisted] = useState<string[]>([])
  const [bidId, setBidId] = useState("")
  const [orderId, setOrderId] = useState("LBID-ORD-2026-0001")
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")
  const sortedQuotes = [...quotes].sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating
    if (sort === "transit") return Number.parseInt(a.transit) - Number.parseInt(b.transit)
    return a.total - b.total
  })

  function toggleShortlist(id: string) {
    setShortlisted((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  }

  useEffect(() => {
    setBidId(new URLSearchParams(window.location.search).get("bidId") ?? "")
  }, [])

  async function acceptQuote(quote: Quote) {
    setError("")
    setAccepting(true)

    if (bidId) {
      const { response, body } = await apiJson(`/api/bids/${bidId}/accept`, {
        method: "POST",
        body: JSON.stringify({ totalAmount: quote.total }),
      })

      setAccepting(false)
      if (!response.ok) {
        setError(body.error || "Unable to accept bid")
        return
      }

      setOrderId(body.order?.id || "LBID-ORD-2026-0001")
      setAcceptedQuote(quote)
      return
    }

    setAccepting(false)
    setAcceptedQuote(quote)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card className="border-white/10 bg-white/[0.045] md:w-80">
          <CardContent className="space-y-1 p-4 text-sm">
            <div className="font-mono text-lgold">{t.ref}</div>
            <div className="font-semibold">{t.route}</div>
            <div className="text-muted-foreground">{t.cargo}</div>
          </CardContent>
        </Card>
      </section>
      <section className="mt-5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">{t.sort}</span>
        <Button variant={sort === "price" ? "gold" : "outline"} size="sm" onClick={() => setSort("price")}>{t.byPrice}</Button>
        <Button variant={sort === "transit" ? "gold" : "outline"} size="sm" onClick={() => setSort("transit")}>{t.byTransit}</Button>
        <Button variant={sort === "rating" ? "gold" : "outline"} size="sm" onClick={() => setSort("rating")}>{t.byRating}</Button>
      </section>
      <section className="mt-8 grid gap-4">
        {sortedQuotes.map((quote, index) => {
          const isAccepted = acceptedQuote?.id === quote.id

          return (
            <Card key={quote.id} className={`border-white/10 bg-white/[0.045] ${index === 0 ? "border-lgold/40 bg-lgold/10" : ""}`}>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.4fr_120px_120px_120px_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">{quote.forwarder}</h2>
                    {index === 0 ? <Badge variant="gold">{t.lowest}</Badge> : null}
                    {quote.verified ? <Badge variant="teal"><ShieldCheck className="mr-1 h-3 w-3" />{t.verified}</Badge> : null}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 text-lgold" />
                    {quote.pdf}
                  </div>
                </div>
                <Metric icon={Award} label={t.total} value={`USD ${formatMoney(quote.total)}`} />
                <Metric icon={Timer} label={t.transit} value={quote.transit} />
                <Metric icon={Star} label={t.rating} value={String(quote.rating)} />
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button variant="outline">{t.pdf}</Button>
                  <Button variant={shortlisted.includes(quote.id) ? "secondary" : "outline"} onClick={() => toggleShortlist(quote.id)}>
                    {shortlisted.includes(quote.id) ? t.shortlisted : t.shortlist}
                  </Button>
                  <Button variant={isAccepted ? "secondary" : "gold"} disabled={accepting} onClick={() => acceptQuote(quote)}>
                    {accepting ? "Accepting..." : isAccepted ? t.accepted : t.accept}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
      <Card className="mt-5 border-white/10 bg-white/[0.045]">
        <CardContent className="p-4 text-sm text-muted-foreground">{t.note}</CardContent>
      </Card>
      {error ? (
        <Card className="mt-5 border-red-400/30 bg-red-400/10">
          <CardContent className="p-4 text-sm font-semibold text-red-100">{error}</CardContent>
        </Card>
      ) : null}
      {acceptedQuote ? (
        <Card className="mt-5 border-teal-400/30 bg-teal-400/10">
          <CardHeader>
            <CheckCircle2 className="h-5 w-5 text-teal-300" />
            <CardTitle>{t.confirmTitle}</CardTitle>
            <CardDescription>{t.confirmBody}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-muted-foreground">{t.orderRef}</div>
              <div className="break-all font-mono text-2xl font-black text-lgold">{orderId}</div>
              <div className="mt-1 text-sm text-muted-foreground">{acceptedQuote.forwarder} · USD {formatMoney(acceptedQuote.total)}</div>
            </div>
            <Button asChild variant="gold">
              <Link href={`/${locale}/orders/${orderId}`}>{t.next}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}

function Metric({ icon: Icon, label, value }: { icon: typeof Award; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4 text-lgold" />
        {label}
      </div>
      <div className="mt-1 font-bold">{value}</div>
    </div>
  )
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
