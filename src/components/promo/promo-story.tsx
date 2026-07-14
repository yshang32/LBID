"use client"

import Image from "next/image"
import { useEffect, useRef, useState, type ReactNode } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import {
  ArrowRight,
  BadgeCheck,
  Box,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  LockKeyhole,
  MessageSquareText,
  PackageCheck,
  Plane,
  Radar,
  Route,
  ShieldCheck,
  Sparkles,
  Truck,
  UserRoundCheck,
} from "lucide-react"

import type { Locale } from "@/lib/i18n"

if (typeof window !== "undefined") gsap.registerPlugin(ScrollTrigger)

export type PromoAudience = "client" | "forwarder"

type PromoStoryProps = {
  locale: Locale
  audience: PromoAudience
  onAudienceChange: (audience: PromoAudience) => void
  onOpenAuth: (mode: "login" | "register") => void
}

const storyCopy = {
  en: {
    chapter: "LBID PRODUCT STORY",
    howEyebrow: "02 / HOW IT WORKS",
    howTitle: "One verified request. One fair path to delivery.",
    howIntro: "Every handoff is visible. Every quote stays sealed until the bidding window closes.",
    steps: [
      ["Request verified", "Cargo, route and deadline reviewed"],
      ["Sealed bidding", "Qualified forwarders respond privately"],
      ["Fair selection", "Compare price, timing and capability"],
      ["Order workspace", "Documents, messages and delivery in one place"],
    ],
    whyEyebrow: "03 / WHY LBID",
    whyTitle: "Logistics has been relationship-led for too long.",
    whyAccent: "We make capability visible.",
    oldWay: "Traditional sourcing",
    newWay: "LBID workflow",
    oldItems: ["Scattered email threads", "Unclear quote comparison", "Relationship-based access"],
    newItems: ["Verified demand", "Sealed quotations", "Auditable selection"],
    rules: [
      ["3 hours", "Fixed bidding window"],
      ["1 bid", "One sealed response per forwarder"],
      ["100%", "Quotes hidden before close"],
    ],
    sidesEyebrow: "04 / BUILT FOR BOTH SIDES",
    sidesTitle: "One account. Two ways to grow.",
    client: "I ship cargo",
    forwarder: "I move cargo",
    clientTitle: "Create demand without chasing quotations.",
    clientIntro: "Publish a verified shipment request and review qualified responses in one decision workspace.",
    clientItems: ["Guided shipment request", "Side-by-side quote comparison", "Order and document workspace"],
    forwarderTitle: "Win demand that matches your capability.",
    forwarderIntro: "See opportunities selected for your routes, capacity and verified service profile.",
    forwarderItems: ["Profile-based recommendations", "Private one-shot bid", "Reputation and route history"],
    trustEyebrow: "05 / SEALED BY DESIGN",
    trustTitle: "See the decision. Never expose the competition.",
    trustIntro: "The shipper sees qualified participation while the window is open. Prices and identities unlock only when the rules allow.",
    open: "Bidding open",
    closed: "Window closed",
    privateBid: "Encrypted quotation",
    submitted: "Submitted",
    hidden: "Price hidden",
    revealed: "Revealed after close",
    lowest: "Lowest quote",
    choose: "Agency can still choose by value",
    trustLabels: ["Verified company", "Token ledger", "Audit record", "Contact unlock"],
    finalEyebrow: "06 / LOGISTICS BIDDING PLATFORM",
    finalTitle: "From overseas demand to a trusted working relationship.",
    finalIntro: "Create requests. Win opportunities. Deliver with one shared record.",
    register: "Create company account",
    login: "Enter workspace",
    footer: "LBID · Hong Kong · Sealed bidding for fair logistics partnerships",
  },
  zh: {
    chapter: "LBID PRODUCT STORY",
    howEyebrow: "02 / 平台如何運作",
    howTitle: "一個已驗證需求，一條公平交付路徑。",
    howIntro: "每個交接點都有記錄；競價結束前，每份報價都保持密封。",
    steps: [
      ["需求通過審核", "核對貨物、路線及截標時間"],
      ["密封競價", "合資格貨代私下提交報價"],
      ["公平選擇", "比較價格、時效及真實能力"],
      ["訂單工作區", "文件、訊息及交付集中管理"],
    ],
    whyEyebrow: "03 / 為何需要 LBID",
    whyTitle: "物流合作由關係主導，已經太耐。",
    whyAccent: "我哋令真實能力被看見。",
    oldWay: "傳統採購方式",
    newWay: "LBID 工作流程",
    oldItems: ["分散 Email 對話", "報價難以公平比較", "靠關係取得機會"],
    newItems: ["已驗證真實需求", "密封保密報價", "可追溯選擇記錄"],
    rules: [
      ["3 小時", "固定競價窗口"],
      ["1 次", "每間貨代只可提交一次"],
      ["100%", "截標前完全隱藏報價"],
    ],
    sidesEyebrow: "04 / 服務雙方",
    sidesTitle: "一個帳戶，兩種增長方式。",
    client: "我要發出需求",
    forwarder: "我要承接貨運",
    clientTitle: "發出需求，毋須再逐間追報價。",
    clientIntro: "建立已驗證 Shipment Request，在同一個決策畫面比較合資格回應。",
    clientItems: ["引導式貨運需求", "並排比較密封報價", "訂單及文件工作區"],
    forwarderTitle: "承接真正匹配你能力嘅需求。",
    forwarderIntro: "系統按路線、運力及已驗證服務紀錄，推薦適合你嘅機會。",
    forwarderItems: ["按公司 Profile 推薦", "一次性私密報價", "累積信譽及路線紀錄"],
    trustEyebrow: "05 / 為公平而密封",
    trustTitle: "只睇參與狀態，唔睇競爭對手。",
    trustIntro: "競價期間只顯示合資格回應數量；價格及身份會按平台規則喺截標後解鎖。",
    open: "競價進行中",
    closed: "競價已結束",
    privateBid: "加密報價",
    submitted: "已提交",
    hidden: "價格已隱藏",
    revealed: "截標後顯示",
    lowest: "最低報價",
    choose: "Agency 仍可按整體價值選擇",
    trustLabels: ["公司已驗證", "Token 帳本", "審計記錄", "中標後解鎖聯絡"],
    finalEyebrow: "06 / LOGISTICS BIDDING PLATFORM",
    finalTitle: "從海外需求，建立可信任嘅長期合作。",
    finalIntro: "發出需求、承接機會、完成交付，共用一份清晰記錄。",
    register: "建立公司帳戶",
    login: "進入工作區",
    footer: "LBID · Hong Kong · 以密封競價建立公平物流合作",
  },
} as const

const stepIcons = [FileCheck2, LockKeyhole, BadgeCheck, PackageCheck]

export function PromoStory({ locale, audience, onAudienceChange, onOpenAuth }: PromoStoryProps) {
  const copy = storyCopy[locale]
  const rootRef = useRef<HTMLDivElement>(null)
  const [bidClosed, setBidClosed] = useState(false)

  useEffect(() => {
    if (!rootRef.current || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    const context = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-story-reveal]").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: { trigger: element, start: "top 86%", once: true },
          },
        )
      })
      gsap.utils.toArray<HTMLElement>("[data-story-image]").forEach((image) => {
        gsap.fromTo(
          image,
          { scale: 1.1, yPercent: -2 },
          {
            scale: 1.04,
            yPercent: 2,
            ease: "none",
            scrollTrigger: { trigger: image.parentElement ?? image, start: "top bottom", end: "bottom top", scrub: 0.8 },
          },
        )
      })
      gsap.utils.toArray<HTMLElement>("[data-story-glass]").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 46, scale: 0.97 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: element, start: "top 90%", once: true },
          },
        )
      })
      gsap.utils.toArray<HTMLElement>("[data-story-sheen]").forEach((element) => {
        gsap.fromTo(
          element,
          { xPercent: -105 },
          {
            xPercent: 105,
            ease: "none",
            scrollTrigger: { trigger: element.parentElement ?? element, start: "top bottom", end: "bottom top", scrub: 1 },
          },
        )
      })
    }, rootRef)
    return () => context.revert()
  }, [])

  const activeTitle = audience === "client" ? copy.clientTitle : copy.forwarderTitle
  const activeIntro = audience === "client" ? copy.clientIntro : copy.forwarderIntro
  const activeItems = audience === "client" ? copy.clientItems : copy.forwarderItems

  return (
    <div ref={rootRef} className="relative z-40 overflow-hidden bg-[#f8fafc] text-[#111827]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(21,48,85,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(21,48,85,0.035)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_45%)]" />

      <section id="how-lbid" className="relative bg-[#eef8fb] px-5 pb-24 pt-28 sm:px-9 lg:pb-36 lg:pt-40">
        <div className="mx-auto max-w-[1440px]">
          <div data-story-reveal className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <div>
              <ChapterLabel>{copy.howEyebrow}</ChapterLabel>
              <h2 className="mt-6 max-w-xl text-4xl font-medium leading-[1.08] text-[#10254d] md:text-5xl xl:text-6xl">{copy.howTitle}</h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#64748b] lg:justify-self-end lg:text-lg">{copy.howIntro}</p>
          </div>

          <div className="relative mt-14 min-h-[940px] overflow-hidden rounded-[8px] border border-white/70 bg-[#0a2344] shadow-[0_40px_100px_rgba(38,89,117,0.2)] md:min-h-[720px] lg:mt-20">
            <Image
              src="/promo/story/verified-request.webp"
              alt="Verified air cargo prepared at a modern international terminal"
              fill
              sizes="(max-width: 768px) 100vw, 1440px"
              data-story-image
              className="object-cover object-[62%_center]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,28,55,0.04)_0%,rgba(7,28,55,0.3)_46%,rgba(7,28,55,0.9)_100%)] md:bg-[linear-gradient(180deg,rgba(7,28,55,0.02)_0%,rgba(7,28,55,0.12)_42%,rgba(7,28,55,0.82)_100%)]" />
            <div aria-hidden="true" data-story-sheen className="absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(122,220,240,0.16),transparent)]" />
            <div className="relative flex min-h-[940px] items-end p-4 sm:p-6 md:min-h-[720px] lg:p-8">
              <div className="grid w-full gap-3 md:grid-cols-2 xl:grid-cols-4">
                {copy.steps.map(([title, detail], index) => {
                  const Icon = stepIcons[index]
                  const accent = ["#54bfd1", "#8e77d6", "#d3a940", "#4fb38e"][index]
                  return (
                    <article
                      key={title}
                      data-story-glass
                      className="group min-h-[168px] rounded-[6px] border border-white/70 bg-white/[0.88] p-5 text-[#10254d] shadow-[0_18px_48px_rgba(4,18,38,0.18)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white/[0.95] sm:p-6"
                    >
                      <div className="flex items-center justify-between">
                        <span className="grid h-10 w-10 place-items-center rounded-[5px] border border-white/70 bg-white/55" style={{ color: accent }}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-mono text-xs text-[#71839a]">0{index + 1}</span>
                      </div>
                      <div className="mt-7 h-px w-full bg-[#10254d]/10"><span className="block h-px w-10" style={{ backgroundColor: accent }} /></div>
                      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[#5f6f84]">{detail}</p>
                    </article>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="why-lbid" className="relative overflow-hidden border-y border-[#e7ddd5] bg-[#fbf7f3]">
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(135deg,rgba(216,167,74,0.12)_0%,transparent_32%,rgba(93,174,190,0.11)_68%,transparent_100%)]" />
        <div aria-hidden="true" data-story-sheen className="absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.7),transparent)]" />
        <div className="mx-auto max-w-[1440px] px-5 py-24 sm:px-9 lg:px-16 lg:py-36">
          <div data-story-reveal className="max-w-5xl">
            <ChapterLabel>{copy.whyEyebrow}</ChapterLabel>
            <h2 className="mt-7 text-4xl font-medium leading-[1.08] text-[#101827] md:text-6xl lg:text-7xl">
              {copy.whyTitle}<br /><span className="text-[#b58b28]">{copy.whyAccent}</span>
            </h2>
          </div>

          <div className="relative mt-16 grid gap-4 lg:mt-24 lg:grid-cols-2">
            <ComparisonPanel title={copy.oldWay} items={copy.oldItems} tone="old" />
            <ComparisonPanel title={copy.newWay} items={copy.newItems} tone="new" />
          </div>

          <div className="relative mt-4 grid gap-4 sm:grid-cols-3">
            {copy.rules.map(([value, label], index) => (
              <div key={label} data-story-glass className="rounded-[6px] border border-white/75 bg-white/70 px-7 py-9 shadow-[0_16px_50px_rgba(69,72,83,0.08)] backdrop-blur-xl lg:px-10 lg:py-12">
                <span className="mb-8 block h-[3px] w-12" style={{ backgroundColor: ["#c9a84c", "#5e9ec0", "#4eaa8c"][index] }} />
                <strong className="text-3xl font-medium text-[#10254d] md:text-5xl">{value}</strong>
                <p className="mt-3 text-sm text-[#6d7a8f]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="for-both" className="relative bg-[#f1f8f6] px-5 py-24 sm:px-9 lg:py-36">
        <div className="mx-auto max-w-[1440px]">
          <div data-story-reveal className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <ChapterLabel>{copy.sidesEyebrow}</ChapterLabel>
              <h2 className="mt-6 max-w-3xl text-4xl font-medium leading-[1.08] text-[#10254d] md:text-5xl xl:text-6xl">{copy.sidesTitle}</h2>
            </div>
            <div className="inline-flex w-full max-w-md rounded-[6px] border border-[#bfd5d0] bg-white/70 p-1 shadow-[0_12px_30px_rgba(41,91,80,0.08)] backdrop-blur-xl lg:w-auto" role="tablist" aria-label={copy.sidesTitle}>
              <AudienceButton active={audience === "client"} onClick={() => onAudienceChange("client")}>{copy.client}</AudienceButton>
              <AudienceButton active={audience === "forwarder"} onClick={() => onAudienceChange("forwarder")}>{copy.forwarder}</AudienceButton>
            </div>
          </div>

          <div className="relative mt-12 overflow-hidden rounded-[8px] border border-white/70 bg-[#173c43] shadow-[0_42px_110px_rgba(31,86,75,0.19)] lg:mt-16">
            <Image
              src="/promo/story/verified-request.webp"
              alt="International air cargo ready for a verified shipment request"
              fill
              sizes="(max-width: 768px) 100vw, 1440px"
              data-story-image
              className={`object-cover object-center transition-opacity duration-700 ${audience === "client" ? "opacity-100" : "opacity-0"}`}
            />
            <Image
              src="/promo/story/matched-capability.webp"
              alt="Hong Kong logistics hub showing verified freight capability"
              fill
              sizes="(max-width: 768px) 100vw, 1440px"
              data-story-image
              className={`object-cover object-center transition-opacity duration-700 ${audience === "forwarder" ? "opacity-100" : "opacity-0"}`}
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,35,44,0.86)_0%,rgba(11,47,54,0.62)_45%,rgba(8,25,44,0.28)_100%)]" />
            <div aria-hidden="true" data-story-sheen className="absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(112,227,209,0.15),transparent)]" />

            <div className="relative grid min-h-[760px] gap-5 p-4 sm:p-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-center lg:gap-8 lg:p-10 xl:p-14">
              <div data-story-glass className="flex flex-col justify-between rounded-[7px] border border-white/45 bg-white/80 p-7 shadow-[0_24px_70px_rgba(3,25,29,0.2)] backdrop-blur-xl lg:min-h-[570px] lg:p-10">
                <div>
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase text-[#8f6d19]">
                    {audience === "client" ? <Box className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                    {audience === "client" ? copy.client : copy.forwarder}
                  </span>
                  <h3 className="mt-7 text-3xl font-medium leading-[1.15] text-[#10254d] md:text-4xl">{activeTitle}</h3>
                  <p className="mt-5 max-w-lg text-base leading-7 text-[#5c6f7a]">{activeIntro}</p>
                </div>
                <div className="mt-12 space-y-4">
                  {activeItems.map((item, index) => (
                    <div key={item} className="flex items-center gap-3 border-t border-[#a9c8c0]/60 pt-4 text-sm font-medium text-[#244b4c]">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-[#dff4ee] text-[#2f8b72]"><CheckCircle2 className="h-4 w-4" /></span>
                      <span className="flex-1">{item}</span>
                      <span className="font-mono text-[10px] text-[#7b9793]">0{index + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div data-story-glass>
                {audience === "client" ? <ClientWorkspacePreview locale={locale} /> : <ForwarderWorkspacePreview locale={locale} />}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="sealed-design" className="relative overflow-hidden bg-[#07142c] text-white">
        <Image
          src="/promo/story/sealed-bid.webp"
          alt="A secured cargo case representing LBID sealed bidding"
          fill
          sizes="100vw"
          data-story-image
          className="object-cover object-center opacity-70"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,13,32,0.68)_0%,rgba(5,17,40,0.82)_48%,rgba(5,15,35,0.96)_100%)]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(117,157,214,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(117,157,214,0.08)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
        <div aria-hidden="true" data-story-sheen className="absolute inset-y-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(100,183,255,0.12),rgba(180,93,226,0.08),transparent)]" />
        <div className="relative mx-auto max-w-[1440px] px-5 py-24 sm:px-9 lg:px-16 lg:py-36">
          <div data-story-reveal className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <ChapterLabel dark>{copy.trustEyebrow}</ChapterLabel>
              <h2 className="mt-6 max-w-3xl text-4xl font-medium leading-[1.08] md:text-5xl xl:text-6xl">{copy.trustTitle}</h2>
            </div>
            <div className="lg:justify-self-end">
              <p className="max-w-xl text-base leading-7 text-[#aebbd0]">{copy.trustIntro}</p>
              <div className="mt-6 inline-flex border border-white/15 bg-white/[0.06] p-1">
                <AudienceButton dark active={!bidClosed} onClick={() => setBidClosed(false)}>{copy.open}</AudienceButton>
                <AudienceButton dark active={bidClosed} onClick={() => setBidClosed(true)}>{copy.closed}</AudienceButton>
              </div>
            </div>
          </div>

          <div data-story-glass className="mt-14 overflow-hidden rounded-[8px] border border-white/20 bg-[#081a39]/[0.72] shadow-[0_35px_100px_rgba(0,0,0,0.42)] backdrop-blur-xl lg:mt-20">
            <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 sm:flex-row sm:items-center sm:justify-between lg:px-9">
              <div className="flex items-center gap-3">
                <span className={`h-2 w-2 rounded-full ${bidClosed ? "bg-[#c9a84c]" : "bg-[#45bd91] shadow-[0_0_16px_#45bd91]"}`} />
                <span className="text-sm font-semibold">{bidClosed ? copy.closed : copy.open}</span>
              </div>
              <span className="font-mono text-xs text-[#90a2bf]">SR-HKG-260714 · SGN → HKG</span>
            </div>
            <div className="grid lg:grid-cols-[0.8fr_1.2fr]">
              <div className="border-b border-white/10 bg-[#071832]/[0.45] p-7 backdrop-blur-lg lg:border-b-0 lg:border-r lg:p-10">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase text-[#8195b5]">Route</span>
                    <h3 className="mt-2 text-2xl font-medium">Ho Chi Minh City → Hong Kong</h3>
                  </div>
                  <Plane className="hidden h-7 w-7 text-[#c9a84c] sm:block" />
                </div>
                <div className="mt-10 grid grid-cols-3 gap-px overflow-hidden bg-white/10">
                  <DataCell value="500 kg" label="Weight" />
                  <DataCell value="3 CBM" label="Volume" />
                  <DataCell value="Air" label="Mode" />
                </div>
                <div className="mt-8 flex items-center gap-3 border border-[#c9a84c]/30 bg-[#c9a84c]/[0.08] px-4 py-4 text-sm text-[#e7d18a]">
                  <ShieldCheck className="h-5 w-5" />
                  {bidClosed ? copy.choose : copy.hidden}
                </div>
              </div>
              <div className="grid gap-px bg-white/10 sm:grid-cols-3">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="relative min-h-[330px] bg-[#0d2044]/[0.72] p-6 backdrop-blur-lg transition-colors hover:bg-[#15305d]/[0.82] lg:p-8">
                    <div className="flex items-center justify-between text-xs text-[#8fa1bd]">
                      <span>QUOTE 0{index + 1}</span>
                      {bidClosed ? <BadgeCheck className="h-4 w-4 text-[#4fc29a]" /> : <LockKeyhole className="h-4 w-4" />}
                    </div>
                    <div className="grid min-h-[210px] place-items-center text-center">
                      {bidClosed ? (
                        <div>
                          <span className="text-xs uppercase text-[#8397b7]">HKD</span>
                          <strong className={`mt-2 block text-3xl font-medium ${index === 1 ? "text-[#f0d47f]" : "text-white"}`}>{["25,800", "24,600", "27,200"][index]}</strong>
                          <p className="mt-4 text-xs text-[#8fa1bd]">{index === 1 ? copy.lowest : copy.revealed}</p>
                        </div>
                      ) : (
                        <div>
                          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-white/15 bg-white/[0.04]"><LockKeyhole className="h-5 w-5 text-[#c9a84c]" /></span>
                          <strong className="mt-5 block text-sm font-medium">{copy.privateBid}</strong>
                          <p className="mt-2 text-xs text-[#8195b5]">{copy.submitted} · {copy.hidden}</p>
                        </div>
                      )}
                    </div>
                    {bidClosed && index === 1 ? <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#c9a84c] shadow-[0_0_18px_#c9a84c]" /> : null}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div data-story-glass className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border border-white/15 bg-white/10 shadow-[0_18px_60px_rgba(0,0,0,0.18)] backdrop-blur-xl lg:grid-cols-4">
            {copy.trustLabels.map((label, index) => {
              const Icon = [UserRoundCheck, Radar, FileCheck2, MessageSquareText][index]
              return <div key={label} className="flex items-center gap-3 bg-[#07142c]/70 px-5 py-5 text-xs text-[#c1cde0]"><Icon className="h-4 w-4 text-[#c9a84c]" />{label}</div>
            })}
          </div>
        </div>
      </section>

      <section id="start-lbid" className="relative min-h-[92vh] overflow-hidden bg-[#07142c] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/promo/f-0485.webp" alt="LBID cargo delivered to a modern warehouse" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,13,31,0.96)_0%,rgba(5,13,31,0.78)_44%,rgba(5,13,31,0.2)_100%)]" />
        <div className="relative mx-auto flex min-h-[92vh] max-w-[1440px] flex-col justify-between px-5 pb-8 pt-28 sm:px-9 lg:px-16 lg:pb-10 lg:pt-40">
          <div data-story-reveal className="max-w-3xl">
            <ChapterLabel dark>{copy.finalEyebrow}</ChapterLabel>
            <h2 className="mt-7 text-4xl font-medium leading-[1.08] md:text-6xl lg:text-7xl">{copy.finalTitle}</h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/70 lg:text-lg">{copy.finalIntro}</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => onOpenAuth("register")} className="inline-flex h-[52px] items-center justify-center gap-3 rounded-[4px] bg-[#c9a84c] px-7 text-sm font-semibold text-[#07142c] transition hover:-translate-y-0.5 hover:bg-[#dfc36e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                {copy.register}<ArrowRight className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => onOpenAuth("login")} className="inline-flex h-[52px] items-center justify-center rounded-[4px] border border-white/30 bg-white/[0.08] px-7 text-sm font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                {copy.login}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-5 border-t border-white/20 pt-7 text-[11px] uppercase text-white/55 sm:flex-row sm:items-center sm:justify-between">
            <span>{copy.footer}</span>
            <span>© 2026 LBID</span>
          </div>
        </div>
      </section>
    </div>
  )
}

function ChapterLabel({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return <span className={`inline-flex items-center gap-3 text-[11px] font-semibold uppercase ${dark ? "text-[#d7bc6d]" : "text-[#9a7520]"}`}><span className="h-px w-8 bg-current" />{children}</span>
}

function AudienceButton({ active, dark = false, onClick, children }: { active: boolean; dark?: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`min-h-10 flex-1 rounded-[4px] px-5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45b7d1] ${active ? dark ? "bg-white text-[#10254d]" : "bg-[#10254d] text-white" : dark ? "text-white/60 hover:text-white" : "text-[#66758c] hover:text-[#10254d]"}`}>{children}</button>
}

function ComparisonPanel({ title, items, tone }: { title: string; items: readonly string[]; tone: "old" | "new" }) {
  const positive = tone === "new"
  return (
    <div data-story-glass className={`min-h-[400px] rounded-[7px] border p-7 shadow-[0_24px_70px_rgba(55,57,70,0.1)] backdrop-blur-xl lg:p-12 ${positive ? "border-[#3f6b77]/50 bg-[linear-gradient(135deg,rgba(13,37,72,0.96),rgba(18,76,85,0.92))] text-white" : "border-white/80 bg-[#fff8f4]/75 text-[#10254d]"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase">{title}</h3>
        <span className={`grid h-10 w-10 place-items-center rounded-[5px] ${positive ? "bg-white/10" : "bg-[#efe6e0]"}`}>
          {positive ? <Sparkles className="h-5 w-5 text-[#d9bd65]" /> : <Route className="h-5 w-5 text-[#a07c72]" />}
        </span>
      </div>
      <div className="mt-20 space-y-0">
        {items.map((item, index) => (
          <div key={item} className={`flex items-center gap-4 border-t py-5 text-base ${positive ? "border-white/15 text-white/85" : "border-[#dbe2eb] text-[#68758c]"}`}>
            <span className={`grid h-7 w-7 place-items-center rounded-full border text-xs ${positive ? "border-[#c9a84c]/60 text-[#e1c772]" : "border-[#cfd7e2] text-[#8491a5]"}`}>{positive ? <Check className="h-3.5 w-3.5" /> : index + 1}</span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

function ClientWorkspacePreview({ locale }: { locale: Locale }) {
  const zh = locale === "zh"
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(145deg,#eef3f9,#f9fbfd)] p-5 sm:p-8 lg:p-12">
      <div className="relative overflow-hidden rounded-[8px] border border-[#cfd9e6] bg-white shadow-[0_24px_70px_rgba(39,73,118,0.15)]">
        <PreviewTopbar title={zh ? "建立貨運需求" : "Create shipment request"} />
        <div className="grid min-h-[500px] lg:grid-cols-[155px_1fr]">
          <div className="hidden border-r border-[#e3e8ef] bg-[#f8fafc] p-4 lg:block">
            {[zh ? "貨物資料" : "Cargo", zh ? "路線" : "Route", zh ? "服務" : "Services", zh ? "確認" : "Review"].map((item, index) => <div key={item} className={`mb-2 rounded-[4px] px-3 py-3 text-xs ${index === 1 ? "bg-[#10254d] text-white" : "text-[#758299]"}`}>0{index + 1} · {item}</div>)}
          </div>
          <div className="p-5 sm:p-7">
            <span className="text-[10px] font-semibold uppercase text-[#a17e22]">SGN → HKG</span>
            <h4 className="mt-3 text-xl font-semibold text-[#10254d]">{zh ? "路線及服務需要" : "Route and service needs"}</h4>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <PreviewField label={zh ? "出發地" : "Origin"} value="Ho Chi Minh City" />
              <PreviewField label={zh ? "目的地" : "Destination"} value="Hong Kong" />
              <PreviewField label={zh ? "運輸方式" : "Freight mode"} value={zh ? "空運" : "Air freight"} icon={<Plane className="h-4 w-4" />} />
              <PreviewField label={zh ? "預計出貨" : "Ship date"} value="26 Jul 2026" icon={<Clock3 className="h-4 w-4" />} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">{[zh ? "清關" : "Customs", zh ? "倉儲" : "Storage", zh ? "本地派送" : "Delivery"].map((item) => <span key={item} className="rounded-[4px] border border-[#d8e1ec] bg-[#f7f9fc] px-3 py-2 text-xs text-[#52617a]">{item}</span>)}</div>
            <button type="button" tabIndex={-1} className="mt-8 inline-flex h-11 items-center gap-2 rounded-[4px] bg-[#10254d] px-5 text-xs font-semibold text-white">{zh ? "繼續至貨物資料" : "Continue to cargo"}<ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ForwarderWorkspacePreview({ locale }: { locale: Locale }) {
  const zh = locale === "zh"
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(145deg,#edf2f8,#fbfcfe)] p-5 sm:p-8 lg:p-12">
      <div className="relative overflow-hidden rounded-[8px] border border-[#cfd9e6] bg-white shadow-[0_24px_70px_rgba(39,73,118,0.15)]">
        <PreviewTopbar title={zh ? "推薦貨運機會" : "Recommended opportunity"} />
        <div className="p-5 sm:p-8">
          <div className="flex flex-col gap-6 border-b border-[#e3e8ef] pb-7 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase text-[#a17e22]"><Sparkles className="h-3.5 w-3.5" />94% {zh ? "匹配" : "profile match"}</span>
              <h4 className="mt-4 text-2xl font-semibold text-[#10254d]">Ho Chi Minh City → Hong Kong</h4>
              <p className="mt-2 text-sm text-[#718097]">SGN · Air freight · 500 kg · 3 CBM</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-[4px] border border-[#d9e1ec] px-3 py-2 font-mono text-xs text-[#334866]"><Clock3 className="h-3.5 w-3.5" />01:42:18</span>
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            {[zh ? "運力符合 500 kg 空運" : "Capacity verified for 500 kg", zh ? "SGN → HKG 活躍路線" : "Active SGN → HKG route", zh ? "平均評分 4.9" : "4.9 average rating", zh ? "IATA 資格已驗證" : "IATA credentials verified"].map((item) => <div key={item} className="flex items-center gap-2 text-xs text-[#53627a]"><CheckCircle2 className="h-4 w-4 text-[#3f9c80]" />{item}</div>)}
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-[1fr_auto]">
            <div className="flex h-14 items-center rounded-[6px] border border-[#ccd7e5] px-4 text-[#9aa6b7]"><span className="mr-3 text-xs font-semibold text-[#596980]">HKD</span>0.00</div>
            <button type="button" tabIndex={-1} className="h-14 rounded-[6px] bg-[#10254d] px-6 text-xs font-semibold text-white">{zh ? "提交密封報價" : "Submit sealed quote"}</button>
          </div>
          <div className="mt-5 flex items-center gap-2 border border-[#dbe3ee] bg-[#f7f9fc] px-4 py-3 text-[11px] text-[#6f7d91]"><LockKeyhole className="h-4 w-4 text-[#a17e22]" />{zh ? "報價金額及公司身份會保持密封。" : "Your quote and identity remain sealed."}</div>
        </div>
      </div>
    </div>
  )
}

function PreviewTopbar({ title }: { title: string }) {
  return <div className="flex h-[52px] items-center justify-between border-b border-[#e3e8ef] px-5"><div className="flex items-center gap-2"><span className="grid h-6 w-6 place-items-center rounded-[4px] bg-[#10254d] text-[9px] font-bold text-white">LB</span><strong className="text-xs text-[#10254d]">LBID</strong></div><span className="text-[10px] text-[#7b879a]">{title}</span><span className="h-2 w-2 rounded-full bg-[#45ad8b]" /></div>
}

function PreviewField({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return <div><span className="text-[10px] font-semibold uppercase text-[#8a96a8]">{label}</span><div className="mt-2 flex h-11 items-center gap-2 rounded-[5px] border border-[#d7e0eb] bg-white px-3 text-xs font-medium text-[#30445f]">{icon}{value}</div></div>
}

function DataCell({ value, label }: { value: string; label: string }) {
  return <div className="bg-[#0d2044] px-4 py-4"><strong className="block text-sm font-medium">{value}</strong><span className="mt-1 block text-[9px] uppercase text-[#8195b5]">{label}</span></div>
}
