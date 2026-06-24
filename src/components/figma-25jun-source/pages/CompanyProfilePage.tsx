import { useState } from "react";
import { Building2, Shield, Globe, Phone, MapPin, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

const INPUT =
  "w-full px-3.5 py-2.5 rounded-xl border-2 border-line bg-white text-[13.5px] text-ink outline-none " +
  "placeholder:text-ink-3 transition-all duration-200 ease-in-out " +
  "focus:border-navy focus:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]";

const ROUTES_LIST = [
  "China Mainland → HKG", "Vietnam → HKG", "Thailand → HKG",
  "Malaysia → HKG", "Taiwan → HKG", "Japan → HKG",
  "South Korea → HKG", "Philippines → HKG", "Indonesia → HKG", "Singapore → HKG",
];

export function CompanyProfilePage() {
  const [saved, setSaved]       = useState(false);
  const [directoryVis, setVis]  = useState(true);
  const [caps, setCaps]         = useState({ client: true, forwarder: true });
  const [routes, setRoutes]     = useState(["Vietnam → HKG", "China Mainland → HKG", "Taiwan → HKG"]);
  const [form, setForm]         = useState({
    name: "Pacific Forward Ltd.",
    country: "Hong Kong",
    address: "Unit 10, Pacific Centre, Kwai Chung, N.T.",
    phone: "+852 2234 5678",
    website: "https://pacificforward.com.hk",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({...f, [k]: e.target.value}));
  }

  function toggleRoute(r: string) {
    setRoutes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6 max-w-[720px]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">
            Company Profile
          </h1>
          <p className="text-[14px] text-ink-3">Manage your company details, capabilities and directory visibility.</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-emerald"
            >
              <CheckCircle2 className="w-4 h-4" strokeWidth={2} /> Saved
            </motion.div>
          )}
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-[13.5px] font-semibold
                       hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                       transition-all duration-200 cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Verification status */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-soft border border-emerald/20">
        <Shield className="w-5 h-5 text-emerald flex-shrink-0 mt-0.5" strokeWidth={2} />
        <div>
          <p className="text-[13px] font-semibold text-emerald">Profile Verified</p>
          <p className="text-[12px] text-ink-2 mt-0.5">IATA credentials confirmed · Premier Forwarder · Verified 18 Jun 2026</p>
        </div>
      </div>

      {/* Company details */}
      <Section title="Company Information" icon={<Building2 className="w-4 h-4" />}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-ink-2">Company Name</label>
            <input type="text" value={form.name} onChange={set("name")} className={INPUT} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-ink-2 flex items-center gap-1.5">
                <Phone className="w-3 h-3" /> Contact Phone
              </label>
              <input type="tel" value={form.phone} onChange={set("phone")} className={INPUT} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-ink-2 flex items-center gap-1.5">
                <Globe className="w-3 h-3" /> Website
              </label>
              <input type="url" value={form.website} onChange={set("website")} className={INPUT} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-ink-2 flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Business Address
            </label>
            <input type="text" value={form.address} onChange={set("address")} className={INPUT} />
          </div>
        </div>
      </Section>

      {/* Capabilities */}
      <Section title="Platform Capabilities" icon={<CheckCircle2 className="w-4 h-4" />}>
        <p className="text-[12.5px] text-ink-3 mb-4">Both capabilities can be active simultaneously.</p>
        <div className="flex flex-col gap-3">
          {[
            { key: "client",    label: "Client (Shipper)",   desc: "Create and manage shipment requests." },
            { key: "forwarder", label: "Forwarder",           desc: "Browse requests, submit sealed bids, fulfil orders." },
          ].map(c => {
            const active = caps[c.key as keyof typeof caps];
            return (
              <label key={c.key}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${active ? "border-navy bg-navy-soft" : "border-line hover:border-navy/30 hover:bg-canvas"}`}>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200
                  ${active ? "bg-navy border-navy" : "border-line bg-white"}`}>
                  {active && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
                </div>
                <input type="checkbox" className="sr-only" checked={active}
                  onChange={() => setCaps(p => ({...p, [c.key]: !p[c.key as keyof typeof p]}))} />
                <div>
                  <p className={`text-[13.5px] font-semibold ${active ? "text-navy" : "text-ink"}`}>{c.label}</p>
                  <p className="text-[12px] text-ink-3 mt-0.5">{c.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </Section>

      {/* Route Coverage (Forwarder only) */}
      {caps.forwarder && (
        <Section title="Route Coverage" icon={<MapPin className="w-4 h-4" />}>
          <p className="text-[12.5px] text-ink-3 mb-4">Active routes determine bid eligibility and AI recommendation matching.</p>
          <div className="grid grid-cols-2 gap-2">
            {ROUTES_LIST.map(r => {
              const sel = routes.includes(r);
              return (
                <label key={r}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200
                    ${sel ? "border-navy bg-navy-soft" : "border-line hover:border-navy/30 hover:bg-canvas"}`}>
                  <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
                    ${sel ? "bg-navy border-navy" : "border-line bg-white"}`}>
                    {sel && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={2.5} />}
                  </div>
                  <input type="checkbox" className="sr-only" checked={sel} onChange={() => toggleRoute(r)} />
                  <span className={`text-[12.5px] font-medium ${sel ? "text-navy" : "text-ink"}`}>{r}</span>
                </label>
              );
            })}
          </div>
        </Section>
      )}

      {/* Directory Visibility */}
      <Section title="Directory Visibility" icon={directoryVis ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13.5px] font-medium text-ink">Show in Public Forwarder Directory</p>
            <p className="text-[12px] text-ink-3 mt-0.5">
              When visible, Clients and other users can discover your company profile and route coverage.
            </p>
          </div>
          <button
            onClick={() => setVis(v => !v)}
            className={`relative w-12 h-6 rounded-full transition-all duration-200 cursor-pointer flex-shrink-0 ${directoryVis ? "bg-navy" : "bg-line"}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${directoryVis ? "left-6" : "left-0.5"}`} />
          </button>
        </div>
        {!directoryVis && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 mt-3">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
            <p className="text-[12px] text-amber-700">Your profile is hidden from the directory. Clients cannot discover your company unless they have your direct link.</p>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[16px] border border-line overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-line bg-canvas">
        <span className="text-ink-3">{icon}</span>
        <span className="text-[13px] font-semibold text-ink">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}
