"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileLock2,
  LockKeyhole,
  Radar,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"

type BidLane = "recommended" | "market"

const copy = {
  zh: {
    back: "\u8fd4\u56de\u767b\u5165",
    preview: "DESIGN PREVIEW",
    recommended: "\u7cfb\u7d71\u63a8\u85a6",
    market: "\u4e00\u822c\u7af6\u50f9",
    recommendedEyebrow: "MATCHED FOR YOUR COMPANY",
    marketEyebrow: "OPEN MARKET MISSION",
    recommendedTitle: "\u9019\u500b\u9700\u6c42\uff0c\u6b63\u662f\u4f60\u7684\u8def\u7dda\u3002",
    marketTitle: "\u516c\u5e73\u958b\u653e\uff0c\u4e00\u6b21\u5bc6\u5c01\u51fa\u50f9\u3002",
    recommendedBody: "LBID \u6839\u64da\u516c\u53f8\u6db5\u84cb\u7bc4\u570d\u3001\u670d\u52d9\u80fd\u529b\u53ca\u56de\u61c9\u7d00\u9304\u4e3b\u52d5\u63a8\u9001\u3002",
    marketBody: "\u5408\u8cc7\u683c\u7684 Forwarder \u90fd\u53ef\u5728\u7a97\u53e3\u95dc\u9589\u524d\u63d0\u4ea4\u4e00\u6b21\u5bc6\u5c01\u5831\u50f9\u3002",
    route: "Ho Chi Minh City \u2192 Hong Kong",
    deadline: "\u8ddd\u96e2\u5bc6\u5c01\u7a97\u53e3\u7d50\u675f",
    final: "FINAL WINDOW",
    profileMatch: "PROFILE MATCH",
    pushed: "PUSHED TO YOU",
    cargo: "\u8ca8\u7269\u8cc7\u6599",
    services: "\u6240\u9700\u670d\u52d9",
    quote: "\u5831\u50f9\u63a7\u5236\u53f0",
    amount: "\u5831\u50f9\u91d1\u984d\uff08HKD\uff09",
    transit: "\u9810\u8a08\u904b\u8f38\u6642\u9593",
    terms: "\u670d\u52d9\u689d\u6b3e\u8207\u5099\u8a3b",
    token: "\u793a\u7bc4\u6a21\u5f0f\uff0c\u4e0d\u6703\u6263\u9664 Token",
    launch: "\u555f\u52d5\u5bc6\u5c01\u50b3\u8f38",
    confirm: "\u78ba\u8a8d\u5c01\u5b58\u5831\u50f9",
    edit: "\u8fd4\u56de\u7de8\u8f2f",
    sealed: "\u7af6\u722d\u5c0d\u624b\u7684\u50f9\u683c\u3001\u8eab\u4efd\u8207\u689d\u6b3e\u5747\u6703\u4fdd\u6301\u5bc6\u5c01\u3002",
    success: "\u5831\u50f9\u5df2\u5c01\u5b58",
    successBody: "\u9019\u662f\u8a2d\u8a08\u9810\u89bd\u3002\u771f\u5be6\u7af6\u50f9\u6703\u8a18\u9304\u63d0\u4ea4\u6642\u9593\uff0c\u4e26\u5728\u7a97\u53e3\u95dc\u9589\u5f8c\u901a\u77e5\u4f60\u7d50\u679c\u3002",
    matching: "\u70ba\u4ec0\u9ebc\u63a8\u85a6\u7d66\u4f60",
    reasonOne: "\u8d8a\u5357 \u2192 \u9999\u6e2f\u822a\u7dda\u8207\u4f60\u7684\u8986\u84cb\u7bc4\u570d\u76f8\u7b26",
    reasonTwo: "\u7a7a\u904b\u3001\u6e05\u95dc\u8207\u672c\u5730\u6d3e\u9001\u670d\u52d9\u80fd\u529b\u5df2\u547d\u4e2d",
    reasonThree: "\u5feb\u901f\u56de\u61c9\u7d00\u9304\u7b26\u5408\u6b64\u7968\u9700\u6c42\u7bc0\u594f",
    oneShot: "\u4f60\u53ea\u53ef\u63d0\u4ea4\u4e00\u6b21\u5831\u50f9\u3002\u5176\u4ed6\u53c3\u8207\u8005\u7121\u6cd5\u770b\u898b\u4f60\u7684\u50f9\u683c\u6216\u689d\u6b3e\u3002",
    transmission: "\u50b3\u8f38\u72c0\u614b",
    encrypted: "\u52a0\u5bc6\u5c01\u5b58",
  },
  en: {
    back: "Back to sign in",
    preview: "DESIGN PREVIEW",
    recommended: "Recommended",
    market: "Open market",
    recommendedEyebrow: "MATCHED FOR YOUR COMPANY",
    marketEyebrow: "OPEN MARKET MISSION",
    recommendedTitle: "This is a route built for your network.",
    marketTitle: "Fair access. One sealed quote.",
    recommendedBody: "LBID pushed this request based on your coverage, service capability and response record.",
    marketBody: "Eligible forwarders can submit one sealed quote before the window closes.",
    route: "Ho Chi Minh City \u2192 Hong Kong",
    deadline: "Time remaining in bid window",
    final: "FINAL WINDOW",
    profileMatch: "PROFILE MATCH",
    pushed: "PUSHED TO YOU",
    cargo: "Cargo",
    services: "Services",
    quote: "Quote console",
    amount: "Bid amount (HKD)",
    transit: "Estimated transit time",
    terms: "Terms and remarks",
    token: "Preview mode. No Token will be used.",
    launch: "Seal and transmit bid",
    confirm: "Confirm sealed bid",
    edit: "Back to edit",
    sealed: "Competitor prices, identities and terms remain sealed.",
    success: "Bid sealed",
    successBody: "This is a design preview. A real bid records the submission time and notifies you after the window closes.",
    matching: "Why LBID recommended this",
    reasonOne: "Vietnam \u2192 Hong Kong is within your active coverage",
    reasonTwo: "Air, customs and local delivery capabilities match",
    reasonThree: "Your response record fits this shipment timeline",
    oneShot: "You can submit one quote. Other participants cannot see your price or terms.",
    transmission: "Transmission",
    encrypted: "Encrypted and sealed",
  },
}

export default function BidDemoPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [lane, setLane] = useState<BidLane>("recommended")
  const [remaining, setRemaining] = useState(14 * 60 + 28)
  const [amount, setAmount] = useState("12800")
  const [transit, setTransit] = useState(locale === "zh" ? "3 \u81f3 5 \u5929" : "3 to 5 days")
  const [terms, setTerms] = useState(locale === "zh" ? "\u5305\u62ec\u9999\u6e2f\u672c\u5730\u6d3e\u9001\u3001\u6587\u4ef6\u8655\u7406\u53ca\u6e05\u95dc\u5354\u8abf\u3002" : "Includes Hong Kong local delivery, documents and customs coordination.")
  const [confirming, setConfirming] = useState(false)
  const [sealed, setSealed] = useState(false)

  useEffect(() => {
    const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  const timer = `00:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
  const isRecommended = lane === "recommended"

  return (
    <main className={`bid-mode-page min-h-screen ${isRecommended ? "bid-mode-recommended" : "bid-mode-market"}`}>
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <BrandMark markClassName="h-9 w-[138px]" />
        <div className="flex items-center gap-3">
          <Badge variant="gold">{t.preview}</Badge>
          <Link href={`/${locale}/auth`} className="text-sm font-semibold text-lblue hover:underline"><ArrowLeft className="mr-1 inline h-4 w-4" />{t.back}</Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-4 sm:px-6">
        <div className="bid-lane-switch" role="group" aria-label="Bid type preview">
          <button type="button" className={isRecommended ? "bid-lane-option bid-lane-option-active" : "bid-lane-option"} onClick={() => setLane("recommended")} aria-pressed={isRecommended}>
            <Sparkles className="h-4 w-4" /><span>{t.recommended}</span><strong>94%</strong>
          </button>
          <button type="button" className={!isRecommended ? "bid-lane-option bid-lane-option-active" : "bid-lane-option"} onClick={() => setLane("market")} aria-pressed={!isRecommended}>
            <Radar className="h-4 w-4" /><span>{t.market}</span><strong>OPEN</strong>
          </button>
        </div>

        <section className="bid-mission bid-mission-final mt-4">
          <div className="bid-grid" />
          <div className="bid-scan-line" />
          <div className="bid-impact-word">{isRecommended ? "MATCH" : "BID"}</div>
          <div className="relative z-10 flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex flex-wrap gap-2">
                <Badge variant="gold">{isRecommended ? t.pushed : "SEALED BID MISSION"}</Badge>
                <Badge variant="teal">BIDDING OPEN</Badge>
                <Badge variant="secondary">{t.final}</Badge>
              </div>
              <p className="bid-mission-eyebrow mt-5">{isRecommended ? t.recommendedEyebrow : t.marketEyebrow}</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-5xl">{isRecommended ? t.recommendedTitle : t.marketTitle}</h1>
              <p className="mt-3 max-w-xl text-base leading-7 text-slate-300">{isRecommended ? t.recommendedBody : t.marketBody}</p>
            </div>
            <div className="bid-countdown">
              <div className="flex items-center justify-between text-[11px] font-bold tracking-[.14em] text-[#dcc36e]"><span>{t.deadline}</span><span className="bid-final-label">{t.final}</span></div>
              <div className="mt-2 font-mono text-4xl font-semibold tracking-[.08em] text-white sm:text-5xl">{timer}</div>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            {isRecommended ? <MatchPanel t={t} /> : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <PreviewInfo icon={<Radar className="h-5 w-5" />} label={locale === "zh" ? "\u904b\u8f38\u8def\u7dda" : "Route"} value={t.route} />
              <PreviewInfo icon={<FileLock2 className="h-5 w-5" />} label={t.cargo} value={locale === "zh" ? "\u96fb\u5b50\u96f6\u4ef6 \u00b7 500 kg \u00b7 3 CBM" : "Electronic components \u00b7 500 kg \u00b7 3 CBM"} />
              <PreviewInfo icon={<Clock3 className="h-5 w-5" />} label={locale === "zh" ? "\u904b\u8f38\u65b9\u5f0f" : "Transport mode"} value={locale === "zh" ? "\u7a7a\u904b" : "Air freight"} />
              <PreviewInfo icon={<ShieldCheck className="h-5 w-5" />} label={t.services} value={locale === "zh" ? "\u6e05\u95dc\u3001\u5009\u5132\u3001\u9999\u6e2f\u672c\u5730\u6d3e\u9001" : "Customs, warehousing, local delivery"} />
            </div>
            <Card>
              <CardContent className="p-5">
                <div className="flex gap-3"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#b18a25]" /><div><p className="font-semibold text-lblue">{t.sealed}</p><p className="mt-2 text-sm leading-6 text-slate-600">{t.oneShot}</p></div></div>
              </CardContent>
            </Card>
          </div>

          <Card className="bid-console h-fit border-[#d8b75a]/60">
            <CardContent className="p-6">
              <div className="flex items-center justify-between"><div><p className="text-xs font-bold tracking-[.14em] text-[#9a7517]">{t.preview}</p><h2 className="mt-1 text-xl font-semibold text-lblue">{t.quote}</h2></div><LockKeyhole className="h-6 w-6 text-[#b18a25]" /></div>
              {sealed ? <div className="bid-success mt-6"><CheckCircle2 className="h-8 w-8" /><h3 className="mt-3 text-lg font-semibold">{t.success}</h3><p className="mt-2 text-sm leading-6">{t.successBody}</p><Button className="mt-5 w-full" variant="outline" onClick={() => setSealed(false)}>{t.edit}</Button></div> : <div className="mt-6 space-y-5"><PreviewField label={t.amount}><Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} /></PreviewField><PreviewField label={t.transit}><Input value={transit} onChange={(event) => setTransit(event.target.value)} /></PreviewField><PreviewField label={t.terms}><Textarea value={terms} onChange={(event) => setTerms(event.target.value)} /></PreviewField><p className="flex items-center gap-2 text-xs font-medium text-slate-500"><ShieldCheck className="h-4 w-4 text-[#b18a25]" />{t.token}</p><Button className="bid-launch-button w-full" onClick={() => setConfirming(true)}><Zap className="h-4 w-4" />{t.launch}<ArrowRight className="h-4 w-4" /></Button></div>}
            </CardContent>
          </Card>
        </section>
      </section>

      {confirming ? <div className="fixed inset-0 z-[80] grid place-items-center bg-[#101a36]/65 p-4 backdrop-blur-sm"><Card className="w-full max-w-md border-[#d8b75a]/55"><CardContent className="p-6"><p className="text-xs font-bold tracking-[.14em] text-[#9a7517]">{isRecommended ? t.pushed : "SEALED BID MISSION"}</p><h2 className="mt-2 text-2xl font-semibold text-lblue">{t.confirm}</h2><div className="mt-5 space-y-3"><PreviewLine label={t.amount} value={`HKD ${Number(amount).toLocaleString()}`} /><PreviewLine label={t.transit} value={transit} /><PreviewLine label={t.transmission} value={t.encrypted} /></div><div className="mt-6 flex gap-2"><Button className="flex-1" variant="outline" onClick={() => setConfirming(false)}>{t.edit}</Button><Button className="flex-1" variant="gold" onClick={() => { setConfirming(false); setSealed(true) }}>{t.confirm}</Button></div></CardContent></Card></div> : null}
    </main>
  )
}

function MatchPanel({ t }: { t: typeof copy.en }) {
  return <section className="bid-match-panel"><div className="bid-match-score"><Target className="h-5 w-5" /><span>94</span><small>%</small></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-white">{t.matching}</p><span className="bid-pulse"><span />SYSTEM PULSE</span></div><div className="mt-3 grid gap-2 sm:grid-cols-3"><MatchReason text={t.reasonOne} /><MatchReason text={t.reasonTwo} /><MatchReason text={t.reasonThree} /></div></div></section>
}

function MatchReason({ text }: { text: string }) { return <div className="bid-match-reason"><CheckCircle2 className="h-4 w-4 shrink-0" /><span>{text}</span></div> }
function PreviewInfo({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <Card><CardContent className="p-4"><div className="text-[#b18a25]">{icon}</div><p className="mt-3 text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-lblue">{value}</p></CardContent></Card> }
function PreviewField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-slate-700"><span className="mb-2 block">{label}</span>{children}</label> }
function PreviewLine({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 border border-[#e4e9f1] bg-[#fafbfd] p-3 text-sm"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-lblue">{value}</span></div> }
