import { notFound } from "next/navigation"

import { SiteShell } from "@/components/site-shell"
import { SessionGate } from "@/components/auth/session-gate"
import { isLocale, type Locale } from "@/lib/i18n"

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "en" }]
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  if (!isLocale(params.locale)) notFound()

  const locale = params.locale as Locale
  return <SessionGate locale={locale}><SiteShell locale={locale}>{children}</SiteShell></SessionGate>
}
