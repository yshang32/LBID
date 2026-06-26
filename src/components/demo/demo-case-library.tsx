"use client"

import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Lock,
  MessageSquare,
  PackageCheck,
  Plane,
  Search,
  ShieldCheck,
  Ship,
  Sparkles,
  UsersRound,
  Wallet,
} from "lucide-react"

import type { Locale } from "@/lib/i18n"

type ScenarioId = "today" | "marketplace" | "bid" | "compare" | "order" | "admin" | "edge"

type Scenario = {
  id: ScenarioId
  title: string
  tag: string
  description: string
}

const scenarios: Scenario[] = [
  { id: "today", title: "Today workspace", tag: "Forwarder", description: "The daily cockpit: urgent recommended bid, metrics, activity and next actions." },
  { id: "marketplace", title: "Marketplace", tag: "Forwarder", description: "Recommended opportunities first, normal open-market bids next, locked states clearly explained." },
  { id: "bid", title: "Bid console", tag: "Forwarder", description: "One-shot sealed quote states: before input, ready to submit, submitted receipt and token impact." },
  { id: "compare", title: "Quote comparison", tag: "Client", description: "Lowest quote, recommended quote and non-lowest confirmation logic." },
  { id: "order", title: "Order workspace", tag: "Shared", description: "Pipeline, documents, messages and responsibility record in one operating view." },
  { id: "admin", title: "Admin operations", tag: "Admin", description: "SR review, account verification, payment confirmation and audit evidence." },
  { id: "edge", title: "Empty / locked", tag: "System", description: "Loading, empty, no-token and permission states for production polish." },
]

export function DemoCaseLibrary({ locale }: { locale: Locale }) {
  const [active, setActive] = useState<ScenarioId>("today")
  const activeCase = useMemo(() => scenarios.find((item) => item.id === active) || scenarios[0], [active])

  return (
    <main className="mx-auto w-full max-w-[1640px] px-5 pb-16 pt-8 sm:px-8">
      <section className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark">LBID visual QA library</p>
          <h1 className="mt-3 max-w-4xl text-[34px] font-bold leading-[1.03] tracking-[-1.1px] text-ink sm:text-[48px]">
            Demo cases before final function polish.
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-ink-2">
            Use these states to judge the UI like a real product: urgent bids, locked access, award decisions, missing documents and admin review.
          </p>
        </div>
        <div className="rounded-full border border-gold-border bg-gold-soft px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-gold-dark">
          Locale: {locale.toUpperCase()} - dummy data
        </div>
      </section>

      <section className="mb-6 grid gap-3 lg:grid-cols-7">
        {scenarios.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item.id)}
            className={`rounded-2xl border px-4 py-3 text-left transition duration-200 ${
              active === item.id
                ? "border-navy bg-navy text-white shadow-[0_14px_32px_rgba(12,26,62,.22)]"
                : "border-line bg-white text-ink hover:-translate-y-0.5 hover:border-[#cbd3df] hover:shadow-[0_10px_26px_rgba(12,26,62,.06)]"
            }`}
          >
            <span className={`text-[9.5px] font-bold uppercase tracking-[0.12em] ${active === item.id ? "text-gold-border" : "text-gold-dark"}`}>{item.tag}</span>
            <span className="mt-1 block text-[13px] font-bold leading-tight">{item.title}</span>
          </button>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="rounded-[24px] border border-line bg-white p-5 shadow-[0_12px_32px_rgba(12,26,62,.05)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">Selected case</p>
          <h2 className="mt-3 text-[22px] font-bold tracking-[-0.4px] text-ink">{activeCase.title}</h2>
          <p className="mt-2 text-[13px] leading-6 text-ink-2">{activeCase.description}</p>
          <div className="mt-5 space-y-2">
            {caseChecklist(active).map((item) => (
              <div key={item} className="flex items-start gap-2 rounded-xl bg-canvas px-3 py-2 text-[12px] leading-5 text-ink-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald" />
                {item}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-h-[640px] rounded-[28px] border border-line bg-white/78 p-5 shadow-[0_22px_70px_rgba(12,26,62,.09)]">
          {active === "today" ? <TodayCase /> : null}
          {active === "marketplace" ? <MarketplaceCase /> : null}
          {active === "bid" ? <BidCase /> : null}
          {active === "compare" ? <CompareCase /> : null}
          {active === "order" ? <OrderCase /> : null}
          {active === "admin" ? <AdminCase /> : null}
          {active === "edge" ? <EdgeCase /> : null}
        </div>
      </section>
    </main>
  )
}

function TodayCase() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        <MiniStat icon={Wallet} label="Bids this month" value="23" note="+4 vs last month" />
        <MiniStat icon={Award} label="Success rate" value="91%" note="+2pp sealed bids" />
        <MiniStat icon={PackageCheck} label="Volume" value="HKD 2.4M" note="June 2026" />
      </div>
      <HeroMission />
      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <QueueList />
        <ActivityList />
      </div>
    </div>
  )
}

function MarketplaceCase() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 border-b border-line pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-dark">Recommended vs open market</p>
          <h2 className="mt-2 text-[28px] font-bold tracking-[-0.7px] text-ink">Choose where your attention goes first.</h2>
        </div>
        <div className="inline-flex w-fit gap-1 rounded-xl border border-line bg-white p-1">
          <span className="rounded-lg bg-navy px-3 py-2 text-[12px] font-bold text-white">Recommended 2</span>
          <span className="rounded-lg px-3 py-2 text-[12px] font-bold text-ink-3">All open 8</span>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <MissionCard title="Ho Chi Minh City to Hong Kong" badge="Pushed to you" score="94%" urgent />
        <MissionCard title="Bangkok to Tokyo" badge="Recommended" score="78%" />
        <MissionCard title="Shanghai to Singapore" badge="Open market" score="82%" />
        <MissionCard title="Jakarta to Hong Kong" badge="Token required" score="0" locked />
      </div>
    </div>
  )
}

function BidCase() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <BidPanel title="Before input" amount="" state="disabled" />
      <BidPanel title="Ready to submit" amount="24,800" state="ready" />
      <BidPanel title="Submitted receipt" amount="24,800" state="submitted" />
    </div>
  )
}

function CompareCase() {
  return (
    <div className="space-y-5">
      <div className="rounded-[24px] bg-[linear-gradient(135deg,#10204a,#1b397d)] p-7 text-white shadow-[0_22px_48px_rgba(23,43,93,.18)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gold-border">Bid window closed</p>
        <h2 className="mt-3 max-w-3xl text-[32px] font-bold leading-tight tracking-[-0.8px]">
          Lowest quote is highlighted, but the agency can still choose the best partner.
        </h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <QuoteCard company="HarbourLink Cargo" price="HKD 12,800" badge="Best fit" />
        <QuoteCard company="Victoria Freight" price="HKD 12,150" badge="Lowest quote" lowest />
        <QuoteCard company="Gateway Logistics" price="HKD 13,420" badge="Fastest" />
      </div>
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[13px] leading-6 text-amber-900">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
        Non-lowest confirmation: the agency is choosing HKD 650 above the lowest quote because route fit, transit time or trust is stronger.
      </div>
    </div>
  )
}

function OrderCase() {
  const steps = ["Bid accepted", "Shipment booked", "In transit", "Arrived HK", "Customs cleared", "Delivered"]
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_390px]">
      <section className="rounded-[24px] border border-line bg-white p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold-dark">Order HL-10048</p>
        <h2 className="mt-2 text-[28px] font-bold tracking-[-0.6px] text-ink">Hong Kong to Manila</h2>
        <div className="mt-8 space-y-4">
          {steps.map((step, index) => (
            <div key={step} className="flex items-center gap-3">
              <span className={`grid h-7 w-7 place-items-center rounded-full border ${index <= 2 ? "border-emerald bg-emerald text-white" : "border-line bg-white text-line"}`}>
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <span className={index <= 2 ? "text-[14px] font-semibold text-ink" : "text-[14px] text-ink-3"}>{step}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <DocumentRow name="AWB / B-L" status="Uploaded" ok />
        <DocumentRow name="Commercial Invoice" status="Uploaded" ok />
        <DocumentRow name="Packing List" status="Missing - reminder in 24h" />
        <div className="rounded-2xl border border-line bg-white p-4">
          <p className="flex items-center gap-2 text-[13px] font-semibold text-ink"><MessageSquare className="h-4 w-4 text-gold" />Order message</p>
          <p className="mt-2 text-[12px] leading-5 text-ink-2">Truck booked for 09:30. Please upload final Packing List before customs cut-off.</p>
        </div>
      </section>
    </div>
  )
}

function AdminCase() {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <section className="rounded-[24px] border border-line bg-white p-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold-dark">Review queue</p>
        <h2 className="mt-2 text-[28px] font-bold tracking-[-0.6px] text-ink">Protect quality before publishing a bid window.</h2>
        <AdminRow title="Jakarta to Hong Kong" meta="SR review - customs documents needed" action="Review" />
        <AdminRow title="Bangkok to Hong Kong" meta="Forwarder verification - BR and IATA docs pending" action="Verify" />
        <AdminRow title="FPS proof #3921" meta="Payment confirmation - HKD 1,500" action="Confirm" />
      </section>
      <section className="grid gap-3">
        <MiniStat icon={UsersRound} label="Verified forwarders" value="26" note="4 pending" />
        <MiniStat icon={Clock} label="Average response" value="18m" note="Premium members" />
        <MiniStat icon={ShieldCheck} label="Bid integrity" value="99%" note="No leaked quotes" />
      </section>
    </div>
  )
}

function EdgeCase() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <EdgePanel title="Empty state" body="No recommended opportunities right now. LBID will notify you when a matching SR opens." icon={Search} />
      <EdgePanel title="Loading state" body="Skeleton rows keep the workspace stable while live Supabase data loads." icon={Clock} loading />
      <EdgePanel title="No token state" body="Bid button is locked, with a clear route to purchase tokens or wait for free token refresh." icon={Wallet} warning />
      <EdgePanel title="Permission state" body="Admin-only workflow explains why the account cannot view this queue." icon={Lock} warning />
    </div>
  )
}

function HeroMission() {
  return (
    <section className="relative overflow-hidden rounded-[24px] border border-line bg-white p-8 shadow-[0_14px_42px_rgba(12,26,62,.09)]">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-[linear-gradient(90deg,#0C1A3E_0%,#1E3A7A_55%,#C49A3C_100%)]" />
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold-dark"><span className="h-1.5 w-1.5 rounded-full bg-gold" />Recommended for you</span>
          <span className="rounded-full border border-gold-border bg-gold-soft px-3 py-1 text-[11px] font-bold text-gold-dark">94% profile match</span>
        </div>
        <span className="flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 font-mono text-[14px] font-bold text-ink shadow-sm"><Clock className="h-3.5 w-3.5 text-ink-3" />13:44 remaining</span>
      </div>
      <div className="grid items-center gap-7 lg:grid-cols-[1fr_auto_1fr]">
        <RouteBlock label="Origin" city="Ho Chi Minh City" port="SGN - Tan Son Nhat Intl." />
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-navy text-white shadow-[0_10px_26px_rgba(12,26,62,.28)]"><Plane className="h-5 w-5" /></span>
        <RouteBlock label="Destination" city="Hong Kong" port="HKG - Hong Kong Intl. Airport" right />
      </div>
    </section>
  )
}

function MiniStat({ icon: Icon, label, value, note }: { icon: typeof Wallet; label: string; value: string; note: string }) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-line bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[#cbd3df] hover:shadow-[0_10px_26px_rgba(12,26,62,.06)]">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-navy-soft text-navy"><Icon className="h-4 w-4" /></div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">{label}</p>
        <p className="mt-1 text-[22px] font-bold leading-none text-ink">{value}</p>
        <p className="mt-1 text-[11px] text-emerald">{note}</p>
      </div>
    </article>
  )
}

function MissionCard({ title, badge, score, urgent, locked }: { title: string; badge: string; score: string; urgent?: boolean; locked?: boolean }) {
  return (
    <article className={`rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(12,26,62,.08)] ${urgent ? "border-gold-border bg-gradient-to-br from-[#fffdf7] to-white" : "border-line"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="rounded-md border border-gold-border bg-gold-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-gold-dark">{badge}</span>
          <h3 className="mt-4 text-[20px] font-bold tracking-[-0.4px] text-navy">{title}</h3>
          <p className="mt-1 text-[13px] text-ink-3">500 kg - 3 CBM - Air - General cargo</p>
        </div>
        <strong className={score === "0" ? "text-ink-3" : "text-emerald"}>{score}{score !== "0" ? " match" : ""}</strong>
      </div>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <p className="flex items-center gap-2 text-[12px] text-ink-3">{locked ? <Lock className="h-4 w-4 text-gold" /> : <ShieldCheck className="h-4 w-4 text-gold" />}{locked ? "Need 1 Token to bid" : "Sealed and confidential"}</p>
        <button className={`rounded-xl px-3 py-2 text-[12px] font-semibold ${locked ? "bg-canvas text-ink-3" : "bg-navy text-white"}`}>{locked ? "Buy Token" : "Enter Bid"}</button>
      </div>
    </article>
  )
}

function BidPanel({ title, amount, state }: { title: string; amount: string; state: "disabled" | "ready" | "submitted" }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gold-dark">{title}</p>
      <h3 className="mt-2 text-[20px] font-bold text-ink">Your sealed quote</h3>
      {state === "submitted" ? (
        <div className="mt-6 rounded-xl border border-emerald/30 bg-emerald-soft p-5 text-center">
          <CheckCircle2 className="mx-auto h-9 w-9 text-emerald" />
          <p className="mt-3 text-[14px] font-semibold text-ink">Quote submitted</p>
          <p className="mt-1 text-[13px] text-ink-2">HKD {amount}</p>
        </div>
      ) : (
        <>
          <div className="relative mt-5 rounded-xl border-2 border-line bg-white">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink-3">HKD</span>
            <div className="py-4 pl-[52px] pr-4 text-[22px] font-semibold text-ink">{amount || <span className="text-line">0.00</span>}</div>
          </div>
          <button disabled={state === "disabled"} className="mt-3 w-full rounded-xl bg-navy py-3.5 text-[13px] font-semibold text-white disabled:bg-[#a7adbd]">
            Submit sealed quote
          </button>
        </>
      )}
    </section>
  )
}

function QuoteCard({ company, price, badge, lowest }: { company: string; price: string; badge: string; lowest?: boolean }) {
  return (
    <article className={`rounded-2xl border bg-white p-5 ${lowest ? "border-emerald shadow-[0_15px_32px_rgba(55,157,129,.13)]" : "border-line"}`}>
      <span className={`rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${lowest ? "border-emerald/30 bg-emerald-soft text-emerald" : "border-gold-border bg-gold-soft text-gold-dark"}`}>{badge}</span>
      <h3 className="mt-4 text-[18px] font-bold text-navy">{company}</h3>
      <strong className="mt-5 block text-[26px] tracking-[-0.5px] text-navy">{price}</strong>
      <p className="mt-2 text-[13px] leading-5 text-ink-2">3-5 days - customs and local delivery included</p>
      <button className="mt-5 w-full rounded-xl border border-line bg-white py-2.5 text-[13px] font-semibold text-navy hover:bg-navy-soft">Choose quote</button>
    </article>
  )
}

function DocumentRow({ name, status, ok }: { name: string; status: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-white p-4">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${ok ? "bg-emerald-soft text-emerald" : "bg-amber-50 text-amber-700"}`}>{ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}</span>
      <span className="min-w-0 flex-1">
        <b className="block text-[13px] text-ink">{name}</b>
        <small className="text-[11px] text-ink-3">{status}</small>
      </span>
      <ChevronRight className="h-4 w-4 text-line" />
    </div>
  )
}

function AdminRow({ title, meta, action }: { title: string; meta: string; action: string }) {
  return (
    <div className="mt-4 grid items-center gap-3 rounded-2xl border border-line p-4 md:grid-cols-[1fr_1fr_auto]">
      <span className="text-[14px] font-bold text-navy">{title}</span>
      <small className="text-[12px] text-ink-3">{meta}</small>
      <button className="rounded-lg bg-navy px-3 py-2 text-[12px] font-semibold text-white">{action}</button>
    </div>
  )
}

function EdgePanel({ title, body, icon: Icon, loading, warning }: { title: string; body: string; icon: typeof Search; loading?: boolean; warning?: boolean }) {
  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${warning ? "bg-amber-50 text-amber-700" : "bg-navy-soft text-navy"}`}>
        {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy border-t-transparent" /> : <Icon className="h-5 w-5" />}
      </span>
      <h3 className="mt-5 text-[18px] font-bold text-ink">{title}</h3>
      <p className="mt-2 text-[13px] leading-6 text-ink-2">{body}</p>
    </section>
  )
}

function QueueList() {
  return (
    <div className="space-y-2">
      <h2 className="mb-4 text-[13px] font-bold text-ink">Other opportunities</h2>
      {["Shanghai to Singapore", "Bangkok to Tokyo", "Shenzhen to London"].map((route, index) => (
        <div key={route} className="flex items-center gap-3 rounded-2xl border border-line bg-white px-5 py-4">
          {index === 1 ? <Plane className="h-4 w-4 text-ink-2" /> : <Ship className="h-4 w-4 text-ink-2" />}
          <span className="flex-1 text-[13px] font-semibold text-ink">{route}</span>
          <span className="text-[12px] font-bold text-emerald">{82 - index * 4}% match</span>
          <ChevronRight className="h-4 w-4 text-line" />
        </div>
      ))}
    </div>
  )
}

function ActivityList() {
  return (
    <div>
      <h2 className="mb-4 text-[13px] font-bold text-ink">Activity</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        {["Quote accepted", "Route certification added", "Profile verified", "Quote submitted"].map((item) => (
          <div key={item} className="border-b border-line px-4 py-3 last:border-b-0">
            <p className="text-[13px] font-semibold text-ink">{item}</p>
            <p className="mt-1 text-[11px] text-ink-3">Demo timeline event</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RouteBlock({ label, city, port, right }: { label: string; city: string; port: string; right?: boolean }) {
  return (
    <div className={right ? "text-left lg:text-right" : ""}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">{label}</p>
      <h3 className="mt-2 text-[26px] font-bold leading-[1.1] tracking-[-0.6px] text-ink">{city}</h3>
      <p className="mt-1 text-[13px] text-ink-2">{port}</p>
    </div>
  )
}

function caseChecklist(id: ScenarioId) {
  const shared = ["Clear primary action", "Realistic dummy data", "Hover-ready card styling"]
  const specific: Record<ScenarioId, string[]> = {
    today: ["Urgent recommended bid is obvious", "Activity timeline explains recent platform movement"],
    marketplace: ["Recommended and normal bids are visually separated", "Locked/token state is visible"],
    bid: ["Disabled, ready and submitted quote states are all visible", "Sealed-bid confidentiality is explicit"],
    compare: ["Lowest quote is highlighted", "Non-lowest choice has confirmation copy"],
    order: ["Pipeline and missing document states are visible", "Messages and responsibility record are connected"],
    admin: ["Review queue has required action", "Payments and verification are visible"],
    edge: ["Empty, loading, token and permission states are covered", "No dead-end screen"],
  }
  return [...specific[id], ...shared]
}
