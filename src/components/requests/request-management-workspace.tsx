"use client"

import Link from "next/link"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Filter,
  Grid2X2,
  List,
  LockKeyhole,
  Plane,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  TrendingUp,
  UserRoundCheck,
  X,
} from "lucide-react"

import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"
import { RequestSupportingWorkspace, type RequestSupportingTab } from "@/components/requests/request-detail-supporting-views"

type JsonRecord = Record<string, any>
type LoadState = "loading" | "ready" | "error"
type DetailTab = "comparison" | "forwarder" | "breakdown" | "transit" | "terms" | "documents" | "messages" | "activity"

type WorkspacePayload = {
  ownRequests?: JsonRecord[]
  bidCountByRequest?: Record<string, number>
  orders?: JsonRecord[]
}

const DRAFT_KEY = "lbid-request-draft-v3"
const PAGE_SIZE = 8

export function LiveMyRequests({ locale }: { locale: Locale }) {
  const [state, setState] = useState<LoadState>("loading")
  const [workspace, setWorkspace] = useState<WorkspacePayload>({})
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState("all")
  const [mode, setMode] = useState("all")
  const [origin, setOrigin] = useState("all")
  const [destination, setDestination] = useState("all")
  const [cargo, setCargo] = useState("all")
  const [dateRange, setDateRange] = useState("all")
  const [sort, setSort] = useState("newest")
  const [view, setView] = useState<"list" | "grid">("list")
  const [moreOpen, setMoreOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    let active = true
    try { setHasDraft(Boolean(localStorage.getItem(DRAFT_KEY))) } catch {}
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
    return () => { active = false }
  }, [])

  const requests = workspace.ownRequests || []
  const bidCounts = workspace.bidCountByRequest || {}
  const origins = unique(requests.map((item) => locationName(item.route, "origin")))
  const destinations = unique(requests.map((item) => locationName(item.route, "destination")))
  const cargoTypes = unique(requests.map((item) => cargoName(item.cargo_details)))
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const now = Date.now()
    return requests
      .filter((item) => {
        const searchable = `${item.id} ${routeLabel(item.route)} ${cargoName(item.cargo_details)}`.toLowerCase()
        if (normalized && !searchable.includes(normalized)) return false
        if (status !== "all" && String(item.status || "").toUpperCase() !== status) return false
        if (mode !== "all" && freightMode(item.cargo_details) !== mode) return false
        if (origin !== "all" && locationName(item.route, "origin") !== origin) return false
        if (destination !== "all" && locationName(item.route, "destination") !== destination) return false
        if (cargo !== "all" && cargoName(item.cargo_details) !== cargo) return false
        if (dateRange !== "all") {
          const days = dateRange === "30d" ? 30 : 90
          if (now - new Date(item.created_at).getTime() > days * 86_400_000) return false
        }
        return true
      })
      .sort((a, b) => {
        if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sort === "deadline") return new Date(a.bid_deadline).getTime() - new Date(b.bid_deadline).getTime()
        if (sort === "bids") return (bidCounts[b.id] || 0) - (bidCounts[a.id] || 0)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
  }, [bidCounts, cargo, dateRange, destination, mode, origin, query, requests, sort, status])

  useEffect(() => { setPage(1) }, [cargo, dateRange, destination, mode, origin, query, sort, status])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const counts = {
    total: requests.length,
    open: requests.filter((item) => item.status === "OPEN").length,
    closed: requests.filter((item) => item.status === "CLOSED").length,
    draft: hasDraft ? 1 : 0,
    awarded: requests.filter((item) => item.status === "AWARDED").length,
  }

  function clearFilters() {
    setQuery("")
    setStatus("all")
    setMode("all")
    setOrigin("all")
    setDestination("all")
    setCargo("all")
    setDateRange("all")
  }

  return (
    <RequestPage>
      <PageHeading title="My Requests" description="Track every shipment request and sealed-bidding decision in one place." />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard icon={BriefcaseBusiness} label="Total Requests" value={counts.total} helper="All time" tone="gold" />
        <KpiCard icon={Plane} label="Live Bidding" value={counts.open} helper="Forwarders responding" tone="blue" />
        <KpiCard icon={CheckCircle2} label="Awaiting Decision" value={counts.closed} helper="Ready to compare" tone="green" />
        <KpiCard icon={Clock3} label="Draft Requests" value={counts.draft} helper="Saved on this device" tone="violet" />
        <KpiCard icon={Award} label="Awarded" value={counts.awarded} helper="Partner selected" tone="slate" />
      </section>

      <section className="rounded-[14px] border border-[#e6e9ef] bg-white shadow-[0_10px_30px_rgba(30,43,70,0.045)]">
        <div className="flex flex-col gap-3 border-b border-[#eceff3] p-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap">
            <label className="relative min-w-0 flex-1 sm:min-w-[270px]">
              <span className="sr-only">Search requests</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8792a3]" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search route, cargo or request ID..." className="h-11 w-full rounded-[9px] border border-[#dfe4ec] bg-white pl-10 pr-3 text-[12px] text-[#23314a] outline-none transition hover:border-[#bdc7d5] focus:border-[#b77d18] focus:ring-4 focus:ring-[#c58a18]/10" />
            </label>
            <FilterSelect icon={CalendarDays} label="Date range" value={dateRange} onChange={setDateRange} options={[["all", "All dates"], ["30d", "Last 30 days"], ["90d", "Last 90 days"]]} />
            <FilterSelect label="Status" value={status} onChange={setStatus} options={[["all", "All statuses"], ["OPEN", "Live bidding"], ["CLOSED", "Awaiting decision"], ["AWARDED", "Awarded"], ["PENDING_REVIEW", "Pending review"]]} />
            <FilterSelect label="Mode" value={mode} onChange={setMode} options={[["all", "All modes"], ["air", "Air freight"], ["sea", "Sea freight"]]} />
            <FilterSelect label="Origin" value={origin} onChange={setOrigin} options={[["all", "All origins"], ...origins.map((item) => [item, item] as [string, string])]} />
            <button type="button" onClick={() => setMoreOpen((current) => !current)} aria-expanded={moreOpen} className="inline-flex h-11 items-center justify-center gap-2 rounded-[9px] border border-[#dfe4ec] bg-white px-3 text-[11px] font-semibold text-[#48566d] transition hover:border-[#bfc8d5] hover:bg-[#fafbfc] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c58a18]/10"><Filter className="h-3.5 w-3.5" />More filters<ChevronDown className={`h-3.5 w-3.5 transition ${moreOpen ? "rotate-180" : ""}`} /></button>
          </div>
          <div className="flex items-center justify-between gap-2 lg:justify-end">
            <FilterSelect label="Sort" value={sort} onChange={setSort} options={[["newest", "Newest first"], ["oldest", "Oldest first"], ["deadline", "Deadline first"], ["bids", "Most bids"]]} />
            <div className="flex rounded-[9px] border border-[#dfe4ec] bg-white p-1">
              <IconToggle label="List view" active={view === "list"} onClick={() => setView("list")} icon={List} />
              <IconToggle label="Grid view" active={view === "grid"} onClick={() => setView("grid")} icon={Grid2X2} />
            </div>
          </div>
        </div>

        {moreOpen ? (
          <div className="flex flex-wrap items-end gap-3 border-b border-[#eceff3] bg-[#fbfbfa] px-4 py-3">
            <FilterSelect label="Destination" value={destination} onChange={setDestination} options={[["all", "All destinations"], ...destinations.map((item) => [item, item] as [string, string])]} />
            <FilterSelect label="Cargo" value={cargo} onChange={setCargo} options={[["all", "All cargo"], ...cargoTypes.map((item) => [item, item] as [string, string])]} />
            <button type="button" onClick={clearFilters} className="h-11 rounded-[9px] px-3 text-[11px] font-semibold text-[#7c8798] transition hover:bg-[#f0f2f5] hover:text-[#24324a]">Clear filters</button>
          </div>
        ) : null}

        {state === "loading" ? <LoadingState label="Loading shipment requests..." /> : null}
        {state === "error" ? <EmptyState title="Requests could not load" body={error} /> : null}
        {state === "ready" && filtered.length === 0 ? <EmptyState title="No matching requests" body={requests.length ? "Try clearing your filters." : "Create your first shipment request to start sealed bidding."} actionHref={`/${locale}/inquiries/new`} actionLabel="Create request" /> : null}

        {state === "ready" && visible.length > 0 ? (
          view === "list" ? (
            <div>
              <div className="hidden grid-cols-[minmax(270px,2.1fr)_minmax(150px,1.05fr)_150px_90px_155px_120px_116px] gap-4 border-b border-[#eceff3] px-5 py-3 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8d97a7] xl:grid">
                <span>Request details</span><span>Cargo / Mode</span><span>Bidding status</span><span>Bids</span><span>Bidding window</span><span>Last updated</span><span>Action</span>
              </div>
              {hasDraft && page === 1 && !query && status === "all" ? <DraftRow locale={locale} /> : null}
              {visible.map((item) => <RequestRow key={item.id} locale={locale} item={item} bidCount={bidCounts[item.id] || 0} />)}
            </div>
          ) : (
            <div className="grid gap-3 p-4 md:grid-cols-2 2xl:grid-cols-3">
              {visible.map((item) => <RequestCard key={item.id} locale={locale} item={item} bidCount={bidCounts[item.id] || 0} />)}
            </div>
          )
        ) : null}

        {state === "ready" && filtered.length > 0 ? (
          <div className="flex flex-col gap-3 border-t border-[#eceff3] px-5 py-4 text-[10.5px] text-[#7f8a9c] sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} requests</span>
            <div className="flex items-center gap-1">
              <PageButton label="Previous page" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ArrowLeft className="h-3.5 w-3.5" /></PageButton>
              {Array.from({ length: pageCount }, (_, index) => index + 1).slice(Math.max(0, page - 3), Math.min(pageCount, page + 2)).map((number) => <PageButton key={number} label={`Page ${number}`} active={number === page} onClick={() => setPage(number)}>{number}</PageButton>)}
              <PageButton label="Next page" disabled={page === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}><ArrowRight className="h-3.5 w-3.5" /></PageButton>
            </div>
          </div>
        ) : null}
      </section>
    </RequestPage>
  )
}

export function LiveRequestDetail({ locale, id }: { locale: Locale; id?: string }) {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const srId = id || String(params.id || "")
  const requestedTab = searchParams.get("tab") as DetailTab | null
  const [tab, setTab] = useState<DetailTab>(requestedTab || "comparison")
  const [state, setState] = useState<LoadState>("loading")
  const [request, setRequest] = useState<JsonRecord | null>(null)
  const [bids, setBids] = useState<JsonRecord[]>([])
  const [bidCount, setBidCount] = useState(0)
  const [selectedBidId, setSelectedBidId] = useState(searchParams.get("bid") || "")
  const [error, setError] = useState("")
  const [accepting, setAccepting] = useState(false)
  const [confirmBid, setConfirmBid] = useState<JsonRecord | null>(null)
  const [linkedOrder, setLinkedOrder] = useState<JsonRecord | null>(null)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true
    async function load() {
      setState("loading")
      const [requestResult, bidsResult, workspaceResult] = await Promise.all([
        apiJson(`/api/shipment-requests/${srId}`),
        apiJson(`/api/bids?sr_id=${srId}`),
        apiJson("/api/workspace"),
      ])
      if (!active) return
      if (!requestResult.response.ok) {
        setError(requestResult.body.error || "SR_LOAD_FAILED")
        setState("error")
        return
      }
      setRequest(requestResult.body.shipmentRequest)
      if (bidsResult.response.ok) {
        setBids(bidsResult.body.bids || [])
        setBidCount(Number(bidsResult.body.bidCount ?? bidsResult.body.bids?.length ?? 0))
      }
      if (workspaceResult.response.ok) setLinkedOrder(findOrderForRequest(workspaceResult.body.orders || [], srId))
      setState("ready")
    }
    if (srId) void load()
    return () => { active = false }
  }, [srId])

  useEffect(() => {
    if (requestedTab) setTab(requestedTab)
  }, [requestedTab])

  const sortedBids = useMemo(() => [...bids].sort((a, b) => Number(a.price || 0) - Number(b.price || 0)), [bids])
  const lowest = sortedBids[0]
  const selectedBid = sortedBids.find((bid) => bid.id === selectedBidId) || sortedBids[0] || null
  const sealed = request?.status === "OPEN" && new Date(request.bid_deadline).getTime() > now

  function navigate(nextTab: DetailTab, bidId?: string) {
    setTab(nextTab)
    if (bidId) setSelectedBidId(bidId)
    const query = new URLSearchParams()
    query.set("tab", nextTab)
    if (bidId || selectedBidId) query.set("bid", bidId || selectedBidId)
    router.replace(`/${locale}/requests/${srId}?${query.toString()}`, { scroll: false })
  }

  async function acceptBid(bid: JsonRecord) {
    setAccepting(true)
    setError("")
    const { response, body } = await apiJson(`/api/bids/${bid.id}/accept`, {
      method: "POST",
      body: JSON.stringify({ totalAmount: bid.price }),
    })
    setAccepting(false)
    if (!response.ok) {
      setError(body.error || "ACCEPT_BID_FAILED")
      setConfirmBid(null)
      return
    }
    router.push(`/${locale}/orders/${body.order?.id || ""}`)
  }

  function requestAccept(bid: JsonRecord) {
    if (bid.id === lowest?.id) void acceptBid(bid)
    else setConfirmBid(bid)
  }

  return (
    <RequestPage>
      <div>
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[10.5px] text-[#7f8a9b]"><Link href={`/${locale}/requests`} className="transition hover:text-[#172944]">My Requests</Link><span>/</span><span>SR-{shortId(srId)}</span><span>/</span><span className="font-semibold text-[#42516a]">{tabLabel(tab)}</span></nav>
        <h1 className="mt-3 text-[28px] font-bold tracking-[-0.6px] text-[#11233e]">{tab === "comparison" ? "Bid Details & Comparison" : tab === "forwarder" ? "Forwarder Details" : tab === "breakdown" ? "Bid Breakdown" : tabLabel(tab)}</h1>
        <p className="mt-1 text-[12px] text-[#768297]">{tabDescription(tab)}</p>
      </div>

      {state === "loading" ? <LoadingState label="Loading request and sealed-bid status..." /> : null}
      {state === "error" ? <EmptyState title="Request could not load" body={error} actionHref={`/${locale}/requests`} actionLabel="Back to requests" /> : null}

      {request ? (
        <>
          <RequestContext request={request} sealed={sealed} />
          <DetailTabs active={tab} onSelect={navigate} hasBid={Boolean(selectedBid)} />

          {["comparison", "forwarder", "breakdown"].includes(tab) ? <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_286px]">
            <div className="min-w-0">
              {tab === "comparison" ? <ComparisonView request={request} bids={sortedBids} bidCount={bidCount} sealed={sealed} now={now} selectedBidId={selectedBidId} onSelect={setSelectedBidId} onOpenForwarder={(bidId) => navigate("forwarder", bidId)} onAccept={requestAccept} accepting={accepting} error={error} /> : null}
              {tab === "forwarder" ? <ForwarderView bid={selectedBid} request={request} onBack={() => navigate("comparison")} onBreakdown={(bidId) => navigate("breakdown", bidId)} /> : null}
              {tab === "breakdown" ? <BreakdownView bid={selectedBid} request={request} onBack={() => navigate("forwarder", selectedBid?.id)} /> : null}
            </div>
            <RequestSidebar request={request} bidCount={bidCount} sealed={sealed} now={now} />
          </div> : <RequestSupportingWorkspace tab={tab as RequestSupportingTab} request={request} selectedBid={selectedBid} bidCount={bidCount} sealed={sealed} now={now} linkedOrder={linkedOrder} locale={locale} />}
        </>
      ) : null}

      {confirmBid ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-[#10182a]/45 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setConfirmBid(null) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="confirm-award-title" className="w-full max-w-[470px] rounded-[16px] border border-white/50 bg-white p-6 shadow-[0_30px_90px_rgba(13,25,48,0.28)]">
            <div className="flex items-start justify-between gap-4"><span className="grid h-11 w-11 place-items-center rounded-full bg-[#fff4df] text-[#bd7912]"><Award className="h-5 w-5" /></span><button type="button" aria-label="Close confirmation" onClick={() => setConfirmBid(null)} className="grid h-9 w-9 place-items-center rounded-full text-[#7a8698] transition hover:bg-[#f2f4f7] hover:text-[#26344c]"><X className="h-4 w-4" /></button></div>
            <h2 id="confirm-award-title" className="mt-4 text-[20px] font-bold text-[#14243e]">Choose a non-lowest quote?</h2>
            <p className="mt-2 text-[12.5px] leading-6 text-[#69768a]">This quote is <strong className="text-[#24324a]">{money(Number(confirmBid.price || 0) - Number(lowest?.price || 0), confirmBid.currency)}</strong> above the lowest valid quote. You may still choose it for service fit, transit time or reputation.</p>
            <div className="mt-5 rounded-[10px] border border-[#ece7df] bg-[#fbfaf7] p-4"><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#8b95a4]">Selected partner</p><p className="mt-1 text-[14px] font-bold text-[#172944]">{companyName(confirmBid)}</p><p className="mt-1 text-[22px] font-bold text-[#172944]">{money(confirmBid.price, confirmBid.currency)}</p></div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setConfirmBid(null)} className="h-11 rounded-[9px] border border-[#dfe4ec] px-4 text-[11.5px] font-semibold text-[#536177] transition hover:bg-[#f7f8fa]">Keep comparing</button><button type="button" disabled={accepting} onClick={() => void acceptBid(confirmBid)} className="h-11 rounded-[9px] bg-[#102544] px-5 text-[11.5px] font-semibold text-white transition hover:bg-[#19375e] disabled:opacity-50">{accepting ? "Awarding..." : "Confirm and award"}</button></div>
          </section>
        </div>
      ) : null}
    </RequestPage>
  )
}

function RequestPage({ children }: { children: React.ReactNode }) {
  return <main className="min-h-full bg-[radial-gradient(circle_at_75%_0%,rgba(226,185,112,0.09),transparent_28%),linear-gradient(180deg,#fffdf9_0%,#fbfaf7_38%,#f7f8fa_100%)] px-4 pb-14 pt-6 sm:px-6 xl:px-8"><div className="mx-auto flex w-full max-w-[1540px] flex-col gap-5">{children}</div></main>
}

function PageHeading({ title, description }: { title: string; description: string }) {
  return <header><h1 className="text-[30px] font-bold tracking-[-0.7px] text-[#10233f]">{title}</h1><p className="mt-1 text-[12.5px] text-[#718096]">{description}</p></header>
}

function KpiCard({ icon: Icon, label, value, helper, tone }: { icon: typeof Plane; label: string; value: number; helper: string; tone: "gold" | "blue" | "green" | "violet" | "slate" }) {
  const styles = { gold: "bg-[#fff2df] text-[#c37b16]", blue: "bg-[#eaf3ff] text-[#2b73d3]", green: "bg-[#eaf8ef] text-[#168a55]", violet: "bg-[#eeefff] text-[#5659c7]", slate: "bg-[#eef1f5] text-[#40506a]" }[tone]
  return <div className="group flex min-h-[102px] items-center gap-4 rounded-[13px] border border-[#e7e9ee] bg-white px-5 py-4 shadow-[0_8px_26px_rgba(30,43,70,0.04)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d7dce5] hover:shadow-[0_14px_34px_rgba(30,43,70,0.075)]"><span className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-full ${styles}`}><Icon className="h-5 w-5" /></span><span><span className="block text-[11px] font-semibold text-[#34425a]">{label}</span><strong className="mt-0.5 block text-[24px] leading-none text-[#13243e]">{value}</strong><span className="mt-1.5 block text-[10px] text-[#8792a2]">{helper}</span></span></div>
}

function FilterSelect({ icon: Icon, label, value, onChange, options }: { icon?: typeof CalendarDays; label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label className="relative inline-flex min-w-[116px] items-center"><span className="sr-only">{label}</span>{Icon ? <Icon className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#657288]" /> : null}<select value={value} onChange={(event) => onChange(event.target.value)} className={`h-11 w-full cursor-pointer appearance-none rounded-[9px] border border-[#dfe4ec] bg-white text-[10.5px] font-semibold text-[#48566d] outline-none transition hover:border-[#bdc7d5] focus:border-[#b77d18] focus:ring-4 focus:ring-[#c58a18]/10 ${Icon ? "pl-9" : "pl-3"} pr-8`}>{options.map(([optionValue, optionLabel]) => <option key={`${label}-${optionValue}`} value={optionValue}>{optionLabel}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-[#8d97a7]" /></label>
}

function IconToggle({ label, active, onClick, icon: Icon }: { label: string; active: boolean; onClick: () => void; icon: typeof List }) {
  return <button type="button" aria-label={label} aria-pressed={active} onClick={onClick} className={`grid h-9 w-9 place-items-center rounded-[7px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c58a18]/30 ${active ? "bg-[#fff4e3] text-[#bd7912]" : "text-[#7f8a9b] hover:bg-[#f4f5f7] hover:text-[#2c3a52]"}`}><Icon className="h-4 w-4" /></button>
}

function RequestRow({ locale, item, bidCount }: { locale: Locale; item: JsonRecord; bidCount: number }) {
  const status = requestStatus(item)
  return <article className="border-b border-[#edf0f3] px-4 py-4 transition last:border-0 hover:bg-[#fffdf9] sm:px-5"><div className="grid gap-4 xl:grid-cols-[minmax(270px,2.1fr)_minmax(150px,1.05fr)_150px_90px_155px_120px_116px] xl:items-center">
    <div className="min-w-0"><div className="flex items-center gap-2"><span className={`h-2 w-2 flex-shrink-0 rounded-full ${status.dot}`} /><h2 className="truncate text-[13px] font-bold text-[#172944]">{routeLabel(item.route)}</h2></div><p className="mt-1.5 pl-4 text-[9.5px] text-[#8993a3]">Request ID: SR-{shortId(item.id)}</p><p className="mt-1 pl-4 text-[9.5px] text-[#8993a3]">Created {formatDate(item.created_at, false)}</p></div>
    <div><p className="text-[11.5px] font-semibold text-[#273650]">{cargoName(item.cargo_details)}</p><p className="mt-1 text-[9.5px] text-[#8490a1]">{cargoMeta(item.cargo_details)}</p><p className="mt-1 text-[9.5px] font-medium text-[#536178]">{modeLabel(item.cargo_details)}</p></div>
    <div><StatusBadge item={item} /><p className={`mt-1.5 text-[10px] font-semibold ${status.text}`}>{item.status === "OPEN" ? timeRemaining(item.bid_deadline) : status.helper}</p></div>
    <div><strong className="text-[17px] text-[#172944]">{bidCount || "-"}</strong><p className="mt-0.5 text-[9px] text-[#8993a3]">{bidCount ? "Bids received" : "No bids yet"}</p></div>
    <div className="text-[10px] leading-5 text-[#4f5e75]"><p>{formatDate(item.created_at, true)}</p><p className="text-[#8993a3]">to</p><p>{formatDate(item.bid_deadline, true)}</p></div>
    <div><p className="text-[10px] leading-5 text-[#4f5e75]">{formatDate(item.created_at, true)}</p></div>
    <Link href={`/${locale}/requests/${item.id}`} className="inline-flex h-10 items-center justify-center rounded-[8px] border border-[#dfe4ec] bg-white px-3 text-[10.5px] font-semibold text-[#26354e] transition hover:border-[#9eabbc] hover:bg-[#f9fafb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c58a18]/10">View Details</Link>
  </div></article>
}

function RequestCard({ locale, item, bidCount }: { locale: Locale; item: JsonRecord; bidCount: number }) {
  return <article className="rounded-[13px] border border-[#e5e8ee] bg-white p-5 shadow-[0_8px_24px_rgba(30,43,70,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(30,43,70,0.08)]"><div className="flex items-start justify-between gap-3"><StatusBadge item={item} /><span className="text-[9px] text-[#8a95a6]">SR-{shortId(item.id)}</span></div><h2 className="mt-4 text-[15px] font-bold text-[#14263f]">{routeLabel(item.route)}</h2><p className="mt-2 text-[11px] text-[#6f7c90]">{cargoName(item.cargo_details)} · {cargoMeta(item.cargo_details)}</p><div className="mt-4 grid grid-cols-2 gap-3 rounded-[10px] bg-[#f8f8f7] p-3"><InfoDatum label="Bids" value={String(bidCount)} /><InfoDatum label="Window" value={item.status === "OPEN" ? timeRemaining(item.bid_deadline) : requestStatus(item).helper} /></div><Link href={`/${locale}/requests/${item.id}`} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#102544] text-[10.5px] font-semibold text-white transition hover:bg-[#19375e]">View details<ArrowRight className="h-3.5 w-3.5" /></Link></article>
}

function DraftRow({ locale }: { locale: Locale }) {
  return <article className="border-b border-[#edf0f3] bg-[#fcfcff] px-5 py-4"><div className="grid gap-4 xl:grid-cols-[minmax(270px,2.1fr)_minmax(150px,1.05fr)_150px_90px_155px_120px_116px] xl:items-center"><div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#8073d1]" /><h2 className="text-[13px] font-bold text-[#172944]">Saved shipment draft</h2></div><p className="mt-1.5 pl-4 text-[9.5px] text-[#8993a3]">Stored securely on this device</p></div><p className="text-[11px] text-[#6d798d]">Continue to complete cargo details</p><span className="inline-flex w-fit rounded-full bg-[#f0efff] px-2.5 py-1 text-[9.5px] font-semibold text-[#5d55aa]">Draft</span><span className="text-[15px] font-bold text-[#a2abb8]">-</span><span className="text-[10px] text-[#8993a3]">Not submitted</span><span className="text-[10px] text-[#8993a3]">This device</span><Link href={`/${locale}/inquiries/new`} className="inline-flex h-10 items-center justify-center rounded-[8px] bg-[#102544] px-3 text-[10.5px] font-semibold text-white transition hover:bg-[#19375e]">Continue</Link></div></article>
}

function StatusBadge({ item }: { item: JsonRecord }) {
  const status = requestStatus(item)
  const Icon = status.icon
  return <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-semibold ${status.badge}`}><Icon className="h-3 w-3" />{status.label}</span>
}

function RequestContext({ request, sealed }: { request: JsonRecord; sealed: boolean }) {
  const cargo = request.cargo_details || {}
  return <section className="grid overflow-hidden rounded-[13px] border border-[#e7e8ec] bg-white shadow-[0_8px_24px_rgba(30,43,70,0.04)] xl:grid-cols-[1.25fr_1.75fr]"><div className="flex items-center justify-between gap-4 border-b border-[#eceef2] px-5 py-5 xl:border-b-0 xl:border-r"><LocationCompact route={request.route} type="origin" /><span className="flex min-w-[86px] flex-1 items-center px-4"><span className="h-px flex-1 border-t border-dashed border-[#8d9aae]" /><Plane className="mx-2 h-5 w-5 rotate-45 text-[#132943]" /><span className="h-px flex-1 border-t border-dashed border-[#d0932b]" /></span><LocationCompact route={request.route} type="destination" align="right" /></div><div className="grid grid-cols-2 divide-x divide-[#edf0f3] sm:grid-cols-3 lg:grid-cols-6"><ContextDatum label="Request ID" value={`SR-${shortId(request.id)}`} /><ContextDatum label="Mode / Incoterm" value={`${modeLabel(cargo)} · ${cargo.incoterm || "-"}`} /><ContextDatum label="Cargo" value={`${cargoName(cargo)}, ${cargo.pieces || "-"} pieces`} /><ContextDatum label="Created" value={formatDate(request.created_at, true)} /><ContextDatum label="Bidding window" value={sealed ? timeRemaining(request.bid_deadline) : requestStatus(request).label} accent={sealed} /><div className="grid place-items-center p-3"><span className={`inline-flex items-center gap-1.5 rounded-[7px] px-2.5 py-2 text-[9.5px] font-semibold ${sealed ? "bg-[#eaf7ee] text-[#14784c]" : "bg-[#fff3df] text-[#ac6a0d]"}`}><LockKeyhole className="h-3.5 w-3.5" />{sealed ? "Sealed bidding" : "Bids revealed"}</span></div></div></section>
}

function DetailTabs({ active, onSelect, hasBid }: { active: DetailTab; onSelect: (tab: DetailTab) => void; hasBid: boolean }) {
  const tabs: { id: DetailTab; label: string; requiresBid?: boolean }[] = [{ id: "comparison", label: "Bid Comparison" }, { id: "forwarder", label: "Forwarder Details", requiresBid: true }, { id: "breakdown", label: "Bid Breakdown", requiresBid: true }, { id: "transit", label: "Transit & Schedule" }, { id: "terms", label: "Terms & Conditions" }, { id: "documents", label: "Documents" }, { id: "messages", label: "Messages" }, { id: "activity", label: "Activity Log" }]
  return <nav aria-label="Request detail sections" className="overflow-x-auto border-b border-[#e6e8ed]"><div className="flex min-w-max gap-1">{tabs.map((item) => <button key={item.id} type="button" disabled={item.requiresBid && !hasBid} onClick={() => onSelect(item.id)} className={`relative h-12 px-3 text-[10.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c58a18]/25 disabled:cursor-not-allowed disabled:opacity-35 ${active === item.id ? "text-[#b66d13]" : "text-[#536077] hover:text-[#162842]"}`}>{item.label}{active === item.id ? <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#c47b17]" /> : null}</button>)}</div></nav>
}

function ComparisonView({ request, bids, bidCount, sealed, now, selectedBidId, onSelect, onOpenForwarder, onAccept, accepting, error }: { request: JsonRecord; bids: JsonRecord[]; bidCount: number; sealed: boolean; now: number; selectedBidId: string; onSelect: (id: string) => void; onOpenForwarder: (id: string) => void; onAccept: (bid: JsonRecord) => void; accepting: boolean; error: string }) {
  if (sealed) return <LockedComparison deadline={request.bid_deadline} bidCount={bidCount} now={now} />
  if (bids.length === 0) return <EmptyState title="No valid bids received" body="The bidding window has closed without a valid quotation. You can relaunch or create a new request." />
  const lowest = bids[0]
  return <div className="space-y-4">
    <section className="rounded-[13px] border border-[#eadfce] bg-[linear-gradient(90deg,#fffaf2,#fffdf9)] px-5 py-4 shadow-[0_8px_24px_rgba(38,48,70,0.04)]"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full border border-[#e6c58f] bg-white text-[#be7710]"><Award className="h-4 w-4" /></span><div><h2 className="text-[12px] font-bold text-[#a5620c]">Quotes ready for comparison</h2><p className="mt-0.5 text-[10px] text-[#7b6f61]">Lowest price is highlighted. You may choose another partner for a stronger service fit.</p></div></div><span className="text-[10px] font-semibold text-[#587087]">{bids.length} valid bid{bids.length === 1 ? "" : "s"}</span></div></section>
    <section className="overflow-hidden rounded-[13px] border border-[#e5e8ed] bg-white shadow-[0_10px_28px_rgba(30,43,70,0.045)]">
      <div className="flex items-center justify-between border-b border-[#eceff3] px-5 py-4"><div className="flex items-center gap-2"><h2 className="text-[12.5px] font-bold text-[#172944]">Bid Comparison</h2><span className="h-1.5 w-1.5 rounded-full bg-[#20a266]" /><span className="text-[9.5px] text-[#788497]">{bids.length} bids revealed</span></div><span className="text-[9.5px] text-[#8993a3]">Compare by total quote</span></div>
      <div className="hidden overflow-x-auto lg:block"><div className="grid min-w-[800px]" style={{ gridTemplateColumns: `155px repeat(${bids.length}, minmax(180px, 1fr))` }}>
        <ComparisonLabel label="Rank" />{bids.map((bid, index) => <ComparisonCell key={`head-${bid.id}`} emphasized={index === 0}><span className={`mb-2 grid h-6 w-6 place-items-center rounded-full text-[9px] font-bold ${index === 0 ? "bg-[#fff0d2] text-[#b66c0c]" : "bg-[#eef1f5] text-[#536078]"}`}>{index + 1}</span><strong className="block text-[11px] text-[#1c2c45]">{companyName(bid)}</strong>{index === 0 ? <span className="mt-1 inline-flex rounded-full bg-[#eaf7ef] px-2 py-0.5 text-[8px] font-bold text-[#168a55]">Lowest quote</span> : null}</ComparisonCell>)}
        <ComparisonLabel label="Total Quote" helper="HKD" />{bids.map((bid, index) => <ComparisonCell key={`price-${bid.id}`} emphasized={index === 0}><strong className={`text-[15px] ${index === 0 ? "text-[#168a55]" : "text-[#152640]"}`}>{money(bid.price, bid.currency)}</strong>{index > 0 ? <span className="mt-1 block text-[8.5px] text-[#8b95a4]">+{money(Number(bid.price) - Number(lowest.price), bid.currency)}</span> : null}</ComparisonCell>)}
        <ComparisonLabel label="Transit Time" helper="Door to door" />{bids.map((bid) => <ComparisonCell key={`transit-${bid.id}`}><strong className="text-[11px] text-[#22314a]">{bid.transit_time || "Not supplied"}</strong></ComparisonCell>)}
        <ComparisonLabel label="Rating" helper="Public profile" />{bids.map((bid) => <ComparisonCell key={`rating-${bid.id}`}><span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#25344d]"><Star className="h-3.5 w-3.5 fill-[#efa72f] text-[#efa72f]" />{profileNumber(bid, "rating") || "-"}</span></ComparisonCell>)}
        <ComparisonLabel label="Completed Orders" helper="Platform record" />{bids.map((bid) => <ComparisonCell key={`orders-${bid.id}`}><strong className="text-[11px] text-[#22314a]">{profileNumber(bid, "completed_orders") || "-"}</strong></ComparisonCell>)}
        <ComparisonLabel label="Payment / Terms" />{bids.map((bid) => <ComparisonCell key={`terms-${bid.id}`}><span className="line-clamp-3 text-[9.5px] leading-4 text-[#59667a]">{bid.terms || "No special terms"}</span></ComparisonCell>)}
        <ComparisonLabel label="Action" />{bids.map((bid) => <ComparisonCell key={`action-${bid.id}`}><div className="flex flex-col gap-2"><button type="button" onClick={() => onOpenForwarder(bid.id)} className="h-9 rounded-[7px] border border-[#dfe4ec] text-[9.5px] font-semibold text-[#34425a] transition hover:border-[#aab5c5] hover:bg-[#f9fafb]">View Details</button><button type="button" onClick={() => { onSelect(bid.id); onAccept(bid) }} disabled={accepting} className={`h-9 rounded-[7px] text-[9.5px] font-semibold transition disabled:opacity-50 ${selectedBidId === bid.id ? "bg-[#102544] text-white" : "bg-[#eef2f7] text-[#33435b] hover:bg-[#e5eaf1]"}`}>Award bid</button></div></ComparisonCell>)}
      </div></div>
      <div className="grid gap-3 p-4 lg:hidden">{bids.map((bid, index) => <article key={bid.id} className={`rounded-[11px] border p-4 ${index === 0 ? "border-[#e4bd76] bg-[#fffaf0]" : "border-[#e3e7ed]"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[12px] font-bold text-[#172944]">{companyName(bid)}</p><p className="mt-1 text-[9.5px] text-[#7f8a9b]">{bid.transit_time || "Transit not supplied"}</p></div><strong className="text-[16px] text-[#172944]">{money(bid.price, bid.currency)}</strong></div><p className="mt-3 rounded-[8px] bg-white/80 p-3 text-[10px] leading-5 text-[#647186]">{bid.terms || "No special terms supplied."}</p><div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => onOpenForwarder(bid.id)} className="h-10 rounded-[8px] border border-[#dfe4ec] text-[10px] font-semibold">View details</button><button type="button" onClick={() => onAccept(bid)} className="h-10 rounded-[8px] bg-[#102544] text-[10px] font-semibold text-white">Award bid</button></div></article>)}</div>
      {error ? <p className="border-t border-[#f1d5d5] bg-[#fff5f5] px-5 py-3 text-[10.5px] font-semibold text-[#bd4d4d]">{error}</p> : null}
    </section>
  </div>
}

function LockedComparison({ deadline, bidCount, now }: { deadline?: string; bidCount: number; now: number }) {
  return <section className="overflow-hidden rounded-[14px] border border-[#eadfce] bg-white shadow-[0_12px_34px_rgba(30,43,70,0.06)]"><div className="grid gap-4 bg-[linear-gradient(105deg,#fff9ef,#fffdf9)] px-6 py-5 sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex items-start gap-4"><span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-full border border-[#e4c28a] bg-white text-[#bd7710]"><LockKeyhole className="h-5 w-5" /></span><div><h2 className="text-[15px] font-bold text-[#a45f0b]">Sealed bidding in progress</h2><p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#766d61]">Forwarders are submitting private quotations. Prices and company identities unlock together when the bidding window closes.</p></div></div><div className="rounded-[11px] border border-[#ead9bd] bg-white px-5 py-3 text-center"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9d7a42]">Time remaining</p><strong className="mt-1 block text-[20px] tracking-[0.08em] text-[#172944]">{countdown(deadline, now)}</strong></div></div><div className="p-6"><div className="flex items-center justify-between"><div><p className="text-[12px] font-bold text-[#172944]">Private bid vault</p><p className="mt-1 text-[10px] text-[#7e899b]">{bidCount} encrypted bid{bidCount === 1 ? "" : "s"} received</p></div><ShieldCheck className="h-5 w-5 text-[#168a55]" /></div><div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: Math.max(3, Math.min(bidCount, 6)) }, (_, index) => <div key={index} className="relative overflow-hidden rounded-[11px] border border-[#e5e8ee] bg-[#fafbfc] p-4"><div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,.85)_50%,transparent_75%)] bg-[length:220%_100%] animate-pulse" /><div className="relative flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#edf1f5] text-[#6e7b8f]"><LockKeyhole className="h-4 w-4" /></span><div><p className="text-[10.5px] font-semibold text-[#435168]">Sealed quotation {index + 1}</p><p className="mt-1 text-[9px] text-[#919baa]">Identity and price hidden</p></div></div></div>)}</div></div></section>
}

function ForwarderView({ bid, request, onBack, onBreakdown }: { bid: JsonRecord | null; request: JsonRecord; onBack: () => void; onBreakdown: (bidId: string) => void }) {
  if (!bid) return <EmptyState title="Select a forwarder first" body="Open Bid Comparison and choose View Details on a valid quote." />
  const profile = bid.forwarder || {}
  const routes = arrayValue(profile.service_routes || profile.service_coverage)
  const services = arrayValue(profile.service_types)
  const certifications = arrayValue(profile.certifications)
  return <div className="space-y-4"><section className="rounded-[13px] border border-[#e4e7ed] bg-white p-5 shadow-[0_10px_28px_rgba(30,43,70,0.045)]"><div className="flex flex-col gap-5 border-b border-[#eceff3] pb-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex items-start gap-4"><span className="grid h-16 w-16 flex-shrink-0 place-items-center overflow-hidden rounded-[10px] border border-[#e2e6ed] bg-[#f6f8fa] text-[22px] font-bold text-[#21476c]">{initials(companyName(bid))}</span><div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[20px] font-bold text-[#14243e]">{companyName(bid)}</h2>{profile.verification_status === "verified" || profile.verified_at ? <span className="inline-flex items-center gap-1 rounded-full bg-[#e9f7ee] px-2 py-1 text-[8.5px] font-bold text-[#168a55]"><UserRoundCheck className="h-3 w-3" />Verified</span> : null}</div><p className="mt-1 text-[10.5px] text-[#69768b]">{profile.region || "Region not supplied"}{profile.founded_year ? ` · Established ${profile.founded_year}` : ""}</p><p className="mt-2 text-[10.5px] text-[#43516a]">{services.length ? services.join(" · ") : "Freight forwarding services"}</p></div></div><div className="rounded-[10px] border border-[#e3e7ed] bg-[#fbfcfd] px-5 py-4 lg:min-w-[260px]"><p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8993a3]">Total quote</p><strong className="mt-1 block text-[24px] text-[#168a55]">{money(bid.price, bid.currency)}</strong><p className="mt-1 text-[9px] text-[#8993a3]">{bid.transit_time || "Transit time not supplied"}</p><button type="button" onClick={() => onBreakdown(bid.id)} className="mt-3 inline-flex h-9 items-center gap-2 rounded-[7px] border border-[#dfe4ec] bg-white px-3 text-[9.5px] font-semibold text-[#33425a] transition hover:border-[#aab5c5]">View bid breakdown<ArrowRight className="h-3 w-3" /></button></div></div>
      <div className="grid divide-y divide-[#eceff3] py-4 sm:grid-cols-3 sm:divide-x sm:divide-y-0"><ProfileMetric label="Average rating" value={profileNumber(bid, "rating") ? `${profileNumber(bid, "rating")} / 5` : "Not rated"} icon={Star} /><ProfileMetric label="Reputation score" value={profileNumber(bid, "reputation_score") || "Not scored"} icon={TrendingUp} /><ProfileMetric label="Completed orders" value={profileNumber(bid, "completed_orders") || "No record"} icon={CheckCircle2} /></div>
      <div className="grid gap-6 border-t border-[#eceff3] pt-5 lg:grid-cols-[1.15fr_1fr_.8fr]"><div><SectionTitle>Company profile</SectionTitle><DefinitionList items={[["Company size", profile.company_size || "Not supplied"], ["Region", profile.region || "Not supplied"], ["Tier", profile.tier || "Standard"], ["Request fit", `${routeLabel(request.route)} · ${modeLabel(request.cargo_details)}`]]} /><p className="mt-4 text-[10.5px] leading-5 text-[#667388]">{profile.description || profile.slogan || "This forwarder has not added a public company description yet."}</p></div><div><SectionTitle>Service coverage</SectionTitle><TagList items={[...routes, ...services]} empty="No public service coverage supplied." /><SectionTitle className="mt-5">Certifications</SectionTitle><TagList items={certifications} empty="No certifications listed." /></div><div><SectionTitle>Contact access</SectionTitle><div className="rounded-[10px] border border-[#e1e6ed] bg-[#f8fafc] p-4"><LockKeyhole className="h-5 w-5 text-[#52627a]" /><p className="mt-3 text-[10.5px] font-semibold text-[#26354e]">Unlocks after award</p><p className="mt-1 text-[9.5px] leading-5 text-[#7b8799]">LBID keeps both parties anonymous during evaluation. Contact details appear in the order workspace after award.</p></div></div></div>
    </section><div className="flex items-center justify-between"><button type="button" onClick={onBack} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#dfe4ec] bg-white px-4 text-[10px] font-semibold text-[#42516a] transition hover:bg-[#f8f9fb]"><ArrowLeft className="h-3.5 w-3.5" />Back to comparison</button><button type="button" onClick={() => onBreakdown(bid.id)} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#102544] px-4 text-[10px] font-semibold text-white transition hover:bg-[#19375e]">Bid breakdown<ArrowRight className="h-3.5 w-3.5" /></button></div></div>
}

function BreakdownView({ bid, request, onBack }: { bid: JsonRecord | null; request: JsonRecord; onBack: () => void }) {
  if (!bid) return <EmptyState title="Select a bid first" body="Open Bid Comparison and choose a valid quotation." />
  const services = Array.isArray(request.services_needed) ? request.services_needed : []
  return <div className="space-y-4"><section className="rounded-[13px] border border-[#e4e7ed] bg-white p-5 shadow-[0_10px_28px_rgba(30,43,70,0.045)]"><div className="grid gap-5 border-b border-[#eceff3] pb-5 lg:grid-cols-[1.2fr_1fr]"><div><p className="text-[18px] font-bold text-[#14243e]">{companyName(bid)}</p><p className="mt-1 text-[10.5px] text-[#768296]">Quote submitted {formatDate(bid.submitted_at, true)}</p></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><InfoDatum label="Total" value={money(bid.price, bid.currency)} accent /><InfoDatum label="Currency" value={bid.currency || "HKD"} /><InfoDatum label="Transit" value={bid.transit_time || "Not supplied"} /><InfoDatum label="Validity" value="Until award" /></div></div><div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(240px,.65fr)]"><div><div className="flex items-center justify-between"><SectionTitle>Cost breakdown</SectionTitle><span className="rounded-full bg-[#f2f4f7] px-2.5 py-1 text-[8.5px] font-semibold text-[#6f7b8e]">Single total quote</span></div><div className="mt-3 overflow-hidden rounded-[10px] border border-[#e3e7ed]"><div className="grid grid-cols-[42px_1fr_120px] bg-[#f8f9fb] px-4 py-3 text-[8.5px] font-bold uppercase tracking-[0.07em] text-[#8792a3]"><span>#</span><span>Charge description</span><span className="text-right">Amount</span></div><div className="grid grid-cols-[42px_1fr_120px] items-center border-t border-[#e8ebf0] px-4 py-4"><span className="text-[10px] text-[#748095]">1</span><div><p className="text-[11px] font-semibold text-[#26354e]">Total freight quotation</p><p className="mt-1 text-[9px] text-[#8792a3]">Forwarder supplied an all-in total without structured line items.</p></div><strong className="text-right text-[12px] text-[#172944]">{money(bid.price, bid.currency)}</strong></div><div className="grid grid-cols-[1fr_120px] border-t border-[#e6d5b8] bg-[#fffaf0] px-4 py-3"><strong className="text-[10.5px] text-[#a7650d]">Total landed quote</strong><strong className="text-right text-[12px] text-[#172944]">{money(bid.price, bid.currency)}</strong></div></div><div className="mt-4 rounded-[10px] border border-[#e3e7ed] bg-[#fbfcfd] p-4"><p className="text-[10px] font-semibold text-[#35435a]">Forwarder terms</p><p className="mt-2 text-[10px] leading-5 text-[#6d798c]">{bid.terms || "No special payment or handling terms were supplied."}</p></div></div><div><SectionTitle>Cost distribution</SectionTitle><div className="mt-4 grid place-items-center"><div className="relative h-40 w-40 rounded-full" style={{ background: "conic-gradient(#d79a35 0deg 360deg)" }}><div className="absolute inset-[22px] grid place-items-center rounded-full bg-white text-center"><span><strong className="block text-[17px] text-[#172944]">100%</strong><small className="text-[8.5px] text-[#8792a3]">Quoted total</small></span></div></div></div><div className="mt-5 flex items-center justify-between text-[10px]"><span className="flex items-center gap-2 text-[#657287]"><span className="h-2.5 w-2.5 rounded-full bg-[#d79a35]" />All-in quotation</span><strong className="text-[#26354e]">100%</strong></div><SectionTitle className="mt-6">Requested services</SectionTitle><ul className="mt-3 space-y-2">{services.length ? services.map((service: string) => <li key={service} className="flex items-start gap-2 text-[9.5px] text-[#617086]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#168a55]" />{service}</li>) : <li className="text-[9.5px] text-[#8792a3]">No services specified.</li>}</ul></div></div></section><button type="button" onClick={onBack} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#dfe4ec] bg-white px-4 text-[10px] font-semibold text-[#42516a] transition hover:bg-[#f8f9fb]"><ArrowLeft className="h-3.5 w-3.5" />Forwarder details</button></div>
}

function RequestSidebar({ request, bidCount, sealed, now }: { request: JsonRecord; bidCount: number; sealed: boolean; now: number }) {
  const readiness = readinessDetails(request)
  return <aside className="space-y-4"><section className="rounded-[13px] border border-[#e5e8ed] bg-white p-5 shadow-[0_10px_28px_rgba(30,43,70,0.04)]"><SectionTitle>Request status</SectionTitle><div className="mt-4 flex items-start gap-3"><span className={`grid h-9 w-9 place-items-center rounded-full ${sealed ? "bg-[#eaf7ef] text-[#168a55]" : "bg-[#fff2df] text-[#bd7710]"}`}><LockKeyhole className="h-4 w-4" /></span><div><p className="text-[12px] font-bold text-[#172944]">{requestStatus(request).label}</p><p className="mt-1 text-[9px] leading-4 text-[#7d899a]">{sealed ? "Forwarders are submitting private quotes." : requestStatus(request).helper}</p></div></div><div className="mt-5 space-y-3 border-t border-[#eceff3] pt-4"><SideRow label="Bids received" value={String(bidCount)} /><SideRow label="Bidding window" value="3 hours" /><SideRow label="Time remaining" value={sealed ? countdown(request.bid_deadline, now) : "Closed"} accent={sealed} /><SideRow label="Expected first quote" value="30 - 45 min" /></div></section><section className="rounded-[13px] border border-[#e5e8ed] bg-white p-5 shadow-[0_10px_28px_rgba(30,43,70,0.04)]"><SectionTitle>Request readiness</SectionTitle><div className="mt-4 flex items-center gap-4"><div className="grid h-20 w-20 place-items-center rounded-full" style={{ background: `conic-gradient(#c88518 ${readiness.percent * 3.6}deg,#eee5d8 0)` }}><div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white"><strong className="text-[17px] text-[#172944]">{readiness.percent}%</strong></div></div><div><p className="text-[12px] font-bold text-[#172944]">{readiness.percent >= 80 ? "Very good" : "Almost there"}</p><p className="mt-1 text-[9px] text-[#8390a1]">{readiness.complete} of {readiness.items.length} completed</p></div></div><ul className="mt-5 space-y-3">{readiness.items.map((item) => <li key={item.label} className="flex items-center justify-between gap-3 text-[9.5px]"><span className="flex items-center gap-2 text-[#657287]">{item.complete ? <CheckCircle2 className="h-3.5 w-3.5 text-[#168a55]" /> : <span className="h-3.5 w-3.5 rounded-full border border-[#aeb6c1]" />}{item.label}</span><span className={item.complete ? "text-[#168a55]" : "text-[#8b95a4]"}>{item.complete ? "Complete" : "Incomplete"}</span></li>)}</ul></section><section className="rounded-[13px] border border-[#e5e8ed] bg-white p-5 shadow-[0_10px_28px_rgba(30,43,70,0.04)]"><div className="flex items-start gap-3"><CircleHelp className="mt-0.5 h-5 w-5 text-[#4d5c73]" /><div><p className="text-[11.5px] font-bold text-[#26354e]">Need help?</p><p className="mt-1 text-[9.5px] leading-5 text-[#7b8799]">Contact LBID support for assistance with this request.</p><Link href="/zh/workflow" className="mt-3 inline-flex items-center gap-1 text-[9.5px] font-semibold text-[#9d650f]">Help Center<ArrowRight className="h-3 w-3" /></Link></div></div></section></aside>
}

function ComparisonLabel({ label, helper }: { label: string; helper?: string }) { return <div className="border-b border-r border-[#e9ecf0] bg-[#fafbfc] px-4 py-3"><strong className="block text-[9.5px] text-[#36445b]">{label}</strong>{helper ? <span className="mt-0.5 block text-[8px] text-[#929baa]">{helper}</span> : null}</div> }
function ComparisonCell({ children, emphasized = false }: { children: React.ReactNode; emphasized?: boolean }) { return <div className={`min-h-[64px] border-b border-r border-[#e9ecf0] px-4 py-3 ${emphasized ? "bg-[#fffdf8]" : "bg-white"}`}>{children}</div> }
function ProfileMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Star }) { return <div className="flex items-center gap-3 px-4 py-3 first:pl-0"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f1f4f8] text-[#42546d]"><Icon className="h-4 w-4" /></span><span><strong className="block text-[16px] text-[#172944]">{value}</strong><span className="mt-0.5 block text-[8.5px] text-[#8993a3]">{label}</span></span></div> }
function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <h3 className={`text-[10.5px] font-bold text-[#26354e] ${className}`}>{children}</h3> }
function DefinitionList({ items }: { items: [string, string][] }) { return <dl className="mt-3 space-y-2">{items.map(([label, value]) => <div key={label} className="grid grid-cols-[100px_1fr] gap-3 text-[9.5px]"><dt className="text-[#8490a1]">{label}</dt><dd className="font-medium text-[#405069]">{value}</dd></div>)}</dl> }
function TagList({ items, empty }: { items: string[]; empty: string }) { return items.length ? <div className="mt-3 flex flex-wrap gap-2">{items.map((item) => <span key={item} className="rounded-full border border-[#e0e5ec] bg-[#f8fafc] px-2.5 py-1 text-[8.5px] font-semibold text-[#526177]">{item}</span>)}</div> : <p className="mt-3 text-[9.5px] text-[#8993a3]">{empty}</p> }
function ContextDatum({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="min-w-0 p-3"><p className="text-[8px] font-medium text-[#8993a3]">{label}</p><p className={`mt-1 truncate text-[9.5px] font-semibold ${accent ? "text-[#c06d10]" : "text-[#273650]"}`}>{value}</p></div> }
function LocationCompact({ route, type, align = "left" }: { route: JsonRecord; type: "origin" | "destination"; align?: "left" | "right" }) { return <div className={`min-w-0 ${align === "right" ? "text-right" : ""}`}><p className="truncate text-[11px] font-bold text-[#1a2b45]">{locationName(route, type)} ({locationCode(route, type) || "-"})</p><p className="mt-1 truncate text-[9px] text-[#7f8a9a]">{route?.[`${type}_facility`] || route?.[`${type}_country`] || "Location details"}</p></div> }
function SideRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="flex items-start justify-between gap-3 text-[9.5px]"><span className="text-[#778397]">{label}</span><strong className={`text-right ${accent ? "text-[#bd6f10]" : "text-[#26354e]"}`}>{value}</strong></div> }
function InfoDatum({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div><p className="text-[8.5px] font-medium text-[#8993a3]">{label}</p><p className={`mt-1 text-[10.5px] font-semibold ${accent ? "text-[#168a55]" : "text-[#26354e]"}`}>{value}</p></div> }
function PageButton({ label, children, active = false, disabled = false, onClick }: { label: string; children: React.ReactNode; active?: boolean; disabled?: boolean; onClick: () => void }) { return <button type="button" aria-label={label} aria-current={active ? "page" : undefined} disabled={disabled} onClick={onClick} className={`grid h-9 min-w-9 place-items-center rounded-[7px] px-2 text-[10px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-35 ${active ? "border border-[#e5c992] bg-[#fff7e9] text-[#a9670d]" : "text-[#536178] hover:bg-[#f1f3f6]"}`}>{children}</button> }
function LoadingState({ label }: { label: string }) { return <div className="grid min-h-[260px] place-items-center"><div className="text-center"><span className="mx-auto block h-8 w-8 animate-spin rounded-full border-2 border-[#dfe4ec] border-t-[#b77916]" /><p className="mt-3 text-[11px] text-[#7e899a]">{label}</p></div></div> }
function EmptyState({ title, body, actionHref, actionLabel }: { title: string; body: string; actionHref?: string; actionLabel?: string }) { return <div className="grid min-h-[260px] place-items-center px-5 py-10 text-center"><div><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-[#f0f3f7] text-[#596980]"><FileText className="h-5 w-5" /></span><h2 className="mt-4 text-[15px] font-bold text-[#1a2b45]">{title}</h2><p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-[#7b8799]">{body}</p>{actionHref && actionLabel ? <Link href={actionHref} className="mt-4 inline-flex h-10 items-center rounded-[8px] bg-[#102544] px-4 text-[10.5px] font-semibold text-white">{actionLabel}</Link> : null}</div></div> }

function requestStatus(item: JsonRecord) {
  const status = String(item.status || "").toUpperCase()
  if (status === "OPEN") return { label: "Sealed Bidding", helper: "Bidding in progress", badge: "bg-[#eaf7ef] text-[#14794c]", dot: "bg-[#1da365]", text: "text-[#bd6f10]", icon: LockKeyhole }
  if (status === "CLOSED") return { label: "Ready to Compare", helper: "Bidding closed", badge: "bg-[#fff3df] text-[#a8670d]", dot: "bg-[#d48b18]", text: "text-[#a8670d]", icon: SlidersHorizontal }
  if (status === "AWARDED") return { label: "Awarded", helper: "Partner selected", badge: "bg-[#eaf7ef] text-[#14794c]", dot: "bg-[#1da365]", text: "text-[#168a55]", icon: Award }
  if (status === "PENDING_REVIEW") return { label: "Pending Review", helper: "LBID review", badge: "bg-[#fff4e4] text-[#b56d12]", dot: "bg-[#e3a13d]", text: "text-[#b56d12]", icon: Clock3 }
  return { label: status ? titleCase(status) : "Unknown", helper: "Request updated", badge: "bg-[#eef1f5] text-[#59667a]", dot: "bg-[#9aa4b2]", text: "text-[#6f7b8e]", icon: FileText }
}

function findOrderForRequest(orders: JsonRecord[], requestId: string) {
  return orders.find((order) => {
    const quotation = Array.isArray(order.quotations) ? order.quotations[0] : order.quotations
    return quotation?.shipment_request_id === requestId
  }) || null
}

function readinessDetails(request: JsonRecord) {
  const cargo = request.cargo_details || {}
  const route = request.route || {}
  const items = [
    { label: "Route information", complete: Boolean(route.origin && (route.destination || route.dest)) },
    { label: "Pickup schedule", complete: Boolean(request.deadline || request.created_at) },
    { label: "Cargo details", complete: Boolean(cargo.cargo || cargo.cargo_type) },
    { label: "Weight / volume", complete: Boolean(cargo.weight_kg || cargo.cbm || cargo.pieces) },
    { label: "Services & documents", complete: Array.isArray(request.services_needed) && request.services_needed.length > 0 },
  ]
  const complete = items.filter((item) => item.complete).length
  return { items, complete, percent: Math.round((complete / items.length) * 100) }
}

function routeLabel(route?: JsonRecord) { return `${locationName(route, "origin")} (${locationCode(route, "origin") || "-"}) → ${locationName(route, "destination")} (${locationCode(route, "destination") || "-"})` }
function locationName(route: JsonRecord | undefined, type: "origin" | "destination") { const fallback = type === "destination" ? route?.dest : undefined; return route?.[`${type}_city`] || cleanLocation(route?.[type] || fallback) || (type === "origin" ? "Origin" : "Destination") }
function locationCode(route: JsonRecord | undefined, type: "origin" | "destination") { return route?.[`${type}_code`] || String(route?.[type] || "").match(/\(([A-Z0-9]{3,5})\)/)?.[1] || "" }
function cleanLocation(value?: string) { return String(value || "").split(",")[0].replace(/\s*\([A-Z0-9]{3,5}\)\s*$/, "").trim() }
function cargoName(cargo?: JsonRecord) { return cargo?.cargo || cargo?.cargo_type || "General Goods" }
function cargoMeta(cargo?: JsonRecord) { return [cargo?.pieces ? `${cargo.pieces} pieces` : null, cargo?.weight_kg ? `${cargo.weight_kg} kg` : null, cargo?.cbm ? `${cargo.cbm} CBM` : null].filter(Boolean).join(" · ") || "Details not supplied" }
function freightMode(cargo?: JsonRecord) { const value = String(cargo?.mode || "").toLowerCase(); return value.includes("sea") ? "sea" : value.includes("air") ? "air" : "other" }
function modeLabel(cargo?: JsonRecord) { return freightMode(cargo) === "sea" ? "Sea Freight" : freightMode(cargo) === "air" ? "Air Freight" : "Freight mode pending" }
function companyName(bid: JsonRecord) { const profile = bid.forwarder || {}; return profile.company_name_en || profile.company_name_zh || `Forwarder ${shortId(bid.forwarder_id)}` }
function profileNumber(bid: JsonRecord, ...keys: string[]) { const profile = bid.forwarder || {}; for (const key of keys) { const value = Number(profile[key]); if (Number.isFinite(value) && value > 0) return value.toLocaleString("en-HK", { maximumFractionDigits: 1 }) } return "" }
function arrayValue(value: unknown) { return Array.isArray(value) ? value.map(String).filter(Boolean) : [] }
function unique(values: string[]) { return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b)) }
function shortId(value?: string) { return String(value || "").slice(0, 8).toUpperCase() || "UNKNOWN" }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((item) => item[0]).join("").toUpperCase() }
function money(value: unknown, currency = "HKD") { return `${currency || "HKD"} ${Number(value || 0).toLocaleString("en-HK", { maximumFractionDigits: 2 })}` }
function formatDate(value?: string, time = true) { if (!value) return "Pending"; return new Intl.DateTimeFormat("en-HK", time ? { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" }).format(new Date(value)) }
function timeRemaining(deadline?: string) { const ms = new Date(deadline || 0).getTime() - Date.now(); if (ms <= 0) return "Closed"; const totalMinutes = Math.ceil(ms / 60_000); const hours = Math.floor(totalMinutes / 60); const minutes = totalMinutes % 60; return hours ? `${hours}h ${minutes}m left` : `${minutes}m left` }
function countdown(deadline: string | undefined, now: number) { const seconds = Math.max(0, Math.floor((new Date(deadline || 0).getTime() - now) / 1000)); const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); const remainder = seconds % 60; return `${String(hours).padStart(2, "0")} : ${String(minutes).padStart(2, "0")} : ${String(remainder).padStart(2, "0")}` }
function titleCase(value: string) { return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) }
function tabLabel(tab: DetailTab) { return { comparison: "Bid Comparison", forwarder: "Forwarder Details", breakdown: "Bid Breakdown", transit: "Transit & Schedule", terms: "Terms & Conditions", documents: "Documents", messages: "Messages", activity: "Activity Log" }[tab] }
function tabDescription(tab: DetailTab) { return { comparison: "Review valid bids and choose the best logistics partner.", forwarder: "Review public company capability, performance and service coverage.", breakdown: "Review the quotation structure and supplied commercial terms.", transit: "Review route and proposed delivery timing.", terms: "Review commercial and platform conditions.", documents: "Review files attached to the shipment brief.", messages: "Messaging unlocks when a partner is awarded.", activity: "Review key request events and status changes." }[tab] }
