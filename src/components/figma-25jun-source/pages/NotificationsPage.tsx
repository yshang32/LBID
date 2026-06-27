import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck } from "lucide-react";
import { motion } from "motion/react";

interface Notif {
  id: number;
  type: "bid_window" | "bid_received" | "awarded" | "verified" | "system";
  title: string;
  body: string;
  time: string;
  read: boolean;
  action?: { label: string; path: string };
}

const INIT: Notif[] = [
  {
    id: 1, type: "bid_window", read: false,
    title: "Bid window open",
    body: "Your request BKK to HKG (SR-004) is now accepting sealed bids. Window closes in 3 hours.",
    time: "2 hours ago",
    action: { label: "View Request", path: "/requests" },
  },
  {
    id: 2, type: "bid_received", read: false,
    title: "New bids received",
    body: "6 forwarders have submitted sealed bids for your Manila to HKG request (SR-003). Bidding closed.",
    time: "5 hours ago",
    action: { label: "Compare Bids", path: "/quotations/compare" },
  },
  {
    id: 3, type: "awarded", read: true,
    title: "Order confirmed",
    body: "Pacific Forward Ltd. has been awarded Taipei to HKG (SR-005). Order ORD-2026-0047 is now active.",
    time: "Yesterday",
    action: { label: "View Order", path: "/orders/ORD-2026-0047" },
  },
  {
    id: 4, type: "verified", read: true,
    title: "IATA credentials verified",
    body: "Your IATA Cargo Agent certification has been confirmed by the LBID verification team.",
    time: "20 Jun",
  },
  {
    id: 5, type: "system", read: true,
    title: "Request approved",
    body: "Your request BKK to HKG (SR-004) is now accepting sealed bids. Window closes in 3 hours.",
    time: "20 Jun",
  },
];

const TYPE_CFG = {
  bid_window:   { dot: "bg-amber-500",  bg: "bg-amber-50",      border: "border-amber-200"   },
  bid_received: { dot: "bg-blue-500",   bg: "bg-blue-50",       border: "border-blue-200"    },
  awarded:      { dot: "bg-emerald",    bg: "bg-emerald-soft",  border: "border-emerald/20"  },
  verified:     { dot: "bg-gold",       bg: "bg-gold-soft",     border: "border-gold-border" },
  system:       { dot: "bg-ink-3",      bg: "bg-canvas",        border: "border-line"        },
};

export function NotificationsPage() {
  const navigate  = useNavigate();
  const [notifs, setNotifs] = useState(INIT);
  const unread = notifs.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifs((ns) => ns.map((n) => ({ ...n, read: true })));
  }
  function markRead(id: number) {
    setNotifs((ns) => ns.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6 max-w-[640px]">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Notifications</h1>
          <p className="text-[14px] text-ink-3">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-[12.5px] font-medium text-navy hover:underline underline-offset-2 transition-all cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" strokeWidth={2} /> Mark all read
          </button>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {notifs.map((n, i) => {
          const cfg = TYPE_CFG[n.type];
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.04 + i * 0.04, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => markRead(n.id)}
              className={`relative flex items-start gap-4 p-5 rounded-[14px] border transition-all duration-200 cursor-default
                ${!n.read ? "bg-white border-navy/20 shadow-[0_2px_12px_rgba(12,26,62,0.06)]" : "bg-white border-line"}
                hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]`}
            >
              {/* Unread indicator */}
              {!n.read && (
                <span
                  aria-label="Unread"
                  className="absolute top-4 right-4 w-2 h-2 rounded-full bg-navy"
                />
              )}

              {/* Type dot */}
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5 ${cfg.dot}`} aria-hidden />

              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <p className={`text-[13.5px] ${!n.read ? "font-semibold text-ink" : "font-medium text-ink-2"}`}>
                  {n.title}
                </p>
                <p className="text-[12.5px] text-ink-3 leading-relaxed">{n.body}</p>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-[11px] text-ink-3">{n.time}</span>
                  {n.action && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markRead(n.id); navigate(n.action!.path); }}
                      className="text-[11.5px] font-semibold text-navy hover:underline underline-offset-2 transition-all cursor-pointer"
                    >
                      {n.action.label} →
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {notifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-canvas border border-line flex items-center justify-center">
              <Bell className="w-5 h-5 text-ink-3" strokeWidth={1.75} />
            </div>
            <p className="text-[14px] font-medium text-ink">No notifications</p>
            <p className="text-[13px] text-ink-3">You're all caught up.</p>
          </div>
        )}
      </div>
    </div>
  );
}
