"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Bell, BriefcaseBusiness, Building2, ChevronRight, Globe2, Home, LogIn, PackagePlus, Search, Settings2, UserPlus, Wallet } from "lucide-react"
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
    search: "搜尋需求、公司或訂單編號", workflow: "工作流程", network: "網絡", account: "帳戶", language: "EN", signIn: "登入", register: "建立帳戶",
    nav: ["工作台", "我的需求", "接單市場", "訂單"], networkNav: ["公司名錄"], accountNav: ["Token 錢包", "公司設定"], trial: "試用會員", monthly: "Standard 會員", annual: "Premium 會員", free: "免費會員", signedIn: "會員帳戶",
  },
  en: {
    search: "Search requests, companies or order IDs", workflow: "Workflow", network: "Network", account: "Account", language: "中文", signIn: "Sign in", register: "Create account",
    nav: ["Workspace", "My requests", "Marketplace", "Orders"], networkNav: ["Company directory"], accountNav: ["Token wallet", "Company settings"], trial: "Trial member", monthly: "Standard member", annual: "Premium member", free: "Free member", signedIn: "Member account",
  },
}

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = `/${locale}`
  const [authenticated, setAuthenticated] = useState(false)
  const [identity, setIdentity] = useState<Identity>(null)
  const t = copy[locale]

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
      setIdentity({ companyName: profile?.company_name_en || profile?.company_name_zh || t.signedIn, plan: subscription?.plan || "trial", tokens: Number(profile?.token_balance_free || 0) + Number(profile?.token_balance_paid || 0) })
    }
    client.auth.getSession().then(({ data }) => { const signedIn = Boolean(data.session); if (active) setAuthenticated(signedIn); void load(signedIn) })
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => { const signedIn = Boolean(session); setAuthenticated(signedIn); void load(signedIn) })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [t.signedIn])

  if (pathname === `${prefix}/auth`) return <>{children}</>
  const nav: NavItem[] = [
    { href: `${prefix}/dashboard`, label: t.nav[0], icon: Home }, { href: `${prefix}/requests`, label: t.nav[1], icon: PackagePlus }, { href: `${prefix}/marketplace`, label: t.nav[2], icon: BriefcaseBusiness }, { href: `${prefix}/orders`, label: t.nav[3], icon: Building2 },
  ]
  const network: NavItem[] = [{ href: `${prefix}/forwarders`, label: t.networkNav[0], icon: Globe2 }]
  const account: NavItem[] = [{ href: `${prefix}/tokens`, label: t.accountNav[0], icon: Wallet }, { href: `${prefix}/profile`, label: t.accountNav[1], icon: Settings2 }]
  const otherLocale = locale === "zh" ? "en" : "zh"
  const otherHref = pathname.replace(`/${locale}`, `/${otherLocale}`)

  return <div className="min-h-screen bg-[#f7f8fa]"><header className="fixed inset-x-0 top-0 z-50 border-b border-[#e6eaf0] bg-white/90 backdrop-blur-xl"><div className="flex h-16 items-center gap-3 px-4 sm:px-6"><Link href={prefix} className="flex h-10 w-[142px] shrink-0 items-center" aria-label="LBID home"><BrandMark markClassName="h-9 w-[138px]" /></Link><div className="hidden h-10 max-w-xl flex-1 items-center gap-2 border border-[#e1e6ee] bg-[#fafbfd] px-3 text-sm text-slate-500 md:flex"><Search className="h-4 w-4" /><span>{t.search}</span></div><div className="ml-auto flex items-center gap-1.5">{authenticated ? <><Link href={`${prefix}/tokens`} className="hidden h-9 items-center gap-2 border border-[#eadba8] bg-[#fdf9eb] px-3 text-xs font-semibold text-[#765b16] transition hover:border-[#d6bb5e] hover:bg-[#faf3dc] sm:flex"><Wallet className="h-4 w-4" />{identity?.tokens ?? 0} Token</Link><Link href={`${prefix}/notifications`} className="shell-icon-button" aria-label="Notifications"><Bell className="h-5 w-5" /></Link><CompanyIdentity locale={locale} href={`${prefix}/profile`} identity={identity} t={t} /></> : <><Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href={`${prefix}/auth`}><LogIn className="h-4 w-4" />{t.signIn}</Link></Button><Button asChild size="sm"><Link href={`${prefix}/auth?mode=register`}><UserPlus className="h-4 w-4" />{t.register}</Link></Button></>}<Button asChild variant="outline" size="sm" className="min-w-10 px-2.5"><Link href={otherHref}>{t.language}</Link></Button></div></div></header><aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-60 border-r border-[#e6eaf0] bg-white px-3 py-5 lg:block"><NavGroup label={t.workflow} items={nav} pathname={pathname} /><NavGroup label={t.network} items={network} pathname={pathname} className="mt-8" /><NavGroup label={t.account} items={account} pathname={pathname} className="mt-8" /></aside><div className="min-h-screen pb-20 pt-16 lg:pb-0 lg:pl-60">{children}</div><nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-[#e6eaf0] bg-white/95 px-2 py-2 backdrop-blur lg:hidden">{nav.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold transition ${active ? "bg-[#edf1fb] text-lblue" : "text-slate-500 hover:bg-slate-50"}`}><item.icon className="h-5 w-5" /><span>{item.label}</span></Link> })}</nav></div>
}

function CompanyIdentity({ href, identity, locale, t }: { href: string; identity: Identity; locale: Locale; t: typeof copy.zh }) {
  const name = identity?.companyName || t.signedIn
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join("").toUpperCase() || "LB"
  const plan = t[(identity?.plan || "trial") as "trial" | "monthly" | "annual" | "free"] || identity?.plan || "trial"
  return <Link href={href} className="flex h-10 items-center gap-2 rounded-md border border-[#e1e6ee] bg-white px-2 transition hover:border-[#b8c4dd] hover:bg-[#fbfcfe]" aria-label={locale === "zh" ? "開啟公司設定" : "Open company settings"}><span className="grid h-7 w-7 place-items-center rounded-full bg-[#1b2b5e] text-[10px] font-bold text-white">{initials}</span><span className="hidden min-w-0 md:block"><span className="block max-w-28 truncate text-xs font-semibold text-lblue">{name}</span><span className="block text-[10px] font-medium text-[#9a7517]">{plan}</span></span></Link>
}

function NavGroup({ label, items, pathname, className = "" }: { label: string; items: NavItem[]; pathname: string; className?: string }) { return <section className={className}><p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p><nav className="space-y-1">{items.map((item) => { const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#edf1fb] text-lblue" : "text-slate-600 hover:bg-[#f7f9fc] hover:text-lblue"}`}>{active ? <span className="absolute inset-y-2 left-0 w-0.5 bg-[#c9a84c]" /> : null}<item.icon className="h-4 w-4" /><span className="flex-1">{item.label}</span>{active ? <ChevronRight className="h-4 w-4" /> : null}</Link> })}</nav></section> }
