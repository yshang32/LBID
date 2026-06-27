"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Loader2,
  PackageCheck,
  Route,
  ShieldCheck,
} from "lucide-react"

import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    eyebrow: "\u7d71\u4e00\u8a2d\u5b9a",
    title: "\u8a2d\u5b9a\u516c\u53f8\u80fd\u529b\uff1aClient\u3001Forwarder\uff0c\u6216\u5169\u8005\u3002",
    intro: "LBID \u4e0d\u518d\u628a\u516c\u53f8\u56fa\u5b9a\u5206\u6210 Agency \u6216 Forwarder\u3002\u4e00\u9593\u516c\u53f8\u53ef\u4ee5\u540c\u6642\u767c\u51fa Shipment Request\uff0c\u4e5f\u53ef\u4ee5\u63a5\u6536\u63a8\u85a6\u4e26\u63d0\u4ea4 sealed bid\u3002",
    next: "\u4e0b\u4e00\u6b65",
    back: "\u8fd4\u56de",
    complete: "\u5b8c\u6210 onboarding",
    saving: "\u5132\u5b58\u4e2d",
    done: "\u5df2\u5b8c\u6210",
    dashboard: "\u7a0d\u5f8c\u9032\u5165\u5de5\u4f5c\u53f0",
  },
  en: {
    eyebrow: "Unified onboarding",
    title: "Set company capability before requests and bids.",
    intro: "LBID does not lock a company into Client or Forwarder only. One company can create shipment requests, receive recommendations and submit sealed bids.",
    next: "Next",
    back: "Back",
    complete: "Complete onboarding",
    saving: "Saving",
    done: "Ready",
    dashboard: "Go to dashboard later",
  },
} as const

const steps = [
  { key: "company", label: "Company", icon: Building2 },
  { key: "capability", label: "Capability", icon: BadgeCheck },
  { key: "coverage", label: "Coverage", icon: Route },
  { key: "review", label: "Review", icon: CheckCircle2 },
] as const

export default function OnboardingPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const router = useRouter()
  const prefix = `/${locale}`
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    companyName: "Pacific Forward Ltd.",
    region: "Hong Kong",
    description: "Hong Kong logistics company handling air, sea and local delivery workflows.",
    canBeClient: true,
    canBeForwarder: true,
    primaryRoute: "Vietnam to Hong Kong",
    freightMode: "Air and sea freight",
    serviceType: "Customs clearance",
    visibility: "Public profile",
  })

  const serviceRoutes = useMemo(() => [form.primaryRoute], [form.primaryRoute])
  const serviceTypes = useMemo(() => [form.freightMode, form.serviceType], [form.freightMode, form.serviceType])

  async function completeOnboarding() {
    setSaving(true)
    setError("")
    const { response, body } = await apiJson("/api/company-profile", {
      method: "PATCH",
      body: JSON.stringify({
        company_name_en: form.companyName,
        company_name_zh: form.companyName,
        region: form.region,
        description: form.description,
        service_routes: serviceRoutes,
        service_types: serviceTypes,
        is_public: form.visibility === "Public profile",
        can_be_client: form.canBeClient,
        can_be_forwarder: form.canBeForwarder,
        onboarding_completed: true,
        onboarding_step: 4,
      }),
    })
    setSaving(false)
    if (!response.ok) {
      setError(body?.error || "ONBOARDING_SAVE_FAILED")
      return
    }
    router.push(`${prefix}/dashboard`)
  }

  const activeStep = steps[step]

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-8 sm:px-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(560px,1.1fr)] lg:items-start">
        <div className="lg:sticky lg:top-20">
          <span className="inline-flex rounded-full border border-gold-border bg-gold-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gold-dark">
            {t.eyebrow}
          </span>
          <h1 className="mt-5 max-w-3xl text-[38px] font-bold leading-[1.06] tracking-[-1.1px] text-ink sm:text-[54px]">
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-ink-2">{t.intro}</p>

          <div className="mt-8 grid gap-3">
            <CapabilityCard icon={PackageCheck} title="Client capability" body="Create Shipment Requests, compare bids and award the best partner." active={form.canBeClient} />
            <CapabilityCard icon={ShieldCheck} title="Forwarder capability" body="Receive matched opportunities, submit sealed bids and manage awarded orders." active={form.canBeForwarder} />
          </div>
        </div>

        <section className="rounded-[28px] border border-line bg-white p-5 shadow-[0_22px_70px_rgba(12,26,62,.09)] sm:p-6">
          <div className="mb-6 grid gap-2 sm:grid-cols-4">
            {steps.map((item, index) => {
              const active = index === step
              const complete = index < step
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setStep(index)}
                  className={`rounded-full border px-3 py-2 text-center text-[11px] font-bold transition hover:-translate-y-px ${active ? "border-navy bg-navy text-white shadow-[0_8px_20px_rgba(12,26,62,.16)]" : complete ? "border-emerald/25 bg-emerald-soft text-emerald" : "border-line bg-canvas text-ink-2 hover:border-navy/25"}`}
                >
                  {index + 1}. {item.label}
                </button>
              )
            })}
          </div>

          <div className="mb-5 rounded-2xl border border-line bg-canvas px-4 py-3">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.1em] text-ink-3">
              <activeStep.icon className="h-4 w-4 text-gold" />
              Step {step + 1} of 4
            </p>
            <p className="mt-1 text-[14px] font-semibold text-ink">{stepInstruction(step)}</p>
          </div>

          {step === 0 ? (
            <Panel title="Company profile" icon={Building2}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField label="Company name" value={form.companyName} onChange={(companyName) => setForm((current) => ({ ...current, companyName }))} />
                <SelectField label="Region" value={form.region} options={["Hong Kong", "Vietnam", "Malaysia", "Singapore", "Thailand", "India", "Philippines", "Indonesia"]} onChange={(region) => setForm((current) => ({ ...current, region }))} />
              </div>
              <TextAreaField label="Company introduction" value={form.description} onChange={(description) => setForm((current) => ({ ...current, description }))} />
            </Panel>
          ) : null}

          {step === 1 ? (
            <Panel title="Enable capabilities" icon={BadgeCheck}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Choice title="Can create SR" body="Use LBID as a client to request quotes." active={form.canBeClient} onClick={() => setForm((current) => ({ ...current, canBeClient: !current.canBeClient }))} />
                <Choice title="Can submit bid" body="Use LBID as a forwarder to win work." active={form.canBeForwarder} onClick={() => setForm((current) => ({ ...current, canBeForwarder: !current.canBeForwarder }))} />
              </div>
              {!form.canBeClient && !form.canBeForwarder ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">
                  Please enable at least one capability before continuing.
                </p>
              ) : null}
            </Panel>
          ) : null}

          {step === 2 ? (
            <Panel title="Routes and service coverage" icon={Route}>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Primary route" value={form.primaryRoute} options={["Vietnam to Hong Kong", "Malaysia to Hong Kong", "Singapore to Hong Kong", "Thailand to Hong Kong", "India to Hong Kong", "Hong Kong local delivery"]} onChange={(primaryRoute) => setForm((current) => ({ ...current, primaryRoute }))} />
                <SelectField label="Freight mode" value={form.freightMode} options={["Air and sea freight", "Air freight only", "Sea freight only", "Local delivery only"]} onChange={(freightMode) => setForm((current) => ({ ...current, freightMode }))} />
                <SelectField label="Service type" value={form.serviceType} options={["Customs clearance", "Warehouse receiving", "Last-mile delivery", "Cold chain", "Dangerous goods handling"]} onChange={(serviceType) => setForm((current) => ({ ...current, serviceType }))} />
                <SelectField label="Directory visibility" value={form.visibility} options={["Public profile", "Private until verified"]} onChange={(visibility) => setForm((current) => ({ ...current, visibility }))} />
              </div>
            </Panel>
          ) : null}

          {step === 3 ? (
            <Panel title="Ready to review" icon={Globe2}>
              <div className="grid gap-3">
                <ReviewRow label="Company" value={`${form.companyName} · ${form.region}`} />
                <ReviewRow label="Capabilities" value={[form.canBeClient ? "Client" : "", form.canBeForwarder ? "Forwarder" : ""].filter(Boolean).join(" + ")} />
                <ReviewRow label="Coverage" value={`${form.primaryRoute} · ${form.freightMode} · ${form.serviceType}`} />
                <ReviewRow label="Directory" value={form.visibility} />
              </div>
              <div className="rounded-2xl border border-emerald/25 bg-emerald-soft p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald">
                  <CheckCircle2 className="h-4 w-4" />
                  Your company workspace will show the next action based on these enabled capabilities.
                </p>
              </div>
              {error ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-600">{error}</p> : null}
            </Panel>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              disabled={step === 0 || saving}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 text-[13px] font-bold text-navy transition hover:-translate-y-px hover:border-navy/20 hover:bg-navy-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              {t.back}
            </button>
            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((value) => Math.min(steps.length - 1, value + 1))}
                disabled={step === 1 && !form.canBeClient && !form.canBeForwarder}
                className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-navy px-4 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-[#172d63] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {t.next}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={completeOnboarding}
                disabled={saving}
                className="inline-flex h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-navy px-4 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-[#172d63] disabled:cursor-wait disabled:bg-slate-300"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {saving ? t.saving : t.complete}
              </button>
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

function stepInstruction(step: number) {
  if (step === 0) return "Enter only the essential company information first."
  if (step === 1) return "Choose whether this company can create requests, submit bids, or both."
  if (step === 2) return "Select route and service coverage so LBID can match the right opportunities."
  return "Review the setup, then enter the workspace."
}

function CapabilityCard({ icon: Icon, title, body, active }: { icon: typeof PackageCheck; title: string; body: string; active: boolean }) {
  return (
    <article className={`rounded-2xl border p-5 shadow-[0_12px_32px_rgba(12,26,62,.05)] transition ${active ? "border-gold-border bg-white" : "border-line bg-white/70"}`}>
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${active ? "bg-gold-soft text-gold-dark" : "bg-canvas text-ink-3"}`}>
        <Icon className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-[16px] font-bold text-ink">{title}</h2>
      <p className="mt-2 text-[13px] leading-6 text-ink-2">{body}</p>
    </article>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof Building2; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-canvas p-5">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-navy shadow-sm">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-[16px] font-bold text-ink">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink-2">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] font-medium text-ink shadow-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-navy/10" />
    </label>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink-2">{label}</span>
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="mt-1.5 w-full resize-none rounded-xl border border-line bg-white px-3 py-3 text-[13px] font-medium leading-6 text-ink shadow-sm outline-none transition focus:border-navy focus:ring-4 focus:ring-navy/10" />
    </label>
  )
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink-2">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-line bg-white px-3 text-[13px] font-medium text-ink shadow-sm outline-none transition hover:border-navy/20 focus:border-navy focus:ring-4 focus:ring-navy/10">
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  )
}

function Choice({ title, body, active, onClick }: { title: string; body: string; active?: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-2xl border p-4 text-left transition hover:-translate-y-px hover:shadow-[0_12px_28px_rgba(12,26,62,.08)] ${active ? "border-gold-border bg-gold-soft" : "border-line bg-white"}`}>
      <div className="flex items-center gap-2">
        <span className={`grid h-5 w-5 place-items-center rounded-full border ${active ? "border-gold bg-gold text-white" : "border-line bg-white"}`}>
          {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
        </span>
        <h3 className="text-[14px] font-bold text-ink">{title}</h3>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-ink-2">{body}</p>
    </button>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-white px-4 py-3">
      <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-3">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{value || "Not selected"}</span>
    </div>
  )
}
