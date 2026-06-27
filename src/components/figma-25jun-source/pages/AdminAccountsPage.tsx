import { useState } from "react";
import { Shield, CheckCircle2, X, Search, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Account {
  id: string; company: string; country: string;
  capabilities: ("Client" | "Forwarder")[]; tier: "Free" | "Premier" | "Enterprise";
  status: "active" | "pending_verification" | "suspended";
  joined: string; orders: number;
}

const ACCOUNTS: Account[] = [
  { id: "ACC-001", company: "Pacific Forward Ltd.",    country: "HK", capabilities: ["Client","Forwarder"], tier: "Premier",    status: "active",               joined: "Jan 2022", orders: 148 },
  { id: "ACC-002", company: "TechFlow HK",             country: "HK", capabilities: ["Client"],             tier: "Free",       status: "active",               joined: "Mar 2024", orders: 12  },
  { id: "ACC-003", company: "Blue River Logistics",    country: "HK", capabilities: ["Forwarder"],          tier: "Free",       status: "pending_verification", joined: "Jun 2026", orders: 0   },
  { id: "ACC-004", company: "Apex Sourcing Ltd.",      country: "HK", capabilities: ["Client"],             tier: "Premier",    status: "active",               joined: "Feb 2023", orders: 34  },
  { id: "ACC-005", company: "VietConnect Logistics",   country: "VN", capabilities: ["Forwarder"],          tier: "Free",       status: "pending_verification", joined: "Jun 2026", orders: 0   },
  { id: "ACC-006", company: "Guangdong Trade Express", country: "CN", capabilities: ["Client","Forwarder"], tier: "Free",       status: "active",               joined: "Nov 2023", orders: 8   },
];

const TIER_CFG = {
  Free:       { color: "text-ink-2",     bg: "bg-canvas",      border: "border-line"         },
  Premier:    { color: "text-gold-dark", bg: "bg-gold-soft",   border: "border-gold-border"  },
  Enterprise: { color: "text-navy",      bg: "bg-navy-soft",   border: "border-navy/20"      },
};
const STATUS_CFG = {
  active:               { label: "Active",       color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20" },
  pending_verification: { label: "Pending Verify", color: "text-amber-700", bg: "bg-amber-50",    border: "border-amber-200"  },
  suspended:            { label: "Suspended",    color: "text-red-600",   bg: "bg-red-50",       border: "border-red-200"    },
};

function VerifyModal({ account, onClose, onVerify }: {
  account: Account;
  onClose: () => void;
  onVerify: (id: string, approved: boolean, note: string) => void;
}) {
  const [note, setNote] = useState("");
  const [action, setAction] = useState<"approve" | "reject" | null>(null);

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
        className="bg-white rounded-2xl border border-line w-[460px] p-7"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
      >
        <p className="text-[17px] font-bold text-ink mb-1">Verify Forwarder</p>
        <p className="text-[13px] text-ink-3 mb-5">{account.company} · Applied {account.joined}</p>
        <div className="p-4 rounded-xl bg-canvas border border-line mb-5 flex flex-col gap-2">
          <p className="text-[12px] text-ink-3">Documents received: IATA Certificate, Business Registration</p>
          <p className="text-[12px] text-ink-3">Routes declared: Vietnam → HKG</p>
        </div>
        {!action ? (
          <div className="flex gap-3">
            <button onClick={() => setAction("reject")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-200 text-[13px] font-semibold text-red-600 hover:bg-red-50 cursor-pointer transition-all duration-200">
              <X className="w-4 h-4" strokeWidth={2} /> Reject
            </button>
            <button onClick={() => setAction("approve")}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald text-white text-[13px] font-semibold hover:bg-[#15693D] cursor-pointer transition-all duration-200">
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} /> Approve
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-ink-2">
                {action === "reject" ? "Rejection reason *" : "Verification note (optional)"}
              </label>
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={3}
                placeholder={action === "reject" ? "Reason for rejection" : "Internal note for the verification record"}
                className="w-full px-3.5 py-2.5 rounded-xl border-2 border-line text-[13px] text-ink outline-none resize-none placeholder:text-ink-3
                           focus:border-navy focus:shadow-[0_0_0_3px_rgba(12,26,62,0.08)] transition-all duration-200" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setAction(null)} className="flex-1 py-2.5 rounded-xl border border-line text-[13px] font-medium text-ink-2 hover:bg-canvas cursor-pointer transition-all duration-200">
                Back
              </button>
              <button
                onClick={() => { onVerify(account.id, action === "approve", note); onClose(); }}
                disabled={action === "reject" && !note.trim()}
                className={`flex-1 py-2.5 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed
                  ${action === "approve" ? "bg-emerald text-white hover:bg-[#15693D]" : "bg-red-600 text-white hover:bg-red-700"}`}
              >
                {action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export function AdminAccountsPage() {
  const [accounts, setAccounts] = useState(ACCOUNTS);
  const [verifying, setVerifying] = useState<Account | null>(null);
  const [search, setSearch] = useState("");

  function handleVerify(id: string, approved: boolean, _note: string) {
    setAccounts(prev => prev.map(a => a.id === id
      ? { ...a, status: approved ? "active" : "suspended" }
      : a
    ));
  }

  const visible = accounts.filter(a => !search || a.company.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
        <div>
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Account Management</h1>
          <p className="text-[14px] text-ink-3">
            {accounts.filter(a => a.status === "pending_verification").length} pending verification · {accounts.length} total accounts
          </p>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl border border-line max-w-md
                        focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.07)] transition-all duration-200">
          <Search className="w-4 h-4 text-ink-3 flex-shrink-0" strokeWidth={1.75} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search company…"
            className="flex-1 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-ink-3" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-[16px] border border-line overflow-hidden">
          <div className="grid border-b border-line bg-canvas" style={{ gridTemplateColumns: "1fr 100px 120px 90px 100px 120px" }}>
            {["Company", "Country", "Capabilities", "Tier", "Status", "Action"].map(h => (
              <div key={h} className="px-4 py-3">
                <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.07em]">{h}</span>
              </div>
            ))}
          </div>
          {visible.map((acc, i) => {
            const sc  = STATUS_CFG[acc.status];
            const tc  = TIER_CFG[acc.tier];
            return (
              <div key={acc.id}
                className={`grid items-center hover:bg-canvas transition-colors duration-150 ${i < visible.length - 1 ? "border-b border-line-light" : ""}`}
                style={{ gridTemplateColumns: "1fr 100px 120px 90px 100px 120px" }}
              >
                <div className="px-4 py-3.5">
                  <p className="text-[13px] font-semibold text-ink">{acc.company}</p>
                  <p className="text-[11px] text-ink-3 mt-0.5">{acc.orders} orders · Since {acc.joined}</p>
                </div>
                <div className="px-4 py-3.5"><span className="text-[12.5px] text-ink-2">{acc.country}</span></div>
                <div className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {acc.capabilities.map(c => (
                      <span key={c} className="text-[10.5px] font-medium text-navy bg-navy-soft border border-navy/15 px-1.5 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                </div>
                <div className="px-4 py-3.5">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${tc.color} ${tc.bg} ${tc.border}`}>{acc.tier}</span>
                </div>
                <div className="px-4 py-3.5">
                  <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${sc.color} ${sc.bg} ${sc.border}`}>{sc.label}</span>
                </div>
                <div className="px-4 py-3.5">
                  {acc.status === "pending_verification" ? (
                    <button
                      onClick={() => setVerifying(acc)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-[11.5px] font-semibold
                                 hover:bg-navy-hover hover:shadow-[0_3px_10px_rgba(12,26,62,0.2)] transition-all duration-200 cursor-pointer"
                    >
                      <Shield className="w-3 h-3" strokeWidth={2} /> Verify
                    </button>
                  ) : (
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-line text-[11.5px] font-medium text-ink-2
                                       hover:bg-canvas hover:text-ink transition-all duration-200 cursor-pointer">
                      Manage <ChevronDown className="w-3 h-3 -rotate-90" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {verifying && (
          <VerifyModal account={verifying} onClose={() => setVerifying(null)} onVerify={handleVerify} />
        )}
      </AnimatePresence>
    </>
  );
}
