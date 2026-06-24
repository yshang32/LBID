"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  BarChart2, Bell, BriefcaseBusiness, Building2, ChevronRight, CircleHelp,
  Crown, FileText, LayoutDashboard, LogIn, Map, MessageCircle, Package,
  Plus, Search, Send, Settings, ShieldCheck, UserPlus, Wallet, Zap,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"
import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Identity = {
  companyName: string
  plan: string
  tokens: number
  role: string | null
  canBeClient: boolean
  canBeForwarder: boolean
} | null

type NavItem = { href: string; label: string; icon: typeof LayoutDashboard; badge?: number }

const labels = {
  zh: {
    today: "今日", search: "搜尋需求、公司或訂單編號", open: "競價進行中", signIn: "登入", register: "建立帳戶",
    create: "建立需求", operations: "工作台", network: "網絡", account: "帳戶", admin: "管理",
    member: "會員帳戶", routes: "優勢航線已認證", language: "EN",
    nav: ["今日", "接單機會", "已提交競價", "我的需求", "訂單", "通知"],
    secondary: ["我的航線", "分析", "公司名錄", "社群"],
    accountNav: ["Token 錢包", "公司檔案", "會員方案"],
    adminNav: ["管理主頁", "需求審核", "帳戶管理", "付款審核"],
  },
  en: {
    today: "Today", search: "Search requests, companies or order IDs", open: "Bidding open", signIn: "Sign in", register: "Create account",
    create: "New request", operations: "Workspace", network: "Network", account: "Account", admin: "Admin",
    member: "Member account", routes: "Priority access · verified routes", language: "中文",
    nav: ["Today", "Opportunities", "Active Bids", "My Requests", "Orders", "Notifications"],
    secondary: ["My Routes", "Analytics", "Directory", "Community"],
    accountNav: ["Token Wallet", "Company Profile", "Membership"],
    adminNav: ["Admin", "Requests", "Accounts", "Payments"],
  },
} as const

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = `/${locale}`
  const t = labels[locale]
  const [identity, setIdentity] = useState<Identity>(null)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const client = getSupabaseBrowserClient()
    if (!client) return
    let mounted = true
    const loadIdentity = async (signedIn: boolean) => {
      if (!signedIn || !mounted) { setIdentity(null); return }
      const { response, body } = await apiJson("/api/company-profile")
      if (!mounted || !response.ok) return
      const profile = body.companyProfile || {}
      setIdentity({
        companyName: profile.company_name_en || profile.company_name_zh || t.member,
        plan: body.subscription?.plan || "trial",
        tokens: Number(profile.token_balance_free || 0) + Number(profile.token_balance_paid || 0),
        role: body.role || null,
        canBeClient: profile.can_be_client !== false,
        canBeForwarder: profile.can_be_forwarder !== false,
      })
    }
    client.auth.getSession().then(({ data }) => {
      const signedIn = Boolean(data.session)
      if (mounted) setAuthenticated(signedIn)
      void loadIdentity(signedIn)
    })
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const signedIn = Boolean(session)
      setAuthenticated(signedIn)
      void loadIdentity(signedIn)
    })
    return () => { mounted = false; listener.subscription.unsubscribe() }
  }, [t.member])

  const standalone = pathname === `${prefix}/auth` || pathname === `${prefix}/onboarding` || pathname.startsWith(`${prefix}/onboarding/`) || pathname === `${prefix}/bid-demo` || pathname === `${prefix}/product-preview`
  if (standalone) return <>{children}</>

  const primary: NavItem[] = [
    { href: `${prefix}/dashboard`, label: t.nav[0], icon: LayoutDashboard },
    { href: `${prefix}/marketplace`, label: t.nav[1], icon: Send },
    { href: `${prefix}/active-bids`, label: t.nav[2], icon: BriefcaseBusiness },
    { href: `${prefix}/requests`, label: t.nav[3], icon: FileText },
    { href: `${prefix}/orders`, label: t.nav[4], icon: Package },
    { href: `${prefix}/notifications`, label: t.nav[5], icon: Bell, badge: 0 },
  ]
  const secondary: NavItem[] = [
    { href: `${prefix}/my-routes`, label: t.secondary[0], icon: Map },
    { href: `${prefix}/analytics`, label: t.secondary[1], icon: BarChart2 },
    { href: `${prefix}/forwarders`, label: t.secondary[2], icon: Building2 },
    { href: `${prefix}/community`, label: t.secondary[3], icon: MessageCircle },
  ]
  const account: NavItem[] = [
    { href: `${prefix}/tokens`, label: t.accountNav[0], icon: Zap },
    { href: `${prefix}/profile`, label: t.accountNav[1], icon: Building2 },
    { href: `${prefix}/subscription`, label: t.accountNav[2], icon: Crown },
  ]
  const admin: NavItem[] = [
    { href: `${prefix}/admin`, label: t.adminNav[0], icon: ShieldCheck },
    { href: `${prefix}/admin/shipment-requests`, label: t.adminNav[1], icon: FileText },
    { href: `${prefix}/admin/accounts`, label: t.adminNav[2], icon: Building2 },
    { href: `${prefix}/admin/pending-payments`, label: t.adminNav[3], icon: Crown },
  ]
  const otherLocale = locale === "zh" ? "en" : "zh"
  const otherHref = pathname.replace(`/${locale}`, `/${otherLocale}`)

  return <div className="min-h-screen bg-[#f0f2f8] text-[#111827]">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[228px] flex-col border-r border-[#dfe4ed] bg-white lg:flex">
      <Link href={`${prefix}/dashboard`} className="h-[88px] overflow-hidden" aria-label="LBID workspace">
        <img src="/assets/lbid-figma-25jun-logo.png?v=20260625" alt="LBID Logistics Bidding Platform" className="-ml-3 -mt-7 block h-auto w-[272px] select-none mix-blend-multiply" draggable={false} />
      </Link>
      <div className="px-3 pb-3"><Link href={`${prefix}/inquiries/new`} className="flex h-9 items-center justify-center gap-2 rounded-xl border border-dashed border-[#d7dde8] text-[12.5px] font-medium text-[#7b879d] transition hover:border-[#0c1a3e] hover:bg-[#eff3ff] hover:text-[#0c1a3e]"><Plus className="h-3.5 w-3.5" />{t.create}</Link></div>
      <NavSection items={primary} pathname={pathname} />
      <div className="mx-3 mt-2 border-t border-[#edf0f4] pt-2"><NavSection items={secondary} pathname={pathname} compact /></div>
      <div className="mx-3 mt-2 border-t border-[#edf0f4] pt-2"><NavSection items={account} pathname={pathname} /></div>
      {identity?.role === "admin" ? <div className="mx-3 mt-2 border-t border-[#edf0f4] pt-2"><p className="px-3 pb-1 text-[9.5px] font-bold uppercase tracking-[.09em] text-[#99a4b8]">{t.admin}</p><NavSection items={admin} pathname={pathname} compact admin /></div> : null}
      <div className="mt-auto border-t border-[#edf0f4] px-3 pb-5 pt-3">
        <MembershipCard identity={identity} locale={locale} label={t.routes} />
        <Link href={`${prefix}/profile`} className="group flex items-center gap-2.5 rounded-xl px-1 py-1 transition hover:bg-[#f6f8fc]"><Avatar identity={identity} /><span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-medium text-[#172038]">{identity?.companyName || t.member}</span><span className="mt-0.5 block truncate text-[11px] text-[#8c98ac]">{planLabel(identity?.plan)}</span></span><ChevronRight className="h-3.5 w-3.5 text-[#cbd2df] transition group-hover:text-[#5b6780]" /></Link>
      </div>
    </aside>

    <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center border-b border-[#dfe4ed] bg-white/85 backdrop-blur-xl lg:left-[228px]">
      <div className="flex w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-9">
        <div className="flex min-w-0 items-center gap-3"><span className="hidden text-[14px] font-semibold tracking-[-.2px] text-[#172038] sm:inline">{pageTitle(pathname, prefix, t.today)}</span><span className="hidden border-l border-[#dfe4ed] pl-3 text-[13px] text-[#8c98ac] md:inline">{new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())}</span><div className="hidden min-w-[220px] items-center gap-2 rounded-lg border border-[#e0e5ee] bg-[#fbfcfe] px-3 py-2 text-[12.5px] text-[#8c98ac] xl:flex"><Search className="h-4 w-4" />{t.search}</div></div>
        <div className="flex items-center gap-1.5">
          {authenticated ? <><Link href={`${prefix}/tokens`} className="hidden items-center gap-2 rounded-lg border border-[#ead9a0] bg-[#fffaf0] px-3 py-1.5 text-[12px] font-semibold text-[#80631b] shadow-[0_1px_4px_rgba(0,0,0,.04)] sm:flex"><Wallet className="h-4 w-4" />{identity?.tokens ?? 0} Token</Link><Link href={`${prefix}/notifications`} className="relative grid h-[34px] w-[34px] place-items-center rounded-lg text-[#7e8ba1] transition hover:bg-white hover:text-[#172038] hover:shadow-[0_1px_6px_rgba(0,0,0,.07)]" aria-label="Notifications"><Bell className="h-4 w-4" />{primary.find((item) => item.href.endsWith("notifications"))?.badge ? <span className="absolute right-2 top-2 h-[5px] w-[5px] rounded-full border-[1.5px] border-white bg-[#c49a3c]" /> : null}</Link><button type="button" className="hidden h-[34px] w-[34px] place-items-center rounded-lg text-[#7e8ba1] transition hover:bg-white hover:text-[#172038] hover:shadow-[0_1px_6px_rgba(0,0,0,.07)] md:grid" aria-label="Help"><CircleHelp className="h-4 w-4" /></button><span className="mx-1 hidden h-5 w-px bg-[#dfe4ed] sm:block" /><span className="hidden items-center gap-2 rounded-lg border border-[#dfe4ed] bg-white px-3 py-1.5 text-[12px] font-medium text-[#4c5870] shadow-[0_1px_4px_rgba(0,0,0,.05)] md:inline-flex"><span className="h-[6px] w-[6px] rounded-full bg-[#198754]" />{t.open}</span></> : <><Button asChild size="sm" variant="ghost"><Link href={`${prefix}/auth`}><LogIn className="h-4 w-4" />{t.signIn}</Link></Button><Button asChild size="sm" className="hidden sm:inline-flex"><Link href={`${prefix}/auth?mode=register`}><UserPlus className="h-4 w-4" />{t.register}</Link></Button></>}
          <Link href={otherHref} className="ml-1 rounded-lg border border-[#dfe4ed] px-2.5 py-1.5 text-[12px] font-semibold text-[#37445c] transition hover:bg-[#f6f8fc]">{t.language}</Link>
        </div>
      </div>
    </header>
    <main className="min-h-screen pb-20 pt-14 lg:pl-[228px] lg:pb-0">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-[#dfe4ed] bg-white/95 px-2 py-2 backdrop-blur lg:hidden">{primary.slice(0, 4).map((item) => <MobileNavItem key={item.href} item={item} active={pathname === item.href} />)}</nav>
  </div>
}

function NavSection({ items, pathname, compact = false, admin = false }: { items: NavItem[]; pathname: string; compact?: boolean; admin?: boolean }) {
  return <nav className="flex flex-col gap-0.5 px-3">{items.map((item) => { const active = pathname === item.href || (item.href.endsWith("/admin") && pathname.startsWith(`${item.href}/`)); return <Link key={item.href} href={item.href} className={`relative flex items-center gap-3 rounded-xl px-3 ${compact ? "py-2 text-[12.5px]" : "py-[9px] text-[13px]"} transition ${active ? (admin ? "bg-[#b7791f] text-white" : "bg-[#0c1a3e] font-medium text-white shadow-[0_2px_10px_rgba(12,26,62,.18)]") : "text-[#59667d] hover:bg-[#eff3ff] hover:text-[#172038]"}`}><item.icon className={compact ? "h-[14px] w-[14px]" : "h-[15px] w-[15px]"} strokeWidth={active ? 2.2 : 1.75} /><span className="min-w-0 flex-1 truncate">{item.label}</span>{item.badge ? <span className="grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold text-white">{item.badge}</span> : null}</Link> })}</nav>
}

function MobileNavItem({ item, active }: { item: NavItem; active: boolean }) { return <Link href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition ${active ? "bg-[#eef1fb] text-[#0c1a3e]" : "text-[#7e8ba1]"}`}><item.icon className="h-4 w-4" /><span>{item.label}</span></Link> }
function Avatar({ identity }: { identity: Identity }) { const initials = (identity?.companyName || "LB").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#dfe4ed] bg-[#eef1f8] text-[10px] font-bold text-[#0c1a3e]">{initials}</span> }
function MembershipCard({ identity, locale, label }: { identity: Identity; locale: Locale; label: string }) { return <Link href={`/${locale}/subscription`} className="mb-3 block rounded-[13px] bg-[linear-gradient(135deg,#e8d9a0,#c49a3c_50%,#e8d9a0)] p-[1.5px]"><span className="block rounded-[11.5px] bg-[#fffaf0] px-3 py-2.5"><span className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[.07em] text-[#80631b]"><span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-[#c49a3c] text-[9px] text-white"><Crown className="h-2.5 w-2.5" /></span>{planLabel(identity?.plan)}</span><span className="mt-1.5 block text-[11px] leading-[1.4] text-[#a17e22]">{label}</span></span></Link> }
function planLabel(plan?: string) { if (plan === "annual") return "Premium Member"; if (plan === "monthly") return "Standard Member"; if (plan === "free") return "Free Member"; return "Trial Member" }
function pageTitle(pathname: string, prefix: string, fallback: string) { const route = pathname.replace(prefix, "") || "/dashboard"; const names: Record<string, string> = { "/dashboard": fallback, "/marketplace": "Opportunities", "/active-bids": "Active Bids", "/requests": "My Requests", "/orders": "Orders", "/notifications": "Notifications", "/forwarders": "Directory", "/community": "Community", "/tokens": "Token Wallet", "/profile": "Company Profile", "/subscription": "Membership" }; return names[route] || fallback }
