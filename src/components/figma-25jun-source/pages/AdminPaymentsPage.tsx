import { useState } from "react";
import { CheckCircle2, X, Upload, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Payment {
  id: string; company: string; type: "Subscription" | "Token Purchase";
  amount: string; currency: string; submitted: string;
  status: "pending" | "confirmed" | "rejected"; method: "Manual" | "Stripe";
  proofAvailable: boolean;
}

const PAYMENTS: Payment[] = [
  { id: "PI-0051", company: "Blue River Logistics",   type: "Subscription",    amount: "HKD 980",  currency: "HKD", submitted: "23 Jun, 09:00", status: "pending",   method: "Manual", proofAvailable: true  },
  { id: "PI-0050", company: "Guangdong Trade Express",type: "Token Purchase",   amount: "HKD 720",  currency: "HKD", submitted: "22 Jun, 14:30", status: "pending",   method: "Manual", proofAvailable: true  },
  { id: "PI-0049", company: "VietConnect Logistics",  type: "Subscription",    amount: "HKD 980",  currency: "HKD", submitted: "22 Jun, 10:00", status: "pending",   method: "Manual", proofAvailable: false },
  { id: "PI-0048", company: "Orient Cargo Solutions", type: "Subscription",    amount: "HKD 980",  currency: "HKD", submitted: "20 Jun, 16:00", status: "confirmed", method: "Stripe", proofAvailable: false },
  { id: "PI-0047", company: "Trans-Pacific HK",       type: "Token Purchase",  amount: "HKD 400",  currency: "HKD", submitted: "19 Jun, 11:00", status: "confirmed", method: "Manual", proofAvailable: true  },
  { id: "PI-0046", company: "Asia Gateway Express",   type: "Subscription",    amount: "HKD 980",  currency: "HKD", submitted: "18 Jun, 08:30", status: "rejected",  method: "Manual", proofAvailable: true  },
];

export function AdminPaymentsPage() {
  const [payments, setPayments] = useState(PAYMENTS);
  const [selected, setSelected] = useState<Payment | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [action, setAction] = useState<"preview" | "reject" | null>(null);

  function confirm(id: string) {
    setPayments(prev => prev.map(p => p.id === id ? {...p, status: "confirmed"} : p));
    setSelected(null);
  }
  function reject(id: string) {
    setPayments(prev => prev.map(p => p.id === id ? {...p, status: "rejected"} : p));
    setSelected(null);
    setRejectNote("");
    setAction(null);
  }

  const pending = payments.filter(p => p.status === "pending").length;

  const STATUS_CFG = {
    pending:   { label: "Pending",   color: "text-amber-700", bg: "bg-amber-50",     border: "border-amber-200"  },
    confirmed: { label: "Confirmed", color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20" },
    rejected:  { label: "Rejected",  color: "text-red-600",   bg: "bg-red-50",       border: "border-red-200"    },
  };

  return (
    <>
      <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
        <div>
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Pending Payments</h1>
          <p className="text-[14px] text-ink-3">{pending} awaiting confirmation · Review payment proofs before confirming</p>
        </div>

        <div className="bg-white rounded-[16px] border border-line overflow-hidden">
          <div className="grid border-b border-line bg-canvas" style={{ gridTemplateColumns: "90px 1fr 120px 100px 100px 80px 160px" }}>
            {["ID", "Company", "Type", "Amount", "Method", "Status", "Action"].map(h => (
              <div key={h} className="px-4 py-3">
                <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.07em]">{h}</span>
              </div>
            ))}
          </div>

          {payments.map((pay, i) => {
            const sc = STATUS_CFG[pay.status];
            return (
              <div key={pay.id}
                className={`grid items-center hover:bg-canvas transition-colors duration-150 ${i < payments.length - 1 ? "border-b border-line-light" : ""}`}
                style={{ gridTemplateColumns: "90px 1fr 120px 100px 100px 80px 160px" }}
              >
                <div className="px-4 py-3.5"><span className="text-[12.5px] font-mono text-navy">{pay.id}</span></div>
                <div className="px-4 py-3.5">
                  <p className="text-[13px] font-medium text-ink">{pay.company}</p>
                  <p className="text-[11px] text-ink-3 mt-0.5">{pay.submitted}</p>
                </div>
                <div className="px-4 py-3.5"><span className="text-[12.5px] text-ink-2">{pay.type}</span></div>
                <div className="px-4 py-3.5"><span className="text-[13px] font-semibold text-ink">{pay.amount}</span></div>
                <div className="px-4 py-3.5"><span className="text-[12px] text-ink-2">{pay.method}</span></div>
                <div className="px-4 py-3.5">
                  <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${sc.color} ${sc.bg} ${sc.border}`}>{sc.label}</span>
                </div>
                <div className="px-4 py-3.5 flex items-center gap-2">
                  {pay.proofAvailable && (
                    <button
                      onClick={() => { setSelected(pay); setAction("preview"); }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line text-[11.5px] font-medium text-ink-2
                                 hover:bg-navy-soft hover:text-navy hover:border-navy/20 transition-all duration-200 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" strokeWidth={2} /> Proof
                    </button>
                  )}
                  {pay.status === "pending" && (
                    <>
                      <button
                        onClick={() => reject(pay.id)}
                        className="p-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all duration-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => { setSelected(pay); setAction(null); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald text-white text-[11.5px] font-semibold
                                   hover:bg-[#15693D] hover:shadow-[0_3px_10px_rgba(26,125,74,0.25)] transition-all duration-200 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3 h-3" strokeWidth={2} /> Confirm
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirm/preview modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(8,18,42,0.45)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) { setSelected(null); setAction(null); } }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-line w-[440px] p-7"
              style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
            >
              <p className="text-[17px] font-bold text-ink mb-1">
                {action === "preview" ? "Payment Proof" : "Confirm Payment"}
              </p>
              <p className="text-[13px] text-ink-3 mb-5">{selected.id} · {selected.company} · {selected.amount}</p>

              {action === "preview" ? (
                <>
                  <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-canvas border border-line mb-5">
                    <Upload className="w-8 h-8 text-ink-3" strokeWidth={1.5} />
                    <p className="text-[13px] text-ink-2">bank_receipt_{selected.id}.pdf</p>
                    <button className="px-4 py-2 rounded-lg bg-navy text-white text-[12.5px] font-medium cursor-pointer hover:bg-navy-hover transition-all duration-200">
                      View Full Document
                    </button>
                  </div>
                  {selected.status === "pending" && (
                    <div className="flex gap-3">
                      <button onClick={() => { setSelected(null); setAction(null); }}
                        className="flex-1 py-2.5 rounded-xl border border-line text-[13px] font-medium text-ink-2 hover:bg-canvas cursor-pointer transition-all duration-200">Close</button>
                      <button onClick={() => confirm(selected.id)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald text-white text-[13px] font-semibold hover:bg-[#15693D] cursor-pointer transition-all duration-200">
                        Confirm Payment
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="p-4 rounded-xl bg-canvas border border-line mb-5 flex flex-col gap-2">
                    <p className="text-[12.5px] text-ink-2">Confirming will activate {selected.type === "Subscription" ? "Premier membership" : "Token credits"} for {selected.company}.</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { setSelected(null); setAction(null); }}
                      className="flex-1 py-2.5 rounded-xl border border-line text-[13px] font-medium text-ink-2 hover:bg-canvas cursor-pointer transition-all duration-200">Cancel</button>
                    <button onClick={() => confirm(selected.id)}
                      className="flex-1 py-2.5 rounded-xl bg-emerald text-white text-[13px] font-semibold hover:bg-[#15693D] cursor-pointer transition-all duration-200">
                      <CheckCircle2 className="w-4 h-4 inline mr-1.5" strokeWidth={2} />Confirm
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
