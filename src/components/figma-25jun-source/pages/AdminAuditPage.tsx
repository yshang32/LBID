import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { motion } from "motion/react";

interface AuditEntry {
  id: string; timestamp: string; actor: string; actorType: "client" | "forwarder" | "admin" | "system";
  event: string; entity: string; entityId: string; details: string;
}

const AUDIT_LOG: AuditEntry[] = [
  { id: "AUD-0098", timestamp: "23 Jun 2026, 14:32", actor: "Admin",             actorType: "admin",     event: "request.approved",     entity: "ShipmentRequest", entityId: "SR-006", details: "Request approved. Bid window opened." },
  { id: "AUD-0097", timestamp: "23 Jun 2026, 14:15", actor: "Kenny Lam",         actorType: "forwarder", event: "bid.submitted",         entity: "Bid",             entityId: "BID-0041", details: "Sealed bid submitted. 1 Token consumed." },
  { id: "AUD-0096", timestamp: "23 Jun 2026, 13:00", actor: "TechFlow HK",       actorType: "client",    event: "request.created",       entity: "ShipmentRequest", entityId: "SR-008", details: "New request created. Status: PENDING_REVIEW." },
  { id: "AUD-0095", timestamp: "23 Jun 2026, 11:45", actor: "Admin",             actorType: "admin",     event: "forwarder.verified",    entity: "CompanyProfile",  entityId: "ACC-007", details: "Forwarder verification approved. IATA cert confirmed." },
  { id: "AUD-0094", timestamp: "23 Jun 2026, 10:00", actor: "System",            actorType: "system",    event: "bid_window.closed",     entity: "ShipmentRequest", entityId: "SR-004", details: "Bid window closed after 3 hours. 6 bids received." },
  { id: "AUD-0093", timestamp: "22 Jun 2026, 16:32", actor: "Apex Sourcing",     actorType: "client",    event: "bid.accepted",          entity: "Order",           entityId: "ORD-0047", details: "Bid accepted. Order created. 24h cooling-off started." },
  { id: "AUD-0092", timestamp: "22 Jun 2026, 15:00", actor: "Admin",             actorType: "admin",     event: "payment.confirmed",     entity: "PaymentIntent",   entityId: "PI-0047", details: "Manual payment confirmed. Premier subscription activated." },
  { id: "AUD-0091", timestamp: "22 Jun 2026, 12:00", actor: "System",            actorType: "system",    event: "token.consumed",        entity: "TokenTransaction",entityId: "TT-0088", details: "1 Token consumed for bid submission via submit_bid_with_token RPC." },
  { id: "AUD-0090", timestamp: "21 Jun 2026, 09:00", actor: "Kenny Lam",         actorType: "forwarder", event: "profile.updated",       entity: "CompanyProfile",  entityId: "ACC-001", details: "Route coverage updated. 2 routes added." },
  { id: "AUD-0089", timestamp: "20 Jun 2026, 14:00", actor: "Admin",             actorType: "admin",     event: "request.rejected",      entity: "ShipmentRequest", entityId: "SR-003", details: "Request rejected. Reason: Incomplete cargo documentation." },
];

const EVENT_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  "request.approved":  { color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20" },
  "request.rejected":  { color: "text-red-600",   bg: "bg-red-50",       border: "border-red-200"    },
  "request.created":   { color: "text-blue-700",  bg: "bg-blue-50",      border: "border-blue-200"   },
  "bid.submitted":     { color: "text-navy",       bg: "bg-navy-soft",    border: "border-navy/20"    },
  "bid.accepted":      { color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20" },
  "forwarder.verified":{ color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20" },
  "payment.confirmed": { color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20" },
  "bid_window.closed": { color: "text-ink-2",     bg: "bg-canvas",       border: "border-line"       },
  "token.consumed":    { color: "text-gold-dark", bg: "bg-gold-soft",    border: "border-gold-border"},
  "profile.updated":   { color: "text-ink-2",     bg: "bg-canvas",       border: "border-line"       },
};

const ACTOR_COLORS: Record<string, string> = {
  admin:     "text-red-600",
  forwarder: "text-navy",
  client:    "text-blue-700",
  system:    "text-ink-3",
};

export function AdminAuditPage() {
  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState("all");

  const eventTypes = ["all", "request", "bid", "payment", "token", "forwarder", "profile", "bid_window"];

  const visible = AUDIT_LOG.filter(e => {
    const matchSearch = !search || e.actor.toLowerCase().includes(search.toLowerCase()) || e.entityId.toLowerCase().includes(search.toLowerCase()) || e.details.toLowerCase().includes(search.toLowerCase());
    const matchEvent  = eventFilter === "all" || e.event.startsWith(eventFilter);
    return matchSearch && matchEvent;
  });

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Audit Trail</h1>
        <p className="text-[14px] text-ink-3">Immutable log of all critical workflow events · {AUDIT_LOG.length} entries</p>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl border border-line
                        focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.07)] transition-all duration-200">
          <Search className="w-4 h-4 text-ink-3 flex-shrink-0" strokeWidth={1.75} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search actor, entity ID or details…"
            className="flex-1 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-ink-3" />
        </div>
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-line">
          <Filter className="w-3.5 h-3.5 text-ink-3 ml-2" strokeWidth={1.75} />
          {eventTypes.map(t => (
            <button key={t} onClick={() => setEventFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-[11.5px] font-medium capitalize transition-all duration-200 cursor-pointer
                ${eventFilter === t ? "bg-navy text-white" : "text-ink-2 hover:bg-navy-soft hover:text-navy"}`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Audit log table */}
      <div className="bg-white rounded-[16px] border border-line overflow-hidden">
        <div className="grid border-b border-line bg-canvas" style={{ gridTemplateColumns: "100px 160px 120px 130px 1fr" }}>
          {["Entry ID", "Timestamp", "Actor", "Event", "Details"].map(h => (
            <div key={h} className="px-4 py-3">
              <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.07em]">{h}</span>
            </div>
          ))}
        </div>
        {visible.map((entry, i) => {
          const ec = EVENT_COLORS[entry.event] ?? { color: "text-ink-2", bg: "bg-canvas", border: "border-line" };
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: i * 0.03 }}
              className={`grid items-start hover:bg-canvas transition-colors duration-150 ${i < visible.length - 1 ? "border-b border-line-light" : ""}`}
              style={{ gridTemplateColumns: "100px 160px 120px 130px 1fr" }}
            >
              <div className="px-4 py-3.5"><span className="text-[11px] font-mono text-ink-3">{entry.id}</span></div>
              <div className="px-4 py-3.5"><span className="text-[12px] text-ink-2">{entry.timestamp}</span></div>
              <div className="px-4 py-3.5">
                <p className={`text-[12.5px] font-semibold ${ACTOR_COLORS[entry.actorType]}`}>{entry.actor}</p>
                <p className="text-[10.5px] text-ink-3 capitalize">{entry.actorType}</p>
              </div>
              <div className="px-4 py-3.5">
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border ${ec.color} ${ec.bg} ${ec.border}`}>
                  {entry.event}
                </span>
                <p className="text-[11px] text-ink-3 mt-1">{entry.entityId}</p>
              </div>
              <div className="px-4 py-3.5">
                <p className="text-[12.5px] text-ink-2 leading-relaxed">{entry.details}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
