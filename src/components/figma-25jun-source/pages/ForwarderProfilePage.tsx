import { useParams, useNavigate } from "react-router";
import { Star, Shield, ChevronLeft, MapPin, Plane, Ship, Award, CheckCircle2, Lock } from "lucide-react";
import { motion } from "motion/react";

const PROFILES: Record<string, {
  name: string; country: string; rating: number; reviews: number;
  orders: number; joined: string; verified: boolean; premier: boolean;
  about: string; badges: string[]; routes: string[]; modes: string[];
  services: string[];
  reviewList: { author: string; rating: number; text: string; date: string }[];
}> = {
  "pacific-forward": {
    name: "Pacific Forward Ltd.",
    country: "Hong Kong",
    rating: 4.9, reviews: 47, orders: 148,
    joined: "2022", verified: true, premier: true,
    about: "Specialist air freight forwarder with 10+ years serving Vietnam–Hong Kong and China–Hong Kong lanes. IATA certified. Customs-bonded warehouse at HKG.",
    badges: ["IATA Certified", "HKG Preferred Partner", "ISO 9001", "Premier Member"],
    routes: ["Vietnam → HKG", "China Mainland → HKG", "Taiwan → HKG", "Thailand → HKG"],
    modes: ["Air", "Sea"],
    services: ["Customs clearance (HKG)", "Commercial invoice", "Packing list", "Certificate of Origin", "Cargo insurance", "Door-to-door", "Cold chain handling", "Dangerous goods (limited)"],
    reviewList: [
      { author: "Apex Sourcing Ltd.", rating: 5, text: "Handled our urgent SGN–HKG air shipment perfectly. AWB issued within 2 hours of booking.", date: "15 Jun 2026" },
      { author: "TechFlow HK",        rating: 5, text: "Reliable and transparent. Tracking updates were proactive.", date: "02 Jun 2026" },
      { author: "MedSupply Asia",     rating: 4, text: "Good service. Minor delay in document preparation but communicated well.", date: "18 May 2026" },
    ],
  },
};

const FALLBACK = PROFILES["pacific-forward"];

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) {
  const cls = size === "lg" ? "w-4 h-4" : "w-3 h-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={cls} strokeWidth={1.5}
          fill={n <= Math.round(rating) ? "#C49A3C" : "none"}
          stroke={n <= Math.round(rating) ? "#C49A3C" : "#D1D6E0"} />
      ))}
    </div>
  );
}

export function ForwarderProfilePage() {
  const { slug } = useParams();
  const navigate  = useNavigate();
  const p = PROFILES[slug ?? ""] ?? FALLBACK;

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6 max-w-[900px]">
      <button
        onClick={() => navigate("/forwarders")}
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors cursor-pointer w-fit"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2} /> Directory
      </button>

      {/* Company header card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white rounded-[20px] border border-line p-7"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}
      >
        <div className="flex items-start gap-5">
          {/* Logo */}
          <div className="w-16 h-16 rounded-[14px] bg-navy-soft flex items-center justify-center flex-shrink-0">
            <span className="text-[16px] font-bold text-navy">
              {p.name.split(" ").map(w => w[0]).slice(0,2).join("")}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-[22px] font-bold text-ink tracking-[-0.4px] m-0 leading-none">{p.name}</h1>
              {p.verified && <Shield className="w-5 h-5 text-emerald" strokeWidth={2} />}
              {p.premier && (
                <span className="text-[10.5px] font-bold text-gold-dark bg-gold-soft border border-gold-border px-2.5 py-1 rounded-full uppercase tracking-[0.07em]">
                  ★ Premier
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-3.5 h-3.5 text-ink-3" strokeWidth={1.75} />
              <span className="text-[13px] text-ink-2">{p.country}</span>
              <span className="text-line">·</span>
              <span className="text-[13px] text-ink-3">Member since {p.joined}</span>
            </div>
            <div className="flex items-center gap-3">
              <Stars rating={p.rating} size="lg" />
              <span className="text-[15px] font-bold text-ink">{p.rating}</span>
              <span className="text-[13px] text-ink-3">{p.reviews} reviews</span>
              <span className="text-line">·</span>
              <span className="text-[13px] text-ink-3">{p.orders} completed orders</span>
            </div>
          </div>

          {/* Contact locked */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-canvas border border-line">
              <Lock className="w-3.5 h-3.5 text-ink-3" strokeWidth={2} />
              <span className="text-[12px] text-ink-3">Contact unlocks after award</span>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="mt-5 pt-5 border-t border-line-light">
          <p className="text-[13.5px] text-ink-2 leading-relaxed">{p.about}</p>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          {p.badges.map(b => (
            <div key={b} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-navy-soft border border-navy/20">
              <CheckCircle2 className="w-3 h-3 text-emerald" strokeWidth={2.2} />
              <span className="text-[11.5px] font-medium text-navy">{b}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Two-column: Routes + Services */}
      <div className="grid grid-cols-2 gap-5">
        {/* Routes */}
        <div className="bg-white rounded-[16px] border border-line p-5">
          <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.08em] mb-4">Route Coverage</p>
          <div className="flex flex-col gap-2.5">
            {p.routes.map(r => (
              <div key={r} className="flex items-center gap-2.5">
                {r.includes("Air") || p.modes.includes("Air")
                  ? <Plane className="w-3.5 h-3.5 text-navy flex-shrink-0" strokeWidth={1.75} />
                  : <Ship  className="w-3.5 h-3.5 text-navy flex-shrink-0" strokeWidth={1.75} />
                }
                <span className="text-[13px] text-ink">{r}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-line-light">
            {p.modes.map(m => (
              <span key={m} className="text-[11.5px] font-semibold text-navy bg-navy-soft border border-navy/15 px-2.5 py-1 rounded-full">
                {m}
              </span>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-[16px] border border-line p-5">
          <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.08em] mb-4">Services Offered</p>
          <div className="flex flex-col gap-2">
            {p.services.map(s => (
              <div key={s} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald flex-shrink-0" strokeWidth={2.2} />
                <span className="text-[12.5px] text-ink-2">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13.5px] font-semibold text-ink">Client Reviews</p>
          <div className="flex items-center gap-2">
            <Stars rating={p.rating} size="lg" />
            <span className="text-[14px] font-bold text-ink">{p.rating}</span>
            <span className="text-[12px] text-ink-3">({p.reviews})</span>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          {p.reviewList.map((r, i) => (
            <div key={i} className="bg-white rounded-[14px] border border-line p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-[13px] font-semibold text-ink">{r.author}</p>
                  <p className="text-[11px] text-ink-3 mt-0.5">{r.date}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Stars rating={r.rating} />
                  <span className="text-[12px] font-semibold text-ink ml-1">{r.rating}.0</span>
                </div>
              </div>
              <p className="text-[13px] text-ink-2 leading-relaxed">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
