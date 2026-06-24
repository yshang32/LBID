import { useNavigate } from "react-router";
import { ClipboardList, Users, CreditCard, Shield, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

const STATS = [
  { label: "Pending Review",    value: "4",  color: "text-amber-700", bg: "bg-amber-50",      border: "border-amber-200", icon: ClipboardList },
  { label: "Unverified Fwdrs", value: "2",  color: "text-blue-700",  bg: "bg-blue-50",       border: "border-blue-200",  icon: Shield        },
  { label: "Pending Payments", value: "3",  color: "text-red-700",   bg: "bg-red-50",        border: "border-red-200",   icon: CreditCard    },
  { label: "Active Accounts",  value: "47", color: "text-emerald",   bg: "bg-emerald-soft",  border: "border-emerald/20",icon: Users         },
];

const RECENT_EVENTS = [
  { type: "request",  text: "New request BKK → HKG submitted by TechFlow HK",      time: "2 min ago",   action: "Review" },
  { type: "payment",  text: "Payment proof uploaded for INV-0043 · Pacific Freight", time: "14 min ago",  action: "Confirm" },
  { type: "verify",   text: "Blue River Logistics applied for Forwarder verification", time: "1 hour ago", action: "Verify" },
  { type: "request",  text: "New request PVG → HKG · 3,200 kg submitted",            time: "2 hours ago", action: "Review" },
  { type: "payment",  text: "Premier subscription payment from Orient Cargo",         time: "3 hours ago", action: "Confirm" },
  { type: "verify",   text: "VietConnect Logistics verification documents received",  time: "5 hours ago", action: "Verify" },
];

const EVENT_CFG: Record<string, { color: string; bg: string; border: string }> = {
  request: { color: "text-amber-700", bg: "bg-amber-50",     border: "border-amber-200"  },
  payment: { color: "text-blue-700",  bg: "bg-blue-50",      border: "border-blue-200"   },
  verify:  { color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20" },
};

const QUICK_LINKS = [
  { label: "Review Requests",    to: "/admin/requests", icon: ClipboardList, badge: 4, badgeColor: "bg-amber-500" },
  { label: "Verify Forwarders",  to: "/admin/accounts", icon: Shield,        badge: 2, badgeColor: "bg-blue-500"  },
  { label: "Confirm Payments",   to: "/admin/payments", icon: CreditCard,    badge: 3, badgeColor: "bg-red-500"   },
  { label: "Audit Trail",        to: "/admin/audit",    icon: ClipboardList, badge: 0, badgeColor: ""             },
];

export function AdminDashboardPage() {
  const navigate = useNavigate();
  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      {/* Admin mode banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" strokeWidth={2} />
        <p className="text-[12.5px] text-amber-800 font-medium">Admin Mode — Actions here affect live platform data. Proceed carefully.</p>
      </div>

      <div>
        <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Admin Operations</h1>
        <p className="text-[14px] text-ink-3">Platform overview · 23 Jun 2026</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[14px] border border-line p-4 flex flex-col gap-2"
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} border ${s.border}`}>
              <s.icon className={`w-4 h-4 ${s.color}`} strokeWidth={1.75} />
            </div>
            <p className={`text-[24px] font-bold tracking-[-0.5px] leading-none ${s.color}`}>{s.value}</p>
            <p className="text-[11.5px] text-ink-3 font-medium">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-4 gap-3">
        {QUICK_LINKS.map(link => (
          <button
            key={link.to}
            onClick={() => navigate(link.to)}
            className="group flex items-center justify-between bg-white rounded-[14px] border border-line px-4 py-3.5
                       hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(0,0,0,0.07)] hover:border-[#C8CDD8]
                       transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <link.icon className="w-4 h-4 text-ink-2 group-hover:text-navy transition-colors duration-200" strokeWidth={1.75} />
              <span className="text-[13px] font-medium text-ink">{link.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {link.badge > 0 && (
                <span className={`w-5 h-5 rounded-full ${link.badgeColor} text-white text-[10px] font-bold flex items-center justify-center`}>
                  {link.badge}
                </span>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-line group-hover:text-navy transition-colors duration-200" strokeWidth={2} />
            </div>
          </button>
        ))}
      </div>

      {/* Activity feed */}
      <div>
        <p className="text-[13.5px] font-semibold text-ink mb-4">Recent Activity</p>
        <div className="bg-white rounded-[16px] border border-line overflow-hidden">
          {RECENT_EVENTS.map((ev, i) => {
            const cfg = EVENT_CFG[ev.type];
            return (
              <div key={i} className={`flex items-center gap-4 px-5 py-4 hover:bg-canvas transition-colors duration-150 cursor-pointer
                ${i < RECENT_EVENTS.length - 1 ? "border-b border-line-light" : ""}`}>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-[0.07em] flex-shrink-0 ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                  {ev.type}
                </span>
                <p className="flex-1 text-[13px] text-ink-2 min-w-0 truncate">{ev.text}</p>
                <span className="text-[11.5px] text-ink-3 flex-shrink-0">{ev.time}</span>
                <button
                  onClick={e => { e.stopPropagation(); navigate(ev.type === "request" ? "/admin/requests" : ev.type === "payment" ? "/admin/payments" : "/admin/accounts"); }}
                  className="px-3 py-1.5 rounded-lg bg-canvas border border-line text-[12px] font-medium text-ink-2
                             hover:bg-navy-soft hover:border-navy/20 hover:text-navy transition-all duration-200 cursor-pointer flex-shrink-0"
                >
                  {ev.action} →
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
