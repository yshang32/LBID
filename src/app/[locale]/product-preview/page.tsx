import { BusinessIntelligenceDashboard } from "@/components/dashboard/business-intelligence-dashboard"
import { UnifiedWorkspacePage } from "@/components/workspace/unified-workspace-page"
import { isLocale, type Locale } from "@/lib/i18n"

export default function ProductPreviewPage({ params, searchParams }: { params: { locale: string }; searchParams?: { view?: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  if (searchParams?.view === "bi") return <BusinessIntelligenceDashboard locale={locale} />
  return <UnifiedWorkspacePage locale={locale} kind="preview" />
}
