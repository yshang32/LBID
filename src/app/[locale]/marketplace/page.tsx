import Link from "next/link"
import { Clock3, LockKeyhole, Rocket, ShieldCheck, Star, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4ShipmentRequests } from "@/lib/v4"

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

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {v4ShipmentRequests.map((request) => {
          const remaining = request.totalSlots - request.usedSlots
          const filled = Math.round((request.usedSlots / request.totalSlots) * 100)
          return (
            <Card key={request.id} className={request.hot ? "border-red-200" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge variant={request.hot ? "gold" : "secondary"}>{request.id}</Badge>
                    <CardTitle className="mt-3">{locale === "zh" ? request.lane : request.laneEn}</CardTitle>
                  </div>
                  <div className="rounded-md bg-red-50 px-2 py-1 text-right text-red-700">
                    <Clock3 className="ml-auto h-4 w-4" />
                    <div className="text-[10px] font-bold uppercase">{t.deadline}</div>
                    <div className="font-mono text-sm font-black">{request.deadline}</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="font-semibold text-lblue">{request.cargo}</div>
                  <div className="text-sm text-muted-foreground">{request.routeMask}</div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm font-semibold">
                    <span>{request.usedSlots}/{request.totalSlots} {t.slots}</span>
                    <span className={remaining <= 2 ? "text-red-600" : "text-lblue"}>{t.left} {remaining}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${remaining <= 2 ? "bg-red-600" : "bg-lgold"}`} style={{ width: `${filled}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Mini icon={Star} label="Score" value={`>= ${request.reputationRequired}`} />
                  <Mini icon={Users} label="Budget" value={request.budgetLevel} />
                </div>
                <div className="rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm text-muted-foreground">
                  <LockKeyhole className="mr-1 inline h-4 w-4 text-lgold" />
                  {t.sealed}
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="gold">{t.bid}</Button>
                  <Button variant="outline">
                    <Rocket className="h-4 w-4" />
                    {t.priority}
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={`/${locale}/marketplace/${request.id}`}>{t.detail}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </section>
    </main>
  )
}

function Mini({ icon: Icon, label, value }: { icon: typeof ShieldCheck; label: string; value: string }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-white p-3">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Icon className="h-3 w-3 text-lgold" />
        {label}
      </div>
      <div className="font-black text-lblue">{value}</div>
    </div>
  )
}
