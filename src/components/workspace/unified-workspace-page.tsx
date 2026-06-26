"use client"

import Link from "next/link"
import { createElement, useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  ArrowRight,
  Award,
  BadgeCheck,
  Bell,
  BookOpen,
  Box,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Coins,
  CreditCard,
  FileCheck2,
  FileText,
  Globe2,
  LockKeyhole,
  Map,
  MessageSquare,
  Plane,
  Plus,
  Route,
  Search,
  Settings,
  ShieldCheck,
  Ship,
  Sparkles,
  Star,
  TrendingUp,
  Truck,
  Users,
  WalletCards,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"

export type UnifiedPageKind =
  | "dashboard"
  | "marketplace"
  | "active-bids"
  | "my-routes"
  | "analytics"
  | "requests"
  | "create-request"
  | "request-detail"
  | "quote-console"
  | "quote-compare"
  | "orders"
  | "order-detail"
  | "documents"
  | "messages"
  | "tracking"
  | "awb"
  | "review"
  | "notifications"
  | "community"
  | "forwarders"
  | "forwarder-profile"
  | "profile"
  | "subscription"
  | "tokens"
  | "services"
  | "workflow"
  | "admin"
  | "admin-requests"
  | "admin-accounts"
  | "admin-payments"
  | "admin-audit"
  | "preview"

type PageConfig = {
  eyebrow: string
  title: string
  intro: string
  primary: string
  secondary?: string
  icon: typeof Plane
  stats: Array<{ label: string; value: string; delta: string; icon: typeof Plane }>
  focus: { label: string; title: string; meta: string; score: string; cta: string; urgent?: boolean }
  rows: Array<{ title: string; meta: string; tag: string; href?: string; icon: typeof Plane }>
  activity: Array<{ title: string; meta: string; icon: typeof Plane; tone?: "gold" | "green" | "blue" }>
}

const sharedStats = [
  { label: "Open work", value: "12", delta: "+3 this week", icon: Briefcase },
  { label: "Match rate", value: "91%", delta: "+2pp vs last month", icon: TrendingUp },
  { label: "Volume", value: "HKD 2.4M", delta: "June 2026", icon: Award },
]

const configs: Record<UnifiedPageKind, PageConfig> = {
  dashboard: page("Today", "Good morning, Kenny.", "1 high-priority opportunity needs your attention today.", "Create request", "View marketplace", Activity),
  marketplace: page("Opportunities", "Recommended and open bids in one clean queue.", "Priority matches are pushed first, then open-market requests sorted by deadline and fit.", "Place sealed bid", "Filter routes", Plane),
  "active-bids": page("Sealed Quotes", "Your submitted bids stay sealed until close.", "Track token use, bid status and deadline risk without seeing competitor prices.", "View receipt", "Open marketplace", LockKeyhole),
  "my-routes": page("Route Coverage", "Your service lanes drive recommendations.", "Keep routes, capacity and certifications clear so LBID can push the right work to you.", "Add route", "Edit profile", Route),
  analytics: page("Analytics", "Understand where LBID is creating value.", "Monitor response speed, win rate, token ROI and lane performance.", "Export report", "View routes", TrendingUp),
  requests: page("My Requests", "Every client request has a clear next step.", "See which SR is waiting for review, live bidding, comparison or award confirmation.", "Create request", "Compare bids", FileText),
  "create-request": page("Create SR", "Build a shipment request step by step.", "Guided fields reduce missing details before Admin review and the 3-hour sealed bid window.", "Submit for review", "Save draft", Plus),
  "request-detail": page("Request Detail", "Review the request before the bidding window closes.", "Cargo, route, service needs, refusal allowance and audit history stay together.", "Open comparison", "Cancel request", Box),
  "quote-console": page("Bid Console", "Submit one sealed quote with confidence.", "LBID shows match reasons, expected range and token impact before you commit.", "Submit sealed quote", "Back to marketplace", Zap),
  "quote-compare": page("Bid Comparison", "Lowest price is highlighted, but Agency can choose fit.", "Compare total price, transit time, reliability and compliance before awarding.", "Accept recommended bid", "Review all bids", Award),
  orders: page("Orders", "Awarded work becomes an operational workspace.", "Every order moves through confirmed, booked, transit, customs and delivery milestones.", "Open order", "Upload documents", Truck),
  "order-detail": page("Order Workspace", "Move this shipment from confirmation to delivery.", "Documents, messages, tracking and responsibility records stay in one place.", "Update status", "Message partner", Truck),
  documents: page("Documents", "Know exactly what is missing before ship date.", "AWB, B/L, invoice and packing list statuses trigger reminders and approvals.", "Upload document", "Send reminder", FileCheck2),
  messages: page("Messages", "Keep order communication inside LBID.", "Each order has a focused thread with system events and partner messages.", "Send message", "Attach document", MessageSquare),
  tracking: page("Tracking", "Track shipment status without breaking context.", "Status updates notify both sides and feed the order audit trail.", "Mark next status", "View documents", Map),
  awb: page("Smart AWB", "Generate a standardized AWB draft.", "Volume weight, shipper details and cargo notes are structured before PDF generation.", "Generate PDF", "Save draft", FileText),
  review: page("Review", "Close the loop after completion.", "Agency review improves reputation, points and future matching quality.", "Leave review", "View order", Star),
  notifications: page("Notifications", "All important platform events in one centre.", "Review bid close, award, document, payment and admin updates without email chasing.", "Mark all read", "Notification rules", Bell),
  community: page("Community", "A trust layer for logistics operators.", "Share verified routes, member wins, events and platform updates in a clean professional space.", "Create post", "Browse events", Users),
  forwarders: page("Directory", "Find Hong Kong forwarders by capability.", "Search by routes, badges, service type, rating and completed LBID orders.", "View profile", "Boost listing", Globe2),
  "forwarder-profile": page("Forwarder Profile", "Capability should be visible before price.", "Badges, routes, ratings and verified documents explain why a non-lowest bid may win.", "Invite to SR", "Send message", BadgeCheck),
  profile: page("Company Profile", "One company can be Client, Forwarder, or both.", "Manage public profile, service coverage, account status and workflow capabilities.", "Save profile", "Preview directory", Settings),
  subscription: page("Membership", "Upgrade moments should feel rewarding.", "Membership unlocks visibility, token bundles, profile priority and partner benefits.", "Upgrade plan", "Manage billing", CreditCard),
  tokens: page("Token Wallet", "Tokens power sealed bids and boosts.", "Show free, paid and spent token history with a clear ledger and redemption path.", "Buy tokens", "Redeem points", WalletCards),
  services: page("Growth Services", "Operational tools after the marketplace.", "LBID can package website, app, CRM and workflow services for logistics companies.", "Request quote", "View packages", Sparkles),
  workflow: page("Workflow", "The full LBID transaction flow in one map.", "SR review, sealed bidding, award, order, documents, messages and review are connected.", "Start workflow", "View demo cases", BookOpen),
  admin: page("Admin", "Protect marketplace quality from one cockpit.", "Review SRs, verify forwarders, audit payments and watch platform health.", "Review queue", "Open analytics", ShieldCheck),
  "admin-requests": page("Admin Requests", "Review shipment requests before publication.", "Reject with reasons, approve clean requests and open the 3-hour bid window.", "Approve SR", "Reject with reason", FileText),
  "admin-accounts": page("Admin Accounts", "Manage companies, capability and membership.", "Set tiers, review account capability and keep payment status aligned.", "Update membership", "Open audit log", Users),
  "admin-payments": page("Admin Payments", "Confirm manual payments with traceability.", "Search, filter and approve FPS or bank transfer proofs before access changes.", "Confirm payment", "Request more info", Coins),
  "admin-audit": page("Audit Log", "Every sensitive action should leave a record.", "Admin, payment, membership, award and order-status updates are captured for review.", "Filter log", "Export CSV", ShieldCheck),
  preview: page("Product Preview", "A complete LBID launch story.", "Use this high-fidelity demo to discuss flows before connecting every production detail.", "Open demo cases", "Start onboarding", Sparkles),
}

function page(eyebrow: string, title: string, intro: string, primary: string, secondary: string, icon: typeof Plane): PageConfig {
  return {
    eyebrow,
    title,
    intro,
    primary,
    secondary,
    icon,
    stats: sharedStats,
    focus: {
      label: "Recommended for you",
      title: "Ho Chi Minh City to Hong Kong",
      meta: "Air freight · 500 kg · 3 CBM · pickup 26 Jun · bid closes in 13:44",
      score: "94%",
      cta: primary,
      urgent: eyebrow === "Opportunities" || eyebrow === "Bid Console",
    },
    rows: [
      { title: "Shanghai to Singapore", meta: "2,100 kg · 14 CBM · sea freight", tag: "82% match", href: "/marketplace/SR-DEMO-002", icon: Ship },
      { title: "Bangkok to Tokyo", meta: "320 kg · 2.1 CBM · cold chain air", tag: "78% match", href: "/marketplace/SR-DEMO-003", icon: Plane },
      { title: "Shenzhen to London", meta: "8,500 kg · 42 CBM · machinery", tag: "71% match", href: "/marketplace/SR-DEMO-004", icon: Ship },
    ],
    activity: [
      { title: "Quote accepted", meta: "Guangzhou to Sydney · HKD 24,800", icon: CheckCircle2, tone: "green" },
      { title: "Profile verified", meta: "IATA credential confirmed", icon: BadgeCheck, tone: "gold" },
      { title: "Document reminder", meta: "Packing List missing · due in 24h", icon: Bell, tone: "blue" },
    ],
  }
}

export function UnifiedWorkspacePage({
  locale,
  kind,
  id,
}: {
  locale: Locale
  kind: UnifiedPageKind
  id?: string
}) {
  if (kind === "dashboard") return <TodayWorkspace locale={locale} />
  if (kind === "marketplace") return <OpportunitiesWorkspace locale={locale} />
  if (kind === "quote-console" || kind === "active-bids") return <BidConsoleWorkspace locale={locale} kind={kind} id={id} />
  if (kind === "requests" || kind === "create-request" || kind === "request-detail") return <RequestWorkspace locale={locale} kind={kind} id={id} />
  if (kind === "quote-compare") return <ComparisonWorkspace id={id} />
  if (kind === "orders" || kind === "order-detail" || kind === "documents" || kind === "messages" || kind === "tracking" || kind === "awb" || kind === "review") return <OrderWorkspace kind={kind} id={id} />
  if (kind.startsWith("admin")) return <AdminWorkspace kind={kind} />
  if (kind === "profile" || kind === "tokens" || kind === "subscription" || kind === "forwarders" || kind === "forwarder-profile") return <AccountWorkspace kind={kind} id={id} />
  if (kind === "community" || kind === "notifications") return <CommunityWorkspace kind={kind} />
  if (kind === "workflow" || kind === "preview" || kind === "services" || kind === "analytics" || kind === "my-routes") return <StrategyWorkspace kind={kind} />

  const config = configs[kind]
  const prefix = `/${locale}`
  const Icon = config.icon
  const focusTitle = id ? `${config.focus.title} · ${id}` : config.focus.title

  return (
    <main className="mx-auto w-full max-w-[1320px] px-5 pb-16 pt-8 sm:px-8 lg:px-9">
      <section className="flex flex-col gap-5 border-b border-line pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gold" className="rounded-full border-gold-border bg-gold-soft text-[10px] uppercase tracking-[0.1em] text-gold-dark">
              {config.eyebrow}
            </Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-[11px] font-medium text-ink-3">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald" />
              Demo cases visible
            </span>
          </div>
          <h1 className="mt-4 max-w-4xl text-[32px] font-bold leading-[1.08] tracking-[-0.9px] text-ink sm:text-[44px]">
            {config.title}
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-ink-2">
            {config.intro}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild className="h-10 rounded-lg bg-navy px-4 shadow-[0_6px_18px_rgba(12,26,62,.16)] hover:bg-[#172b5d]">
            <Link href={primaryHref(prefix, kind)}>
              <Icon className="h-4 w-4" />
              {config.primary}
            </Link>
          </Button>
          {config.secondary ? (
            <Button asChild variant="outline" className="h-10 rounded-lg border-line bg-white px-4 hover:border-navy/25 hover:bg-navy-soft">
              <Link href={`${prefix}/demo-cases`}>{config.secondary}</Link>
            </Button>
          ) : null}
        </div>
      </section>

      <section className="mt-6 grid gap-3 lg:grid-cols-3">
        {config.stats.map((stat) => (
          <MetricCard key={stat.label} {...stat} />
        ))}
      </section>

      <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <HeroCard config={config} title={focusTitle} />
          <ScenarioPanel kind={kind} prefix={prefix} id={id} />
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-bold text-ink">Other demo states</h2>
              <Link href={`${prefix}/demo-cases`} className="inline-flex items-center gap-1 text-[12px] font-semibold text-navy hover:underline">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-3">
              {config.rows.map((row) => (
                <DemoRow key={row.title} row={row} prefix={prefix} />
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <ActivityCard items={config.activity} />
          <CaseChecklist kind={kind} />
        </aside>
      </section>
    </main>
  )
}

function PageFrame({
  eyebrow,
  title,
  intro,
  actions,
  children,
  aside,
}: {
  eyebrow: string
  title: string
  intro: string
  actions?: ReactNode
  children: ReactNode
  aside?: ReactNode
}) {
  return (
    <main className="mx-auto w-full max-w-[1640px] px-4 pb-16 pt-7 sm:px-8 lg:px-10">
      <section className="flex flex-col gap-5 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Badge variant="gold" className="rounded-full border-gold-border bg-gold-soft px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-gold-dark">
            {eyebrow}
          </Badge>
          <h1 className="mt-4 max-w-4xl text-[34px] font-bold leading-[1.02] tracking-[-1.2px] text-ink sm:text-[46px]">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-6 text-ink-2">{intro}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </section>
      <section className={aside ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]" : "space-y-5"}>
        <div className="space-y-5">{children}</div>
        {aside ? <aside className="space-y-5">{aside}</aside> : null}
      </section>
    </main>
  )
}

function TodayWorkspace({ locale }: { locale: Locale }) {
  const prefix = `/${locale}`
  return (
    <PageFrame
      eyebrow="Today"
      title="Good morning, Kenny."
      intro="1 high-priority opportunity needs your attention today. Recommended work appears first, then normal open-market bids."
      actions={
        <>
          <Button asChild className="rounded-xl bg-navy px-5 hover:bg-[#172b5d]">
            <Link href={`${prefix}/marketplace/SR-DEMO-001`}>Open quote console</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href={`${prefix}/inquiries/new`}>Create SR</Link>
          </Button>
        </>
      }
      aside={<ActivityStream />}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Bids this month" value="23" delta="+4 vs last month" icon={Activity} />
        <MetricCard label="Success rate" value="91%" delta="+2pp vs last month" icon={TrendingUp} />
        <MetricCard label="Total volume" value="HKD 2.4M" delta="June 2026" icon={Award} />
      </section>
      <FeaturedOpportunity prefix={prefix} dramatic />
      <section className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <OtherOpportunities prefix={prefix} />
        <DecisionPanel />
      </section>
    </PageFrame>
  )
}

function OpportunitiesWorkspace({ locale }: { locale: Locale }) {
  const prefix = `/${locale}`
  return (
    <PageFrame
      eyebrow="Marketplace"
      title="Recommended bids first. Open bids next."
      intro="LBID separates system-matched opportunities from normal marketplace work so forwarders know exactly where to focus."
      actions={
        <>
          <Button className="rounded-xl bg-navy px-5 hover:bg-[#172b5d]">Recommended</Button>
          <Button variant="outline" className="rounded-xl">All open SR</Button>
        </>
      }
      aside={<FilterStack />}
    >
      <FeaturedOpportunity prefix={prefix} dramatic />
      <section className="grid gap-3">
        {[
          ["Shanghai", "Singapore", "Sea", "82% match", "4h 20m", "Normal bid"],
          ["Bangkok", "Tokyo", "Air", "78% match", "2 days", "Cold-chain fit"],
          ["Shenzhen", "London", "Sea", "71% match", "5 days", "Heavy cargo"],
        ].map(([from, to, mode, score, time, label]) => (
          <OpportunityRow key={`${from}-${to}`} prefix={prefix} from={from} to={to} mode={mode} score={score} time={time} label={label} />
        ))}
      </section>
    </PageFrame>
  )
}

function BidConsoleWorkspace({ locale, kind, id }: { locale: Locale; kind: UnifiedPageKind; id?: string }) {
  const prefix = `/${locale}`
  return (
    <PageFrame
      eyebrow={kind === "active-bids" ? "Active sealed bids" : "Quote console"}
      title="One shot. Sealed. Token protected."
      intro="The console makes urgency visible without revealing competitor data. The forwarder sees match logic, deadline pressure and token impact before submitting."
      actions={
        <Button asChild variant="outline" className="rounded-xl">
          <Link href={`${prefix}/marketplace`}>Back to marketplace</Link>
        </Button>
      }
      aside={<BidReceipt id={id} />}
    >
      <section className="relative overflow-hidden rounded-[30px] border border-[#e2c96f] bg-[radial-gradient(circle_at_15%_10%,rgba(201,168,76,.28),transparent_28%),radial-gradient(circle_at_85%_8%,rgba(82,138,255,.18),transparent_25%),linear-gradient(135deg,#050b1f,#101b3b_48%,#182b63)] p-6 text-white shadow-[0_30px_90px_rgba(7,18,50,.36)]">
        <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.28) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.28) 1px, transparent 1px)", backgroundSize: "38px 38px" }} />
        <div aria-hidden className="absolute -right-10 top-8 text-[120px] font-black italic leading-none tracking-[-0.09em] text-white/[0.045] sm:text-[180px]">SEALED</div>
        <div className="relative z-[1] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/12 text-white">Recommended - 94% profile match</Badge>
            <span className="inline-flex items-center gap-2 rounded-full border border-red-300/45 bg-red-500/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-red-100">
              <span className="h-1.5 w-1.5 rounded-full bg-red-300 shadow-[0_0_0_5px_rgba(248,113,113,.18)]" />
              Final 2 bid slots
            </span>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-right shadow-[inset_0_1px_0_rgba(255,255,255,.08)] backdrop-blur">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/55">closes in</p>
            <p className="font-mono text-[20px] font-black tracking-[0.12em] text-white">00:13:44</p>
          </div>
        </div>
        <div className="relative z-[1] mt-12 grid gap-8 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <RouteEndpoint label="Origin" city="Ho Chi Minh City" sub="SGN - Tan Son Nhat Intl." inverted />
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[#e2c96f]/60 bg-white text-navy shadow-[0_0_0_10px_rgba(226,201,111,.08),0_18px_42px_rgba(0,0,0,.28)]">
            <Plane className="h-7 w-7" />
          </div>
          <RouteEndpoint label="Destination" city="Hong Kong" sub="HKG - Hong Kong Intl. Airport" alignRight inverted />
        </div>
        <div className="relative z-[1] mt-8 grid gap-3 border-y border-white/15 py-5 md:grid-cols-6">
          {["500 kg", "3 CBM", "Air", "General", "26 Jun", "27 Jun"].map((item, index) => (
            <div key={item} className="md:border-l md:border-white/15 md:pl-4 first:border-l-0 first:pl-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">{["Weight", "Volume", "Freight", "Cargo", "Pickup", "Delivery"][index]}</p>
              <p className="mt-1 text-[15px] font-semibold">{item}</p>
            </div>
          ))}
        </div>
        <div className="relative z-[1] mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-gold">Why you were selected</p>
            {["Air cargo capacity above 400 kg verified", "SGN to HKG active route on record", "4.9 star rating on HKG deliveries", "IATA cargo agent certified"].map((item) => (
              <p key={item} className="mt-2 flex items-center gap-2 text-[13px] text-white/82"><CheckCircle2 className="h-4 w-4 text-emerald" />{item}</p>
            ))}
            <div className="mt-5 flex flex-wrap gap-2">
              {["1 token locked", "sealed until close", "one quote only"].map((item) => (
                <span key={item} className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/72">{item}</span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-white/55">Your sealed quote</p>
            <div className="mt-3 rounded-xl border border-white/20 bg-white px-4 py-4 text-ink">
              <span className="text-[12px] font-bold text-ink-3">HKD</span>
              <span className="ml-3 text-[28px] font-bold tracking-[-0.4px] text-ink/25">0.00</span>
            </div>
            <Button className="mt-3 h-12 w-full rounded-xl bg-gold text-navy hover:bg-[#d9bc65]">Submit sealed quote</Button>
            <p className="mt-3 text-center text-[11px] leading-4 text-white/55">Return to submit. Quote becomes binding after Agency accepts.</p>
          </div>
        </div>
      </section>
      <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_rgba(12,26,62,.05)]">
        <p className="text-[13px] leading-6 text-ink-2">
          Your quote is <strong className="text-ink">sealed and confidential</strong>. The shipper sees only that qualified forwarders have responded until the bidding window closes.
        </p>
      </section>
      <LiveBidSubmitPanel srId={id || "SR-DEMO-001"} />
    </PageFrame>
  )
}

function RequestWorkspace({ locale, kind, id }: { locale: Locale; kind: UnifiedPageKind; id?: string }) {
  const prefix = `/${locale}`
  const isCreate = kind === "create-request"
  const isDetail = kind === "request-detail"
  return (
    <PageFrame
      eyebrow={isCreate ? "Create SR" : isDetail ? "Request detail" : "Requests"}
      title={isCreate ? "Build a shipment request step by step." : isDetail ? "One request, one live control room." : "Every request has one clear next step."}
      intro={isCreate ? "Most answers are guided. Users always see what stage they are in, what Admin will review, and when the 3-hour sealed window starts." : isDetail ? "Route, cargo, bid window, refusal allowance and audit history stay together so Agency knows exactly what happens next." : "SR review, bidding, comparison and award are shown as a live work queue with owner, deadline and next action."}
      actions={
        <Button asChild className="rounded-xl bg-navy px-5 hover:bg-[#172b5d]">
          <Link href={isCreate ? `${prefix}/requests` : `${prefix}/inquiries/new`}>{isCreate ? "Save draft" : "Create SR"}</Link>
        </Button>
      }
      aside={<RequestTimeline id={id} />}
    >
      {isCreate ? <LiveCreateRequestPanel prefix={prefix} /> : isDetail ? <RequestDetailPanel id={id} /> : <RequestQueue prefix={prefix} />}
    </PageFrame>
  )
}

function ComparisonWorkspace({ id }: { id?: string }) {
  return (
    <PageFrame
      eyebrow="Quote comparison"
      title="Lowest quote is highlighted. Agency still chooses fit."
      intro="This page explains why the winner may not be the lowest price, while preserving sealed-bid fairness and an explicit non-lowest confirmation."
      actions={<Button className="rounded-xl bg-navy px-5 hover:bg-[#172b5d]">Accept recommended bid</Button>}
      aside={<DecisionPanel />}
    >
      <LiveComparisonPanel srId={id || ""} />
      <section className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="rounded-[24px] border border-amber-200 bg-[linear-gradient(135deg,#fff8e6,#fff)] p-6 shadow-[0_16px_44px_rgba(181,138,35,.08)]">
          <Badge variant="gold">Non-lowest confirmation</Badge>
          <h2 className="mt-4 text-[22px] font-bold tracking-[-0.4px] text-ink">Agency can choose fit, but must explain it.</h2>
          <p className="mt-2 text-[13px] leading-6 text-amber-900">
            Choosing Pacific Forward is HKD 2,400 above the lowest quote for {id || "SR-DEMO-001"}. The modal should make the tradeoff clear, then write the reason to the audit log.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {["Reliability", "Transit time", "Compliance fit"].map((item) => (
              <div key={item} className="rounded-xl border border-amber-200 bg-white px-3 py-3 text-[12px] font-bold text-amber-900">{item}</div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-line bg-white p-6 shadow-[0_16px_44px_rgba(12,26,62,.06)]">
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-3">After award</p>
          {["Contact unlock", "Order created", "Responsibility record", "3 refusal counter updated"].map((item, index) => (
            <div key={item} className="mt-4 flex gap-3">
              <span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${index < 2 ? "bg-navy text-white" : "bg-canvas text-ink-3"}`}>{index + 1}</span>
              <span className="text-[13px] font-semibold text-ink">{item}</span>
            </div>
          ))}
        </div>
      </section>
    </PageFrame>
  )
}

function OrderWorkspace({ kind, id }: { kind: UnifiedPageKind; id?: string }) {
  return (
    <PageFrame
      eyebrow="Order workspace"
      title="From award to completion in one operational cockpit."
      intro="Status, documents, messages, AWB, review and responsibility records belong together after a bid is accepted."
      actions={<Button className="rounded-xl bg-navy px-5 hover:bg-[#172b5d]">Update next status</Button>}
      aside={<DocumentChecklist />}
    >
      <OrderPipeline active={kind} id={id} />
      <section className="grid gap-4 lg:grid-cols-2">
        <MessagePreview />
        <ResponsibilityRecord />
      </section>
    </PageFrame>
  )
}

function AdminWorkspace({ kind }: { kind: UnifiedPageKind }) {
  return (
    <PageFrame
      eyebrow="Admin"
      title="Quality control before the marketplace goes live."
      intro="Admin reviews SRs, verifies forwarders, confirms payments, updates membership and keeps audit logs."
      actions={<Button className="rounded-xl bg-navy px-5 hover:bg-[#172b5d]">Open review queue</Button>}
      aside={<AdminAudit kind={kind} />}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Pending SR" value="8" delta="3 urgent" icon={FileText} />
        <MetricCard label="Verification" value="5" delta="2 with docs" icon={BadgeCheck} />
        <MetricCard label="Payments" value="12" delta="HKD 18,500" icon={Coins} />
      </section>
      <AdminReviewQueue kind={kind} />
    </PageFrame>
  )
}

function AccountWorkspace({ kind, id }: { kind: UnifiedPageKind; id?: string }) {
  const isDirectory = kind === "forwarders" || kind === "forwarder-profile"
  const isTokens = kind === "tokens"
  const isSubscription = kind === "subscription"
  return (
    <PageFrame
      eyebrow={isDirectory ? "Directory" : isTokens ? "Token wallet" : isSubscription ? "Membership" : "Company profile"}
      title={isDirectory ? "Capability should be visible before price." : isTokens ? "Every token movement needs a clean ledger." : isSubscription ? "Upgrade should feel rewarding." : "One company can act as Client, Forwarder, or both."}
      intro="Account pages explain company capability, membership value, token balance and profile trust without forcing a fixed Agency or Forwarder role."
      actions={<Button className="rounded-xl bg-navy px-5 hover:bg-[#172b5d]">{isDirectory ? "Invite to SR" : "Save changes"}</Button>}
      aside={<MembershipCard />}
    >
      {isDirectory ? <DirectoryGrid id={id} /> : isTokens ? <TokenLedger /> : isSubscription ? <PlanGrid /> : <ProfileEditor />}
    </PageFrame>
  )
}

function CommunityWorkspace({ kind }: { kind: UnifiedPageKind }) {
  return (
    <PageFrame
      eyebrow={kind === "notifications" ? "Notifications" : "Community"}
      title={kind === "notifications" ? "Important events without email chasing." : "A trust layer for logistics operators."}
      intro="Community and notification pages should feel calm but alive: platform news, route wins, event tickets, bid close reminders and payment results."
      actions={<Button className="rounded-xl bg-navy px-5 hover:bg-[#172b5d]">{kind === "notifications" ? "Mark all read" : "Create post"}</Button>}
      aside={<ActivityStream />}
    >
      <section className="grid gap-4 lg:grid-cols-3">
        {["Route win", "Member spotlight", "LBID event"].map((title, index) => (
          <Card key={title} className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
            <CardContent className="p-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-navy-soft text-navy">
                {createElement([Route, Star, Users][index], { className: "h-5 w-5" })}
              </span>
              <h3 className="mt-5 text-[17px] font-bold text-ink">{title}</h3>
              <p className="mt-2 text-[13px] leading-6 text-ink-2">A polished content state with real platform context, moderation and member trust signals.</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <NotificationRows />
    </PageFrame>
  )
}

function StrategyWorkspace({ kind }: { kind: UnifiedPageKind }) {
  return (
    <PageFrame
      eyebrow={kind}
      title="The LBID operating system, mapped clearly."
      intro="Workflow, analytics, routes and growth services should help users understand what to do next instead of reading a static product brochure."
      actions={<Button className="rounded-xl bg-navy px-5 hover:bg-[#172b5d]">Start next step</Button>}
      aside={<DecisionPanel />}
    >
      <section className="grid gap-4 lg:grid-cols-4">
        {["Review", "Bidding", "Award", "Order"].map((step, index) => (
          <Card key={step} className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
            <CardContent className="p-5">
              <span className="text-[12px] font-bold text-gold-dark">0{index + 1}</span>
              <h3 className="mt-3 text-[18px] font-bold text-ink">{step}</h3>
              <p className="mt-2 text-[13px] leading-6 text-ink-2">Clear state, owner, action and audit record for this stage.</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="rounded-[24px] border border-line bg-white p-6 shadow-[0_14px_38px_rgba(12,26,62,.06)]">
        <h2 className="text-[22px] font-bold text-ink">Next best action</h2>
        <p className="mt-2 text-[14px] leading-6 text-ink-2">Show what the user can do now, what LBID is doing automatically, and what is blocked by missing data.</p>
      </section>
    </PageFrame>
  )
}

function FeaturedOpportunity({ prefix, dramatic = false }: { prefix: string; dramatic?: boolean }) {
  return (
    <section className={`relative overflow-hidden rounded-[28px] border bg-white p-6 shadow-[0_22px_60px_rgba(12,26,62,.09)] transition hover:-translate-y-0.5 hover:shadow-[0_30px_80px_rgba(12,26,62,.12)] ${dramatic ? "border-gold-border" : "border-line"}`}>
      {dramatic ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gold via-navy to-[#4a73c9]" />
          <div aria-hidden className="pointer-events-none absolute -right-8 top-6 text-[84px] font-black italic leading-none tracking-[-0.08em] text-navy/[0.035] sm:text-[132px]">MATCH</div>
        </>
      ) : null}
      <div className="relative z-[1] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.13em] text-gold-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_0_5px_rgba(201,168,76,.14)]" />
            Recommended for you
          </span>
          <Badge variant="gold" className="rounded-full">94% profile match</Badge>
          <Badge className="rounded-full border-red-200 bg-red-50 text-red-600">Final 2 slots</Badge>
        </div>
        <span className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-right shadow-sm">
          <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-red-500">closes in</span>
          <span className="font-mono text-[17px] font-black tracking-[0.08em] text-red-700">00:13:44</span>
        </span>
      </div>
      <div className="relative z-[1] mt-10 grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <RouteEndpoint label="Origin" city="Ho Chi Minh City" sub="SGN - Tan Son Nhat Intl." />
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-gold-border bg-navy text-white shadow-[0_0_0_10px_rgba(27,43,94,.05),0_14px_32px_rgba(12,26,62,.24)]">
          <Plane className="h-6 w-6" />
        </div>
        <RouteEndpoint label="Destination" city="Hong Kong" sub="HKG - Hong Kong Intl. Airport" alignRight />
      </div>
      <div className="relative z-[1] mt-8 grid gap-3 border-y border-line py-5 md:grid-cols-6">
        {["500 kg", "3 CBM", "Air", "General", "26 Jun", "27 Jun"].map((item, index) => (
          <div key={item} className="md:border-l md:border-line md:pl-4 first:border-l-0 first:pl-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">{["Weight", "Volume", "Freight", "Cargo", "Pickup", "Delivery"][index]}</p>
            <p className="mt-1 text-[15px] font-semibold text-ink">{item}</p>
          </div>
        ))}
      </div>
      <div className="relative z-[1] mt-7 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-3">Why you were selected</p>
          {["Air cargo capacity above 400 kg verified", "SGN to HKG active route on record", "4.9 star rating on HKG deliveries", "IATA cargo agent certified"].map((item) => (
            <p key={item} className="mt-2 flex items-center gap-2 text-[13px] text-ink-2"><CheckCircle2 className="h-4 w-4 text-emerald" />{item}</p>
          ))}
        </div>
        <div className="rounded-2xl border border-line bg-canvas p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-3">Your sealed quote</p>
          <div className="mt-3 rounded-xl border border-line bg-white px-4 py-4">
            <span className="text-[12px] font-bold text-ink-3">HKD</span>
            <span className="ml-3 text-[28px] font-bold tracking-[-0.4px] text-ink/15">0.00</span>
          </div>
          <Button asChild className="mt-3 h-12 w-full rounded-xl bg-navy hover:bg-[#172b5d]">
            <Link href={`${prefix}/marketplace/SR-DEMO-001`}>Submit sealed quote</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

function RouteEndpoint({ label, city, sub, alignRight, inverted }: { label: string; city: string; sub: string; alignRight?: boolean; inverted?: boolean }) {
  return (
    <div className={alignRight ? "text-left md:text-right" : ""}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.13em] ${inverted ? "text-white/55" : "text-ink-3"}`}>{label}</p>
      <h2 className={`mt-2 text-[28px] font-bold tracking-[-0.7px] ${inverted ? "text-white" : "text-ink"}`}>{city}</h2>
      <p className={`mt-1 text-[13px] ${inverted ? "text-white/68" : "text-ink-2"}`}>{sub}</p>
    </div>
  )
}

function OtherOpportunities({ prefix }: { prefix: string }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-ink">Other opportunities</h2>
        <Link href={`${prefix}/marketplace`} className="text-[12px] font-semibold text-navy">View all</Link>
      </div>
      <div className="grid gap-3">
        <OpportunityRow prefix={prefix} from="Shanghai" to="Singapore" mode="Sea" score="82% match" time="4h 20m" label="Normal bid" />
        <OpportunityRow prefix={prefix} from="Bangkok" to="Tokyo" mode="Air" score="78% match" time="2 days" label="Cold-chain fit" />
        <OpportunityRow prefix={prefix} from="Shenzhen" to="London" mode="Sea" score="71% match" time="5 days" label="Heavy cargo" />
      </div>
    </section>
  )
}

function OpportunityRow({ prefix, from, to, mode, score, time, label }: { prefix: string; from: string; to: string; mode: string; score: string; time: string; label: string }) {
  const isUrgent = time.includes("h") || time.includes("m")
  const Icon = mode === "Air" ? Plane : Ship
  return (
    <Link href={`${prefix}/marketplace/SR-DEMO-001`} className="group grid gap-3 rounded-2xl border border-line bg-white p-5 shadow-[0_10px_26px_rgba(12,26,62,.045)] transition hover:-translate-y-0.5 hover:border-[#cbd3df] hover:shadow-[0_16px_34px_rgba(12,26,62,.08)] sm:grid-cols-[52px_1fr_auto] sm:items-center">
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${isUrgent ? "bg-red-50 text-red-600" : "bg-canvas text-navy"}`}><Icon className="h-5 w-5" /></span>
      <span>
        <strong className="block text-[15px] text-ink">{from} to {to}</strong>
        <span className="mt-1 block text-[12px] text-ink-3">{mode} - {label}</span>
      </span>
      <span className="flex items-center gap-4 text-right">
        <span>
          <strong className="block text-[13px] text-emerald">{score}</strong>
          <span className={`block text-[11px] ${isUrgent ? "font-bold text-red-600" : "text-ink-3"}`}>{time}</span>
        </span>
        <ChevronRight className="h-4 w-4 text-ink-3 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}

function FilterStack() {
  return (
    <Card className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="space-y-3 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink">Filters</h2>
          <Badge variant="gold" className="rounded-full">3 priority</Badge>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Recommended", "Open market"].map((item, index) => (
            <button key={item} className={`rounded-xl border px-3 py-2 text-[12px] font-bold transition ${index === 0 ? "border-navy bg-navy text-white" : "border-line bg-canvas text-ink-2 hover:bg-white"}`}>{item}</button>
          ))}
        </div>
        {["Route coverage", "Cargo type", "Deadline", "Membership access", "Token required"].map((item) => (
          <div key={item} className="flex items-center justify-between rounded-xl border border-line bg-canvas px-3 py-3 text-[13px] font-semibold text-ink">
            {item}
            <ChevronRight className="h-4 w-4 text-ink-3" />
          </div>
        ))}
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-[12px] leading-5 text-red-700">
          Urgent bids are highlighted when fewer than 60 minutes remain or final bid slots are available.
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityStream() {
  const items: Array<[string, string, typeof Plane]> = [
    ["Quote accepted", "Guangzhou to Sydney - Air - HKD 24,800", CheckCircle2],
    ["Route certification added", "Vietnam corridor approved by review team", Star],
    ["Profile verified", "IATA credentials confirmed", BadgeCheck],
    ["Quote submitted", "Manila to Hong Kong - under review", LockKeyhole],
  ]

  return (
    <Card className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink">Activity</h2>
          <span className="text-[12px] font-semibold text-navy">All</span>
        </div>
        {items.map(([title, meta, Icon]) => (
          <div key={String(title)} className="border-b border-line py-4 last:border-0">
            <div className="flex gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-soft text-navy">{createElement(Icon, { className: "h-4 w-4" })}</span>
              <span>
                <strong className="block text-[13px] text-ink">{title}</strong>
                <span className="mt-1 block text-[12px] leading-5 text-ink-3">{meta}</span>
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function DecisionPanel() {
  return (
    <Card className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="p-5">
        <Badge variant="gold">Decision logic</Badge>
        <h2 className="mt-4 text-[20px] font-bold text-ink">Price is not the only winner.</h2>
        <p className="mt-2 text-[13px] leading-6 text-ink-2">Lowest bid gets a clear badge, but Agency can choose reliability, route fit or speed with a recorded reason.</p>
        <div className="mt-4 space-y-2">
          {["Lowest quote badge", "Recommended fit badge", "Non-lowest confirmation", "Audit record generated"].map((item) => (
            <p key={item} className="flex items-center gap-2 text-[13px] text-ink-2"><CheckCircle2 className="h-4 w-4 text-emerald" />{item}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function BidReceipt({ id }: { id?: string }) {
  return (
    <Card className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="p-5">
        <Badge variant="gold">Token impact</Badge>
        <h2 className="mt-4 text-[22px] font-bold text-ink">1 token reserved</h2>
        <p className="mt-2 text-[13px] leading-6 text-ink-2">Bid {id || "SR-DEMO-001"} will deduct one free token through Supabase RPC after submit.</p>
        <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3">Balance after bid</p>
          <p className="mt-2 text-[28px] font-bold text-ink">7 tokens</p>
        </div>
      </CardContent>
    </Card>
  )
}

function GuidedRequestForm() {
  const groups: Array<[string, string[]]> = [
    ["Route", ["Origin country", "Destination", "Freight mode"]],
    ["Cargo", ["Cargo type", "Weight range", "CBM range"]],
    ["Service", ["Customs", "Warehousing", "Final delivery"]],
    ["Timing", ["Ship date", "Bid deadline", "Review notes"]],
  ]
  return (
    <section className="rounded-[26px] border border-line bg-white p-6 shadow-[0_18px_48px_rgba(12,26,62,.07)]">
      <div className="mb-6 grid gap-2 md:grid-cols-4">
        {groups.map(([title], index) => (
          <div key={title} className={`rounded-full border px-4 py-2 text-center text-[12px] font-bold ${index === 0 ? "border-navy bg-navy text-white" : "border-line bg-canvas text-ink-2"}`}>{index + 1}. {title}</div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {groups.map(([title, fields]) => (
          <div key={title} className="rounded-2xl border border-line bg-canvas p-5">
            <h3 className="text-[16px] font-bold text-ink">{title}</h3>
            <div className="mt-4 grid gap-3">
              {fields.map((field) => (
                <label key={field} className="block">
                  <span className="text-[12px] font-semibold text-ink-2">{field}</span>
                  <div className="mt-1.5 flex h-11 items-center justify-between rounded-xl border border-line bg-white px-3 text-[13px] text-ink transition hover:border-[#cbd3df]">
                    <span>Select option</span>
                    <ChevronRight className="h-4 w-4 text-ink-3" />
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function RequestQueue({ prefix }: { prefix: string }) {
  const rows = [
    { code: "SR-2026-00124", status: "Waiting admin review", action: "Submit missing cargo notes", tone: "amber", progress: 25 },
    { code: "SR-2026-00119", status: "Live bidding", action: "3 bids received - closes in 42m", tone: "red", progress: 62 },
    { code: "SR-2026-00102", status: "Compare quotes", action: "Lowest quote available", tone: "green", progress: 82 },
  ]
  return (
    <section className="grid gap-4">
      {rows.map((row) => (
        <Link key={row.code} href={`${prefix}/requests/${row.code}`} className="group relative overflow-hidden rounded-[24px] border border-line bg-white p-5 shadow-[0_14px_34px_rgba(12,26,62,.055)] transition hover:-translate-y-0.5 hover:border-[#cbd3df] hover:shadow-[0_20px_48px_rgba(12,26,62,.09)]">
          <span className={`absolute inset-y-0 left-0 w-1.5 ${row.tone === "red" ? "bg-red-500" : row.tone === "green" ? "bg-emerald" : "bg-gold"}`} />
          <span className="grid gap-4 md:grid-cols-[1fr_280px_auto] md:items-center">
            <span>
              <strong className="block text-[16px] text-ink">{row.code}</strong>
              <span className="mt-1 block text-[12px] text-ink-3">{row.status}</span>
              <span className="mt-4 block h-2 overflow-hidden rounded-full bg-canvas">
                <span className={`block h-full rounded-full ${row.tone === "red" ? "bg-red-500" : row.tone === "green" ? "bg-emerald" : "bg-gold"}`} style={{ width: `${row.progress}%` }} />
              </span>
            </span>
            <span className="rounded-2xl border border-line bg-canvas px-4 py-3">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">Next action</span>
              <span className="mt-1 block text-[13px] font-bold text-ink">{row.action}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-[12px] font-bold text-navy">
              Open <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </span>
        </Link>
      ))}
    </section>
  )
}

function RequestTimeline({ id }: { id?: string }) {
  const steps = ["Draft", "Admin review", "Published", "3-hour bidding", "Compare and award"]
  return (
    <Card className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="p-5">
        <h2 className="text-[14px] font-bold text-ink">{id || "SR"} timeline</h2>
        <p className="mt-2 text-[12px] leading-5 text-ink-3">Every SR must pass review before the sealed window starts.</p>
        {steps.map((step, index) => (
          <div key={step} className="mt-4 flex gap-3">
            <span className={`mt-0.5 grid h-6 w-6 place-items-center rounded-full border text-[10px] font-bold ${index < 2 ? "border-navy bg-navy text-white" : "border-line bg-white text-ink-3"}`}>{index + 1}</span>
            <span>
              <strong className="block text-[13px] text-ink">{step}</strong>
              <span className="text-[12px] text-ink-3">{index < 2 ? "In progress" : "Upcoming"}</span>
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function LiveCreateRequestPanel({ prefix }: { prefix: string }) {
  const [form, setForm] = useState({
    origin: "Ho Chi Minh City",
    destination: "Hong Kong",
    mode: "air",
    cargoType: "general",
    weightKg: "500",
    cbm: "3",
    services: "Customs clearance, Local delivery",
  })
  const [status, setStatus] = useState("")
  const [createdId, setCreatedId] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    setLoading(true)
    setStatus("")
    const { response, body } = await apiJson("/api/shipment-requests", {
      method: "POST",
      body: JSON.stringify({
        origin: form.origin,
        destination: form.destination,
        mode: form.mode,
        cargoType: form.cargoType,
        weightKg: Number(form.weightKg),
        cbm: Number(form.cbm),
        services: form.services.split(",").map((item) => item.trim()).filter(Boolean),
      }),
    })
    setLoading(false)
    if (!response.ok) {
      setStatus(body.error || "Create SR failed")
      return
    }
    setCreatedId(body.shipmentRequest?.id || "")
    setStatus("Shipment Request created and sent to Admin review.")
  }

  return (
    <section className="rounded-[28px] border border-line bg-white p-6 shadow-[0_18px_48px_rgba(12,26,62,.07)]">
      <div className="mb-6 grid gap-2 md:grid-cols-4">
        {["Route", "Cargo", "Service", "Review"].map((step, index) => (
          <div key={step} className={`rounded-2xl border px-4 py-3 text-center text-[12px] font-bold transition ${index === 0 ? "border-navy bg-navy text-white shadow-[0_12px_24px_rgba(27,43,94,.14)]" : "border-line bg-canvas text-ink-2"}`}>{index + 1}. {step}</div>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-[24px] border border-gold-border bg-gold-soft p-5">
          <Badge variant="gold">Step 1</Badge>
          <h2 className="mt-4 text-[24px] font-bold tracking-[-0.5px] text-ink">Tell LBID the route first.</h2>
          <p className="mt-2 text-[13px] leading-6 text-gold-dark">Dropdown-first fields reduce mistakes. After submission, Admin checks data quality before publishing.</p>
          <div className="mt-5 space-y-3 text-[12px] font-semibold text-gold-dark">
            {["Agency email required", "Manual review before publishing", "3-hour sealed bid window"].map((item) => (
              <p key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" />{item}</p>
            ))}
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <LiveInput label="Origin" value={form.origin} onChange={(value) => setForm({ ...form, origin: value })} />
          <LiveInput label="Destination" value={form.destination} onChange={(value) => setForm({ ...form, destination: value })} />
          <LiveSelect label="Freight mode" value={form.mode} onChange={(value) => setForm({ ...form, mode: value })} options={["air", "sea", "truck"]} />
          <LiveSelect label="Cargo type" value={form.cargoType} onChange={(value) => setForm({ ...form, cargoType: value })} options={["general", "dangerous_goods", "cold_chain"]} />
          <LiveInput label="Weight kg" value={form.weightKg} onChange={(value) => setForm({ ...form, weightKg: value })} />
          <LiveInput label="CBM" value={form.cbm} onChange={(value) => setForm({ ...form, cbm: value })} />
          <label className="block lg:col-span-2">
            <span className="text-[12px] font-semibold text-ink-2">Services needed</span>
            <input className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] font-medium text-ink outline-none transition hover:border-navy/20 focus:border-navy/40" value={form.services} onChange={(event) => setForm({ ...form, services: event.target.value })} />
          </label>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={submit} disabled={loading} className="h-11 rounded-xl bg-navy px-5 hover:bg-[#172b5d]">{loading ? "Submitting..." : "Submit for Admin review"}</Button>
        {createdId ? <Link href={`${prefix}/requests/${createdId}`} className="text-[13px] font-semibold text-navy hover:underline">Open {createdId}</Link> : null}
        {status ? <span className={`text-[13px] font-semibold ${createdId ? "text-emerald" : "text-red-600"}`}>{status}</span> : null}
      </div>
    </section>
  )
}

function RequestDetailPanel({ id }: { id?: string }) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_18px_48px_rgba(12,26,62,.07)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="gold">{id || "SR-2026-00119"}</Badge>
            <h2 className="mt-4 text-[28px] font-bold tracking-[-0.7px] text-ink">Ho Chi Minh City to Hong Kong</h2>
            <p className="mt-2 text-[13px] text-ink-2">Air freight - 500 kg - 3 CBM - Customs + local delivery</p>
          </div>
          <span className="rounded-2xl border border-red-200 bg-red-50 px-4 py-2 text-right">
            <span className="block text-[9px] font-bold uppercase tracking-[0.14em] text-red-500">bid closes</span>
            <span className="font-mono text-[18px] font-black text-red-700">00:42:00</span>
          </span>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {["Admin approved", "Live bidding", "3 bids received", "2 refusal left"].map((item, index) => (
            <div key={item} className={`rounded-2xl border p-4 ${index === 1 ? "border-navy bg-navy text-white" : "border-line bg-canvas text-ink"}`}>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] opacity-60">State {index + 1}</p>
              <p className="mt-3 text-[13px] font-bold">{item}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-line bg-white p-6 shadow-[0_18px_48px_rgba(12,26,62,.07)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-3">Next best action</p>
        <h3 className="mt-4 text-[22px] font-bold text-ink">Wait for bid window to close.</h3>
        <p className="mt-2 text-[13px] leading-6 text-ink-2">After expiry, LBID reveals ranked bids and highlights the lowest valid quote. Contact details stay locked until award.</p>
        <Button className="mt-5 w-full rounded-xl bg-navy">Open bid comparison</Button>
      </div>
    </section>
  )
}

function LiveBidSubmitPanel({ srId }: { srId: string }) {
  const [price, setPrice] = useState("24800")
  const [transitTime, setTransitTime] = useState("2 days")
  const [terms, setTerms] = useState("Customs and local delivery included.")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(false)

  async function submitBid() {
    setLoading(true)
    setStatus("")
    const { response, body } = await apiJson("/api/bids", {
      method: "POST",
      body: JSON.stringify({ sr_id: srId, price: Number(price), currency: "HKD", transit_time: transitTime, terms }),
    })
    setLoading(false)
    setStatus(response.ok ? `Sealed bid submitted. ${body.tokenBalanceAfter ? `Token balance: ${body.tokenBalanceAfter}` : ""}` : body.error || "Bid submission failed")
  }

  return (
    <section className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <LiveInput label="Sealed quote HKD" value={price} onChange={setPrice} />
        <LiveInput label="Transit time" value={transitTime} onChange={setTransitTime} />
        <LiveInput label="Terms" value={terms} onChange={setTerms} />
        <Button onClick={submitBid} disabled={loading} className="h-11 rounded-xl bg-navy px-5 hover:bg-[#172b5d]">{loading ? "Submitting..." : "Submit live bid"}</Button>
      </div>
      {status ? <p className={`mt-3 text-[13px] font-semibold ${status.includes("submitted") ? "text-emerald" : "text-red-600"}`}>{status}</p> : null}
    </section>
  )
}

function LiveComparisonPanel({ srId }: { srId: string }) {
  const [bids, setBids] = useState<Array<{ id: string; price?: number; currency?: string; transit_time?: string }>>([])
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    const query = srId ? `?sr_id=${encodeURIComponent(srId)}` : ""
    apiJson(`/api/bids${query}`).then(({ response, body }) => {
      if (!active) return
      setBids(response.ok ? body.bids || [] : [])
      setLoading(false)
    }).catch(() => {
      if (!active) return
      setLoading(false)
    })
    return () => {
      active = false
    }
  }, [srId])

  const displayBids = useMemo(() => {
    const live = bids.length ? bids : [
      { id: "demo-lowest", price: 22400, currency: "HKD", transit_time: "2 days" },
      { id: "demo-recommended", price: 24800, currency: "HKD", transit_time: "1 day" },
      { id: "demo-fastest", price: 26100, currency: "HKD", transit_time: "Same day" },
    ]
    return [...live].sort((a, b) => Number(a.price || 0) - Number(b.price || 0))
  }, [bids])

  async function acceptBid(id: string) {
    if (id.startsWith("demo-")) {
      setStatus("Demo bid selected. Live accept requires real Supabase bid id.")
      return
    }
    const { response, body } = await apiJson(`/api/bids/${id}/accept`, { method: "POST", body: JSON.stringify({}) })
    setStatus(response.ok ? `Bid accepted. Order ${body.order?.id || "created"}.` : body.error || "Accept bid failed")
  }

  if (loading) return <section className="rounded-2xl border border-line bg-white p-6 text-[13px] text-ink-3">Loading live bids...</section>

  return (
    <section className="space-y-4">
      <div className="rounded-[28px] border border-line bg-white p-5 shadow-[0_18px_48px_rgba(12,26,62,.07)]">
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-3">Shipment request</p>
            <h2 className="mt-2 text-[24px] font-bold tracking-[-0.5px] text-ink">{srId || "SR-DEMO-001"}</h2>
            <p className="mt-1 text-[13px] text-ink-2">Ho Chi Minh City to Hong Kong - sealed window closed</p>
          </div>
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-navy text-white shadow-[0_12px_28px_rgba(27,43,94,.22)]">
            <Award className="h-6 w-6" />
          </span>
          <div className="text-left md:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-ink-3">Decision mode</p>
            <p className="mt-2 text-[16px] font-bold text-ink">Lowest highlighted, choice remains open</p>
            <p className="mt-1 text-[12px] text-ink-3">Non-lowest requires recorded reason.</p>
          </div>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {displayBids.map((bid, index) => (
          <QuoteCard
            key={bid.id}
            name={index === 0 ? "Lowest valid bid" : index === 1 ? "Recommended partner" : "Alternative partner"}
            price={`${bid.currency || "HKD"} ${Number(bid.price || 0).toLocaleString("en-HK")}`}
            label={index === 0 ? "Lowest quote" : index === 1 ? "Recommended" : "Fastest"}
            tone={index === 0 ? "green" : index === 1 ? "gold" : "blue"}
            meta={`${bid.transit_time || "Transit pending"} - ${bids.length ? "live Supabase bid" : "demo state"}`}
            onSelect={() => void acceptBid(bid.id)}
          />
        ))}
      </div>
      {status ? <p className="lg:col-span-3 rounded-2xl border border-line bg-white p-4 text-[13px] font-semibold text-ink-2">{status}</p> : null}
    </section>
  )
}

function LiveInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="text-[12px] font-semibold text-ink-2">{label}</span>
      <input className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] font-medium text-ink outline-none transition hover:border-navy/20 focus:border-navy/40" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function LiveSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink-2">{label}</span>
      <select className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] font-medium text-ink outline-none transition hover:border-navy/20 focus:border-navy/40" value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  )
}

function QuoteCard({ name, price, label, tone, meta, onSelect }: { name: string; price: string; label: string; tone: "green" | "gold" | "blue"; meta: string; onSelect?: () => void }) {
  const toneClass = tone === "green" ? "border-emerald/35 bg-[linear-gradient(180deg,#f3fcf8,#fff)]" : tone === "gold" ? "border-gold-border bg-[linear-gradient(180deg,#fff8e6,#fff)]" : "border-blue-200 bg-white"
  return (
    <Card className={`relative overflow-hidden rounded-[24px] shadow-[0_16px_44px_rgba(12,26,62,.07)] transition hover:-translate-y-1 ${toneClass}`}>
      {tone === "green" ? <div className="absolute inset-x-0 top-0 h-1 bg-emerald" /> : tone === "gold" ? <div className="absolute inset-x-0 top-0 h-1 bg-gold" /> : null}
      <CardContent className="p-6">
        <Badge variant={tone === "gold" ? "gold" : tone === "green" ? "teal" : "secondary"}>{label}</Badge>
        <h3 className="mt-5 text-[18px] font-bold text-ink">{name}</h3>
        <p className="mt-4 text-[32px] font-bold tracking-[-0.8px] text-ink">{price}</p>
        <p className="mt-2 text-[13px] text-ink-2">{meta}</p>
        <div className="mt-5 space-y-2">
          {(tone === "green" ? ["Best price", "Valid insurance", "Standard transit"] : tone === "gold" ? ["94% profile fit", "Fastest response", "Preferred route"] : ["Fastest transit", "Premium handling", "Higher price"]).map((item) => (
            <p key={item} className="flex items-center gap-2 text-[12px] text-ink-2"><CheckCircle2 className={`h-4 w-4 ${tone === "gold" ? "text-gold" : "text-emerald"}`} />{item}</p>
          ))}
        </div>
        <Button onClick={onSelect} variant={tone === "gold" ? "gold" : "outline"} className="mt-6 h-11 w-full rounded-xl">Select bid</Button>
      </CardContent>
    </Card>
  )
}

function DocumentChecklist() {
  const docs = [
    ["AWB / B/L", "Done", "teal"],
    ["Commercial Invoice", "Done", "teal"],
    ["Packing List", "Missing", "gold"],
    ["Certificate of Origin", "Optional", "secondary"],
  ] as const
  return (
    <Card className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink">Document checklist</h2>
          <Badge variant="gold">24h reminder</Badge>
        </div>
        {docs.map(([doc, status, tone]) => (
          <div key={doc} className="mt-3 flex items-center justify-between rounded-xl border border-line bg-canvas px-3 py-3">
            <span className="text-[13px] font-semibold text-ink">{doc}</span>
            <Badge variant={tone}>{status}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function OrderPipeline({ active, id }: { active: UnifiedPageKind; id?: string }) {
  const steps = ["Confirmed", "Booked", "In transit", "Arrived HK", "Customs", "Delivered", "Completed"]
  const activeIndex = active === "documents" || active === "messages" ? 2 : active === "tracking" ? 3 : active === "review" ? 6 : 2
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-line bg-white p-6 shadow-[0_18px_48px_rgba(12,26,62,.07)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-navy via-emerald to-gold" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="gold">Order {id || "MATCH-1234"} - {active}</Badge>
          <h2 className="mt-4 text-[26px] font-bold tracking-[-0.6px] text-ink">Shipment operations cockpit</h2>
          <p className="mt-2 text-[13px] text-ink-2">Awarded quote has become an order. Documents, messages and status updates now share one timeline.</p>
        </div>
        <Button variant="outline" className="rounded-xl">View audit record</Button>
      </div>
      <div className="mt-6 grid gap-3 lg:grid-cols-7">
        {steps.map((step, index) => (
          <div key={step} className={`rounded-2xl border p-4 ${index < activeIndex ? "border-navy bg-navy text-white" : index === activeIndex ? "border-gold-border bg-gold-soft text-gold-dark" : "border-line bg-canvas text-ink"}`}>
            <CheckCircle2 className="h-5 w-5" />
            <p className="mt-4 text-[12px] font-bold">{step}</p>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {["Packing List missing", "Partner message unread", "Customs ETA pending"].map((item) => (
          <div key={item} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-800">{item}</div>
        ))}
      </div>
    </section>
  )
}

function MessagePreview() {
  return (
    <Card className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-ink">Order messages</h2>
          <Badge variant="secondary">2 unread</Badge>
        </div>
        <p className="mt-3 rounded-2xl bg-canvas p-4 text-[13px] leading-6 text-ink-2">Please upload Packing List before 18:00. System will remind both sides 24h before ship date.</p>
        <div className="mt-3 rounded-2xl border border-line bg-white p-4 text-[13px] leading-6 text-ink-2">System: shipment status changed to In transit and both parties were notified.</div>
      </CardContent>
    </Card>
  )
}

function ResponsibilityRecord() {
  return (
    <Card className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-ink">Responsibility record</h2>
          <ShieldCheck className="h-5 w-5 text-navy" />
        </div>
        <p className="mt-3 text-[13px] leading-6 text-ink-2">LBID records award, cancellation, status changes, document approvals and admin actions for compliance awareness.</p>
        <div className="mt-4 space-y-2">
          {["Platform role: workflow_platform_not_carrier_of_record", "Award accepted by Agency", "Cooling-off policy attached"].map((item) => (
            <p key={item} className="flex items-center gap-2 text-[12px] text-ink-2"><CheckCircle2 className="h-4 w-4 text-emerald" />{item}</p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AdminReviewQueue({ kind }: { kind: UnifiedPageKind }) {
  const [rows, setRows] = useState<any[]>([])
  const [status, setStatus] = useState("")
  const [query, setQuery] = useState("")
  const [reason, setReason] = useState("Need clearer cargo details before publication.")
  const [filter, setFilter] = useState("pending")

  useEffect(() => {
    let active = true
    const endpoint = kind === "admin-payments"
      ? `/api/admin/pending-payments?status=${filter}&q=${encodeURIComponent(query)}`
      : kind === "admin-accounts"
        ? "/api/admin/forwarders"
        : "/api/admin/shipment-requests"
    apiJson(endpoint).then(({ response, body }) => {
      if (!active) return
      if (!response.ok) {
        setRows([])
        setStatus(body.error || "Admin API unavailable")
        return
      }
      setStatus("")
      setRows(body.shipmentRequests || body.forwarders || body.paymentIntents || [])
    }).catch(() => {
      if (!active) return
      setStatus("Admin API unavailable")
    })
    return () => {
      active = false
    }
  }, [kind, filter, query])

  async function reviewRequest(id: string, action: "publish" | "reject") {
    const { response, body } = await apiJson("/api/admin/shipment-requests", {
      method: "PATCH",
      body: JSON.stringify({ id, action, reason }),
    })
    setStatus(response.ok ? `Request ${action}ed.` : body.error || "Review failed")
    if (response.ok) setRows((current) => current.filter((row) => row.id !== id))
  }

  async function reviewPayment(id: string, action: "confirm" | "reject") {
    const { response, body } = await apiJson("/api/admin/pending-payments", {
      method: "POST",
      body: JSON.stringify({ paymentIntentId: id, action, note: reason }),
    })
    setStatus(response.ok ? `Payment ${action}ed.` : body.error || "Payment review failed")
    if (response.ok) setRows((current) => current.filter((row) => row.id !== id))
  }

  const fallbackRows = kind === "admin-payments"
    ? [{ id: "demo-payment", amount: 1500, currency: "HKD", status: "pending", company_name: "Pacific Forward Ltd.", fps_reference: "FPS-3921" }]
    : kind === "admin-accounts"
      ? [{ id: "demo-account", companyName: "HarbourLink Cargo", region: "Hong Kong", verificationStatus: "pending", verificationNote: "BR and IATA docs ready" }]
      : [{ id: "demo-sr", route: { origin: "Jakarta", destination: "Hong Kong" }, status: "PENDING_REVIEW", cargo_details: { cargo: "General cargo" } }]
  const visibleRows = rows.length ? rows : fallbackRows

  return (
    <section className="space-y-3">
      <div className="grid gap-3 rounded-2xl border border-line bg-white p-4 md:grid-cols-[1fr_180px_1fr]">
        <input className="h-10 rounded-xl border border-line px-3 text-[13px] outline-none focus:border-navy/40" placeholder="Search company, email, reference..." value={query} onChange={(event) => setQuery(event.target.value)} />
        {kind === "admin-payments" ? (
          <select className="h-10 rounded-xl border border-line px-3 text-[13px] outline-none focus:border-navy/40" value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="rejected">Rejected</option>
            <option value="all">All</option>
          </select>
        ) : <span className="hidden md:block" />}
        <input className="h-10 rounded-xl border border-line px-3 text-[13px] outline-none focus:border-navy/40" placeholder="Review reason / internal note" value={reason} onChange={(event) => setReason(event.target.value)} />
      </div>
      {visibleRows.map((row) => (
        <div key={row.id || row.user_id} className="grid gap-3 rounded-2xl border border-line bg-white p-5 shadow-[0_10px_26px_rgba(12,26,62,.045)] md:grid-cols-[1fr_auto] md:items-center">
          <span>
            <strong className="block text-[14px] text-ink">{adminRowTitle(kind, row)}</strong>
            <span className="mt-1 block text-[12px] text-ink-3">{adminRowMeta(kind, row)}</span>
          </span>
          <span className="flex flex-wrap gap-2">
            {kind === "admin-payments" ? (
              <>
                <Button onClick={() => void reviewPayment(row.id, "confirm")} size="sm" className="rounded-xl bg-navy">Confirm</Button>
                <Button onClick={() => void reviewPayment(row.id, "reject")} size="sm" variant="outline" className="rounded-xl">Reject</Button>
              </>
            ) : kind === "admin-accounts" ? (
              <Button asChild size="sm" variant="outline" className="rounded-xl"><Link href={`/zh/admin/accounts`}>Open verification</Link></Button>
            ) : (
              <>
                <Button onClick={() => void reviewRequest(row.id, "publish")} size="sm" className="rounded-xl bg-navy">Publish</Button>
                <Button onClick={() => void reviewRequest(row.id, "reject")} size="sm" variant="outline" className="rounded-xl">Reject</Button>
              </>
            )}
          </span>
        </div>
      ))}
      {status ? <p className="rounded-2xl border border-line bg-white p-4 text-[13px] font-semibold text-ink-2">{status}</p> : null}
    </section>
  )
}

function adminRowTitle(kind: UnifiedPageKind, row: any) {
  if (kind === "admin-payments") return `${row.company_name || row.email || row.user_id || "Payment"} - ${row.currency || "HKD"} ${Number(row.amount || 0).toLocaleString("en-HK")}`
  if (kind === "admin-accounts") return row.companyName || row.company_name_en || row.company_name_zh || row.id || "Company profile"
  const route = row.route || {}
  return `${row.id || "SR"} - ${route.origin || "Origin"} to ${route.destination || "Hong Kong"}`
}

function adminRowMeta(kind: UnifiedPageKind, row: any) {
  if (kind === "admin-payments") return `${row.status || "pending"} - ${row.fps_reference || row.payment_method || "manual payment"}`
  if (kind === "admin-accounts") return `${row.region || "Hong Kong"} - ${row.verificationStatus || row.verification_status || "pending"} - ${row.verificationNote || "No internal note"}`
  return `${row.status || "PENDING_REVIEW"} - ${row.cargo_details?.cargo || row.cargo_details?.cargo_type || "Cargo details pending"}`
}

function AdminAudit({ kind }: { kind: UnifiedPageKind }) {
  return (
    <Card className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="p-5">
        <Badge variant="gold">Audit</Badge>
        <h2 className="mt-4 text-[20px] font-bold text-ink">{kind}</h2>
        <p className="mt-2 text-[13px] leading-6 text-ink-2">Every approval, rejection, payment and membership change is logged with actor, time and reason.</p>
      </CardContent>
    </Card>
  )
}

function DirectoryGrid({ id }: { id?: string }) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {["Pacific Forward Ltd.", "HarbourLink Cargo", id || "Gold Harbour Logistics"].map((name, index) => (
        <Card key={name} className="rounded-2xl border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)]">
          <CardContent className="p-5">
            <Badge variant={index === 0 ? "gold" : "secondary"}>{index === 0 ? "Preferred" : "Verified"}</Badge>
            <h3 className="mt-5 text-[18px] font-bold text-ink">{name}</h3>
            <p className="mt-2 text-[13px] leading-6 text-ink-2">Air, sea, customs and local delivery coverage with public ratings and completed orders.</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function TokenLedger() {
  return (
    <section className="grid gap-4 lg:grid-cols-[360px_1fr]">
      <Card className="rounded-2xl border-gold-border bg-gold-soft shadow-[0_12px_32px_rgba(12,26,62,.05)]">
        <CardContent className="p-6">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-gold-dark">Available token</p>
          <p className="mt-4 text-[48px] font-bold text-ink">8</p>
          <Button variant="gold" className="mt-5 rounded-xl">Buy tokens</Button>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {["submit_bid_with_token - free token -1", "Referral reward +3", "Profile boost redeemed -2"].map((row) => (
          <div key={row} className="rounded-2xl border border-line bg-white p-5 text-[14px] font-semibold text-ink">{row}</div>
        ))}
      </div>
    </section>
  )
}

function PlanGrid() {
  return (
    <section className="grid gap-4 lg:grid-cols-4">
      {["Free", "Standard", "Premium", "Partner"].map((plan, index) => (
        <Card key={plan} className={`rounded-2xl bg-white shadow-[0_12px_32px_rgba(12,26,62,.05)] ${index === 2 ? "border-gold-border" : "border-line"}`}>
          <CardContent className="p-5">
            <h3 className="text-[18px] font-bold text-ink">{plan}</h3>
            <p className="mt-4 text-[28px] font-bold text-ink">{index === 0 ? "HKD 0" : index === 1 ? "HKD 500" : index === 2 ? "HKD 1500" : "Custom"}</p>
            <p className="mt-2 text-[13px] text-ink-2">Visibility, token and trust benefits for this tier.</p>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function ProfileEditor() {
  return (
    <section className="rounded-[26px] border border-line bg-white p-6 shadow-[0_18px_48px_rgba(12,26,62,.07)]">
      <div className="grid gap-4 lg:grid-cols-2">
        {["Company name", "Capabilities", "Route coverage", "Services", "Directory visibility", "Membership tier"].map((field) => (
          <label key={field} className="block">
            <span className="text-[12px] font-semibold text-ink-2">{field}</span>
            <div className="mt-1.5 flex h-12 items-center justify-between rounded-xl border border-line bg-white px-3 text-[13px] text-ink transition hover:border-[#cbd3df]">
              <span>{field === "Company name" ? "Pacific Forward Ltd." : "Select option"}</span>
              <ChevronRight className="h-4 w-4 text-ink-3" />
            </div>
          </label>
        ))}
      </div>
    </section>
  )
}

function MembershipCard() {
  return (
    <Card className="rounded-2xl border-gold-border bg-gold-soft shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <CardContent className="p-5">
        <Badge variant="gold">Standard member</Badge>
        <h2 className="mt-4 text-[22px] font-bold text-ink">Reward moment</h2>
        <p className="mt-2 text-[13px] leading-6 text-ink-2">After payment confirmation, show a warm success state with new benefits, tier badge and next best action.</p>
      </CardContent>
    </Card>
  )
}

function NotificationRows() {
  return (
    <section className="grid gap-3">
      {["Bid closes in 42 minutes", "Payment confirmed - Premium active", "Packing List reminder sent", "Forwarder verification approved"].map((item) => (
        <div key={item} className="flex items-center justify-between rounded-2xl border border-line bg-white p-5 shadow-[0_10px_26px_rgba(12,26,62,.045)]">
          <span className="text-[14px] font-semibold text-ink">{item}</span>
          <Bell className="h-4 w-4 text-navy" />
        </div>
      ))}
    </section>
  )
}

function MetricCard({ label, value, delta, icon: Icon }: PageConfig["stats"][number]) {
  return (
    <Card className="rounded-[14px] border-line bg-white/82 shadow-[0_10px_28px_rgba(12,26,62,.045)] transition hover:-translate-y-0.5 hover:border-[#ccd3df] hover:shadow-[0_16px_34px_rgba(12,26,62,.08)]">
      <CardContent className="flex items-center gap-4 p-5">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-navy-soft text-navy">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">{label}</p>
          <strong className="mt-1 block text-[22px] leading-none tracking-[-0.4px] text-ink">{value}</strong>
          <span className="mt-1 block text-[11.5px] text-emerald">{delta}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function HeroCard({ config, title }: { config: PageConfig; title: string }) {
  const Icon = config.icon
  return (
    <section className="relative overflow-hidden rounded-[18px] border border-line bg-white p-6 shadow-[0_18px_44px_rgba(12,26,62,.09)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-navy via-[#315aa6] to-gold" />
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gold-dark">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {config.focus.label}
            </span>
            <span className="rounded-full border border-gold-border bg-gold-soft px-2.5 py-1 text-[11px] font-semibold text-gold-dark">
              {config.focus.score} profile match
            </span>
            {config.focus.urgent ? (
              <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-semibold text-red-600">
                Final bid window
              </span>
            ) : null}
          </div>
          <div className="mt-8 grid gap-8 md:grid-cols-[1fr_auto_1fr] md:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">Origin</p>
              <h2 className="mt-2 text-[26px] font-bold tracking-[-0.6px] text-ink">{title.split(" to ")[0] || title}</h2>
              <p className="mt-1 text-[13px] text-ink-2">SGN · Tan Son Nhat Intl.</p>
            </div>
            <div className="flex items-center justify-center">
              <span className="relative grid h-12 w-12 place-items-center rounded-full bg-navy text-white shadow-[0_10px_24px_rgba(12,26,62,.22)] before:absolute before:right-full before:h-px before:w-16 before:bg-line after:absolute after:left-full after:h-px after:w-16 after:bg-line">
                <Icon className="h-5 w-5" />
              </span>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3">Destination</p>
              <h2 className="mt-2 text-[26px] font-bold tracking-[-0.6px] text-ink">Hong Kong</h2>
              <p className="mt-1 text-[13px] text-ink-2">HKG · Hong Kong Intl. Airport</p>
            </div>
          </div>
          <div className="mt-7 grid gap-3 border-y border-line py-5 sm:grid-cols-3 lg:grid-cols-6">
            {["500 kg", "3 CBM", "Air", "General", "26 Jun", "27 Jun"].map((item, index) => (
              <div key={item} className={index ? "sm:border-l sm:border-line sm:pl-4" : ""}>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-3">{["Weight", "Volume", "Freight", "Cargo", "Pickup", "Delivery"][index]}</p>
                <p className="mt-1 text-[14px] font-semibold text-ink">{item}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl border border-line bg-canvas px-4 py-3 text-[12.5px] leading-5 text-ink-2">
            Your quote is <strong className="text-ink">sealed and confidential</strong>. The other party sees only status until the window closes.
          </p>
        </div>
        <div className="w-full rounded-2xl border border-line bg-canvas p-4 lg:w-[280px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.11em] text-ink-3">Next action</p>
          <div className="mt-3 rounded-xl border border-line bg-white p-4">
            <p className="font-mono text-[26px] font-bold tracking-[0.08em] text-ink">{config.focus.urgent ? "13:44" : "2 days"}</p>
            <p className="mt-1 text-[12px] text-ink-3">remaining</p>
          </div>
          <Button className="mt-3 h-11 w-full rounded-xl bg-navy hover:bg-[#172b5d]">{config.focus.cta}</Button>
          <p className="mt-3 text-center text-[11px] leading-4 text-ink-3">{config.focus.meta}</p>
        </div>
      </div>
    </section>
  )
}

function ScenarioPanel({ kind, prefix, id }: { kind: UnifiedPageKind; prefix: string; id?: string }) {
  const isAdmin = kind.startsWith("admin")
  const isForm = kind === "create-request" || kind === "profile" || kind === "awb"
  const isCompare = kind === "quote-compare"
  const isOrder = kind.includes("order") || ["documents", "messages", "tracking", "review"].includes(kind)

  if (isCompare) return <ComparePanel />
  if (isForm) return <FormPanel kind={kind} />
  if (isAdmin) return <AdminPanel kind={kind} />
  if (isOrder) return <OrderPanel id={id} />

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {[
        ["Recommended bid", "System pushed by route, cargo and service profile.", "94% match"],
        ["Normal open bid", "Visible in marketplace after request publication.", "82% match"],
        ["Locked state", "Requires tokens, membership or verification before action.", "Needs action"],
      ].map(([title, body, tag], index) => (
        <Card key={title} className="rounded-[14px] border-line bg-white shadow-[0_10px_26px_rgba(12,26,62,.045)] transition hover:-translate-y-0.5 hover:border-[#cbd3df]">
          <CardContent className="p-5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${index === 0 ? "bg-gold-soft text-gold-dark" : "bg-navy-soft text-navy"}`}>
              {createElement([Sparkles, Plane, LockKeyhole][index], { className: "h-[18px] w-[18px]" })}
            </span>
            <h3 className="mt-4 text-[16px] font-bold text-ink">{title}</h3>
            <p className="mt-2 min-h-[42px] text-[13px] leading-5 text-ink-2">{body}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="rounded-full border border-line bg-canvas px-2.5 py-1 text-[11px] font-semibold text-ink-2">{tag}</span>
              <Link href={`${prefix}/demo-cases`} className="text-navy">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function ComparePanel() {
  const quotes = [
    ["HarbourLink Cargo", "HKD 22,400", "Lowest quote", "2 days · verified customs"],
    ["Pacific Forward Ltd.", "HKD 24,800", "Recommended", "94% fit · faster response"],
    ["Gold Harbour Logistics", "HKD 26,100", "Fastest", "1 day · premium badge"],
  ]
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {quotes.map(([name, price, tag, meta], index) => (
        <Card key={name} className={`rounded-[14px] bg-white shadow-[0_10px_26px_rgba(12,26,62,.045)] transition hover:-translate-y-0.5 ${index === 0 ? "border-emerald/30" : index === 1 ? "border-gold-border" : "border-line"}`}>
          <CardContent className="p-5">
            <Badge variant={index === 0 ? "teal" : index === 1 ? "gold" : "secondary"}>{tag}</Badge>
            <h3 className="mt-4 text-[16px] font-bold text-ink">{name}</h3>
            <p className="mt-3 text-[28px] font-bold tracking-[-0.6px] text-ink">{price}</p>
            <p className="mt-2 text-[13px] text-ink-2">{meta}</p>
            <Button className="mt-5 w-full rounded-xl" variant={index === 1 ? "gold" : "outline"}>Select bid</Button>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function FormPanel({ kind }: { kind: UnifiedPageKind }) {
  const fields = kind === "awb"
    ? ["Shipper", "Consignee", "Cargo description", "Gross weight", "Volume"]
    : kind === "profile"
      ? ["Company name", "Capabilities", "Service routes", "Badges", "Directory visibility"]
      : ["Origin", "Destination", "Cargo type", "Weight / CBM", "Services needed"]
  return (
    <Card className="rounded-[16px] border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.055)]">
      <CardContent className="grid gap-4 p-6 lg:grid-cols-[.8fr_1.2fr]">
        <div>
          <Badge variant="gold">Guided flow</Badge>
          <h2 className="mt-4 text-[22px] font-bold tracking-[-0.4px] text-ink">Step 2 of 4</h2>
          <p className="mt-2 text-[13px] leading-6 text-ink-2">Use dropdown options where possible. Free text is reserved for company name, notes and special cargo instructions.</p>
        </div>
        <div className="grid gap-3">
          {fields.map((field, index) => (
            <label key={field} className="block">
              <span className="text-[12px] font-semibold text-ink-2">{field}</span>
              <div className="mt-1.5 flex h-11 items-center justify-between rounded-xl border border-line bg-white px-3 text-[13px] text-ink transition focus-within:border-navy hover:border-[#cbd3df]">
                <span>{index < 3 ? "Select option" : "Enter details"}</span>
                <ChevronRight className="h-4 w-4 text-ink-3" />
              </div>
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function OrderPanel({ id }: { id?: string }) {
  const steps = ["Confirmed", "Shipment booked", "In transit", "Arrived HK", "Customs cleared", "Delivered"]
  return (
    <Card className="rounded-[16px] border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.055)]">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="gold">Order {id || "MATCH-1234"}</Badge>
            <h2 className="mt-3 text-[22px] font-bold text-ink">Pipeline and missing work</h2>
          </div>
          <Button variant="outline" className="rounded-xl">Responsibility record</Button>
        </div>
        <div className="mt-6 grid gap-3 md:grid-cols-6">
          {steps.map((step, index) => (
            <div key={step} className="relative rounded-xl border border-line bg-canvas p-3">
              <CheckCircle2 className={`h-4 w-4 ${index < 3 ? "text-emerald" : "text-ink-3"}`} />
              <p className="mt-3 text-[12px] font-semibold text-ink">{step}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {["Packing List missing", "AWB draft waiting", "Partner message unread"].map((item) => (
            <div key={item} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-800">{item}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function AdminPanel({ kind }: { kind: UnifiedPageKind }) {
  const rows = kind === "admin-payments"
    ? ["FPS proof · HKD 1,500", "Bank transfer · HKD 500", "Stripe webhook retry"]
    : kind === "admin-accounts"
      ? ["Pacific Forward Ltd. · Premium", "HarbourLink Cargo · Standard", "VN Export Co. · Client"]
      : ["SR-2026-00124 · pending review", "Forwarder verification · documents ready", "Cancellation review · cooling-off"]
  return (
    <Card className="rounded-[16px] border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.055)]">
      <CardContent className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="gold">Admin queue</Badge>
            <h2 className="mt-3 text-[22px] font-bold text-ink">Review with reason and audit trail</h2>
          </div>
          <Button className="rounded-xl bg-navy">Open record</Button>
        </div>
        <div className="mt-5 grid gap-3">
          {rows.map((row) => (
            <div key={row} className="grid gap-3 rounded-xl border border-line bg-canvas p-4 md:grid-cols-[1fr_auto_auto] md:items-center">
              <span className="text-[14px] font-semibold text-ink">{row}</span>
              <span className="text-[12px] text-ink-3">Requires note</span>
              <Button variant="outline" size="sm" className="rounded-lg">Review</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function DemoRow({ row, prefix }: { row: PageConfig["rows"][number]; prefix: string }) {
  return (
    <Link href={`${prefix}${row.href || "/demo-cases"}`} className="group flex items-center gap-4 rounded-[14px] border border-line bg-white p-4 shadow-[0_8px_20px_rgba(12,26,62,.035)] transition hover:-translate-y-0.5 hover:border-[#cbd3df] hover:shadow-[0_14px_28px_rgba(12,26,62,.075)]">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-canvas text-navy"><row.icon className="h-[18px] w-[18px]" /></span>
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-[14px] text-ink">{row.title}</strong>
        <span className="mt-1 block truncate text-[12px] text-ink-3">{row.meta}</span>
      </span>
      <span className="text-[12px] font-bold text-emerald">{row.tag}</span>
      <ChevronRight className="h-4 w-4 text-line transition group-hover:translate-x-0.5 group-hover:text-ink-3" />
    </Link>
  )
}

function ActivityCard({ items }: { items: PageConfig["activity"] }) {
  return (
    <Card className="rounded-[16px] border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.055)]">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[14px] font-bold text-ink">Activity</h2>
          <span className="text-[12px] font-semibold text-navy">All</span>
        </div>
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.title} className="flex gap-3">
              <span className={`grid h-8 w-8 place-items-center rounded-full border ${item.tone === "green" ? "border-emerald/25 bg-emerald-soft text-emerald" : item.tone === "gold" ? "border-gold-border bg-gold-soft text-gold-dark" : "border-line bg-canvas text-navy"}`}>
                <item.icon className="h-4 w-4" />
              </span>
              <span>
                <strong className="block text-[13px] text-ink">{item.title}</strong>
                <span className="mt-0.5 block text-[12px] leading-5 text-ink-3">{item.meta}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function CaseChecklist({ kind }: { kind: UnifiedPageKind }) {
  const states = ["Default data", "Empty state", "Loading state", "Error / permission", "Mobile layout"]
  return (
    <Card className="rounded-[16px] border-line bg-white shadow-[0_12px_32px_rgba(12,26,62,.055)]">
      <CardContent className="p-5">
        <h2 className="text-[14px] font-bold text-ink">Cases to inspect</h2>
        <p className="mt-2 text-[12px] leading-5 text-ink-3">This page follows the Figma demo language. Use this checklist before reconnecting production logic.</p>
        <div className="mt-4 space-y-2">
          {states.map((state, index) => (
            <div key={state} className="flex items-center gap-2 text-[12.5px] text-ink-2">
              <CheckCircle2 className={`h-4 w-4 ${index < 2 ? "text-emerald" : "text-ink-3"}`} />
              {state}
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-xl border border-line bg-canvas px-3 py-2 text-[11px] text-ink-3">Route kind: {kind}</p>
      </CardContent>
    </Card>
  )
}

function primaryHref(prefix: string, kind: UnifiedPageKind) {
  if (kind === "dashboard" || kind === "requests") return `${prefix}/inquiries/new`
  if (kind === "marketplace" || kind === "active-bids") return `${prefix}/marketplace/SR-DEMO-001`
  if (kind === "orders") return `${prefix}/orders/MATCH-1234`
  if (kind === "forwarders") return `${prefix}/forwarders/pacific-forward`
  if (kind.startsWith("admin")) return `${prefix}/admin`
  if (kind === "tokens") return `${prefix}/tokens`
  if (kind === "subscription") return `${prefix}/subscription`
  return `${prefix}/demo-cases`
}
