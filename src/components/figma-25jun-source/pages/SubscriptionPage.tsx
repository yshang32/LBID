import { useState } from "react";
import { CheckCircle2, Zap, Crown, Star, CreditCard, Upload, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const PLANS = [
  {
    id: "free",
    name: "Standard",
    price: "Free",
    priceNote: "Forever",
    color: "border-line",
    features: ["Access to all public requests", "3 Token credits/month", "Basic directory listing", "Standard support"],
    cta: "Current Plan",
    current: false,
  },
  {
    id: "premier",
    name: "Premier",
    price: "HKD 980",
    priceNote: "/month",
    color: "border-navy",
    features: ["Priority recommendation placement", "10 Token credits/month", "Enhanced directory profile", "Premier badge", "Priority support", "Route certification"],
    cta: "Current Plan",
    current: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    priceNote: "Contact us",
    color: "border-line",
    features: ["Unlimited Token credits", "Dedicated account manager", "API access", "Custom integrations", "SLA guarantee", "Multi-user accounts"],
    cta: "Contact Sales",
    current: false,
  },
];

const HISTORY = [
  { id: "INV-0042", date: "1 Jun 2026",  amount: "HKD 980", status: "Paid",   method: "Stripe" },
  { id: "INV-0031", date: "1 May 2026",  amount: "HKD 980", status: "Paid",   method: "Stripe" },
  { id: "INV-0019", date: "1 Apr 2026",  amount: "HKD 980", status: "Paid",   method: "Stripe" },
  { id: "INV-0008", date: "1 Mar 2026",  amount: "HKD 980", status: "Paid",   method: "Manual" },
];

export function SubscriptionPage() {
  const [showProof, setShowProof] = useState(false);

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Membership</h1>
        <p className="text-[14px] text-ink-3">Manage your LBID subscription and billing.</p>
      </div>

      {/* Current plan hero */}
      <div
        className="flex items-center justify-between bg-white rounded-[18px] border border-line p-6"
        style={{ boxShadow: "0 2px 16px rgba(0,0,0,0.05)" }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-[13px] bg-gold-soft border border-gold-border flex items-center justify-center">
            <Star className="w-6 h-6 text-gold" strokeWidth={1.75} fill="#C49A3C" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[18px] font-bold text-ink tracking-[-0.3px]">Premier Forwarder</p>
              <span className="text-[10.5px] font-bold text-gold-dark bg-gold-soft border border-gold-border px-2 py-0.5 rounded-full uppercase tracking-[0.07em]">Active</span>
            </div>
            <p className="text-[13px] text-ink-3 mt-0.5">HKD 980/month · Renews 1 Jul 2026 · 3 days remaining</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line text-[13px] font-medium text-ink-2
                       hover:bg-canvas hover:text-ink transition-all duration-200 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} /> Manage Billing
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy text-white text-[13px] font-semibold
                       hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(12,26,62,0.24)]
                       transition-all duration-200 cursor-pointer"
          >
            <CreditCard className="w-3.5 h-3.5" strokeWidth={1.75} /> Renew Now
          </button>
        </div>
      </div>

      {/* Plan comparison */}
      <div>
        <p className="text-[13.5px] font-semibold text-ink mb-4">All Plans</p>
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-[16px] border-2 ${plan.current ? "border-navy" : plan.color} p-5 flex flex-col gap-4`}
            >
              {plan.current && (
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-navy" strokeWidth={2} />
                  <span className="text-[11px] font-bold text-navy uppercase tracking-[0.07em]">Current Plan</span>
                </div>
              )}
              <div>
                <p className="text-[15px] font-bold text-ink">{plan.name}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-[24px] font-bold text-ink tracking-[-0.5px]">{plan.price}</span>
                  <span className="text-[12px] text-ink-3">{plan.priceNote}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald flex-shrink-0 mt-0.5" strokeWidth={2.2} />
                    <span className="text-[12.5px] text-ink-2">{f}</span>
                  </div>
                ))}
              </div>
              <button
                disabled={plan.current}
                className={`w-full py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer
                  ${plan.current
                    ? "bg-canvas border border-line text-ink-3 cursor-default"
                    : plan.id === "enterprise"
                    ? "border-2 border-navy text-navy hover:bg-navy-soft"
                    : "bg-navy text-white hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(12,26,62,0.24)]"
                  }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Token wallet summary */}
      <div className="bg-white rounded-[16px] border border-line p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13.5px] font-semibold text-ink">Token Balance</p>
          <button className="text-[12px] font-medium text-navy hover:underline cursor-pointer">View wallet →</button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-3 bg-navy rounded-xl">
            <Zap className="w-4 h-4 text-gold" strokeWidth={2} />
            <span className="text-[20px] font-bold text-white leading-none">12</span>
            <span className="text-[12px] text-white/60">tokens</span>
          </div>
          <div className="flex-1">
            <p className="text-[13px] text-ink-2">10 monthly Premier credits + 2 purchased</p>
            <p className="text-[12px] text-ink-3 mt-0.5">Monthly credits reset on 1 Jul · Each bid consumes 1 token</p>
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-canvas border border-line text-[12.5px] font-medium text-ink-2
                             hover:bg-white hover:border-navy/30 hover:text-navy transition-all duration-200 cursor-pointer">
            <Zap className="w-3.5 h-3.5" strokeWidth={2} /> Buy More
          </button>
        </div>
      </div>

      {/* Billing history */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13.5px] font-semibold text-ink">Billing History</p>
          <button
            onClick={() => setShowProof(true)}
            className="flex items-center gap-1.5 text-[12px] font-medium text-navy hover:underline cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={2} /> Upload payment proof
          </button>
        </div>
        <div className="bg-white rounded-[16px] border border-line overflow-hidden">
          <div className="grid border-b border-line bg-canvas" style={{ gridTemplateColumns: "1fr 140px 100px 80px 80px" }}>
            {["Invoice", "Date", "Amount", "Status", "Method"].map(h => (
              <div key={h} className="px-4 py-2.5">
                <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.07em]">{h}</span>
              </div>
            ))}
          </div>
          {HISTORY.map((inv, i) => (
            <div
              key={inv.id}
              className={`grid items-center hover:bg-canvas transition-colors duration-150 ${i < HISTORY.length - 1 ? "border-b border-line-light" : ""}`}
              style={{ gridTemplateColumns: "1fr 140px 100px 80px 80px" }}
            >
              <div className="px-4 py-3.5">
                <p className="text-[13px] font-medium text-navy cursor-pointer hover:underline">{inv.id}</p>
              </div>
              <div className="px-4 py-3.5"><span className="text-[13px] text-ink-2">{inv.date}</span></div>
              <div className="px-4 py-3.5"><span className="text-[13px] font-medium text-ink">{inv.amount}</span></div>
              <div className="px-4 py-3.5">
                <span className="text-[11px] font-semibold text-emerald bg-emerald-soft border border-emerald/20 px-2 py-0.5 rounded-full">{inv.status}</span>
              </div>
              <div className="px-4 py-3.5"><span className="text-[12px] text-ink-3">{inv.method}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload proof modal */}
      <AnimatePresence>
        {showProof && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(8,18,42,0.45)", backdropFilter: "blur(4px)" }}
            onClick={e => { if (e.target === e.currentTarget) setShowProof(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white rounded-2xl border border-line w-[420px] p-7"
              style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.18)" }}
            >
              <p className="text-[16px] font-bold text-ink mb-1">Upload Payment Proof</p>
              <p className="text-[13px] text-ink-3 mb-5">For manual bank transfers. LBID admin will confirm within 1 business day.</p>
              <div className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-dashed border-line bg-canvas cursor-pointer hover:border-navy hover:bg-navy-soft transition-all duration-200">
                <Upload className="w-6 h-6 text-ink-3" strokeWidth={1.75} />
                <p className="text-[13px] text-ink-2 text-center">Drop your bank receipt here or <span className="text-navy font-medium">browse</span></p>
                <p className="text-[11px] text-ink-3">PDF, PNG or JPG · Max 10MB</p>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowProof(false)} className="flex-1 py-2.5 rounded-xl border border-line text-[13px] font-medium text-ink-2 hover:bg-canvas cursor-pointer transition-all duration-200">Cancel</button>
                <button onClick={() => setShowProof(false)} className="flex-1 py-2.5 rounded-xl bg-navy text-white text-[13px] font-semibold hover:bg-navy-hover cursor-pointer transition-all duration-200">Submit Proof</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
