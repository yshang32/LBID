import { redirect } from "next/navigation"

import { isLocale, type Locale } from "@/lib/i18n"

export default function DirectoryAliasPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  redirect(`/${locale}/forwarders`)
}
