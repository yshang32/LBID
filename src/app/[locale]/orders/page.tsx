import { OrderListPanel } from "@/components/orders/order-list-panel"
import { isLocale, type Locale } from "@/lib/i18n"

export default function OrdersPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <OrderListPanel locale={locale} />
}
