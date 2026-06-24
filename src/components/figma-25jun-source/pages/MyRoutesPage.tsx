import { useState } from "react";
import { Plane, Ship, Plus, CheckCircle2, Clock, AlertCircle, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type RouteStatus = "verified" | "pending" | "incomplete";

interface Route {
  id: string; origin: string; originCode: string;
  modes: ("Air" | "Sea")[]; capacityKg: number;
  services: string[]; status: RouteStatus;
  jobs: number; winRate: number; certified: boolean;
}

const ROUTES: Route[] = [
  {
    id: "R-001", origin: "Vietnam (SGN / HAN)", originCode: "VN",
    modes: ["Air"], capacityKg: 2000,
    services: ["Customs clearance", "Commercial invoice", "Packing list", "Insurance"],
    status: "verified", jobs: 32, winRate: 78, certified: true,
  },
  {
    id: "R-002", origin: "China Mainland (PVG / CAN / PEK)", originCode: "CN",
    modes: ["Air", "Sea"], capacityKg: 8000,
    services: ["Customs clearance", "B/L preparation", "COO", "Insurance"],
    status: "verified", jobs: 89, winRate: 71, certified: true,
  },
  {
    id: "R-003", origin: "Taiwan (TPE)", originCode: "TW",
    modes: ["Air"], capacityKg: 1200,
    services: ["Customs clearance", "Commercial invoice"],
    status: "pending", jobs: 11, winRate: 64, certified: false,
  },
  {
    id: "R-004", origin: "Thailand (BKK)", originCode: "TH",
    modes: ["Air"], capacityKg: 800,
    services: [],
    status: "incomplete", jobs: 0, winRate: 0, certified: false,
  },
];

const STATUS_CFG: Record<RouteStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  verified:   { label: "Verified",             color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20", icon: CheckCircle2 },
  pending:    { label: "Pending Verification", color: "text-amber-700", bg: "bg-amber-50",     border: "border-amber-200", icon: Clock        },
  incomplete: { label: "Incomplete",           color: "text-red-600",   bg: "bg-red-50",       border: "border-red-200",   icon: AlertCircle  },
};

const CORRIDOR_COLORS = [
  "#0C1A3E", "#1A3575", "#2850A8", "#3D68C8",
  "#5280D8", "#6898E0", "#7EB0E8", "#94C8F0",
];

function RouteVisual({ routes }: { routes: Route[] }) {
  const hkgX = 320, hkgY = 150;
  const origins = [
    { label: "VN", x: 60,  y: 200, color: "#0C1A3E", active: routes.some(r => r.originCode === "VN" && r.status === "verified") },
    { label: "CN", x: 200, y: 60,  color: "#1A3575", active: routes.some(r => r.originCode === "CN" && r.status === "verified") },
    { label: "TW", x: 280, y: 40,  color: "#C49A3C", active: routes.some(r => r.originCode === "TW") },
    { label: "TH", x: 40,  y: 130, color: "#9099A8", active: routes.some(r => r.originCode === "TH") },
  ];
  return (
    <div className="bg-white rounded-[16px] border border-line p-5" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-semibold text-ink">Route Coverage Overview</p>
        <span className="text-[12px] text-ink-3">{routes.filter(r => r.status === "verified").length} active routes → HKG</span>
      </div>
      <svg viewBox="0 0 380 240" className="w-full" style={{ height: "180px" }}>
        {/* HKG hub */}
        <circle cx={hkgX} cy={hkgY} r="20" fill="#0C1A3E" opacity="0.9" />
        <text x={hkgX} y={hkgY + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="700" fontFamily="Inter, sans-serif">HKG</text>

        {/* Route lines */}
        {origins.map((o, i) => (
          <g key={o.label}>
            <line
              x1={o.x} y1={o.y} x2={hkgX} y2={hkgY}
              stroke={o.active ? o.color : "#E2E6EE"}
              strokeWidth={o.active ? "2" : "1"}
              strokeDasharray={o.active ? "none" : "4 4"}
              opacity={o.active ? "0.85" : "0.5"}
            />
            <circle cx={o.x} cy={o.y} r="14" fill={o.active ? o.color : "#F4F5F9"} stroke={o.active ? "none" : "#E2E6EE"} strokeWidth="1.5" />
            <text x={o.x} y={o.y + 4} textAnchor="middle" fill={o.active ? "white" : "#9099A8"} fontSize="8.5" fontWeight="600" fontFamily="Inter, sans-serif">{o.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function MyRoutesPage() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <>
      <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">My Routes</h1>
            <p className="text-[14px] text-ink-3">Manage the routes and capabilities that power your bid recommendations.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-[13.5px] font-semibold
                       hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                       transition-all duration-200 cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={2.2} /> Add Route
          </button>
        </div>

        {/* Visual map */}
        <RouteVisual routes={ROUTES} />

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total Routes",    value: ROUTES.length.toString()                                               },
            { label: "Verified",        value: ROUTES.filter(r => r.status === "verified").length.toString()          },
            { label: "Completed Jobs",  value: ROUTES.reduce((a, r) => a + r.jobs, 0).toString()                      },
            { label: "Avg Win Rate",    value: Math.round(ROUTES.filter(r => r.jobs > 0).reduce((a, r) => a + r.winRate, 0) / ROUTES.filter(r => r.jobs > 0).length) + "%" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-[14px] border border-line p-4">
              <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-[0.07em]">{s.label}</span>
              <p className="text-[22px] font-bold text-ink tracking-[-0.5px] leading-none mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Route cards */}
        <div className="flex flex-col gap-4">
          {ROUTES.map((route, i) => {
            const cfg = STATUS_CFG[route.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={route.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.04 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-[16px] border border-line p-6 transition-all duration-200 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <p className="text-[16px] font-semibold text-ink">{route.origin}</p>
                      <span className="text-ink-3 font-normal">→</span>
                      <p className="text-[16px] font-semibold text-ink">Hong Kong (HKG)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {route.modes.map(m => (
                        <div key={m} className="flex items-center gap-1.5">
                          {m === "Air" ? <Plane className="w-3.5 h-3.5 text-navy" strokeWidth={1.75} /> : <Ship className="w-3.5 h-3.5 text-navy" strokeWidth={1.75} />}
                          <span className="text-[12.5px] font-medium text-navy">{m}</span>
                        </div>
                      ))}
                      <span className="text-line">·</span>
                      <span className="text-[12.5px] text-ink-2">Max {route.capacityKg.toLocaleString()} kg</span>
                      {route.certified && (
                        <>
                          <span className="text-line">·</span>
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald" strokeWidth={2.2} />
                            <span className="text-[12px] text-emerald font-medium">IATA Certified</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      <StatusIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      <span className="text-[11px] font-semibold">{cfg.label}</span>
                    </div>
                    <button className="px-3.5 py-1.5 rounded-lg border border-line text-[12px] font-medium text-ink-2 hover:bg-canvas hover:text-ink transition-all duration-200 cursor-pointer">
                      Edit
                    </button>
                  </div>
                </div>

                {route.status === "incomplete" ? (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <p className="text-[12.5px] font-semibold text-red-700">Route is incomplete</p>
                      <p className="text-[12px] text-red-600 mt-0.5">Add at least one service and upload your credentials to activate this route for bid eligibility.</p>
                    </div>
                  </div>
                ) : route.status === "pending" ? (
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <Clock className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <p className="text-[12.5px] text-amber-700">Pending LBID verification. You can bid on open requests during verification. Verification typically takes 2 business days.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4 pt-4 border-t border-line-light">
                    <div>
                      <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-[0.07em]">Jobs Completed</span>
                      <p className="text-[18px] font-bold text-ink mt-0.5">{route.jobs}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-[0.07em]">Win Rate</span>
                      <p className="text-[18px] font-bold text-emerald mt-0.5">{route.winRate}%</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-[0.07em]">Services</span>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {route.services.map(s => (
                          <span key={s} className="text-[11px] text-ink-2 bg-canvas border border-line px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Add Route modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(8,18,42,0.45)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowAdd(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-line w-[440px] p-7"
              style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
            >
              <div className="flex items-start justify-between mb-5">
                <p className="text-[17px] font-bold text-ink">Add New Route</p>
                <button onClick={() => setShowAdd(false)} className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3 hover:bg-canvas cursor-pointer transition-all">
                  <X className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-ink-2">Origin Region</label>
                  <select className="w-full px-3.5 py-2.5 rounded-xl border-2 border-line text-[13.5px] text-ink outline-none focus:border-navy transition-all appearance-none cursor-pointer">
                    <option value="">Select origin…</option>
                    <option>Vietnam (SGN / HAN)</option>
                    <option>Thailand (BKK)</option>
                    <option>Malaysia (KUL)</option>
                    <option>Philippines (MNL)</option>
                    <option>Indonesia (CGK)</option>
                    <option>South Korea (ICN)</option>
                    <option>Japan (NRT / KIX)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-ink-2">Freight Mode</label>
                  <div className="flex gap-2">
                    {["Air","Sea"].map(m => (
                      <label key={m} className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-line hover:border-navy/30 cursor-pointer transition-all duration-200">
                        <input type="checkbox" className="accent-navy" />
                        {m === "Air" ? <Plane className="w-3.5 h-3.5 text-navy" strokeWidth={1.75} /> : <Ship className="w-3.5 h-3.5 text-navy" strokeWidth={1.75} />}
                        <span className="text-[13px] font-medium text-ink">{m}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-ink-2">Max Capacity (kg)</label>
                  <input type="number" placeholder="e.g. 2000" className="w-full px-3.5 py-2.5 rounded-xl border-2 border-line text-[13.5px] text-ink outline-none focus:border-navy transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none" />
                </div>
                <button
                  onClick={() => setShowAdd(false)}
                  className="w-full py-3 rounded-xl bg-navy text-white text-[13.5px] font-semibold hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)] transition-all duration-200 cursor-pointer"
                >
                  Add Route
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
