import { useState } from "react";
import { Zap, ArrowDownLeft, ArrowUpRight, Plus, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const LEDGER = [
  { id: 1, type: "debit",  label: "Bid submitted",        detail: "Guangzhou → Singapore · SR-012",   amount: -1, date: "23 Jun 2026", balance: 12 },
  { id: 2, type: "credit", label: "Token pack purchased", detail: "10-Token pack · Stripe",            amount: +10, date: "20 Jun 2026", balance: 13 },
  { id: 3, type: "debit",  label: "Bid submitted",        detail: "Manila → HKG · SR-009",            amount: -1, date: "18 Jun 2026", balance: 3  },
  { id: 4, type: "debit",  label: "Bid submitted",        detail: "Bangkok → Tokyo · SR-007",         amount: -1, date: "17 Jun 2026", balance: 4  },
  { id: 5, type: "credit", label: "Welcome bonus",        detail: "Account verified · Premier tier",  amount: +5, date: "15 Jun 2026", balance: 5  },
];

const PACKS = [
  { id: "pack5",  tokens: 5,  priceHKD: 400,  label: "Starter",  popular: false },
  { id: "pack10", tokens: 10, priceHKD: 720,  label: "Standard", popular: true  },
  { id: "pack25", tokens: 25, priceHKD: 1600, label: "Pro",      popular: false },
];

export function TokenWalletPage() {
  const [buying, setBuying] = useState(false);
  const BALANCE = 12;

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Token Wallet</h1>
        <p className="text-[14px] text-ink-3">Each sealed bid consumes 1 Token atomically.</p>
      </div>

      {/* Balance hero */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative bg-navy rounded-[20px] p-7 overflow-hidden"
        style={{ boxShadow: "0 8px 32px rgba(12,26,62,0.22)" }}
      >
        <div aria-hidden className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #C49A3C, transparent)", transform: "translate(30%, -30%)" }}
        />
        <div className="relative flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-gold" strokeWidth={2} />
              <span className="text-[11px] font-bold text-white/60 uppercase tracking-[0.09em]">Available Tokens</span>
            </div>
            <p className="text-[56px] font-bold text-white leading-none tracking-[-2px]">{BALANCE}</p>
            <p className="text-[13px] text-white/60 mt-2">≈ {BALANCE} sealed bids remaining</p>
          </div>
          <button
            onClick={() => setBuying(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-navy text-[13.5px] font-semibold
                       transition-all duration-200 cursor-pointer
                       hover:bg-gold-soft hover:-translate-y-[1px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.2)]
                       active:translate-y-0"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} /> Buy Tokens
          </button>
        </div>
      </motion.div>

      {/* Info note */}
      <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-canvas border border-line">
        <Info className="w-3.5 h-3.5 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
        <p className="text-[12.5px] text-ink-2 leading-relaxed">
          Tokens are consumed atomically when you submit a sealed bid via{" "}
          <code className="text-[11.5px] font-mono bg-line/40 px-1 py-0.5 rounded text-ink">submit_bid_with_token</code>.
          If a bid fails validation, the Token is returned. Tokens do not expire.
        </p>
      </div>

      {/* Ledger */}
      <div>
        <p className="text-[13.5px] font-semibold text-ink mb-3">Transaction Ledger</p>
        <div className="bg-white rounded-[16px] border border-line overflow-hidden">
          {LEDGER.map((tx, i) => (
            <div
              key={tx.id}
              className={`flex items-center gap-4 px-5 py-4 transition-colors duration-150 hover:bg-canvas
                          ${i < LEDGER.length - 1 ? "border-b border-line-light" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${tx.type === "credit" ? "bg-emerald-soft" : "bg-canvas border border-line"}`}
              >
                {tx.type === "credit"
                  ? <ArrowDownLeft className="w-4 h-4 text-emerald" strokeWidth={2} />
                  : <ArrowUpRight  className="w-4 h-4 text-ink-3" strokeWidth={2} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-ink">{tx.label}</p>
                <p className="text-[12px] text-ink-3 truncate">{tx.detail}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                <span className={`text-[14px] font-bold ${tx.type === "credit" ? "text-emerald" : "text-ink"}`}>
                  {tx.type === "credit" ? "+" : ""}{tx.amount}
                </span>
                <span className="text-[11px] text-ink-3">{tx.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Buy tokens modal */}
      <AnimatePresence>
        {buying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(8,18,42,0.45)", backdropFilter: "blur(4px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setBuying(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-line w-[420px] p-7"
              style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
            >
              <p className="text-[17px] font-bold text-ink mb-1.5">Purchase Tokens</p>
              <p className="text-[13px] text-ink-3 mb-5">Tokens are non-refundable. Choose a pack:</p>
              <div className="flex flex-col gap-3">
                {PACKS.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                      ${p.popular ? "border-navy bg-navy-soft" : "border-line hover:border-navy/30 hover:bg-canvas"}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[14px] font-bold text-ink">{p.tokens} Tokens</span>
                        {p.popular && <span className="text-[9.5px] font-bold text-gold-dark bg-gold-soft border border-gold-border px-2 py-0.5 rounded-full uppercase">Popular</span>}
                      </div>
                      <p className="text-[12px] text-ink-3 mt-0.5">{p.label} pack · HKD {(p.priceHKD / p.tokens).toFixed(0)}/token</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] font-bold text-ink">HKD {p.priceHKD.toLocaleString()}</p>
                      <button
                        onClick={() => setBuying(false)}
                        className={`mt-1.5 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 cursor-pointer
                          ${p.popular
                            ? "bg-navy text-white hover:bg-navy-hover"
                            : "bg-white border border-line text-ink-2 hover:bg-navy-soft hover:text-navy hover:border-navy/20"
                          }`}
                      >
                        Select →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
