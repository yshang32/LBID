"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Gauge,
  Layers3,
  LocateFixed,
  MapPin,
  Navigation,
  Plane,
  Plus,
  Route as RouteIcon,
  Search,
  Ship,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

type RouteStatus = "verified" | "pending" | "incomplete"
type FreightMode = "Air" | "Sea"

interface ServiceRoute {
  id: string
  origin: string
  originCode: string
  airport: string
  modes: FreightMode[]
  capacityKg: number
  services: string[]
  status: RouteStatus
  jobs: number
  winRate: number
  certified: boolean
  mapX: number
  mapY: number
}

const ROUTES: ServiceRoute[] = [
  { id: "R-001", origin: "Vietnam", originCode: "VN", airport: "SGN / HAN", modes: ["Air"], capacityKg: 2000, services: ["Customs clearance", "Commercial invoice", "Packing list", "Insurance"], status: "verified", jobs: 32, winRate: 78, certified: true, mapX: 47, mapY: 69 },
  { id: "R-002", origin: "China Mainland", originCode: "CN", airport: "PVG / CAN / PEK", modes: ["Air", "Sea"], capacityKg: 8000, services: ["Customs clearance", "B/L preparation", "COO", "Insurance"], status: "verified", jobs: 89, winRate: 71, certified: true, mapX: 50, mapY: 28 },
  { id: "R-003", origin: "Taiwan", originCode: "TW", airport: "TPE", modes: ["Air"], capacityKg: 1200, services: ["Customs clearance", "Commercial invoice"], status: "pending", jobs: 11, winRate: 64, certified: false, mapX: 72, mapY: 38 },
  { id: "R-004", origin: "Thailand", originCode: "TH", airport: "BKK", modes: ["Air"], capacityKg: 800, services: [], status: "incomplete", jobs: 0, winRate: 0, certified: false, mapX: 34, mapY: 66 },
]

const STATUS = {
  verified: { label: "Verified", dot: "bg-emerald", badge: "border-emerald/20 bg-emerald-soft text-emerald", icon: CheckCircle2 },
  pending: { label: "Pending review", dot: "bg-amber-500", badge: "border-amber-200 bg-amber-50 text-amber-700", icon: Clock3 },
  incomplete: { label: "Action required", dot: "bg-red-500", badge: "border-red-200 bg-red-50 text-red-600", icon: AlertCircle },
} as const

export function MyRoutesPage() {
  const [selectedId, setSelectedId] = useState(ROUTES[0].id)
  const [mode, setMode] = useState<"All" | FreightMode>("All")
  const [query, setQuery] = useState("")
  const [zoom, setZoom] = useState(1)
  const [showAdd, setShowAdd] = useState(false)
  const selected = ROUTES.find((route) => route.id === selectedId) ?? ROUTES[0]
  const filteredRoutes = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return ROUTES.filter((route) => {
      const matchesMode = mode === "All" || route.modes.includes(mode)
      const matchesQuery = !normalized || `${route.origin} ${route.airport} ${route.originCode}`.toLowerCase().includes(normalized)
      return matchesMode && matchesQuery
    })
  }, [mode, query])

  const verified = ROUTES.filter((route) => route.status === "verified").length
  const completedJobs = ROUTES.reduce((total, route) => total + route.jobs, 0)
  const activeRoutes = ROUTES.filter((route) => route.jobs > 0)
  const averageWinRate = Math.round(activeRoutes.reduce((total, route) => total + route.winRate, 0) / activeRoutes.length)

  return (
    <main className="mx-auto w-full max-w-[1500px] px-5 pb-16 pt-7 sm:px-8 lg:px-10">
      <header className="flex flex-col gap-5 border-b border-line/80 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-gold-dark">
            <RouteIcon className="h-3.5 w-3.5" /> Network coverage
          </div>
          <h1 className="text-[30px] font-bold leading-none tracking-[-0.8px] text-ink sm:text-[36px]">My Routes</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-ink-2">Define where you operate. Verified routes improve recommendation quality and determine bid eligibility.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-navy px-5 text-[13px] font-semibold text-white shadow-[0_8px_22px_rgba(12,26,62,.18)] transition hover:-translate-y-px hover:bg-[#17316b] hover:shadow-[0_12px_28px_rgba(12,26,62,.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30">
          <Plus className="h-4 w-4" /> Add route
        </button>
      </header>

      <section className="mt-5 grid grid-cols-2 overflow-hidden rounded-[14px] border border-line/90 bg-white/82 shadow-[0_12px_36px_rgba(20,52,98,.06)] backdrop-blur lg:grid-cols-4">
        {[
          { label: "Route inventory", value: ROUTES.length, note: "Configured lanes", icon: Layers3, tone: "text-blue-600 bg-blue-50" },
          { label: "Verified", value: verified, note: "Eligible for matching", icon: CheckCircle2, tone: "text-emerald bg-emerald-soft" },
          { label: "Completed jobs", value: completedJobs, note: "Across active routes", icon: Navigation, tone: "text-violet-600 bg-violet-50" },
          { label: "Average win rate", value: `${averageWinRate}%`, note: "+4.2% this quarter", icon: Gauge, tone: "text-gold-dark bg-gold-soft" },
        ].map(({ label, value, note, icon: Icon, tone }, index) => (
          <div key={label} className={`flex min-w-0 items-center gap-3 px-4 py-4 sm:gap-4 sm:px-5 ${index < 2 ? "border-b border-line-light lg:border-b-0" : ""} ${index % 2 === 0 ? "border-r border-line-light" : ""} ${index === 1 ? "lg:border-r" : ""} ${index === 2 ? "lg:border-r" : ""}`}>
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-[18px] w-[18px]" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-3">{label}</p>
              <p className="mt-0.5 text-[22px] font-bold leading-none tracking-[-0.5px] text-ink">{value}</p>
              <p className="mt-1 text-[11px] text-ink-3">{note}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mt-5 grid overflow-hidden rounded-[16px] border border-[#cdd8e8] bg-[#0d1d3f] shadow-[0_24px_60px_rgba(12,26,62,.16)] xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="relative min-h-[360px] overflow-hidden border-b border-white/10 sm:min-h-[430px] xl:border-b-0 xl:border-r">
          <div className="absolute left-5 top-5 z-20 flex items-center gap-2 rounded-lg border border-white/15 bg-[#0a1733]/80 px-3 py-2 text-white shadow-lg backdrop-blur-md">
            <LocateFixed className="h-4 w-4 text-[#78b7ff]" />
            <div><p className="text-[11px] font-semibold">Asia coverage map</p><p className="text-[9.5px] text-white/55">Destination hub: Hong Kong</p></div>
          </div>
          <div className="absolute right-4 top-4 z-20 flex flex-col overflow-hidden rounded-lg border border-white/15 bg-[#0a1733]/80 shadow-lg backdrop-blur-md">
            <MapControl label="Zoom in" onClick={() => setZoom((value) => Math.min(1.18, value + .06))}><ZoomIn className="h-4 w-4" /></MapControl>
            <MapControl label="Zoom out" onClick={() => setZoom((value) => Math.max(1, value - .06))}><ZoomOut className="h-4 w-4" /></MapControl>
            <MapControl label="Reset map" onClick={() => setZoom(1)}><LocateFixed className="h-4 w-4" /></MapControl>
          </div>

          <div className="absolute inset-0 origin-center transition-transform duration-500 ease-out" style={{ transform: `scale(${zoom})` }}>
            <svg viewBox="0 0 900 480" className="h-full w-full" role="img" aria-label="Service routes from Asia to Hong Kong">
              <defs>
                <linearGradient id="ocean" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#0d234d" /><stop offset="1" stopColor="#091731" /></linearGradient>
                <pattern id="map-grid" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" fill="none" stroke="#8bb7ed" strokeOpacity=".07" /></pattern>
                <filter id="hub-glow"><feGaussianBlur stdDeviation="5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              <rect width="900" height="480" fill="url(#ocean)" />
              <rect width="900" height="480" fill="url(#map-grid)" />
              <path d="M210 35L365 22L472 55L545 95L620 102L650 143L619 171L574 168L548 214L500 228L473 272L429 293L390 278L371 231L324 211L290 165L240 137Z" fill="#7690b3" fillOpacity=".17" stroke="#9eb7d7" strokeOpacity=".20" />
              <path d="M330 232L385 248L420 298L445 338L430 412L398 438L372 392L355 346L316 315Z" fill="#7690b3" fillOpacity=".13" stroke="#9eb7d7" strokeOpacity=".16" />
              <path d="M468 286L515 304L547 341L575 381L552 427L520 397L495 351L454 327Z" fill="#7690b3" fillOpacity=".15" stroke="#9eb7d7" strokeOpacity=".18" />
              <path d="M650 171L674 190L665 225L645 213Z" fill="#7690b3" fillOpacity=".28" />
              <path d="M682 244L706 263L713 311L696 342L678 299Z" fill="#7690b3" fillOpacity=".17" />
              <text x="420" y="125" fill="#c8d8ed" fillOpacity=".35" fontSize="12" fontWeight="600">CHINA</text>
              <text x="368" y="346" fill="#c8d8ed" fillOpacity=".28" fontSize="11" fontWeight="600">THAILAND</text>
              <text x="480" y="382" fill="#c8d8ed" fillOpacity=".28" fontSize="11" fontWeight="600">VIETNAM</text>
              {ROUTES.map((route) => {
                const startX = route.mapX * 9
                const startY = route.mapY * 4.8
                const selectedRoute = route.id === selectedId
                const stroke = route.status === "verified" ? "#65a9ff" : route.status === "pending" ? "#e0b94f" : "#7d8ba3"
                return <path key={route.id} d={`M ${startX} ${startY} Q ${(startX + 700) / 2} ${Math.min(startY, 210) - 65} 700 238`} fill="none" stroke={stroke} strokeWidth={selectedRoute ? 3 : 1.6} strokeOpacity={selectedRoute ? .95 : .5} strokeDasharray={route.status === "verified" ? undefined : "7 7"} />
              })}
              <circle cx="700" cy="238" r="24" fill="#58a4ff" fillOpacity=".12" filter="url(#hub-glow)" />
              <circle cx="700" cy="238" r="8" fill="#f2cf68" />
              <circle cx="700" cy="238" r="3" fill="#fff" />
              <text x="716" y="232" fill="#fff" fontSize="12" fontWeight="700">HKG</text>
              <text x="716" y="248" fill="#9fb5d4" fontSize="9.5">Hong Kong hub</text>
            </svg>

            {ROUTES.map((route) => {
              const config = STATUS[route.status]
              const selectedRoute = route.id === selectedId
              return (
                <button key={route.id} onClick={() => setSelectedId(route.id)} aria-label={`Select ${route.origin} route`} className={`absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg border px-2.5 py-1.5 text-left shadow-lg backdrop-blur-md transition ${selectedRoute ? "scale-105 border-[#80baff] bg-[#173a72] text-white" : "border-white/15 bg-[#0b1b3a]/78 text-white/75 hover:border-white/35 hover:text-white"}`} style={{ left: `${route.mapX}%`, top: `${route.mapY}%` }}>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold"><span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />{route.originCode}</span>
                  <span className="mt-0.5 block text-[8.5px] text-white/45">{route.airport}</span>
                </button>
              )
            })}
          </div>

          <div className="absolute bottom-4 left-5 z-20 flex flex-wrap gap-3 rounded-lg border border-white/10 bg-[#08152e]/72 px-3 py-2 text-[9.5px] text-white/65 backdrop-blur-md">
            {Object.entries(STATUS).map(([key, config]) => <span key={key} className="flex items-center gap-1.5"><span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />{config.label}</span>)}
          </div>
        </div>

        <RouteInspector route={selected} onEdit={() => setShowAdd(true)} />
      </section>

      <section className="mt-5 overflow-hidden rounded-[14px] border border-line/90 bg-white/90 shadow-[0_10px_30px_rgba(20,52,98,.05)]">
        <div className="flex flex-col gap-3 border-b border-line px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div><h2 className="text-[14px] font-bold text-ink">Route inventory</h2><p className="mt-1 text-[11.5px] text-ink-3">Review capacity, verification and performance without leaving the map.</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-[240px]"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-3" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search region or airport" className="h-9 w-full rounded-lg border border-line bg-canvas/60 pl-9 pr-3 text-[12px] outline-none transition focus:border-navy/35 focus:bg-white focus:ring-2 focus:ring-navy/10" /></label>
            <div className="flex rounded-lg border border-line bg-canvas/60 p-1" aria-label="Filter by freight mode">
              {(["All", "Air", "Sea"] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={`min-w-12 rounded-md px-3 py-1.5 text-[11px] font-semibold transition ${mode === item ? "bg-white text-navy shadow-sm" : "text-ink-3 hover:text-ink"}`}>{item}</button>)}
            </div>
          </div>
        </div>
        <div className="divide-y divide-line-light">
          {filteredRoutes.map((route) => <RouteRow key={route.id} route={route} active={route.id === selectedId} onSelect={() => setSelectedId(route.id)} />)}
          {!filteredRoutes.length ? <div className="grid min-h-32 place-items-center px-5 text-center"><div><Filter className="mx-auto h-5 w-5 text-ink-3" /><p className="mt-2 text-[13px] font-semibold text-ink">No routes match this filter</p><button onClick={() => { setMode("All"); setQuery("") }} className="mt-1 text-[11.5px] font-medium text-navy hover:underline">Clear filters</button></div></div> : null}
        </div>
      </section>

      <AddRouteDialog open={showAdd} onClose={() => setShowAdd(false)} />
    </main>
  )
}

function RouteInspector({ route, onEdit }: { route: ServiceRoute; onEdit: () => void }) {
  const config = STATUS[route.status]
  const StatusIcon = config.icon
  return (
    <aside className="flex min-h-[430px] flex-col bg-[#0b1935] p-6 text-white">
      <div className="flex items-start justify-between"><div><p className="text-[9.5px] font-bold uppercase tracking-[.12em] text-[#78b7ff]">Selected route</p><h2 className="mt-2 text-[21px] font-bold tracking-[-.4px]">{route.origin} to HKG</h2><p className="mt-1 text-[11.5px] text-white/45">{route.airport} / Hong Kong</p></div><span className={`grid h-9 w-9 place-items-center rounded-xl ${route.status === "verified" ? "bg-emerald/15 text-[#70d0a8]" : "bg-white/10 text-white/70"}`}><MapPin className="h-4 w-4" /></span></div>
      <div className={`mt-5 inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${config.badge}`}><StatusIcon className="h-3 w-3" />{config.label}</div>
      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/10">
        <Metric label="Capacity" value={`${route.capacityKg.toLocaleString()} kg`} />
        <Metric label="Win rate" value={`${route.winRate}%`} />
        <Metric label="Jobs" value={route.jobs.toString()} />
        <Metric label="Modes" value={route.modes.join(" + ")} />
      </div>
      <div className="mt-6"><p className="text-[9.5px] font-bold uppercase tracking-[.11em] text-white/40">Enabled services</p><div className="mt-3 flex flex-wrap gap-2">{route.services.length ? route.services.map((service) => <span key={service} className="rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1 text-[9.5px] text-white/65">{service}</span>) : <p className="text-[11.5px] leading-5 text-amber-300/80">Add at least one service to activate this route.</p>}</div></div>
      <div className="mt-auto pt-6"><button onClick={onEdit} className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[.07] text-[12px] font-semibold text-white transition hover:border-white/30 hover:bg-white/10">Edit route details <ChevronRight className="h-3.5 w-3.5" /></button></div>
    </aside>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="bg-[#102243] px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[.08em] text-white/35">{label}</p><p className="mt-1 text-[13px] font-semibold text-white/90">{value}</p></div>
}

function RouteRow({ route, active, onSelect }: { route: ServiceRoute; active: boolean; onSelect: () => void }) {
  const config = STATUS[route.status]
  const StatusIcon = config.icon
  return (
    <button onClick={onSelect} className={`grid w-full gap-4 px-5 py-4 text-left transition hover:bg-[#f7f9fc] md:grid-cols-[minmax(240px,1.4fr)_130px_130px_150px_auto] md:items-center ${active ? "bg-blue-50/45 shadow-[inset_3px_0_#2f78d3]" : ""}`}>
      <span className="flex min-w-0 items-center gap-3"><span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-xl ${route.modes.includes("Air") ? "bg-blue-50 text-blue-600" : "bg-cyan-50 text-cyan-700"}`}>{route.modes.includes("Air") ? <Plane className="h-4 w-4" /> : <Ship className="h-4 w-4" />}</span><span className="min-w-0"><strong className="block truncate text-[13px] font-semibold text-ink">{route.origin} <span className="font-normal text-ink-3">to</span> Hong Kong</strong><small className="mt-1 block text-[10.5px] text-ink-3">{route.airport} / HKG / {route.id}</small></span></span>
      <span><small className="block text-[9px] font-bold uppercase tracking-[.08em] text-ink-3">Capacity</small><strong className="mt-1 block text-[12px] font-semibold text-ink-2">{route.capacityKg.toLocaleString()} kg</strong></span>
      <span><small className="block text-[9px] font-bold uppercase tracking-[.08em] text-ink-3">Performance</small><strong className="mt-1 block text-[12px] font-semibold text-ink-2">{route.jobs} jobs / {route.winRate}%</strong></span>
      <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-semibold ${config.badge}`}><StatusIcon className="h-3 w-3" />{config.label}</span>
      <ChevronRight className="hidden h-4 w-4 justify-self-end text-ink-3 md:block" />
    </button>
  )
}

function MapControl({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button aria-label={label} title={label} onClick={onClick} className="grid h-9 w-9 place-items-center border-b border-white/10 text-white/65 transition last:border-b-0 hover:bg-white/10 hover:text-white">{children}</button>
}

function AddRouteDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-[#08122a]/50 p-4 backdrop-blur-sm" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
        <motion.div role="dialog" aria-modal="true" aria-labelledby="add-route-title" initial={{ opacity: 0, y: 14, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .98 }} transition={{ duration: .22 }} className="w-full max-w-[460px] rounded-[14px] border border-line bg-white p-6 shadow-[0_28px_90px_rgba(0,0,0,.22)]">
          <div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.1em] text-gold-dark">Network coverage</p><h2 id="add-route-title" className="mt-1 text-[20px] font-bold text-ink">Add a service route</h2></div><button onClick={onClose} aria-label="Close add route dialog" className="grid h-8 w-8 place-items-center rounded-lg text-ink-3 transition hover:bg-canvas hover:text-ink"><X className="h-4 w-4" /></button></div>
          <div className="mt-5 space-y-4">
            <label className="block text-[12px] font-semibold text-ink-2">Origin region<select className="mt-1.5 h-11 w-full rounded-lg border border-line bg-white px-3 text-[13px] outline-none transition focus:border-navy/35 focus:ring-2 focus:ring-navy/10"><option value="">Select an origin</option><option>Vietnam (SGN / HAN)</option><option>Malaysia (KUL)</option><option>Philippines (MNL)</option><option>Indonesia (CGK)</option><option>Japan (NRT / KIX)</option></select></label>
            <fieldset><legend className="text-[12px] font-semibold text-ink-2">Freight mode</legend><div className="mt-1.5 grid grid-cols-2 gap-2">{(["Air", "Sea"] as const).map((item) => <label key={item} className="flex h-11 items-center gap-2 rounded-lg border border-line px-3 text-[13px] font-medium text-ink transition hover:border-navy/25"><input type="checkbox" className="accent-navy" />{item === "Air" ? <Plane className="h-4 w-4 text-blue-600" /> : <Ship className="h-4 w-4 text-cyan-700" />}{item}</label>)}</div></fieldset>
            <label className="block text-[12px] font-semibold text-ink-2">Maximum capacity (kg)<input type="number" placeholder="e.g. 2000" className="mt-1.5 h-11 w-full rounded-lg border border-line px-3 text-[13px] outline-none transition focus:border-navy/35 focus:ring-2 focus:ring-navy/10" /></label>
            <button onClick={onClose} className="h-11 w-full rounded-lg bg-navy text-[13px] font-semibold text-white transition hover:bg-[#17316b]">Save route draft</button>
          </div>
        </motion.div>
      </motion.div> : null}
    </AnimatePresence>
  )
}
