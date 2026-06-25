import { DemoCaseLibrary } from "@/components/demo/demo-case-library"
import { isLocale, type Locale } from "@/lib/i18n"

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "en" }]
}

export default function DemoCasesPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <DemoCaseLibrary locale={locale} />
}
