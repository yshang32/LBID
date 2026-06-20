import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock3, FileText, LockKeyhole, MapPin, ShieldCheck } from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { isLocale, type Locale } from "@/lib/i18n"

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "en" }]
}

const copy = {
  zh: {
    eyebrow: "MATCHING-FIRST LOGISTICS PLATFORM",
    title: "讓每一個物流決定，回到真正的實力。",
    body: "LBID 將海外 Agency 與香港 Forwarder 放進一個有時限、有記錄、可比較的 sealed bidding workflow。少一點來回 email，多一點可追溯的好決定。",
    primary: "建立 Shipment Request",
    secondary: "瀏覽香港 Forwarder",
    request: "即將截標的需求",
    route: "胡志明市  →  香港",
    cargo: "420 kg · 冷鏈食品樣本 · 空運",
    deadline: "剩餘 02:15:30",
    sealed: "Sealed bid · 聯絡資料受保護",
    featuresTitle: "為真正的物流協作而設計",
    features: [
      ["公平比較", "所有 Forwarder 在同一個限時窗口提交一次報價；截標前沒有人能看見競爭者。"],
      ["完整交接", "報價、AWB、文件、tracking 與訊息留在同一張訂單，不需要回到 WhatsApp。"],
      ["長期信任", "完成紀錄、評價與回應速度會累積成可被看見的實力，而非人脈。"],
    ],
    flowTitle: "一條清楚的交易路徑",
    flow: ["Agency 建立需求", "LBID 審核後開放 3 小時", "Forwarder 提交 sealed bid", "Agency 比較並選擇合作方"],
  },
  en: {
    eyebrow: "MATCHING-FIRST LOGISTICS PLATFORM",
    title: "Put every logistics decision back in capable hands.",
    body: "LBID gives Southeast Asian agencies and Hong Kong forwarders a timed, traceable sealed-bid workflow. Less inbox churn. Better decisions with a real record.",
    primary: "Create Shipment Request",
    secondary: "Browse Hong Kong Forwarders",
    request: "Closing soon",
    route: "Ho Chi Minh City  →  Hong Kong",
    cargo: "420 kg · Chilled food samples · Air freight",
    deadline: "02:15:30 remaining",
    sealed: "Sealed bid · Contact details protected",
    featuresTitle: "Made for real logistics collaboration",
    features: [
      ["A fair comparison", "Every forwarder gets one quote in the same timed window. Competitor details remain hidden before close."],
      ["One operational record", "Quotations, AWB, documents, tracking and messages stay with the same order instead of returning to email."],
      ["Trust that compounds", "Completed work, reviews and response speed become visible capability, not private connections."],
    ],
    flowTitle: "One clear commercial path",
    flow: ["Agency creates a request", "LBID reviews and opens a 3-hour window", "Forwarders submit sealed bids", "Agency compares and appoints a partner"],
  },
}

export default function LocalizedHomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()
  const locale = params.locale as Locale
  const t = copy[locale]
  const prefix = `/${locale}`

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-16 pt-12 sm:px-8 lg:px-10 lg:pt-16">
      <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
        <div className="max-w-3xl">
          <Badge variant="gold" className="border border-lgold/30 bg-[#fcf8ec] text-[#725b1d]">{t.eyebrow}</Badge>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.12] tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">{t.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><Link href={`${prefix}/inquiries/new`}>{t.primary}<ArrowRight className="h-4 w-4" /></Link></Button>
            <Button asChild variant="outline" size="lg"><Link href={`${prefix}/forwarders`}>{t.secondary}</Link></Button>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-lblue/10 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between border-b border-lblue/10 px-5 py-4"><div className="flex items-center gap-2 text-sm font-semibold text-lblue"><LockKeyhole className="h-4 w-4 text-lgold" />{t.request}</div><Badge variant="gold">3H window</Badge></div>
          <div className="p-5 sm:p-6">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-md bg-[#edf1fb] text-lblue"><MapPin className="h-5 w-5" /></span><div><h2 className="text-xl font-semibold text-lblue">{t.route}</h2><p className="mt-1 text-sm text-slate-500">{t.cargo}</p></div></div>
            <div className="my-6 h-px bg-slate-100" />
            <div className="grid gap-3 sm:grid-cols-2"><Info icon={Clock3} label={t.deadline} tone="warning" /><Info icon={ShieldCheck} label={t.sealed} tone="default" /></div>
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5"><span className="text-sm text-slate-500">SR-2026-00124</span><Link href={`${prefix}/marketplace`} className="inline-flex items-center gap-1 text-sm font-semibold text-lblue hover:text-[#2e4a9c]">View opportunity <ArrowRight className="h-4 w-4" /></Link></div>
          </div>
        </section>
      </section>

      <section className="mt-20 border-t border-lblue/10 pt-8"><h2 className="text-2xl font-semibold text-lblue">{t.featuresTitle}</h2><div className="mt-7 grid gap-0 md:grid-cols-3 md:divide-x md:divide-lblue/10">{t.features.map(([title, text], index) => <article key={title} className="border-b border-lblue/10 py-6 md:border-b-0 md:px-7 md:first:pl-0"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#edf1fb] text-sm font-semibold text-lblue">0{index + 1}</span><h3 className="mt-5 text-lg font-semibold text-lblue">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></article>)}</div></section>

      <section className="mt-16 rounded-lg bg-lblue px-6 py-8 text-white sm:px-8"><div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between"><h2 className="text-2xl font-semibold">{t.flowTitle}</h2><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{t.flow.map((step, index) => <div key={step} className="flex items-center gap-3 text-sm text-white/80"><CheckCircle2 className="h-4 w-4 shrink-0 text-[#e6cf87]" /><span><span className="mr-1 font-mono text-xs text-[#e6cf87]">0{index + 1}</span>{step}</span></div>)}</div></div></section>
    </main>
  )
}

function Info({ icon: Icon, label, tone }: { icon: typeof Clock3; label: string; tone: "warning" | "default" }) {
  return <div className={`flex items-center gap-3 rounded-md border p-3 text-sm font-medium ${tone === "warning" ? "border-[#ecdca9] bg-[#fdf9ed] text-[#725b1d]" : "border-lblue/10 bg-slate-50 text-slate-600"}`}><Icon className={`h-4 w-4 ${tone === "warning" ? "text-[#a17e22]" : "text-lblue"}`} />{label}</div>
}
