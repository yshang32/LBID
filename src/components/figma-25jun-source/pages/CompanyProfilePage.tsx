import { useState } from "react";
import { AlertCircle, Building2, CheckCircle2, Eye, EyeOff, Globe, MapPin, Phone, Shield } from "lucide-react";
import { motion } from "motion/react";

const INPUT =
  "w-full px-3.5 py-2.5 rounded-xl border-2 border-line bg-white text-[13.5px] text-ink outline-none " +
  "placeholder:text-ink-3 transition-all duration-200 ease-in-out " +
  "focus:border-navy focus:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]";

const ROUTES_LIST = [
  "China Mainland -> HKG",
  "Vietnam -> HKG",
  "Thailand -> HKG",
  "Malaysia -> HKG",
  "Taiwan -> HKG",
  "Japan -> HKG",
  "South Korea -> HKG",
  "Philippines -> HKG",
  "Indonesia -> HKG",
  "Singapore -> HKG",
];

export function CompanyProfilePage() {
  const [saved, setSaved] = useState(false);
  const [directoryVis, setVis] = useState(true);
  const [caps, setCaps] = useState({ client: true, forwarder: true });
  const [routes, setRoutes] = useState(["Vietnam -> HKG", "China Mainland -> HKG", "Taiwan -> HKG"]);
  const [form, setForm] = useState({
    name: "Pacific Forward Ltd.",
    country: "Hong Kong",
    address: "Unit 10, Pacific Centre, Kwai Chung, N.T.",
    phone: "+852 2234 5678",
    website: "https://pacificforward.com.hk",
  });

  function set(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  }

  function toggleRoute(route: string) {
    setRoutes((prev) => (prev.includes(route) ? prev.filter((item) => item !== route) : [...prev, route]));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="mx-auto grid w-full max-w-[1180px] gap-6 px-6 pb-10 pt-8 lg:grid-cols-[minmax(0,760px)_320px] lg:px-9">
      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="m-0 mb-1.5 text-[28px] font-bold leading-[1.1] tracking-[-0.7px] text-ink">
              Company Profile
            </h1>
            <p className="text-[14px] text-ink-3">Manage company details, capabilities, route coverage and directory visibility.</p>
          </div>
          <div className="flex items-center gap-2">
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 text-[12.5px] font-medium text-emerald"
              >
                <CheckCircle2 className="h-4 w-4" strokeWidth={2} /> Saved
              </motion.div>
            )}
            <button
              onClick={handleSave}
              className="rounded-xl bg-navy px-5 py-2.5 text-[13.5px] font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:bg-navy-hover hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]"
            >
              Save Changes
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-emerald/20 bg-emerald-soft p-4">
          <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald" strokeWidth={2} />
          <div>
            <p className="text-[13px] font-semibold text-emerald">Profile Verified</p>
            <p className="mt-0.5 text-[12px] text-ink-2">IATA credentials confirmed · Standard Member · Verified 18 Jun 2026</p>
          </div>
        </div>

        <Section title="Company Information" icon={<Building2 className="h-4 w-4" />}>
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_190px]">
              <Field label="Company Name">
                <input type="text" value={form.name} onChange={set("name")} className={INPUT} />
              </Field>
              <Field label="Country / Region">
                <input type="text" value={form.country} onChange={set("country")} className={INPUT} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Contact Phone" icon={<Phone className="h-3 w-3" />}>
                <input type="tel" value={form.phone} onChange={set("phone")} className={INPUT} />
              </Field>
              <Field label="Website" icon={<Globe className="h-3 w-3" />}>
                <input type="url" value={form.website} onChange={set("website")} className={INPUT} />
              </Field>
            </div>
            <Field label="Business Address" icon={<MapPin className="h-3 w-3" />}>
              <input type="text" value={form.address} onChange={set("address")} className={INPUT} />
            </Field>
          </div>
        </Section>

        <Section title="Platform Capabilities" icon={<CheckCircle2 className="h-4 w-4" />}>
          <p className="mb-4 text-[12.5px] text-ink-3">Both capabilities can be active simultaneously. LBID does not force a company into only one role.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { key: "client", label: "Client (Shipper)", desc: "Create and manage shipment requests." },
              { key: "forwarder", label: "Forwarder", desc: "Browse requests, submit sealed bids, fulfil orders." },
            ].map((capability) => {
              const active = caps[capability.key as keyof typeof caps];
              return (
                <label
                  key={capability.key}
                  className={`flex min-h-[104px] cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                    active ? "border-navy bg-navy-soft" : "border-line hover:border-navy/30 hover:bg-canvas"
                  }`}
                >
                  <div
                    className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                      active ? "border-navy bg-navy" : "border-line bg-white"
                    }`}
                  >
                    {active && <CheckCircle2 className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
                  </div>
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={active}
                    onChange={() => setCaps((prev) => ({ ...prev, [capability.key]: !prev[capability.key as keyof typeof prev] }))}
                  />
                  <div>
                    <p className={`text-[13.5px] font-semibold ${active ? "text-navy" : "text-ink"}`}>{capability.label}</p>
                    <p className="mt-1 text-[12px] leading-5 text-ink-3">{capability.desc}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </Section>

        {caps.forwarder && (
          <Section title="Route Coverage" icon={<MapPin className="h-4 w-4" />}>
            <p className="mb-4 text-[12.5px] text-ink-3">Active routes determine bid eligibility and AI recommendation matching.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {ROUTES_LIST.map((route) => {
                const selected = routes.includes(route);
                return (
                  <label
                    key={route}
                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 px-3.5 py-2.5 transition-all duration-200 ${
                      selected ? "border-navy bg-navy-soft" : "border-line hover:border-navy/30 hover:bg-canvas"
                    }`}
                  >
                    <div
                      className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all duration-200 ${
                        selected ? "border-navy bg-navy" : "border-line bg-white"
                      }`}
                    >
                      {selected && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={2.5} />}
                    </div>
                    <input type="checkbox" className="sr-only" checked={selected} onChange={() => toggleRoute(route)} />
                    <span className={`text-[12.5px] font-medium ${selected ? "text-navy" : "text-ink"}`}>{route}</span>
                  </label>
                );
              })}
            </div>
          </Section>
        )}

        <Section title="Directory Visibility" icon={directoryVis ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[13.5px] font-medium text-ink">Show in Public Forwarder Directory</p>
              <p className="mt-0.5 text-[12px] text-ink-3">When visible, clients and partners can discover your company profile and route coverage.</p>
            </div>
            <button
              onClick={() => setVis((value) => !value)}
              className={`relative h-6 w-12 flex-shrink-0 rounded-full transition-all duration-200 ${directoryVis ? "bg-navy" : "bg-line"}`}
              aria-label="Toggle directory visibility"
            >
              <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-200 ${directoryVis ? "left-6" : "left-0.5"}`} />
            </button>
          </div>
          {!directoryVis && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" strokeWidth={2} />
              <p className="text-[12px] text-amber-700">Your profile is hidden from the directory. Clients cannot discover your company unless they have your direct link.</p>
            </div>
          )}
        </Section>
      </div>

      <aside className="flex flex-col gap-4 lg:sticky lg:top-20 lg:self-start">
        <div className="overflow-hidden rounded-[18px] border border-line bg-white shadow-[0_16px_44px_rgba(12,26,62,0.07)]">
          <div className="h-[3px] bg-[linear-gradient(90deg,#0c1a3e_0%,#1e3a7a_55%,#c49a3c_100%)]" />
          <div className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-gold-dark">Profile strength</p>
            <div className="mt-4 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-full border-[5px] border-gold bg-gold-soft text-[18px] font-bold text-gold-dark">86%</div>
              <div>
                <p className="text-[14px] font-bold text-ink">Almost launch-ready</p>
                <p className="mt-1 text-[12px] leading-5 text-ink-3">Add certificates and richer service coverage to increase match priority.</p>
              </div>
            </div>
            <div className="mt-5 space-y-2">
              <ChecklistItem done label="Company information" />
              <ChecklistItem done label="Client + Forwarder capability" />
              <ChecklistItem done={routes.length >= 3} label={`${routes.length} active routes`} />
              <ChecklistItem done={directoryVis} label="Directory visibility" />
            </div>
          </div>
        </div>

        <div className="rounded-[18px] border border-gold-border bg-gold-soft p-5 shadow-[0_14px_36px_rgba(181,138,35,0.1)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-gold-dark">Standard member</p>
          <h2 className="mt-2 text-[20px] font-bold tracking-[-0.4px] text-ink">Priority access enabled</h2>
          <p className="mt-2 text-[12.5px] leading-5 text-gold">Your verified routes can receive recommended sealed-bid opportunities before general marketplace browsing.</p>
        </div>

        <div className="rounded-[18px] border border-line bg-white p-5 shadow-[0_12px_32px_rgba(12,26,62,0.055)]">
          <p className="text-[13px] font-bold text-ink">What this profile affects</p>
          <div className="mt-3 space-y-3 text-[12.5px] leading-5 text-ink-3">
            <p><strong className="text-ink">Recommendations:</strong> route coverage and services determine which SRs are pushed to you.</p>
            <p><strong className="text-ink">Trust:</strong> verification and public profile help clients choose non-lowest bids with confidence.</p>
            <p><strong className="text-ink">Directory:</strong> visible profiles can be discovered by overseas clients and partners.</p>
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2">
        {icon}
        {label}
      </label>
      {children}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[16px] border border-line bg-white shadow-[0_8px_24px_rgba(12,26,62,0.035)]">
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-5 py-4">
        <span className="text-ink-3">{icon}</span>
        <span className="text-[13px] font-semibold text-ink">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ChecklistItem({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-line bg-canvas px-3 py-2">
      <span className={`grid h-5 w-5 place-items-center rounded-full ${done ? "bg-emerald text-white" : "bg-white text-line"}`}>
        <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.4} />
      </span>
      <span className={`text-[12.5px] font-medium ${done ? "text-ink" : "text-ink-3"}`}>{label}</span>
    </div>
  );
}
