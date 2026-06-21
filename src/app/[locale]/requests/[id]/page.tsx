import { RequestWorkflowPanel } from "@/components/shipment-requests/request-workflow-panel"
import { isLocale, type Locale } from "@/lib/i18n"

export default function RequestDetailPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <RequestWorkflowPanel locale={locale} requestId={params.id} />
}
