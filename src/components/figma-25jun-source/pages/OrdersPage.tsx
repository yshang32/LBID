import { useNavigate } from "react-router";
import { Plane, Ship, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

const ORDERS = [
  {
    id: "ORD-2026-0047", route: "Taipei → HKG", type: "Air" as const,
    cargo: "Tech Components · 450 kg", partner: "Pacific Forward Ltd.",
    status: "in_transit", statusLabel: "In Transit",
    date: "Awarded 19 Jun · ETA 23 Jun",
    quoteHKD: 14200,
  },
  {
    id: "ORD-2026-0039", route: "Guangzhou → HKG", type: "Air" as const,
    cargo: "General Goods · 800 kg", partner: "Blue Ocean Freight HK",
    status: "completed", statusLabel: "Completed",
    date: "Completed 15 Jun",
    quoteHKD: 24800,
  },
  {
    id: "ORD-2026-0031", route: "Shanghai → HKG", type: "Sea" as const,
    cargo: "Machinery · 3,200 kg", partner: "Asia Gateway Express",
    status: "customs_cleared", statusLabel: "Customs Cleared",
    date: "Awarded 10 Jun · Delivered 22 Jun",
    quoteHKD: 38600,
  },
];

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  in_transit:     { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  customs_cleared:{ color: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-200"  },
  delivered:      { color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20" },
  completed:      { color: "text-ink-2",     bg: "bg-canvas",   border: "border-line"      },
};

export function OrdersPage() {
  const navigate = useNavigate();
  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      <div>
        <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Orders</h1>
        <p className="text-[14px] text-ink-3">{ORDERS.length} orders · 1 active</p>
      </div>
      <div className="flex flex-col gap-3">
        {ORDERS.map((ord, i) => {
          const cfg = STATUS_CFG[ord.status] ?? STATUS_CFG.completed;
          return (
            <motion.div
              key={ord.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.04 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              onClick={() => navigate(`/orders/${ord.id}`)}
              className="group bg-white rounded-[16px] border border-line px-6 py-5 flex items-center gap-5
                         cursor-pointer transition-all duration-200 ease-in-out
                         hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:border-[#C8CDD8]"
            >
              <div className="w-10 h-10 rounded-[11px] bg-canvas flex items-center justify-center flex-shrink-0
                              transition-colors duration-200 group-hover:bg-navy-soft">
                {ord.type === "Air"
                  ? <Plane className="w-4 h-4 text-ink-2 group-hover:text-navy transition-colors duration-200" strokeWidth={1.75} />
                  : <Ship  className="w-4 h-4 text-ink-2 group-hover:text-navy transition-colors duration-200" strokeWidth={1.75} />
                }
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="flex items-center gap-2.5">
                  <p className="text-[15px] font-semibold text-ink">{ord.id}</p>
                  <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    {ord.statusLabel}
                  </span>
                </div>
                <p className="text-[13px] text-ink-2">{ord.route} · {ord.cargo}</p>
                <p className="text-[12px] text-ink-3">{ord.partner} · {ord.date}</p>
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className="text-[10.5px] text-ink-3">Quote</p>
                  <p className="text-[14px] font-semibold text-ink">HKD {ord.quoteHKD.toLocaleString()}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-line group-hover:text-navy transition-colors duration-200" strokeWidth={2} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
