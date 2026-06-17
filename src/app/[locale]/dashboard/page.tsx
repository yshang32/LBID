import Link from "next/link"
import { ArrowRight, Clock3, Coins, FileText, Flame, PackagePlus, ShieldCheck, Star, TrendingUp, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LiveDashboardPanel } from "@/components/dashboard/live-dashboard-panel"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4Matches, v4ShipmentRequests, v4Status } from "@/lib/v4"

type DashboardRole = "agency" | "forwarder" | "admin"

const copy = {
  zh: {
    hello: "今日工作台",
    summary: "你今日有 3 個接單機會 + 2 個交易進行中",
    hot: "即將截標",
    open: "可接單 Request",
    matches: "進行中 Matches",
    month: "本月概況",
    bidNow: "立即 Bid -1 Token",
    priority: "Priority Bid -2 Tokens",
    remaining: "剩餘名額",
    score: "信譽要求",
    budget: "預算範圍",
    deadline: "截標倒數",
    slotsUsed: "已用名額",
    mode: "運輸方式",
    masked: "階段 1 顯示：路線、貨類、範圍資料；中標後先解鎖完整聯絡。",
    view: "查看",
    createSr: "建立新 SR",
    marketplace: "更多接單機會",
    stage: ["配對成立", "報價已扣", "資料解鎖", "交易中", "完成"],
    stats: [
      ["發出 SR", "4"],
      ["Bid 次數", "6"],
      ["成功配對", "2"],
      ["信譽分 +", "10"],
    ],
  },
  en: {
    hello: "Welcome back",
    summary: "You have 3 bid opportunities and 2 active matches today",
    hot: "Closing soon",
    open: "Open Requests",
    matches: "Active Matches",
    month: "Monthly Snapshot",
    bidNow: "Bid Now -1 Token",
    priority: "Priority Bid -2 Tokens",
    remaining: "slots left",
    score: "Required score",
    budget: "Budget range",
    deadline: "Deadline",
    slotsUsed: "bid slots used",
    mode: "Mode",
    masked: "Stage 1 shows route, cargo category and ranges only. Full contacts unlock after award.",
    view: "View",
    createSr: "Create SR",
    marketplace: "More opportunities",
    stage: ["Matched", "Token used", "Contact unlocked", "In trade", "Completed"],
    stats: [
      ["SR created", "4"],
      ["Bids submitted", "6"],
      ["Matches won", "2"],
      ["Score gained", "10"],
    ],
  },
}

const roleCopy = {
  agency: {
    badge: "Agency Workspace",
    zhSummary: "管理你發出嘅 SR、收到嘅 sealed bids、已接受訂單同文件狀態。",
    enSummary: "Manage your SRs, received sealed bids, accepted orders and document status.",
    primaryHref: "inquiries/new",
    primaryLabelZh: "建立新 SR",
    primaryLabelEn: "Create SR",
    secondaryHref: "quotations/compare",
    secondaryLabelZh: "比較報價",
    secondaryLabelEn: "Compare bids",
  },
  forwarder: {
    badge: "Forwarder Workspace",
    zhSummary: "查看可投標 SR、token balance、已提交 bids 同進行中 orders。",
    enSummary: "Review open SRs, token balance, submitted bids and active orders.",
    primaryHref: "marketplace",
    primaryLabelZh: "接單市場",
    primaryLabelEn: "Marketplace",
    secondaryHref: "tokens",
    secondaryLabelZh: "Token wallet",
    secondaryLabelEn: "Token wallet",
  },
  admin: {
    badge: "Admin Workspace",
    zhSummary: "管理 payment approval、forwarder verification、tiers 同平台 analytics。",
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
              {locale === "zh" ? `${v4Status.companyName} ${t.hello}` : `${t.hello}, ${v4Status.companyName}`}
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

      <section className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <Card className="border-red-200 bg-white">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.12em] text-red-600">
                <Flame className="h-4 w-4" />
                {t.hot}
              </div>
              <CardTitle className="mt-2 text-2xl">{role === "agency" ? "Latest SR activity" : role === "admin" ? "Platform watchlist" : hotRequest.lane}</CardTitle>
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
                Token 餘額
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
            <CardTitle>Why LBID keeps value inside</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ValueRow icon={ShieldCheck} title="Progressive disclosure" text={t.masked} />
            <ValueRow icon={FileText} title="Paper trail" text="Quotation、AWB、文件和評分留在平台，方便日後追蹤責任。" />
            <ValueRow icon={TrendingUp} title="Reputation loop" text="每次完成交易都提升 Directory 排名和信譽資產。" />
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
        <Button variant="gold">
          {t.bidNow}
        </Button>
        <Button variant="outline">{t.priority}</Button>
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
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Info icon={Users} label={locale === "zh" ? "待審公司" : "Pending forwarders"} value="8" />
      <Info icon={Coins} label={locale === "zh" ? "待確認付款" : "Pending payments"} value="3" />
      <Info icon={TrendingUp} label={locale === "zh" ? "今日交易" : "Today flows"} value="12" />
      <div className="rounded-md border border-lblue/10 bg-slate-50 p-3 sm:col-span-3">
        <div className="font-black text-lblue">{locale === "zh" ? "Admin priorities" : "Admin priorities"}</div>
        <p className="mt-1 text-sm text-muted-foreground">
          {locale === "zh" ? "先處理付款確認和 Forwarder verification，確保 marketplace 供應質素。" : "Review payment confirmations and forwarder verification before expanding marketplace supply."}
        </p>
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
