import Link from "next/link"
import { BadgeCheck, Building2, CheckCircle2, ChevronRight, Globe2, PackageCheck, Route, ShieldCheck } from "lucide-react"

import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    eyebrow: "Unified onboarding",
    title: "先設定公司能力，再開始接單或發需求。",
    intro: "LBID 不把公司固定分成 Client 或 Forwarder。一間公司可以同時建立 Shipment Request，也可以接收推薦並提交 sealed bid。",
    complete: "完成 onboarding",
    dashboard: "稍後到工作台",
  },
  en: {
    eyebrow: "Unified onboarding",
    title: "Set company capability before requests and bids.",
    intro: "LBID does not lock a company into Client or Forwarder only. One company can create shipment requests, receive recommendations and submit sealed bids.",
    complete: "Complete onboarding",
    dashboard: "Go to dashboard later",
  },
} as const

export default function OnboardingPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const prefix = `/${locale}`

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 pb-16 pt-8 sm:px-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(520px,1.1fr)] lg:items-start">
        <div className="lg:sticky lg:top-20">
          <span className="inline-flex rounded-full border border-gold-border bg-gold-soft px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-gold-dark">
            {t.eyebrow}
          </span>
          <h1 className="mt-5 max-w-3xl text-[42px] font-bold leading-[1.02] tracking-[-1.4px] text-ink sm:text-[62px]">
            {t.title}
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-7 text-ink-2">{t.intro}</p>

          <div className="mt-8 grid gap-3">
            <CapabilityCard icon={PackageCheck} title="Client capability" body="Create Shipment Requests, compare bids and award the best partner." />
            <CapabilityCard icon={ShieldCheck} title="Forwarder capability" body="Receive matched opportunities, submit sealed bids and manage awarded orders." />
          </div>
        </div>

        <section className="rounded-[28px] border border-line bg-white p-5 shadow-[0_22px_70px_rgba(12,26,62,.09)] sm:p-6">
          <div className="mb-6 grid gap-2 sm:grid-cols-4">
            {["Company", "Capability", "Coverage", "Review"].map((step, index) => (
              <div key={step} className={`rounded-full border px-3 py-2 text-center text-[11px] font-bold ${index === 0 ? "border-navy bg-navy text-white" : "border-line bg-canvas text-ink-2"}`}>
                {index + 1}. {step}
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <Panel title="1. Company profile" icon={Building2}>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputMock label="Company name" value="Pacific Forward Ltd." freeText />
                <SelectMock label="Region" value="Hong Kong" />
              </div>
              <InputMock label="Company introduction" value="Hong Kong logistics company handling air, sea and local delivery workflows." freeText large />
            </Panel>

            <Panel title="2. Enable capabilities" icon={BadgeCheck}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Choice title="Can create SR" body="Use LBID as a client to request quotes." active />
                <Choice title="Can submit bid" body="Use LBID as a forwarder to win work." active />
              </div>
            </Panel>

            <Panel title="3. Routes and service coverage" icon={Route}>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectMock label="Primary route" value="Vietnam to Hong Kong" />
                <SelectMock label="Freight mode" value="Air and sea freight" />
                <SelectMock label="Service type" value="Customs clearance" />
                <SelectMock label="Directory visibility" value="Public profile" />
              </div>
            </Panel>

            <Panel title="4. Ready to review" icon={Globe2}>
              <div className="rounded-2xl border border-emerald/25 bg-emerald-soft p-4">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-emerald">
                  <CheckCircle2 className="h-4 w-4" />
                  Your company can now both create shipment requests and receive matched bidding opportunities.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link href={`${prefix}/dashboard`} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-navy px-4 text-[13px] font-bold text-white transition hover:-translate-y-px hover:bg-[#172d63]">
                  {t.complete}
                </Link>
                <Link href={`${prefix}/profile`} className="inline-flex h-11 flex-1 items-center justify-center rounded-xl border border-line bg-white px-4 text-[13px] font-bold text-navy transition hover:-translate-y-px hover:border-navy/20 hover:bg-navy-soft">
                  {t.dashboard}
                </Link>
              </div>
            </Panel>
          </div>
        </section>
      </section>
    </main>
  )
}

function CapabilityCard({ icon: Icon, title, body }: { icon: typeof PackageCheck; title: string; body: string }) {
  return (
    <article className="rounded-2xl border border-line bg-white p-5 shadow-[0_12px_32px_rgba(12,26,62,.05)]">
      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-soft text-gold-dark">
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

function InputMock({ label, value, freeText, large }: { label: string; value: string; freeText?: boolean; large?: boolean }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink-2">{label}</span>
      <div className={`mt-1.5 rounded-xl border border-line bg-white px-3 py-3 text-[13px] font-medium text-ink shadow-sm ${large ? "min-h-[92px]" : ""}`}>
        {value}
      </div>
      {freeText ? <span className="mt-1.5 block text-[11px] text-ink-3">Free text field</span> : null}
    </label>
  )
}

function SelectMock({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-[12px] font-semibold text-ink-2">{label}</span>
      <div className="mt-1.5 flex h-11 items-center justify-between rounded-xl border border-line bg-white px-3 text-[13px] font-medium text-ink shadow-sm transition hover:border-navy/20">
        {value}
        <ChevronRight className="h-4 w-4 text-ink-3" />
      </div>
    </label>
  )
}

function Choice({ title, body, active }: { title: string; body: string; active?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${active ? "border-gold-border bg-gold-soft" : "border-line bg-white"}`}>
      <div className="flex items-center gap-2">
        <span className={`h-4 w-4 rounded-full border ${active ? "border-gold bg-gold" : "border-line"}`} />
        <h3 className="text-[14px] font-bold text-ink">{title}</h3>
      </div>
      <p className="mt-2 text-[12px] leading-5 text-ink-2">{body}</p>
    </div>
  )
}
