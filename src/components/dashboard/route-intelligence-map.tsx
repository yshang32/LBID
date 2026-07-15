"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  CircleDot,
  Clock3,
  Layers3,
  MapPin,
  Maximize2,
  Plane,
  Ship,
  TrainFront,
  Truck,
  type LucideIcon,
} from "lucide-react"
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl"

import type { Locale } from "@/lib/i18n"

export type RouteMode = "air" | "sea" | "road" | "rail"
export type RouteStatus = "open" | "active" | "completed"
export type RouteRisk = "low" | "medium" | "high"

export type IntelligenceRoute = {
  id: string
  origin: string
  destination: string
  originCode: string
  destinationCode: string
  originCoordinates: [number, number]
  destinationCoordinates: [number, number]
  mode: RouteMode
  status: RouteStatus
  risk: RouteRisk
  activeRequests: number
  responseCount: number
  onTimeRate: number
  nextDeadline: string
  volumeLabel: string
}

type FeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Geometry, Record<string, string | number>>

const modeMeta: Record<RouteMode, { label: string; color: string; icon: LucideIcon }> = {
  air: { label: "Air", color: "#3374f6", icon: Plane },
  sea: { label: "Sea", color: "#16a7a0", icon: Ship },
  road: { label: "Road", color: "#f59a36", icon: Truck },
  rail: { label: "Rail", color: "#8065e8", icon: TrainFront },
}

export const intelligenceRoutes: IntelligenceRoute[] = [
  {
    id: "SGN-HKG-AIR",
    origin: "Ho Chi Minh City",
    destination: "Hong Kong",
    originCode: "SGN",
    destinationCode: "HKG",
    originCoordinates: [106.6602, 10.8188],
    destinationCoordinates: [113.9185, 22.308],
    mode: "air",
    status: "active",
    risk: "medium",
    activeRequests: 8,
    responseCount: 24,
    onTimeRate: 94.3,
    nextDeadline: "42 min",
    volumeLabel: "18.4 t",
  },
  {
    id: "TPE-HKG-AIR",
    origin: "Taipei",
    destination: "Hong Kong",
    originCode: "TPE",
    destinationCode: "HKG",
    originCoordinates: [121.2328, 25.0777],
    destinationCoordinates: [113.9185, 22.308],
    mode: "air",
    status: "open",
    risk: "low",
    activeRequests: 5,
    responseCount: 13,
    onTimeRate: 97.6,
    nextDeadline: "1 hr 18 min",
    volumeLabel: "9.8 t",
  },
  {
    id: "BKK-HKG-ROAD",
    origin: "Bangkok",
    destination: "Hong Kong",
    originCode: "BKK",
    destinationCode: "HKG",
    originCoordinates: [100.5018, 13.7563],
    destinationCoordinates: [114.1694, 22.3193],
    mode: "road",
    status: "active",
    risk: "high",
    activeRequests: 4,
    responseCount: 9,
    onTimeRate: 88.4,
    nextDeadline: "2 hr 05 min",
    volumeLabel: "42 pallets",
  },
  {
    id: "KUL-HKG-SEA",
    origin: "Port Klang",
    destination: "Hong Kong",
    originCode: "PKG",
    destinationCode: "HKG",
    originCoordinates: [101.3928, 3.0012],
    destinationCoordinates: [114.1373, 22.3209],
    mode: "sea",
    status: "active",
    risk: "low",
    activeRequests: 6,
    responseCount: 18,
    onTimeRate: 96.1,
    nextDeadline: "3 hr 12 min",
    volumeLabel: "28 TEU",
  },
  {
    id: "MNL-HKG-SEA",
    origin: "Manila",
    destination: "Hong Kong",
    originCode: "MNL",
    destinationCode: "HKG",
    originCoordinates: [120.9842, 14.5995],
    destinationCoordinates: [114.1373, 22.3209],
    mode: "sea",
    status: "completed",
    risk: "low",
    activeRequests: 3,
    responseCount: 11,
    onTimeRate: 98.2,
    nextDeadline: "Completed",
    volumeLabel: "14 TEU",
  },
]

export function RouteIntelligenceMap({
  locale,
  expanded = false,
  dashboard = false,
  routes = intelligenceRoutes,
  selectedRouteId,
  onRouteSelect,
}: {
  locale: Locale
  expanded?: boolean
  dashboard?: boolean
  routes?: IntelligenceRoute[]
  selectedRouteId?: string
  onRouteSelect?: (route: IntelligenceRoute) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [mode, setMode] = useState<RouteMode | "all">("all")
  const activeRouteId = selectedRouteId || routes[0]?.id
  const routeById = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes])
  const data = useMemo(() => buildGeoJson(routes), [routes])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    void import("maplibre-gl").then((module) => {
      if (cancelled || !containerRef.current) return
      const maplibregl = module.default
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: dashboard ? [18, 18] : [112.5, 16.5],
        zoom: dashboard ? 1.2 : expanded ? 3.7 : 3.25,
        minZoom: dashboard ? 0.8 : 2.4,
        maxZoom: 11,
        cooperativeGestures: true,
        attributionControl: false,
      })
      mapRef.current = map
      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "bottom-right")
      map.addControl(new maplibregl.FullscreenControl(), "bottom-right")
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left")

      map.on("load", () => {
        if (cancelled) return
        map.addSource("lbid-routes", { type: "geojson", data })
        map.addSource("lbid-nodes", { type: "geojson", data: buildNodeGeoJson(routes) })

        map.addLayer({
          id: "route-glow",
          type: "line",
          source: "lbid-routes",
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["case", ["==", ["get", "id"], activeRouteId || ""], 10, 7],
            "line-opacity": ["case", ["==", ["get", "status"], "completed"], 0.08, 0.14],
            "line-blur": 6,
          },
        })
        map.addLayer({
          id: "route-line",
          type: "line",
          source: "lbid-routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["case", ["==", ["get", "status"], "completed"], "#9aa5b4", ["get", "color"]],
            "line-width": ["case", ["==", ["get", "id"], activeRouteId || ""], 3.6, 2.1],
            "line-opacity": ["case", ["==", ["get", "status"], "completed"], 0.56, 0.9],
            "line-dasharray": ["case", ["==", ["get", "status"], "open"], ["literal", [2, 2]], ["literal", [1, 0]]],
          },
        })
        map.addLayer({
          id: "route-risk",
          type: "circle",
          source: "lbid-nodes",
          filter: ["all", ["==", ["get", "nodeType"], "destination"], ["==", ["get", "risk"], "high"]],
          paint: {
            "circle-radius": 18,
            "circle-color": "#ef5d58",
            "circle-opacity": 0.12,
            "circle-blur": 0.35,
          },
        })
        map.addLayer({
          id: "route-nodes",
          type: "circle",
          source: "lbid-nodes",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["get", "activeRequests"], 1, 5, 8, 9],
            "circle-color": ["get", "color"],
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-opacity": ["case", ["==", ["get", "status"], "completed"], 0.64, 1],
          },
        })

        const selectRoute = (event: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          const id = String(event.features?.[0]?.properties?.id || "")
          const route = routeById.get(id)
          if (route) onRouteSelect?.(route)
        }
        map.on("click", "route-line", selectRoute)
        map.on("click", "route-nodes", selectRoute)
        map.on("mouseenter", "route-line", () => { map.getCanvas().style.cursor = "pointer" })
        map.on("mouseleave", "route-line", () => { map.getCanvas().style.cursor = "" })

        setMapReady(true)
      })
      map.on("error", (event) => {
        if (event.error) setMapError(true)
      })
    }).catch(() => setMapError(true))

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [dashboard, data, expanded, onRouteSelect, routeById, routes])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map?.getLayer("route-line")) return
    const filter = mode === "all" ? null : ["==", ["get", "mode"], mode]
    for (const layer of ["route-glow", "route-line"]) map.setFilter(layer, filter as never)
    for (const layer of ["route-risk", "route-nodes"]) {
      const base = layer === "route-risk"
        ? ["all", ["==", ["get", "nodeType"], "destination"], ["==", ["get", "risk"], "high"]]
        : null
      const nodeFilter = mode === "all" ? base : base ? ["all", base, ["==", ["get", "mode"], mode]] : ["==", ["get", "mode"], mode]
      map.setFilter(layer, nodeFilter as never)
    }
  }, [mapReady, mode])

  useEffect(() => {
    const map = mapRef.current
    if (!mapReady || !map?.getLayer("route-line")) return
    map.setPaintProperty("route-line", "line-width", ["case", ["==", ["get", "id"], activeRouteId || ""], 3.6, 2.1])
    map.setPaintProperty("route-glow", "line-width", ["case", ["==", ["get", "id"], activeRouteId || ""], 10, 7])
  }, [activeRouteId, mapReady])

  const filters: Array<{ id: RouteMode | "all"; label: string; icon: LucideIcon }> = [
    { id: "all", label: locale === "zh" ? "全部" : "All", icon: Layers3 },
    { id: "sea", label: locale === "zh" ? "海運" : "Sea", icon: Ship },
    { id: "air", label: locale === "zh" ? "空運" : "Air", icon: Plane },
    { id: "road", label: locale === "zh" ? "陸運" : "Road", icon: Truck },
    { id: "rail", label: locale === "zh" ? "鐵路" : "Rail", icon: TrainFront },
  ]

  return (
    <div className={`relative overflow-hidden bg-[#e9eef5] ${expanded ? "h-[calc(100dvh-168px)] min-h-[560px] rounded-[8px]" : dashboard ? "h-[420px] min-h-[420px] xl:h-[320px] xl:min-h-[320px]" : "h-[470px] min-h-[420px] rounded-[7px]"}`}>
      <div ref={containerRef} className={dashboard ? "absolute inset-x-0 bottom-0 top-[84px] xl:top-[43px]" : "absolute inset-0"} aria-label={locale === "zh" ? "LBID 航線情報地圖" : "LBID route intelligence map"} />

      <div className={`absolute z-10 flex max-w-[calc(100%-76px)] flex-wrap items-center gap-1.5 ${dashboard ? "left-3 top-1 bg-transparent p-1.5 shadow-none xl:left-[305px]" : "left-3 top-3 rounded-[8px] border border-white/90 bg-white/92 p-1.5 shadow-[0_10px_28px_rgba(25,42,79,0.14)] backdrop-blur-xl"}`}>
        {filters.map((filter) => {
          const FilterIcon = filter.icon
          return (
            <button key={filter.id} type="button" aria-pressed={mode === filter.id} onClick={() => setMode(filter.id)} className={`inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-[11px] font-semibold transition ${mode === filter.id ? "bg-[#10244d] text-white shadow-sm" : "text-[#58667e] hover:bg-[#f0f3f8] hover:text-[#14213a]"}`}>
              <FilterIcon className="h-3.5 w-3.5" />{filter.label}
            </button>
          )
        })}
      </div>

      {!expanded ? (
        <Link href={`/${locale}/network-map`} title={locale === "zh" ? "放大地圖" : "Expand map"} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-[8px] border border-white/90 bg-white/92 text-[#31415e] shadow-[0_10px_26px_rgba(25,42,79,0.14)] backdrop-blur-xl transition hover:bg-white hover:text-[#315ee8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315ee8]/30">
          <Maximize2 className="h-4 w-4" />
        </Link>
      ) : null}

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden rounded-[8px] border border-white/90 bg-white/92 px-3 py-2.5 shadow-[0_10px_28px_rgba(25,42,79,0.12)] backdrop-blur-xl sm:block">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-medium text-[#5f6e85]">
          <LegendLine dashed color="#3374f6" label={locale === "zh" ? "開放競價" : "Open request"} />
          <LegendLine color="#16a7a0" label={locale === "zh" ? "已中標／運送中" : "Awarded / active"} />
          <LegendLine color="#9aa5b4" label={locale === "zh" ? "已完成" : "Completed"} />
          <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full border-2 border-[#ef5d58] bg-[#ef5d58]/15" />{locale === "zh" ? "風險提示" : "Risk alert"}</span>
        </div>
      </div>

      {!mapReady && !mapError ? <div className="absolute inset-0 grid place-items-center bg-[#eef2f7]"><div className="flex items-center gap-2 text-[12px] font-medium text-[#718098]"><CircleDot className="h-4 w-4 animate-pulse text-[#3d6ff2]" />{locale === "zh" ? "載入航線地圖…" : "Loading route intelligence…"}</div></div> : null}
      {mapError && !mapReady ? <div className="absolute inset-0 grid place-items-center bg-[#eef2f7] px-6 text-center"><div><MapPin className="mx-auto h-6 w-6 text-[#6b7890]" /><p className="mt-3 text-[13px] font-semibold text-[#26354e]">{locale === "zh" ? "地圖暫時未能載入" : "Map is temporarily unavailable"}</p><p className="mt-1 text-[11px] text-[#77859a]">{locale === "zh" ? "航線資料仍可在右側查看。" : "Route details remain available in the panel."}</p></div></div> : null}
    </div>
  )
}

export function RouteDetailPanel({ locale, route, compact = false }: { locale: Locale; route: IntelligenceRoute; compact?: boolean }) {
  const meta = modeMeta[route.mode]
  const ModeIcon = meta.icon
  const riskTone = route.risk === "high" ? "#e95650" : route.risk === "medium" ? "#ed9b2f" : "#1caa70"
  const statusLabel = route.status === "open" ? (locale === "zh" ? "競價開放" : "Bidding open") : route.status === "active" ? (locale === "zh" ? "運作中" : "Active") : (locale === "zh" ? "已完成" : "Completed")

  return (
    <aside className={`flex h-full flex-col bg-white ${compact ? "p-4" : "rounded-[8px] border border-[#e2e7ef] p-5 shadow-[0_12px_34px_rgba(26,45,82,0.07)]"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`${compact ? "text-[8.5px]" : "text-[10px]"} font-semibold uppercase text-[#8a96a8]`}>{route.originCode} → {route.destinationCode}</p>
          <h2 className={`${compact ? "mt-0.5 text-[14px]" : "mt-1 text-[17px]"} font-semibold leading-snug text-[#14213a]`}>{route.origin} → {route.destination}</h2>
        </div>
        <span className={`${compact ? "h-6 px-2 text-[8.5px]" : "h-7 px-2.5 text-[10px]"} inline-flex items-center rounded-full bg-[#e9f8f0] font-semibold text-[#16885a]`}>{statusLabel}</span>
      </div>

      <div className={compact ? "mt-2 flex flex-wrap gap-2" : "mt-4 flex flex-wrap gap-2"}>
        <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#eef3ff] px-2.5 py-1.5 text-[10px] font-semibold" style={{ color: meta.color }}><ModeIcon className="h-3.5 w-3.5" />{meta.label}</span>
        <span className="inline-flex items-center gap-1.5 rounded-[6px] bg-[#f3f5f8] px-2.5 py-1.5 text-[10px] font-semibold text-[#5e6b80]"><Clock3 className="h-3.5 w-3.5" />{route.nextDeadline}</span>
      </div>

      <dl className={`${compact ? "mt-3" : "mt-5"} divide-y divide-[#edf0f4] border-y border-[#edf0f4]`}>
        <DetailRow label={locale === "zh" ? "活躍需求" : "Active requests"} value={String(route.activeRequests)} />
        <DetailRow label={locale === "zh" ? "有效回應" : "Qualified responses"} value={String(route.responseCount)} />
        <DetailRow label={locale === "zh" ? "運量" : "Tracked volume"} value={route.volumeLabel} />
        <DetailRow label={locale === "zh" ? "準時交付" : "On-time delivery"} value={`${route.onTimeRate}%`} accent="#159c69" />
      </dl>

      <div className={compact ? "mt-3" : "mt-5"}>
        <div className="flex items-center justify-between text-[11px]"><span className="font-medium text-[#718097]">{locale === "zh" ? "風險評級" : "Risk level"}</span><strong className="capitalize" style={{ color: riskTone }}>{route.risk}</strong></div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#edf0f4]"><div className="h-full rounded-full" style={{ width: route.risk === "high" ? "82%" : route.risk === "medium" ? "54%" : "24%", backgroundColor: riskTone }} /></div>
      </div>

      {!compact ? <p className="mt-5 rounded-[7px] bg-[#f5f7fb] px-3 py-2.5 text-[10.5px] leading-5 text-[#65738a]">
        {locale === "zh" ? "地圖只顯示需求、狀態及營運表現。密封報價及競爭者身份會在關標前保持隱藏。" : "The map shows demand, status and operating performance only. Sealed prices and competitor identities stay hidden before close."}
      </p> : null}

      <Link href={`/${locale}/my-routes`} className={`${compact ? "mt-3 h-8 text-[9.5px]" : "mt-auto h-10 text-[11px]"} inline-flex items-center justify-center rounded-[7px] border border-[#dfe5ef] bg-white font-semibold text-[#273650] transition hover:border-[#aebcce] hover:bg-[#f8faff] hover:text-[#315ee8]`}>
        {locale === "zh" ? "查看航線詳情" : "View route details"}
      </Link>
    </aside>
  )
}

function DetailRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div className="flex items-center justify-between gap-3 py-1.5 text-[9.5px]"><dt className="text-[#718097]">{label}</dt><dd className="font-semibold tabular-nums text-[#24324a]" style={accent ? { color: accent } : undefined}>{value}</dd></div>
}

function LegendLine({ label, color, dashed = false }: { label: string; color: string; dashed?: boolean }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`h-0 w-5 border-t-2 ${dashed ? "border-dashed" : ""}`} style={{ borderColor: color }} />{label}</span>
}

function buildGeoJson(routes: IntelligenceRoute[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: routes.map((route) => ({
      type: "Feature",
      properties: { id: route.id, mode: route.mode, status: route.status, risk: route.risk, color: modeMeta[route.mode].color },
      geometry: { type: "LineString", coordinates: arcCoordinates(route.originCoordinates, route.destinationCoordinates) },
    })),
  }
}

function buildNodeGeoJson(routes: IntelligenceRoute[]): FeatureCollection {
  return {
    type: "FeatureCollection",
    features: routes.flatMap((route) => ([
      {
        type: "Feature" as const,
        properties: { id: route.id, mode: route.mode, status: route.status, risk: route.risk, color: modeMeta[route.mode].color, activeRequests: route.activeRequests, nodeType: "origin" },
        geometry: { type: "Point" as const, coordinates: route.originCoordinates },
      },
      {
        type: "Feature" as const,
        properties: { id: route.id, mode: route.mode, status: route.status, risk: route.risk, color: modeMeta[route.mode].color, activeRequests: route.activeRequests, nodeType: "destination" },
        geometry: { type: "Point" as const, coordinates: route.destinationCoordinates },
      },
    ])),
  }
}

function arcCoordinates(start: [number, number], end: [number, number]): [number, number][] {
  const steps = 36
  const distance = Math.hypot(end[0] - start[0], end[1] - start[1])
  return Array.from({ length: steps + 1 }, (_, index) => {
    const progress = index / steps
    const longitude = start[0] + (end[0] - start[0]) * progress
    const latitude = start[1] + (end[1] - start[1]) * progress + Math.sin(Math.PI * progress) * Math.min(distance * 0.16, 2.7)
    return [longitude, latitude]
  })
}
