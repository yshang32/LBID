"use client"

import { useState } from "react"
import { Activity, CircleDot, MapPinned, ShieldCheck } from "lucide-react"

import { intelligenceRoutes, RouteDetailPanel, RouteIntelligenceMap, type IntelligenceRoute } from "@/components/dashboard/route-intelligence-map"
import { isLocale, type Locale } from "@/lib/i18n"

export default function NetworkMapPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const [selectedRoute, setSelectedRoute] = useState<IntelligenceRoute>(intelligenceRoutes[0])

  return (
    <main className="min-h-full bg-[linear-gradient(135deg,#f7f9fd,#eef3f8_52%,#f8fafc)] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1720px]">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-[#64748b]"><MapPinned className="h-4 w-4 text-[#315ee8]" />Route Intelligence</div>
            <h1 className="mt-2 text-[28px] font-semibold leading-tight text-[#12203a] sm:text-[34px]">{locale === "zh" ? "即時物流網絡" : "Live logistics network"}</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#69778d]">{locale === "zh" ? "按航線查看需求密度、回應速度、交付表現及風險。所有密封報價在關標前保持隱藏。" : "Inspect demand density, response speed, delivery performance and risk by route. Every sealed price remains hidden until close."}</p>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:min-w-[430px]">
            <NetworkStat icon={CircleDot} label={locale === "zh" ? "活躍航線" : "Active routes"} value="4" tone="#3374f6" />
            <NetworkStat icon={Activity} label={locale === "zh" ? "回應" : "Responses"} value="75" tone="#16a7a0" />
            <NetworkStat icon={ShieldCheck} label={locale === "zh" ? "高風險" : "High risk"} value="1" tone="#ef5d58" />
          </div>
        </header>

        <div className="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
          <RouteIntelligenceMap locale={locale} expanded selectedRouteId={selectedRoute.id} onRouteSelect={setSelectedRoute} />
          <RouteDetailPanel locale={locale} route={selectedRoute} />
        </div>
      </div>
    </main>
  )
}

function NetworkStat({ icon: Icon, label, value, tone }: { icon: typeof Activity; label: string; value: string; tone: string }) {
  return <div className="rounded-[8px] border border-[#e2e7ef] bg-white px-3 py-3 shadow-[0_8px_24px_rgba(26,45,82,0.05)]"><div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full" style={{ color: tone, backgroundColor: `${tone}14` }}><Icon className="h-3.5 w-3.5" /></span><span className="text-[10px] font-medium text-[#768398]">{label}</span></div><p className="mt-2 text-[20px] font-semibold tabular-nums text-[#17243d]">{value}</p></div>
}
