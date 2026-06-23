"use client"

import { useState, type ReactNode } from "react"
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  Gauge,
  LayoutDashboard,
  LockKeyhole,
  MessageSquare,
  PackageCheck,
  Radar,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
  WalletCards,
} from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { isLocale, type Locale } from "@/lib/i18n"

type View = "dashboard" | "market" | "bid" | "compare" | "order" | "admin"

const views: { id: View; icon: typeof LayoutDashboard; zh: string; en: string }[] = [
  { id: "dashboard", icon: LayoutDashboard, zh: "\u5de5\u4f5c\u53f0", en: "Workspace" },
  { id: "market", icon: Radar, zh: "\u63a5\u55ae\u5e02\u5834", en: "Marketplace" },
  { id: "compare", icon: ReceiptText, zh: "\u5831\u50f9\u6bd4\u8f03", en: "Compare quotes" },
  { id: "order", icon: PackageCheck, zh: "\u8a02\u55ae\u4ea4\u4ed8", en: "Order delivery" },
  { id: "admin", icon: ShieldCheck, zh: "\u5e73\u53f0\u71df\u904b", en: "Admin operations" },
]

export function FullProductPreview({ locale: rawLocale }: { locale: string }) {
  const locale: Locale = isLocale(rawLocale) ? rawLocale : "en"
  const zh = locale === "zh"
  const [view, setView] = useState<View>("dashboard")
  const [marketTab, setMarketTab] = useState<"recommended" | "market">("recommended")
  const [bidSealed, setBidSealed] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const labels = {
    preview: "FULL PRODUCT PREVIEW",
    company: "HarbourLink Cargo",
    membership: zh ? "Premium \u6703\u54e1" : "Premium member",
    title: zh ? "\u5b8c\u6574\u4ea4\u6613\u6d41\u7a0b\u9810\u89bd" : "Full workflow preview",
    subtitle: zh ? "\u9019\u662f\u4e00\u500b\u53ef\u4ea4\u4e92\u7684\u7522\u54c1\u6a21\u64ec\uff1a\u4e0d\u5beb\u5165\u771f\u5be6\u8cc7\u6599\uff0c\u53ea\u7528\u4f86\u8a0e\u8ad6\u6d41\u7a0b\u3001\u756b\u9762\u8207\u5546\u696d\u908f\u8f2f\u3002" : "An interactive product simulation for reviewing the flow, interface and commercial rules. No live data is changed.",
  }

  return <main className="preview-app min-h-screen">
    <header className="preview-topbar">
      <BrandMark markClassName="h-9 w-[138px]" />
      <div className="preview-topbar-center"><Badge variant="gold">{labels.preview}</Badge><span>{labels.subtitle}</span></div>
      <div className="preview-account"><Bell className="h-4 w-4" /><span className="preview-avatar">HC</span><div><strong>{labels.company}</strong><small>{labels.membership}</small></div></div>
    </header>
    <div className="preview-layout">
      <aside className="preview-sidebar">
        <p className="preview-side-label">WORKFLOW</p>
        {views.map((item) => <button key={item.id} className={view === item.id || (view === "bid" && item.id === "market") ? "preview-nav-active" : ""} onClick={() => setView(item.id)}><item.icon className="h-4 w-4" />{zh ? item.zh : item.en}<ChevronRight className="ml-auto h-4 w-4 opacity-40" /></button>)}
        <div className="preview-sidebar-footer"><Badge variant="teal"><CheckCircle2 className="mr-1 h-3 w-3" />{zh ? "\u5df2\u767b\u5165" : "Signed in"}</Badge><p>{zh ? "\u516c\u53f8\u53ef\u540c\u6642\u767c\u5e03\u9700\u6c42\u548c\u63d0\u4ea4\u5831\u50f9\u3002" : "One company can request and bid."}</p></div>
      </aside>
      <section className="preview-content">
        <div className="preview-page-heading"><div><p>{labels.preview}</p><h1>{labels.title}</h1></div><Badge variant="secondary">{zh ? "\u6a21\u64ec\u5e33\u6236" : "Simulation account"}</Badge></div>
        {view === "dashboard" ? <WorkspaceView zh={zh} openMarket={() => setView("market")} /> : null}
        {view === "market" ? <MarketView zh={zh} tab={marketTab} setTab={setMarketTab} enterBid={() => setView("bid")} /> : null}
        {view === "bid" ? <BidView zh={zh} sealed={bidSealed} seal={() => setBidSealed(true)} back={() => setView("market")} /> : null}
        {view === "compare" ? <ComparisonView zh={zh} accepted={accepted} accept={() => setAccepted(true)} openOrder={() => setView("order")} /> : null}
        {view === "order" ? <OrderView zh={zh} /> : null}
        {view === "admin" ? <AdminView zh={zh} /> : null}
      </section>
    </div>
  </main>
}

function WorkspaceView({ zh, openMarket }: { zh: boolean; openMarket: () => void }) {
  return <div className="space-y-5">
    <section className="preview-hero"><div><Badge variant="gold">COMPANY WORKSPACE</Badge><h2>{zh ? "\u4f60\u73fe\u5728\u6700\u9700\u8981\u8655\u7406\u4ec0\u9ebc\uff1f" : "What needs your attention now?"}</h2><p>{zh ? "\u7cfb\u7d71\u5c07\u5373\u5c07\u95dc\u9589\u7684\u63a8\u85a6\u4efb\u52d9\u3001\u6b63\u5728\u7af6\u50f9\u7684\u9700\u6c42\u548c\u7f3a\u4ef6\u8a02\u55ae\u6392\u5728\u6700\u524d\u9762\u3002" : "Urgent matched opportunities, bid windows and incomplete orders come to the front."}</p><Button variant="gold" onClick={openMarket}><Radar className="h-4 w-4" />{zh ? "\u67e5\u770b\u63a8\u85a6\u4efb\u52d9" : "Review recommended mission"}</Button></div><div className="preview-hero-orbit"><Target className="h-9 w-9" /><strong>94%</strong><small>PROFILE MATCH</small></div></section>
    <section className="grid gap-3 md:grid-cols-3"><Metric icon={<Sparkles className="h-5 w-5" />} label={zh ? "\u63a8\u85a6\u4efb\u52d9" : "Recommended"} value="2" note={zh ? "1 \u500b\u4e8e 14 \u5206\u9418\u5f8c\u95dc\u9589" : "1 closes in 14 min"} /><Metric icon={<ReceiptText className="h-5 w-5" />} label={zh ? "\u5f85\u9078\u5831\u50f9" : "Quotes to choose"} value="3" note={zh ? "SR-HK-204 \u5df2\u622a\u6a19" : "SR-HK-204 has closed"} /><Metric icon={<FileCheck2 className="h-5 w-5" />} label={zh ? "\u6587\u4ef6\u8ddf\u9032" : "Document action"} value="1" note={zh ? "\u7f3a Packing List" : "Packing List missing"} /></section>
    <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]"><Card className="preview-priority-card"><CardContent className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="preview-eyebrow">PUSHED TO YOU</p><h3>{zh ? "\u8d8a\u5357 \u2192 \u9999\u6e2f\u7a7a\u904b\u9700\u6c42" : "Vietnam to Hong Kong air freight"}</h3><p>{zh ? "\u8def\u7dda\u3001\u6e05\u95dc\u8207\u672c\u5730\u6d3e\u9001\u80fd\u529b\u90fd\u8207\u516c\u53f8\u6a94\u6848\u547d\u4e2d\u3002" : "Route, customs and local delivery all match your profile."}</p></div><div className="preview-timer"><Clock3 className="h-4 w-4" /><strong>00:14:28</strong><small>FINAL WINDOW</small></div></div><div className="preview-reasons"><span><CheckCircle2 />{zh ? "\u8d8a\u5357 \u2192 \u9999\u6e2f\u8986\u84cb\u547d\u4e2d" : "Vietnam to Hong Kong coverage"}</span><span><CheckCircle2 />{zh ? "\u7a7a\u904b\u3001\u6e05\u95dc\u3001\u6d3e\u9001\u80fd\u529b\u547d\u4e2d" : "Air, customs, delivery capability"}</span></div></CardContent></Card><Card><CardContent className="p-6"><p className="preview-eyebrow">ORDER WATCH</p><h3 className="mt-2 font-semibold text-lblue">HL-10048</h3><p className="mt-2 text-sm text-slate-600">Hong Kong \u2192 Manila</p><div className="mt-5 space-y-3"><Progress label={zh ? "\u5df2\u78ba\u8a8d" : "Confirmed"} done /><Progress label={zh ? "\u8a02\u8259\u5b8c\u6210" : "Shipment booked"} done /><Progress label={zh ? "\u7b49\u5f85 Packing List" : "Awaiting Packing List"} /></div></CardContent></Card></section>
  </div>
}

function MarketView({ zh, tab, setTab, enterBid }: { zh: boolean; tab: "recommended" | "market"; setTab: (value: "recommended" | "market") => void; enterBid: () => void }) {
  const recommended = tab === "recommended"
  return <div><div className="preview-tabbar"><button className={recommended ? "active" : ""} onClick={() => setTab("recommended")}><Sparkles className="h-4 w-4" />{zh ? "\u7cfb\u7d71\u63a8\u85a6" : "Recommended for you"}<strong>2</strong></button><button className={!recommended ? "active" : ""} onClick={() => setTab("market")}><Radar className="h-4 w-4" />{zh ? "\u5168\u90e8\u5e02\u5834" : "All marketplace"}<strong>8</strong></button></div><section className="mt-5 grid gap-4 lg:grid-cols-2"><MissionCard zh={zh} recommended={recommended} enterBid={enterBid} route="Ho Chi Minh City \u2192 Hong Kong" cargo={zh ? "\u96fb\u5b50\u96f6\u4ef6 \u00b7 500 kg \u00b7 3 CBM" : "Electronic components · 500 kg · 3 CBM"} /><MissionCard zh={zh} recommended={recommended} enterBid={enterBid} route="Kuala Lumpur \u2192 Hong Kong" cargo={zh ? "\u6d88\u8cbb\u54c1 \u00b7 800 kg \u00b7 5 CBM" : "Consumer goods · 800 kg · 5 CBM"} /></section><Card className="mt-5"><CardContent className="flex flex-wrap items-center gap-3 p-5 text-sm text-slate-600"><LockKeyhole className="h-5 w-5 text-lgold" />{zh ? "\u63a8\u85a6\u4e0d\u7b49\u65bc\u7368\u5bb6\u3002\u6240\u6709\u5408\u8cc7\u683c\u516c\u53f8\u4ecd\u53ef\u4ee5\u5728\u958b\u653e\u5e02\u5834\u53c3\u8207\u5bc6\u5c01\u7af6\u50f9\u3002" : "Recommended does not mean exclusive. Qualified companies can still participate through the open marketplace."}</CardContent></Card></div>
}

function MissionCard({ zh, recommended, enterBid, route, cargo }: { zh: boolean; recommended: boolean; enterBid: () => void; route: string; cargo: string }) { return <Card className={recommended ? "preview-mission recommended" : "preview-mission"}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><div className="flex gap-2"><Badge variant={recommended ? "gold" : "secondary"}>{recommended ? "PUSHED TO YOU" : "SEALED BID"}</Badge><Badge variant="teal">BIDDING OPEN</Badge></div><h2>{route}</h2><p>{cargo}</p></div><div className="preview-card-time">00:42:17</div></div>{recommended ? <div className="preview-mini-match"><Target className="h-4 w-4" /><span>PROFILE MATCH 94%</span><small>{zh ? "\u8def\u7dda\u8207\u670d\u52d9\u80fd\u529b\u547d\u4e2d" : "Route and capabilities match"}</small></div> : null}<Button className="mt-5" variant="gold" onClick={enterBid}><Radar className="h-4 w-4" />{zh ? "\u9032\u5165 Bid Mode" : "Enter Bid Mode"}<ArrowRight className="h-4 w-4" /></Button></CardContent></Card> }

function BidView({ zh, sealed, seal, back }: { zh: boolean; sealed: boolean; seal: () => void; back: () => void }) { return <div><Button variant="ghost" onClick={back}>{zh ? "\u8fd4\u56de\u5e02\u5834" : "Back to marketplace"}</Button><section className="preview-bid-mission"><div><div className="flex gap-2"><Badge variant="gold">PUSHED TO YOU</Badge><Badge variant="teal">BIDDING OPEN</Badge><Badge variant="secondary">FINAL WINDOW</Badge></div><p className="preview-eyebrow mt-5">MATCHED FOR YOUR COMPANY</p><h2>{zh ? "\u9019\u500b\u9700\u6c42\uff0c\u6b63\u662f\u4f60\u7684\u8def\u7dda\u3002" : "This is a route built for your network."}</h2><p>{zh ? "\u7cfb\u7d71\u4f9d\u64da\u516c\u53f8\u6db5\u84cb\u7bc4\u570d\u8207\u670d\u52d9\u80fd\u529b\u4e3b\u52d5\u63a8\u9001\u3002" : "LBID pushed this request based on your coverage and service capability."}</p></div><div className="preview-bid-clock"><small>FINAL WINDOW</small><strong>00:14:28</strong></div></section><section className="mt-5 grid gap-5 lg:grid-cols-[1fr_390px]"><Card><CardContent className="p-6"><p className="preview-eyebrow">WHY THIS MATCH</p><div className="mt-4 space-y-3"><Reason zh={zh} text={zh ? "\u8d8a\u5357 \u2192 \u9999\u6e2f\u7dda\u8def\u8207\u4f60\u7684\u8986\u84cb\u7bc4\u570d\u76f8\u7b26" : "Vietnam to Hong Kong coverage matched"} /><Reason zh={zh} text={zh ? "\u7a7a\u904b\u3001\u6e05\u95dc\u548c\u672c\u5730\u6d3e\u9001\u547d\u4e2d" : "Air, customs and local delivery matched"} /><Reason zh={zh} text={zh ? "\u5bc6\u5c01\u7af6\u50f9\u4e2d\uff0c\u4f60\u53ea\u53ef\u63d0\u4ea4\u4e00\u6b21" : "One sealed submission only"} /></div></CardContent></Card><Card className="border-lgold/50"><CardContent className="p-6">{sealed ? <div className="preview-sealed"><CheckCircle2 /><h3>{zh ? "\u5831\u50f9\u5df2\u5c01\u5b58" : "Bid sealed"}</h3><p>{zh ? "\u5c0d\u624b\u5728\u7a97\u53e3\u95dc\u9589\u524d\u7121\u6cd5\u770b\u5230\u4f60\u7684\u50f9\u683c\u8207\u689d\u6b3e\u3002" : "Competitors cannot see your price or terms before closure."}</p></div> : <><p className="preview-eyebrow">QUOTE CONSOLE</p><label>{zh ? "\u5831\u50f9\u91d1\u984d (HKD)" : "Bid amount (HKD)"}<Input defaultValue="12,800" /></label><label>{zh ? "\u9810\u8a08\u904b\u8f38\u6642\u9593" : "Estimated transit time"}<Input defaultValue={zh ? "3 \u81f3 5 \u5929" : "3 to 5 days"} /></label><Button className="mt-5 w-full" variant="gold" onClick={seal}><LockKeyhole className="h-4 w-4" />{zh ? "\u78ba\u8a8d\u5c01\u5b58\u5831\u50f9" : "Seal and transmit quote"}</Button><p className="mt-3 text-xs text-slate-500">{zh ? "\u793a\u7bc4\u6a21\u5f0f\uff0c\u4e0d\u6703\u6263\u9664 Token" : "Preview only. No Token is used."}</p></>}</CardContent></Card></section></div> }

function ComparisonView({ zh, accepted, accept, openOrder }: { zh: boolean; accepted: boolean; accept: () => void; openOrder: () => void }) { return <div><section className="preview-compare-heading"><div><Badge variant="gold">BID WINDOW CLOSED</Badge><h2>{zh ? "\u4e09\u4efd\u5831\u50f9\u5df2\u6e96\u5099\u597d\u4f9b\u4f60\u9078\u64c7" : "Three quotes are ready for your decision"}</h2><p>{zh ? "\u6700\u4f4e\u50f9\u6703\u88ab\u6a19\u793a\uff0c\u4f46\u4f60\u4ecd\u53ef\u4ee5\u6309\u4fe1\u8b7d\u3001\u904b\u8f38\u6642\u9593\u8207\u670d\u52d9\u4f86\u9078\u64c7\u3002" : "The lowest quote is highlighted, but you can choose on trust, transit time and fit."}</p></div><Badge variant="teal">HYBRID AWARD</Badge></section><section className="mt-5 grid gap-4 lg:grid-cols-3"><QuoteCard name="HarbourLink Cargo" price="HKD 12,800" transit={zh ? "3\u20135 \u5929" : "3–5 days"} recommended zh={zh} accept={accept} /><QuoteCard name="Victoria Freight" price="HKD 12,150" transit={zh ? "5\u20137 \u5929" : "5–7 days"} lowest zh={zh} accept={accept} /><QuoteCard name="Gateway Logistics" price="HKD 13,420" transit={zh ? "2\u20134 \u5929" : "2–4 days"} zh={zh} accept={accept} /></section>{accepted ? <section className="preview-accepted mt-5"><CheckCircle2 /><div><strong>{zh ? "\u5df2\u5efa\u7acb\u8a02\u55ae\u8207 Match Record" : "Order and Match Record created"}</strong><p>{zh ? "\u96d9\u65b9\u73fe\u5728\u53ef\u89e3\u9396\u806f\u7d61\u8cc7\u6599\u3001\u6587\u4ef6\u8207\u7acb\u5373\u6e9d\u901a\u3002" : "Both parties can now unlock contacts, documents and messaging."}</p></div><Button variant="gold" onClick={openOrder}>{zh ? "\u958b\u555f\u8a02\u55ae" : "Open order"}<ArrowRight className="h-4 w-4" /></Button></section> : null}</div> }

function QuoteCard({ name, price, transit, recommended, lowest, zh, accept }: { name: string; price: string; transit: string; recommended?: boolean; lowest?: boolean; zh: boolean; accept: () => void }) { return <Card className={lowest ? "preview-quote-lowest" : ""}><CardContent className="p-5"><div className="flex flex-wrap gap-2">{lowest ? <Badge variant="teal">{zh ? "\u6700\u4f4e\u5831\u50f9" : "Lowest quote"}</Badge> : null}{recommended ? <Badge variant="gold">{zh ? "\u5339\u914d\u63a8\u85a6" : "Profile fit"}</Badge> : null}</div><h3 className="mt-4 font-semibold text-lblue">{name}</h3><p className="mt-5 text-2xl font-semibold text-lblue">{price}</p><p className="mt-1 text-sm text-slate-500">{transit}</p><div className="mt-5 space-y-2 text-sm text-slate-600"><p><CheckCircle2 />{zh ? "\u6e05\u95dc\u8207\u672c\u5730\u6d3e\u9001\u5df2\u5305\u62ec" : "Customs and local delivery included"}</p><p><CheckCircle2 />{zh ? "\u5df2\u9a57\u8b49\u516c\u53f8\u6a94\u6848" : "Verified company profile"}</p></div><Button className="mt-6 w-full" variant={recommended ? "gold" : "outline"} onClick={accept}>{zh ? "\u9078\u64c7\u9019\u4efd\u5831\u50f9" : "Choose this quote"}</Button></CardContent></Card> }

function OrderView({ zh }: { zh: boolean }) { return <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><Card><CardContent className="p-6"><Badge variant="teal">ORDER HL-10048</Badge><h2 className="mt-3 text-2xl font-semibold text-lblue">Hong Kong \u2192 Manila</h2><div className="mt-7 space-y-5"><Progress label={zh ? "\u5f97\u6a19\u5df2\u78ba\u8a8d" : "Bid accepted"} done /><Progress label={zh ? "\u5df2\u5b8c\u6210\u8a02\u8259" : "Shipment booked"} done /><Progress label={zh ? "\u904b\u8f38\u4e2d" : "In transit"} active /><Progress label={zh ? "\u5df2\u62b5\u6e2f" : "Arrived Hong Kong"} /><Progress label={zh ? "\u5b8c\u6210\u6e05\u95dc" : "Customs cleared"} /><Progress label={zh ? "\u5df2\u6d3e\u9001" : "Delivered"} /></div></CardContent></Card><div className="space-y-5"><Card><CardContent className="p-6"><p className="preview-eyebrow">DOCUMENT CHECKLIST</p><Checklist icon={<FileText />} text="AWB" done /><Checklist icon={<FileCheck2 />} text="Commercial Invoice" done /><Checklist icon={<FileText />} text="Packing List" urgent /></CardContent></Card><Card><CardContent className="p-6"><div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-lgold" /><h3 className="font-semibold text-lblue">{zh ? "\u8a02\u55ae\u8a0a\u606f" : "Order messages"}</h3></div><div className="preview-message mt-4">{zh ? "Packing List \u6703\u65bc\u4eca\u65e5\u4e0b\u5348\u4e0a\u50b3\u3002" : "Packing List will be uploaded this afternoon."}</div><Input className="mt-3" placeholder={zh ? "\u8f38\u5165\u8a0a\u606f..." : "Write a message..."} /></CardContent></Card></div></div> }

function AdminView({ zh }: { zh: boolean }) { return <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]"><Card><CardContent className="p-6"><div className="flex items-center justify-between"><div><p className="preview-eyebrow">REVIEW QUEUE</p><h2 className="mt-1 text-xl font-semibold text-lblue">{zh ? "\u5f85\u5be9\u6838 Shipment Request" : "Shipment Request review queue"}</h2></div><Badge variant="gold">3 PENDING</Badge></div><div className="mt-6 space-y-3"><AdminRow route="Jakarta \u2192 Hong Kong" detail={zh ? "\u6d77\u904b \u00b7 2.4 CBM \u00b7 \u9700\u6e05\u95dc" : "Sea freight · 2.4 CBM · customs needed"} /><AdminRow route="Bangkok \u2192 Hong Kong" detail={zh ? "\u7a7a\u904b \u00b7 320 kg \u00b7 \u9700\u6d3e\u9001" : "Air freight · 320 kg · delivery needed"} /></div></CardContent></Card><Card><CardContent className="p-6"><p className="preview-eyebrow">PLATFORM HEALTH</p><div className="mt-5 grid grid-cols-2 gap-3"><Metric icon={<UsersRound className="h-5 w-5" />} label={zh ? "\u5df2\u9a57\u8b49 Forwarder" : "Verified forwarders"} value="26" /><Metric icon={<Gauge className="h-5 w-5" />} label={zh ? "\u5e73\u5747\u56de\u61c9" : "Avg. response"} value="18m" /><Metric icon={<Activity className="h-5 w-5" />} label={zh ? "\u9032\u884c\u4e2d SR" : "Open SRs"} value="8" /><Metric icon={<WalletCards className="h-5 w-5" />} label={zh ? "\u5f85\u78ba\u8a8d\u4ed8\u6b3e" : "Pending payments"} value="2" /></div></CardContent></Card></div> }

function Metric({ icon, label, value, note }: { icon: ReactNode; label: string; value: string; note?: string }) { return <Card><CardContent className="p-4"><div className="text-lgold">{icon}</div><p className="mt-3 text-sm text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold text-lblue">{value}</p>{note ? <p className="mt-1 text-xs text-slate-500">{note}</p> : null}</CardContent></Card> }
function Progress({ label, done, active }: { label: string; done?: boolean; active?: boolean }) { return <div className="flex items-center gap-3"><span className={done ? "preview-step done" : active ? "preview-step active" : "preview-step"}>{done ? <CheckCircle2 /> : <span />}</span><p className={done || active ? "font-medium text-lblue" : "text-slate-400"}>{label}</p></div> }
function Reason({ text }: { zh: boolean; text: string }) { return <div className="preview-reason"><CheckCircle2 className="h-4 w-4" />{text}</div> }
function Checklist({ icon, text, done, urgent }: { icon: ReactNode; text: string; done?: boolean; urgent?: boolean }) { return <div className={`preview-check ${urgent ? "urgent" : ""}`}>{icon}<span>{text}</span><strong>{done ? "READY" : urgent ? "ACTION" : "PENDING"}</strong></div> }
function AdminRow({ route, detail }: { route: string; detail: string }) { return <div className="preview-admin-row"><div><strong>{route}</strong><p>{detail}</p></div><Button size="sm" variant="gold">Review</Button></div> }
