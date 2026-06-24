import { motion } from "motion/react";
import { ChevronRight } from "lucide-react";

const ACTIVITIES = [
  {
    id: 1,
    title:  "Quote accepted",
    detail: "Guangzhou → Sydney · Air Freight · HKD 24,800",
    time:   "Yesterday, 4:32 PM",
    dot:    { bg: "bg-emerald-soft", ring: "ring-emerald/20", text: "text-emerald", symbol: "✓" },
  },
  {
    id: 2,
    title:  "Route certification added",
    detail: "Vietnam corridor approved by LBID review team",
    time:   "20 Jun",
    dot:    { bg: "bg-navy-soft", ring: "ring-navy/20", text: "text-navy", symbol: "★" },
  },
  {
    id: 3,
    title:  "Profile verified",
    detail: "IATA credentials confirmed · Badge awarded",
    time:   "18 Jun",
    dot:    { bg: "bg-gold-soft", ring: "ring-gold/20", text: "text-gold-dark", symbol: "✓" },
  },
  {
    id: 4,
    title:  "Quote submitted",
    detail: "Manila → Hong Kong · Air · Under review",
    time:   "17 Jun",
    dot:    { bg: "bg-canvas", ring: "ring-line", text: "text-ink-3", symbol: "→" },
  },
];

export function RecentActivity() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[13.5px] font-semibold text-ink">Activity</h2>
        <button
          className="flex items-center gap-0.5 text-[12px] font-medium text-navy
                     transition-all duration-200 ease-in-out hover:underline underline-offset-2"
        >
          All <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>

      {/* Feed card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white border border-line rounded-[14px] overflow-hidden
                   shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
      >
        {/* Timeline — vertical connector line using relative/before pseudo */}
        <div className="relative">
          {/* Vertical line — absolute decoration */}
          <div
            aria-hidden
            className="absolute top-0 bottom-0 left-[30px] w-px bg-line-light"
          />

          {ACTIVITIES.map((act, i) => (
            <div
              key={act.id}
              className={`relative flex items-start gap-3 px-4 py-3.5
                          transition-colors duration-150 ease-in-out hover:bg-canvas cursor-default
                          ${i < ACTIVITIES.length - 1 ? "border-b border-line-light" : ""}`}
            >
              {/* Dot — sits on the vertical line */}
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                             ring-2 ${act.dot.bg} ${act.dot.ring} mt-0.5`}
              >
                <span className={`text-[10px] font-bold leading-none ${act.dot.text}`}>
                  {act.dot.symbol}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <p className="text-[13px] font-medium text-ink leading-snug">{act.title}</p>
                <p className="text-[11.5px] text-ink-2 truncate">{act.detail}</p>
                <p className="text-[10.5px] text-ink-3 mt-0.5">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
