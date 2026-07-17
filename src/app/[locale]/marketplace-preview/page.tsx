import { notFound } from "next/navigation"

import { BiddingCommandCenter } from "@/components/marketplace/bidding-command-center"
import { isLocale, type Locale } from "@/lib/i18n"

export default function MarketplacePreviewPage({ params }: { params: { locale: string } }) {
  if (process.env.NODE_ENV !== "development") notFound()

  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  return <BiddingCommandCenter locale={locale} previewMode />
}
