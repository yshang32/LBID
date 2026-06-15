import Image from "next/image"
import Link from "next/link"
import {
  Bell,
  BriefcaseBusiness,
  Coins,
  Gem,
  Globe2,
  Home,
  MessageSquare,
  PackagePlus,
  Search,
  Settings,
  ShieldCheck,
  Star,
  UserCircle,
  Wallet,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { dictionary, type Locale } from "@/lib/i18n"
import { v4Status } from "@/lib/v4"

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = dictionary[locale]
  const prefix = `/${locale}`

  const nav = [
    { href: `${prefix}/dashboard?role=forwarder`, label: locale === "zh" ? "工作台" : "Dashboard", icon: Home },
    { href: `${prefix}/marketplace`, label: locale === "zh" ? "接單市場" : "Marketplace", icon: BriefcaseBusiness, badge: 8 },
    { href: `${prefix}/inquiries/new`, label: locale === "zh" ? "我的需求" : "My Requests", icon: PackagePlus, badge: 3 },
    { href: `${prefix}/matches/MATCH-1234`, label: locale === "zh" ? "配對記錄" : "Matches", icon: ShieldCheck, badge: 2 },
    { href: `${prefix}/forwarders`, label: locale === "zh" ? "公司目錄" : "Directory", icon: Globe2 },
    { href: `${prefix}/community`, label: locale === "zh" ? "社群" : "Community", icon: MessageSquare, badge: 5 },
    { href: `${prefix}/services`, label: locale === "zh" ? "增值服務" : "Services", icon: Gem },
    { href: `${prefix}/tokens`, label: locale === "zh" ? "Token 錢包" : "Tokens", icon: Wallet },
    { href: `${prefix}/profile`, label: locale === "zh" ? "公司檔案" : "Profile", icon: UserCircle },
    { href: `${prefix}/subscription`, label: locale === "zh" ? "會員方案" : "Membership", icon: Settings },
  ]

  const bottomNav = nav.slice(0, 5)

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-lblue/10 bg-white/[0.88] shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_12px_36px_rgba(27,43,94,0.08)] backdrop-blur-2xl">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <Link href={prefix} className="flex h-12 w-[158px] shrink-0 items-center">
            <Image
              src="/assets/lbid-logo-enterprise-light.png"
              alt="LBID"
              width={960}
              height={260}
              className="object-contain"
              style={{ width: "158px", height: "auto" }}
              priority
            />
          </Link>

          <div className="hidden h-10 flex-1 items-center gap-2 rounded-md border border-lblue/10 bg-white/70 px-3 text-sm text-muted-foreground shadow-[0_1px_0_rgba(255,255,255,0.9)_inset] md:flex">
            <Search className="h-4 w-4" />
            <span>{locale === "zh" ? "搜尋 SR、Forwarder、Match Record..." : "Search SR, forwarders, match records..."}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <StatusPill icon={Coins} value={`${v4Status.tokens}`} label="Token" tone="gold" />
            <StatusPill icon={Star} value={`${v4Status.reputation}`} label={locale === "zh" ? "信譽" : "Score"} tone="blue" />
            <StatusPill icon={Gem} value={v4Status.membership} label={locale === "zh" ? "會員" : "Plan"} tone="blue" hideOnMobile />
            <div className="relative hidden h-9 w-9 items-center justify-center rounded-md border border-lblue/10 bg-white/80 text-lblue shadow-[0_8px_18px_rgba(27,43,94,0.06)] sm:flex">
              <Bell className="h-4 w-4" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white">
                {v4Status.notifications}
              </span>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href={t.otherHref}>{t.otherLang}</Link>
            </Button>
          </div>
        </div>
      </header>

      <aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-64 border-r border-lblue/10 bg-white/[0.82] px-3 py-4 shadow-[1px_0_0_rgba(255,255,255,0.9)_inset,18px_0_55px_rgba(27,43,94,0.065)] backdrop-blur-2xl lg:block">
        <nav className="space-y-1">
          {nav.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
                index === 0 ? "bg-gradient-to-r from-lblue to-[#243a77] text-white shadow-[0_12px_26px_rgba(27,43,94,0.2)]" : "text-lblue hover:bg-white/80 hover:shadow-[0_8px_18px_rgba(27,43,94,0.05)]"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <Badge variant={index === 0 ? "secondary" : "gold"} className="px-1.5 py-0 text-[10px]">
                  {item.badge}
                </Badge>
              ) : null}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="pt-16 lg:pl-64">{children}</div>

      <nav className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-lblue/10 bg-white/[0.88] px-2 py-2 shadow-[0_-14px_38px_rgba(27,43,94,0.1)] backdrop-blur-2xl lg:hidden">
        {bottomNav.map((item) => (
          <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-1 rounded-md px-1 py-1 text-[11px] font-semibold text-lblue">
            <item.icon className="h-5 w-5" />
            <span className="max-w-full truncate">{item.label}</span>
            {item.badge ? <span className="absolute right-3 top-0 h-4 min-w-4 rounded-full bg-lgold px-1 text-[10px] font-black text-[#171104]">{item.badge}</span> : null}
          </Link>
        ))}
      </nav>
    </div>
  )
}

function StatusPill({
  icon: Icon,
  value,
  label,
  tone,
  hideOnMobile,
}: {
  icon: typeof Coins
  value: string
  label: string
  tone: "gold" | "blue"
  hideOnMobile?: boolean
}) {
  return (
    <div className={`h-9 items-center gap-2 rounded-md border px-2 text-sm font-bold shadow-[0_8px_18px_rgba(27,43,94,0.055)] ${hideOnMobile ? "hidden md:flex" : "flex"} ${
      tone === "gold" ? "border-lgold/25 bg-lgold/[0.12] text-[#6f5514]" : "border-lblue/10 bg-white/[0.78] text-lblue"
    }`}>
      <Icon className="h-4 w-4" />
      <span>{value}</span>
      <span className="hidden text-xs font-semibold text-muted-foreground sm:inline">{label}</span>
    </div>
  )
}
