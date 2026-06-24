"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, BriefcaseBusiness, Building2, ChevronRight, Globe2, HelpCircle, Home, LogIn, PackagePlus, Search, Settings2, UserPlus, Wallet } from "lucide-react"
import { usePathname } from "next/navigation"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { apiJson } from "@/lib/api-client"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Locale } from "@/lib/i18n"

type Identity = { companyName: string; plan: string; tokens: number } | null
type NavItem = { href: string; label: string; icon: typeof Home }

const copy = {
  zh: {
    search: "搜尋需求、公司或訂單編號", workflow: "工作流程", network: "網絡", account: "帳戶", language: "EN", signIn: "登入", register: "建立帳戶", today: "今日", biddingOpen: "競價開放中", settings: "設定", companyDirectory: "公司名錄", tokenWallet: "Token 錢包", companySettings: "公司檔案", member: "會員帳戶", priority: "優先配對 · 已認證服務路線", plans: { trial: "試用會員", monthly: "Standard 會員", annual: "Premium 會員", free: "免費會員" }, nav: ["今日", "我的需求", "接單市場", "訂單"],
  },
  en: {
    search: "Search requests, companies or order IDs", workflow: "Workflow", network: "Network", account: "Account", language: "中文", signIn: "Sign in", register: "Create account", today: "Today", biddingOpen: "Bidding open", settings: "Settings", companyDirectory: "Company directory", tokenWallet: "Token wallet", companySettings: "Company settings", member: "Member account", priority: "Priority access · verified service routes", plans: { trial: "Trial member", monthly: "Standard member", annual: "Premium member", free: "Free member" }, nav: ["Today", "My requests", "Marketplace", "Orders"],
  },
}

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = `/${locale}`
  const [authenticated, setAuthenticated] = useState(false)
  const [identity, setIdentity] = useState<Identity>(null)
  const t = copy[locale]
  const isDashboard = pathname === `${prefix}/dashboard`

  useEffect(() => {
    const client = getSupabaseBrowserClient()
    if (!client) return
    let active = true
    async function load(signedIn: boolean) {
      if (!signedIn || !active) { setIdentity(null); return }
      const { response, body } = await apiJson("/api/company-profile")
      if (!active || !response.ok) return
      const profile = body.companyProfile
      const subscription = body.subscription
      setIdentity({ companyName: profile?.company_name_en || profile?.company_name_zh || t.member, plan: subscription?.plan || "trial", tokens: Number(profile?.token_balance_free || 0) + Number(profile?.token_balance_paid || 0) })
    }
    client.auth.getSession().then(({ data }) => { const signedIn = Boolean(data.session); if (active) setAuthenticated(signedIn); void load(signedIn) })
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { const signedIn = Boolean(session); setAuthenticated(signedIn); void load(signedIn) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [t.member])

  const standalone = pathname === `${prefix}/auth` || pathname === `${prefix}/bid-demo` || pathname === `${prefix}/product-preview`
  if (standalone) return <>{children}</>

  const nav: NavItem[] = [
    { href: `${prefix}/dashboard`, label: t.nav[0], icon: Home },
    { href: `${prefix}/requests`, label: t.nav[1], icon: PackagePlus },
    { href: `${prefix}/marketplace`, label: t.nav[2], icon: BriefcaseBusiness },
    { href: `${prefix}/orders`, label: t.nav[3], icon: Building2 },
  ]
  const network: NavItem[] = [{ href: `${prefix}/forwarders`, label: t.companyDirectory, icon: Globe2 }]
  const account: NavItem[] = [{ href: `${prefix}/tokens`, label: t.tokenWallet, icon: Wallet }, { href: `${prefix}/profile`, label: t.companySettings, icon: Settings2 }]
  const otherLocale = locale === "zh" ? "en" : "zh"
  const otherHref = pathname.replace(`/${locale}`, `/${otherLocale}`)

  return <div className="min-h-screen bg-canvas">
    <header className={`fixed top-0 z-50 flex h-14 items-center border-b border-line bg-white/80 backdrop-blur-xl ${isDashboard ? "inset-x-0 lg:left-[228px]" : "inset-x-0"}`}>
      {isDashboard ? <DashboardTopbar locale={locale} t={t} prefix={prefix} /> : <StandardTopbar authenticated={authenticated} identity={identity} otherHref={otherHref} t={t} locale={locale} prefix={prefix} />}
    </header>
    <aside className={`fixed bottom-0 left-0 z-40 hidden w-[228px] border-r border-line bg-white lg:flex lg:flex-col ${isDashboard ? "top-0" : "top-14"}`}>
      <div className="h-[88px] overflow-hidden"><img src="/assets/lbid-figma-25jun-logo.png?v=20260625" alt="LBID Logistics Bidding Platform" className="-ml-3 -mt-7 block h-auto w-[272px] select-none mix-blend-multiply" draggable={false} /></div>
      {isDashboard ? <DashboardSidebar nav={nav} account={account} pathname={pathname} identity={identity} t={t} locale={locale} /> : <><div className="px-3"><NavGroup label={t.workflow} items={nav} pathname={pathname} /><NavGroup label={t.network} items={network} pathname={pathname} className="mt-8" /><NavGroup label={t.account} items={account} pathname={pathname} className="mt-8" /></div><SidebarFooter identity={identity} t={t} locale={locale} /></>}
    </aside>
    <div className={`min-h-screen pb-20 lg:pb-0 lg:pl-[228px] ${isDashboard ? "pt-14" : "pt-14"}`}>{children}</div>
    <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-line bg-white/95 px-2 py-2 backdrop-blur lg:hidden">{nav.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold transition ${active ? "bg-[#eef1f8] text-lblue" : "text-slate-500 hover:bg-slate-50"}`}><item.icon className="h-5 w-5" /><span>{item.label}</span></Link> })}</nav>
  </div>
}

function DashboardTopbar({ locale, t, prefix }: { locale: Locale; t: typeof copy.zh; prefix: string }) {
  const date = new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date())
  return <div className="flex w-full items-center justify-between px-8 lg:px-9"><div className="flex items-center gap-3"><span className="text-[14px] font-semibold tracking-[-.2px] text-ink">{t.today}</span><span className="border-l border-line pl-3 text-[13px] text-ink-3">{date}</span></div><div className="flex items-center gap-1"><ShellIcon label="Search"><Search className="h-4 w-4" /></ShellIcon><Link href={`${prefix}/notifications`} className="relative"><ShellIcon label="Notifications"><Bell className="h-4 w-4" /></ShellIcon><span className="absolute right-[8px] top-[8px] h-[5px] w-[5px] rounded-full border-[1.5px] border-white bg-lgold" /></Link><ShellIcon label="Help"><HelpCircle className="h-4 w-4" /></ShellIcon><div className="mx-2 h-5 w-px bg-line" /><span className="inline-flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-medium text-ink-2 shadow-[0_1px_4px_rgba(0,0,0,.05)]"><span className="h-[6px] w-[6px] rounded-full bg-emerald" />{t.biddingOpen}</span></div></div>
}
function StandardTopbar({ authenticated, identity, otherHref, t, locale, prefix }: { authenticated: boolean; identity: Identity; otherHref: string; t: typeof copy.zh; locale: Locale; prefix: string }) { return <div className="flex w-full items-center gap-3 px-4 sm:px-6"><div className="hidden h-9 max-w-xl flex-1 items-center gap-2 border border-line bg-[#fbfcfe] px-3 text-sm text-ink-3 md:flex"><Search className="h-4 w-4" /><span>{t.search}</span></div><div className="ml-auto flex items-center gap-1.5">{authenticated ? <><Link href={`${prefix}/tokens`} className="hidden h-9 items-center gap-2 rounded-md border border-[#e8d9a0] bg-[#fdf8ec] px-3 text-xs font-semibold text-[#765b16] transition hover:border-[#c49a3c] hover:bg-[#fbf3dc] sm:flex"><Wallet className="h-4 w-4" />{identity?.tokens ?? 0} Token</Link><Link href={`${prefix}/notifications`} className="shell-icon-button" aria-label="Notifications"><Bell className="h-5 w-5" /></Link><CompanyIdentity locale={locale} href={`${prefix}/profile`} identity={identity} t={t} /></> : <><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href={`${prefix}/auth`}><LogIn className="h-4 w-4" />{t.signIn}</Link></Button><Button asChild size="sm"><Link href={`${prefix}/auth?mode=register`}><UserPlus className="h-4 w-4" />{t.register}</Link></Button></>}<Button asChild variant="outline" size="sm" className="min-w-10 px-2.5"><Link href={otherHref}>{t.language}</Link></Button></div></div> }
function DashboardSidebar({ nav, account, pathname, identity, t, locale }: { nav: NavItem[]; account: NavItem[]; pathname: string; identity: Identity; t: typeof copy.zh; locale: Locale }) { return <><nav className="flex-1 space-y-0.5 px-3">{nav.map((item) => <DashboardNavItem key={item.href} item={item} active={pathname === item.href} />)}</nav><div className="border-t border-line-light px-3 pb-6 pt-4"><Link href={account[1].href} className="mb-3 flex items-center gap-3 rounded-xl px-3 py-[9px] text-[13px] text-ink-2 transition hover:bg-[#eef1f8] hover:text-ink"><Settings2 className="h-[15px] w-[15px]" />{t.settings}</Link><MembershipCard identity={identity} t={t} locale={locale} /><CompanyIdentity href={account[1].href} identity={identity} t={t} locale={locale} compact /></div></> }
function DashboardNavItem({ item, active }: { item: NavItem; active: boolean }) { return <Link href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-[9px] text-[13px] transition ${active ? "bg-lblue font-semibold text-white shadow-[0_2px_10px_rgba(12,26,62,.18)]" : "text-ink-2 hover:bg-[#eef1f8] hover:text-ink"}`}><item.icon className="h-[15px] w-[15px]" strokeWidth={active ? 2.2 : 1.75} />{item.label}</Link> }
function SidebarFooter({ identity, t, locale }: { identity: Identity; t: typeof copy.zh; locale: Locale }) { return <div className="mt-auto border-t border-line-light px-3 pb-6 pt-4"><MembershipCard identity={identity} t={t} locale={locale} /><CompanyIdentity href={`/${locale}/profile`} identity={identity} t={t} locale={locale} compact /></div> }
function MembershipCard({ identity, t, locale }: { identity: Identity; t: typeof copy.zh; locale: Locale }) { const plan = t.plans[(identity?.plan || "trial") as keyof typeof t.plans] || t.plans.trial; return <Link href={`/${locale}/subscription`} className="mb-3 block rounded-[13px] bg-[linear-gradient(135deg,#E8D9A0,#C49A3C_50%,#E8D9A0)] p-[1.5px]"><span className="block rounded-[11.5px] bg-[#fdf8ec] px-3 py-2.5"><span className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[.07em] text-[#7a5e18]"><span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-lgold text-[9px] text-white">★</span>{plan}</span><span className="mt-1.5 block text-[11px] leading-[1.4] text-[#9a7517]">{t.priority}</span></span></Link> }
function ShellIcon({ label, children }: { label: string; children: React.ReactNode }) { return <button aria-label={label} className="grid h-[34px] w-[34px] place-items-center rounded-lg text-ink-3 transition hover:bg-white hover:text-ink hover:shadow-[0_1px_6px_rgba(0,0,0,.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lblue/30">{children}</button> }
function CompanyIdentity({ href, identity, locale, t, compact = false }: { href: string; identity: Identity; locale: Locale; t: typeof copy.zh; compact?: boolean }) { const name = identity?.companyName || t.member; const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "LB"; const plan = t.plans[(identity?.plan || "trial") as keyof typeof t.plans] || t.plans.trial; return <Link href={href} className={`${compact ? "w-full rounded-xl px-1 py-1 hover:bg-canvas" : "h-10 rounded-md border border-line bg-white px-2 hover:border-[#b8c4dd] hover:bg-[#fbfcfe]"} flex items-center gap-2 transition`} aria-label={locale === "zh" ? "開啟公司設定" : "Open company settings"}><span className="grid h-8 w-8 place-items-center rounded-full border border-line bg-[#eef1f8] text-[10px] font-bold text-lblue">{initials}</span><span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-semibold text-ink">{name}</span><span className="block truncate text-[11px] text-ink-3">{plan}</span></span><ChevronRight className="h-3.5 w-3.5 shrink-0 text-line" /></Link> }
function NavGroup({ label, items, pathname, className = "" }: { label: string; items: NavItem[]; pathname: string; className?: string }) { return <section className={className}><p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-ink-3">{label}</p><nav className="space-y-1">{items.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#edf1fb] text-lblue" : "text-ink-2 hover:bg-[#f7f9fc] hover:text-lblue"}`}>{active ? <span className="absolute inset-y-2 left-0 w-0.5 bg-lgold" /> : null}<item.icon className="h-4 w-4" /><span className="flex-1">{item.label}</span>{active ? <ChevronRight className="h-4 w-4" /> : null}</Link> })}</nav></section> }
