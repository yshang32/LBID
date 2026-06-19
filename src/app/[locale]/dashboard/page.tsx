import Link from "next/link"
import { ArrowRight, Clock3, Coins, FileText, Flame, PackagePlus, ShieldCheck, Star, TrendingUp, Users } from "lucide-react"

import { LiveDashboardPanel } from "@/components/dashboard/live-dashboard-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4Matches, v4ShipmentRequests, v4Status } from "@/lib/v4"

type DashboardRole = "agency" | "forwarder" | "admin"

const copy = {
  zh: {
    hello: "歡迎回來",
    hot: "即將截標",
    open: "可承接需求",
    matches: "進行中的配對",
    month: "本月概覽",
    bidNow: "提交報價 -1 Token",
    priority: "優先報價 -2 Token",
    remaining: "名額剩餘",
    score: "最低信譽分",
    budget: "預算等級",
    deadline: "截止時間",
    slotsUsed: "已用 bid slots",
    mode: "運輸模式",
    masked: "第一階段只顯示路線、貨物類型和預算範圍。中標後才解鎖聯絡資料，保持 sealed bid 公平性。",
    marketplace: "查看更多機會",
    stage: ["已配對", "已扣 Token", "聯絡解鎖", "履約中", "完成"],
    stats: [
      ["已建立 SR", "4"],
      ["收到報價", "6"],
      ["成功配對", "2"],
      ["信譽提升", "+10"],
    ],
    tokenBalance: "Token 餘額",
    latestActivity: "最新需求動態",
    platformWatchlist: "平台監察",
    whyTitle: "LBID 如何建立可信流程",
    paperTrail: "Quotation、AWB、文件、訊息和確認記錄保留在同一個 order workspace，方便追蹤責任。",
    reputationLoop: "完成訂單和好評會提升 directory 排名，讓真正有能力的 forwarder 得到更多曝光。",
    pendingForwarders: "待審 Forwarders",
    pendingPayments: "待確認付款",
    todayFlows: "今日流程",
    adminPriorities: "Admin 優先事項",
    adminText: "先處理付款確認與 forwarder verification，再擴大 marketplace 供應。",
    capabilityTitle: "公司能力模式",
    capabilityText: "LBID 以公司能力為核心，一間公司可以同時發出 SR 及承接 SR。你可以在 onboarding 開關 Client / Forwarder 能力。",
    manageCapability: "管理公司能力",
  },
  en: {
    hello: "Welcome back",
    hot: "Closing soon",
    open: "Open Shipment Requests",
    matches: "Active Matches",
    month: "Monthly Snapshot",
    bidNow: "Submit Bid -1 Token",
    priority: "Priority Bid -2 Tokens",
    remaining: "slots left",
    score: "Required score",
    budget: "Budget range",
    deadline: "Deadline",
    slotsUsed: "bid slots used",
    mode: "Mode",
    masked: "Stage 1 shows route, cargo category and ranges only. Full contacts unlock after award.",
    marketplace: "More opportunities",
    stage: ["Matched", "Token used", "Contact unlocked", "In trade", "Completed"],
    stats: [
      ["SR created", "4"],
      ["Bids received", "6"],
      ["Matches won", "2"],
      ["Score gained", "+10"],
    ],
    tokenBalance: "Token balance",
    latestActivity: "Latest SR activity",
    platformWatchlist: "Platform watchlist",
    whyTitle: "How LBID builds trust",
    paperTrail: "Quotation, AWB, documents, messages and confirmations stay inside the same order workspace for traceability.",
    reputationLoop: "Completed orders and strong reviews improve directory ranking, helping capable forwarders become more visible.",
    pendingForwarders: "Pending forwarders",
    pendingPayments: "Pending payments",
    todayFlows: "Today flows",
    adminPriorities: "Admin priorities",
    adminText: "Review payment confirmations and forwarder verification before expanding marketplace supply.",
    capabilityTitle: "Company capability model",
    capabilityText: "LBID is company-capability based. One company can create SRs and bid on SRs. Client / Forwarder capabilities can be managed in onboarding.",
    manageCapability: "Manage capabilities",
  },
}

const roleCopy = {
  agency: {
    badge: "Client Capability",
    zhSummary: "管理你發出的 Shipment Requests、收到的 sealed bids、已接受訂單和文件狀態。",
    enSummary: "Manage your shipment requests, received sealed bids, accepted orders and document status.",
    primaryHref: "inquiries/new",
    primaryLabelZh: "建立 SR",
    primaryLabelEn: "Create SR",
    secondaryHref: "quotations/compare",
    secondaryLabelZh: "比較報價",
    secondaryLabelEn: "Compare bids",
  },
  forwarder: {
    badge: "Forwarder Capability",
    zhSummary: "查看可投標 SR、Token 餘額、已提交報價和進行中訂單。",
    enSummary: "Review open SRs, token balance, submitted bids and active orders.",
    primaryHref: "marketplace",
    primaryLabelZh: "接單市場",
    primaryLabelEn: "Marketplace",
    secondaryHref: "tokens",
    secondaryLabelZh: "Token 錢包",
    secondaryLabelEn: "Token wallet",
  },
  admin: {
    badge: "Admin Workspace",
    zhSummary: "管理付款審批、forwarder verification、會員方案和平台數據。",
    enSummary: "Manage payment approvals, forwarder verification, tiers and platform analytics.",
    primaryHref: "admin/pending-payments",
    primaryLabelZh: "待確認付款",
    primaryLabelEn: "Pending payments",
    secondaryHref: "admin",
    secondaryLabelZh: "Admin panel",
    secondaryLabelEn: "Admin panel",
  },
}

export default function LocalizedDashboardPage({ params, searchParams }: { params: { locale: string }; searchParams?: { role?: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const prefix = `/${locale}`
  const role: DashboardRole = searchParams?.role === "agency" || searchParams?.role === "admin" ? searchParams.role : "forwarder"
  const current = roleCopy[role]
  const hotRequest = v4ShipmentRequests[0]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge variant="gold">{current.badge}</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-lblue sm:text-5xl">
              {locale === "zh" ? `${v4Status.companyName}，${t.hello}` : `${t.hello}, ${v4Status.companyName}`}
            </h1>
            <p className="mt-2 text-muted-foreground">{locale === "zh" ? current.zhSummary : current.enSummary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="gold">
              <Link href={`${prefix}/${current.primaryHref}`}>
                {locale === "zh" ? current.primaryLabelZh : current.primaryLabelEn} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`${prefix}/${current.secondaryHref}`}>
                {locale === "zh" ? current.secondaryLabelZh : current.secondaryLabelEn} <PackagePlus className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <LiveDashboardPanel locale={locale} role={role} />

      <section className="mt-5 rounded-lg border border-lgold/25 bg-[linear-gradient(135deg,rgba(201,168,76,0.12),rgba(255,255,255,0.95)_42%,rgba(53,141,166,0.08))] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-lblue">{t.capabilityTitle}</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">{t.capabilityText}</p>
          </div>
          <Button asChild variant="outline">
            <Link href={`${prefix}/onboarding`}>{t.manageCapability}</Link>
          </Button>
        </div>
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="border-red-200 bg-white">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-red-600">
                <Flame className="h-4 w-4" />
                {t.hot}
              </div>
              <CardTitle className="mt-2 text-2xl">{role === "agency" ? t.latestActivity : role === "admin" ? t.platformWatchlist : hotRequest.lane}</CardTitle>
            </div>
            <Badge variant="gold">{hotRequest.id}</Badge>
          </CardHeader>
          <CardContent>
            {role === "admin" ? <AdminSnapshot locale={locale} /> : <ShipmentRequestCard request={hotRequest} locale={locale} primary />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.month}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {t.stats.map(([label, value]) => (
              <div key={label} className="rounded-md border border-lblue/10 bg-slate-50 p-4">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="mt-1 text-3xl font-black text-lblue">{value}</div>
              </div>
            ))}
            <div className="col-span-2 rounded-md border border-lgold/25 bg-lgold/10 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#6f5514]">
                <Coins className="h-4 w-4" />
                {t.tokenBalance}
              </div>
              <div className="mt-1 text-3xl font-black text-lblue">{v4Status.tokens}</div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-lblue">{role === "agency" ? "My Shipment Requests" : role === "admin" ? "Admin queue" : t.open}</h2>
          <Button asChild variant="outline" size="sm">
            <Link href={`${prefix}/marketplace`}>{t.marketplace}</Link>
          </Button>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {role === "admin" ? (
            <>
              <QueueCard title="Forwarder verification" value="8 pending" href={`${prefix}/admin`} />
              <QueueCard title="Manual payment review" value="3 pending" href={`${prefix}/admin/pending-payments`} />
            </>
          ) : v4ShipmentRequests.slice(1).map((request) => (
            <ShipmentRequestCard key={request.id} request={request} locale={locale} />
          ))}
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.matches}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {v4Matches.map((match) => (
              <Link key={match.id} href={`${prefix}/matches/${match.id}`} className="block rounded-lg border border-lblue/10 bg-white p-4 transition hover:border-lgold/40 hover:bg-lgold/10">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-black text-lblue">{match.title}</div>
                    <div className="text-sm text-muted-foreground">{match.route}</div>
                  </div>
                  <Badge variant="teal">{match.status}</Badge>
                </div>
                <ProgressSteps labels={t.stage} active={match.stage} />
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.whyTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ValueRow icon={ShieldCheck} title="Progressive disclosure" text={t.masked} />
            <ValueRow icon={FileText} title="Paper trail" text={t.paperTrail} />
            <ValueRow icon={TrendingUp} title="Reputation loop" text={t.reputationLoop} />
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function ShipmentRequestCard({ request, locale, primary = false }: { request: typeof v4ShipmentRequests[number]; locale: Locale; primary?: boolean }) {
  const t = copy[locale]
  const filled = Math.round((request.usedSlots / request.totalSlots) * 100)
  const remaining = request.totalSlots - request.usedSlots
  const detailHref = `/${locale}/marketplace/${request.id}`

  return (
    <div className={`rounded-lg border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(27,43,94,0.09)] ${primary ? "border-red-200" : "border-lblue/10"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="font-mono text-xs font-bold text-muted-foreground">{request.flags}</div>
          <h3 className="mt-1 text-xl font-black text-lblue">{locale === "zh" ? request.lane : request.laneEn}</h3>
          <div className="mt-1 text-sm text-muted-foreground">{request.cargo}</div>
        </div>
        <div className="rounded-md bg-red-50 px-3 py-2 text-right text-red-700">
          <div className="flex items-center justify-end gap-1 text-xs font-bold uppercase">
            <Clock3 className="h-3 w-3" />
            {t.deadline}
          </div>
          <div className="font-mono text-lg font-black">{request.deadline}</div>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>{request.usedSlots}/{request.totalSlots} {t.slotsUsed}</span>
          <span className={remaining <= 2 ? "text-red-600" : "text-lblue"}>{remaining} {t.remaining}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${remaining <= 2 ? "bg-red-600" : "bg-lgold"}`} style={{ width: `${filled}%` }} />
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <Info icon={Star} label={t.score} value={`>= ${request.reputationRequired}`} />
        <Info icon={Users} label={t.budget} value={request.budgetLevel} />
        <Info icon={ShieldCheck} label={t.mode} value={request.mode} />
      </div>

      <p className="mt-3 rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm text-muted-foreground">{request.routeMask}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild variant="gold">
          <Link href={detailHref}>{t.bidNow}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={detailHref}>{t.priority}</Link>
        </Button>
      </div>
    </div>
  )
}

function Info({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-white p-3">
      <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
        <Icon className="h-3 w-3 text-lgold" />
        {label}
      </div>
      <div className="mt-1 font-black text-lblue">{value}</div>
    </div>
  )
}

function ProgressSteps({ labels, active }: { labels: string[]; active: number }) {
  return (
    <div className="mt-4 grid grid-cols-5 gap-1">
      {labels.map((label, index) => {
        const done = index < active
        const current = index === active
        return (
          <div key={label} className="text-center">
            <div className={`mx-auto h-3 w-full rounded-full ${done ? "bg-green-600" : current ? "bg-lgold" : "bg-slate-200"}`} />
            <div className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</div>
          </div>
        )
      })}
    </div>
  )
}

function ValueRow({ icon: Icon, title, text }: { icon: typeof ShieldCheck; title: string; text: string }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-slate-50 p-3">
      <div className="flex items-center gap-2 font-black text-lblue">
        <Icon className="h-4 w-4 text-lgold" />
        {title}
      </div>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  )
}

function AdminSnapshot({ locale }: { locale: Locale }) {
  const t = copy[locale]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Info icon={Users} label={t.pendingForwarders} value="8" />
      <Info icon={Coins} label={t.pendingPayments} value="3" />
      <Info icon={TrendingUp} label={t.todayFlows} value="12" />
      <div className="rounded-md border border-lblue/10 bg-slate-50 p-3 sm:col-span-3">
        <div className="font-black text-lblue">{t.adminPriorities}</div>
        <p className="mt-1 text-sm text-muted-foreground">{t.adminText}</p>
      </div>
    </div>
  )
}

function QueueCard({ title, value, href }: { title: string; value: string; href: string }) {
  return (
    <Link href={href} className="rounded-lg border border-lblue/10 bg-white p-4 shadow-sm transition hover:border-lgold/40 hover:bg-lgold/10">
      <div className="text-sm text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-black text-lblue">{value}</div>
    </Link>
  )
}
