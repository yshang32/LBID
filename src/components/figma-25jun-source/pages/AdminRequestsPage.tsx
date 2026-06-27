import { useState } from "react";
import { CheckCircle2, X, Clock, ChevronDown, Plane, Ship } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Request {
  id: string; origin: string; dest: string; type: "Air" | "Sea";
  weight: string; cbm: string; cargo: string;
  client: string; submitted: string; status: "pending" | "approved" | "rejected";
  notes?: string;
}

const REQUESTS: Request[] = [
  { id: "SR-008", origin: "Bangkok",      dest: "HKG", type: "Air", weight: "280 kg",   cbm: "1.9 CBM",  cargo: "Electronics",  client: "TechFlow HK",      submitted: "23 Jun, 10:15", status: "pending" },
  { id: "SR-007", origin: "Guangzhou",    dest: "HKG", type: "Sea", weight: "4,200 kg", cbm: "22 CBM",   cargo: "Machinery",    client: "Apex Sourcing",    submitted: "23 Jun, 08:40", status: "pending" },
  { id: "SR-006", origin: "Ho Chi Minh", dest: "HKG", type: "Air", weight: "500 kg",   cbm: "3 CBM",    cargo: "General",      client: "VN Export Co.",    submitted: "22 Jun, 16:00", status: "pending" },
  { id: "SR-005", origin: "Taipei",       dest: "HKG", type: "Air", weight: "180 kg",   cbm: "1.2 CBM",  cargo: "Tech Parts",   client: "TW Tech Exports",  submitted: "22 Jun, 12:30", status: "approved" },
  { id: "SR-004", origin: "Jakarta",      dest: "HKG", type: "Sea", weight: "8,000 kg", cbm: "38 CBM",   cargo: "Textiles",     client: "ID Fashion Ltd.",  submitted: "21 Jun, 09:00", status: "rejected", notes: "Incomplete cargo documentation" },
];

function ReviewModal({ req, onClose, onApprove, onReject }: {
  req: Request;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}) {
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject]     = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,18,42,0.45)", backdropFilter: "blur(4px)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-line w-[500px] p-7"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
      >
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[17px] font-bold text-ink">Review Request</p>
            <p className="text-[13px] text-ink-3 mt-0.5">{req.id} · Submitted {req.submitted}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:bg-canvas cursor-pointer transition-all duration-200">
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {[
            ["Route", `${req.origin} → ${req.dest}`],
            ["Freight", req.type],
            ["Weight", req.weight],
            ["Volume", req.cbm],
            ["Cargo", req.cargo],
            ["Client", req.client],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-3">
              <span className="text-[12px] text-ink-3 w-20 flex-shrink-0">{k}</span>
              <span className="text-[13.5px] font-medium text-ink">{v}</span>
            </div>
          ))}
        </div>

        {showReject ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-ink-2">Rejection reason <span className="text-red-400">*</span></label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder="Explain why this request is being rejected so the client can resubmit correctly."
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-line text-[13px] text-ink outline-none resize-none
                           focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.08)] transition-all duration-200 placeholder:text-ink-3"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReject(false)} className="flex-1 py-2.5 rounded-xl border border-line text-[13px] font-medium text-ink-2 hover:bg-canvas cursor-pointer transition-all duration-200">
                Cancel
              </button>
              <button
                onClick={() => { if (rejectReason.trim()) { onReject(req.id, rejectReason); onClose(); } }}
                disabled={!rejectReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-[13px] font-semibold
                           hover:enabled:bg-red-700 hover:enabled:-translate-y-[1px] transition-all duration-200 cursor-pointer
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => setShowReject(true)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 text-[13px] font-semibold text-red-600
                         hover:bg-red-50 transition-all duration-200 cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2} /> Reject
            </button>
            <button
              onClick={() => { onApprove(req.id); onClose(); }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald text-white text-[13px] font-semibold
                         hover:bg-[#15693D] hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(26,125,74,0.3)]
                         transition-all duration-200 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} /> Approve & Publish
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function AdminRequestsPage() {
  const [reqs,      setReqs]      = useState(REQUESTS);
  const [reviewing, setReviewing] = useState<Request | null>(null);
  const [filter,    setFilter]    = useState<"all" | "pending" | "approved" | "rejected">("all");

  function approve(id: string) {
    setReqs(r => r.map(x => x.id === id ? {...x, status: "approved"} : x));
  }
  function reject(id: string, _reason: string) {
    setReqs(r => r.map(x => x.id === id ? {...x, status: "rejected", notes: _reason} : x));
  }

  const visible = reqs.filter(r => filter === "all" || r.status === filter);
  const pending = reqs.filter(r => r.status === "pending").length;

  const STATUS_CFG = {
    pending:  { label: "Pending Review", color: "text-amber-700", bg: "bg-amber-50",     border: "border-amber-200"  },
    approved: { label: "Approved",       color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20" },
    rejected: { label: "Rejected",       color: "text-red-600",   bg: "bg-red-50",       border: "border-red-200"    },
  };

  return (
    <>
      <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Shipment Requests</h1>
            <p className="text-[14px] text-ink-3">{pending} pending review · Approve to open a 3-hour bid window</p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0 border-b border-line">
          {(["all","pending","approved","rejected"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-3 text-[13px] font-medium transition-all duration-200 cursor-pointer border-b-2 -mb-px capitalize
                ${filter === f ? "text-navy border-navy" : "text-ink-3 border-transparent hover:text-ink"}`}>
              {f} {f === "pending" && pending > 0 && <span className="ml-1.5 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{pending}</span>}
            </button>
          ))}
        </div>

        {/* Request list */}
        <div className="flex flex-col gap-3">
          {visible.map((req, i) => {
            const cfg = STATUS_CFG[req.status];
            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-[14px] border border-line px-5 py-4 flex items-center gap-5
                           transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-[#C8CDD8]"
              >
                <div className="w-9 h-9 rounded-[10px] bg-canvas flex items-center justify-center flex-shrink-0">
                  {req.type === "Air"
                    ? <Plane className="w-4 h-4 text-ink-2" strokeWidth={1.75} />
                    : <Ship  className="w-4 h-4 text-ink-2" strokeWidth={1.75} />
                  }
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <p className="text-[14px] font-semibold text-ink">{req.id}</p>
                    <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>{cfg.label}</span>
                  </div>
                  <p className="text-[13px] text-ink-2">{req.origin} → {req.dest} · {req.weight} · {req.cbm} · {req.cargo}</p>
                  <p className="text-[12px] text-ink-3">Client: {req.client} · Submitted {req.submitted}</p>
                  {req.notes && <p className="text-[11.5px] text-red-600 font-medium">{req.notes}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {req.status === "pending" && (
                    <>
                      <button
                        onClick={() => reject(req.id, "Does not meet LBID submission requirements.")}
                        className="flex items-center gap-1 px-3.5 py-2 rounded-lg border-2 border-red-200 text-[12px] font-semibold text-red-600
                                   hover:bg-red-50 transition-all duration-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} /> Reject
                      </button>
                      <button
                        onClick={() => setReviewing(req)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-navy text-white text-[12px] font-semibold
                                   hover:bg-navy-hover hover:shadow-[0_3px_10px_rgba(12,26,62,0.2)] transition-all duration-200 cursor-pointer"
                      >
                        Review <ChevronDown className="w-3.5 h-3.5 -rotate-90" strokeWidth={2} />
                      </button>
                    </>
                  )}
                  {req.status === "approved" && (
                    <div className="flex items-center gap-1.5 text-[12px] font-medium text-emerald">
                      <CheckCircle2 className="w-4 h-4" strokeWidth={2} /> Published
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {reviewing && (
          <ReviewModal req={reviewing} onClose={() => setReviewing(null)} onApprove={approve} onReject={reject} />
        )}
      </AnimatePresence>
    </>
  );
}
