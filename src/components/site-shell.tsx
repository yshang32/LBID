import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { dictionary, type Locale } from "@/lib/i18n"

export function SiteShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const t = dictionary[locale]
  const prefix = `/${locale}`

  const nav = [
    { href: `${prefix}/forwarders`, label: t.nav.forwarders },
    { href: `${prefix}/dashboard?role=forwarder`, label: t.nav.dashboard },
    { href: `${prefix}/profile`, label: t.nav.profile },
    { href: `${prefix}/tokens`, label: t.nav.tokens },
    { href: `${prefix}/subscription`, label: t.nav.subscription },
    { href: `${prefix}/workflow`, label: t.nav.workflow },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-lblue/10 bg-white/90 shadow-[0_10px_30px_rgba(27,43,94,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            href={prefix}
            className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-[#202833] bg-[#0d1116] shadow-[0_8px_20px_rgba(13,17,22,0.14)]"
          >
            <Image
              src="/assets/lbid-app-icon.png"
              alt="LBID"
              width={44}
              height={44}
              className="h-full w-full object-cover"
              priority
            />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Button key={item.href} asChild variant="ghost" size="sm">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={t.otherHref}>{t.otherLang}</Link>
            </Button>
            <Button asChild variant="gold" size="sm">
              <Link href={`${prefix}/inquiries/new`}>{t.nav.cta}</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
    </>
  )
}
