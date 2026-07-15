import { BusinessIntelligenceDashboard } from "@/components/dashboard/business-intelligence-dashboard"
import { isLocale, type Locale } from "@/lib/i18n"

export default function LocalizedDashboardPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <BusinessIntelligenceDashboard locale={locale} />
}
