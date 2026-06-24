import { useState } from "react";
import { useNavigate } from "react-router";
import { Search, Star, Shield, ChevronRight, SlidersHorizontal } from "lucide-react";
import { motion } from "motion/react";

const FORWARDERS = [
  {
    slug: "pacific-forward",
    name: "Pacific Forward Ltd.",
    country: "Hong Kong",
    rating: 4.9, reviews: 47,
    badges: ["IATA Certified", "HKG Preferred", "Premier"],
    routes: ["Vietnam → HKG", "China Mainland → HKG", "Taiwan → HKG"],
    modes: ["Air", "Sea"],
    orders: 148,
    verified: true,
    premier: true,
    joined: "2022",
  },
  {
    slug: "blue-ocean-freight",
    name: "Blue Ocean Freight HK",
    country: "Hong Kong",
    rating: 4.7, reviews: 31,
    badges: ["IATA Certified"],
    routes: ["China Mainland → HKG", "Japan → HKG", "South Korea → HKG"],
    modes: ["Sea", "Air"],
    orders: 89,
    verified: true,
    premier: false,
    joined: "2023",
  },
  {
    slug: "asia-gateway",
    name: "Asia Gateway Express",
    country: "Hong Kong",
    rating: 4.4, reviews: 18,
    badges: [],
    routes: ["Thailand → HKG", "Malaysia → HKG", "Singapore → HKG"],
    modes: ["Air"],
    orders: 42,
    verified: true,
    premier: false,
    joined: "2023",
  },
  {
    slug: "orient-cargo",
    name: "Orient Cargo Solutions",
    country: "Hong Kong",
    rating: 4.8, reviews: 62,
    badges: ["IATA Certified", "ISO 9001"],
    routes: ["China Mainland → HKG", "Vietnam → HKG", "Philippines → HKG"],
    modes: ["Air", "Sea"],
    orders: 210,
    verified: true,
    premier: true,
    joined: "2021",
  },
  {
    slug: "trans-pacific-hk",
    name: "Trans-Pacific Logistics HK",
    country: "Hong Kong",
    rating: 4.5, reviews: 29,
    badges: ["FIATA Member"],
    routes: ["Japan → HKG", "South Korea → HKG", "Taiwan → HKG"],
    modes: ["Air", "Sea"],
    orders: 73,
    verified: true,
    premier: false,
    joined: "2022",
  },
  {
    slug: "viet-bridge",
    name: "VietBridge Forwarding",
    country: "Vietnam",
    rating: 4.6, reviews: 24,
    badges: ["IATA Certified"],
    routes: ["Vietnam → HKG"],
    modes: ["Air"],
    orders: 56,
    verified: true,
    premier: false,
    joined: "2023",
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className="w-3 h-3" strokeWidth={1.5}
          fill={n <= Math.round(rating) ? "#C49A3C" : "none"}
          stroke={n <= Math.round(rating) ? "#C49A3C" : "#D1D6E0"} />
      ))}
    </div>
  );
}

export function ForwardersPage() {
  const navigate = useNavigate();
  const [search, setSearch]   = useState("");
  const [modeFilter, setMode] = useState<"All" | "Air" | "Sea">("All");
  const [premierOnly, setPremier] = useState(false);

  const visible = FORWARDERS.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.name.toLowerCase().includes(q) || f.routes.some(r => r.toLowerCase().includes(q));
    const matchMode   = modeFilter === "All" || f.modes.includes(modeFilter);
    const matchPremier = !premierOnly || f.premier;
    return matchSearch && matchMode && matchPremier;
  });

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">
          Forwarder Directory
        </h1>
        <p className="text-[14px] text-ink-3">
          {FORWARDERS.length} verified logistics partners on LBID · Hong Kong
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-xl border border-line
                        focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.07)] transition-all duration-200">
          <Search className="w-4 h-4 text-ink-3 flex-shrink-0" strokeWidth={1.75} />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by company name or route…"
            className="flex-1 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-ink-3"
          />
        </div>
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-line">
          {(["All","Air","Sea"] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-all duration-200 cursor-pointer
                ${modeFilter === m ? "bg-navy text-white shadow-[0_2px_8px_rgba(12,26,62,0.18)]" : "text-ink-2 hover:bg-navy-soft hover:text-navy"}`}>
              {m}
            </button>
          ))}
        </div>
        <button
          onClick={() => setPremier(p => !p)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[12.5px] font-medium transition-all duration-200 cursor-pointer
            ${premierOnly ? "bg-gold-soft border-gold-border text-gold-dark" : "bg-white border-line text-ink-2 hover:border-gold-border hover:text-gold-dark hover:bg-gold-soft"}`}
        >
          <Star className="w-3.5 h-3.5" strokeWidth={2} fill={premierOnly ? "#C49A3C" : "none"} stroke={premierOnly ? "#C49A3C" : "currentColor"} />
          Premier only
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {visible.map((f, i) => (
          <motion.div
            key={f.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => navigate(`/forwarders/${f.slug}`)}
            className="group bg-white rounded-[16px] border border-line p-5 cursor-pointer
                       transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.08)] hover:border-[#C8CDD8]"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[11px] bg-navy-soft flex items-center justify-center flex-shrink-0">
                  <span className="text-[11px] font-bold text-navy">
                    {f.name.split(" ").map(w => w[0]).slice(0,2).join("")}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[14px] font-semibold text-ink">{f.name}</p>
                    {f.verified && <Shield className="w-3.5 h-3.5 text-emerald" strokeWidth={2} />}
                  </div>
                  <p className="text-[12px] text-ink-3 mt-0.5">{f.country} · Since {f.joined}</p>
                </div>
              </div>
              {f.premier && (
                <span className="text-[10px] font-bold text-gold-dark bg-gold-soft border border-gold-border px-2 py-0.5 rounded-full uppercase tracking-[0.07em] flex-shrink-0">
                  Premier
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-3">
              <Stars rating={f.rating} />
              <span className="text-[12px] font-semibold text-ink">{f.rating}</span>
              <span className="text-[12px] text-ink-3">({f.reviews} reviews)</span>
              <span className="text-line">·</span>
              <span className="text-[12px] text-ink-3">{f.orders} orders</span>
            </div>

            {/* Routes */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {f.routes.slice(0,3).map(r => (
                <span key={r} className="text-[11px] font-medium text-ink-2 bg-canvas border border-line px-2 py-0.5 rounded-full">
                  {r}
                </span>
              ))}
            </div>

            {/* Badges + modes */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-wrap">
                {f.modes.map(m => (
                  <span key={m} className="text-[11px] font-semibold text-navy bg-navy-soft border border-navy/15 px-2 py-0.5 rounded-full">
                    {m}
                  </span>
                ))}
                {f.badges[0] && (
                  <span className="text-[11px] text-ink-2 bg-canvas border border-line px-2 py-0.5 rounded-full">
                    {f.badges[0]}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-line group-hover:text-navy transition-colors duration-200" strokeWidth={2} />
            </div>
          </motion.div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <div className="w-12 h-12 rounded-full bg-canvas border border-line flex items-center justify-center">
            <SlidersHorizontal className="w-5 h-5 text-ink-3" strokeWidth={1.75} />
          </div>
          <p className="text-[14px] font-medium text-ink">No results</p>
          <p className="text-[13px] text-ink-3">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
}
