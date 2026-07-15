"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { CircleDot, MapPin } from "lucide-react"
import type { GeoJSONSource, Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl"

type Point = {
  city: string
  code: string
  coordinates: [number, number]
}

type RouteFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.LineString, Record<string, string>>

export function RequestRouteMap({ origin, destination, mode }: { origin: Point | null; destination: Point | null; mode: "Air" | "Sea" }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<MapLibreMarker[]>([])
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const routeData = useMemo(() => buildRoute(origin, destination), [destination, origin])

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    void import("maplibre-gl").then((module) => {
      if (cancelled || !containerRef.current) return
      const maplibregl = module.default
      const map = new maplibregl.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/positron",
        center: [18, 18],
        zoom: 1.2,
        minZoom: 0.8,
        maxZoom: 10,
        attributionControl: false,
        cooperativeGestures: true,
      })
      mapRef.current = map
      map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right")

      map.on("load", () => {
        if (cancelled) return
        map.addSource("request-route", { type: "geojson", data: routeData })
        map.addLayer({
          id: "request-route-glow",
          type: "line",
          source: "request-route",
          paint: {
            "line-color": "#d89a1b",
            "line-width": 9,
            "line-opacity": 0.13,
            "line-blur": 5,
          },
        })
        map.addLayer({
          id: "request-route-line",
          type: "line",
          source: "request-route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#163257",
            "line-width": 2.2,
            "line-opacity": 0.9,
            "line-dasharray": [2, 2],
          },
        })
        setReady(true)
      })
      map.on("error", (event) => {
        if (event.error) setFailed(true)
      })
    }).catch(() => setFailed(true))

    return () => {
      cancelled = true
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    const source = map.getSource("request-route") as GeoJSONSource | undefined
    source?.setData(routeData)

    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []
    void import("maplibre-gl").then((module) => {
      if (!mapRef.current) return
      const maplibregl = module.default
      const points = [{ point: origin, kind: "origin" }, { point: destination, kind: "destination" }].filter((item): item is { point: Point; kind: string } => Boolean(item.point))
      markersRef.current = points.map(({ point, kind }) => {
        const node = document.createElement("div")
        node.className = `request-map-marker request-map-marker-${kind}`
        node.setAttribute("aria-label", `${point.city} ${point.code}`)
        node.innerHTML = `<span></span><b>${point.code}</b>`
        return new maplibregl.Marker({ element: node, anchor: "bottom" })
          .setLngLat(point.coordinates)
          .addTo(mapRef.current!)
      })

      if (origin && destination) {
        const bounds = new maplibregl.LngLatBounds(origin.coordinates, origin.coordinates)
        bounds.extend(destination.coordinates)
        map.fitBounds(bounds, { padding: { top: 68, right: 80, bottom: 68, left: 80 }, duration: 650, maxZoom: 5.4 })
      } else if (origin || destination) {
        map.easeTo({ center: (origin || destination)!.coordinates, zoom: 4, duration: 450 })
      } else {
        map.easeTo({ center: [18, 18], zoom: 1.2, duration: 450 })
      }
    })
  }, [destination, origin, ready, routeData])

  return (
    <div className="relative h-[330px] min-h-[300px] overflow-hidden rounded-[12px] border border-[#eadfce] bg-[#f3f0ea] lg:h-[350px]">
      <div ref={containerRef} className="absolute inset-0" aria-label="Selected logistics route map" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center justify-center bg-gradient-to-b from-white/72 to-transparent px-4 pb-8 pt-3">
        <span className="rounded-full border border-white/90 bg-white/88 px-3 py-1.5 text-[10px] font-semibold text-[#59677c] shadow-sm backdrop-blur">
          {origin && destination ? `${origin.code} to ${destination.code} - ${mode} freight` : "Select origin and destination to preview the route"}
        </span>
      </div>
      {!ready && !failed ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#f5f2ec]">
          <span className="inline-flex items-center gap-2 text-[12px] font-medium text-[#758197]"><CircleDot className="h-4 w-4 animate-pulse text-[#c58a18]" />Loading route map</span>
        </div>
      ) : null}
      {failed && !ready ? (
        <div className="absolute inset-0 z-20 grid place-items-center bg-[#f5f2ec] px-6 text-center">
          <div><MapPin className="mx-auto h-6 w-6 text-[#9a7525]" /><p className="mt-2 text-[13px] font-semibold text-[#24324b]">Map temporarily unavailable</p><p className="mt-1 text-[11px] text-[#748196]">Your structured route details are still saved.</p></div>
        </div>
      ) : null}
    </div>
  )
}

function buildRoute(origin: Point | null, destination: Point | null): RouteFeatureCollection {
  return {
    type: "FeatureCollection",
    features: origin && destination ? [{
      type: "Feature",
      properties: { mode: "request" },
      geometry: { type: "LineString", coordinates: arcCoordinates(origin.coordinates, destination.coordinates) },
    }] : [],
  }
}

function arcCoordinates(start: [number, number], end: [number, number]) {
  const steps = 40
  const distance = Math.hypot(end[0] - start[0], end[1] - start[1])
  return Array.from({ length: steps + 1 }, (_, index) => {
    const progress = index / steps
    return [
      start[0] + (end[0] - start[0]) * progress,
      start[1] + (end[1] - start[1]) * progress + Math.sin(Math.PI * progress) * Math.min(distance * 0.14, 3.2),
    ]
  })
}
