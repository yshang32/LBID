import { useState, useEffect } from "react";
import { Plane, Lock, CheckCircle2, Clock, Award, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* ── Countdown hook ──────────────────────────────── */
function useCountdown(initialSeconds: number) {
  const [secs, setSecs] = useState(initialSeconds);
  useEffect(() => {
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  return { m: Math.floor(secs / 60), s: secs % 60, total: secs };
}

/* ── Match Arc SVG ───────────────────────────────── */
function MatchArc({ pct }: { pct: number }) {
  const r = 32, c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      aria-label={`${pct}% match`}
      style={{ filter: "drop-shadow(0 0 8px rgba(196,154,60,0.18))" }}
    >
      {/* Track */}
      <circle cx="40" cy="40" r={r} fill="none" stroke="#F0EBD9" strokeWidth="4.5" />
      {/* Fill */}
      <circle
        cx="40" cy="40" r={r}
        fill="none"
        stroke="#C49A3C"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${c - dash}`}
        transform="rotate(-90 40 40)"
        style={{ transition: "stroke-dasharray 0.7s cubic-bezier(0.16,1,0.3,1)" }}
      />
      {/* Label */}
      <text
        x="40" y="37"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#7A5E18"
        fontSize="13.5"
        fontWeight="700"
        fontFamily="Inter, -apple-system, sans-serif"
        letterSpacing="-0.5"
      >
        {pct}%
      </text>
      <text
        x="40" y="50"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#B8922A"
        fontSize="8"
        fontWeight="600"
        fontFamily="Inter, -apple-system, sans-serif"
        letterSpacing="0.02em"
      >
        match
      </text>
    </svg>
  );
}

/* ── Match reasons ───────────────────────────────── */
const REASONS = [
  { text: "Air cargo capacity ≥ 400 kg verified",         tier: "primary"   },
  { text: "SGN → HKG active route on record",             tier: "primary"   },
  { text: "4.9★ avg. rating on HKG deliveries (32 jobs)", tier: "secondary" },
  { text: "IATA Cargo Agent certified",                   tier: "secondary" },
];

const SPECS = [
  { label: "Weight",   value: "500 kg"  },
  { label: "Volume",   value: "3 CBM"   },
  { label: "Freight",  value: "Air"     },
  { label: "Cargo",    value: "General" },
  { label: "Pickup",   value: "26 Jun"  },
  { label: "Delivery", value: "27 Jun"  },
];

/* ── Hero Opportunity ────────────────────────────── */
export function HeroOpportunity() {
  const { m, s, total } = useCountdown(14 * 60);
  const [quote, setQuote]         = useState("");
  const [submitted, setSubmitted] = useState(false);
  const isUrgent  = total < 5 * 60;
  const canSubmit = quote.trim() !== "" && parseFloat(quote) > 0;

  function handleSubmit() {
    if (canSubmit) setSubmitted(true);
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      aria-label="Recommended shipment opportunity"
      className="relative bg-white rounded-[20px] border border-line/80 overflow-hidden"
      /* Deeper, layered shadow — makes card feel elevated above the page */
      style={{
        boxShadow: "0 8px 40px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.05), 0 0 0 0.5px rgba(0,0,0,0.04)",
      }}
    >
      {/* Navy → Gold gradient top accent */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-[3px] rounded-t-[20px]"
        style={{ background: "linear-gradient(90deg, #0C1A3E 0%, #1E3A7A 55%, #C49A3C 100%)" }}
      />

      {/* Subtle hero gradient wash */}
      <div
        aria-hidden
        className="absolute top-0 inset-x-0 h-56 pointer-events-none"
        style={{ background: "linear-gradient(180deg, #FAFBFF 0%, transparent 100%)" }}
      />

      <div className="relative flex flex-col gap-0 pt-9 pb-8 px-8">

        {/* ── Header row ─────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          {/* Left: label + match pill */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="w-1.5 h-1.5 rounded-full bg-gold"
                style={{ animation: "pulse 2.2s ease-in-out infinite" }}
              />
              {/* text-gold-dark (#9A7520) gives ~4.8:1 contrast on white — passes WCAG AA */}
              <span className="text-[10.5px] font-bold text-gold-dark tracking-[0.09em] uppercase select-none">
                Recommended for You
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-soft border border-gold-border">
              <Award className="w-3 h-3 text-gold flex-shrink-0" strokeWidth={2.2} />
              <span className="text-[11.5px] font-semibold text-gold-dark select-none">94% profile match</span>
            </div>
          </div>

          {/* Right: countdown */}
          <motion.div
            animate={isUrgent ? { scale: [1, 1.025, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
              isUrgent
                ? "bg-red-50 border-red-200"
                : "bg-white/80 backdrop-blur-sm border-line shadow-[0_1px_4px_rgba(0,0,0,0.05)]"
            }`}
          >
            <Clock
              className={`w-3.5 h-3.5 flex-shrink-0 ${isUrgent ? "text-red-500" : "text-ink-3"}`}
              strokeWidth={2}
            />
            <span
              className={`font-mono text-[14px] font-bold tabular-nums tracking-[0.03em] ${
                isUrgent ? "text-red-700" : "text-ink"
              }`}
            >
              {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
            </span>
            <span className={`text-[11px] ${isUrgent ? "text-red-400" : "text-ink-3"}`}>
              remaining
            </span>
          </motion.div>
        </div>

        {/* ── Route visualization ─────────────────────── */}
        <div className="flex items-center mb-8">
          {/* Origin */}
          <div className="flex-1 flex flex-col gap-1.5">
            <span className="text-[10px] font-semibold text-ink-3 tracking-[0.09em] uppercase">Origin</span>
            <p className="text-[26px] font-bold text-ink tracking-[-0.6px] leading-[1.1]">
              Ho Chi Minh City
            </p>
            <p className="text-[13px] text-ink-2">SGN · Tan Son Nhat Intl.</p>
          </div>

          {/* Connector */}
          <div className="flex flex-col items-center gap-2 px-10">
            <div className="flex items-center gap-2">
              <div
                className="h-px w-14"
                style={{ background: "linear-gradient(90deg, #E2E6EE, #0C1A3E)" }}
              />
              <div
                className="w-10 h-10 rounded-full bg-navy flex items-center justify-center flex-shrink-0"
                style={{ boxShadow: "0 4px 16px rgba(12,26,62,0.30)" }}
              >
                <Plane className="w-4.5 h-4.5 text-white" strokeWidth={1.75} />
              </div>
              <div
                className="h-px w-14"
                style={{ background: "linear-gradient(90deg, #0C1A3E, #E2E6EE)" }}
              />
            </div>
            <span className="text-[10px] font-semibold text-navy tracking-[0.06em] uppercase
                             bg-navy-soft px-2.5 py-0.5 rounded-full">
              Air · ~2h 30m
            </span>
          </div>

          {/* Destination */}
          <div className="flex-1 flex flex-col items-end gap-1.5">
            <span className="text-[10px] font-semibold text-ink-3 tracking-[0.09em] uppercase">Destination</span>
            <p className="text-[26px] font-bold text-ink tracking-[-0.6px] leading-[1.1]">
              Hong Kong
            </p>
            <p className="text-[13px] text-ink-2">HKG · Hong Kong Intl. Airport</p>
          </div>
        </div>

        {/* ── Specs strip ──────────────────────────────── */}
        <div className="flex items-center gap-0 py-5 mb-7 border-y border-line-light">
          {SPECS.map((spec, i) => (
            <div
              key={spec.label}
              className={`flex flex-col gap-1.5 ${
                /* pr-8 gives more breathing room; mr-8 creates visible gap before separator */
                i < SPECS.length - 1 ? "pr-8 mr-8 border-r border-line" : ""
              }`}
            >
              <span className="text-[10px] font-semibold text-ink-3 tracking-[0.08em] uppercase">
                {spec.label}
              </span>
              <span className="text-[14px] font-semibold text-ink">{spec.value}</span>
            </div>
          ))}
        </div>

        {/* ── Bottom: Why selected + Bid ───────────────── */}
        <div className="grid gap-10" style={{ gridTemplateColumns: "1fr 300px" }}>

          {/* Left — match breakdown */}
          <div className="flex flex-col gap-5">
            <div className="flex items-start gap-4">
              <MatchArc pct={94} />
              <div className="flex flex-col gap-1 flex-1 pt-1">
                <span className="text-[10px] font-bold text-ink-3 tracking-[0.09em] uppercase mb-1.5">
                  Why you were selected
                </span>
                {REASONS.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
                        r.tier === "primary" ? "text-emerald" : "text-emerald-mid"
                      }`}
                      strokeWidth={2.2}
                    />
                    <span
                      className={`text-[13px] leading-[1.4] ${
                        r.tier === "primary"
                          ? "text-ink font-medium"
                          : "text-ink-2 font-normal"
                      }`}
                    >
                      {r.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy note */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-canvas border border-line">
              <Lock className="w-3.5 h-3.5 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <p className="text-[12px] text-ink-2 leading-[1.6]">
                Your quote is{" "}
                <strong className="font-semibold text-ink">sealed and confidential</strong>. The shipper
                sees only that qualified forwarders have responded — not the amount or your identity.
                Quotes are revealed only after the bidding window closes.
              </p>
            </div>
          </div>

          {/* Right — bid panel */}
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-ink-3 tracking-[0.09em] uppercase">
              Your Sealed Quote
            </span>

            <AnimatePresence mode="wait">
              {submitted ? (
                /* ── Success state ── */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col items-center text-center gap-3 py-6"
                >
                  <div className="w-12 h-12 rounded-full bg-emerald-soft border border-emerald/30 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald" strokeWidth={2} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[14px] font-semibold text-ink">Quote Submitted</p>
                    <p className="text-[13px] text-ink-2">
                      HKD {parseFloat(quote).toLocaleString("en-HK", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <p className="text-[11.5px] text-ink-3 leading-[1.55] px-4">
                    You'll be notified when the shipper makes their selection.
                  </p>
                  <button className="flex items-center gap-1 text-[12px] font-medium text-navy transition-all duration-200 ease-in-out hover:underline">
                    View receipt <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                </motion.div>
              ) : (
                /* ── Quote form ── */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-3"
                >
                  <div
                    className="relative rounded-xl border-2 border-line bg-white transition-all duration-200 ease-in-out
                               focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]"
                  >
                    <span
                      aria-hidden
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink-3 select-none pointer-events-none"
                    >
                      HKD
                    </span>
                    <input
                      type="number"
                      value={quote}
                      onChange={(e) => setQuote(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit();
                      }}
                      placeholder="0.00"
                      aria-label="Quote amount in HKD"
                      className="w-full pl-[52px] pr-4 py-4 text-[22px] font-semibold text-ink tracking-[-0.3px]
                                 bg-transparent outline-none rounded-xl
                                 placeholder:text-line
                                 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>

                  {/*
                    Submit CTA — gradient background gives depth and premium feel.
                    Active state slightly compresses the button (tactile feedback).
                  */}
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full py-3.5 rounded-xl text-[13.5px] font-semibold tracking-[0.02em] text-white
                               transition-all duration-200 ease-in-out
                               hover:enabled:-translate-y-[1px]
                               hover:enabled:shadow-[0_8px_28px_rgba(12,26,62,0.32)]
                               active:enabled:translate-y-0 active:enabled:scale-[0.99]
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40
                               disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: "linear-gradient(135deg, #0C1A3E 0%, #1A3A7A 100%)",
                      /* CSS spaces not underscores — underscores are only for Tailwind arbitrary values */
                      boxShadow: canSubmit
                        ? "0 4px 16px rgba(12,26,62,0.24), inset 0 1px 0 rgba(255,255,255,0.08)"
                        : "none",
                    }}
                  >
                    Submit Sealed Quote
                  </button>

                  <p className="text-center text-[10.5px] text-ink-3">
                    ⌘ Return to submit · Quote is binding upon acceptance
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
