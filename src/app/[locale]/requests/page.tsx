import { RequestListPanel } from "@/components/shipment-requests/request-list-panel"
import { isLocale, type Locale } from "@/lib/i18n"

export default function RequestsPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <RequestListPanel locale={locale} />
}
