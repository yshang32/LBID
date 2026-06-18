"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Award, CheckCircle2, FileText, ShieldCheck, Star, Timer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type LiveBid = {
  id: string
  sr_id: string
  forwarder_id: string
  price: number
  currency: string
  transit_time: string | null
  terms: string | null
  submitted_at: string
}

type Quote = {
  id: string
  bidId?: string
  forwarder: string
  total: number
  currency: string
  transit: string
  rating: number
  verified: boolean
  pdf: string
  terms?: string | null
}

const demoQuotes: Quote[] = [
  { id: "QT-HK-8821", forwarder: "HarbourLink Cargo", total: 1801.6, currency: "USD", transit: "3-5 days", rating: 4.9, verified: true, pdf: "QT-HK-8821.pdf" },
  { id: "QT-HK-8824", forwarder: "Kowloon Gateway Logistics", total: 1920, currency: "USD", transit: "4-6 days", rating: 4.7, verified: true, pdf: "QT-HK-8824.pdf" },
  { id: "QT-HK-8829", forwarder: "Aeroport Express Forwarding", total: 2050, currency: "USD", transit: "2-4 days", rating: 4.8, verified: true, pdf: "QT-HK-8829.pdf" },
]

const copy = {
  zh: {
    badge: "報價比較",
    title: "比較 Forwarder 報價，選擇最合適合作方。",
    intro: "系統會清楚標示最低有效報價，但 Agency 仍可因服務能力、時效或信譽選擇其他 Forwarder。",
    route: "Mumbai (BOM) 至 Hong Kong (HKG)",
    cargo: "Electronic components, 500kg / 3CBM",
    ref: "LBID-INQ-2026-0001",
    lowest: "最低報價",
    verified: "已驗證",
    total: "總價",
    transit: "運輸時間",
    rating: "評分",
    pdf: "查看 PDF",
    accept: "接受報價",
    accepting: "接受中...",
    accepted: "已接受",
    sort: "排序",
    byPrice: "最低價",
    byTransit: "最快時效",
    byRating: "最高評分",
    shortlist: "加入 shortlist",
    shortlisted: "已加入 shortlist",
    confirmTitle: "Order 已建立",
    confirmBody: "得標 Forwarder 會收到通知，其他 Forwarder 會收到未中標通知。",
    orderRef: "Order reference",
    next: "查看訂單工作區",
    note: "Forwarder 不會看到其他競爭者的報價。Agency 只會在自己的 Shipment Request 內看到比較結果。",
    liveLoaded: "已載入真實 sealed bids",
    demoMode: "Demo comparison",
    nonLowestTitle: "確認選擇非最低報價",
    nonLowestBody: "你選擇的報價不是最低價。請確認你是因為服務能力、時效或信譽等因素作出選擇。",
    selected: "已選報價",
    difference: "比最低價高",
    cancel: "返回比較",
    confirmNonLowest: "確認接受此報價",
    unableToLoad: "未能載入報價，暫時顯示 demo data。",
  },
  en: {
    badge: "Quotation comparison",
    title: "Compare forwarder quotations and choose the best fit.",
    intro: "LBID highlights the lowest valid quote, while agencies can still choose a different forwarder for capability, transit time or reputation.",
    route: "Mumbai (BOM) to Hong Kong (HKG)",
    cargo: "Electronic components, 500kg / 3CBM",
    ref: "LBID-INQ-2026-0001",
    lowest: "Lowest quote",
    verified: "Verified",
    total: "Total",
    transit: "Transit",
    rating: "Rating",
    pdf: "View PDF",
    accept: "Accept quotation",
    accepting: "Accepting...",
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
    note: "Forwarders cannot see each other's quotations. Agencies only see comparison inside their own shipment request.",
    liveLoaded: "Live sealed bids loaded",
    demoMode: "Demo comparison",
    nonLowestTitle: "Confirm non-lowest selection",
    nonLowestBody: "The selected quote is not the lowest. Confirm this choice if capability, transit time or reputation better fits the shipment.",
    selected: "Selected quote",
    difference: "Above lowest",
    cancel: "Back to comparison",
    confirmNonLowest: "Accept this quote",
    unableToLoad: "Unable to load live quotations. Showing demo data for now.",
  },
}

export default function QuotationComparePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [acceptedQuote, setAcceptedQuote] = useState<Quote | null>(null)
  const [sort, setSort] = useState<"price" | "transit" | "rating">("price")
  const [shortlisted, setShortlisted] = useState<string[]>([])
  const [bidId, setBidId] = useState("")
  const [srId, setSrId] = useState("")
  const [liveQuotes, setLiveQuotes] = useState<Quote[]>([])
  const [orderId, setOrderId] = useState("LBID-ORD-2026-0001")
  const [accepting, setAccepting] = useState("")
  const [error, setError] = useState("")
  const [pendingQuote, setPendingQuote] = useState<Quote | null>(null)

  useEffect(() => {
    const search = new URLSearchParams(window.location.search)
    const nextBidId = search.get("bidId") ?? ""
    const nextSrId = search.get("srId") ?? search.get("sr_id") ?? ""

    setBidId(nextBidId)
    setSrId(nextSrId)

    if (!nextSrId) return

    let mounted = true
    apiJson(`/api/bids?sr_id=${encodeURIComponent(nextSrId)}`)
      .then(({ response, body }) => {
        if (!mounted) return
        if (!response.ok) {
          setError(body.error || t.unableToLoad)
          return
        }

        const bids = Array.isArray(body.bids) ? (body.bids as LiveBid[]) : []
        setLiveQuotes(bids.map(mapBidToQuote))
      })
      .catch(() => {
        if (mounted) setError(t.unableToLoad)
      })

    return () => {
      mounted = false
    }
  }, [t.unableToLoad])

  const comparisonQuotes = liveQuotes.length > 0 ? liveQuotes : demoQuotes
  const lowestTotal = useMemo(() => Math.min(...comparisonQuotes.map((quote) => quote.total)), [comparisonQuotes])

  const sortedQuotes = useMemo(() => {
    return [...comparisonQuotes].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating
      if (sort === "transit") return transitScore(a.transit) - transitScore(b.transit)
      return a.total - b.total
    })
  }, [comparisonQuotes, sort])

  function toggleShortlist(id: string) {
    setShortlisted((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id])
  }

  async function acceptQuote(quote: Quote, confirmedNonLowest = false) {
    setError("")

    if (quote.total > lowestTotal && !confirmedNonLowest) {
      setPendingQuote(quote)
      return
    }

    const selectedBidId = quote.bidId || bidId
    if (!selectedBidId) {
      setPendingQuote(null)
      setAcceptedQuote(quote)
      return
    }

    setAccepting(quote.id)
    const { response, body } = await apiJson(`/api/bids/${selectedBidId}/accept`, {
      method: "POST",
      body: JSON.stringify({ totalAmount: quote.total }),
    })

    setAccepting("")
    setPendingQuote(null)

    if (!response.ok) {
      setError(body.error || "Unable to accept bid")
      return
    }

    setOrderId(body.order?.id || "LBID-ORD-2026-0001")
    setAcceptedQuote(quote)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant={liveQuotes.length > 0 ? "teal" : "secondary"}>{liveQuotes.length > 0 ? t.liveLoaded : t.demoMode}</Badge>
            {srId ? <Badge variant="outline">SR {srId}</Badge> : null}
          </div>
        </div>
        <Card className="border-white/10 bg-white/[0.045] md:w-80">
          <CardContent className="space-y-1 p-4 text-sm">
            <div className="font-mono text-lgold">{srId || t.ref}</div>
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
        {sortedQuotes.map((quote) => {
          const isAccepted = acceptedQuote?.id === quote.id
          const isLowest = quote.total === lowestTotal

          return (
            <Card key={quote.id} className={`border-white/10 bg-white/[0.045] ${isLowest ? "border-lgold/40 bg-lgold/10" : ""}`}>
              <CardContent className="grid gap-4 p-4 lg:grid-cols-[1.4fr_120px_120px_120px_auto] lg:items-center">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black">{quote.forwarder}</h2>
                    {isLowest ? <Badge variant="gold">{t.lowest}</Badge> : null}
                    {quote.verified ? <Badge variant="teal"><ShieldCheck className="mr-1 h-3 w-3" />{t.verified}</Badge> : null}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-4 w-4 text-lgold" />
                    {quote.pdf}
                  </div>
                  {quote.terms ? <p className="mt-2 text-sm text-muted-foreground">{quote.terms}</p> : null}
                </div>
                <Metric icon={Award} label={t.total} value={`${quote.currency} ${formatMoney(quote.total)}`} />
                <Metric icon={Timer} label={t.transit} value={quote.transit} />
                <Metric icon={Star} label={t.rating} value={quote.rating ? String(quote.rating) : "-"} />
                <div className="flex flex-wrap gap-2 lg:justify-end">
                  <Button variant="outline">{t.pdf}</Button>
                  <Button variant={shortlisted.includes(quote.id) ? "secondary" : "outline"} onClick={() => toggleShortlist(quote.id)}>
                    {shortlisted.includes(quote.id) ? t.shortlisted : t.shortlist}
                  </Button>
                  <Button variant={isAccepted ? "secondary" : "gold"} disabled={Boolean(accepting)} onClick={() => acceptQuote(quote)}>
                    {accepting === quote.id ? t.accepting : isAccepted ? t.accepted : t.accept}
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
              <div className="mt-1 text-sm text-muted-foreground">{acceptedQuote.forwarder} - {acceptedQuote.currency} {formatMoney(acceptedQuote.total)}</div>
            </div>
            <Button asChild variant="gold">
              <Link href={`/${locale}/orders/${orderId}`}>{t.next}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {pendingQuote ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg border-lgold/30 bg-[#101828] shadow-2xl">
            <CardHeader>
              <CardTitle>{t.nonLowestTitle}</CardTitle>
              <CardDescription>{t.nonLowestBody}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric icon={Award} label={t.selected} value={`${pendingQuote.currency} ${formatMoney(pendingQuote.total)}`} />
                <Metric icon={Timer} label={t.difference} value={`${pendingQuote.currency} ${formatMoney(pendingQuote.total - lowestTotal)}`} />
              </div>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setPendingQuote(null)}>{t.cancel}</Button>
                <Button variant="gold" disabled={Boolean(accepting)} onClick={() => acceptQuote(pendingQuote, true)}>
                  {accepting ? t.accepting : t.confirmNonLowest}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
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

function mapBidToQuote(bid: LiveBid): Quote {
  return {
    id: `BID-${bid.id.slice(0, 8).toUpperCase()}`,
    bidId: bid.id,
    forwarder: `Forwarder ${bid.forwarder_id.slice(0, 8)}`,
    total: Number(bid.price),
    currency: bid.currency || "HKD",
    transit: bid.transit_time || "-",
    rating: 0,
    verified: true,
    pdf: "PDF will be generated after acceptance",
    terms: bid.terms,
  }
}

function transitScore(value: string) {
  const match = value.match(/\d+/)
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER
}

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
