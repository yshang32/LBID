import { Badge } from "@/components/ui/badge"
import { LiveMarketplaceList } from "@/components/marketplace/live-marketplace-list"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: { badge: "接單市場", title: "每個開放需求，都是一次真實的密封競價機會。", intro: "優先處理即將截標的任務。其他 Forwarder 的身份、價格與條款均保持密封，直至競價窗口結束。" },
  en: { badge: "Marketplace", title: "Every open request is a real sealed-bid opportunity.", intro: "Prioritise missions approaching their deadline. Competitor identity, pricing and terms remain sealed until the bid window closes." },
}

export default function MarketplacePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="border-b border-lblue/10 pb-7"><Badge variant="gold">{t.badge}</Badge><h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{t.intro}</p></section><LiveMarketplaceList locale={locale} /></main>
}
