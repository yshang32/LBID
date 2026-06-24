import { useState } from "react";
import { useNavigate } from "react-router";
import { Star, ChevronLeft, Shield, Clock, CheckCircle2, Lock, Award, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const REQUEST = {
  id: "SR-004", route: "Bangkok → Hong Kong",
  cargo: "1,200 kg · 8 CBM · Textiles", mode: "Sea",
  closedAt: "23 Jun 2026, 15:00",
};

interface Bid {
  id: string;
  company: string;
  slug: string;
  rating: number;
  reviews: number;
  badges: string[];
  price: number;
  currency: string;
  transit: string;
  services: string[];
  terms: string;
  isLowest: boolean;
  verified: boolean;
}

const BIDS: Bid[] = [
  {
    id: "B-001",
    company: "Pacific Forward Ltd.",
    slug: "pacific-forward",
    rating: 4.9, reviews: 47,
    badges: ["IATA Certified", "HKG Preferred"],
    price: 8500, currency: "HKD",
    transit: "4 days",
    services: ["Customs clearance", "Commercial invoice", "Packing list", "Insurance"],
    terms: "EXW Bangkok. Payment within 5 business days of delivery.",
    isLowest: true, verified: true,
  },
  {
    id: "B-002",
    company: "Blue Ocean Freight HK",
    slug: "blue-ocean-freight",
    rating: 4.7, reviews: 31,
    badges: ["IATA Certified"],
    price: 9200, currency: "HKD",
    transit: "3 days",
    services: ["Customs clearance", "Full door-to-door", "Insurance", "Tracking"],
    terms: "FOB Bangkok. 50% upfront, balance on delivery.",
    isLowest: false, verified: true,
  },
  {
    id: "B-003",
    company: "Asia Gateway Express",
    slug: "asia-gateway",
    rating: 4.4, reviews: 18,
    badges: [],
    price: 10100, currency: "HKD",
    transit: "5 days",
    services: ["Customs clearance", "Standard handling"],
    terms: "EXW Bangkok. Full payment before cargo release.",
    isLowest: false, verified: true,
  },
];

const LOWEST_PRICE = Math.min(...BIDS.map((b) => b.price));

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className="w-3 h-3"
          strokeWidth={1.5}
          fill={n <= Math.round(rating) ? "#C49A3C" : "none"}
          stroke={n <= Math.round(rating) ? "#C49A3C" : "#D1D6E0"}
        />
      ))}
    </div>
  );
}

function AwardModal({
  bid,
  onConfirm,
  onCancel,
}: {
  bid: Bid;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const priceDiff = bid.price - LOWEST_PRICE;
  const isNotLowest = priceDiff > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(8,18,42,0.45)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-2xl border border-line w-[460px] p-7"
        style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)" }}
      >
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[17px] font-bold text-ink">Confirm Award</p>
            <p className="text-[13px] text-ink-3 mt-1">
              You are awarding {REQUEST.id} to <strong className="text-ink">{bid.company}</strong>.
            </p>
          </div>

          {isNotLowest && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
              <div>
                <p className="text-[12.5px] font-semibold text-amber-800">Not the lowest bid</p>
                <p className="text-[12px] text-amber-700 mt-0.5">
                  This bid is HKD {priceDiff.toLocaleString()} more than the lowest valid bid
                  (HKD {LOWEST_PRICE.toLocaleString()}). You may still award it.
                </p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-canvas border border-line flex flex-col gap-2">
            <Row k="Forwarder" v={bid.company} />
            <Row k="Quote" v={`HKD ${bid.price.toLocaleString()}`} />
            <Row k="Transit" v={bid.transit} />
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-canvas border border-line">
            <Lock className="w-3.5 h-3.5 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[12px] text-ink-3 leading-relaxed">
              Award is irreversible. Contact details unlock for both parties. A 24-hour
              cooling-off period applies before the order is confirmed.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-line text-[13px] font-medium text-ink-2
                         hover:bg-canvas hover:text-ink transition-all duration-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl bg-navy text-white text-[13px] font-semibold
                         hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                         transition-all duration-200 cursor-pointer"
            >
              Confirm Award →
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-[12px] text-ink-3">{k}</span>
      <span className="text-[13px] text-ink font-medium">{v}</span>
    </div>
  );
}

export function QuoteComparisonPage() {
  const navigate   = useNavigate();
  const [bidding,  setBidding]  = useState<Bid | null>(null);
  const [awarded,  setAwarded]  = useState<Bid | null>(null);

  function handleAward() {
    if (!bidding) return;
    setAwarded(bidding);
    setBidding(null);
  }

  return (
    <>
      <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
        <button
          onClick={() => navigate("/requests")}
          className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors cursor-pointer w-fit"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} /> My Requests
        </button>

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">
              Compare Bids
            </h1>
            <p className="text-[14px] text-ink-2">
              {REQUEST.route} · {REQUEST.cargo} · {BIDS.length} bids received
            </p>
            <p className="text-[13px] text-ink-3 mt-0.5">Bidding closed {REQUEST.closedAt}</p>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-canvas border border-line">
            <Lock className="w-3.5 h-3.5 text-ink-3" strokeWidth={2} />
            <span className="text-[12px] text-ink-3 font-medium">Contact unlocks after award</span>
          </div>
        </div>

        {awarded ? (
          /* ── Awarded state ── */
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-5 py-12 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-soft border border-emerald/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-[20px] font-bold text-ink">Awarded to {awarded.company}</p>
              <p className="text-[14px] text-ink-2 mt-1">
                HKD {awarded.price.toLocaleString()} · {awarded.transit}
              </p>
            </div>
            <p className="text-[13px] text-ink-3 max-w-sm leading-relaxed">
              An order workspace has been created. A 24-hour cooling-off period is in effect.
              Contact details are now visible in your order.
            </p>
            <button
              onClick={() => navigate("/orders")}
              className="px-6 py-3 rounded-xl bg-navy text-white text-[13.5px] font-semibold
                         hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                         transition-all duration-200 cursor-pointer"
            >
              View Order Workspace →
            </button>
          </motion.div>
        ) : (
          /* ── Bid cards ── */
          <div className="flex flex-col gap-4">

            {/* ── Side-by-side comparison matrix ───────────────────────────── */}
            <div className="bg-white rounded-[16px] border border-line overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              {/* Company headers */}
              <div className="grid border-b border-line" style={{ gridTemplateColumns: "140px repeat(3, 1fr)" }}>
                <div className="px-4 py-3 bg-canvas" />
                {BIDS.map((bid) => (
                  <div
                    key={bid.id}
                    className={`px-4 py-3 border-l border-line text-center ${bid.isLowest ? "bg-emerald-soft" : ""}`}
                  >
                    <p className="text-[12.5px] font-semibold text-ink leading-tight truncate">{bid.company.split(" ")[0]}</p>
                    {bid.isLowest && (
                      <span className="text-[9.5px] font-bold text-emerald uppercase tracking-[0.07em]">Lowest ✓</span>
                    )}
                    {bid.badges.includes("IATA Certified") && !bid.isLowest && (
                      <span className="text-[9.5px] font-medium text-ink-3">IATA</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Metric rows */}
              {[
                {
                  label: "Quote",
                  values: BIDS.map((b) => ({
                    text: `HKD ${b.price.toLocaleString()}`,
                    highlight: b.isLowest,
                    color: b.isLowest ? "text-emerald font-bold" : "text-ink font-semibold",
                  })),
                },
                {
                  label: "Transit",
                  values: BIDS.map((b) => ({
                    text: b.transit,
                    highlight: false,
                    color: b.transit === "3 days" ? "text-emerald font-medium" : "text-ink",
                  })),
                },
                {
                  label: "Rating",
                  values: BIDS.map((b) => ({
                    text: `${b.rating}★  (${b.reviews})`,
                    highlight: false,
                    color: b.rating >= 4.8 ? "text-gold-dark font-medium" : "text-ink",
                  })),
                },
                {
                  label: "Services",
                  values: BIDS.map((b) => ({
                    text: `${b.services.length} included`,
                    highlight: false,
                    color: "text-ink",
                  })),
                },
                {
                  label: "Premier",
                  values: BIDS.map((b) => ({
                    text: b.badges.includes("HKG Preferred") ? "Premier ★" : "—",
                    highlight: false,
                    color: b.badges.includes("HKG Preferred") ? "text-gold-dark font-semibold" : "text-ink-3",
                  })),
                },
              ].map((row, ri) => (
                <div
                  key={row.label}
                  className={`grid ${ri > 0 ? "border-t border-line-light" : ""}`}
                  style={{ gridTemplateColumns: "140px repeat(3, 1fr)" }}
                >
                  <div className="px-4 py-2.5 bg-canvas flex items-center">
                    <span className="text-[11px] font-semibold text-ink-3 uppercase tracking-[0.07em]">
                      {row.label}
                    </span>
                  </div>
                  {row.values.map((v, vi) => (
                    <div
                      key={vi}
                      className={`px-4 py-2.5 border-l border-line-light text-center text-[12.5px] ${v.color}
                        ${BIDS[vi].isLowest ? "bg-emerald-soft/40" : ""}`}
                    >
                      {v.text}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            {/* ─────────────────────────────────────────────────────────────── */}

            {BIDS.map((bid, i) => (
              <motion.div
                key={bid.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className={`bg-white rounded-[18px] border overflow-hidden
                            ${bid.isLowest ? "border-emerald/40" : "border-line"}
                            shadow-[0_2px_12px_rgba(0,0,0,0.05)]`}
              >
                {bid.isLowest && (
                  <div className="flex items-center gap-2 px-5 py-2 bg-emerald-soft border-b border-emerald/20">
                    <Award className="w-3.5 h-3.5 text-emerald" strokeWidth={2} />
                    <span className="text-[11px] font-bold text-emerald uppercase tracking-[0.08em]">
                      Lowest Valid Bid
                    </span>
                  </div>
                )}
                <div className="flex items-start gap-6 p-6">
                  {/* Company info */}
                  <div className="flex-1 min-w-0 flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-[11px] bg-navy-soft flex items-center justify-center flex-shrink-0">
                        <span className="text-[11px] font-bold text-navy">
                          {bid.company.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-[15px] font-semibold text-ink">{bid.company}</p>
                          {bid.verified && (
                            <Shield className="w-3.5 h-3.5 text-emerald" strokeWidth={2} />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Stars rating={bid.rating} />
                          <span className="text-[12px] text-ink-3">{bid.rating} · {bid.reviews} reviews</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          {bid.badges.map((b) => (
                            <span key={b} className="text-[10px] font-semibold text-navy-hover bg-navy-soft border border-navy/20 px-2 py-0.5 rounded-full">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div>
                        <span className="text-[10.5px] font-semibold text-ink-3 uppercase tracking-[0.07em]">Transit Time</span>
                        <p className="text-[13.5px] font-semibold text-ink mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
                          {bid.transit}
                        </p>
                      </div>
                      <div>
                        <span className="text-[10.5px] font-semibold text-ink-3 uppercase tracking-[0.07em]">Services Included</span>
                        <div className="mt-1 flex flex-col gap-1">
                          {bid.services.map((s) => (
                            <div key={s} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald flex-shrink-0" strokeWidth={2.2} />
                              <span className="text-[12px] text-ink-2">{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-canvas border border-line">
                      <span className="text-[10.5px] font-semibold text-ink-3 uppercase tracking-[0.07em]">Terms</span>
                      <p className="text-[12.5px] text-ink-2 mt-1 leading-relaxed">{bid.terms}</p>
                    </div>
                  </div>

                  {/* Price + CTA */}
                  <div className="flex flex-col items-end gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-[10.5px] font-semibold text-ink-3 uppercase tracking-[0.07em]">Total Quote</span>
                      <p className={`text-[26px] font-bold tracking-[-0.5px] mt-0.5 ${bid.isLowest ? "text-emerald" : "text-ink"}`}>
                        HKD {bid.price.toLocaleString()}
                      </p>
                      {!bid.isLowest && (
                        <p className="text-[12px] text-ink-3 mt-0.5">
                          +HKD {(bid.price - LOWEST_PRICE).toLocaleString()} vs lowest
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setBidding(bid)}
                      className={`px-5 py-2.5 rounded-xl text-[13.5px] font-semibold transition-all duration-200 cursor-pointer
                        ${bid.isLowest
                          ? "bg-navy text-white hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]"
                          : "bg-white border-2 border-line text-ink-2 hover:border-navy/40 hover:text-navy hover:bg-navy-soft"
                        }`}
                    >
                      {bid.isLowest ? "Award This Bid →" : "Select This Bid"}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {bidding && (
          <AwardModal bid={bidding} onConfirm={handleAward} onCancel={() => setBidding(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
