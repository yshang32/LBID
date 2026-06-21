"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  BriefcaseBusiness,
  ChevronRight,
  FileText,
  Globe2,
  Home,
  PackagePlus,
  Search,
  UserCircle,
  Wallet,
} from "lucide-react"

import { BrandMark } from "@/components/brand-mark"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/i18n"
import { v4Status } from "@/lib/v4"

type NavItem = { href: string; label: string; icon: typeof Home }

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const pathname = usePathname()
  const prefix = `/${locale}`

  if (pathname === `${prefix}/auth`) return <>{children}</>

  const copy = locale === "zh"
    ? {
        search: "搜尋需求、公司或訂單編號",
        workspace: "工作區",
        network: "網絡",
        account: "帳戶",
        tokens: "Token",
        language: "EN",
        nav: [
          { href: `${prefix}/dashboard`, label: "工作台", icon: Home },
          { href: `${prefix}/marketplace`, label: "接單市場", icon: BriefcaseBusiness },
          { href: `${prefix}/inquiries/new`, label: "建立需求", icon: PackagePlus },
          { href: `${prefix}/matches/MATCH-1234`, label: "訂單記錄", icon: FileText },
        ],
        networkNav: [{ href: `${prefix}/forwarders`, label: "公司目錄", icon: Globe2 }],
        accountNav: [
          { href: `${prefix}/tokens`, label: "Token 錢包", icon: Wallet },
          { href: `${prefix}/profile`, label: "公司檔案", icon: UserCircle },
        ],
      }
    : {
        search: "Search requests, companies or order IDs",
        workspace: "Workspace",
        network: "Network",
        account: "Account",
        tokens: "Tokens",
        language: "中文",
        nav: [
          { href: `${prefix}/dashboard`, label: "Dashboard", icon: Home },
          { href: `${prefix}/marketplace`, label: "Marketplace", icon: BriefcaseBusiness },
          { href: `${prefix}/inquiries/new`, label: "Create request", icon: PackagePlus },
          { href: `${prefix}/matches/MATCH-1234`, label: "Orders", icon: FileText },
        ],
        networkNav: [{ href: `${prefix}/forwarders`, label: "Directory", icon: Globe2 }],
        accountNav: [
          { href: `${prefix}/tokens`, label: "Token wallet", icon: Wallet },
          { href: `${prefix}/profile`, label: "Company profile", icon: UserCircle },
        ],
      }

  const otherLocale = locale === "zh" ? "en" : "zh"
  const otherHref = pathname.replace(`/${locale}`, `/${otherLocale}`)
  const mobileNav = copy.nav.slice(0, 4)

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-lblue/10 bg-white/95">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link href={prefix} className="flex h-11 w-[166px] shrink-0 items-center" aria-label="LBID home">
            <BrandMark markClassName="h-10 w-[154px]" />
          </Link>
          <button type="button" className="hidden h-10 max-w-2xl flex-1 items-center gap-2 rounded-md border border-lblue/10 bg-slate-50 px-3 text-left text-sm text-muted-foreground transition hover:bg-white md:flex">
            <Search className="h-4 w-4" />
            <span>{copy.search}</span>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <Link href={`${prefix}/tokens`} className="hidden h-9 items-center gap-2 rounded-md border border-lgold/30 bg-[#fcf8ec] px-3 text-sm font-semibold text-[#725b1d] sm:flex">
              <Wallet className="h-4 w-4" />
              {v4Status.tokens} {copy.tokens}
            </Link>
            <Link href={`${prefix}/notifications`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-lblue transition hover:bg-slate-100" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {v4Status.notifications ? <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" /> : null}
            </Link>
            <Button asChild variant="outline" size="sm"><Link href={otherHref}>{copy.language}</Link></Button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-60 border-r border-lblue/10 bg-white px-3 py-5 lg:block">
        <SideGroup label={copy.workspace} items={copy.nav} pathname={pathname} />
        <SideGroup label={copy.network} items={copy.networkNav} pathname={pathname} className="mt-7" />
        <SideGroup label={copy.account} items={copy.accountNav} pathname={pathname} className="mt-7" />
      </aside>

      <div className="min-h-screen pb-20 pt-16 lg:pl-60 lg:pb-0">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-lblue/10 bg-white px-2 py-2 lg:hidden">
        {mobileNav.map((item) => {
          const active = pathname === item.href.split("?")[0]
          return <Link key={item.href} href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] font-semibold ${active ? "bg-slate-100 text-lblue" : "text-slate-500"}`}><item.icon className="h-5 w-5" /><span>{item.label}</span></Link>
        })}
      </nav>
    </div>
  )
}

function SideGroup({ label, items, pathname, className = "" }: { label: string; items: NavItem[]; pathname: string; className?: string }) {
  return (
    <section className={className}>
      <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p>
      <nav className="space-y-1">
        {items.map((item) => {
          const active = pathname === item.href.split("?")[0]
          return <Link key={item.href} href={item.href} className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${active ? "bg-[#edf1fb] text-lblue" : "text-slate-600 hover:bg-slate-50 hover:text-lblue"}`}><item.icon className="h-4 w-4" /><span className="flex-1">{item.label}</span>{active ? <ChevronRight className="h-4 w-4" /> : null}</Link>
        })}
      </nav>
    </section>
  )
}
