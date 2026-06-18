import { Badge } from "@/components/ui/badge"
import { LiveMarketplaceList } from "@/components/marketplace/live-marketplace-list"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Marketplace",
    title: "所有可 Bid 嘅 Shipment Request",
    intro: "階段 1 只顯示足夠判斷是否適合接單的資料。完整地址、公司身份和聯絡方式會在中標後解鎖。",
    bid: "立即 Bid -1 Token",
    priority: "Priority Bid -2 Tokens",
    sealed: "Sealed bid：其他 forwarder 報價保持隱藏，避免價格戰。",
    detail: "查看 SR 詳情",
    deadline: "截標",
    slots: "名額",
    left: "剩",
  },
  en: {
    badge: "Marketplace",
    title: "Open Shipment Requests",
    intro: "Stage 1 shows enough information to decide whether to bid. Full address, company identity and contacts unlock only after award.",
    bid: "Bid Now -1 Token",
    priority: "Priority Bid -2 Tokens",
    sealed: "Sealed bid: competitor prices stay hidden to avoid race-to-the-bottom pricing.",
    detail: "View SR detail",
    deadline: "Deadline",
    slots: "slots",
    left: "left",
  },
}

export default function MarketplacePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
      </section>

      <LiveMarketplaceList locale={locale} />
    </main>
  )
}
