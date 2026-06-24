import { useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle2, ChevronLeft, Building2, Zap, MapPin,
  FileText, CheckCheck, Globe, Phone,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const STEPS = [
  { label: "Company",      icon: Building2  },
  { label: "Capabilities", icon: Zap        },
  { label: "Coverage",     icon: MapPin     },
  { label: "Documents",    icon: FileText   },
  { label: "Complete",     icon: CheckCheck },
] as const;

type Step = 0 | 1 | 2 | 3 | 4;

const ROUTES_LIST = [
  "China Mainland → HKG", "Vietnam → HKG", "Thailand → HKG",
  "Malaysia → HKG", "Taiwan → HKG", "Japan → HKG",
  "South Korea → HKG", "Philippines → HKG", "Indonesia → HKG",
  "Singapore → HKG",
];

const CERTIFICATIONS = [
  "IATA Cargo Agent",
  "IATA Accredited Agent",
  "HKG Customs Registered",
  "ISO 9001 Certified",
  "FIATA Member",
  "HK Logistics Association",
];

const INPUT =
  "w-full px-3.5 py-2.5 rounded-xl border-2 border-line bg-white text-[13.5px] text-ink outline-none " +
  "placeholder:text-ink-3 transition-all duration-200 ease-in-out " +
  "focus:border-navy focus:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]";

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [company, setCompany] = useState({
    name: "", country: "", address: "", phone: "", website: "",
  });
  const [caps, setCaps] = useState({ client: false, forwarder: false });
  const [routes, setRoutes] = useState<string[]>([]);
  const [certs, setCerts] = useState<string[]>([]);

  function canNext() {
    if (step === 0) return !!company.name && !!company.country;
    if (step === 1) return caps.client || caps.forwarder;
    if (step === 2) return !caps.forwarder || routes.length > 0;
    return true;
  }

  function toggleRoute(r: string) {
    setRoutes(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  }
  function toggleCert(c: string) {
    setCerts(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  }

  if (step === 4) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans"
        style={{ background: "linear-gradient(150deg, #F0F2F8 0%, #ECEEF5 100%)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-5 text-center max-w-sm"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-soft border border-emerald/20 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-[22px] font-bold text-ink tracking-[-0.5px]">Setup Complete</p>
            <p className="text-[14px] text-ink-3 mt-2 leading-relaxed">
              {company.name} is now live on LBID.
              {caps.forwarder && " LBID will verify your credentials within 2 business days."}
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full">
            {caps.client && (
              <button
                onClick={() => navigate("/requests/new")}
                className="w-full py-3 rounded-xl bg-navy text-white text-[13.5px] font-semibold
                           hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                           transition-all duration-200 cursor-pointer"
              >
                Create your first shipment request →
              </button>
            )}
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 rounded-xl border border-line bg-white text-[13.5px] font-medium text-ink-2
                         hover:bg-canvas transition-all duration-200 cursor-pointer"
            >
              Go to Today Workspace
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-6 font-sans"
      style={{ background: "linear-gradient(150deg, #F0F2F8 0%, #ECEEF5 100%)" }}>
      <div className="w-full max-w-[580px]">
        {/* Logo placeholder */}
        <div className="text-center mb-8">
          <p className="text-[22px] font-bold text-ink tracking-[-0.4px]">Welcome to LBID</p>
          <p className="text-[14px] text-ink-3 mt-1">Set up your company account to get started.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.slice(0, 4).map((s, i) => (
            <div key={s.label} className="flex items-center gap-0 flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 text-[12px] font-bold
                  ${i < step ? "bg-emerald text-white" : i === step ? "bg-navy text-white" : "bg-white border-2 border-line text-ink-3"}`}>
                  {i < step ? <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} /> : i + 1}
                </div>
                <span className={`text-[10.5px] font-medium whitespace-nowrap ${i === step ? "text-navy" : i < step ? "text-emerald" : "text-ink-3"}`}>
                  {s.label}
                </span>
              </div>
              {i < 3 && (
                <div className={`flex-1 h-[2px] mx-2 mb-4 rounded-full transition-colors duration-300 ${i < step ? "bg-emerald" : "bg-line"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-[20px] border border-line p-8"
          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col gap-6"
            >

              {/* ── Step 0: Company Info ── */}
              {step === 0 && (
                <>
                  <div>
                    <p className="text-[16px] font-semibold text-ink mb-0.5">Company Information</p>
                    <p className="text-[13px] text-ink-3">This appears in the LBID directory and on quotations.</p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-semibold text-ink-2">Company Name <span className="text-red-400">*</span></label>
                      <input type="text" value={company.name} onChange={e => setCompany({...company, name: e.target.value})} placeholder="Pacific Forward Ltd." className={INPUT} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-semibold text-ink-2">Country / Region <span className="text-red-400">*</span></label>
                      <select value={company.country} onChange={e => setCompany({...company, country: e.target.value})} className={INPUT + " cursor-pointer appearance-none"}>
                        <option value="">Select…</option>
                        {["Hong Kong", "China Mainland", "Taiwan", "Japan", "South Korea", "Singapore", "Vietnam", "Thailand", "Malaysia", "Philippines", "Indonesia", "Other"].map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[12.5px] font-semibold text-ink-2">Business Address <span className="text-[11px] font-normal text-ink-3">(optional)</span></label>
                      <input type="text" value={company.address} onChange={e => setCompany({...company, address: e.target.value})} placeholder="Unit 10, Pacific Centre, Kwai Chung" className={INPUT} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12.5px] font-semibold text-ink-2 flex items-center gap-1.5"><Phone className="w-3 h-3" />Contact Phone</label>
                        <input type="tel" value={company.phone} onChange={e => setCompany({...company, phone: e.target.value})} placeholder="+852 2xxx xxxx" className={INPUT} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[12.5px] font-semibold text-ink-2 flex items-center gap-1.5"><Globe className="w-3 h-3" />Website</label>
                        <input type="url" value={company.website} onChange={e => setCompany({...company, website: e.target.value})} placeholder="https://yourcompany.com" className={INPUT} />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* ── Step 1: Capabilities ── */}
              {step === 1 && (
                <>
                  <div>
                    <p className="text-[16px] font-semibold text-ink mb-0.5">Platform Capabilities</p>
                    <p className="text-[13px] text-ink-3">Enable what you need. Both can be active on one account.</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {[
                      {
                        key: "client",
                        title: "Client (Shipper)",
                        desc: "Create shipment requests, compare sealed bids, award forwarders, and track orders.",
                        icon: "📦",
                      },
                      {
                        key: "forwarder",
                        title: "Forwarder",
                        desc: "Browse eligible requests, receive AI recommendations, submit sealed bids, and fulfil awarded orders.",
                        icon: "✈️",
                      },
                    ].map(cap => {
                      const active = caps[cap.key as keyof typeof caps];
                      return (
                        <label
                          key={cap.key}
                          className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${active ? "border-navy bg-navy-soft" : "border-line hover:border-navy/30 hover:bg-canvas"}`}
                        >
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200
                            ${active ? "bg-navy border-navy" : "border-line bg-white"}`}>
                            {active && <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />}
                          </div>
                          <input type="checkbox" className="sr-only" checked={active} onChange={() => setCaps(p => ({...p, [cap.key]: !p[cap.key as keyof typeof p]}))} />
                          <div>
                            <p className={`text-[14px] font-semibold ${active ? "text-navy" : "text-ink"}`}>{cap.icon} {cap.title}</p>
                            <p className="text-[12.5px] text-ink-3 mt-0.5 leading-relaxed">{cap.desc}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-canvas border border-line">
                    <span className="text-[11px] text-ink-3 leading-relaxed">Both capabilities can be active simultaneously. Settings can be changed later from Company Profile.</span>
                  </div>
                </>
              )}

              {/* ── Step 2: Coverage (Forwarder only) ── */}
              {step === 2 && (
                <>
                  <div>
                    <p className="text-[16px] font-semibold text-ink mb-0.5">Route Coverage</p>
                    <p className="text-[13px] text-ink-3">
                      {caps.forwarder
                        ? "Select routes your company actively operates. This determines bid eligibility and recommendations."
                        : "As a Client account, you don't need to declare routes."}
                    </p>
                  </div>
                  {caps.forwarder ? (
                    <>
                      <div className="flex flex-col gap-2">
                        {ROUTES_LIST.map(r => {
                          const sel = routes.includes(r);
                          return (
                            <label key={r} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all duration-200
                              ${sel ? "border-navy bg-navy-soft" : "border-line hover:border-navy/30 hover:bg-canvas"}`}>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200
                                ${sel ? "bg-navy border-navy" : "border-line bg-white"}`}>
                                {sel && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
                              </div>
                              <input type="checkbox" className="sr-only" checked={sel} onChange={() => toggleRoute(r)} />
                              <span className={`text-[13px] font-medium ${sel ? "text-navy" : "text-ink"}`}>{r}</span>
                            </label>
                          );
                        })}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-ink-2 mb-2">Certifications held (optional)</p>
                        <div className="flex flex-wrap gap-2">
                          {CERTIFICATIONS.map(c => {
                            const sel = certs.includes(c);
                            return (
                              <button key={c} onClick={() => toggleCert(c)}
                                className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium border transition-all duration-200 cursor-pointer
                                  ${sel ? "bg-navy text-white border-navy" : "bg-white text-ink-2 border-line hover:border-navy/30 hover:bg-navy-soft hover:text-navy"}`}>
                                {c}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-8 text-center">
                      <div>
                        <p className="text-[14px] font-medium text-ink">Route coverage applies to Forwarder accounts only.</p>
                        <p className="text-[13px] text-ink-3 mt-1">Continue to the next step.</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── Step 3: Documents ── */}
              {step === 3 && (
                <>
                  <div>
                    <p className="text-[16px] font-semibold text-ink mb-0.5">Verification Documents</p>
                    <p className="text-[13px] text-ink-3">
                      {caps.forwarder
                        ? "Upload your IATA certificate or Business Registration to be verified as a qualified Forwarder."
                        : "Optional: upload Business Registration to verify your company."}
                    </p>
                  </div>
                  {[
                    { label: "Business Registration (BR)", required: false },
                    ...(caps.forwarder ? [
                      { label: "IATA Certificate", required: true },
                      { label: "Director / Authorized Representative ID", required: false },
                    ] : []),
                  ].map(doc => (
                    <div key={doc.label} className="flex items-center gap-4 p-4 rounded-xl border border-line bg-canvas">
                      <FileText className="w-4 h-4 text-ink-3 flex-shrink-0" strokeWidth={1.75} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13.5px] font-medium text-ink">{doc.label}</p>
                        {doc.required && <p className="text-[11.5px] text-amber-600 mt-0.5">Required for Forwarder verification</p>}
                      </div>
                      <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-line text-[12.5px] font-medium text-ink-2
                                         hover:bg-navy-soft hover:text-navy hover:border-navy/20 transition-all duration-200 cursor-pointer">
                        Upload
                      </button>
                    </div>
                  ))}
                  <div className="flex items-start gap-2 p-3 rounded-xl bg-canvas border border-line">
                    <span className="text-[11px] text-ink-3 leading-relaxed">
                      Documents are reviewed by the LBID team within 2 business days. You may skip and upload later from Company Profile.
                    </span>
                  </div>
                </>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav buttons */}
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => step === 0 ? navigate("/auth") : setStep(s => (s - 1) as Step)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line bg-white text-[13px] font-medium text-ink-2
                       hover:bg-canvas hover:text-ink transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            {step === 0 ? "Sign Out" : "Back"}
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-ink-3">Step {step + 1} of 4</span>
            <button
              onClick={() => canNext() && setStep(s => (s + 1) as Step)}
              disabled={!canNext()}
              className="px-5 py-2.5 rounded-xl bg-navy text-white text-[13.5px] font-semibold
                         hover:enabled:bg-navy-hover hover:enabled:-translate-y-[1px] hover:enabled:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                         transition-all duration-200 ease-in-out cursor-pointer
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {step === 3 ? "Complete Setup" : "Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
