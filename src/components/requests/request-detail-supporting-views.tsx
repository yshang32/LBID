"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  Box,
  Check,
  CheckCircle2,
  Circle,
  CircleHelp,
  Clock3,
  Download,
  FileArchive,
  FileCheck2,
  FileText,
  Filter,
  LockKeyhole,
  PackageCheck,
  Plane,
  Search,
  ShieldCheck,
  Ship,
  Truck,
  UploadCloud,
} from "lucide-react"

import { RequestRouteMap } from "@/components/shipment-requests/request-route-map"
import type { Locale } from "@/lib/i18n"

type JsonRecord = Record<string, any>
export type RequestSupportingTab = "transit" | "terms" | "documents" | "messages" | "activity"

type Props = {
  tab: RequestSupportingTab
  request: JsonRecord
  selectedBid: JsonRecord | null
  bidCount: number
  sealed: boolean
  now: number
  linkedOrder: JsonRecord | null
  locale: Locale
}

export function RequestSupportingWorkspace(props: Props) {
  return (
    <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_286px]">
      <div className="min-w-0">
        {props.tab === "transit" ? <TransitView {...props} /> : null}
        {props.tab === "terms" ? <TermsView {...props} /> : null}
        {props.tab === "documents" ? <DocumentsView {...props} /> : null}
        {props.tab === "messages" ? <MessagesView {...props} /> : null}
        {props.tab === "activity" ? <ActivityView {...props} /> : null}
      </div>
      <SupportingSidebar {...props} />
    </div>
  )
}

function TransitView({ request, selectedBid, linkedOrder }: Props) {
  const cargo = request.cargo_details || {}
  const route = request.route || {}
  const mode = freightMode(cargo)
  const pickup = request.deadline || request.created_at
  const awarded = request.status === "AWARDED"
  const milestones = [
    { label: "Request ready", date: request.created_at, icon: Box, done: true },
    { label: "Bidding closes", date: request.bid_deadline, icon: LockKeyhole, done: request.status !== "OPEN" },
    { label: "Partner awarded", date: awarded ? linkedOrder?.created_at || request.bid_deadline : undefined, icon: CheckCircle2, done: awarded },
    { label: "Pickup", date: awarded ? pickup : undefined, icon: Truck, done: false },
    { label: "In transit", date: undefined, icon: mode === "Sea" ? Ship : Plane, done: false },
    { label: "Delivered", date: undefined, icon: PackageCheck, done: false },
  ]
  const routeOrigin = pointFor(route, "origin")
  const routeDestination = pointFor(route, "destination")
  const estimatedTransit = selectedBid?.transit_time || estimateTransit(Number(route.distance_km || 0), mode)

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeading title="Estimated transit timeline" helper={awarded ? "Award confirmed" : "Indicative until a partner is awarded"} />
        <div className="mt-6 overflow-x-auto pb-2">
          <div className="flex min-w-[760px] items-start">
            {milestones.map((item, index) => {
              const Icon = item.icon
              return <div key={item.label} className="flex min-w-0 flex-1 items-start"><div className="min-w-[98px] flex-1 text-center"><span className={`mx-auto grid h-11 w-11 place-items-center rounded-full border ${item.done ? "border-[#a9dec5] bg-[#edf9f2] text-[#168a55]" : index === milestones.findIndex((entry) => !entry.done) ? "border-[#a8c5e8] bg-[#eef6ff] text-[#246bb7]" : "border-[#e4e7eb] bg-[#fafbfc] text-[#8994a4]"}`}><Icon className="h-4 w-4" /></span><p className="mt-2 text-[10px] font-semibold text-[#26354e]">{item.label}</p><p className="mt-1 text-[8.5px] text-[#8a95a5]">{item.date ? formatDate(item.date, false) : "Pending"}</p></div>{index < milestones.length - 1 ? <span className={`mt-[22px] h-px min-w-5 flex-1 ${item.done ? "bg-[#66b893]" : "border-t border-dashed border-[#bdc5d0]"}`} /> : null}</div>
            })}
          </div>
        </div>
        <div className="mt-5 grid overflow-hidden rounded-[10px] border border-[#e7e9ed] bg-[#fafbfc] sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Route distance" value={route.distance_km ? `${Number(route.distance_km).toLocaleString()} km` : "Calculated by route"} />
          <Metric label="Estimated transit" value={estimatedTransit} />
          <Metric label="Freight mode" value={`${mode} Freight`} />
          <Metric label="Requested pickup" value={formatDate(pickup, false)} />
          <Metric label="Schedule status" value={awarded ? "Confirm in order" : "Indicative"} />
        </div>
      </Panel>

      <Panel>
        <PanelHeading title="Schedule plan" helper="LBID lifecycle and estimated logistics milestones" />
        <div className="mt-4 overflow-x-auto rounded-[10px] border border-[#e5e8ed]">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead className="bg-[#f8f9fb] text-[8.5px] font-bold uppercase tracking-[0.06em] text-[#8792a3]"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">Stage</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Target</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody>{[
              ["1", "Request and bidding", routeOrigin?.code || "Origin", request.bid_deadline, "LBID bidding window", request.status === "OPEN" ? "In progress" : "Completed"],
              ["2", "Partner award", `${routeOrigin?.code || "Origin"} to ${routeDestination?.code || "Destination"}`, linkedOrder?.created_at, "Agency selection", awarded ? "Completed" : "Pending"],
              ["3", `${mode} freight`, `${routeOrigin?.code || "Origin"} to ${routeDestination?.code || "Destination"}`, undefined, "Confirmed after award", "Pending"],
              ["4", "Destination delivery", routeDestination?.code || "Destination", undefined, "Order workspace", "Pending"],
            ].map((row) => <tr key={row[0]} className="border-t border-[#e8ebef] text-[10px] text-[#536077]"><td className="px-4 py-3 text-[#8b95a4]">{row[0]}</td><td className="px-4 py-3 font-semibold text-[#273650]">{row[1]}</td><td className="px-4 py-3">{row[2]}</td><td className="px-4 py-3">{row[3] ? formatDate(String(row[3]), true) : "To be confirmed"}</td><td className="px-4 py-3">{row[4]}</td><td className="px-4 py-3"><StatusPill value={String(row[5])} /></td></tr>)}</tbody>
          </table>
        </div>
        {!awarded ? <Notice icon={Clock3} title="Schedule protection" body="Exact carrier, service number and operating schedule are only confirmed after an award. This prevents assumptions from being presented as booked transport." /> : null}
      </Panel>

      <Panel>
        <PanelHeading title="Route map" helper="Interactive map based on the verified request locations" />
        <div className="mt-4"><RequestRouteMap origin={routeOrigin} destination={routeDestination} mode={mode} /></div>
      </Panel>
    </div>
  )
}

const TERM_SECTIONS = [
  ["general", "1. General", "These conditions govern LBID's request, sealed-bidding and award workflow for this shipment request."],
  ["scope", "2. Scope of service", "The request describes the required logistics scope. A forwarder's accepted quotation and the resulting order record define the awarded service."],
  ["responsibility", "3. Responsibilities", "The requester must provide accurate cargo information. The awarded forwarder is responsible for the transport services it accepts."],
  ["pricing", "4. Pricing and payment", "Bids are sealed and binding for the stated validity period. LBID highlights the lowest valid quote but does not force the requester to select it."],
  ["delivery", "5. Transit and delivery", "Transit times before award are estimates. Confirmed schedules, milestones and exceptions are recorded in the order workspace."],
  ["insurance", "6. Insurance", "Cargo insurance is only included when explicitly listed in the accepted quotation or service scope."],
  ["compliance", "7. Compliance", "Both parties remain responsible for customs, sanctions, dangerous-goods and local regulatory compliance applicable to their role."],
  ["liability", "8. Claims and liability", "LBID is a workflow platform and is not the carrier of record. Claims relating to transport performance are handled between the order parties."],
  ["confidentiality", "9. Confidentiality", "Bid prices, bidder identities and contact details remain confidential until the relevant reveal or award event."],
  ["cancellation", "10. Cancellation", "Award cancellation may trigger a cooling-off review and creates an immutable responsibility record."],
  ["audit", "11. Audit record", "Critical request, award, payment and order changes are timestamped for operational and legal traceability."],
] as const

function TermsView({ request, selectedBid }: Props) {
  const [mode, setMode] = useState<"request" | "forwarder">("request")
  const [section, setSection] = useState<(typeof TERM_SECTIONS)[number][0]>(TERM_SECTIONS[0][0])
  const active = TERM_SECTIONS.find((item) => item[0] === section) || TERM_SECTIONS[0]
  const cargo = request.cargo_details || {}

  function downloadTerms() {
    const forwarder = selectedBid?.terms ? `\n\nFORWARDER TERMS\n${selectedBid.terms}` : ""
    const content = `LBID REQUEST TERMS\nRequest: SR-${shortId(request.id)}\nPlatform role: workflow_platform_not_carrier_of_record\n\n${TERM_SECTIONS.map((item) => `${item[1]}\n${item[2]}`).join("\n\n")}${forwarder}`
    downloadBlob(content, `LBID-SR-${shortId(request.id)}-terms.txt`, "text/plain;charset=utf-8")
  }

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><PanelHeading title="Terms & conditions overview" helper="Operational rules attached to this request and its eventual award" /><button type="button" onClick={downloadTerms} className={secondaryButton}><Download className="h-3.5 w-3.5" />Download terms</button></div>
      <div className="mt-4 inline-flex rounded-[8px] border border-[#e1e5eb] bg-[#f8f9fb] p-1"><button type="button" onClick={() => setMode("request")} className={segment(mode === "request")}>Request & platform terms</button><button type="button" onClick={() => setMode("forwarder")} className={segment(mode === "forwarder")}>Selected quote terms</button></div>
      {mode === "request" ? (
        <div className="mt-4 grid overflow-hidden rounded-[10px] border border-[#e5e8ed] lg:grid-cols-[228px_minmax(0,1fr)]">
          <nav aria-label="Terms sections" className="border-b border-[#e7eaee] bg-[#fafbfc] p-2 lg:border-b-0 lg:border-r"><p className="px-3 py-2 text-[8.5px] font-bold uppercase tracking-[0.07em] text-[#8a95a5]">Sections</p>{TERM_SECTIONS.map((item) => <button key={item[0]} type="button" onClick={() => setSection(item[0])} className={`w-full rounded-[6px] border-l-2 px-3 py-2.5 text-left text-[9.5px] transition ${section === item[0] ? "border-[#cf8418] bg-white font-semibold text-[#26354e] shadow-sm" : "border-transparent text-[#647187] hover:bg-white hover:text-[#26354e]"}`}>{item[1]}</button>)}</nav>
          <article className="min-h-[470px] p-6 sm:p-8"><div className="flex flex-col gap-2 border-b border-[#eceff3] pb-5 sm:flex-row sm:items-center sm:justify-between"><h3 className="text-[16px] font-bold text-[#172944]">{active[1]}</h3><span className="text-[9px] text-[#8993a3]">Applies to SR-{shortId(request.id)}</span></div><p className="mt-5 max-w-3xl text-[11px] leading-6 text-[#59677c]">{active[2]}</p><h4 className="mt-7 text-[11px] font-bold text-[#26354e]">Application to this request</h4><dl className="mt-3 grid gap-3 rounded-[9px] border border-[#e7e9ed] bg-[#fafbfc] p-4 sm:grid-cols-2"><Definition label="Incoterm" value={cargo.incoterm || "Not supplied"} /><Definition label="Platform role" value="Workflow platform, not carrier" /><Definition label="Contact release" value="After award only" /><Definition label="Award model" value="Lowest highlighted; requester decides" /></dl><Notice icon={ShieldCheck} title="Sealed-bid fairness" body="No participant can view a competitor's price, identity or private terms while the bid window is open." /></article>
        </div>
      ) : (
        <div className="mt-4 min-h-[470px] rounded-[10px] border border-[#e5e8ed] bg-[#fafbfc] p-6"><h3 className="text-[15px] font-bold text-[#172944]">Selected forwarder terms</h3>{selectedBid ? <><p className="mt-2 text-[10px] text-[#7d899b]">Terms become part of the order record only after you award this quotation.</p><div className="mt-5 rounded-[9px] border border-[#e2e6ec] bg-white p-5 text-[11px] leading-6 text-[#56647a]">{selectedBid.terms || "The forwarder did not add special terms to this quotation."}</div></> : <EmptyInline icon={LockKeyhole} title="No quotation selected" body="Forwarder-specific terms remain unavailable until bidding closes and you select a quotation for review." />}</div>
      )}
      <Notice icon={FileCheck2} title="Important notice" body="Launching a request records acceptance of the platform and request terms. Awarding a bid records the selected quotation and any forwarder-specific terms." />
    </Panel>
  )
}

function DocumentsView({ request, linkedOrder, locale }: Props) {
  const [query, setQuery] = useState("")
  const [kind, setKind] = useState("all")
  const attachments = attachmentRecords(request)
  const filtered = attachments.filter((file) => (kind === "all" || file.kind === kind) && file.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><PanelHeading title="Request document library" helper="Files supplied with the shipment brief" />{linkedOrder ? <Link href={`/${locale}/orders/${linkedOrder.id}/documents`} className={primaryButton}>Open order documents<ArrowRight className="h-3.5 w-3.5" /></Link> : null}</div>
      <div className="mt-5 flex flex-col gap-3 border-b border-[#eceff3] pb-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex flex-wrap gap-2"><FilterChip active={kind === "all"} onClick={() => setKind("all")}>All files <span>{attachments.length}</span></FilterChip><FilterChip active={kind === "cargo"} onClick={() => setKind("cargo")}>Cargo files <span>{attachments.filter((file) => file.kind === "cargo").length}</span></FilterChip><FilterChip active={kind === "document"} onClick={() => setKind("document")}>Shipment documents <span>{attachments.filter((file) => file.kind === "document").length}</span></FilterChip></div><label className="relative w-full lg:w-[260px]"><span className="sr-only">Search documents</span><Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b95a4]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents..." className="h-10 w-full rounded-[8px] border border-[#dfe4ec] bg-white pl-9 pr-3 text-[10.5px] outline-none transition placeholder:text-[#9aa4b2] focus:border-[#c1841b] focus:ring-4 focus:ring-[#c58a18]/10" /></label></div>
      {filtered.length ? <div className="mt-4 overflow-x-auto rounded-[10px] border border-[#e5e8ed]"><table className="w-full min-w-[680px] border-collapse text-left"><thead className="bg-[#f8f9fb] text-[8.5px] font-bold uppercase tracking-[0.06em] text-[#8792a3]"><tr><th className="px-4 py-3">Document name</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">File size</th><th className="px-4 py-3">Availability</th></tr></thead><tbody>{filtered.map((file) => <tr key={file.id} className="border-t border-[#e8ebef] text-[10px]"><td className="px-4 py-3"><span className="flex items-center gap-3"><span className={`grid h-8 w-8 place-items-center rounded-[7px] ${file.kind === "cargo" ? "bg-[#eef4ff] text-[#2d6fc6]" : "bg-[#eef8f3] text-[#168a55]"}`}><FileText className="h-4 w-4" /></span><strong className="text-[#26354e]">{file.name}</strong></span></td><td className="px-4 py-3 text-[#657287]">{file.kind === "cargo" ? "Cargo attachment" : "Request document"}</td><td className="px-4 py-3 text-[#657287]">{formatBytes(file.size)}</td><td className="px-4 py-3"><span className="rounded-full bg-[#fff3df] px-2 py-1 text-[8.5px] font-semibold text-[#a86b13]">Metadata recorded</span></td></tr>)}</tbody></table></div> : <EmptyInline icon={FileArchive} title="No matching request files" body={attachments.length ? "Adjust the search or category filter." : "No optional files were attached when this request was launched."} />}
      <div className="mt-4 flex min-h-[112px] items-center justify-center rounded-[10px] border border-dashed border-[#d7dde6] bg-[#fafbfc] px-5 text-center"><div><UploadCloud className="mx-auto h-6 w-6 text-[#758299]" /><p className="mt-2 text-[10.5px] font-semibold text-[#425169]">Request files are locked after launch</p><p className="mt-1 text-[9.5px] text-[#8993a3]">Awarded parties upload AWB, B/L, invoice and packing documents in the secure order workspace.</p></div></div>
    </Panel>
  )
}

function MessagesView({ request, linkedOrder, locale, bidCount, sealed }: Props) {
  const events = lifecycleEvents(request, bidCount)
  return (
    <Panel>
      <PanelHeading title="Secure request messages" helper="Communication follows the sealed-bid privacy boundary" />
      <div className="mt-5 grid min-h-[500px] overflow-hidden rounded-[10px] border border-[#e3e7ed] lg:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="border-b border-[#e7eaee] bg-[#fafbfc] lg:border-b-0 lg:border-r"><div className="border-b border-[#e7eaee] p-4"><p className="text-[10.5px] font-bold text-[#273650]">Channels</p></div><div className="p-2"><button type="button" className="flex w-full items-start gap-3 rounded-[8px] bg-white p-3 text-left shadow-sm"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#eaf1fb] text-[#285f9f]"><ShieldCheck className="h-4 w-4" /></span><span><strong className="block text-[10.5px] text-[#273650]">LBID system updates</strong><small className="mt-1 block text-[8.5px] leading-4 text-[#8993a3]">Request and bidding lifecycle</small></span></button><div className="mt-2 flex items-start gap-3 rounded-[8px] p-3 opacity-70"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[#f1f3f6] text-[#788497]"><LockKeyhole className="h-4 w-4" /></span><span><strong className="block text-[10.5px] text-[#536177]">Partner conversation</strong><small className="mt-1 block text-[8.5px] leading-4 text-[#8993a3]">{linkedOrder ? "Available in the order workspace" : "Unlocks after award"}</small></span></div></div></aside>
        <div className="flex min-w-0 flex-col"><header className="flex items-center justify-between gap-3 border-b border-[#e7eaee] px-5 py-4"><div><p className="text-[11.5px] font-bold text-[#26354e]">LBID system</p><p className="mt-0.5 text-[8.5px] text-[#8993a3]">Private operational updates</p></div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf7ef] px-2.5 py-1 text-[8.5px] font-semibold text-[#168a55]"><span className="h-1.5 w-1.5 rounded-full bg-[#168a55]" />Active</span></header><div className="flex-1 space-y-3 bg-[linear-gradient(180deg,#fff,#fbfcfd)] p-5">{events.slice(0, 4).map((event) => <div key={event.id} className="max-w-[620px] rounded-[10px] border border-[#e3e7ed] bg-white p-4 shadow-[0_6px_18px_rgba(30,43,70,0.04)]"><p className="text-[9px] text-[#8993a3]">{formatDate(event.at, true)}</p><p className="mt-1.5 text-[10.5px] font-semibold text-[#26354e]">{event.action}</p><p className="mt-1 text-[9.5px] leading-5 text-[#657287]">{event.detail}</p></div>)}</div><footer className="border-t border-[#e7eaee] p-4">{linkedOrder ? <Link href={`/${locale}/orders/${linkedOrder.id}/messages`} className={`${primaryButton} w-full justify-center`}>Open secure order conversation<ArrowRight className="h-3.5 w-3.5" /></Link> : <div className="flex items-start gap-3 rounded-[9px] border border-[#e2e6ec] bg-[#f8fafc] p-3"><LockKeyhole className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#68768b]" /><div><p className="text-[10px] font-semibold text-[#405069]">Direct messaging is locked</p><p className="mt-1 text-[9px] leading-4 text-[#8993a3]">{sealed ? "Forwarder identities remain anonymous during sealed bidding." : "Award a valid bid to create a private order conversation."}</p></div></div>}</footer></div>
      </div>
    </Panel>
  )
}

function ActivityView({ request, bidCount }: Props) {
  const [filter, setFilter] = useState("all")
  const events = lifecycleEvents(request, bidCount)
  const visible = events.filter((event) => filter === "all" || event.type === filter)

  function exportEvents() {
    const csv = ["Time,Category,Action,Details", ...events.map((event) => [event.at, event.type, event.action, event.detail].map(csvCell).join(","))].join("\n")
    downloadBlob(csv, `LBID-SR-${shortId(request.id)}-activity.csv`, "text/csv;charset=utf-8")
  }

  return (
    <Panel>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><PanelHeading title="All activities" helper={`${events.length} verified lifecycle events`} /></div><div className="flex gap-2"><label className="relative"><span className="sr-only">Filter activity</span><Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#7d899a]" /><select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 appearance-none rounded-[8px] border border-[#dfe4ec] bg-white pl-9 pr-8 text-[9.5px] font-semibold text-[#536177] outline-none focus:border-[#c1841b]"><option value="all">All activities</option><option value="request">Request</option><option value="bidding">Bidding</option><option value="award">Award</option></select></label><button type="button" onClick={exportEvents} className={secondaryButton}><Download className="h-3.5 w-3.5" />Export</button></div></div>
      <div className="mt-5 overflow-x-auto rounded-[10px] border border-[#e5e8ed]"><table className="w-full min-w-[760px] border-collapse text-left"><thead className="bg-[#f8f9fb] text-[8.5px] font-bold uppercase tracking-[0.06em] text-[#8792a3]"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Details</th><th className="px-4 py-3">Category</th></tr></thead><tbody>{visible.map((event) => <tr key={event.id} className="border-t border-[#e8ebef] text-[9.5px]"><td className="px-4 py-3 text-[#718095]">{formatDate(event.at, true)}</td><td className="px-4 py-3"><span className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#fff2df] text-[8px] font-bold text-[#a96913]">{event.actor === "LBID system" ? "LB" : "RQ"}</span><span className="font-semibold text-[#334158]">{event.actor}</span></span></td><td className="px-4 py-3 font-semibold text-[#26354e]">{event.action}</td><td className="px-4 py-3 leading-5 text-[#657287]">{event.detail}</td><td className="px-4 py-3"><span className="rounded-full bg-[#f0f3f7] px-2 py-1 text-[8px] font-semibold capitalize text-[#59677c]">{event.type}</span></td></tr>)}</tbody></table></div>
      {!visible.length ? <EmptyInline icon={Filter} title="No matching activities" body="Choose another activity category." /> : null}
      <Notice icon={ShieldCheck} title="Privacy-aware audit trail" body="During sealed bidding the log records the number of responses, but never exposes a bidder's identity, price or private terms." />
    </Panel>
  )
}

function SupportingSidebar({ tab, request, bidCount, sealed, now, linkedOrder, locale }: Props) {
  const cargo = request.cargo_details || {}
  const readiness = requestReadiness(request)
  const attachments = attachmentRecords(request)
  const activityCounts = lifecycleEvents(request, bidCount).reduce((counts, event) => ({ ...counts, [event.type]: (counts[event.type] || 0) + 1 }), {} as Record<string, number>)
  return <aside className="space-y-4"><SidePanel title={tab === "transit" ? "Transit summary" : tab === "terms" ? "Request summary" : tab === "documents" ? "Document summary" : tab === "messages" ? "Request details" : "Activity summary"}>{tab === "documents" ? <><SideRow label="Total request files" value={String(attachments.length)} /><SideRow label="Cargo files" value={String(attachments.filter((item) => item.kind === "cargo").length)} /><SideRow label="Shipment documents" value={String(attachments.filter((item) => item.kind === "document").length)} /><SideRow label="Storage" value="Order workspace after award" /></> : tab === "activity" ? <><SideRow label="Request events" value={String(activityCounts.request || 0)} /><SideRow label="Bidding events" value={String(activityCounts.bidding || 0)} /><SideRow label="Award events" value={String(activityCounts.award || 0)} /><SideRow label="Audit policy" value="Privacy aware" /></> : <><SideRow label="Origin" value={locationLabel(request.route, "origin")} /><SideRow label="Destination" value={locationLabel(request.route, "destination")} /><SideRow label="Cargo" value={cargoName(cargo)} /><SideRow label="Mode / Incoterm" value={`${freightMode(cargo)} / ${cargo.incoterm || "-"}`} /><SideRow label="Bidding window" value={sealed ? countdown(request.bid_deadline, now) : request.status || "Closed"} accent={sealed} /></>}</SidePanel>
    {tab === "messages" ? <SidePanel title="Participants"><Participant icon="RQ" label="Requester company" helper="Request owner" /><Participant icon="LB" label="LBID system" helper="Workflow notifications" /><Participant icon={<LockKeyhole className="h-3.5 w-3.5" />} label={linkedOrder ? "Awarded partner" : `${bidCount} qualified responder${bidCount === 1 ? "" : "s"}`} helper={linkedOrder ? "Available in order workspace" : "Identity protected"} /></SidePanel> : null}
    {tab === "transit" ? <SidePanel title="Shipment progress"><ProgressRow done label="Request created" /><ProgressRow done={request.status !== "OPEN"} active={request.status === "OPEN"} label="Sealed bidding" /><ProgressRow done={request.status === "AWARDED"} label="Partner award" /><ProgressRow label="Shipment in transit" /><ProgressRow label="Delivered" /></SidePanel> : null}
    {tab === "terms" ? <SidePanel title="Terms status"><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full border-[6px] border-[#d7efe3] text-[13px] font-bold text-[#168a55]">100%</span><div><p className="text-[10.5px] font-bold text-[#26354e]">Published</p><p className="mt-1 text-[8.5px] leading-4 text-[#8993a3]">Terms recorded when the request launched.</p></div></div><div className="mt-4 flex items-center gap-2 text-[9px] text-[#168a55]"><CheckCircle2 className="h-3.5 w-3.5" />Platform terms acknowledged</div></SidePanel> : null}
    {tab !== "terms" && tab !== "documents" ? <SidePanel title="Request readiness"><div className="flex items-center gap-3"><span className="grid h-14 w-14 place-items-center rounded-full border-[6px] border-[#ead3aa] text-[13px] font-bold text-[#a96b12]">{readiness}%</span><div><p className="text-[10.5px] font-bold text-[#26354e]">{readiness >= 80 ? "Very good" : "Almost there"}</p><p className="mt-1 text-[8.5px] text-[#8993a3]">Structured request data</p></div></div></SidePanel> : null}
    {linkedOrder ? <SidePanel title="Awarded order"><p className="text-[9.5px] leading-5 text-[#69768a]">Documents, direct messages and confirmed tracking now live in the secure order workspace.</p><Link href={`/${locale}/orders/${linkedOrder.id}`} className={`${secondaryButton} mt-4 w-full justify-center`}>Open order workspace<ArrowRight className="h-3.5 w-3.5" /></Link></SidePanel> : null}
    <SidePanel title="Need help?"><div className="flex items-start gap-3"><CircleHelp className="mt-0.5 h-4 w-4 text-[#56657b]" /><div><p className="text-[9.5px] leading-5 text-[#7a8698]">Contact LBID support about this request.</p><Link href={`/${locale}/workflow`} className="mt-2 inline-flex items-center gap-1 text-[9.5px] font-semibold text-[#9d650f]">Help Center<ArrowRight className="h-3 w-3" /></Link></div></div></SidePanel>
  </aside>
}

function Panel({ children }: { children: React.ReactNode }) { return <section className="rounded-[13px] border border-[#e4e7ed] bg-white p-5 shadow-[0_10px_28px_rgba(30,43,70,0.045)] sm:p-6">{children}</section> }
function PanelHeading({ title, helper }: { title: string; helper: string }) { return <div><h2 className="text-[14px] font-bold text-[#172944]">{title}</h2><p className="mt-1 text-[9.5px] leading-5 text-[#7c889a]">{helper}</p></div> }
function SidePanel({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-[13px] border border-[#e5e8ed] bg-white p-5 shadow-[0_10px_28px_rgba(30,43,70,0.04)]"><h3 className="text-[10.5px] font-bold text-[#26354e]">{title}</h3><div className="mt-4 space-y-3">{children}</div></section> }
function SideRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div className="flex items-start justify-between gap-3 text-[9px]"><span className="text-[#7b8799]">{label}</span><strong className={`max-w-[58%] text-right leading-4 ${accent ? "text-[#bd6f10]" : "text-[#26354e]"}`}>{value}</strong></div> }
function Metric({ label, value }: { label: string; value: string }) { return <div className="border-b border-[#e7e9ed] px-4 py-3 last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0"><p className="text-[8px] font-medium text-[#8a95a5]">{label}</p><p className="mt-1 text-[10.5px] font-bold text-[#26354e]">{value}</p></div> }
function Definition({ label, value }: { label: string; value: string }) { return <div><dt className="text-[8.5px] text-[#8a95a5]">{label}</dt><dd className="mt-1 text-[10px] font-semibold text-[#334159]">{value}</dd></div> }
function Notice({ icon: Icon, title, body }: { icon: typeof Clock3; title: string; body: string }) { return <div className="mt-5 flex items-start gap-3 rounded-[9px] border border-[#eadabe] bg-[#fffaf1] p-4"><Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#bd7912]" /><div><p className="text-[9.5px] font-bold text-[#a8660f]">{title}</p><p className="mt-1 text-[9px] leading-5 text-[#7a7063]">{body}</p></div></div> }
function EmptyInline({ icon: Icon, title, body }: { icon: typeof LockKeyhole; title: string; body: string }) { return <div className="my-7 grid min-h-[220px] place-items-center px-5 text-center"><div><span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-[#eef1f5] text-[#657287]"><Icon className="h-5 w-5" /></span><p className="mt-3 text-[11.5px] font-bold text-[#26354e]">{title}</p><p className="mx-auto mt-1 max-w-sm text-[9.5px] leading-5 text-[#8490a2]">{body}</p></div></div> }
function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" onClick={onClick} className={`inline-flex h-9 items-center gap-2 rounded-[7px] border px-3 text-[9.5px] font-semibold transition ${active ? "border-[#e3c38e] bg-[#fff6e8] text-[#a96810]" : "border-[#e0e5eb] bg-white text-[#657287] hover:bg-[#f8f9fb]"}`}>{children}</button> }
function StatusPill({ value }: { value: string }) { const done = value === "Completed"; const progress = value === "In progress"; return <span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${done ? "bg-[#eaf7ef] text-[#168a55]" : progress ? "bg-[#eaf3ff] text-[#2569b8]" : "bg-[#fff3df] text-[#aa6b12]"}`}>{value}</span> }
function Participant({ icon, label, helper }: { icon: React.ReactNode; label: string; helper: string }) { return <div className="flex items-center gap-3 border-t border-[#edf0f3] pt-3 first:border-0 first:pt-0"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#f0f3f7] text-[8px] font-bold text-[#536177]">{icon}</span><span><strong className="block text-[9.5px] text-[#334159]">{label}</strong><small className="mt-0.5 block text-[8px] text-[#8993a3]">{helper}</small></span></div> }
function ProgressRow({ label, done = false, active = false }: { label: string; done?: boolean; active?: boolean }) { return <div className="flex items-center gap-3 text-[9px]"><span className={`grid h-4 w-4 place-items-center rounded-full ${done ? "bg-[#168a55] text-white" : active ? "bg-[#c58318] text-white" : "border border-[#c8ced7] text-transparent"}`}>{done ? <Check className="h-2.5 w-2.5" /> : active ? <Circle className="h-1.5 w-1.5 fill-current" /> : null}</span><span className={done || active ? "font-semibold text-[#405069]" : "text-[#8993a3]"}>{label}</span></div> }
function segment(active: boolean) { return `rounded-[6px] px-3 py-2 text-[9.5px] font-semibold transition ${active ? "bg-white text-[#a8670d] shadow-sm" : "text-[#657287] hover:text-[#26354e]"}` }

const secondaryButton = "inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#dfe4ec] bg-white px-3.5 text-[9.5px] font-semibold text-[#425169] transition hover:border-[#aeb9c8] hover:bg-[#f9fafb] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#c58a18]/10"
const primaryButton = "inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#102544] px-4 text-[9.5px] font-semibold text-white transition hover:bg-[#19375e] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#173a68]/20"

function pointFor(route: JsonRecord, type: "origin" | "destination") { const coordinates = route?.[`${type}_coordinates`]; if (!Array.isArray(coordinates) || coordinates.length !== 2) return null; return { city: locationName(route, type), code: locationCode(route, type) || "---", coordinates: [Number(coordinates[0]), Number(coordinates[1])] as [number, number] } }
function locationName(route: JsonRecord, type: "origin" | "destination") { const fallback = type === "destination" ? route?.dest : undefined; return route?.[`${type}_city`] || cleanLocation(route?.[type] || fallback) || (type === "origin" ? "Origin" : "Destination") }
function locationCode(route: JsonRecord, type: "origin" | "destination") { return route?.[`${type}_code`] || String(route?.[type] || "").match(/\(([A-Z0-9]{3,5})\)/)?.[1] || "" }
function locationLabel(route: JsonRecord, type: "origin" | "destination") { return `${locationName(route || {}, type)}${locationCode(route || {}, type) ? ` (${locationCode(route || {}, type)})` : ""}` }
function cleanLocation(value?: string) { return String(value || "").split(",")[0].replace(/\s*\([A-Z0-9]{3,5}\)\s*$/, "").trim() }
function freightMode(cargo: JsonRecord): "Air" | "Sea" { return String(cargo?.mode || "").toLowerCase().includes("sea") ? "Sea" : "Air" }
function cargoName(cargo: JsonRecord) { return cargo?.cargo || cargo?.cargo_type || "General Goods" }
function shortId(value?: string) { return String(value || "").slice(0, 8).toUpperCase() || "UNKNOWN" }
function estimateTransit(distance: number, mode: "Air" | "Sea") { if (!distance) return "Confirmed after award"; if (mode === "Air") return distance < 1500 ? "1-2 days" : distance < 6000 ? "2-4 days" : "3-6 days"; return distance < 1500 ? "3-7 days" : distance < 6000 ? "7-16 days" : "14-30 days" }
function formatDate(value?: string, time = true) { if (!value) return "Pending"; const date = new Date(value); if (Number.isNaN(date.getTime())) return "Pending"; return new Intl.DateTimeFormat("en-HK", time ? { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" }).format(date) }
function countdown(deadline: string | undefined, now: number) { const seconds = Math.max(0, Math.floor((new Date(deadline || 0).getTime() - now) / 1000)); const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return hours ? `${hours}h ${minutes}m` : minutes ? `${minutes}m` : "Closed" }
function attachmentRecords(request: JsonRecord) { const value = request?.cargo_details?.attachments; if (!Array.isArray(value)) return []; return value.map((item, index) => typeof item === "string" ? { id: `file-${index}`, name: item, size: 0, kind: "document" } : { id: String(item.id || `file-${index}`), name: String(item.name || `Attachment ${index + 1}`), size: Number(item.size || 0), kind: item.kind === "cargo" ? "cargo" : "document" }) }
function formatBytes(value: number) { if (!value) return "Size not stored"; if (value < 1024) return `${value} B`; if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`; return `${(value / 1024 / 1024).toFixed(1)} MB` }
function requestReadiness(request: JsonRecord) { const cargo = request.cargo_details || {}; const route = request.route || {}; const checks = [Boolean(route.origin && (route.destination || route.dest)), Boolean(request.deadline || request.created_at), Boolean(cargo.cargo || cargo.cargo_type), Boolean(cargo.weight_kg || cargo.cbm || cargo.pieces), Array.isArray(request.services_needed) && request.services_needed.length > 0]; return Math.round((checks.filter(Boolean).length / checks.length) * 100) }
function lifecycleEvents(request: JsonRecord, bidCount: number) { const events = [{ id: "created", at: request.created_at, actor: "Requester", action: "Request created", detail: `SR-${shortId(request.id)} was created with structured cargo and route details.`, type: "request" }, { id: "opened", at: request.created_at, actor: "LBID system", action: "Sealed bidding opened", detail: "Qualified forwarders were invited without receiving competitor identities or prices.", type: "bidding" }]; if (bidCount) events.push({ id: "responses", at: request.created_at, actor: "LBID system", action: `${bidCount} sealed response${bidCount === 1 ? "" : "s"} received`, detail: "Response count recorded. Bidder identities and commercial details remain protected until reveal.", type: "bidding" }); if (request.status !== "OPEN") events.push({ id: "closed", at: request.bid_deadline, actor: "LBID system", action: "Bidding window closed", detail: "Valid quotations became available for agency comparison.", type: "bidding" }); if (request.status === "AWARDED") events.push({ id: "awarded", at: request.bid_deadline, actor: "Requester", action: "Partner awarded", detail: "The selected quotation created an order workspace and responsibility record.", type: "award" }); return events }
function downloadBlob(content: string, filename: string, type: string) { const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0) }
function csvCell(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""')}"` }
