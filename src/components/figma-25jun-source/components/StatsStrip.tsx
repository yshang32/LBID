import { TrendingUp, Award, Activity } from "lucide-react";
import { motion } from "motion/react";

const STATS = [
  {
    icon:     Activity,
    label:    "Bids",           /* shortened — was "Bids this month", truncated on smaller cards */
    sub:      "This month",
    value:    "23",
    delta:    "+4 last mo.",
    positive: true,
  },
  {
    icon:     TrendingUp,
    label:    "Win Rate",       /* shortened — was "Success rate" */
    sub:      "Sealed bids",
    value:    "91%",
    delta:    "+2pp last mo.",
    positive: true,
  },
  {
    icon:     Award,
    label:    "Volume",         /* shortened — was "Total volume" */
    sub:      "Jun 2026",
    value:    "HKD 2.4M",
    delta:    "Jun 2026",
    positive: true,
  },
];

export function StatsStrip() {
  return (
    <div className="grid grid-cols-3 gap-3">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          /*
            Slightly transparent + no shadow = visually quieter than the Hero card.
            This is intentional — stats are context, not the call-to-action.
          */
          className="flex items-center gap-4 bg-white/70 rounded-[14px] border border-line/70
                     px-5 py-4 backdrop-blur-sm
                     transition-all duration-200 ease-in-out
                     hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]
                     hover:border-line"
        >
          {/* Icon chip */}
          <div className="w-9 h-9 rounded-[10px] bg-navy-soft flex items-center justify-center flex-shrink-0">
            <stat.icon className="w-4 h-4 text-navy" strokeWidth={1.75} />
          </div>

          {/* Text */}
          <div className="flex flex-col gap-0.5 min-w-0">
            {/* Short label — no truncate needed after shortening */}
            <span className="text-[10px] font-semibold text-ink-3 tracking-[0.07em] uppercase">
              {stat.label}
            </span>
            <p className="text-[20px] font-bold text-ink tracking-[-0.5px] leading-none">
              {stat.value}
            </p>
            <p className={`text-[11px] font-medium mt-0.5 ${stat.positive && stat.label !== "Volume" ? "text-emerald" : "text-ink-3"}`}>
              {stat.delta}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
