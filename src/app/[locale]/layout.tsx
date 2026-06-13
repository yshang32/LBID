import { notFound } from "next/navigation"

import { SiteShell } from "@/components/site-shell"
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

  return <SiteShell locale={params.locale as Locale}>{children}</SiteShell>
}
