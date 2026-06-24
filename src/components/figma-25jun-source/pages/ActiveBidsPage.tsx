import { useState } from "react";
import { useNavigate } from "react-router";
import { Plane, Ship, Clock, CheckCircle2, ChevronRight, Lock, Info, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

type BidStatus = "active" | "closing_soon" | "awaiting_selection" | "awarded" | "not_selected";

interface ActiveBid {
  id: string; srId: string;
  origin: string; dest: string; type: "Air" | "Sea";
  weight: string; cargo: string;
  submittedAt: string; quotedHKD: number;
  status: BidStatus; secsLeft: number | null; timeLabel: string;
  orderId?: string;
}

const BIDS: ActiveBid[] = [
  {
    id: "BID-0041", srId: "SR-006",
    origin: "Ho Chi Minh City", dest: "HKG", type: "Air",
    weight: "500 kg", cargo: "General",
    submittedAt: "23 Jun, 10:15",
    quotedHKD: 11800, status: "closing_soon", secsLeft: 640, timeLabel: "10m 40s",
  },
  {
    id: "BID-0039", srId: "SR-005",
    origin: "Taipei", dest: "HKG", type: "Air",
    weight: "180 kg", cargo: "Tech Components",
    submittedAt: "22 Jun, 14:00",
    quotedHKD: 9200, status: "active", secsLeft: 4800, timeLabel: "1h 20m",
  },
  {
    id: "BID-0036", srId: "SR-003",
    origin: "Bangkok", dest: "HKG", type: "Air",
    weight: "320 kg", cargo: "Perishable",
    submittedAt: "20 Jun, 09:30",
    quotedHKD: 14500, status: "awaiting_selection", secsLeft: null, timeLabel: "Closed",
  },
  {
    id: "BID-0031", srId: "SR-002",
    origin: "Manila", dest: "HKG", type: "Air",
    weight: "260 kg", cargo: "Electronics",
    submittedAt: "18 Jun, 11:00",
    quotedHKD: 8800, status: "awaiting_selection", secsLeft: null, timeLabel: "Closed",
  },
  {
    id: "BID-0027", srId: "SR-001",
    origin: "Guangzhou", dest: "HKG", type: "Air",
    weight: "800 kg", cargo: "General",
    submittedAt: "15 Jun, 08:30",
    quotedHKD: 24800, status: "awarded", secsLeft: null, timeLabel: "Awarded",
    orderId: "ORD-2026-0039",
  },
  {
    id: "BID-0022", srId: "SR-000",
    origin: "Singapore", dest: "HKG", type: "Sea",
    weight: "2,100 kg", cargo: "Machinery",
    submittedAt: "10 Jun, 14:00",
    quotedHKD: 18600, status: "not_selected", secsLeft: null, timeLabel: "Not selected",
  },
];

const STATUS_CFG: Record<BidStatus, { label: string; color: string; bg: string; border: string }> = {
  active:            { label: "Sealed · Active",          color: "text-navy",      bg: "bg-navy-soft",    border: "border-navy/20"      },
  closing_soon:      { label: "Closing Soon",             color: "text-amber-700", bg: "bg-amber-50",     border: "border-amber-300"    },
  awaiting_selection:{ label: "Awaiting Selection",       color: "text-blue-700",  bg: "bg-blue-50",      border: "border-blue-200"     },
  awarded:           { label: "Awarded",                  color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/25"   },
  not_selected:      { label: "Not Selected",             color: "text-ink-3",     bg: "bg-canvas",       border: "border-line"         },
};

const SUMMARY = [
  { label: "Active",            count: BIDS.filter(b => b.status === "active").length,              color: "text-navy"      },
  { label: "Closing Soon",      count: BIDS.filter(b => b.status === "closing_soon").length,        color: "text-amber-700" },
  { label: "Awaiting Decision", count: BIDS.filter(b => b.status === "awaiting_selection").length,  color: "text-blue-700"  },
  { label: "Awarded",           count: BIDS.filter(b => b.status === "awarded").length,             color: "text-emerald"   },
];

export function ActiveBidsPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<BidStatus | "all">("all");

  const visible = BIDS.filter(b => filter === "all" || b.status === filter);

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Active Bids</h1>
        <p className="text-[14px] text-ink-3">{BIDS.length} sealed bids submitted · Your quotes are private until each window closes</p>
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 cursor-pointer border
            ${filter === "all" ? "bg-navy text-white border-navy shadow-[0_2px_8px_rgba(12,26,62,0.18)]" : "bg-white border-line text-ink-2 hover:bg-navy-soft hover:text-navy hover:border-navy/20"}`}
        >
          All ({BIDS.length})
        </button>
        {SUMMARY.map(s => (
          <button key={s.label} onClick={() => setFilter(s.label.toLowerCase().replace(/ /g,"_") as BidStatus)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-line bg-white text-[13px] font-medium text-ink-2 hover:bg-canvas transition-all duration-200 cursor-pointer">
            <span className={`text-[15px] font-bold ${s.color}`}>{s.count}</span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-canvas border border-line">
        <Lock className="w-3.5 h-3.5 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-[12.5px] text-ink-2 leading-relaxed">
          Your quoted amounts are <strong className="font-medium text-ink">visible only to you</strong>. Competitor prices, identities and bid counts remain hidden until each bidding window closes. The lowest valid bid is highlighted to the client, but clients may select any qualified forwarder.
        </p>
      </div>

      {/* Bid list */}
      <div className="flex flex-col gap-3">
        {visible.map((bid, i) => {
          const cfg = STATUS_CFG[bid.status];
          const isUrgent = bid.status === "closing_soon";
          return (
            <motion.div
              key={bid.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className={`bg-white rounded-[16px] border px-6 py-5 flex items-center gap-5
                         transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)]
                         ${isUrgent ? "border-amber-200 shadow-[0_2px_8px_rgba(245,158,11,0.12)]" : "border-line"}`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0 ${isUrgent ? "bg-amber-50" : "bg-canvas"}`}>
                {bid.type === "Air"
                  ? <Plane className={`w-4 h-4 ${isUrgent ? "text-amber-600" : "text-ink-2"}`} strokeWidth={1.75} />
                  : <Ship  className={`w-4 h-4 ${isUrgent ? "text-amber-600" : "text-ink-2"}`} strokeWidth={1.75} />
                }
              </div>

              {/* Route + meta */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <p className="text-[15px] font-semibold text-ink tracking-[-0.2px] leading-none">
                    {bid.origin} → {bid.dest}
                  </p>
                  <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-[12.5px] text-ink-3">{bid.srId} · {bid.weight} · {bid.cargo} · Submitted {bid.submittedAt}</p>
              </div>

              {/* Quote amount (own only) */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[10.5px] font-semibold text-ink-3 uppercase tracking-[0.07em]">Your Quote</span>
                <span className="text-[16px] font-bold text-ink tracking-[-0.3px]">
                  HKD {bid.quotedHKD.toLocaleString()}
                </span>
              </div>

              {/* Time / status */}
              <div className="flex-shrink-0 min-w-[100px] text-right">
                {(bid.status === "active" || bid.status === "closing_soon") && bid.secsLeft ? (
                  <div className={`flex items-center gap-1.5 justify-end px-3 py-2 rounded-xl border
                    ${isUrgent ? "bg-amber-50 border-amber-200" : "bg-canvas border-line"}`}>
                    <Clock className={`w-3.5 h-3.5 ${isUrgent ? "text-amber-600" : "text-ink-3"}`} strokeWidth={2} />
                    <span className={`font-mono text-[13px] font-bold tabular-nums ${isUrgent ? "text-amber-700" : "text-ink"}`}>
                      {bid.timeLabel}
                    </span>
                  </div>
                ) : bid.status === "awarded" ? (
                  <button
                    onClick={() => navigate(`/orders/${bid.orderId}`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald text-white text-[12px] font-semibold
                               hover:bg-[#15693D] hover:shadow-[0_3px_10px_rgba(26,125,74,0.25)] transition-all duration-200 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> View Order
                  </button>
                ) : bid.status === "awaiting_selection" ? (
                  <div className="flex items-center gap-1.5 text-[12px] text-blue-700">
                    <Info className="w-3.5 h-3.5" strokeWidth={2} /> Awaiting decision
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[12px] text-ink-3">
                    <AlertCircle className="w-3.5 h-3.5" strokeWidth={1.75} /> Not selected
                  </div>
                )}
              </div>

              {bid.status !== "awarded" && (
                <ChevronRight className="w-4 h-4 text-line flex-shrink-0" strokeWidth={2} />
              )}
            </motion.div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-canvas border border-line flex items-center justify-center">
            <Lock className="w-5 h-5 text-ink-3" strokeWidth={1.75} />
          </div>
          <p className="text-[14px] font-medium text-ink">No bids in this category</p>
          <p className="text-[13px] text-ink-3">Submit a sealed bid from the Opportunities page to see it here.</p>
        </div>
      )}
    </div>
  );
}
