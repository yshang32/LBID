import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { CheckCircle2, ChevronLeft, Plane, Ship, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const STEPS = ["Route", "Cargo", "Services", "Review"] as const;
type Step = 0 | 1 | 2 | 3;

const CARGO_TYPES = [
  "General Goods", "Electronics", "Perishable / Cold Chain",
  "Machinery / Industrial", "Textiles / Garments",
  "Documents / Samples", "Chemical (Non-Hazardous)", "Other",
];

const TRADE_TERMS = ["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"];

const SERVICES_LIST = [
  { id: "customs",   label: "Customs clearance (HKG)",          note: "Mandatory for most shipments" },
  { id: "invoice",   label: "Commercial invoice preparation",   note: "" },
  { id: "packing",   label: "Packing list preparation",         note: "" },
  { id: "coo",       label: "Certificate of Origin",            note: "HKECIC or country of origin" },
  { id: "insurance", label: "Cargo insurance",                  note: "Recommended for high-value goods" },
  { id: "pickup",    label: "Door pickup at origin",            note: "" },
  { id: "delivery",  label: "Door delivery to consignee",       note: "" },
  { id: "fumigation",label: "Fumigation certificate",           note: "Required for wood packaging" },
  { id: "cold",      label: "Temperature-controlled handling",  note: "Requires perishable cargo type" },
];

interface FormData {
  origin: string; freight: "Air" | "Sea"; pickupDate: string; tradeTerm: string;
  cargoType: string; weight: string; volume: string; notes: string;
  services: string[];
}

const INIT: FormData = {
  origin: "", freight: "Air", pickupDate: "", tradeTerm: "FOB",
  cargoType: "", weight: "", volume: "", notes: "",
  services: ["customs"],
};

const DRAFT_KEY = "lbid-request-draft";

const INPUT =
  "w-full px-3.5 py-2.5 rounded-xl border-2 border-line bg-white text-[13.5px] text-ink outline-none " +
  "placeholder:text-ink-3 transition-all duration-200 ease-in-out " +
  "focus:border-navy focus:shadow-[0_0_0_3px_rgba(12,26,62,0.08)]";

const SELECT = INPUT + " cursor-pointer appearance-none";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[12.5px] font-semibold text-ink-2 tracking-[0.02em]">{children}</label>;
}

export function CreateRequestPage() {
  const navigate    = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [submitted, setSubmitted] = useState(false);

  // Load saved draft on mount; fall back to INIT
  const [form, setForm] = useState<FormData>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? (JSON.parse(saved) as FormData) : INIT;
    } catch {
      return INIT;
    }
  });

  // Auto-save draft on every form change
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {}
  }, [form]);

  const hasDraft = JSON.stringify(form) !== JSON.stringify(INIT);

  function set<K extends keyof FormData>(k: K, v: FormData[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function toggleService(id: string) {
    setForm((f) => ({
      ...f,
      services: f.services.includes(id)
        ? f.services.filter((s) => s !== id)
        : [...f.services, id],
    }));
  }

  function canAdvance(): boolean {
    if (step === 0) return !!form.origin && !!form.pickupDate;
    if (step === 1) return !!form.cargoType && !!form.weight && !!form.volume;
    return true;
  }

  function handleSubmit() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setSubmitted(true);
    setTimeout(() => navigate("/requests"), 2800);
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
    setForm(INIT);
    setStep(0);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="w-16 h-16 rounded-full bg-emerald-soft border border-emerald/25 flex items-center justify-center"
        >
          <CheckCircle2 className="w-8 h-8 text-emerald" strokeWidth={1.75} />
        </motion.div>
        <div className="text-center">
          <p className="text-[18px] font-semibold text-ink">Request Submitted</p>
          <p className="text-[13.5px] text-ink-3 mt-1.5 max-w-xs">
            LBID will review your request. Once approved, a 3-hour sealed bid window opens automatically.
          </p>
        </div>
        <p className="text-[12px] text-ink-3">Redirecting to My Requests…</p>
      </div>
    );
  }

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-8 max-w-[680px]">
      {/* Back link */}
      <button
        onClick={() => navigate("/requests")}
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors duration-200 cursor-pointer w-fit"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2} /> My Requests
      </button>

      {/* Title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">
            New Shipment Request
          </h1>
          <p className="text-[14px] text-ink-3">
            Approved requests open a 3-hour sealed bid window for qualified forwarders.
          </p>
        </div>
        {/* Draft saved indicator */}
        {hasDraft && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-canvas border border-line flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald flex-shrink-0" />
            <span className="text-[11.5px] font-medium text-ink-2">Draft saved</span>
            <button
              onClick={clearDraft}
              className="text-[11px] text-ink-3 hover:text-red-500 transition-colors cursor-pointer ml-1"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-0 flex-1">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300
                  ${i < step ? "bg-emerald text-white" : i === step ? "bg-navy text-white" : "bg-canvas border-2 border-line text-ink-3"}`}
              >
                {i < step ? <CheckCircle2 className="w-4 h-4" strokeWidth={2.5} /> : i + 1}
              </div>
              <span
                className={`text-[12px] font-medium transition-colors duration-200
                  ${i === step ? "text-navy" : i < step ? "text-emerald" : "text-ink-3"}`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-px mx-3 transition-colors duration-300
                  ${i < step ? "bg-emerald" : "bg-line"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div
        className="bg-white rounded-[20px] border border-line p-8"
        style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)" }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            {/* ── Step 0: Route ── */}
            {step === 0 && (
              <>
                <div>
                  <p className="text-[16px] font-semibold text-ink mb-0.5">Route</p>
                  <p className="text-[13px] text-ink-3">Where is your shipment coming from?</p>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label>Origin Port / City</Label>
                    <input
                      type="text"
                      value={form.origin}
                      onChange={(e) => set("origin", e.target.value)}
                      placeholder="e.g. Shanghai, Ho Chi Minh City, Bangkok…"
                      className={INPUT}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Destination</Label>
                    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border-2 border-line/60 bg-canvas">
                      <span className="text-[13.5px] text-ink font-medium">Hong Kong (HKG)</span>
                      <span className="text-[11px] text-ink-3 ml-auto bg-white border border-line px-2 py-0.5 rounded-full">Fixed</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Freight Mode</Label>
                      <div className="flex gap-2">
                        {(["Air", "Sea"] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => set("freight", f)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-[13px] font-medium transition-all duration-200 cursor-pointer
                              ${form.freight === f
                                ? "border-navy bg-navy text-white shadow-[0_2px_8px_rgba(12,26,62,0.2)]"
                                : "border-line text-ink-2 hover:border-navy/30 hover:bg-navy-soft hover:text-navy"
                              }`}
                          >
                            {f === "Air" ? <Plane className="w-3.5 h-3.5" strokeWidth={2} /> : <Ship className="w-3.5 h-3.5" strokeWidth={2} />}
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Trade Term</Label>
                      <select value={form.tradeTerm} onChange={(e) => set("tradeTerm", e.target.value)} className={SELECT}>
                        {TRADE_TERMS.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Pickup Date</Label>
                    <input type="date" value={form.pickupDate} onChange={(e) => set("pickupDate", e.target.value)} className={INPUT} />
                  </div>
                </div>
              </>
            )}

            {/* ── Step 1: Cargo ── */}
            {step === 1 && (
              <>
                <div>
                  <p className="text-[16px] font-semibold text-ink mb-0.5">Cargo Details</p>
                  <p className="text-[13px] text-ink-3">Tell forwarders exactly what you're shipping.</p>
                </div>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-1.5">
                    <Label>Cargo Type</Label>
                    <select value={form.cargoType} onChange={(e) => set("cargoType", e.target.value)} className={SELECT}>
                      <option value="">Select cargo type…</option>
                      {CARGO_TYPES.map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <Label>Gross Weight (kg)</Label>
                      <input type="number" min="0" value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="e.g. 500" className={INPUT + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Label>Volume (CBM)</Label>
                      <input type="number" min="0" step="0.1" value={form.volume} onChange={(e) => set("volume", e.target.value)} placeholder="e.g. 3.0" className={INPUT + " [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label>Additional Notes <span className="text-ink-3 font-normal">(optional)</span></Label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => set("notes", e.target.value)}
                      rows={3}
                      placeholder="Special handling requirements, dangerous goods info, temperature range…"
                      className={INPUT + " resize-none"}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Step 2: Services ── */}
            {step === 2 && (
              <>
                <div>
                  <p className="text-[16px] font-semibold text-ink mb-0.5">Required Services</p>
                  <p className="text-[13px] text-ink-3">Select what you need. Forwarders will quote based on this scope.</p>
                </div>
                <div className="flex flex-col gap-2">
                  {SERVICES_LIST.map((svc) => {
                    const checked = form.services.includes(svc.id);
                    return (
                      <label
                        key={svc.id}
                        className={`flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200
                          ${checked
                            ? "border-navy bg-navy-soft"
                            : "border-line bg-white hover:border-navy/30 hover:bg-canvas"
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200
                          ${checked ? "bg-navy border-navy" : "border-line bg-white"}`}
                        >
                          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
                        </div>
                        <input type="checkbox" className="sr-only" checked={checked} onChange={() => toggleService(svc.id)} />
                        <div className="flex flex-col gap-0.5">
                          <span className={`text-[13px] font-medium ${checked ? "text-navy" : "text-ink"}`}>{svc.label}</span>
                          {svc.note && <span className="text-[11.5px] text-ink-3">{svc.note}</span>}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </>
            )}

            {/* ── Step 3: Review ── */}
            {step === 3 && (
              <>
                <div>
                  <p className="text-[16px] font-semibold text-ink mb-0.5">Review & Submit</p>
                  <p className="text-[13px] text-ink-3">Check your details before sending to LBID for review.</p>
                </div>
                <div className="flex flex-col gap-4">
                  <ReviewBlock title="Route">
                    <Row k="Origin" v={form.origin} />
                    <Row k="Destination" v="Hong Kong (HKG)" />
                    <Row k="Mode" v={form.freight} />
                    <Row k="Trade Term" v={form.tradeTerm} />
                    <Row k="Pickup Date" v={form.pickupDate} />
                  </ReviewBlock>
                  <ReviewBlock title="Cargo">
                    <Row k="Type" v={form.cargoType} />
                    <Row k="Weight" v={`${form.weight} kg`} />
                    <Row k="Volume" v={`${form.volume} CBM`} />
                    {form.notes && <Row k="Notes" v={form.notes} />}
                  </ReviewBlock>
                  <ReviewBlock title="Services">
                    {SERVICES_LIST.filter((s) => form.services.includes(s.id)).map((s) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald" strokeWidth={2.2} />
                        <span className="text-[13px] text-ink">{s.label}</span>
                      </div>
                    ))}
                  </ReviewBlock>
                  {/* Platform note */}
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-canvas border border-line">
                    <Info className="w-3.5 h-3.5 text-ink-3 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <p className="text-[12.5px] text-ink-2 leading-relaxed">
                      Submitting creates a <strong className="font-medium text-ink">PENDING_REVIEW</strong> request.
                      LBID admin will review it within 2 hours. Once approved, a <strong className="font-medium text-ink">3-hour sealed bid window</strong> opens automatically.
                    </p>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step === 0 ? navigate("/requests") : setStep((s) => (s - 1) as Step)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-line bg-white text-[13px] font-medium text-ink-2
                     transition-all duration-200 ease-in-out cursor-pointer hover:bg-canvas hover:text-ink"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
          {step === 0 ? "Cancel" : "Back"}
        </button>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-ink-3">Step {step + 1} of {STEPS.length}</span>
          {step < 3 ? (
            <button
              onClick={() => canAdvance() && setStep((s) => (s + 1) as Step)}
              disabled={!canAdvance()}
              className="px-5 py-2.5 rounded-xl bg-navy text-white text-[13.5px] font-semibold
                         transition-all duration-200 ease-in-out cursor-pointer
                         hover:enabled:bg-navy-hover hover:enabled:-translate-y-[1px] hover:enabled:shadow-[0_6px_20px_rgba(12,26,62,0.26)]
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl bg-navy text-white text-[13.5px] font-semibold
                         transition-all duration-200 ease-in-out cursor-pointer
                         hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(12,26,62,0.26)]"
            >
              Submit Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line overflow-hidden">
      <div className="px-4 py-2.5 bg-canvas border-b border-line">
        <span className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.08em]">{title}</span>
      </div>
      <div className="px-4 py-3.5 flex flex-col gap-2.5 bg-white">{children}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-[12px] text-ink-3 w-28 flex-shrink-0">{k}</span>
      <span className="text-[13px] text-ink font-medium">{v}</span>
    </div>
  );
}
