import { useParams, useNavigate } from "react-router";
import {
  ChevronLeft, Clock, CheckCircle2, Lock, FileText,
  MessageSquare, AlertTriangle, X, Upload,
} from "lucide-react";
import { motion } from "motion/react";

const REQUEST_DATA: Record<string, {
  id: string; origin: string; dest: string; cargo: string; weight: string; cbm: string;
  type: "Air" | "Sea"; pickup: string; delivery: string;
  status: "pending_review" | "open" | "closed" | "awarded" | "cancelled";
  submitted: string; bids: number; deadline: string | null; deadlineSecs: number | null;
  awardedTo?: string; orderId?: string; notes?: string;
}> = {
  "SR-001": {
    id: "SR-001", origin: "Guangzhou", dest: "Hong Kong", cargo: "General", weight: "800 kg", cbm: "5.2 CBM",
    type: "Air", pickup: "28 Jun", delivery: "29 Jun",
    status: "pending_review", submitted: "23 Jun 2026", bids: 0, deadline: null, deadlineSecs: null,
    notes: "Fragile items — careful handling required.",
  },
  "SR-004": {
    id: "SR-004", origin: "Bangkok", dest: "Hong Kong", cargo: "Textiles", weight: "1,200 kg", cbm: "8 CBM",
    type: "Sea", pickup: "1 Jul", delivery: "6 Jul",
    status: "closed", submitted: "20 Jun 2026", bids: 6, deadline: null, deadlineSecs: null,
  },
};

const FALLBACK = REQUEST_DATA["SR-001"];

const TIMELINE_STEPS = [
  "Draft", "Submitted for Review", "Published", "Bidding Open", "Quotes Ready", "Awarded",
];

const STATUS_STEP: Record<string, number> = {
  pending_review: 1, open: 3, closed: 4, awarded: 5, cancelled: -1,
};

export function RequestDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const req      = REQUEST_DATA[id ?? ""] ?? FALLBACK;
  const stepIdx  = STATUS_STEP[req.status] ?? 0;

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6 max-w-[860px]">
      <button onClick={() => navigate("/requests")}
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors cursor-pointer w-fit">
        <ChevronLeft className="w-4 h-4" strokeWidth={2} /> My Requests
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-ink tracking-[-0.6px] leading-none mb-2 m-0">{req.id}</h1>
          <p className="text-[14px] text-ink-2">{req.origin} → {req.dest} · {req.weight} · {req.cbm} · {req.cargo}</p>
          <p className="text-[13px] text-ink-3 mt-0.5">Submitted {req.submitted}</p>
        </div>
        {req.status !== "awarded" && req.status !== "cancelled" && (
          <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-[12.5px] font-medium text-red-600
                             hover:bg-red-50 transition-all duration-200 cursor-pointer">
            <X className="w-3.5 h-3.5" strokeWidth={2} /> Cancel Request
          </button>
        )}
      </div>

      {/* Status timeline */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-[18px] border border-line p-6"
        style={{ boxShadow: "0 2px_16px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-0">
          {TIMELINE_STEPS.map((step, i) => (
            <div key={step} className="flex items-center gap-0 flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 text-[11px] font-bold
                  ${i < stepIdx ? "bg-emerald text-white" : i === stepIdx ? "bg-navy text-white" : "bg-canvas border-2 border-line text-ink-3"}`}>
                  {i < stepIdx ? <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} /> : i + 1}
                </div>
                <span className={`text-[10px] font-medium whitespace-nowrap text-center leading-tight
                  ${i === stepIdx ? "text-navy font-semibold" : i < stepIdx ? "text-emerald" : "text-ink-3"}`}>
                  {step}
                </span>
              </div>
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`flex-1 h-[2px] mx-1.5 mb-4 rounded-full transition-colors duration-300 ${i < stepIdx ? "bg-emerald" : "bg-line"}`} />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Status-specific banner */}
      {req.status === "pending_review" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
          <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="text-[13px] font-semibold text-amber-800">Under LBID Review</p>
            <p className="text-[12.5px] text-amber-700 mt-0.5">Your request is being reviewed by the LBID team. Once approved, a 3-hour sealed bid window opens automatically. You'll be notified by email.</p>
          </div>
        </div>
      )}
      {req.status === "open" && req.deadline && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-navy border border-navy/10"
          style={{ boxShadow: "0 2px 10px rgba(12,26,62,0.15)" }}>
          <div className="flex items-center gap-3">
            <Lock className="w-4 h-4 text-white/80" strokeWidth={2} />
            <div>
              <p className="text-[13px] font-semibold text-white">Bidding Open · All quotes are sealed</p>
              <p className="text-[12px] text-white/60 mt-0.5">Forwarder identities, prices and bid counts are hidden until the window closes.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2.5 rounded-xl">
            <Clock className="w-3.5 h-3.5 text-amber-300" strokeWidth={2} />
            <span className="font-mono text-[14px] font-bold text-white tabular-nums">{req.deadline}</span>
          </div>
        </div>
      )}
      {req.status === "closed" && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div>
            <p className="text-[13px] font-semibold text-blue-800">Bidding Closed · {req.bids} quotes received</p>
            <p className="text-[12.5px] text-blue-700 mt-0.5">All sealed quotes are now visible. Compare and award one logistics partner.</p>
          </div>
          <button
            onClick={() => navigate("/quotations/compare")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 text-white text-[13px] font-semibold
                       hover:bg-blue-800 hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(30,64,175,0.3)]
                       transition-all duration-200 cursor-pointer"
          >
            Compare {req.bids} Quotes →
          </button>
        </div>
      )}

      {/* Two-column: details + side panels */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 280px" }}>
        {/* Cargo details */}
        <div className="bg-white rounded-[16px] border border-line p-5">
          <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.08em] mb-4">Cargo Details</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            {[
              ["Freight Mode", req.type], ["Origin", req.origin],
              ["Destination", req.dest], ["Weight", req.weight],
              ["Volume", req.cbm], ["Cargo Type", req.cargo],
              ["Pickup Date", req.pickup], ["Est. Delivery", req.delivery],
            ].map(([k, v]) => (
              <div key={k}>
                <span className="text-[11px] text-ink-3">{k}</span>
                <p className="text-[13.5px] font-medium text-ink mt-0.5">{v}</p>
              </div>
            ))}
          </div>
          {req.notes && (
            <div className="flex items-start gap-2 mt-4 pt-4 border-t border-line-light">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[12.5px] text-ink-2">{req.notes}</p>
            </div>
          )}
        </div>

        {/* Side panels */}
        <div className="flex flex-col gap-4">
          {/* Documents */}
          <div className="bg-white rounded-[16px] border border-line p-4">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
              <p className="text-[12.5px] font-semibold text-ink">Documents</p>
            </div>
            {[
              { label: "Packing List",    status: "uploaded" },
              { label: "Commercial Invoice", status: "missing"  },
            ].map(doc => (
              <div key={doc.label} className="flex items-center gap-2.5 py-2">
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                  ${doc.status === "uploaded" ? "bg-emerald-soft" : "bg-red-50 border border-red-200"}`}>
                  {doc.status === "uploaded"
                    ? <CheckCircle2 className="w-3 h-3 text-emerald" strokeWidth={2.5} />
                    : <X className="w-2.5 h-2.5 text-red-500" strokeWidth={2.5} />
                  }
                </div>
                <span className="text-[12.5px] text-ink-2 flex-1">{doc.label}</span>
                {doc.status === "missing" && (
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-canvas border border-line text-[11px] font-medium text-ink-2 hover:bg-navy-soft hover:text-navy cursor-pointer transition-all">
                    <Upload className="w-3 h-3" strokeWidth={2} /> Upload
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Messages placeholder */}
          <div className="bg-white rounded-[16px] border border-line p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
              <p className="text-[12.5px] font-semibold text-ink">Messages</p>
            </div>
            <p className="text-[12px] text-ink-3 leading-relaxed">
              {req.status === "awarded"
                ? "Contact details unlocked. Messages available in your Order Workspace."
                : "Private order messages become available after award."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
