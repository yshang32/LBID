import { AnalyticsPanel } from "@/components/workspace/figma-workspace-panels"
import { isLocale, type Locale } from "@/lib/i18n"

export default function AnalyticsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <AnalyticsPanel locale={locale} />
}
