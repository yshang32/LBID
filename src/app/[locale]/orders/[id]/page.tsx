import { UnifiedWorkspacePage } from "@/components/workspace/unified-workspace-page"
import { isLocale, type Locale } from "@/lib/i18n"

export default function OrderWorkspacePage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <UnifiedWorkspacePage locale={locale} kind="order-detail" id={params.id} />
}
