import { useState } from "react";
import { useNavigate } from "react-router";
import { Plane, Ship, Plus, ChevronRight, Clock, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

type Status = "all" | "draft" | "pending_review" | "open" | "closed" | "awarded";

const TABS: { key: Status; label: string; count?: number }[] = [
  { key: "all",            label: "All",           count: 5 },
  { key: "draft",          label: "Draft",          count: 1 },
  { key: "pending_review", label: "Pending Review", count: 1 },
  { key: "open",           label: "Open",           count: 1 },
  { key: "closed",         label: "Compare Bids",   count: 1 },
  { key: "awarded",        label: "Awarded",        count: 1 },
];

const REQUESTS = [
  {
    id: "SR-001",
    origin: "Guangzhou", originCode: "CAN",
    dest: "Hong Kong",   destCode: "HKG",
    type: "Air" as const,
    weight: "800 kg", cbm: "5.2 CBM", cargo: "General",
    status: "draft" as const,
    createdAt: "23 Jun 2026",
    bids: 0,
    deadline: null,
  },
  {
    id: "SR-002",
    origin: "Beijing", originCode: "PEK",
    dest: "Hong Kong", destCode: "HKG",
    type: "Sea" as const,
    weight: "5,000 kg", cbm: "28 CBM", cargo: "Machinery",
    status: "pending_review" as const,
    createdAt: "22 Jun 2026",
    bids: 0,
    deadline: null,
  },
  {
    id: "SR-003",
    origin: "Manila", originCode: "MNL",
    dest: "Hong Kong", destCode: "HKG",
    type: "Air" as const,
    weight: "200 kg", cbm: "1.4 CBM", cargo: "Electronics",
    status: "open" as const,
    createdAt: "23 Jun 2026",
    bids: 4,
    deadline: "1h 22m",
    deadlineSecs: 4920,
  },
  {
    id: "SR-004",
    origin: "Bangkok", originCode: "BKK",
    dest: "Hong Kong", destCode: "HKG",
    type: "Sea" as const,
    weight: "1,200 kg", cbm: "8 CBM", cargo: "Textiles",
    status: "closed" as const,
    createdAt: "20 Jun 2026",
    bids: 6,
    deadline: null,
  },
  {
    id: "SR-005",
    origin: "Taipei", originCode: "TPE",
    dest: "Hong Kong", destCode: "HKG",
    type: "Air" as const,
    weight: "450 kg", cbm: "3.1 CBM", cargo: "Tech Components",
    status: "awarded" as const,
    createdAt: "18 Jun 2026",
    bids: 5,
    deadline: null,
    awardedTo: "Pacific Forward Ltd.",
  },
];

const STATUS_CONFIG = {
  draft:          { label: "Draft",          color: "text-ink-3",    bg: "bg-canvas",       border: "border-line"           },
  pending_review: { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50",    border: "border-amber-200"      },
  open:           { label: "Open · Bidding", color: "text-emerald",  bg: "bg-emerald-soft", border: "border-emerald/30"     },
  closed:         { label: "Bids Closed",    color: "text-blue-700", bg: "bg-blue-50",      border: "border-blue-200"       },
  awarded:        { label: "Awarded",        color: "text-navy",     bg: "bg-navy-soft",    border: "border-navy/20"        },
};

export function MyRequestsPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<Status>("all");

  const visible = REQUESTS.filter(
    (r) => active === "all" || r.status === active
  );

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">
            My Requests
          </h1>
          <p className="text-[14px] text-ink-3">
            Shipment requests you've submitted to LBID.
          </p>
        </div>
        <button
          onClick={() => navigate("/requests/new")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-[13.5px] font-semibold
                     transition-all duration-200 ease-in-out cursor-pointer
                     hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                     active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
        >
          <Plus className="w-4 h-4" strokeWidth={2.2} />
          New Request
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`flex items-center gap-2 px-4 py-3 text-[13px] font-medium transition-all duration-200 ease-in-out cursor-pointer border-b-2 -mb-px
              ${active === t.key
                ? "text-navy border-navy"
                : "text-ink-3 border-transparent hover:text-ink"
              }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span
                className={`text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full
                  ${active === t.key ? "bg-navy text-white" : "bg-canvas text-ink-3"}`}
              >
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3">
        {visible.map((req, i) => (
          <RequestCard key={req.id} req={req} index={i} />
        ))}
      </div>
    </div>
  );
}

function RequestCard({
  req,
  index,
}: {
  req: (typeof REQUESTS)[0];
  index: number;
}) {
  const navigate = useNavigate();
  const cfg = STATUS_CONFIG[req.status];
  const isUrgent = req.status === "open" && (req as any).deadlineSecs < 3600;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.04 + index * 0.05, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => {
        if (req.status === "closed") navigate("/quotations/compare");
        else if (req.status !== "draft") navigate(`/requests/${req.id}`);
      }}
      className={`group bg-white rounded-[16px] border border-line px-6 py-5
                  transition-all duration-200 ease-in-out
                  ${req.status !== "draft" ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:border-[#C8CDD8]" : ""}`}
    >
      <div className="flex items-center gap-5">
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0 bg-canvas
                      transition-colors duration-200 ${req.status !== "draft" ? "group-hover:bg-navy-soft" : ""}`}
        >
          {req.type === "Air"
            ? <Plane className={`w-4 h-4 text-ink-2 transition-colors duration-200 ${req.status !== "draft" ? "group-hover:text-navy" : ""}`} strokeWidth={1.75} />
            : <Ship  className={`w-4 h-4 text-ink-2 transition-colors duration-200 ${req.status !== "draft" ? "group-hover:text-navy" : ""}`} strokeWidth={1.75} />
          }
        </div>

        {/* Route + info */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-2.5">
            <p className="text-[15px] font-semibold text-ink tracking-[-0.2px] leading-none">
              {req.origin}
              <span className="text-ink-3 font-normal mx-2">→</span>
              {req.dest}
            </p>
            <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
              {cfg.label}
            </span>
            {isUrgent && (
              <span className="flex items-center gap-1 text-[10.5px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <AlertCircle className="w-3 h-3" strokeWidth={2} /> Closes soon
              </span>
            )}
          </div>
          <p className="text-[12.5px] text-ink-3">
            {req.id} · {req.originCode} → {req.destCode} · {req.weight} · {req.cbm} · {req.cargo}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-[11.5px] text-ink-2">Created {req.createdAt}</span>
            {req.status === "open" && req.deadline && (
              <>
                <span className="text-line">·</span>
                <span className="flex items-center gap-1 text-[11.5px] font-medium text-amber-700">
                  <Clock className="w-3 h-3" strokeWidth={2} /> {req.deadline} left
                </span>
              </>
            )}
            {req.bids > 0 && (
              <>
                <span className="text-line">·</span>
                <span className="text-[11.5px] text-ink-2">{req.bids} bids received</span>
              </>
            )}
            {req.status === "awarded" && (req as any).awardedTo && (
              <>
                <span className="text-line">·</span>
                <span className="text-[11.5px] text-emerald font-medium">Awarded to {(req as any).awardedTo}</span>
              </>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="flex items-center flex-shrink-0">
          {req.status === "closed" && (
            <span className="text-[12.5px] font-semibold text-blue-700 mr-2">Compare bids →</span>
          )}
          {req.status === "draft" ? (
            <button
              onClick={(e) => { e.stopPropagation(); navigate("/requests/new"); }}
              className="px-3.5 py-1.5 rounded-lg bg-canvas border border-line text-[12px] font-medium text-ink-2
                         hover:bg-white hover:border-navy/30 hover:text-navy transition-all duration-200 cursor-pointer"
            >
              Edit Draft
            </button>
          ) : (
            <ChevronRight
              className="w-4 h-4 text-line transition-colors duration-200 group-hover:text-navy"
              strokeWidth={2}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
