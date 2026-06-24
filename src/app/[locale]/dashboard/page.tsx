import { LiveDashboardPanel } from "@/components/dashboard/live-dashboard-panel"
import { isLocale, type Locale } from "@/lib/i18n"

export default function LocalizedDashboardPage({ params, searchParams }: { params: { locale: string }; searchParams?: { mode?: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const mode = searchParams?.mode === "admin" ? "admin" : "company"

  return <div className="px-5 sm:px-8 lg:px-9"><LiveDashboardPanel locale={locale} mode={mode} /></div>
}
