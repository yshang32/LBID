import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Plane, Lock, CheckCircle2, Clock, Award, ChevronLeft, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const OPP_DATA: Record<string, {
  origin: string; originCode: string; originAirport: string;
  dest: string; destCode: string; destAirport: string;
  type: "Air" | "Sea"; weight: string; cbm: string; cargo: string;
  pickup: string; delivery: string; shipper: string;
  match: number; matchReasons: { text: string; tier: "primary" | "secondary" }[];
  services: string[]; notes?: string; secsLeft: number; premium: boolean;
}> = {
  "1": {
    origin: "Ho Chi Minh City", originCode: "SGN", originAirport: "Tan Son Nhat Intl.",
    dest: "Hong Kong", destCode: "HKG", destAirport: "Hong Kong Intl.",
    type: "Air", weight: "500 kg", cbm: "3 CBM", cargo: "General",
    pickup: "26 Jun", delivery: "27 Jun", shipper: "VN Export Co.",
    match: 94, premium: true, secsLeft: 840,
    matchReasons: [
      { text: "Air cargo capacity ≥ 400 kg verified",          tier: "primary"   },
      { text: "SGN → HKG active route on record",              tier: "primary"   },
      { text: "4.9★ avg. rating on HKG deliveries (32 jobs)",  tier: "secondary" },
      { text: "IATA Cargo Agent certified",                    tier: "secondary" },
    ],
    services: ["Customs clearance (HKG)", "Commercial invoice", "Packing list", "Insurance"],
    notes: "Priority handling required at HKG terminal.",
  },
  "5": {
    origin: "Taipei", originCode: "TPE", originAirport: "Taiwan Taoyuan Intl.",
    dest: "Los Angeles", destCode: "LAX", destAirport: "Los Angeles Intl.",
    type: "Air", weight: "180 kg", cbm: "1.2 CBM", cargo: "Tech Components",
    pickup: "24 Jun", delivery: "25 Jun", shipper: "TW Tech Exports",
    match: 88, premium: true, secsLeft: 21600,
    matchReasons: [
      { text: "US export documentation experience verified", tier: "primary"   },
      { text: "TPE active route on record",                  tier: "primary"   },
      { text: "4.8★ avg. rating (18 jobs)",                 tier: "secondary" },
    ],
    services: ["Customs clearance (US)", "Commercial invoice", "Export packing"],
  },
};

const FALLBACK = OPP_DATA["1"];

export function QuoteConsolePage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const routeId  = Array.isArray(id) ? id[0] : id;
  const op       = OPP_DATA[routeId ?? ""] ?? FALLBACK;

  const [quote,     setQuote]     = useState("");
  const [transit,   setTransit]   = useState("");
  const [terms,     setTerms]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [focused,   setFocused]   = useState<string | null>(null);

  const canSubmit = quote.trim() !== "" && parseFloat(quote) > 0;
  const m  = Math.floor(op.secsLeft / 60);
  const s  = op.secsLeft % 60;
  const isUrgent = op.secsLeft < 300;

  const INPUT_CLS =
    "w-full px-3.5 py-2.5 rounded-xl border-2 border-line bg-white text-[13.5px] text-ink outline-none " +
    "placeholder:text-ink-3 transition-all duration-200 ease-in-out " +
    "focus:border-navy focus:shadow-[0_0_0_3px_rgba(12,26,62,0.07)]";

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      <button
        onClick={() => navigate("/opportunities")}
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors cursor-pointer w-fit"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2} /> Opportunities
      </button>

      {/* Page header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-ink tracking-[-0.6px] leading-[1.1] mb-1.5 m-0">
            Quote Console
          </h1>
          <p className="text-[14px] text-ink-2">{op.origin} → {op.dest} · {op.weight} · {op.cargo}</p>
        </div>
        {/* Countdown */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-300
          ${isUrgent ? "bg-red-50 border-red-200" : "bg-white/80 backdrop-blur-sm border-line shadow-[0_1px_4px_rgba(0,0,0,0.05)]"}`}
        >
          <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${isUrgent ? "text-red-500" : "text-ink-3"}`} strokeWidth={2} />
          <span className={`font-mono text-[14px] font-bold tabular-nums ${isUrgent ? "text-red-700" : "text-ink"}`}>
            {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
          </span>
          <span className={`text-[11px] ${isUrgent ? "text-red-400" : "text-ink-3"}`}>remaining</span>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
        {/* Left: Opportunity details */}
        <div className="flex flex-col gap-5">
          {/* Route card */}
          <div
            className="relative bg-white rounded-[18px] border border-line p-6 overflow-hidden"
            style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
          >
            <div aria-hidden className="absolute top-0 inset-x-0 h-[3px] rounded-t-[18px]"
              style={{ background: "linear-gradient(90deg, #0C1A3E 0%, #1E3A7A 55%, #C49A3C 100%)" }}
            />
            <div className="flex items-center mt-2">
              <div className="flex-1">
                <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-[0.09em]">Origin</span>
                <p className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-0.5 leading-none">{op.origin}</p>
                <p className="text-[12.5px] text-ink-2 mt-1">{op.originCode} · {op.originAirport}</p>
              </div>
              <div className="flex flex-col items-center px-8 gap-2">
                <div
                  className="w-9 h-9 rounded-full bg-navy flex items-center justify-center"
                  style={{ boxShadow: "0 3px 10px rgba(12,26,62,0.22)" }}
                >
                  <Plane className="w-4 h-4 text-white" strokeWidth={1.75} />
                </div>
                <span className="text-[10px] font-semibold text-navy bg-navy-soft px-2 py-0.5 rounded-full uppercase tracking-[0.06em]">
                  {op.type}
                </span>
              </div>
              <div className="flex-1 text-right">
                <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-[0.09em]">Destination</span>
                <p className="text-[22px] font-bold text-ink tracking-[-0.5px] mt-0.5 leading-none">{op.dest}</p>
                <p className="text-[12.5px] text-ink-2 mt-1">{op.destCode} · {op.destAirport}</p>
              </div>
            </div>

            {/* Specs */}
            <div className="flex items-center gap-0 mt-5 pt-4 border-t border-line-light">
              {[
                { l: "Weight",   v: op.weight   },
                { l: "Volume",   v: op.cbm      },
                { l: "Cargo",    v: op.cargo    },
                { l: "Pickup",   v: op.pickup   },
                { l: "Delivery", v: op.delivery },
              ].map(({ l, v }, i, arr) => (
                <div key={l} className={`flex flex-col gap-1 ${i < arr.length - 1 ? "pr-5 mr-5 border-r border-line" : ""}`}>
                  <span className="text-[10px] font-semibold text-ink-3 uppercase tracking-[0.08em]">{l}</span>
                  <span className="text-[13px] font-semibold text-ink">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Match + services */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-[16px] border border-line p-5">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-3.5 h-3.5 text-gold" strokeWidth={2} />
                <span className="text-[10.5px] font-bold text-gold-dark uppercase tracking-[0.07em]">{op.match}% Match</span>
              </div>
              <div className="flex flex-col gap-2">
                {op.matchReasons.map((r, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2
                      className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${r.tier === "primary" ? "text-emerald" : "text-emerald-mid"}`}
                      strokeWidth={2.2}
                    />
                    <span className={`text-[12.5px] leading-snug ${r.tier === "primary" ? "font-medium text-ink" : "text-ink-2"}`}>
                      {r.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[16px] border border-line p-5">
              <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.07em] block mb-3">Required Services</span>
              <div className="flex flex-col gap-2">
                {op.services.map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-emerald flex-shrink-0" strokeWidth={2.2} />
                    <span className="text-[12.5px] text-ink-2">{s}</span>
                  </div>
                ))}
              </div>
              {op.notes && (
                <div className="mt-3 pt-3 border-t border-line-light flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-[12px] text-ink-3 leading-relaxed">{op.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Sealed bid form */}
        <div
          className="bg-white rounded-[18px] border border-line p-6 h-fit"
          style={{ boxShadow: "0 4px_20px rgba(0,0,0,0.06)" }}
        >
          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center text-center gap-4 py-4"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-soft border border-emerald/20 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-ink">Quote Submitted</p>
                  <p className="text-[13px] text-ink-2 mt-0.5">
                    HKD {parseFloat(quote).toLocaleString("en-HK", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-[12px] text-ink-3 leading-relaxed px-2">
                  Your sealed bid is recorded. You'll be notified when the bidding window closes.
                </p>
                <button
                  onClick={() => navigate("/opportunities")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line text-[12.5px] font-medium text-ink-2
                             hover:bg-canvas hover:text-ink transition-all duration-200 cursor-pointer"
                >
                  Back to Opportunities
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" className="flex flex-col gap-4">
                <p className="text-[10.5px] font-bold text-ink-3 tracking-[0.09em] uppercase">Your Sealed Quote</p>

                {/* HKD input */}
                <div
                  className="relative rounded-xl border-2 border-line bg-white transition-all duration-200 ease-in-out
                             focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]"
                >
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-ink-3 select-none pointer-events-none">HKD</span>
                  <input
                    type="number"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-[52px] pr-4 py-4 text-[22px] font-semibold text-ink tracking-[-0.3px] bg-transparent outline-none rounded-xl placeholder:text-line [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                {/* Transit + terms */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-ink-2">Transit Time <span className="font-normal text-ink-3">(optional)</span></label>
                  <input
                    type="text"
                    value={transit}
                    onChange={(e) => setTransit(e.target.value)}
                    placeholder="e.g. 2 days"
                    className={INPUT_CLS}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] font-semibold text-ink-2">Terms <span className="font-normal text-ink-3">(optional)</span></label>
                  <textarea
                    value={terms}
                    onChange={(e) => setTerms(e.target.value)}
                    rows={2}
                    placeholder="Payment terms, conditions…"
                    className={`${INPUT_CLS} resize-none`}
                  />
                </div>

                <button
                  onClick={() => { if (canSubmit) setSubmitted(true); }}
                  disabled={!canSubmit}
                  className="w-full py-3.5 rounded-xl bg-navy text-white text-[13.5px] font-semibold tracking-[0.02em]
                             transition-all duration-200 ease-in-out cursor-pointer
                             hover:enabled:bg-navy-hover hover:enabled:-translate-y-[1px]
                             hover:enabled:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                             active:enabled:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Submit Sealed Quote
                </button>

                <div className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-[11.5px] text-ink-3 leading-relaxed">
                    Sealed and confidential. The shipper sees only that qualified forwarders have responded — not your amount or identity.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
