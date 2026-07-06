"use client"

import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Lock,
  MessageSquare,
  Package,
  Plane,
  Send,
  Ship,
  Sparkles,
  Truck,
  Upload,
} from "lucide-react"

import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"

type JsonRecord = Record<string, any>

type LiveWorkspace = {
  profile?: JsonRecord | null
  role?: string | null
  ownRequests?: JsonRecord[]
  opportunities?: JsonRecord[]
  orders?: JsonRecord[]
  recommendations?: JsonRecord[]
  bidCountByRequest?: Record<string, number>
  documentTypesByOrder?: Record<string, string[]>
}

type LoadState = "loading" | "ready" | "error"

const orderPipeline = [
  "confirmed",
  "shipment_booked",
  "in_transit",
  "arrived_hk",
  "customs_cleared",
  "delivered",
  "completed",
]

export function LiveDashboard({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [workspace, setWorkspace] = useState<LiveWorkspace>({})
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    apiJson("/api/workspace").then(({ response, body }) => {
      if (!active) return
      if (!response.ok) {
        setError(body.error || "WORKSPACE_LOAD_FAILED")
        setState("error")
        return
      }
      setWorkspace(body)
      setState("ready")
    })
    return () => {
      active = false
    }
  }, [])

  const requests = workspace.ownRequests || []
  const opportunities = workspace.opportunities || []
  const orders = workspace.orders || []
  const docsByOrder = workspace.documentTypesByOrder || {}
  const companyName = workspace.profile?.company_name_en || workspace.profile?.company_name_zh || "LBID company"
  const waitingReview = requests.filter((item) => item.status === "PENDING_REVIEW").length
  const quoteReady = requests.filter((item) => item.status === "CLOSED").length
  const missingDocs = orders.filter((order) => {
    const docs = docsByOrder[order.id] || []
    return !["awb", "invoice", "packing_list", "packing-list"].every((type) => docs.includes(type))
  }).length
  const nextOpportunity = [...opportunities].sort((a, b) => secondsLeft(a.bid_deadline) - secondsLeft(b.bid_deadline))[0]

  return (
    <WorkspaceSurface
      eyebrow="Today"
      title={`Good morning, ${firstName(companyName)}.`}
      intro={state === "loading" ? "Loading your live workspace..." : "Your next actions are pulled from live shipment, bid and order data."}
    >
      {state === "error" ? <StatePanel tone="error" title="Workspace could not load" body={error} /> : null}
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Waiting review" value={waitingReview} helper="SR pending LBID admin" icon={FileText} />
        <Metric label="Open opportunities" value={opportunities.length} helper="Live SR available to bid" icon={Plane} />
        <Metric label="Quotes to decide" value={quoteReady} helper="Closed SR awaiting award" icon={Award} />
        <Metric label="Missing docs" value={missingDocs} helper="Orders needing documents" icon={Upload} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <section className="rounded-[22px] border border-line bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.11em] text-gold-dark">Next best action</p>
              <h2 className="mt-2 text-[24px] font-bold tracking-[-0.6px] text-ink">
                {nextOpportunity ? `${routeText(nextOpportunity.route)}` : quoteReady ? "Review closed bids and award a partner" : "Create or review your next shipment request"}
              </h2>
              <p className="mt-2 max-w-2xl text-[13.5px] leading-6 text-ink-3">
                {nextOpportunity
                  ? `${cargoText(nextOpportunity.cargo_details)}. Bid window closes in ${timeLeft(nextOpportunity.bid_deadline)}.`
                  : quoteReady
                  ? "You have sealed bids ready for comparison. Lowest price will be highlighted, but you can choose by service fit."
                  : "Your dashboard is clean. Start by creating an SR or checking the marketplace."}
              </p>
            </div>
            <Link
              href={nextOpportunity ? `/${locale}/marketplace/${nextOpportunity.id}` : quoteReady ? `/${locale}/quotations/compare` : `/${locale}/inquiries/new`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-navy px-4 text-[13px] font-bold text-white shadow-[0_10px_25px_rgba(12,26,62,0.22)] transition hover:-translate-y-px hover:bg-navy-hover"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-3">
            <TaskRow href={`/${locale}/requests`} icon={FileText} title={`${waitingReview} SR waiting review`} meta="Admin must approve before bidding opens." />
            <TaskRow href={`/${locale}/marketplace`} icon={Lock} title={`${opportunities.length} open sealed-bid opportunities`} meta="Forwarders can submit exactly one private quote." />
            <TaskRow href={`/${locale}/quotations/compare`} icon={Award} title={`${quoteReady} bid comparison queue`} meta="Agency can award lowest or choose better-fit partner with confirmation." />
            <TaskRow href={`/${locale}/orders`} icon={Truck} title={`${orders.length} active order workspaces`} meta={`${missingDocs} order(s) may need document action.`} />
          </div>
        </section>

        <section className="rounded-[22px] border border-line bg-white p-5 shadow-[0_12px_36px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-ink">Live activity</h2>
            <span className="rounded-full border border-emerald/20 bg-emerald-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-emerald">API connected</span>
          </div>
          <div className="mt-4 space-y-3">
            {activityItems(workspace).map((item) => (
              <div key={item.title} className="flex gap-3 rounded-[14px] border border-line-light bg-canvas/60 p-3">
                <item.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy" />
                <div>
                  <p className="text-[13px] font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 text-[12px] text-ink-3">{item.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </WorkspaceSurface>
  )
}

export function LiveMarketplace({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [workspace, setWorkspace] = useState<LiveWorkspace>({})
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"all" | "air" | "sea">("all")
  const [sort, setSort] = useState<"match" | "deadline">("match")

  useEffect(() => {
    let active = true
    apiJson("/api/workspace").then(({ response, body }) => {
      if (!active) return
      setWorkspace(response.ok ? body : {})
      setState(response.ok ? "ready" : "error")
    })
    return () => {
      active = false
    }
  }, [])

  const recommendations = workspace.recommendations || []
  const scoreBySr = new Map(recommendations.map((item) => [item.shipment_request_id, Number(item.match_score || 0)]))
  const opportunitySource = (workspace.opportunities || []) as JsonRecord[]
  const opportunities: JsonRecord[] = opportunitySource
    .map((item): JsonRecord => ({ ...item, matchScore: scoreBySr.get(item.id) || 72 }))
    .filter((item: JsonRecord) => {
      const cargo = item.cargo_details || {}
      const haystack = `${routeText(item.route)} ${cargoText(cargo)} ${item.id}`.toLowerCase()
      const modeOk = mode === "all" || String(cargo.mode || "").toLowerCase() === mode
      return modeOk && haystack.includes(query.toLowerCase())
    })
    .sort((a: JsonRecord, b: JsonRecord) => sort === "match" ? Number(b.matchScore || 0) - Number(a.matchScore || 0) : secondsLeft(a.bid_deadline) - secondsLeft(b.bid_deadline))

  return (
    <WorkspaceSurface eyebrow="Opportunities" title="Live marketplace for sealed bids." intro="These SRs come from Supabase. Recommended matches are ranked by your profile fit, then deadline.">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
          <Plane className="h-4 w-4 text-ink-3" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search route, SR ID, cargo..." className="w-full bg-transparent text-[13.5px] outline-none placeholder:text-ink-3" />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", "air", "sea"] as const).map((value) => (
            <button key={value} onClick={() => setMode(value)} className={`rounded-xl border px-3.5 py-2 text-[12px] font-bold capitalize transition ${mode === value ? "border-navy bg-navy text-white" : "border-line bg-white text-ink-2 hover:border-navy/30 hover:bg-navy-soft"}`}>{value}</button>
          ))}
          {(["match", "deadline"] as const).map((value) => (
            <button key={value} onClick={() => setSort(value)} className={`rounded-xl border px-3.5 py-2 text-[12px] font-bold capitalize transition ${sort === value ? "border-gold bg-gold-soft text-gold-dark" : "border-line bg-white text-ink-2 hover:border-gold-border"}`}>{value}</button>
          ))}
        </div>
      </div>

      {state === "loading" ? <StatePanel title="Loading live opportunities" body="Reading open shipment requests from Supabase." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Marketplace could not load" body="Check Supabase connection and user session." /> : null}
      {state === "ready" && opportunities.length === 0 ? <StatePanel title="No live SR available" body="Once Admin publishes shipment requests, forwarders will see bid opportunities here." /> : null}

      <div className="grid gap-3">
        {opportunities.map((item, index) => (
          <LiveOpportunityRow key={item.id} locale={locale} item={item} index={index} />
        ))}
      </div>
    </WorkspaceSurface>
  )
}

export function LiveQuoteConsole({ locale, id }: { locale: Locale; id?: string }) {
  const params = useParams()
  const router = useRouter()
  const srId = id || String(params.id || "")
  const [state, setState] = useState<LoadState>("loading")
  const [request, setRequest] = useState<JsonRecord | null>(null)
  const [quote, setQuote] = useState("")
  const [transit, setTransit] = useState("")
  const [terms, setTerms] = useState("")
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    apiJson(`/api/shipment-requests/${srId}`).then(({ response, body }) => {
      if (!active) return
      if (!response.ok) {
        setState("error")
        setError(body.error || "SR_LOAD_FAILED")
        return
      }
      setRequest(body.shipmentRequest)
      setState("ready")
    })
    return () => {
      active = false
    }
  }, [srId])

  async function submitBid() {
    if (!request || !quote || Number(quote) <= 0) return
    setSaving(true)
    setNotice("")
    setError("")
    const { response, body } = await apiJson("/api/bids", {
      method: "POST",
      body: JSON.stringify({
        sr_id: request.id,
        price: Number(quote),
        currency: "HKD",
        transit_time: transit || null,
        terms: terms || null,
      }),
    })
    setSaving(false)
    if (!response.ok) {
      setError(body.error || "BID_SUBMIT_FAILED")
      return
    }
    setNotice(`Sealed bid submitted. Token transaction recorded. Bid ID: ${body.bid_id || body.bid?.id || "created"}`)
  }

  const cargo = request?.cargo_details || {}
  const canSubmit = state === "ready" && quote && Number(quote) > 0 && !saving

  return (
    <WorkspaceSurface eyebrow="Quote Console" title={request ? routeText(request.route) : "Loading SR..."} intro="Submit one sealed quote. Competitors cannot see your price or identity during the bid window.">
      {state === "loading" ? <StatePanel title="Loading shipment request" body="Preparing route, cargo and bid deadline." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Shipment request not available" body={error} /> : null}
      {request ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-[22px] border border-line bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between gap-4">
                <RouteBlock route={request.route} cargo={cargo} />
                <Countdown deadline={request.bid_deadline} />
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <InfoTile label="Weight" value={`${cargo.weight_kg || "-"} kg`} />
                <InfoTile label="Volume" value={`${cargo.cbm || "-"} CBM`} />
                <InfoTile label="Mode" value={modeLabel(cargo.mode)} />
                <InfoTile label="Cargo" value={cargo.cargo || cargo.cargo_type || "General"} />
              </div>
              <div className="rounded-[16px] border border-gold-border bg-gold-soft p-4">
                <p className="text-[12px] font-bold uppercase tracking-[0.08em] text-gold-dark">Why this is recommended</p>
                <ul className="mt-3 space-y-2 text-[13px] text-gold">
                  <li className="flex gap-2"><BadgeCheck className="h-4 w-4 flex-shrink-0" /> Route/cargo details are structured and ready for sealed bidding.</li>
                  <li className="flex gap-2"><BadgeCheck className="h-4 w-4 flex-shrink-0" /> Quote submission calls `/api/bids` and uses `submit_bid_with_token` RPC.</li>
                  <li className="flex gap-2"><BadgeCheck className="h-4 w-4 flex-shrink-0" /> One token is deducted only when Supabase confirms the bid transaction.</li>
                </ul>
              </div>
            </div>
          </section>

          <aside className="rounded-[22px] border border-line bg-white p-6 shadow-[0_16px_42px_rgba(15,23,42,0.07)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">Your sealed quote</p>
            <label className="mt-5 block text-[12px] font-bold text-ink-2">Total quote</label>
            <div className="mt-2 flex items-center rounded-xl border-2 border-line bg-white px-4 focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]">
              <span className="text-[13px] font-bold text-ink-3">HKD</span>
              <input type="number" value={quote} onChange={(event) => setQuote(event.target.value)} className="min-w-0 flex-1 bg-transparent px-3 py-4 text-[24px] font-bold outline-none placeholder:text-line" placeholder="0.00" />
            </div>
            <label className="mt-4 block text-[12px] font-bold text-ink-2">Transit time</label>
            <input value={transit} onChange={(event) => setTransit(event.target.value)} className="mt-2 w-full rounded-xl border-2 border-line px-4 py-3 text-[13px] outline-none focus:border-navy" placeholder="e.g. 2 days" />
            <label className="mt-4 block text-[12px] font-bold text-ink-2">Terms</label>
            <textarea value={terms} onChange={(event) => setTerms(event.target.value)} className="mt-2 w-full resize-none rounded-xl border-2 border-line px-4 py-3 text-[13px] outline-none focus:border-navy" rows={3} placeholder="Payment terms, inclusions, handling notes" />
            {error ? <InlineNotice tone="error" text={error} /> : null}
            {notice ? <InlineNotice tone="success" text={notice} /> : null}
            <button onClick={submitBid} disabled={!canSubmit} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-navy py-3.5 text-[13.5px] font-bold text-white transition hover:-translate-y-px hover:bg-navy-hover disabled:cursor-not-allowed disabled:opacity-40">
              {saving ? "Submitting..." : "Submit sealed quote"} <Lock className="h-4 w-4" />
            </button>
            <p className="mt-3 text-[11.5px] leading-5 text-ink-3">Quote is private until the window closes. Submission is binding upon acceptance.</p>
          </aside>
        </div>
      ) : null}
    </WorkspaceSurface>
  )
}

export function LiveQuoteComparison({ locale }: { locale: Locale }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [workspace, setWorkspace] = useState<LiveWorkspace>({})
  const [request, setRequest] = useState<JsonRecord | null>(null)
  const [bids, setBids] = useState<JsonRecord[]>([])
  const [state, setState] = useState<LoadState>("loading")
  const [selected, setSelected] = useState<JsonRecord | null>(null)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function load() {
      setState("loading")
      const srParam = searchParams.get("sr_id")
      const workspaceResult = await apiJson("/api/workspace")
      if (!active) return
      const ws = workspaceResult.response.ok ? workspaceResult.body : {}
      setWorkspace(ws)
      const candidate = srParam
        ? { id: srParam }
        : (ws.ownRequests || []).find((item: JsonRecord) => item.status === "CLOSED") || (ws.ownRequests || [])[0]
      if (!candidate?.id) {
        setState("ready")
        return
      }
      const [requestResult, bidsResult] = await Promise.all([
        apiJson(`/api/shipment-requests/${candidate.id}`),
        apiJson(`/api/bids?sr_id=${candidate.id}`),
      ])
      if (!active) return
      if (requestResult.response.ok) setRequest(requestResult.body.shipmentRequest)
      setBids(bidsResult.response.ok ? bidsResult.body.bids || [] : [])
      setState("ready")
    }
    void load()
    return () => {
      active = false
    }
  }, [searchParams])

  const sortedBids = [...bids].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  const lowest = sortedBids[0]

  async function acceptBid() {
    if (!selected) return
    setAccepting(true)
    setError("")
    const { response, body } = await apiJson(`/api/bids/${selected.id}/accept`, {
      method: "POST",
      body: JSON.stringify({ totalAmount: selected.price }),
    })
    setAccepting(false)
    if (!response.ok) {
      setError(body.error || "ACCEPT_BID_FAILED")
      return
    }
    router.push(`/${locale}/orders/${body.order?.id || ""}`)
  }

  return (
    <WorkspaceSurface eyebrow="Bid Comparison" title={request ? routeText(request.route) : "Compare sealed bids"} intro="The system highlights the lowest valid quote, but Agency can still choose a better service fit.">
      {state === "loading" ? <StatePanel title="Loading bids" body="Reading shipment request and sealed quotes from Supabase." /> : null}
      {state === "ready" && !request ? <StatePanel title="No request ready for comparison" body="Create an SR and wait for the bidding window to close before comparing bids." /> : null}
      {request ? (
        <>
          <div className="rounded-[20px] border border-line bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">{request.id}</p>
                <h2 className="mt-1 text-[20px] font-bold text-ink">{routeText(request.route)}</h2>
                <p className="mt-1 text-[13px] text-ink-3">{cargoText(request.cargo_details)} · {sortedBids.length} bids received</p>
              </div>
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-2 text-[12px] font-semibold text-ink-2">
                <Lock className="h-3.5 w-3.5" /> Contact unlocks after award
              </span>
            </div>
          </div>

          {sortedBids.length === 0 ? <StatePanel title="No bids submitted yet" body="When the bid window closes, valid sealed bids will appear here." /> : null}
          <div className="grid gap-4">
            {sortedBids.map((bid) => (
              <button key={bid.id} onClick={() => setSelected(bid)} className={`w-full rounded-[20px] border bg-white p-5 text-left shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-px ${bid.id === lowest?.id ? "border-emerald/40" : "border-line"} ${selected?.id === bid.id ? "ring-2 ring-navy/25" : ""}`}>
                {bid.id === lowest?.id ? <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald/20 bg-emerald-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald"><Award className="h-3.5 w-3.5" /> Lowest valid bid</div> : null}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[15px] font-bold text-ink">Forwarder {shortId(bid.forwarder_id)}</p>
                    <p className="mt-1 text-[13px] text-ink-3">Transit {bid.transit_time || "Pending"} · Submitted {formatDate(bid.submitted_at)}</p>
                    <p className="mt-3 max-w-2xl rounded-xl border border-line-light bg-canvas px-3 py-2 text-[12.5px] text-ink-2">{bid.terms || "No special terms supplied."}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">Total quote</p>
                    <p className={`mt-1 text-[28px] font-bold tracking-[-0.7px] ${bid.id === lowest?.id ? "text-emerald" : "text-ink"}`}>HKD {Number(bid.price || 0).toLocaleString()}</p>
                    {bid.id !== lowest?.id && lowest ? <p className="text-[12px] text-ink-3">+HKD {(Number(bid.price || 0) - Number(lowest.price || 0)).toLocaleString()} vs lowest</p> : null}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selected ? (
            <div className="sticky bottom-6 rounded-[18px] border border-line bg-white/95 p-4 shadow-[0_18px_55px_rgba(15,23,42,0.16)] backdrop-blur">
              {error ? <InlineNotice tone="error" text={error} /> : null}
              {selected.id !== lowest?.id ? <InlineNotice tone="warning" text={`You selected a non-lowest bid. Price difference: HKD ${(Number(selected.price || 0) - Number(lowest?.price || 0)).toLocaleString()}.`} /> : null}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[13px] text-ink-2">Selected bid: <strong className="text-ink">HKD {Number(selected.price || 0).toLocaleString()}</strong></p>
                <button onClick={acceptBid} disabled={accepting} className="rounded-xl bg-navy px-5 py-3 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-navy-hover disabled:opacity-50">{accepting ? "Accepting..." : "Accept selected bid"}</button>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </WorkspaceSurface>
  )
}

export function LiveOrders({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [orders, setOrders] = useState<JsonRecord[]>([])
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    apiJson("/api/workspace").then(({ response, body }) => {
      if (!active) return
      if (!response.ok) {
        setError(body.error || "WORKSPACE_LOAD_FAILED")
        setState("error")
        return
      }
      setOrders(body.orders || [])
      setState("ready")
    })
    return () => {
      active = false
    }
  }, [])

  const activeCount = orders.filter((order) => order.status !== "completed").length

  return (
    <WorkspaceSurface eyebrow="Orders" title="Orders" intro="Awarded shipments move here from confirmation through delivery.">
      {state === "loading" ? <StatePanel title="Loading orders" body="Reading order and quotation records from Supabase." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Orders could not load" body={error} /> : null}
      {state === "ready" ? (
        <>
          <p className="text-[13px] text-ink-3">{orders.length} order{orders.length === 1 ? "" : "s"} - {activeCount} active</p>
          <div className="grid gap-3">
            {orders.length === 0 ? <StatePanel title="No orders yet" body="Awarded shipment requests will appear here once a bid is accepted." /> : null}
            {orders.map((order) => (
              <LiveOrderRow key={order.id} locale={locale} order={order} />
            ))}
          </div>
        </>
      ) : null}
    </WorkspaceSurface>
  )
}

function LiveOrderRow({ locale, order }: { locale: Locale; order: JsonRecord }) {
  const quotation = Array.isArray(order.quotations) ? order.quotations[0] : order.quotations
  const shipmentRequest = Array.isArray(quotation?.shipment_requests) ? quotation?.shipment_requests[0] : quotation?.shipment_requests
  const forwarder = Array.isArray(quotation?.forwarder) ? quotation?.forwarder[0] : quotation?.forwarder
  return (
    <Link
      href={`/${locale}/orders/${order.id}`}
      className="group flex flex-col gap-3 rounded-[16px] border border-line bg-white px-6 py-5 transition hover:-translate-y-px hover:border-navy/20 hover:shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <p className="text-[13px] font-bold text-ink">Order {shortId(order.id)}</p>
          <span className="rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[10.5px] font-bold capitalize text-ink-2">{String(order.status || "").replace(/_/g, " ")}</span>
        </div>
        <p className="mt-1.5 text-[13px] text-ink-2">{routeText(shipmentRequest?.route)} - {cargoText(shipmentRequest?.cargo_details)}</p>
        <p className="mt-1 text-[12px] text-ink-3">{forwarder?.company_name || "Forwarder pending"} - {formatDate(order.created_at)}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-4">
        <div className="text-right">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-3">Quote</p>
          <p className="text-[14px] font-bold text-ink">HKD {Number(quotation?.total_amount || 0).toLocaleString()}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-ink-3 group-hover:text-navy" />
      </div>
    </Link>
  )
}

export function LiveOrderWorkspace({ id }: { id?: string }) {
  const params = useParams()
  const orderId = id || String(params.id || "")
  const [state, setState] = useState<LoadState>("loading")
  const [order, setOrder] = useState<JsonRecord | null>(null)
  const [documents, setDocuments] = useState<JsonRecord[]>([])
  const [messages, setMessages] = useState<JsonRecord[]>([])
  const [tracking, setTracking] = useState<JsonRecord[]>([])
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")

  async function load() {
    setState("loading")
    const [orderResult, docsResult, messagesResult, trackingResult] = await Promise.all([
      apiJson(`/api/orders/${orderId}`),
      apiJson(`/api/orders/${orderId}/documents`),
      apiJson(`/api/orders/${orderId}/messages`),
      apiJson(`/api/orders/${orderId}/tracking`),
    ])
    if (!orderResult.response.ok) {
      setError(orderResult.body.error || "ORDER_LOAD_FAILED")
      setState("error")
      return
    }
    setOrder(orderResult.body.order)
    setDocuments(docsResult.response.ok ? docsResult.body.documents || [] : [])
    setMessages(messagesResult.response.ok ? messagesResult.body.messages || [] : [])
    setTracking(trackingResult.response.ok ? trackingResult.body.tracking || [] : [])
    setState("ready")
  }

  useEffect(() => {
    if (orderId) void load()
  }, [orderId])

  async function sendMessage() {
    if (!message.trim()) return
    const content = message.trim()
    setMessage("")
    const { response, body } = await apiJson(`/api/orders/${orderId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    })
    if (!response.ok) {
      setError(body.error || "MESSAGE_SEND_FAILED")
      return
    }
    setMessages((current) => [...current, body.message])
  }

  async function advanceStatus() {
    if (!order) return
    const current = orderPipeline.indexOf(order.status)
    const next = orderPipeline[Math.min(current + 1, orderPipeline.length - 1)]
    const { response, body } = await apiJson(`/api/orders/${orderId}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    })
    if (!response.ok) {
      setError(body.error || "ORDER_STATUS_UPDATE_FAILED")
      return
    }
    setOrder(body.order)
    setNotice(`Order advanced to ${next}.`)
  }

  const quotation = Array.isArray(order?.quotations) ? order?.quotations[0] : order?.quotations
  const shipmentRequest = Array.isArray(quotation?.shipment_requests) ? quotation?.shipment_requests[0] : quotation?.shipment_requests

  return (
    <WorkspaceSurface eyebrow="Order Workspace" title={order ? `Order ${order.id}` : "Loading order"} intro="Status, documents, messages and tracking are connected to live order APIs.">
      {state === "loading" ? <StatePanel title="Loading order workspace" body="Reading order, documents, messages and tracking events." /> : null}
      {state === "error" ? <StatePanel tone="error" title="Order could not load" body={error} /> : null}
      {order ? (
        <div className="grid gap-6">
          <section className="rounded-[22px] border border-line bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.08)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full border border-emerald/20 bg-emerald-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald">{order.status}</span>
                <h2 className="mt-4 text-[24px] font-bold text-ink">{routeText(shipmentRequest?.route)}</h2>
                <p className="mt-2 text-[13px] text-ink-3">{cargoText(shipmentRequest?.cargo_details)} · HKD {Number(quotation?.total_amount || 0).toLocaleString()}</p>
              </div>
              <button onClick={advanceStatus} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-navy px-4 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-navy-hover">
                Advance status <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 grid gap-2 lg:grid-cols-7">
              {orderPipeline.map((status, index) => {
                const activeIndex = Math.max(orderPipeline.indexOf(order.status), 0)
                const complete = index <= activeIndex
                return (
                  <div key={status} className={`rounded-xl border p-3 text-center text-[11px] font-bold capitalize ${complete ? "border-emerald/25 bg-emerald-soft text-emerald" : "border-line bg-canvas text-ink-3"}`}>
                    {status.replace(/_/g, " ")}
                  </div>
                )
              })}
            </div>
          </section>

          {error ? <InlineNotice tone="error" text={error} /> : null}
          {notice ? <InlineNotice tone="success" text={notice} /> : null}

          <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
            <section className="rounded-[22px] border border-line bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-ink">Documents</h2>
                <span className="text-[12px] text-ink-3">{documents.length} uploaded</span>
              </div>
              <div className="mt-4 grid gap-3">
                {["AWB", "B/L", "Commercial Invoice", "Packing List"].map((type) => {
                  const doc = documents.find((item) => normalizeDocType(item.type) === normalizeDocType(type))
                  return (
                    <div key={type} className="flex items-center justify-between rounded-[14px] border border-line bg-canvas/50 p-3">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-navy" />
                        <div>
                          <p className="text-[13px] font-bold text-ink">{type}</p>
                          <p className="text-[12px] text-ink-3">{doc ? `Uploaded ${formatDate(doc.created_at)}` : "Missing"}</p>
                        </div>
                      </div>
                      {doc ? <CheckCircle2 className="h-5 w-5 text-emerald" /> : <AlertTriangle className="h-5 w-5 text-amber-600" />}
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="rounded-[22px] border border-line bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
              <h2 className="text-[15px] font-bold text-ink">Messages</h2>
              <div className="mt-4 max-h-[340px] space-y-3 overflow-y-auto pr-1">
                {messages.length === 0 ? <p className="rounded-xl border border-line bg-canvas p-4 text-[13px] text-ink-3">No messages yet.</p> : null}
                {messages.map((item) => (
                  <div key={item.id} className="rounded-[14px] border border-line bg-canvas/60 p-3">
                    <p className="text-[13px] text-ink">{item.content}</p>
                    <p className="mt-1 text-[11px] text-ink-3">{formatDate(item.created_at)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendMessage() }} className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 text-[13px] outline-none focus:border-navy" placeholder="Send an order message" />
                <button onClick={sendMessage} className="rounded-xl bg-navy px-4 text-white transition hover:bg-navy-hover"><Send className="h-4 w-4" /></button>
              </div>
            </section>
          </div>

          <section className="rounded-[22px] border border-line bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <h2 className="text-[15px] font-bold text-ink">Tracking events</h2>
            <div className="mt-4 grid gap-3">
              {tracking.length === 0 ? <p className="rounded-xl border border-line bg-canvas p-4 text-[13px] text-ink-3">No tracking events yet.</p> : null}
              {tracking.map((item) => (
                <div key={item.id} className="flex gap-3 rounded-[14px] border border-line bg-canvas/60 p-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-navy" />
                  <div>
                    <p className="text-[13px] font-bold text-ink">{item.status}</p>
                    <p className="text-[12px] text-ink-3">{item.description}</p>
                    <p className="mt-1 text-[11px] text-ink-3">{formatDate(item.occurred_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </WorkspaceSurface>
  )
}

function WorkspaceSurface({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#eef2f8] px-5 py-8 sm:px-8 lg:px-9">
      <div className="mx-auto flex max-w-[1320px] flex-col gap-6">
        <header>
          <span className="inline-flex rounded-full border border-gold-border bg-gold-soft px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-gold-dark">{eyebrow}</span>
          <h1 className="mt-4 max-w-4xl text-[32px] font-bold leading-[1.06] tracking-[-1px] text-ink sm:text-[44px]">{title}</h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-ink-3">{intro}</p>
        </header>
        {children}
      </div>
    </main>
  )
}

function Metric({ label, value, helper, icon: Icon }: { label: string; value: number | string; helper: string; icon: typeof Plane }) {
  return (
    <div className="rounded-[18px] border border-line bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-soft text-navy"><Icon className="h-4 w-4" /></span>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-ink-3">{label}</p>
          <p className="mt-0.5 text-[24px] font-bold text-ink">{value}</p>
        </div>
      </div>
      <p className="mt-3 text-[12px] text-ink-3">{helper}</p>
    </div>
  )
}

function TaskRow({ href, icon: Icon, title, meta }: { href: string; icon: typeof Plane; title: string; meta: string }) {
  return (
    <Link href={href} className="group flex items-center justify-between gap-4 rounded-[16px] border border-line bg-canvas/50 p-4 transition hover:-translate-y-px hover:border-navy/20 hover:bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)]">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-navy group-hover:bg-navy group-hover:text-white"><Icon className="h-4 w-4" /></span>
        <div>
          <p className="text-[13.5px] font-bold text-ink">{title}</p>
          <p className="mt-0.5 text-[12px] text-ink-3">{meta}</p>
        </div>
      </div>
      <ArrowRight className="h-4 w-4 text-ink-3" />
    </Link>
  )
}

function LiveOpportunityRow({ locale, item, index }: { locale: Locale; item: JsonRecord; index: number }) {
  const cargo = item.cargo_details || {}
  const mode = String(cargo.mode || "").toLowerCase()
  const Icon = mode === "sea" ? Ship : Plane
  return (
    <Link href={`/${locale}/marketplace/${item.id}`} className="group rounded-[18px] border border-line bg-white p-5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] transition hover:-translate-y-px hover:border-navy/20 hover:shadow-[0_14px_36px_rgba(15,23,42,0.09)]" style={{ animationDelay: `${index * 35}ms` }}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-canvas text-navy group-hover:bg-navy group-hover:text-white"><Icon className="h-5 w-5" /></span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[16px] font-bold text-ink">{routeText(item.route)}</h2>
              {(item.matchScore || 0) >= 85 ? <span className="rounded-full border border-gold-border bg-gold-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-gold-dark">Recommended</span> : null}
            </div>
            <p className="mt-1 text-[13px] text-ink-3">{cargoText(cargo)} · SR {item.id}</p>
            <p className="mt-2 text-[12px] text-ink-3">Services: {Array.isArray(item.services_needed) && item.services_needed.length ? item.services_needed.join(", ") : "Not specified"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          <span className="rounded-xl border border-emerald/20 bg-emerald-soft px-3 py-2 text-[12px] font-bold text-emerald">{item.matchScore || 72}% match</span>
          <span className={`rounded-xl border px-3 py-2 text-[12px] font-bold ${secondsLeft(item.bid_deadline) < 3600 ? "border-red-200 bg-red-50 text-red-600" : "border-line bg-canvas text-ink-2"}`}>{timeLeft(item.bid_deadline)}</span>
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-navy px-4 py-2.5 text-[12px] font-bold text-white">Bid <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </Link>
  )
}

function RouteBlock({ route, cargo }: { route: JsonRecord; cargo: JsonRecord }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">Origin</p>
          <p className="mt-1 text-[24px] font-bold text-ink">{route?.origin || "Origin pending"}</p>
        </div>
        <span className="grid h-11 w-11 place-items-center rounded-full bg-navy text-white shadow-[0_8px_20px_rgba(12,26,62,0.25)]"><Plane className="h-5 w-5" /></span>
        <div className="sm:text-right">
          <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-3">Destination</p>
          <p className="mt-1 text-[24px] font-bold text-ink">{route?.destination || route?.dest || "Hong Kong"}</p>
        </div>
      </div>
      <p className="text-[13px] text-ink-3">{cargoText(cargo)}</p>
    </div>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] border border-line bg-canvas px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">{label}</p>
      <p className="mt-1 text-[14px] font-bold text-ink">{value}</p>
    </div>
  )
}

function Countdown({ deadline }: { deadline?: string }) {
  const left = secondsLeft(deadline)
  return (
    <div className={`flex flex-shrink-0 items-center gap-2 rounded-xl border px-4 py-3 ${left < 3600 ? "border-red-200 bg-red-50 text-red-600" : "border-line bg-canvas text-ink-2"}`}>
      <Clock3 className="h-4 w-4" />
      <span className="font-mono text-[14px] font-bold">{timeLeft(deadline)}</span>
    </div>
  )
}

function StatePanel({ title, body, tone = "neutral" }: { title: string; body: string; tone?: "neutral" | "error" }) {
  return (
    <div className={`rounded-[18px] border p-6 ${tone === "error" ? "border-red-200 bg-red-50 text-red-700" : "border-line bg-white text-ink-2"}`}>
      <p className="text-[14px] font-bold">{title}</p>
      <p className="mt-1 text-[13px]">{body}</p>
    </div>
  )
}

function InlineNotice({ text, tone }: { text: string; tone: "success" | "error" | "warning" }) {
  const classes = tone === "success" ? "border-emerald/20 bg-emerald-soft text-emerald" : tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"
  return <p className={`mt-3 rounded-xl border px-3 py-2 text-[12.5px] font-semibold ${classes}`}>{text}</p>
}

function routeText(route?: JsonRecord) {
  if (!route) return "Route pending"
  return `${route.origin || "Origin pending"} -> ${route.destination || route.dest || "Hong Kong"}`
}

function cargoText(cargo?: JsonRecord) {
  if (!cargo) return "Cargo details pending"
  const parts = [
    cargo.cargo || cargo.cargo_type || "General cargo",
    cargo.weight_kg ? `${cargo.weight_kg} kg` : null,
    cargo.cbm ? `${cargo.cbm} CBM` : null,
    modeLabel(cargo.mode),
  ].filter(Boolean)
  return parts.join(" · ")
}

function modeLabel(mode?: string) {
  const value = String(mode || "").toLowerCase()
  if (value === "sea") return "Sea"
  if (value === "air") return "Air"
  return "Mode pending"
}

function secondsLeft(deadline?: string) {
  if (!deadline) return Number.MAX_SAFE_INTEGER
  return Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
}

function timeLeft(deadline?: string) {
  const seconds = secondsLeft(deadline)
  if (seconds === Number.MAX_SAFE_INTEGER) return "No deadline"
  if (seconds <= 0) return "Closed"
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} min left`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m left`
  return `${Math.ceil(seconds / 86400)} days left`
}

function firstName(name: string) {
  return name.split(/\s+/)[0] || "there"
}

function shortId(id?: string) {
  if (!id) return "unknown"
  return id.slice(0, 8)
}

function formatDate(value?: string) {
  if (!value) return "Pending"
  return new Intl.DateTimeFormat("en-HK", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
}

function normalizeDocType(value?: string) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

function activityItems(workspace: LiveWorkspace) {
  const requests = workspace.ownRequests || []
  const opportunities = workspace.opportunities || []
  const orders = workspace.orders || []
  return [
    { icon: FileText, title: `${requests.length} shipment request(s)`, meta: "Client-side demand queue from Supabase." },
    { icon: Lock, title: `${opportunities.length} open sealed opportunity(ies)`, meta: "Forwarder bidding queue from live SR records." },
    { icon: Package, title: `${orders.length} order workspace(s)`, meta: "Awarded work ready for documents and messages." },
  ]
}
