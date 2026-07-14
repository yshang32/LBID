import { PromoPage } from "@/components/promo/promo-page"
import { isLocale, type Locale } from "@/lib/i18n"

export default function LocalizedHomePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <PromoPage locale={locale} />
}
