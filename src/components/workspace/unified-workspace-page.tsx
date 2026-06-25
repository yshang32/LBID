"use client"

import Link from "next/link"
import { createElement } from "react"
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
