import { RoutesPanel } from "@/components/workspace/figma-workspace-panels"
import { isLocale, type Locale } from "@/lib/i18n"

export default function MyRoutesPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <RoutesPanel locale={locale} />
}
