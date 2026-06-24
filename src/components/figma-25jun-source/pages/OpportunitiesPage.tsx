import { useState } from "react";
import {
  Plane, Ship, Search, SlidersHorizontal, Clock,
  ChevronRight, CheckCircle2, X, Lock, Award, Zap, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* ── Mock Token Store (global state in production) ───── */
const MOCK_TOKEN_BALANCE = 12; // Set to 0 to test the no-token Quick Top-up flow

/* ── Types ─────────────────────────────────────────── */
type FreightType = "Air" | "Sea" | "All";
type SortKey     = "match" | "deadline" | "weight";

interface Opportunity {
  id:          number;
  origin:      string;
  originCode:  string;
  dest:        string;
  destCode:    string;
  type:        "Air" | "Sea";
  weight:      string;
  weightKg:    number;
  cbm:         string;
  cargo:       string;
  match:       number;
  timeLeft:    string;
  secsLeft:    number;
  pickup:      string;
  delivery:    string;
  shipper:     string;
  notes?:      string;
  premium:     boolean;
}

/* ── Seed data ──────────────────────────────────────── */
const ALL_OPS: Opportunity[] = [
  {
    id: 1, origin: "Ho Chi Minh City", originCode: "SGN",
    dest: "Hong Kong", destCode: "HKG", type: "Air",
    weight: "500 kg", weightKg: 500, cbm: "3 CBM", cargo: "General",
    match: 94, timeLeft: "14 min", secsLeft: 840,
    pickup: "26 Jun", delivery: "27 Jun",
    shipper: "VN Export Co.", premium: true,
    notes: "Priority handling required at HKG terminal.",
  },
  {
    id: 2, origin: "Shanghai", originCode: "PVG",
    dest: "Singapore", destCode: "SIN", type: "Sea",
    weight: "2,100 kg", weightKg: 2100, cbm: "14 CBM", cargo: "Electronics",
    match: 82, timeLeft: "4h 20m", secsLeft: 15600,
    pickup: "28 Jun", delivery: "3 Jul",
    shipper: "SH Global Trade", premium: false,
  },
  {
    id: 3, origin: "Bangkok", originCode: "BKK",
    dest: "Tokyo", destCode: "NRT", type: "Air",
    weight: "320 kg", weightKg: 320, cbm: "2.1 CBM", cargo: "Perishable",
    match: 78, timeLeft: "2 days", secsLeft: 172800,
    pickup: "27 Jun", delivery: "28 Jun",
    shipper: "TH Fresh Foods", premium: false,
    notes: "Cold chain required. Temp 2–8°C.",
  },
  {
    id: 4, origin: "Shenzhen", originCode: "SZX",
    dest: "London", destCode: "LHR", type: "Sea",
    weight: "8,500 kg", weightKg: 8500, cbm: "42 CBM", cargo: "Machinery",
    match: 71, timeLeft: "5 days", secsLeft: 432000,
    pickup: "1 Jul", delivery: "20 Jul",
    shipper: "SZ Industrial Ltd.", premium: false,
  },
  {
    id: 5, origin: "Taipei", originCode: "TPE",
    dest: "Los Angeles", destCode: "LAX", type: "Air",
    weight: "180 kg", weightKg: 180, cbm: "1.2 CBM", cargo: "Tech Components",
    match: 88, timeLeft: "6h", secsLeft: 21600,
    pickup: "24 Jun", delivery: "25 Jun",
    shipper: "TW Tech Exports", premium: true,
  },
  {
    id: 6, origin: "Guangzhou", originCode: "CAN",
    dest: "Sydney", destCode: "SYD", type: "Air",
    weight: "650 kg", weightKg: 650, cbm: "4.5 CBM", cargo: "General",
    match: 76, timeLeft: "1 day", secsLeft: 86400,
    pickup: "25 Jun", delivery: "26 Jun",
    shipper: "GZ Export House", premium: false,
  },
];

/* ── Helpers ────────────────────────────────────────── */
function matchColor(n: number) {
  if (n >= 85) return { text: "text-emerald", bar: "bg-emerald" };
  if (n >= 75) return { text: "text-blue-600", bar: "bg-blue-500" };
  return { text: "text-ink-2", bar: "bg-ink-3" };
}

function urgencyClass(secs: number) {
  if (secs < 3600)   return "text-red-600 bg-red-50 border-red-200";
  if (secs < 86400)  return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-ink-2 bg-canvas border-line";
}

/* ── Bid Dialog ─────────────────────────────────────── */
function BidDrawer({
  op,
  onClose,
}: {
  op: Opportunity;
  onClose: () => void;
}) {
  const [quote,       setQuote]       = useState("");
  const [submitted,   setSubmitted]   = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const tokenBalance = MOCK_TOKEN_BALANCE;
  const noTokens     = tokenBalance === 0;
  const quoteNum     = parseFloat(quote);
  const canSubmit    = quote.trim() !== "" && quoteNum > 0;

  // Fat-finger heuristic: typical HKD per kg by freight mode
  const perKgHigh    = op.type === "Air" ? 55  : 18;
  const perKgLow     = op.type === "Air" ? 8   : 1.5;
  const expectedHigh = op.weightKg * perKgHigh;
  const expectedLow  = op.weightKg * perKgLow;
  const isFatFinger  = canSubmit && (quoteNum > expectedHigh * 3 || quoteNum < expectedLow * 0.3);

  function handleSubmit() {
    if (!canSubmit || noTokens) return;
    if (isFatFinger && !showWarning) { setShowWarning(true); return; }
    setSubmitted(true);
    setShowWarning(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,18,42,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-white rounded-2xl border border-line w-[520px] overflow-hidden"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)" }}
      >
        {/* Top accent */}
        <div
          aria-hidden
          className="absolute top-0 inset-x-0 h-[3px] rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, #0C1A3E 0%, #1E3A7A 55%, #C49A3C 100%)" }}
        />

        <div className="pt-8 px-7 pb-7 flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {op.type === "Air"
                  ? <Plane className="w-4 h-4 text-navy" strokeWidth={1.75} />
                  : <Ship  className="w-4 h-4 text-navy" strokeWidth={1.75} />
                }
                <span className="text-[13px] font-semibold text-navy uppercase tracking-[0.05em]">
                  {op.type} · Sealed Bid
                </span>
                {op.premium && (
                  <span className="text-[10px] font-bold text-gold-dark bg-gold-soft border border-gold-border px-2 py-0.5 rounded-full uppercase tracking-[0.07em]">
                    Premier
                  </span>
                )}
              </div>
              <p className="text-[22px] font-bold text-ink tracking-[-0.5px] leading-tight">
                {op.origin} → {op.dest}
              </p>
              <p className="text-[13px] text-ink-2">
                {op.weight} · {op.cbm} · {op.cargo} · Pickup {op.pickup}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-ink-3
                         transition-all duration-200 hover:bg-canvas hover:text-ink cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Match score */}
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gold-soft border border-gold-border">
            <Award className="w-4 h-4 text-gold flex-shrink-0" strokeWidth={2} />
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-semibold text-gold-dark">{op.match}% profile match</span>
              <span className="text-[11px] text-gold leading-snug">You meet all primary criteria for this shipment.</span>
            </div>
          </div>

          {/* Notes */}
          {op.notes && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-canvas border border-line">
              <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-[0.06em] mt-0.5 flex-shrink-0">Note</span>
              <p className="text-[12.5px] text-ink-2 leading-relaxed">{op.notes}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* ── Success ─────────────────────── */}
            {submitted ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-3 py-4 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-soft border border-emerald/25 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-semibold text-ink">Quote Submitted</p>
                  <p className="text-[13px] text-ink-2 mt-0.5">
                    HKD {quoteNum.toLocaleString("en-HK", { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <p className="text-[11.5px] text-ink-3 px-6 leading-relaxed">
                  Your sealed quote has been recorded. You'll be notified when the shipper makes their selection.
                </p>
                <button
                  onClick={onClose}
                  className="mt-1 px-5 py-2 rounded-lg bg-canvas border border-line text-[13px] font-medium text-ink-2
                             transition-all duration-200 hover:bg-white hover:text-ink cursor-pointer"
                >
                  Close
                </button>
              </motion.div>

            /* ── No tokens — Inline Quick Top-up ── */
            ) : noTokens ? (
              <motion.div key="no-tokens" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-3 py-1 text-center">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <Zap className="w-6 h-6 text-amber-600" strokeWidth={1.75} />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">No Tokens Available</p>
                    <p className="text-[12.5px] text-ink-3 mt-0.5">
                      1 Token is required to submit a sealed bid. Top up now to continue.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.08em] text-center mb-0.5">
                    Quick Top-up
                  </p>
                  {[
                    { tokens: 5,  price: 400, label: "Starter", popular: false },
                    { tokens: 10, price: 720, label: "Standard", popular: true  },
                  ].map((pack) => (
                    <div
                      key={pack.tokens}
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 transition-all duration-200 cursor-pointer
                        ${pack.popular ? "border-navy bg-navy-soft" : "border-line hover:border-navy/30 hover:bg-canvas"}`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-ink">{pack.tokens} Tokens</span>
                          {pack.popular && (
                            <span className="text-[9.5px] font-bold text-gold-dark bg-gold-soft border border-gold-border px-1.5 py-0.5 rounded-full uppercase">
                              Popular
                            </span>
                          )}
                        </div>
                        <p className="text-[11.5px] text-ink-3 mt-0.5">
                          {pack.label} · HKD {(pack.price / pack.tokens).toFixed(0)}/token
                        </p>
                      </div>
                      <button
                        className={`px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer
                          ${pack.popular
                            ? "bg-navy text-white hover:bg-navy-hover"
                            : "bg-white border border-line text-ink-2 hover:bg-navy-soft hover:text-navy hover:border-navy/20"
                          }`}
                      >
                        HKD {pack.price} →
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-center text-[11px] text-ink-3 leading-relaxed">
                  Tokens are refunded if bid submission fails validation.
                </p>
              </motion.div>

            /* ── Normal bid form ─────────────── */
            ) : (
              <motion.div key="form" className="flex flex-col gap-3">
                {/* Token balance strip */}
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-gold" strokeWidth={2} />
                    <span className="text-[11.5px] text-ink-3">1 Token will be consumed</span>
                  </div>
                  <span className="text-[11.5px] font-semibold text-ink">
                    Balance:{" "}
                    <span className={tokenBalance <= 2 ? "text-amber-600" : "text-emerald"}>
                      {tokenBalance} remaining
                    </span>
                  </span>
                </div>

                {/* HKD input */}
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
                    onChange={(e) => { setQuote(e.target.value); setShowWarning(false); }}
                    onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmit(); }}
                    placeholder="0.00"
                    autoFocus
                    className="w-full pl-[52px] pr-4 py-4 text-[22px] font-semibold text-ink tracking-[-0.3px]
                               bg-transparent outline-none rounded-xl placeholder:text-line
                               [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </div>

                {/* Typical range hint */}
                {!quote && (
                  <p className="text-[11.5px] text-ink-3 px-0.5">
                    Typical range for this shipment:{" "}
                    <strong className="font-medium text-ink-2">
                      HKD {Math.round(expectedLow).toLocaleString()} – {Math.round(expectedHigh).toLocaleString()}
                    </strong>
                  </p>
                )}

                {/* Fat-finger warning */}
                <AnimatePresence>
                  {showWarning && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex flex-col gap-3">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                          <div>
                            <p className="text-[12.5px] font-semibold text-amber-800">Unusual amount detected</p>
                            <p className="text-[12px] text-amber-700 mt-0.5">
                              HKD {quoteNum.toLocaleString()} is{" "}
                              {quoteNum > expectedHigh * 3 ? "significantly higher" : "unusually lower"}{" "}
                              than the expected range (HKD {Math.round(expectedLow).toLocaleString()} – {Math.round(expectedHigh).toLocaleString()}).
                              Please double-check for a data-entry error.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowWarning(false)}
                            className="flex-1 py-2 rounded-lg border border-amber-200 bg-white text-[12.5px] font-medium text-amber-700
                                       hover:bg-amber-50 cursor-pointer transition-all duration-200"
                          >
                            Revise Amount
                          </button>
                          <button
                            onClick={() => setSubmitted(true)}
                            className="flex-1 py-2 rounded-xl bg-navy text-white text-[12.5px] font-semibold
                                       hover:bg-navy-hover cursor-pointer transition-all duration-200"
                          >
                            Submit Anyway
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* CTA — hidden during warning to reduce cognitive load */}
                {!showWarning && (
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="w-full py-3.5 rounded-xl text-[13.5px] font-semibold tracking-[0.02em] text-white bg-navy
                               transition-all duration-200 ease-in-out cursor-pointer
                               hover:enabled:bg-navy-hover hover:enabled:-translate-y-[1px]
                               hover:enabled:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                               active:enabled:translate-y-0 active:enabled:shadow-none
                               focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40
                               disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Sealed Quote
                  </button>
                )}

                {/* Privacy note */}
                <div className="flex items-start gap-2 px-1">
                  <Lock className="w-3.5 h-3.5 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
                  <p className="text-[11.5px] text-ink-3 leading-relaxed">
                    Your quote is <strong className="font-medium text-ink-2">sealed</strong>. The shipper sees only
                    that qualified forwarders responded — not your amount or identity.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Opportunity Row ────────────────────────────────── */
function OpportunityRow({
  op,
  index,
  onBid,
}: {
  op: Opportunity;
  index: number;
  onBid: (op: Opportunity) => void;
}) {
  const mc = matchColor(op.match);
  const uc = urgencyClass(op.secsLeft);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.38, delay: 0.05 + index * 0.055, ease: [0.16, 1, 0.3, 1] }}
      className="group bg-white rounded-[16px] border border-line overflow-hidden
                 transition-all duration-200 ease-in-out
                 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 hover:border-[#C8CDD8]"
    >
      <div className="flex items-center gap-5 px-6 py-5">
        {/* Type icon */}
        <div
          className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0
                     bg-canvas transition-colors duration-200 group-hover:bg-navy-soft"
        >
          {op.type === "Air"
            ? <Plane className="w-4.5 h-4.5 text-ink-2 transition-colors duration-200 group-hover:text-navy" strokeWidth={1.75} />
            : <Ship  className="w-4.5 h-4.5 text-ink-2 transition-colors duration-200 group-hover:text-navy" strokeWidth={1.75} />
          }
        </div>

        {/* Route + meta */}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <p className="text-[15px] font-semibold text-ink tracking-[-0.2px] leading-none">
              {op.origin}
              <span className="text-ink-3 font-normal mx-2">→</span>
              {op.dest}
            </p>
            {op.premium && (
              <span className="text-[9.5px] font-bold text-gold-dark bg-gold-soft border border-gold-border px-1.5 py-0.5 rounded-full uppercase tracking-[0.07em] flex-shrink-0">
                Premier
              </span>
            )}
          </div>
          <p className="text-[12.5px] text-ink-3">
            {op.originCode} → {op.destCode} · {op.weight} · {op.cbm} · {op.cargo}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[11.5px] text-ink-2">
              Pickup <strong className="font-medium">{op.pickup}</strong>
            </span>
            <span className="text-line">·</span>
            <span className="text-[11.5px] text-ink-2">
              Delivery <strong className="font-medium">{op.delivery}</strong>
            </span>
            <span className="text-line">·</span>
            <span className="text-[11.5px] text-ink-3">{op.shipper}</span>
          </div>
        </div>

        {/* Match score */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <span className={`text-[13.5px] font-bold ${mc.text}`}>{op.match}%</span>
          <div className="w-14 h-[3.5px] rounded-full bg-line overflow-hidden">
            <div
              className={`h-full rounded-full ${mc.bar} transition-all duration-700`}
              style={{ width: `${op.match}%` }}
            />
          </div>
          <span className="text-[10px] text-ink-3">match</span>
        </div>

        {/* Time left */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium flex-shrink-0 ${uc}`}
        >
          <Clock className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
          {op.timeLeft}
        </div>

        {/* Bid CTA */}
        <button
          onClick={() => onBid(op)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy text-white text-[13px] font-semibold
                     transition-all duration-200 ease-in-out cursor-pointer flex-shrink-0
                     hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(12,26,62,0.24)]
                     active:translate-y-0 active:shadow-none
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40"
        >
          Place Bid
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2.2} />
        </button>
      </div>
    </motion.div>
  );
}

/* ── Opportunities Page ─────────────────────────────── */
export function OpportunitiesPage() {
  const [search,   setSearch]   = useState("");
  const [typeFilter, setType]   = useState<FreightType>("All");
  const [sortBy,   setSort]     = useState<SortKey>("match");
  const [activeBid, setActiveBid] = useState<Opportunity | null>(null);

  /* Filter + sort */
  const visible = ALL_OPS
    .filter((op) => {
      const matchesType   = typeFilter === "All" || op.type === typeFilter;
      const q = search.toLowerCase();
      const matchesSearch = !q
        || op.origin.toLowerCase().includes(q)
        || op.dest.toLowerCase().includes(q)
        || op.originCode.toLowerCase().includes(q)
        || op.destCode.toLowerCase().includes(q)
        || op.cargo.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "match")    return b.match - a.match;
      if (sortBy === "deadline") return a.secsLeft - b.secsLeft;
      if (sortBy === "weight")   return b.weightKg - a.weightKg;
      return 0;
    });

  const premiumCount = visible.filter((o) => o.premium).length;

  return (
    <>
      <div className="px-9 pt-8 pb-14 flex flex-col gap-6">

        {/* Page header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">
              Opportunities
            </h1>
            <p className="text-[14px] text-ink-3">
              {visible.length} open requests match your profile
              {premiumCount > 0 && (
                <> · <span className="text-gold-dark font-medium">{premiumCount} Premier</span></>
              )}
            </p>
          </div>

          {/* Sort control */}
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-ink-3 font-medium">Sort by</span>
            {(["match", "deadline", "weight"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium capitalize transition-all duration-200 ease-in-out cursor-pointer
                  ${sortBy === key
                    ? "bg-navy text-white shadow-[0_2px_8px_rgba(12,26,62,0.2)]"
                    : "bg-white border border-line text-ink-2 hover:bg-navy-soft hover:text-navy hover:border-navy-soft"
                  }`}
              >
                {key === "match" ? "Best Match" : key === "deadline" ? "Deadline" : "Cargo Size"}
              </button>
            ))}
          </div>
        </div>

        {/* Search + filter bar */}
        <div className="flex items-center gap-3">
          {/* Search input */}
          <div
            className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl border border-line
                       transition-all duration-200 ease-in-out
                       focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.07)]"
          >
            <Search className="w-4 h-4 text-ink-3 flex-shrink-0" strokeWidth={1.75} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by city, airport code, or cargo type…"
              className="flex-1 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-ink-3"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-ink-3 hover:text-ink transition-colors duration-150 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Freight type filter */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-line">
            {(["All", "Air", "Sea"] as FreightType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12.5px] font-medium
                            transition-all duration-200 ease-in-out cursor-pointer
                            ${typeFilter === t
                              ? "bg-navy text-white shadow-[0_2px_8px_rgba(12,26,62,0.18)]"
                              : "text-ink-2 hover:bg-navy-soft hover:text-navy"
                            }`}
              >
                {t === "Air" && <Plane className="w-3 h-3" strokeWidth={2} />}
                {t === "Sea" && <Ship  className="w-3 h-3" strokeWidth={2} />}
                {t === "All" && <SlidersHorizontal className="w-3 h-3" strokeWidth={2} />}
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Result list */}
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {visible.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 gap-3 text-center"
              >
                <div className="w-12 h-12 rounded-full bg-canvas border border-line flex items-center justify-center">
                  <Search className="w-5 h-5 text-ink-3" strokeWidth={1.75} />
                </div>
                <p className="text-[14px] font-medium text-ink">No results</p>
                <p className="text-[13px] text-ink-3">Try adjusting your search or filter.</p>
              </motion.div>
            ) : (
              visible.map((op, i) => (
                <OpportunityRow
                  key={op.id}
                  op={op}
                  index={i}
                  onBid={setActiveBid}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bid dialog */}
      <AnimatePresence>
        {activeBid && (
          <BidDrawer op={activeBid} onClose={() => setActiveBid(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
