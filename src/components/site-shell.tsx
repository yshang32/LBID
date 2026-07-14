"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import {
  BarChart2,
  Bell,
  Building2,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Map,
  MessageCircle,
  Package,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type ReputationRank = "bronze" | "silver" | "gold" | "platinum" | "diamond" | "emerald"

type Identity = {
  companyName: string
  plan: string
  tokens: number
  role: string | null
  rank: ReputationRank
} | null

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/marketplace": "Bidding Command Center",
  "/active-bids": "Active Bids",
  "/requests": "My Requests",
  "/inquiries/new": "New Request",
  "/orders": "Orders",
  "/my-routes": "Routes",
  "/network-map": "Route Intelligence",
  "/analytics": "Analytics",
  "/forwarders": "Directory",
  "/profile": "Company Profile",
  "/subscription": "Membership & Billing",
  "/tokens": "Token Wallet",
  "/notifications": "Notifications",
  "/community": "Community",
  "/admin": "Admin Dashboard",
}

const rankStyles: Record<ReputationRank, { frame: string; glow: string; label: string }> = {
  bronze: { frame: "linear-gradient(135deg,#e9c39c,#a9602d 52%,#f0d3b1)", glow: "shadow-[0_8px_22px_rgba(169,96,45,0.14)]", label: "Bronze" },
  silver: { frame: "linear-gradient(135deg,#f2f5f8,#99a6b8 52%,#dfe5ec)", glow: "shadow-[0_8px_22px_rgba(112,127,150,0.14)]", label: "Silver" },
  gold: { frame: "linear-gradient(135deg,#fff0a9,#c28e20 52%,#f7d769)", glow: "shadow-[0_8px_24px_rgba(194,142,32,0.18)]", label: "Gold" },
  platinum: { frame: "linear-gradient(135deg,#eff7ff,#9fb6cf 45%,#eef1f6)", glow: "shadow-[0_8px_24px_rgba(111,143,178,0.17)]", label: "Platinum" },
  diamond: { frame: "linear-gradient(135deg,#8fe4ff,#8b8cff 48%,#e3a9ff)", glow: "shadow-[0_8px_26px_rgba(116,137,255,0.22)]", label: "Diamond" },
  emerald: { frame: "linear-gradient(135deg,#7aebbd,#0f9864 50%,#b7f5d9)", glow: "shadow-[0_8px_26px_rgba(15,152,100,0.22)]", label: "Emerald" },
}

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = `/${locale}`
  const [identity, setIdentity] = useState<Identity>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    const client = getSupabaseBrowserClient()
    if (!client) return
    let mounted = true

    const loadIdentity = async (signedIn: boolean) => {
      if (!signedIn || !mounted) {
        setIdentity(null)
        setUnreadNotifications(0)
        return
      }
      setIdentity((current) => current ?? { companyName: "Workspace", plan: "standard", tokens: 0, role: null, rank: "bronze" })
      try {
        const [profileResult, subscriptionResult, notificationsResult] = await Promise.all([
          apiJson("/api/company-profile"),
          apiJson("/api/subscriptions"),
          apiJson("/api/notifications"),
        ])
        if (!mounted || !profileResult.response.ok) return
        const profile = profileResult.body.companyProfile || {}
        const subscription = subscriptionResult.response.ok ? subscriptionResult.body.subscription : null
        const trialActive = subscription?.status === "trial" && subscription.trial_ends_at && new Date(subscription.trial_ends_at) > new Date()
        setIdentity({
          companyName: profile.company_name_en || profile.company_name_zh || "LBID Company",
          plan: trialActive ? "trial" : subscription?.status === "active" ? subscription.plan : "free",
          tokens: Number(profile.token_balance_free || 0) + Number(profile.token_balance_paid || 0),
          role: profileResult.body.role || null,
          rank: normalizeRank(profile.reputation_rank || profile.rank),
        })
        if (notificationsResult.response.ok) {
          const notifications = notificationsResult.body.notifications || []
          setUnreadNotifications(notifications.filter((item: { read_at?: string | null }) => !item.read_at).length)
        }
      } catch (error) {
        console.error("Failed to hydrate workspace identity", error)
      }
    }

    client.auth.getSession().then(({ data }) => void loadIdentity(Boolean(data.session)))
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => void loadIdentity(Boolean(session)))
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const standalone = pathname === prefix || pathname === `${prefix}/auth`
  if (standalone) return <>{children}</>

  const bidding: NavItem[] = [
    { href: `${prefix}/dashboard`, label: "Overview", icon: LayoutDashboard, exact: true },
    { href: `${prefix}/marketplace`, label: "Bidding Center", icon: Send },
    { href: `${prefix}/requests`, label: "My Requests", icon: FileText },
  ]
  const operations: NavItem[] = [
    { href: `${prefix}/orders`, label: "Orders", icon: Package },
    { href: `${prefix}/network-map`, label: "Routes", icon: Map },
    { href: `${prefix}/forwarders`, label: "Directory", icon: Users },
  ]
  const intelligence: NavItem[] = [
    { href: `${prefix}/analytics`, label: "Analytics", icon: BarChart2 },
  ]
  const admin: NavItem[] = [
    { href: `${prefix}/admin`, label: "Admin", icon: ShieldCheck, exact: true },
    { href: `${prefix}/admin/shipment-requests`, label: "Request Review", icon: FileText },
    { href: `${prefix}/admin/accounts`, label: "Accounts", icon: Building2 },
  ]
  const mobileNav = [bidding[0], bidding[1], bidding[2], operations[0], operations[1]]

  return (
    <div className="workspace-scene flex h-[100dvh] max-h-[100dvh] overflow-hidden font-sans text-ink">
      <aside className="workspace-sidebar hidden w-[224px] flex-shrink-0 flex-col border-r border-[#e8ebf1] bg-white/94 backdrop-blur-xl lg:flex">
        <Link href={`${prefix}/dashboard`} className="flex h-[82px] items-center px-5" aria-label="LBID workspace">
          <Image src="/assets/lbid-web-logo.svg" alt="LBID Logistics Bidding Platform" width={158} height={50} priority className="h-auto w-[154px] object-contain object-left" />
        </Link>

        <div className="px-3 pb-4">
          <Link href={`${prefix}/inquiries/new`} className="flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[linear-gradient(135deg,#6c62f5,#5268ff)] text-[11.5px] font-semibold text-white shadow-[0_10px_22px_rgba(83,99,239,0.24)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6671f3]/30">
            <Plus className="h-4 w-4" />New Request
          </Link>
        </div>

        <SidebarLabel>Bidding</SidebarLabel>
        <NavSection items={bidding} pathname={pathname} />
        <SidebarLabel>Operations</SidebarLabel>
        <NavSection items={operations} pathname={pathname} />
        <SidebarLabel>Intelligence</SidebarLabel>
        <NavSection items={intelligence} pathname={pathname} />

        {identity?.role === "admin" ? <><SidebarLabel>Admin</SidebarLabel><NavSection items={admin} pathname={pathname} admin /></> : null}

        <div className="relative mt-auto border-t border-[#edf0f4] px-3 py-4">
          <AccountMenu locale={locale} prefix={prefix} identity={identity} />
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar pathname={pathname} prefix={prefix} locale={locale} unreadNotifications={unreadNotifications} identity={identity} />
        <div className="workspace-scroll min-h-0 flex-1 overflow-y-auto max-lg:pb-20" style={{ scrollbarWidth: "thin", scrollbarColor: "#D1D6E0 transparent" }}>
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[#e7eaf0] bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        {mobileNav.map((item) => <MobileNavItem key={item.href} item={item} active={isActive(pathname, item)} />)}
      </nav>
    </div>
  )
}

function TopBar({ pathname, prefix, locale, unreadNotifications, identity }: { pathname: string; prefix: string; locale: Locale; unreadNotifications: number; identity: Identity }) {
  const router = useRouter()
  const route = pathname.replace(prefix, "") || "/dashboard"
  const title = pageTitles[route] ?? "LBID"
  const [search, setSearch] = useState("")
  const today = new Intl.DateTimeFormat(locale === "zh" ? "zh-HK" : "en-HK", { month: "short", day: "numeric", year: "numeric" }).format(new Date())

  return (
    <header className="workspace-topbar sticky top-0 z-30 flex h-[62px] items-center justify-between border-b border-[#e7eaf0] bg-white/86 px-4 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <Link href={`${prefix}/dashboard`} className="flex w-[120px] items-center lg:hidden" aria-label="LBID workspace">
          <Image src="/assets/lbid-web-logo.svg" alt="LBID" width={124} height={38} priority className="h-auto w-[118px] object-contain object-left" />
        </Link>
        <div className="hidden lg:block"><p className="text-[12px] font-semibold text-[#1c2943]">{title}</p><p className="mt-0.5 text-[9px] text-[#8b96a8]">{today}</p></div>
        <form className="relative hidden xl:block" onSubmit={(event) => { event.preventDefault(); if (search.trim()) router.push(`${prefix}/marketplace?q=${encodeURIComponent(search.trim())}`) }}>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8c97aa]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={locale === "zh" ? "搜尋需求、航線或訂單…" : "Search requests, routes, orders…"} className="h-9 w-[310px] rounded-[8px] border border-[#e5e9f1] bg-[#fbfcff] pl-9 pr-12 text-[10.5px] text-[#2e3a52] outline-none transition focus:border-[#7f89f5] focus:bg-white focus:shadow-[0_0_0_3px_rgba(100,112,242,0.08)]" />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-[#f0f2f6] px-1.5 py-0.5 text-[8px] text-[#7f899b]">Enter</kbd>
        </form>
      </div>

      <div className="flex items-center gap-1.5">
        <Link href={`${prefix}/community`} title="Community" className="hidden h-9 w-9 items-center justify-center rounded-[8px] border border-transparent text-[#68758c] transition hover:border-[#e5e9f1] hover:bg-white hover:text-[#27344d] sm:flex"><MessageCircle className="h-4 w-4" /></Link>
        <Link href={`${prefix}/profile`} title={identity?.companyName || "Company account"} className="grid h-9 w-9 place-items-center rounded-full border border-[#e2e7ef] bg-white text-[9px] font-bold text-[#263650] shadow-sm transition hover:border-[#aebbd0] hover:text-[#315ee8] lg:hidden">{initials(identity?.companyName || "LBID Company")}</Link>
        <Link href={`${prefix}/notifications`} title="Notifications" className="relative flex h-9 w-9 items-center justify-center rounded-[8px] border border-transparent text-[#68758c] transition hover:border-[#e5e9f1] hover:bg-white hover:text-[#27344d]">
          <Bell className="h-4 w-4" />
          {unreadNotifications > 0 ? <span className="absolute right-1.5 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ef5454] px-1 text-[8px] font-bold text-white">{Math.min(unreadNotifications, 9)}</span> : null}
        </Link>
        <Link href={`${prefix}/workflow`} title="Help" className="hidden h-9 w-9 items-center justify-center rounded-[8px] border border-transparent text-[#68758c] transition hover:border-[#e5e9f1] hover:bg-white hover:text-[#27344d] sm:flex"><CircleHelp className="h-4 w-4" /></Link>
        <Link href={`${prefix}/inquiries/new`} className="ml-1 inline-flex h-9 items-center gap-2 rounded-[8px] bg-[#102544] px-3.5 text-[10.5px] font-semibold text-white shadow-[0_8px_20px_rgba(16,37,68,0.18)] transition hover:bg-[#18365e]"><Plus className="h-3.5 w-3.5" /><span className="hidden sm:inline">New Request</span></Link>
      </div>
    </header>
  )
}

function AccountMenu({ locale, prefix, identity }: { locale: Locale; prefix: string; identity: Identity }) {
  const rank = identity?.rank || "bronze"
  const style = rankStyles[rank]

  const signOut = async () => {
    await getSupabaseBrowserClient()?.auth.signOut()
    window.location.href = `${prefix}/auth`
  }

  return (
    <details className="group relative">
      <summary className="list-none cursor-pointer rounded-[10px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6470ef]/25 [&::-webkit-details-marker]:hidden" title={`${style.label} reputation rank`}>
        <span className={`block rounded-[11px] p-[1.5px] transition duration-200 group-open:shadow-lg ${style.glow}`} style={{ background: style.frame }}>
          <span className="flex items-center gap-2.5 rounded-[9.5px] bg-white px-2.5 py-2.5">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-[#eef1f7] text-[10px] font-bold text-[#223252]">{initials(identity?.companyName || "LBID Company")}</span>
            <span className="min-w-0 flex-1"><span className="block truncate text-[11.5px] font-semibold text-[#1c2943]">{identity?.companyName || "LBID Company"}</span><span className="mt-0.5 block text-[8.5px] text-[#8a95a7]">{identity ? "Company workspace" : "Demo workspace"}</span></span>
            <ChevronRight className="h-3.5 w-3.5 text-[#a3acbb] transition group-open:rotate-[-90deg]" />
          </span>
        </span>
      </summary>

      <div className="absolute bottom-[calc(100%+10px)] left-0 z-50 w-[260px] overflow-hidden rounded-[10px] border border-[#e4e8f0] bg-white shadow-[0_20px_48px_rgba(23,35,64,0.16)]">
        <div className="border-b border-[#edf0f5] px-4 py-3"><p className="truncate text-[11.5px] font-semibold text-[#1d2942]">{identity?.companyName || "LBID Company"}</p><div className="mt-1 flex items-center gap-2 text-[8.5px]"><span className="font-semibold" style={{ color: rankColor(rank) }}>{style.label} Rank</span><span className="text-[#c1c7d1]">•</span><span className="text-[#7f8a9e]">{planLabel(identity?.plan)}</span></div></div>
        <div className="p-2">
          <AccountLink href={`${prefix}/profile`} icon={Building2}>Company profile</AccountLink>
          <AccountLink href={`${prefix}/tokens`} icon={WalletCards}>Token wallet <span className="ml-auto text-[9px] font-semibold text-[#6773ed]">{identity?.tokens || 0}</span></AccountLink>
          <AccountLink href={`${prefix}/subscription`} icon={CreditCard}>Membership & billing</AccountLink>
          <AccountLink href={`${prefix}/profile`} icon={Settings}>Workspace settings</AccountLink>
        </div>
        <div className="border-t border-[#edf0f5] p-2"><button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2.5 rounded-[7px] px-3 py-2 text-left text-[10.5px] font-medium text-[#be4e4e] transition hover:bg-[#fff2f2]"><LogOut className="h-3.5 w-3.5" />Sign out</button></div>
      </div>
    </details>
  )
}

function AccountLink({ href, icon: Icon, children }: { href: string; icon: typeof Building2; children: React.ReactNode }) {
  return <Link href={href} className="flex items-center gap-2.5 rounded-[7px] px-3 py-2 text-[10.5px] font-medium text-[#4d5a71] transition hover:bg-[#f5f7fc] hover:text-[#26334d]"><Icon className="h-3.5 w-3.5 text-[#7d89a0]" />{children}</Link>
}

function SidebarLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 mt-3 px-5 text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#9aa4b5]">{children}</p>
}

function NavSection({ items, pathname, admin = false }: { items: NavItem[]; pathname: string; admin?: boolean }) {
  return <nav className="flex flex-col gap-0.5 px-3">{items.map((item) => { const active = isActive(pathname, item); return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[11.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6470ef]/25 ${active ? admin ? "bg-[#fff2e8] text-[#b45b23]" : "bg-[linear-gradient(90deg,#fff2e6,#f8f2ed)] text-[#b46a2e] shadow-[inset_2px_0_0_#e88a42]" : "text-[#506078] hover:bg-[#f5f7fb] hover:text-[#1f2d47]"}`}><item.icon className="h-4 w-4 flex-shrink-0" strokeWidth={active ? 2.2 : 1.7} /><span className="truncate">{item.label}</span></Link> })}</nav>
}

function MobileNavItem({ item, active }: { item: NavItem; active: boolean }) {
  return <Link href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-[7px] text-[9.5px] font-semibold transition ${active ? "bg-[#f0f2ff] text-[#5664ea]" : "text-[#7d899d]"}`}><item.icon className="h-4 w-4" /><span>{item.label}</span></Link>
}

function isActive(pathname: string, item: NavItem) { return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`) }
function initials(value: string) { return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() }
function normalizeRank(value: unknown): ReputationRank { const rank = String(value || "bronze").toLowerCase(); return ["bronze", "silver", "gold", "platinum", "diamond", "emerald"].includes(rank) ? rank as ReputationRank : "bronze" }
function rankColor(rank: ReputationRank) { return { bronze: "#a9602d", silver: "#77869a", gold: "#b78316", platinum: "#7591af", diamond: "#6b70e8", emerald: "#0f9864" }[rank] }
function planLabel(plan?: string) { if (plan === "annual" || plan === "premium") return "Premium Member"; if (plan === "monthly" || plan === "standard") return "Standard Member"; if (plan === "partner") return "Partner"; if (plan === "trial") return "Trial Member"; return "Free Member" }
