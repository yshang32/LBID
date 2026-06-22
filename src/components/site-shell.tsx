"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Bell, BriefcaseBusiness, ChevronRight, FileText, Globe2, Home, LogIn, PackagePlus, Search, UserCircle, UserPlus, Wallet } from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type NavItem = { href: string; label: string; icon: typeof Home }
type MemberIdentity = { companyName: string; plan: string; tokens: number }

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = `/${locale}`
  const [authenticated, setAuthenticated] = useState(false)
  const [identity, setIdentity] = useState<MemberIdentity | null>(null)

  useEffect(() => {
    const client = getSupabaseBrowserClient()
    if (!client) return
    let active = true

    async function loadIdentity(signedIn: boolean) {
      if (!signedIn) { if (active) setIdentity(null); return }
      const [profileResult, subscriptionResult] = await Promise.all([apiJson("/api/company-profile"), apiJson("/api/subscriptions")])
      if (!active) return
      const profile = profileResult.body.companyProfile
      const subscription = subscriptionResult.body.subscription
      setIdentity({
        companyName: profile?.company_name_en || profile?.company_name_zh || (locale === "zh" ? "我的公司" : "My company"),
        plan: subscription?.plan || "trial",
        tokens: Number(profile?.token_balance_free || 0) + Number(profile?.token_balance_paid || 0),
      })
    }

    client.auth.getSession().then(({ data }) => {
      if (!active) return
      const signedIn = Boolean(data.session)
      setAuthenticated(signedIn)
      loadIdentity(signedIn)
    })
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      const signedIn = Boolean(session)
      setAuthenticated(signedIn)
      loadIdentity(signedIn)
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [locale])

  if (pathname === `${prefix}/auth`) return <>{children}</>

  const copy = locale === "zh"
    ? { search: "搜尋需求、公司或訂單編號", workflow: "工作流程", network: "網絡", account: "帳戶", language: "EN", login: "登入", register: "建立帳戶", nav: [{ href: `${prefix}/dashboard`, label: "工作台", icon: Home }, { href: `${prefix}/requests`, label: "我的需求", icon: PackagePlus }, { href: `${prefix}/marketplace`, label: "接單市場", icon: BriefcaseBusiness }, { href: `${prefix}/orders`, label: "訂單", icon: FileText }], networkNav: [{ href: `${prefix}/forwarders`, label: "公司名錄", icon: Globe2 }], accountNav: [{ href: `${prefix}/tokens`, label: "Token 錢包", icon: Wallet }, { href: `${prefix}/profile`, label: "公司檔案", icon: UserCircle }] }
    : { search: "Search requests, companies or order IDs", workflow: "Workflow", network: "Network", account: "Account", language: "繁中", login: "Sign in", register: "Create account", nav: [{ href: `${prefix}/dashboard`, label: "Workspace", icon: Home }, { href: `${prefix}/requests`, label: "My requests", icon: PackagePlus }, { href: `${prefix}/marketplace`, label: "Marketplace", icon: BriefcaseBusiness }, { href: `${prefix}/orders`, label: "Orders", icon: FileText }], networkNav: [{ href: `${prefix}/forwarders`, label: "Directory", icon: Globe2 }], accountNav: [{ href: `${prefix}/tokens`, label: "Token wallet", icon: Wallet }, { href: `${prefix}/profile`, label: "Company profile", icon: UserCircle }] }
  const otherLocale = locale === "zh" ? "en" : "zh"
  const otherHref = pathname.replace(`/${locale}`, `/${otherLocale}`)

  return <div className="min-h-screen bg-background"><header className="fixed inset-x-0 top-0 z-50 border-b border-lblue/10 bg-white/95"><div className="flex h-16 items-center gap-3 px-4 sm:px-6"><Link href={prefix} className="flex h-11 w-[166px] shrink-0 items-center" aria-label="LBID home"><BrandMark markClassName="h-10 w-[154px]" /></Link><button type="button" className="hidden h-10 max-w-2xl flex-1 items-center gap-2 rounded-md border border-lblue/10 bg-slate-50 px-3 text-left text-sm text-muted-foreground transition hover:bg-white md:flex"><Search className="h-4 w-4" /><span>{copy.search}</span></button><div className="ml-auto flex items-center gap-2">{authenticated ? <><Link href={`${prefix}/tokens`} className="hidden h-9 items-center gap-2 rounded-md border border-lgold/30 bg-[#fcf8ec] px-3 text-sm font-semibold text-[#725b1d] sm:flex"><Wallet className="h-4 w-4" />{identity?.tokens ?? "–"} Token</Link><Link href={`${prefix}/notifications`} className="inline-flex h-10 w-10 items-center justify-center rounded-md text-lblue transition hover:bg-slate-100" aria-label="Notifications"><Bell className="h-5 w-5" /></Link><MemberBadge href={`${prefix}/profile`} identity={identity} locale={locale} /></> : <><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href={`${prefix}/auth`}><LogIn className="h-4 w-4" />{copy.login}</Link></Button><Button asChild size="sm"><Link href={`${prefix}/auth?mode=register`}><UserPlus className="h-4 w-4" />{copy.register}</Link></Button></>}<Button asChild variant="outline" size="sm"><Link href={otherHref}>{copy.language}</Link></Button></div></div></header><aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-60 border-r border-lblue/10 bg-white px-3 py-5 lg:block"><SideGroup label={copy.workflow} items={copy.nav} pathname={pathname} /><SideGroup label={copy.network} items={copy.networkNav} pathname={pathname} className="mt-7" /><SideGroup label={copy.account} items={copy.accountNav} pathname={pathname} className="mt-7" /></aside><div className="min-h-screen pb-20 pt-16 lg:pl-60 lg:pb-0">{children}</div><nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-lblue/10 bg-white px-2 py-2 lg:hidden">{copy.nav.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold ${active ? "bg-slate-100 text-lblue" : "text-slate-500"}`}><item.icon className="h-5 w-5" /><span>{item.label}</span></Link> })}</nav></div>
}

function MemberBadge({ href, identity, locale }: { href: string; identity: MemberIdentity | null; locale: Locale }) {
  const name = identity?.companyName || (locale === "zh" ? "已登入會員" : "Signed-in member")
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "LB"
  const plan = formatPlan(identity?.plan || "trial", locale)
  return <Link href={href} className="flex h-10 items-center gap-2 rounded-md border border-lblue/10 bg-white px-2 transition hover:border-lblue/25 hover:bg-slate-50" aria-label={locale === "zh" ? "開啟公司檔案" : "Open company profile"}><span className="grid h-7 w-7 place-items-center rounded-full bg-[#1b2b5e] text-[10px] font-bold text-white">{initials}</span><span className="hidden min-w-0 md:block"><span className="block max-w-28 truncate text-xs font-semibold text-lblue">{name}</span><span className="block text-[10px] font-medium text-[#9a7517]">{plan}</span></span></Link>
}

function formatPlan(plan: string, locale: Locale) { const labels: Record<string, [string, string]> = { trial: ["試用會員", "Trial member"], monthly: ["月費會員", "Monthly member"], annual: ["年費會員", "Annual member"], free: ["免費會員", "Free member"] }; return (labels[plan] || [plan, plan])[locale === "zh" ? 0 : 1] }
function SideGroup({ label, items, pathname, className = "" }: { label: string; items: NavItem[]; pathname: string; className?: string }) { return <section className={className}><p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p><nav className="space-y-1">{items.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#edf1fb] text-lblue" : "text-slate-600 hover:bg-slate-50 hover:text-lblue"}`}><item.icon className="h-4 w-4" /><span className="flex-1">{item.label}</span>{active ? <ChevronRight className="h-4 w-4" /> : null}</Link> })}</nav></section> }
