import { LiveDashboardPanel } from "@/components/dashboard/live-dashboard-panel"
import { isLocale, type Locale } from "@/lib/i18n"

export default function LocalizedDashboardPage({ params, searchParams }: { params: { locale: string }; searchParams?: { mode?: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const mode = searchParams?.mode === "admin" ? "admin" : "company"

  return (
    <main className="mx-auto w-full max-w-7xl px-5 pb-12 pt-9 sm:px-8 lg:px-10">
      <LiveDashboardPanel locale={locale} mode={mode} />
    </main>
  )
}
