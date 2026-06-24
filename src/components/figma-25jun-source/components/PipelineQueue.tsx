import { Plane, Ship, ChevronRight, Clock } from "lucide-react";
import { motion } from "motion/react";

const OPPORTUNITIES = [
  {
    id: 1,
    origin: "Shanghai",
    originCode: "PVG",
    dest: "Singapore",
    destCode: "SIN",
    type: "Sea" as const,
    weight: "2,100 kg",
    cbm: "14 CBM",
    match: 82,
    timeLeft: "4h 20m",
  },
  {
    id: 2,
    origin: "Bangkok",
    originCode: "BKK",
    dest: "Tokyo",
    destCode: "NRT",
    type: "Air" as const,
    weight: "320 kg",
    cbm: "2.1 CBM",
    match: 78,
    timeLeft: "2 days",
  },
  {
    id: 3,
    origin: "Shenzhen",
    originCode: "SZX",
    dest: "London",
    destCode: "LHR",
    type: "Sea" as const,
    weight: "8,500 kg",
    cbm: "42 CBM",
    match: 71,
    timeLeft: "5 days",
  },
];

function matchColor(pct: number) {
  if (pct >= 80) return "text-emerald";
  if (pct >= 70) return "text-blue-600";
  return "text-ink-2";
}
function matchBarColor(pct: number) {
  if (pct >= 80) return "bg-emerald";
  if (pct >= 70) return "bg-blue-600";
  return "bg-ink-3";
}

export function PipelineQueue() {
  return (
    <div className="flex flex-col gap-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-[13.5px] font-semibold text-ink">
          Other Opportunities
        </h2>
        <button
          className="flex items-center gap-0.5 text-[12px] font-medium text-navy
                     transition-all duration-200 ease-in-out hover:underline underline-offset-2"
        >
          View all{" "}
          <ChevronRight
            className="w-3.5 h-3.5"
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {OPPORTUNITIES.map((opp, i) => (
          <OpRow key={opp.id} opp={opp} delay={i * 0.07} />
        ))}
      </div>
    </div>
  );
}

function OpRow({
  opp,
  delay,
}: {
  opp: (typeof OPPORTUNITIES)[0];
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.38,
        delay: 0.22 + delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      /*
        "group" enables group-hover:* on child elements.
        The row lifts and gains shadow on hover — no borders thicken.
      */
      className="group flex items-center gap-3 bg-white rounded-[14px] border border-line px-5 py-4
                 transition-all duration-200 ease-in-out cursor-pointer
                 hover:-translate-y-0.5 hover:shadow-[0_4px_18px_rgba(0,0,0,0.07)]
                 hover:border-[#C8CDD8]"
      role="button"
      tabIndex={0}
      aria-label={`${opp.origin} to ${opp.dest}, ${opp.match}% match`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          e.currentTarget.click();
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-[10px] bg-canvas flex items-center justify-center flex-shrink-0
                   transition-colors duration-200 ease-in-out group-hover:bg-navy-soft"
      >
        {opp.type === "Air" ? (
          <Plane
            className="w-4 h-4 text-ink-2 transition-colors duration-200 group-hover:text-navy"
            strokeWidth={1.75}
          />
        ) : (
          <Ship
            className="w-4 h-4 text-ink-2 transition-colors duration-200 group-hover:text-navy"
            strokeWidth={1.75}
          />
        )}
      </div>

      {/* Route + meta */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <p className="text-[13.5px] font-medium text-ink leading-none">
          {opp.origin}
          <span className="text-ink-3 font-normal mx-1.5">
            →
          </span>
          {opp.dest}
        </p>
        <p className="text-[12px] text-ink-3">
          {opp.weight} · {opp.cbm} · {opp.type}
        </p>
      </div>

      {/* Match score + time */}
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span
          className={`text-[12.5px] font-semibold ${matchColor(opp.match)}`}
        >
          {opp.match}% match
        </span>
        {/* Progress bar */}
        <div className="w-12 h-[3px] rounded-full bg-line overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${matchBarColor(opp.match)}`}
            style={{ width: `${opp.match}%` }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Clock
            className="w-3 h-3 text-ink-3"
            strokeWidth={1.75}
          />
          <span className="text-[11px] text-ink-3">
            {opp.timeLeft}
          </span>
        </div>
      </div>

      {/* Arrow — group-hover changes color */}
      <ChevronRight
        className="w-4 h-4 text-line flex-shrink-0 transition-colors duration-200 ease-in-out group-hover:text-navy"
        strokeWidth={2}
      />
    </motion.article>
  );
}