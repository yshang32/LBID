"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import {
  BarChart2,
  Bell,
  Briefcase,
  Building2,
  ChevronRight,
  Crown,
  FileText,
  HelpCircle,
  LayoutDashboard,
  Map,
  MessageCircle,
  Package,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react"
import { usePathname } from "next/navigation"

import { apiJson } from "@/lib/api-client"
import type { Locale } from "@/lib/i18n"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type Identity = {
  companyName: string
  plan: string
  tokens: number
  role: string | null
} | null

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  badge?: number
  badgeRed?: boolean
  exact?: boolean
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Today",
  "/marketplace": "Opportunities",
  "/active-bids": "Active Bids",
  "/my-routes": "My Routes",
  "/analytics": "Analytics",
  "/requests": "My Requests",
  "/inquiries/new": "New Request",
  "/quotations/compare": "Compare Bids",
  "/orders": "Orders",
  "/community": "Community",
  "/demo-cases": "Demo Cases",
  "/forwarders": "Forwarder Directory",
  "/profile": "Company Profile",
  "/subscription": "Membership",
  "/tokens": "Token Wallet",
  "/notifications": "Notifications",
  "/admin": "Admin Dashboard",
  "/admin/shipment-requests": "Admin · Requests",
  "/admin/accounts": "Admin · Accounts",
  "/admin/pending-payments": "Admin · Payments",
}

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = `/${locale}`
  const [identity, setIdentity] = useState<Identity>(null)

  useEffect(() => {
    const client = getSupabaseBrowserClient()
    if (!client) return
    let mounted = true
    const loadIdentity = async (signedIn: boolean) => {
      if (!signedIn || !mounted) {
        setIdentity(null)
        return
      }
      const { response, body } = await apiJson("/api/company-profile")
      if (!mounted || !response.ok) return
      const profile = body.companyProfile || {}
      setIdentity({
        companyName: profile.company_name_en || profile.company_name_zh || "Pacific Forward Ltd.",
        plan: body.subscription?.plan || "monthly",
        tokens: Number(profile.token_balance_free || 0) + Number(profile.token_balance_paid || 0),
        role: body.role || null,
      })
    }
    client.auth.getSession().then(({ data }) => void loadIdentity(Boolean(data.session)))
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => void loadIdentity(Boolean(session)))
    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const standalone = pathname === `${prefix}/auth`
  if (standalone) return <>{children}</>

  const primary: NavItem[] = [
    { href: `${prefix}/dashboard`, label: "Today", icon: LayoutDashboard, exact: true },
    { href: `${prefix}/marketplace`, label: "Opportunities", icon: Send },
    { href: `${prefix}/active-bids`, label: "Active Bids", icon: Briefcase },
    { href: `${prefix}/requests`, label: "My Requests", icon: FileText },
    { href: `${prefix}/orders`, label: "Orders", icon: Package },
    { href: `${prefix}/notifications`, label: "Notifications", icon: Bell, badge: 2, badgeRed: true },
  ]
  const secondary: NavItem[] = [
    { href: `${prefix}/my-routes`, label: "My Routes", icon: Map },
    { href: `${prefix}/analytics`, label: "Analytics", icon: BarChart2 },
    { href: `${prefix}/forwarders`, label: "Directory", icon: Users },
    { href: `${prefix}/community`, label: "Community", icon: MessageCircle },
    { href: `${prefix}/demo-cases`, label: "Demo Cases", icon: Sparkles },
  ]
  const account: NavItem[] = [
    { href: `${prefix}/tokens`, label: "Token Wallet", icon: Zap, badge: identity?.tokens || 0 },
    { href: `${prefix}/profile`, label: "Profile", icon: Building2 },
    { href: `${prefix}/subscription`, label: "Membership", icon: Crown },
  ]
  const admin: NavItem[] = [
    { href: `${prefix}/admin`, label: "Admin", icon: ShieldCheck, exact: true },
    { href: `${prefix}/admin/shipment-requests`, label: "Requests", icon: FileText },
    { href: `${prefix}/admin/accounts`, label: "Accounts", icon: Building2 },
    { href: `${prefix}/admin/pending-payments`, label: "Payments", icon: Crown },
  ]

  return (
    <div className="flex h-screen overflow-hidden font-sans text-ink" style={{ background: "linear-gradient(150deg, #F0F2F8 0%, #ECEEF5 100%)" }}>
      <aside className="hidden w-[228px] flex-shrink-0 flex-col border-r border-line bg-white lg:flex">
        <Link href={`${prefix}/dashboard`} className="h-[88px] overflow-hidden" aria-label="LBID workspace">
          <img src="/assets/lbid-figma-25jun-logo.png?v=20260625" alt="LBID Logistics Bidding Platform" className="-ml-3 -mt-7 block h-auto w-[272px] select-none mix-blend-multiply" draggable={false} />
        </Link>

        <div className="mb-3 px-3">
          <Link href={`${prefix}/inquiries/new`} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-2 text-[12.5px] font-medium text-ink-3 transition-all duration-200 ease-in-out hover:border-navy hover:bg-navy-soft hover:text-navy">
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            New Request
          </Link>
        </div>

        <NavSection items={primary} pathname={pathname} />

        <div className="mb-1 mt-1 flex flex-col gap-0.5 border-t border-line-light px-3 pt-2">
          <NavSection items={secondary} pathname={pathname} compact />
        </div>

        <div className="mb-1 flex flex-col gap-0.5 px-3">
          <NavSection items={account} pathname={pathname} />
        </div>

        {identity?.role === "admin" ? (
          <div className="mb-2 mt-1 border-t border-line-light px-3 pt-2">
            <p className="mb-1 px-3 text-[9.5px] font-bold uppercase tracking-[0.09em] text-ink-3">Admin</p>
            <NavSection items={admin} pathname={pathname} compact admin />
          </div>
        ) : null}

        <div className="mt-auto flex flex-col gap-3 border-t border-line-light px-3 pb-6 pt-3">
          <Link href={`${prefix}/profile`} className="flex w-full items-center gap-3 rounded-xl px-3 py-[9px] text-left text-[13px] font-normal text-ink-2 transition-all duration-200 ease-in-out hover:bg-navy-soft hover:text-ink">
            <Settings className="h-[15px] w-[15px] flex-shrink-0" strokeWidth={1.75} />
            Settings
          </Link>

          <Link href={`${prefix}/subscription`} className="rounded-[13px] p-[1.5px]" style={{ background: "linear-gradient(135deg, #E8D9A0, #C49A3C 50%, #E8D9A0)" }}>
            <span className="flex flex-col gap-1.5 rounded-[11.5px] bg-gold-soft px-3 py-2.5">
              <span className="flex items-center gap-2">
                <span className="grid h-[18px] w-[18px] flex-shrink-0 place-items-center rounded-full bg-gold text-white">
                  <Crown className="h-2.5 w-2.5" />
                </span>
                <span className="select-none text-[10.5px] font-bold uppercase tracking-[0.07em] text-gold-dark">{planLabel(identity?.plan)}</span>
              </span>
              <span className="text-[11px] leading-[1.4] text-gold">Priority access · 3 routes certified</span>
            </span>
          </Link>

          <Link href={`${prefix}/profile`} className="group flex items-center gap-2.5 px-1">
            <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-line bg-navy-soft text-[11px] font-bold text-navy transition-all duration-200 group-hover:border-navy/30">
              {initials(identity?.companyName || "Kenny Lam")}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium text-ink">{identity?.companyName || "Kenny Lam"}</span>
              <span className="block truncate text-[11px] text-ink-3">Pacific Forward Ltd.</span>
            </span>
            <ChevronRight className="h-3.5 w-3.5 flex-shrink-0 text-line transition-colors duration-200 group-hover:text-ink-3" strokeWidth={2} />
          </Link>
        </div>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopBar pathname={pathname} prefix={prefix} identity={identity} />
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "thin", scrollbarColor: "#D1D6E0 transparent" }}>
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
        {primary.slice(0, 4).map((item) => <MobileNavItem key={item.href} item={item} active={isActive(pathname, item)} />)}
      </nav>
    </div>
  )
}

function TopBar({ pathname, prefix, identity }: { pathname: string; prefix: string; identity: Identity }) {
  const route = pathname.replace(prefix, "") || "/dashboard"
  const title = pageTitles[route] ?? "LBID"
  const company = identity?.companyName || "Workspace"
  const tokens = identity?.tokens ?? 0
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-white/80 px-5 backdrop-blur-xl sm:px-9">
      <div className="flex min-w-0 items-center gap-3">
        <span className="truncate text-[14px] font-semibold tracking-[-0.2px] text-ink">{title}</span>
        <span className="hidden border-l border-line pl-3 text-[13px] text-ink-3 md:inline">Tuesday, 23 June 2026</span>
      </div>
      <div className="flex items-center gap-1">
        <IconBtn aria-label="Search"><Search className="h-4 w-4" strokeWidth={1.75} /></IconBtn>
        <div className="relative">
          <IconBtn aria-label="Notifications"><Bell className="h-4 w-4" strokeWidth={1.75} /></IconBtn>
          <span aria-hidden className="pointer-events-none absolute right-[8px] top-[8px] h-[5px] w-[5px] rounded-full border-[1.5px] border-white bg-gold" />
        </div>
        <IconBtn aria-label="Help"><HelpCircle className="h-4 w-4" strokeWidth={1.75} /></IconBtn>
        <div className="mx-1 hidden h-5 w-px bg-line sm:block" />
        <Link href={`${prefix}/tokens`} className="hidden items-center gap-2 rounded-lg border border-gold-border bg-gold-soft px-3 py-1.5 text-[12px] font-semibold text-gold-dark shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition hover:-translate-y-px hover:bg-[#fff2c8] sm:flex">
          <Zap className="h-3.5 w-3.5" />
          {tokens} Token
        </Link>
        <Link href={`${prefix}/subscription`} className="hidden items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 text-[12px] font-semibold text-navy shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition hover:-translate-y-px hover:border-gold-border md:flex">
          <Crown className="h-3.5 w-3.5 text-gold" />
          {planLabel(identity?.plan)}
        </Link>
        <div className="hidden items-center gap-2 rounded-lg border border-line bg-white px-3 py-1.5 shadow-[0_1px_4px_rgba(0,0,0,0.05)] sm:flex">
          <span className="h-[6px] w-[6px] flex-shrink-0 rounded-full bg-emerald" />
          <span className="text-[12px] font-medium text-ink-2">Signed in</span>
        </div>
        <Link href={`${prefix}/profile`} className="ml-1 flex h-9 items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 shadow-[0_1px_4px_rgba(0,0,0,0.05)] transition hover:-translate-y-px hover:border-navy/20">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-navy text-[10px] font-bold text-white">{initials(company)}</span>
          <span className="hidden max-w-[120px] truncate text-[12px] font-semibold text-ink md:block">{company}</span>
        </Link>
      </div>
    </header>
  )
}

function IconBtn({ children, "aria-label": label }: { children: React.ReactNode; "aria-label": string }) {
  return (
    <button aria-label={label} className="flex h-[34px] w-[34px] items-center justify-center rounded-lg text-ink-3 transition-all duration-200 ease-in-out hover:bg-white hover:text-ink hover:shadow-[0_1px_6px_rgba(0,0,0,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 active:scale-95">
      {children}
    </button>
  )
}

function NavSection({ items, pathname, compact = false, admin = false }: { items: NavItem[]; pathname: string; compact?: boolean; admin?: boolean }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item)
        return (
          <Link key={item.href} href={item.href} className={`relative flex items-center gap-3 rounded-xl px-3 ${compact ? "py-[8px] text-[12.5px]" : "py-[9px] text-[13px]"} transition-all duration-200 ease-in-out ${active ? (admin ? "bg-amber-600 font-medium text-white" : "bg-navy font-medium text-white") : admin ? "text-ink-3 hover:bg-amber-50 hover:text-amber-700" : "text-ink-2 hover:bg-navy-soft hover:text-ink"}`}>
            <item.icon className={compact ? "h-[14px] w-[14px] flex-shrink-0" : "h-[15px] w-[15px] flex-shrink-0"} strokeWidth={active ? 2.2 : 1.75} />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
            {item.badge && !active ? (
              <span className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${item.badgeRed ? "bg-red-500 text-white" : "border border-gold-border bg-gold-soft text-gold-dark"}`}>
                {item.badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </nav>
  )
}

function MobileNavItem({ item, active }: { item: NavItem; active: boolean }) {
  return <Link href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-semibold transition ${active ? "bg-navy-soft text-navy" : "text-ink-3"}`}><item.icon className="h-4 w-4" /><span>{item.label}</span></Link>
}

function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)
}
function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase()
}
function planLabel(plan?: string) {
  if (plan === "annual" || plan === "premium") return "Premium Member"
  if (plan === "monthly" || plan === "standard") return "Standard Member"
  if (plan === "partner") return "Partner"
  if (plan === "free") return "Free Member"
  return "Standard Member"
}
