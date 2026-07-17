"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Box,
  Boxes,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  CloudSun,
  Container,
  FileCheck2,
  FileSpreadsheet,
  FileText,
  Info,
  Lightbulb,
  Loader2,
  LockKeyhole,
  MapPin,
  PackageCheck,
  Plane,
  Search,
  ShieldCheck,
  Ship,
  Sparkles,
  Truck,
  Upload,
  Users,
  Warehouse,
  X,
} from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { RequestRouteMap } from "@/components/shipment-requests/request-route-map"
import { apiJson } from "@/lib/api-client"

const STEPS = [
  { label: "Route & Schedule", hint: "Where and when" },
  { label: "Cargo Details", hint: "What you are shipping" },
  { label: "Services & Documents", hint: "What you need" },
  { label: "Review & Launch", hint: "Confirm and submit" },
] as const

type Step = 0 | 1 | 2 | 3
type FreightMode = "Air" | "Sea"
type ShipmentUnit = "cartons" | "pallets" | "crates" | "loose"

type LogisticsLocation = {
  id: string
  city: string
  country: string
  code: string
  facility: string
  modes: FreightMode[]
  coordinates: [number, number]
  estimatedForwarders: string
}

type AttachmentDraft = {
  id: string
  name: string
  size: number
  kind: "cargo" | "document"
}

type FormData = {
  originId: string
  destinationId: string
  freight: FreightMode
  pickupDate: string
  flexibleDays: boolean
  urgent: boolean
  tradeTerm: string
  cargoType: string
  characteristics: string[]
  shipmentUnit: ShipmentUnit
  pieces: string
  unitType: string
  lengthCm: string
  widthCm: string
  heightCm: string
  grossWeightPerPiece: string
  tareWeightPerPiece: string
  cargoNotes: string
  services: string[]
  serviceNotes: string
  attachments: AttachmentDraft[]
}

type ServiceOption = {
  id: string
  group: "origin" | "main" | "destination" | "documents"
  label: string
  note: string
  recommended?: boolean
}

const LOGISTICS_LOCATIONS: LogisticsLocation[] = [
  { id: "sgn", city: "Ho Chi Minh City", country: "Vietnam", code: "SGN", facility: "Tan Son Nhat International Airport", modes: ["Air"], coordinates: [106.6602, 10.8188], estimatedForwarders: "8-12" },
  { id: "vnsgn", city: "Ho Chi Minh City", country: "Vietnam", code: "VNSGN", facility: "Cat Lai Port", modes: ["Sea"], coordinates: [106.775, 10.75], estimatedForwarders: "7-10" },
  { id: "han", city: "Hanoi", country: "Vietnam", code: "HAN", facility: "Noi Bai International Airport", modes: ["Air"], coordinates: [105.8072, 21.2187], estimatedForwarders: "6-9" },
  { id: "hph", city: "Hai Phong", country: "Vietnam", code: "VNHPH", facility: "Hai Phong Port", modes: ["Sea"], coordinates: [106.6881, 20.8449], estimatedForwarders: "6-9" },
  { id: "dad", city: "Da Nang", country: "Vietnam", code: "DAD", facility: "Da Nang International Airport", modes: ["Air"], coordinates: [108.1994, 16.0439], estimatedForwarders: "5-8" },
  { id: "bkk", city: "Bangkok", country: "Thailand", code: "BKK", facility: "Suvarnabhumi Airport", modes: ["Air"], coordinates: [100.7501, 13.69], estimatedForwarders: "9-13" },
  { id: "lcb", city: "Laem Chabang", country: "Thailand", code: "THLCH", facility: "Laem Chabang Port", modes: ["Sea"], coordinates: [100.8846, 13.0827], estimatedForwarders: "8-12" },
  { id: "sin", city: "Singapore", country: "Singapore", code: "SIN", facility: "Changi Airport", modes: ["Air"], coordinates: [103.9915, 1.3644], estimatedForwarders: "11-16" },
  { id: "sgsin", city: "Singapore", country: "Singapore", code: "SGSIN", facility: "Port of Singapore", modes: ["Sea"], coordinates: [103.84, 1.264], estimatedForwarders: "12-18" },
  { id: "kul", city: "Kuala Lumpur", country: "Malaysia", code: "KUL", facility: "Kuala Lumpur International Airport", modes: ["Air"], coordinates: [101.7099, 2.7456], estimatedForwarders: "8-12" },
  { id: "pkg", city: "Port Klang", country: "Malaysia", code: "MYPKG", facility: "Port Klang", modes: ["Sea"], coordinates: [101.3928, 3.0012], estimatedForwarders: "8-12" },
  { id: "cgk", city: "Jakarta", country: "Indonesia", code: "CGK", facility: "Soekarno-Hatta International Airport", modes: ["Air"], coordinates: [106.6559, -6.1256], estimatedForwarders: "7-11" },
  { id: "idjkt", city: "Jakarta", country: "Indonesia", code: "IDJKT", facility: "Tanjung Priok Port", modes: ["Sea"], coordinates: [106.886, -6.104], estimatedForwarders: "7-11" },
  { id: "mnl", city: "Manila", country: "Philippines", code: "MNL", facility: "Ninoy Aquino International Airport", modes: ["Air"], coordinates: [121.0198, 14.5086], estimatedForwarders: "8-12" },
  { id: "phmnl", city: "Manila", country: "Philippines", code: "PHMNL", facility: "Port of Manila", modes: ["Sea"], coordinates: [120.964, 14.594], estimatedForwarders: "7-10" },
  { id: "pnh", city: "Phnom Penh", country: "Cambodia", code: "PNH", facility: "Phnom Penh International Airport", modes: ["Air"], coordinates: [104.8441, 11.5466], estimatedForwarders: "4-7" },
  { id: "pvg", city: "Shanghai", country: "China", code: "PVG", facility: "Shanghai Pudong International Airport", modes: ["Air"], coordinates: [121.7998, 31.1443], estimatedForwarders: "14-20" },
  { id: "cnsgh", city: "Shanghai", country: "China", code: "CNSGH", facility: "Port of Shanghai", modes: ["Sea"], coordinates: [121.705, 31.303], estimatedForwarders: "15-22" },
  { id: "hkg", city: "Hong Kong", country: "Hong Kong", code: "HKG", facility: "Hong Kong International Airport", modes: ["Air"], coordinates: [113.9185, 22.308], estimatedForwarders: "14-20" },
  { id: "hkhkg", city: "Hong Kong", country: "Hong Kong", code: "HKHKG", facility: "Port of Hong Kong", modes: ["Sea"], coordinates: [114.145, 22.285], estimatedForwarders: "14-20" },
  { id: "szx", city: "Shenzhen", country: "China", code: "SZX", facility: "Shenzhen Bao'an International Airport", modes: ["Air"], coordinates: [113.811, 22.639], estimatedForwarders: "12-18" },
  { id: "cnszx", city: "Shenzhen", country: "China", code: "CNSZX", facility: "Yantian Port", modes: ["Sea"], coordinates: [114.27, 22.58], estimatedForwarders: "13-19" },
  { id: "tpe", city: "Taipei", country: "Taiwan", code: "TPE", facility: "Taiwan Taoyuan International Airport", modes: ["Air"], coordinates: [121.233, 25.077], estimatedForwarders: "10-15" },
  { id: "twkel", city: "Keelung", country: "Taiwan", code: "TWKEL", facility: "Port of Keelung", modes: ["Sea"], coordinates: [121.75, 25.14], estimatedForwarders: "8-13" },
  { id: "nrt", city: "Tokyo", country: "Japan", code: "NRT", facility: "Narita International Airport", modes: ["Air"], coordinates: [140.3929, 35.772], estimatedForwarders: "12-18" },
  { id: "jptyo", city: "Tokyo", country: "Japan", code: "JPTYO", facility: "Port of Tokyo", modes: ["Sea"], coordinates: [139.77, 35.62], estimatedForwarders: "11-17" },
  { id: "icn", city: "Seoul", country: "South Korea", code: "ICN", facility: "Incheon International Airport", modes: ["Air"], coordinates: [126.451, 37.46], estimatedForwarders: "11-17" },
  { id: "krpus", city: "Busan", country: "South Korea", code: "KRPUS", facility: "Port of Busan", modes: ["Sea"], coordinates: [129.04, 35.1], estimatedForwarders: "12-18" },
  { id: "del", city: "Delhi", country: "India", code: "DEL", facility: "Indira Gandhi International Airport", modes: ["Air"], coordinates: [77.103, 28.556], estimatedForwarders: "8-13" },
  { id: "inmaa", city: "Chennai", country: "India", code: "INMAA", facility: "Port of Chennai", modes: ["Sea"], coordinates: [80.3, 13.08], estimatedForwarders: "8-13" },
  { id: "dxb", city: "Dubai", country: "United Arab Emirates", code: "DXB", facility: "Dubai International Airport", modes: ["Air"], coordinates: [55.364, 25.253], estimatedForwarders: "10-16" },
  { id: "aejea", city: "Dubai", country: "United Arab Emirates", code: "AEJEA", facility: "Jebel Ali Port", modes: ["Sea"], coordinates: [55.06, 24.99], estimatedForwarders: "11-17" },
  { id: "lhr", city: "London", country: "United Kingdom", code: "LHR", facility: "Heathrow Airport", modes: ["Air"], coordinates: [-0.4543, 51.47], estimatedForwarders: "9-15" },
  { id: "gbsou", city: "Southampton", country: "United Kingdom", code: "GBSOU", facility: "Port of Southampton", modes: ["Sea"], coordinates: [-1.4, 50.9], estimatedForwarders: "8-14" },
  { id: "fra", city: "Frankfurt", country: "Germany", code: "FRA", facility: "Frankfurt Airport", modes: ["Air"], coordinates: [8.57, 50.033], estimatedForwarders: "10-16" },
  { id: "nlrtm", city: "Rotterdam", country: "Netherlands", code: "NLRTM", facility: "Port of Rotterdam", modes: ["Sea"], coordinates: [4.05, 51.95], estimatedForwarders: "13-20" },
  { id: "lax", city: "Los Angeles", country: "United States", code: "LAX", facility: "Los Angeles International Airport", modes: ["Air"], coordinates: [-118.4085, 33.9416], estimatedForwarders: "10-16" },
  { id: "uslax", city: "Los Angeles", country: "United States", code: "USLAX", facility: "Port of Los Angeles", modes: ["Sea"], coordinates: [-118.264, 33.74], estimatedForwarders: "12-19" },
  { id: "jfk", city: "New York", country: "United States", code: "JFK", facility: "John F. Kennedy International Airport", modes: ["Air"], coordinates: [-73.7781, 40.6413], estimatedForwarders: "11-17" },
  { id: "usnyc", city: "New York", country: "United States", code: "USNYC", facility: "Port of New York and New Jersey", modes: ["Sea"], coordinates: [-74.05, 40.68], estimatedForwarders: "11-18" },
  { id: "syd", city: "Sydney", country: "Australia", code: "SYD", facility: "Sydney Kingsford Smith Airport", modes: ["Air"], coordinates: [151.1772, -33.9461], estimatedForwarders: "9-14" },
  { id: "ausyd", city: "Sydney", country: "Australia", code: "AUSYD", facility: "Port Botany", modes: ["Sea"], coordinates: [151.23, -33.97], estimatedForwarders: "9-15" },
]

const CARGO_TYPES = ["General Goods", "Electronics", "Perishable / Cold Chain", "Machinery / Industrial", "Textiles / Garments", "Documents / Samples", "Chemical (Non-Hazardous)", "Other"]
const CHARACTERISTICS = ["Fragile", "High Value", "Temperature Controlled", "Hazardous", "Battery Included", "Oversized / Heavy", "Perishable", "None"]
const TRADE_TERMS = ["EXW", "FCA", "FOB", "CFR", "CIF", "DAP", "DDP"]
const UNIT_TYPES: Record<ShipmentUnit, string[]> = {
  cartons: ["Carton", "Box"],
  pallets: ["Standard pallet", "Euro pallet", "Custom pallet"],
  crates: ["Wooden crate", "Plastic crate", "Flight case"],
  loose: ["Piece", "Bundle", "Machine"],
}

const SERVICES: ServiceOption[] = [
  { id: "door-pickup", group: "origin", label: "Door Pickup", note: "Collect cargo from supplier location", recommended: true },
  { id: "export-customs", group: "origin", label: "Export Customs Declaration", note: "Handle export clearance at origin", recommended: true },
  { id: "origin-handling", group: "origin", label: "Origin Handling", note: "Loading, handling and terminal fees" },
  { id: "packing", group: "origin", label: "Packing / Repacking", note: "Professional packing or repacking service" },
  { id: "priority", group: "main", label: "Priority Uplift", note: "Priority space allocation" },
  { id: "insurance", group: "main", label: "Cargo Insurance", note: "Protect cargo against loss or damage", recommended: true },
  { id: "tracking", group: "main", label: "Real-time Tracking", note: "Track shipment milestones in LBID", recommended: true },
  { id: "import-customs", group: "destination", label: "Import Customs Clearance", note: "Destination import clearance handled by forwarder", recommended: true },
  { id: "delivery", group: "destination", label: "Door Delivery", note: "Deliver cargo to consignee address", recommended: true },
  { id: "storage", group: "destination", label: "Temporary Storage", note: "Short-term storage at warehouse" },
  { id: "unload", group: "destination", label: "Unload / Deboard", note: "Unloading service at destination" },
  { id: "invoice", group: "documents", label: "Commercial Invoice Preparation", note: "Prepare commercial invoice" },
  { id: "packing-list", group: "documents", label: "Packing List Preparation", note: "Prepare packing list" },
  { id: "coo", group: "documents", label: "Certificate of Origin", note: "Apply for COO where applicable" },
  { id: "permit", group: "documents", label: "Permit / Licence Assistance", note: "Assist with special permits" },
]

const INIT: FormData = {
  originId: "",
  destinationId: "",
  freight: "Air",
  pickupDate: "",
  flexibleDays: true,
  urgent: false,
  tradeTerm: "FOB",
  cargoType: "",
  characteristics: [],
  shipmentUnit: "cartons",
  pieces: "1",
  unitType: "Carton",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  grossWeightPerPiece: "",
  tareWeightPerPiece: "",
  cargoNotes: "",
  services: ["tracking", "import-customs"],
  serviceNotes: "",
  attachments: [],
}

const DRAFT_KEY = "lbid-request-draft-v3"
const INPUT = "h-11 w-full rounded-[8px] border border-[#dfe4ec] bg-white px-3.5 text-[13px] text-[#16223a] outline-none transition duration-200 placeholder:text-[#9ba5b5] hover:border-[#bdc7d5] focus:border-[#b67c16] focus:shadow-[0_0_0_3px_rgba(197,138,24,0.10)]"
const SELECT = `${INPUT} cursor-pointer appearance-none pr-10`

export function CreateRequestPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>(0)
  const [form, setForm] = useState<FormData>(INIT)
  const [originQuery, setOriginQuery] = useState("")
  const [originOpen, setOriginOpen] = useState(false)
  const [destinationQuery, setDestinationQuery] = useState("")
  const [destinationOpen, setDestinationOpen] = useState(false)
  const [draftLoaded, setDraftLoaded] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<Date | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [submittedId, setSubmittedId] = useState("")
  const [submittedStatus, setSubmittedStatus] = useState("")
  const [submittedReasons, setSubmittedReasons] = useState<string[]>([])
  const [attachmentError, setAttachmentError] = useState("")
  const saveTimer = useRef<number | null>(null)

  const selectedOrigin = LOGISTICS_LOCATIONS.find((location) => location.id === form.originId) || null
  const selectedDestination = LOGISTICS_LOCATIONS.find((location) => location.id === form.destinationId) || null
  const availableLocations = useMemo(() => LOGISTICS_LOCATIONS.filter((location) => location.modes.includes(form.freight)), [form.freight])
  const matchingOrigins = useMemo(() => {
    const term = originQuery.trim().toLowerCase()
    const locations = availableLocations.filter((location) => location.id !== form.destinationId)
    if (!term) return locations.slice(0, 8)
    return locations.filter((location) => [location.city, location.country, location.code, location.facility].some((value) => value.toLowerCase().includes(term))).slice(0, 8)
  }, [availableLocations, form.destinationId, originQuery])
  const matchingDestinations = useMemo(() => {
    const term = destinationQuery.trim().toLowerCase()
    const locations = availableLocations.filter((location) => location.id !== form.originId)
    if (!term) return locations.slice(0, 8)
    return locations.filter((location) => [location.city, location.country, location.code, location.facility].some((value) => value.toLowerCase().includes(term))).slice(0, 8)
  }, [availableLocations, destinationQuery, form.originId])

  const calculations = useMemo(() => calculateCargo(form), [form])
  const readinessItems = useMemo(() => [
    { label: "Route information", complete: Boolean(selectedOrigin && selectedDestination) },
    { label: "Pickup schedule", complete: Boolean(form.pickupDate) },
    { label: "Cargo details", complete: Boolean(form.cargoType && calculations.totalGross > 0 && calculations.totalVolume > 0) },
    { label: "Services & documents", complete: form.services.length > 0 },
  ], [calculations.totalGross, calculations.totalVolume, form.cargoType, form.pickupDate, form.services.length, selectedDestination, selectedOrigin])
  const readiness = readinessItems.filter((item) => item.complete).length * 25
  const selectedServices = SERVICES.filter((service) => form.services.includes(service.id))

  useEffect(() => {
    const draft = readDraft()
    const origin = LOGISTICS_LOCATIONS.find((location) => location.id === draft.originId)
    const destination = LOGISTICS_LOCATIONS.find((location) => location.id === draft.destinationId)
    setForm(draft)
    setOriginQuery(origin ? locationLabel(origin) : "")
    setDestinationQuery(destination ? locationLabel(destination) : "")
    setDraftLoaded(true)
  }, [])

  useEffect(() => {
    if (!draftLoaded) return
    if (saveTimer.current) window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
        setDraftSavedAt(new Date())
      } catch {}
    }, 450)
    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current)
    }
  }, [draftLoaded, form])

  function set<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((current) => ({ ...current, [key]: value }))
    setSubmitError("")
  }

  function selectFreight(freight: FreightMode) {
    setForm((current) => {
      const origin = LOGISTICS_LOCATIONS.find((location) => location.id === current.originId)
      const destination = LOGISTICS_LOCATIONS.find((location) => location.id === current.destinationId)
      const originStillValid = origin?.modes.includes(freight)
      const destinationStillValid = destination?.modes.includes(freight)
      return { ...current, freight, originId: originStillValid ? current.originId : "", destinationId: destinationStillValid ? current.destinationId : "" }
    })
    if (selectedOrigin && !selectedOrigin.modes.includes(freight)) setOriginQuery("")
    if (selectedDestination && !selectedDestination.modes.includes(freight)) setDestinationQuery("")
    setOriginOpen(false)
    setDestinationOpen(false)
  }

  function selectOrigin(location: LogisticsLocation) {
    set("originId", location.id)
    setOriginQuery(locationLabel(location))
    setOriginOpen(false)
  }

  function selectDestination(location: LogisticsLocation) {
    set("destinationId", location.id)
    setDestinationQuery(locationLabel(location))
    setDestinationOpen(false)
  }

  function toggleCharacteristic(value: string) {
    setForm((current) => {
      if (value === "None") return { ...current, characteristics: current.characteristics.includes("None") ? [] : ["None"] }
      const withoutNone = current.characteristics.filter((item) => item !== "None")
      return { ...current, characteristics: withoutNone.includes(value) ? withoutNone.filter((item) => item !== value) : [...withoutNone, value] }
    })
  }

  function selectUnit(unit: ShipmentUnit) {
    setForm((current) => ({ ...current, shipmentUnit: unit, unitType: UNIT_TYPES[unit][0] }))
  }

  function toggleService(id: string) {
    setForm((current) => ({
      ...current,
      services: current.services.includes(id) ? current.services.filter((service) => service !== id) : [...current.services, id],
    }))
  }

  function addFiles(files: FileList | null, kind: AttachmentDraft["kind"]) {
    if (!files?.length) return
    const accepted = Array.from(files).filter((file) => file.size <= 20 * 1024 * 1024)
    setAttachmentError(accepted.length === files.length ? "" : "Files larger than 20 MB were not added.")
    const next = accepted.map((file) => ({ id: `${file.name}-${file.size}-${file.lastModified}`, name: file.name, size: file.size, kind }))
    setForm((current) => ({ ...current, attachments: [...current.attachments.filter((item) => !next.some((file) => file.id === item.id)), ...next] }))
  }

  function canAdvance(targetStep = step) {
    if (targetStep === 0) return Boolean(selectedOrigin && selectedDestination && selectedOrigin.id !== selectedDestination.id && form.pickupDate)
    if (targetStep === 1) return Boolean(form.cargoType && calculations.totalGross > 0 && calculations.totalVolume > 0)
    if (targetStep === 2) return form.services.length > 0
    return readiness === 100
  }

  function goToStep(next: Step) {
    if (next < step || canAdvance(step)) setStep(next)
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
      setDraftSavedAt(new Date())
    } catch {}
  }

  async function handleSubmit() {
    if (!selectedOrigin || !selectedDestination || submitting || !canAdvance(3)) return
    setSubmitting(true)
    setSubmitError("")

    const idempotencyStorageKey = `${DRAFT_KEY}-submission-key`
    let idempotencyKey = ""
    try {
      idempotencyKey = localStorage.getItem(idempotencyStorageKey) || crypto.randomUUID()
      localStorage.setItem(idempotencyStorageKey, idempotencyKey)
    } catch {
      idempotencyKey = crypto.randomUUID()
    }

    const { response, body } = await apiJson("/api/shipment-requests", {
      method: "POST",
      headers: { "idempotency-key": idempotencyKey },
      body: JSON.stringify({
        route: {
          origin: locationLabel(selectedOrigin),
          origin_city: selectedOrigin.city,
          origin_country: selectedOrigin.country,
          origin_code: selectedOrigin.code,
          origin_facility: selectedOrigin.facility,
          origin_coordinates: selectedOrigin.coordinates,
          destination: locationLabel(selectedDestination),
          destination_city: selectedDestination.city,
          destination_country: selectedDestination.country,
          destination_code: selectedDestination.code,
          destination_facility: selectedDestination.facility,
          destination_coordinates: selectedDestination.coordinates,
          distance_km: distanceKm(selectedOrigin.coordinates, selectedDestination.coordinates),
        },
        cargo_details: {
          cargo: form.cargoType,
          cargo_type: form.cargoType,
          characteristics: form.characteristics,
          shipment_unit: form.shipmentUnit,
          unit_type: form.unitType,
          pieces: Number(form.pieces),
          dimensions_cm: { length: Number(form.lengthCm), width: Number(form.widthCm), height: Number(form.heightCm) },
          gross_weight_per_piece_kg: Number(form.grossWeightPerPiece),
          tare_weight_per_piece_kg: Number(form.tareWeightPerPiece || 0),
          weight_kg: calculations.totalGross,
          cbm: calculations.totalVolume,
          chargeable_weight_kg: calculations.chargeableWeight,
          mode: form.freight.toLowerCase(),
          incoterm: form.tradeTerm,
          flexible_days: form.flexibleDays ? 2 : 0,
          urgent: form.urgent,
          notes: form.cargoNotes.trim() || null,
          service_notes: form.serviceNotes.trim() || null,
          attachments: form.attachments,
          service_details: selectedServices,
        },
        services_needed: selectedServices.map((service) => service.label),
        shipDate: `${form.pickupDate}T00:00:00.000Z`,
        isAnonymous: true,
      }),
    }).catch(() => ({ response: null, body: { error: "NETWORK_ERROR" } }))

    setSubmitting(false)
    if (!response?.ok || !body.shipmentRequest?.id) {
      setSubmitError(errorMessage(body.error))
      return
    }

    try {
      localStorage.removeItem(DRAFT_KEY)
      localStorage.removeItem(idempotencyStorageKey)
    } catch {}
    setSubmittedId(body.shipmentRequest.id)
    setSubmittedStatus(body.shipmentRequest.status || "PENDING_REVIEW")
    setSubmittedReasons(Array.isArray(body.validation?.reasons) ? body.validation.reasons : [])
  }

  if (submittedId) return <SuccessState id={submittedId} status={submittedStatus} reasons={submittedReasons} onOpen={() => navigate(`/requests/${submittedId}`)} />

  return (
    <main className="mx-auto w-full max-w-[1640px] px-4 pb-14 pt-5 sm:px-6 lg:px-7">
      <PageHeader savedAt={draftSavedAt} />
      <StepNavigation step={step} onSelect={goToStep} />

      <div className="mt-3 grid items-start gap-4 2xl:grid-cols-[minmax(0,1fr)_326px]">
        <section className="overflow-hidden rounded-[12px] border border-[#e7e1d8] bg-white shadow-[0_18px_50px_rgba(33,47,73,0.07)]">
          <div className="min-h-[620px] p-5 sm:p-6 lg:p-7">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}>
                {step === 0 ? <RouteStep form={form} origin={selectedOrigin} destination={selectedDestination} originQuery={originQuery} destinationQuery={destinationQuery} originOpen={originOpen} destinationOpen={destinationOpen} matchingOrigins={matchingOrigins} matchingDestinations={matchingDestinations} onSet={set} onFreightChange={selectFreight} onOriginQuery={(value) => { setOriginQuery(value); set("originId", ""); setOriginOpen(true) }} onDestinationQuery={(value) => { setDestinationQuery(value); set("destinationId", ""); setDestinationOpen(true) }} onOriginSelect={selectOrigin} onDestinationSelect={selectDestination} onOriginOpen={setOriginOpen} onDestinationOpen={setDestinationOpen} /> : null}
                {step === 1 ? <CargoStep form={form} calculations={calculations} onSet={set} onCharacteristic={toggleCharacteristic} onUnit={selectUnit} onFiles={(files) => addFiles(files, "cargo")} onRemoveFile={(id) => set("attachments", form.attachments.filter((file) => file.id !== id))} /> : null}
                {step === 2 ? <ServicesStep form={form} destination={selectedDestination} onSet={set} onToggle={toggleService} onFiles={(files) => addFiles(files, "document")} onRemoveFile={(id) => set("attachments", form.attachments.filter((file) => file.id !== id))} /> : null}
                {step === 3 ? <ReviewStep form={form} origin={selectedOrigin} destination={selectedDestination} calculations={calculations} services={selectedServices} readiness={readiness} onEdit={setStep} /> : null}
              </motion.div>
            </AnimatePresence>
            {attachmentError ? <div role="alert" className="mt-4 flex items-center gap-2 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] text-amber-800"><AlertCircle className="h-4 w-4" />{attachmentError}</div> : null}
          </div>

          <FormFooter step={step} canAdvance={canAdvance()} submitting={submitting} onBack={() => step === 0 ? navigate("/requests") : setStep((step - 1) as Step)} onNext={() => setStep((step + 1) as Step)} onSave={saveDraft} onSubmit={() => void handleSubmit()} />
          {submitError ? <div role="alert" className="mx-5 mb-5 flex items-start gap-2.5 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-medium text-red-700 sm:mx-6"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />{submitError}</div> : null}
        </section>

        <RequestSummary form={form} origin={selectedOrigin} destination={selectedDestination} readiness={readiness} readinessItems={readinessItems} />
      </div>
    </main>
  )
}

function PageHeader({ savedAt }: { savedAt: Date | null }) {
  return (
    <header className="flex flex-col gap-3 pb-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-[25px] font-bold leading-tight tracking-[-0.5px] text-[#12203a] sm:text-[29px]">New Shipment Request</h1>
        <p className="mt-1 text-[13px] text-[#6f7c90]">Create a detailed shipment brief to receive accurate sealed quotes from verified forwarders.</p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#fbf7ee] px-2.5 py-1 text-[10.5px] font-medium text-[#8b6a25]"><span className="h-1.5 w-1.5 rounded-full bg-[#c99022]" />{savedAt ? `Draft saved ${relativeTime(savedAt)}` : "Draft saves automatically on this device"}</p>
      </div>
      <div className="hidden items-center gap-2 text-[10.5px] text-[#7d899d] xl:flex"><ShieldCheck className="h-4 w-4 text-[#16885a]" />Your request remains private until LBID approves it.</div>
    </header>
  )
}

function StepNavigation({ step, onSelect }: { step: Step; onSelect: (step: Step) => void }) {
  return (
    <nav aria-label="Request progress" className="overflow-x-auto rounded-[12px] border border-[#e7e1d8] bg-white shadow-[0_8px_24px_rgba(33,47,73,0.045)]">
      <ol className="grid min-w-[840px] grid-cols-4">
        {STEPS.map((item, index) => {
          const complete = index < step
          const active = index === step
          return (
            <li key={item.label} className="relative">
              <button type="button" onClick={() => onSelect(index as Step)} disabled={index > step} className={`flex h-[78px] w-full items-center gap-3 px-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#c58a18]/35 disabled:cursor-default ${active ? "bg-[linear-gradient(100deg,#fffdf9,#fbf6ed)]" : "hover:bg-[#fbfcfe]"}`}>
                <span className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border text-[13px] font-bold ${complete ? "border-[#16885a] bg-[#effaf5] text-[#16885a]" : active ? "border-[#102544] bg-[#102544] text-white shadow-[0_6px_16px_rgba(16,37,68,0.2)]" : "border-[#eadfce] bg-white text-[#ad7820]"}`}>{complete ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}</span>
                <span className="min-w-0"><strong className={`block truncate text-[12.5px] ${active ? "text-[#14213a]" : "text-[#3f4c62]"}`}>{item.label}</strong><span className="mt-1 block truncate text-[10.5px] text-[#8994a6]">{complete ? "Completed" : item.hint}</span></span>
              </button>
              {index < 3 ? <span className={`absolute right-[-18px] top-1/2 z-10 hidden h-px w-9 -translate-y-1/2 lg:block ${complete ? "bg-[#4ba27e]" : "bg-[#e5d9c7]"}`} /> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function RouteStep({ form, origin, destination, originQuery, destinationQuery, originOpen, destinationOpen, matchingOrigins, matchingDestinations, onSet, onFreightChange, onOriginQuery, onDestinationQuery, onOriginSelect, onDestinationSelect, onOriginOpen, onDestinationOpen }: { form: FormData; origin: LogisticsLocation | null; destination: LogisticsLocation | null; originQuery: string; destinationQuery: string; originOpen: boolean; destinationOpen: boolean; matchingOrigins: LogisticsLocation[]; matchingDestinations: LogisticsLocation[]; onSet: SetForm; onFreightChange: (mode: FreightMode) => void; onOriginQuery: (value: string) => void; onDestinationQuery: (value: string) => void; onOriginSelect: (location: LogisticsLocation) => void; onDestinationSelect: (location: LogisticsLocation) => void; onOriginOpen: (open: boolean) => void; onDestinationOpen: (open: boolean) => void }) {
  const distance = origin && destination ? distanceKm(origin.coordinates, destination.coordinates) : 0
  const transit = transitEstimate(distance, form.freight)
  return (
    <div>
      <StepTitle number="1" title="Where is your shipment coming from and going to?" subtitle="Choose a verified airport or seaport. Free-text locations are not accepted." />
      <div className="relative mt-5">
        <RequestRouteMap origin={origin ? { city: origin.city, code: origin.code, coordinates: origin.coordinates } : null} destination={destination ? { city: destination.city, code: destination.code, coordinates: destination.coordinates } : null} mode={form.freight} />
        <div className="mt-3 grid gap-3 lg:absolute lg:inset-x-4 lg:top-11 lg:mt-0 lg:grid-cols-[280px_1fr_280px] lg:items-start">
          <LocationSelectorCard kind="origin" mode={form.freight} selectedId={form.originId} query={originQuery} open={originOpen} locations={matchingOrigins} onQuery={onOriginQuery} onSelect={onOriginSelect} onOpen={onOriginOpen} />
          <div />
          <LocationSelectorCard kind="destination" mode={form.freight} selectedId={form.destinationId} query={destinationQuery} open={destinationOpen} locations={matchingDestinations} onQuery={onDestinationQuery} onSelect={onDestinationSelect} onOpen={onDestinationOpen} />
        </div>
      </div>

      <div className="mt-4 grid gap-px overflow-hidden rounded-[9px] border border-[#e6e1d8] bg-[#e6e1d8] sm:grid-cols-3"><RouteMetric icon={MapPin} label="Distance" value={distance ? `${distance.toLocaleString()} km` : "Select both locations"} /><RouteMetric icon={Clock3} label={`Typical Transit (${form.freight})`} value={distance ? transit : "Calculated after selection"} /><RouteMetric icon={CloudSun} label="Route Coverage" value={origin && destination ? "Available" : "Pending"} positive={Boolean(origin && destination)} /></div>

      <div className="mt-4 grid gap-5 rounded-[10px] border border-[#ece7df] bg-[#fffdfa] p-4 xl:grid-cols-[1.05fr_.9fr_1fr]">
        <div><FieldLabel>Freight Mode</FieldLabel><div className="mt-2 grid grid-cols-2 gap-2"><ModeButton mode="Air" selected={form.freight === "Air"} icon={Plane} helper="1-3 days transit" onClick={() => onFreightChange("Air")} /><ModeButton mode="Sea" selected={form.freight === "Sea"} icon={Ship} helper="7-18 days transit" onClick={() => onFreightChange("Sea")} /></div></div>
        <div className="xl:border-l xl:border-[#ebe5db] xl:pl-5"><FieldLabel>Trade Term (Incoterm)</FieldLabel><div className="relative mt-2"><select aria-label="Trade Term (Incoterm)" value={form.tradeTerm} onChange={(event) => onSet("tradeTerm", event.target.value)} className={SELECT}>{TRADE_TERMS.map((term) => <option key={term}>{term}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8792a4]" /></div><p className="mt-2 text-[10px] leading-4 text-[#7c8799]">{incotermDescription(form.tradeTerm)}</p></div>
        <div className="xl:border-l xl:border-[#ebe5db] xl:pl-5"><FieldLabel>Pickup Schedule</FieldLabel><div className="relative mt-2"><CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a95a6]" /><input aria-label="Pickup date" type="date" min={tomorrow()} value={form.pickupDate} onChange={(event) => onSet("pickupDate", event.target.value)} className={`${INPUT} pl-9`} /></div><ToggleRow label="Flexible +/- 2 days" checked={form.flexibleDays} onChange={(value) => onSet("flexibleDays", value)} /><ToggleRow label="Urgent shipment" checked={form.urgent} onChange={(value) => onSet("urgent", value)} muted /></div>
      </div>
      <Tip>Accurate route, ready date and Incoterm data helps forwarders return more precise sealed quotes.</Tip>
    </div>
  )
}

function LocationSelectorCard({ kind, mode, selectedId, query, open, locations, onQuery, onSelect, onOpen }: { kind: "origin" | "destination"; mode: FreightMode; selectedId: string; query: string; open: boolean; locations: LogisticsLocation[]; onQuery: (value: string) => void; onSelect: (location: LogisticsLocation) => void; onOpen: (open: boolean) => void }) {
  const label = kind === "origin" ? "Origin airport / port" : "Destination airport / port"
  const suggestionsId = `${kind}-suggestions`
  return <div className="relative rounded-[10px] border border-white/90 bg-white/94 p-4 shadow-[0_14px_36px_rgba(31,45,70,0.14)] backdrop-blur-xl"><FieldLabel>{label}</FieldLabel><div className="relative mt-2"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b96a7]" /><input role="combobox" aria-label={label} aria-expanded={open} aria-controls={suggestionsId} value={query} onChange={(event) => onQuery(event.target.value)} onFocus={() => onOpen(true)} onBlur={() => window.setTimeout(() => onOpen(false), 130)} placeholder={`Search ${mode.toLowerCase()} locations`} className={`${INPUT} pl-9 pr-9`} />{query ? <button type="button" aria-label={`Clear ${kind}`} onMouseDown={(event) => event.preventDefault()} onClick={() => onQuery("")} className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[6px] text-[#8b96a7] transition hover:bg-[#f2f4f7] hover:text-[#27344b]"><X className="h-3.5 w-3.5" /></button> : null}</div>{open ? <div id={suggestionsId} role="listbox" className="absolute left-0 right-0 top-[78px] z-30 max-h-[260px] overflow-y-auto rounded-[9px] border border-[#dfe4ec] bg-white p-1.5 shadow-[0_18px_45px_rgba(23,39,67,0.18)]">{locations.length ? locations.map((location) => <button key={location.id} type="button" role="option" aria-selected={location.id === selectedId} onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(location)} className="flex w-full items-start gap-3 rounded-[7px] px-3 py-2.5 text-left transition hover:bg-[#f5f7fb]"><MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#bc821a]" /><span className="min-w-0"><strong className="block text-[12px] text-[#1f2d45]">{location.city} ({location.code})</strong><span className="mt-0.5 block truncate text-[10px] text-[#8590a2]">{location.facility}</span></span></button>) : <p className="px-3 py-5 text-center text-[11px] text-[#8a95a6]">No verified location found.</p>}</div> : null}<div className="mt-3 border-t border-[#ece7df] pt-3"><p className="text-[9.5px] font-semibold uppercase tracking-[0.08em] text-[#9099a8]">Suggested locations</p><div className="mt-2 flex flex-wrap gap-1.5">{locations.slice(0, 4).map((location) => <button type="button" key={location.id} onClick={() => onSelect(location)} className={`rounded-[6px] border px-2 py-1 text-[9.5px] font-medium transition ${selectedId === location.id ? "border-[#d8a340] bg-[#fff6df] text-[#946614]" : "border-[#e3e7ed] bg-white text-[#536077] hover:border-[#d5a54b] hover:text-[#8f6415]"}`}>{location.city} ({location.code})</button>)}</div></div></div>
}

function CargoStep({ form, calculations, onSet, onCharacteristic, onUnit, onFiles, onRemoveFile }: { form: FormData; calculations: CargoCalculations; onSet: SetForm; onCharacteristic: (value: string) => void; onUnit: (unit: ShipmentUnit) => void; onFiles: (files: FileList | null) => void; onRemoveFile: (id: string) => void }) {
  const cargoFiles = form.attachments.filter((file) => file.kind === "cargo")
  return (
    <div>
      <StepTitle number="2" title="Tell us more about your cargo" subtitle="Structured dimensions and handling details let forwarders price accurately." />
      <div className="mt-5 grid gap-5 xl:grid-cols-[.95fr_1.05fr]">
        <div><FieldLabel>Cargo Type</FieldLabel><div className="relative mt-2"><Box className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#53627a]" /><select aria-label="Cargo type" value={form.cargoType} onChange={(event) => onSet("cargoType", event.target.value)} className={`${SELECT} pl-9`}><option value="">Select cargo type</option>{CARGO_TYPES.map((type) => <option key={type}>{type}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8792a4]" /></div></div>
        <div><FieldLabel>Cargo Characteristics (select all that apply)</FieldLabel><div className="mt-2 flex flex-wrap gap-2">{CHARACTERISTICS.map((item) => <ChoiceChip key={item} label={item} selected={form.characteristics.includes(item)} onClick={() => onCharacteristic(item)} />)}</div></div>
      </div>

      <div className="mt-5 border-t border-[#ece7df] pt-5"><FieldLabel>Shipment Unit</FieldLabel><div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{([{"id":"cartons","label":"Boxes / Cartons","icon":Box},{"id":"pallets","label":"Pallets","icon":PackageCheck},{"id":"crates","label":"Crates","icon":Container},{"id":"loose","label":"Loose Cargo","icon":Boxes}] as const).map((unit) => <UnitButton key={unit.id} label={unit.label} icon={unit.icon} selected={form.shipmentUnit === unit.id} onClick={() => onUnit(unit.id)} />)}</div></div>

      <div className="mt-5 grid gap-4 border-t border-[#ece7df] pt-5 md:grid-cols-2 xl:grid-cols-4"><NumberField label="Number of Pieces" value={form.pieces} min="1" onChange={(value) => onSet("pieces", value)} suffix="pieces" /><SelectField label="Unit Type" value={form.unitType} options={UNIT_TYPES[form.shipmentUnit]} onChange={(value) => onSet("unitType", value)} /><NumberField label="Gross Weight per Piece" value={form.grossWeightPerPiece} onChange={(value) => onSet("grossWeightPerPiece", value)} suffix="kg" /><NumberField label="Tare Weight (Optional)" value={form.tareWeightPerPiece} onChange={(value) => onSet("tareWeightPerPiece", value)} suffix="kg" /></div>

      <div className="mt-5 grid gap-4 border-t border-[#ece7df] pt-5 sm:grid-cols-3"><NumberField label="Length per Piece" value={form.lengthCm} onChange={(value) => onSet("lengthCm", value)} suffix="cm" /><NumberField label="Width per Piece" value={form.widthCm} onChange={(value) => onSet("widthCm", value)} suffix="cm" /><NumberField label="Height per Piece" value={form.heightCm} onChange={(value) => onSet("heightCm", value)} suffix="cm" /></div>

      <CargoCalculationBar calculations={calculations} mode={form.freight} pieces={Number(form.pieces) || 0} dimensions={[form.lengthCm, form.widthCm, form.heightCm]} />

      {form.characteristics.includes("Hazardous") ? <div className="mt-4 flex items-start gap-3 rounded-[9px] border border-amber-200 bg-amber-50 p-4 text-[11.5px] leading-5 text-amber-900"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /><p><strong>Hazardous cargo selected.</strong> Add the MSDS and include UN number, hazard class and packing group in the notes. LBID Admin will review compliance before publication.</p></div> : null}

      <div className="mt-5 grid gap-4 lg:grid-cols-2"><TextAreaField label="Additional Notes (Optional)" value={form.cargoNotes} onChange={(value) => onSet("cargoNotes", value)} placeholder="Special handling requirements, cargo description, brand, HS code..." /><FileDropzone label="Cargo Attachments (Optional)" hint="Product sheet, cargo photo or MSDS" files={cargoFiles} onFiles={onFiles} onRemove={onRemoveFile} /></div>
    </div>
  )
}

function ServicesStep({ form, destination, onSet, onToggle, onFiles, onRemoveFile }: { form: FormData; destination: LogisticsLocation | null; onSet: SetForm; onToggle: (id: string) => void; onFiles: (files: FileList | null) => void; onRemoveFile: (id: string) => void }) {
  const documentFiles = form.attachments.filter((file) => file.kind === "document")
  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><StepTitle number="3" title="Select services and upload documents" subtitle="Recommended services are based on your route, mode and cargo." /><span className="inline-flex h-9 flex-shrink-0 items-center gap-2 rounded-[8px] border border-[#eadfce] bg-[#fffaf0] px-3 text-[10.5px] font-semibold text-[#966715]"><Sparkles className="h-3.5 w-3.5" />Recommended for this shipment</span></div>
      <div className="mt-5 space-y-2.5"><ServiceGroup group="origin" icon={Truck} title="Origin Services" subtitle="Services at the pickup location" form={form} onToggle={onToggle} /><ServiceGroup group="main" icon={form.freight === "Air" ? Plane : Ship} title="Main Freight" subtitle={`International ${form.freight.toLowerCase()} transportation`} form={form} onToggle={onToggle} coreService={`${form.freight} Freight`} /><ServiceGroup group="destination" icon={Warehouse} title="Destination Services" subtitle={`Services in ${destination?.city || "the destination"}`} form={form} onToggle={onToggle} /><ServiceGroup group="documents" icon={FileCheck2} title="Documentation" subtitle="Shipping documents and certifications" form={form} onToggle={onToggle} /></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2"><TextAreaField label="Additional Requirements (Optional)" value={form.serviceNotes} onChange={(value) => onSet("serviceNotes", value)} placeholder="Delivery constraints, handling instructions or other requirements..." /><FileDropzone label="Shipment Documents (Optional)" hint="Invoice, packing list, COO or permit" files={documentFiles} onFiles={onFiles} onRemove={onRemoveFile} /></div>
    </div>
  )
}

function ReviewStep({ form, origin, destination, calculations, services, readiness, onEdit }: { form: FormData; origin: LogisticsLocation | null; destination: LogisticsLocation | null; calculations: CargoCalculations; services: ServiceOption[]; readiness: number; onEdit: (step: Step) => void }) {
  const cargoFiles = form.attachments.filter((file) => file.kind === "cargo")
  const documentFiles = form.attachments.filter((file) => file.kind === "document")
  return (
    <div>
      <div className="flex flex-col gap-4 border-b border-[#ece7df] pb-5 lg:flex-row lg:items-center lg:justify-between"><StepTitle number="4" title="Review your request" subtitle="Confirm the details before LBID validates and publishes the sealed bid." /><div className="min-w-[290px] rounded-[9px] border border-[#e5e8ee] bg-[#fafbfc] px-4 py-3"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#445168]">Request readiness</span><strong className="text-[16px] text-[#16223a]">{readiness}%</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8ebef]"><div className="h-full rounded-full bg-[#16885a] transition-[width]" style={{ width: `${readiness}%` }} /></div></div></div>
      <div className="mt-5 grid gap-3 xl:grid-cols-3">
        <ReviewCard title="Route & Schedule" onEdit={() => onEdit(0)}><div className="mb-4 flex items-center justify-between"><LocationPill code={origin?.code || "---"} city={origin?.city || "Origin"} tone="green" />{form.freight === "Air" ? <Plane className="h-4 w-4 text-[#172b4c]" /> : <Ship className="h-4 w-4 text-[#172b4c]" />}<LocationPill code={destination?.code || "---"} city={destination?.city || "Destination"} tone="gold" /></div><ReviewPair label="Freight Mode" value={`${form.freight} Freight`} /><ReviewPair label="Trade Term" value={form.tradeTerm} /><ReviewPair label="Pickup Date" value={form.pickupDate || "-"} /><ReviewPair label="Transit" value={origin && destination ? transitEstimate(distanceKm(origin.coordinates, destination.coordinates), form.freight) : "-"} /></ReviewCard>
        <ReviewCard title="Cargo Details" onEdit={() => onEdit(1)}><div className="mb-3 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[8px] bg-[#f1f4f8] text-[#1d3152]"><Box className="h-5 w-5" /></span><div><p className="text-[13px] font-semibold text-[#16223a]">{form.cargoType}</p><p className="text-[10.5px] text-[#8490a2]">{form.pieces} {form.unitType.toLowerCase()}</p></div></div><ReviewPair label="Gross Weight" value={`${formatNumber(calculations.totalGross)} kg`} /><ReviewPair label="Total Volume" value={`${formatNumber(calculations.totalVolume)} CBM`} /><ReviewPair label="Chargeable Weight" value={`${formatNumber(calculations.chargeableWeight)} kg`} /><ReviewPair label="Characteristics" value={form.characteristics.length ? form.characteristics.join(", ") : "None"} /></ReviewCard>
        <ReviewCard title="Services & Documents" onEdit={() => onEdit(2)}><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#919baa]">{services.length} selected services</p><div className="mt-3 space-y-2">{services.slice(0, 6).map((service) => <p key={service.id} className="flex items-start gap-2 text-[10.5px] leading-4 text-[#4f5d72]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#16885a]" />{service.label}</p>)}{services.length > 6 ? <p className="text-[10px] font-semibold text-[#8e661a]">+{services.length - 6} more services</p> : null}</div><p className="mt-4 border-t border-[#eceff3] pt-3 text-[10.5px] text-[#7e899b]">{documentFiles.length} shipment documents attached</p></ReviewCard>
      </div>
      <div className="mt-3 grid gap-3 lg:grid-cols-2"><ReviewCard title={`Attachments (${form.attachments.length})`}>{form.attachments.length ? <div className="grid gap-2 sm:grid-cols-2">{[...cargoFiles, ...documentFiles].map((file) => <FilePill key={file.id} file={file} />)}</div> : <p className="text-[11px] text-[#8792a3]">No optional files attached.</p>}</ReviewCard><ReviewCard title="Notes to Forwarders" onEdit={() => onEdit(1)}><p className="text-[11px] leading-5 text-[#59667b]">{form.cargoNotes || form.serviceNotes || "No additional notes. Forwarders will quote using the structured request details."}</p></ReviewCard></div>
      <WorkflowPreview />
    </div>
  )
}

function RequestSummary({ form, origin, destination, readiness, readinessItems }: { form: FormData; origin: LogisticsLocation | null; destination: LogisticsLocation | null; readiness: number; readinessItems: { label: string; complete: boolean }[] }) {
  return (
    <aside className="h-fit overflow-hidden rounded-[12px] border border-[#e7e1d8] bg-white shadow-[0_18px_50px_rgba(33,47,73,0.07)] 2xl:sticky 2xl:top-4">
      <div className="p-5"><div className="flex items-center justify-between"><h2 className="text-[14px] font-bold text-[#16223a]">Shipment Overview</h2><span className="inline-flex items-center gap-1.5 text-[9.5px] font-medium text-[#16885a]"><span className="h-1.5 w-1.5 rounded-full bg-[#16885a]" />Live summary</span></div><div className="mt-5 grid grid-cols-[1fr_52px_1fr] items-center gap-2"><div><p className="truncate text-[12px] font-bold text-[#16223a]">{origin?.city || "Select origin"}</p><p className="mt-1 text-[10px] text-[#8590a2]">{origin?.code || "Airport / port"}</p></div><div className="flex items-center"><span className="h-px flex-1 border-t border-dashed border-[#d4a43f]" />{form.freight === "Air" ? <Plane className="mx-1 h-4 w-4 text-[#c18818]" /> : <Ship className="mx-1 h-4 w-4 text-[#c18818]" />}<span className="h-px flex-1 border-t border-dashed border-[#d4a43f]" /></div><div className="text-right"><p className="truncate text-[12px] font-bold text-[#16223a]">{destination?.city || "Select destination"}</p><p className="mt-1 text-[10px] text-[#8590a2]">{destination?.code || "Airport / port"}</p></div></div><div className="mt-5 space-y-3 border-t border-[#ece7df] pt-4"><SummaryRow label="Freight Mode" value={`${form.freight} Freight`} /><SummaryRow label="Trade Term" value={form.tradeTerm} /><SummaryRow label="Pickup Date" value={form.pickupDate || "Not selected"} alert={form.flexibleDays ? "Flexible +/- 2 days" : undefined} /></div></div>
      <div className="border-t border-[#ece7df] p-5"><p className="text-[12px] font-bold text-[#16223a]">Request Readiness</p><div className="mt-4 flex items-center gap-4"><div className="grid h-[76px] w-[76px] flex-shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#c58a18 ${readiness * 3.6}deg,#eee8dd 0)` }}><div className="grid h-[62px] w-[62px] place-items-center rounded-full bg-white text-[18px] font-bold text-[#17233b]">{readiness}%</div></div><div><p className="text-[12px] font-semibold text-[#24324b]">{readiness === 100 ? "Ready to launch" : readiness >= 75 ? "Almost there" : "Keep going"}</p><p className="mt-1 text-[10px] text-[#8490a2]">{readinessItems.filter((item) => item.complete).length} of {readinessItems.length} sections completed</p></div></div><div className="mt-5 space-y-3">{readinessItems.map((item) => <div key={item.label} className="flex items-center gap-2 text-[10.5px]"><span className={`grid h-4 w-4 place-items-center rounded-full border ${item.complete ? "border-[#16885a] bg-[#16885a] text-white" : "border-[#bfc7d2] text-transparent"}`}><Check className="h-2.5 w-2.5" strokeWidth={3} /></span><span className={item.complete ? "text-[#516076]" : "text-[#8994a5]"}>{item.label}</span><span className={`ml-auto font-medium ${item.complete ? "text-[#16885a]" : "text-[#7f8999]"}`}>{item.complete ? "Complete" : "Incomplete"}</span></div>)}</div></div>
      <div className="divide-y divide-[#ece7df] border-t border-[#ece7df] px-5"><SummaryMetric icon={Users} label="Estimated Forwarders" value={estimateForwarders(origin, destination)} note="qualified forwarders may be invited" /><SummaryMetric icon={LockKeyhole} label="Sealed Bidding Window" value="3 hours" note="starts after LBID approval" /><SummaryMetric icon={Clock3} label="Typical First Quote" value={origin && destination ? "30-60 min" : "Calculated later"} note="based on recent route activity" /></div>
    </aside>
  )
}

function FormFooter({ step, canAdvance, submitting, onBack, onNext, onSave, onSubmit }: { step: Step; canAdvance: boolean; submitting: boolean; onBack: () => void; onNext: () => void; onSave: () => void; onSubmit: () => void }) {
  return <footer className="flex flex-col gap-3 border-t border-[#ece7df] bg-[#fffdfa] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="flex items-center gap-2"><button type="button" onClick={onBack} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#dfe4ec] bg-white px-4 text-[11.5px] font-semibold text-[#45536a] transition hover:border-[#b9c3d1] hover:bg-[#f9fafc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c58a18]/30"><ArrowLeft className="h-3.5 w-3.5" />{step === 0 ? "Cancel" : "Back"}</button><button type="button" onClick={onSave} className="h-10 rounded-[8px] px-3 text-[11px] font-semibold text-[#6e7a8d] transition hover:bg-[#f4f5f7] hover:text-[#26344d]">Save draft</button></div><div className="flex items-center justify-end gap-4"><span className="text-[10.5px] text-[#8792a3]">Step {step + 1} of 4</span>{step < 3 ? <button type="button" onClick={onNext} disabled={!canAdvance} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#102544] px-5 text-[11.5px] font-semibold text-white shadow-[0_8px_18px_rgba(16,37,68,0.18)] transition hover:enabled:-translate-y-px hover:enabled:bg-[#19375e] disabled:cursor-not-allowed disabled:opacity-35">Continue <ArrowRight className="h-3.5 w-3.5" /></button> : <button type="button" onClick={onSubmit} disabled={!canAdvance || submitting} className="inline-flex h-10 min-w-[180px] items-center justify-center gap-2 rounded-[8px] bg-[#102544] px-5 text-[11.5px] font-semibold text-white shadow-[0_8px_18px_rgba(16,37,68,0.18)] transition hover:enabled:-translate-y-px hover:enabled:bg-[#19375e] disabled:cursor-not-allowed disabled:opacity-40">{submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Launching...</> : <><LockKeyhole className="h-3.5 w-3.5" />Launch sealed bidding <ArrowRight className="h-3.5 w-3.5" /></>}</button>}</div></footer>
}

function ServiceGroup({ group, icon: Icon, title, subtitle, form, onToggle, coreService }: { group: ServiceOption["group"]; icon: typeof Truck; title: string; subtitle: string; form: FormData; onToggle: (id: string) => void; coreService?: string }) {
  const options = SERVICES.filter((service) => service.group === group)
  return <section className="grid gap-3 rounded-[10px] border border-[#e7e2da] bg-[#fffdfa] p-3 lg:grid-cols-[150px_1fr]"><div className="flex items-start gap-3 rounded-[8px] bg-[#f7f8fa] p-3"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-white text-[#173052] shadow-sm"><Icon className="h-4 w-4" /></span><div><h3 className="text-[11.5px] font-bold text-[#1e2c44]">{title}</h3><p className="mt-1 text-[9.5px] leading-4 text-[#8390a2]">{subtitle}</p></div></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{coreService ? <div className="relative rounded-[8px] border border-[#b7d7c8] bg-[#f2fbf7] p-3"><span className="absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-[4px] bg-[#16885a] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span><p className="pr-5 text-[10.5px] font-semibold text-[#24324b]">{coreService}</p><p className="mt-1 text-[9.5px] leading-4 text-[#778497]">Core transport service</p><span className="mt-2 inline-flex rounded bg-[#fff4d7] px-1.5 py-0.5 text-[8px] font-semibold text-[#986a16]">Required</span></div> : null}{options.map((service) => { const selected = form.services.includes(service.id); return <button type="button" key={service.id} aria-pressed={selected} onClick={() => onToggle(service.id)} className={`relative rounded-[8px] border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c58a18]/30 ${selected ? "border-[#b8d8ca] bg-[#f5fcf9] shadow-[0_5px_14px_rgba(22,136,90,0.06)]" : "border-[#e2e6ec] bg-white hover:border-[#c7cfda] hover:shadow-sm"}`}><span className={`absolute right-2.5 top-2.5 grid h-4 w-4 place-items-center rounded-[4px] border ${selected ? "border-[#16885a] bg-[#16885a] text-white" : "border-[#c8cfd9] text-transparent"}`}><Check className="h-2.5 w-2.5" strokeWidth={3} /></span><p className="pr-5 text-[10.5px] font-semibold leading-4 text-[#24324b]">{service.label}</p><p className="mt-1 text-[9.5px] leading-4 text-[#7b879a]">{service.note}</p>{service.recommended ? <span className="mt-2 inline-flex rounded bg-[#fff4d7] px-1.5 py-0.5 text-[8px] font-semibold text-[#986a16]">Recommended</span> : null}</button> })}</div></section>
}

function WorkflowPreview() {
  const items = [{ icon: FileText, title: "Validate & Publish", body: "LBID checks scope integrity and risk" }, { icon: Users, title: "Forwarder Matching", body: "Qualified partners receive the brief" }, { icon: LockKeyhole, title: "Sealed Bidding", body: "Three hours start only after publication" }, { icon: PackageCheck, title: "Compare & Award", body: "Choose price, fit and capability" }]
  return <section className="mt-4 rounded-[10px] border border-[#e7e1d8] bg-[linear-gradient(100deg,#fffdf8,#fbf7ef)] p-4"><p className="text-[11px] font-bold text-[#22314a]">What happens next?</p><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((item, index) => <div key={item.title} className="relative flex gap-3"><span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-[#d8b56c] bg-white text-[#9a6c18]"><item.icon className="h-4 w-4" /></span><div><p className="text-[10.5px] font-semibold text-[#25344c]">{index + 1}. {item.title}</p><p className="mt-1 text-[9.5px] leading-4 text-[#7d889a]">{item.body}</p></div></div>)}</div></section>
}

function SuccessState({ id, status, reasons, onOpen }: { id: string; status: string; reasons: string[]; onOpen: () => void }) {
  const live = status === "OPEN"
  return <main className="mx-auto flex min-h-[72vh] w-full max-w-[900px] items-center justify-center px-5 py-12"><div className="relative w-full overflow-hidden rounded-[18px] border border-[#b8d9ca] bg-white px-8 py-14 text-center shadow-[0_28px_80px_rgba(25,74,55,0.12)]"><div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#16885a,#71c9a3,#c99527)]" /><motion.div initial={{ scale: 0.75, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }} className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-[#b8d9ca] bg-[#f0fbf6] text-[#16885a]"><CheckCircle2 className="h-8 w-8" /></motion.div><p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#16885a]">{live ? "Bidding is live" : "Validation in progress"}</p><h1 className="mt-2 text-[26px] font-bold text-[#14213a]">{live ? "Your three-hour sealed bid has started." : "Your request is safely with LBID."}</h1><p className="mx-auto mt-3 max-w-xl text-[13px] leading-6 text-[#6d7a8f]">{live ? "Qualified forwarders can now see the opportunity in Bidding Command Center. Every quote remains sealed until closing." : "We are checking the scope, company status and cargo risk. The three-hour window starts only when the request is published."}</p>{!live && reasons.length ? <p className="mx-auto mt-3 max-w-xl text-[10.5px] text-[#8b6a25]">Review checks: {reasons.map((reason) => reason.replaceAll("_", " ").toLowerCase()).join(" · ")}</p> : null}<p className="mt-4 font-mono text-[11px] text-[#8a95a6]">SR {id}</p><button type="button" onClick={onOpen} className="mt-6 inline-flex h-11 items-center gap-2 rounded-[8px] bg-[#102544] px-5 text-[12px] font-semibold text-white shadow-[0_8px_18px_rgba(16,37,68,0.2)] transition hover:-translate-y-px hover:bg-[#19375e]">Open request <ArrowRight className="h-4 w-4" /></button></div></main>
}

type SetForm = <K extends keyof FormData>(key: K, value: FormData[K]) => void
type CargoCalculations = { totalGross: number; totalVolume: number; volumetricWeight: number; chargeableWeight: number }

function StepTitle({ number, title, subtitle }: { number: string; title: string; subtitle: string }) { return <div><p className="text-[16px] font-bold tracking-[-0.2px] text-[#14213a]">{number}. {title}</p><p className="mt-1 text-[11.5px] text-[#7d899c]">{subtitle}</p></div> }
function FieldLabel({ children }: { children: React.ReactNode }) { return <label className="text-[10.5px] font-semibold text-[#334158]">{children}</label> }
function Tip({ children }: { children: React.ReactNode }) { return <div className="mt-4 flex items-start gap-3 rounded-[9px] border border-[#eee5d6] bg-[#fffaf1] px-4 py-3 text-[10.5px] leading-5 text-[#69768a]"><Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#c58a18]" /><p><strong className="text-[#3d4a60]">Tip:</strong> {children}</p></div> }
function RouteMetric({ icon: Icon, label, value, positive }: { icon: typeof MapPin; label: string; value: string; positive?: boolean }) { return <div className="flex items-center gap-3 bg-white px-4 py-3"><Icon className="h-4 w-4 text-[#1c3152]" /><div><p className="text-[9px] text-[#8994a5]">{label}</p><p className={`mt-0.5 text-[11.5px] font-semibold ${positive ? "text-[#16885a]" : "text-[#24324b]"}`}>{value}</p></div></div> }
function ModeButton({ mode, selected, icon: Icon, helper, onClick }: { mode: FreightMode; selected: boolean; icon: typeof Plane; helper: string; onClick: () => void }) { return <button type="button" aria-pressed={selected} onClick={onClick} className={`relative min-h-[104px] rounded-[8px] border p-3 text-center transition ${selected ? "border-[#c58a18] bg-[linear-gradient(145deg,#142a4b,#0e1f39)] text-white shadow-[0_10px_24px_rgba(16,37,68,0.18)]" : "border-[#e0e4ea] bg-white text-[#28364e] hover:border-[#c9b17e]"}`}><Icon className="mx-auto h-5 w-5" /><p className="mt-2 text-[11.5px] font-semibold">{mode} Freight</p><p className={`mt-1 text-[9.5px] ${selected ? "text-white/65" : "text-[#8691a2]"}`}>{helper}</p>{selected ? <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[#c58a18] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span> : null}</button> }
function ToggleRow({ label, checked, onChange, muted }: { label: string; checked: boolean; onChange: (checked: boolean) => void; muted?: boolean }) { return <label className={`mt-3 flex min-h-8 cursor-pointer items-center justify-between gap-3 text-[10.5px] ${muted ? "text-[#758195]" : "font-medium text-[#4b596f]"}`}><span className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 rounded accent-[#c58a18]" />{label}<Info className="h-3.5 w-3.5 text-[#9aa4b3]" /></span><span aria-hidden className={`relative h-5 w-9 rounded-full transition ${checked ? "bg-[#c58a18]" : "bg-[#d8dde5]"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} /></span></label> }
function ChoiceChip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) { return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-9 rounded-[7px] border px-3 text-[10.5px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c58a18]/30 ${selected ? "border-[#d3a752] bg-[#fff7e6] text-[#835b12]" : "border-[#e1e5eb] bg-white text-[#5a667b] hover:border-[#c9d0da]"}`}>{label}</button> }
function UnitButton({ label, icon: Icon, selected, onClick }: { label: string; icon: typeof Box; selected: boolean; onClick: () => void }) { return <button type="button" aria-pressed={selected} onClick={onClick} className={`relative min-h-[90px] rounded-[8px] border p-3 text-center transition ${selected ? "border-[#c58a18] bg-[#fff8e9] text-[#172a48] shadow-[0_6px_16px_rgba(197,138,24,0.08)]" : "border-[#e1e5eb] bg-white text-[#415068] hover:border-[#c8d0da]"}`}><Icon className="mx-auto h-5 w-5" /><p className="mt-2 text-[10.5px] font-semibold">{label}</p>{selected ? <span className="absolute right-2 top-2 grid h-4 w-4 place-items-center rounded-full bg-[#c58a18] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span> : null}</button> }
function NumberField({ label, value, onChange, suffix, min = "0" }: { label: string; value: string; onChange: (value: string) => void; suffix: string; min?: string }) { return <div><FieldLabel>{label}</FieldLabel><div className="relative mt-2"><input aria-label={label} type="number" min={min} step="any" value={value} onChange={(event) => onChange(event.target.value)} className={`${INPUT} pr-14`} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#8792a3]">{suffix}</span></div></div> }
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) { return <div><FieldLabel>{label}</FieldLabel><div className="relative mt-2"><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)} className={SELECT}>{options.map((option) => <option key={option}>{option}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8792a4]" /></div></div> }
function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) { return <div className="rounded-[9px] border border-[#e6e9ee] bg-[#fffdfa] p-4"><FieldLabel>{label}</FieldLabel><textarea aria-label={label} value={value} maxLength={500} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 h-[100px] w-full resize-none rounded-[8px] border border-[#dfe4ec] bg-white p-3 text-[11.5px] leading-5 text-[#24324b] outline-none transition placeholder:text-[#9ca5b4] focus:border-[#b67c16] focus:shadow-[0_0_0_3px_rgba(197,138,24,0.1)]" /><p className="mt-1 text-right text-[9px] text-[#9aa3b1]">{value.length} / 500</p></div> }
function FileDropzone({ label, hint, files, onFiles, onRemove }: { label: string; hint: string; files: AttachmentDraft[]; onFiles: (files: FileList | null) => void; onRemove: (id: string) => void }) { return <div className="rounded-[9px] border border-[#e6e9ee] bg-[#fffdfa] p-4"><FieldLabel>{label}</FieldLabel><label className="mt-2 flex min-h-[102px] cursor-pointer flex-col items-center justify-center rounded-[8px] border border-dashed border-[#cfd6e0] bg-white px-4 text-center transition hover:border-[#c58a18] hover:bg-[#fffcf6]"><Upload className="h-5 w-5 text-[#1f3557]" /><span className="mt-2 text-[10.5px] font-medium text-[#59667b]">Drop files here, or <span className="font-semibold text-[#1d3152] underline">browse</span></span><span className="mt-1 text-[9px] text-[#929baa]">{hint} - max 20 MB each</span><input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" className="sr-only" onChange={(event) => { onFiles(event.target.files); event.currentTarget.value = "" }} /></label>{files.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{files.map((file) => <FilePill key={file.id} file={file} onRemove={() => onRemove(file.id)} />)}</div> : null}</div> }
function FilePill({ file, onRemove }: { file: AttachmentDraft; onRemove?: () => void }) { const spreadsheet = /\.(xls|xlsx)$/i.test(file.name); const Icon = spreadsheet ? FileSpreadsheet : FileText; return <div className="flex min-w-0 items-center gap-2 rounded-[7px] border border-[#e4e7ec] bg-white px-3 py-2"><span className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-[5px] ${spreadsheet ? "bg-[#eaf8f1] text-[#16885a]" : "bg-[#fff0ec] text-[#df513f]"}`}><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[9.5px] font-medium text-[#35435a]">{file.name}</span><span className="text-[8.5px] text-[#919baa]">{formatFileSize(file.size)}</span></span>{onRemove ? <button type="button" aria-label={`Remove ${file.name}`} onClick={onRemove} className="grid h-7 w-7 place-items-center rounded-[5px] text-[#9aa3b2] transition hover:bg-red-50 hover:text-red-600"><X className="h-3.5 w-3.5" /></button> : null}</div> }
function CargoCalculationBar({ calculations, mode, pieces, dimensions }: { calculations: CargoCalculations; mode: FreightMode; pieces: number; dimensions: string[] }) { return <div className="mt-5 grid gap-px overflow-hidden rounded-[9px] border border-[#e5e1d9] bg-[#e5e1d9] sm:grid-cols-2 xl:grid-cols-4"><CalcItem label="Total Gross Weight" value={`${formatNumber(calculations.totalGross)} kg`} /><CalcItem label="Total Volume" value={`${formatNumber(calculations.totalVolume)} CBM`} helper={`${formatNumber(calculations.totalVolume * 1000)} litres`} /><CalcItem label={mode === "Air" ? "Chargeable Weight (Air)" : "Sea Freight Volume"} value={mode === "Air" ? `${formatNumber(calculations.chargeableWeight)} kg` : `${formatNumber(calculations.totalVolume)} W/M`} helper={mode === "Air" ? "Higher of gross or volumetric" : "Forwarder confirms final W/M"} /><CalcItem label="Calculation" value={`${dimensions.map((value) => value || "0").join(" x ")} x ${pieces}`} helper="CBM divisor 1,000,000; air divisor 6,000" /></div> }
function CalcItem({ label, value, helper }: { label: string; value: string; helper?: string }) { return <div className="bg-[#fffdfa] px-4 py-3"><p className="text-[9px] text-[#8b95a5]">{label}</p><p className="mt-1 text-[14px] font-semibold text-[#16233c]">{value}</p>{helper ? <p className="mt-1 text-[8.5px] text-[#969fad]">{helper}</p> : null}</div> }
function ReviewCard({ title, onEdit, children }: { title: string; onEdit?: () => void; children: React.ReactNode }) { return <section className="rounded-[9px] border border-[#e3e7ed] bg-white p-4 shadow-[0_5px_16px_rgba(31,47,72,0.035)]"><div className="mb-4 flex items-center justify-between"><h3 className="text-[11px] font-bold text-[#26344c]">{title}</h3>{onEdit ? <button type="button" onClick={onEdit} className="rounded-[6px] border border-[#e2e6ec] px-2 py-1 text-[9px] font-semibold text-[#657288] transition hover:border-[#c7a65e] hover:text-[#8b6318]">Edit</button> : null}</div>{children}</section> }
function ReviewPair({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3 border-t border-[#eff1f4] py-2 first:border-0 first:pt-0"><span className="text-[9.5px] text-[#8792a3]">{label}</span><span className="max-w-[60%] text-right text-[10px] font-medium text-[#2c3a51]">{value}</span></div> }
function LocationPill({ code, city, tone }: { code: string; city: string; tone: "green" | "gold" }) { return <div><span className={`inline-flex rounded-[4px] px-2 py-1 text-[9px] font-bold text-white ${tone === "green" ? "bg-[#17885f]" : "bg-[#bf861a]"}`}>{code}</span><p className="mt-1 text-[9.5px] text-[#637086]">{city}</p></div> }
function SummaryRow({ label, value, alert }: { label: string; value: string; alert?: string }) { return <div className="flex items-start justify-between gap-3 text-[10.5px]"><span className="text-[#8490a2]">{label}</span><span className="text-right font-semibold text-[#26344b]">{value}{alert ? <small className="mt-1 block font-medium text-[#d16d2d]">{alert}</small> : null}</span></div> }
function SummaryMetric({ icon: Icon, label, value, note }: { icon: typeof Users; label: string; value: string; note: string }) { return <div className="flex items-start gap-3 py-4"><span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full border border-[#e2e6ed] bg-[#fafbfc] text-[#183153]"><Icon className="h-3.5 w-3.5" /></span><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-[10.5px] font-medium text-[#58667b]">{label}</span><strong className="text-right text-[11.5px] text-[#17243c]">{value}</strong></span><span className="mt-1 block text-[9px] text-[#929baa]">{note}</span></span></div> }

function readDraft(): FormData { try { const value = localStorage.getItem(DRAFT_KEY); if (!value) return INIT; const parsed = JSON.parse(value) as Partial<FormData>; return { ...INIT, ...parsed, attachments: Array.isArray(parsed.attachments) ? parsed.attachments : [], services: Array.isArray(parsed.services) ? parsed.services : INIT.services, characteristics: Array.isArray(parsed.characteristics) ? parsed.characteristics : [] } } catch { return INIT } }
function locationLabel(location: LogisticsLocation) { return `${location.city}, ${location.country} (${location.code})` }
function calculateCargo(form: FormData): CargoCalculations { const pieces = Math.max(0, Number(form.pieces) || 0); const length = Math.max(0, Number(form.lengthCm) || 0); const width = Math.max(0, Number(form.widthCm) || 0); const height = Math.max(0, Number(form.heightCm) || 0); const gross = Math.max(0, Number(form.grossWeightPerPiece) || 0); const totalGross = round(gross * pieces, 2); const cubicCm = length * width * height * pieces; const totalVolume = round(cubicCm / 1_000_000, 3); const volumetricWeight = round(cubicCm / 6_000, 2); return { totalGross, totalVolume, volumetricWeight, chargeableWeight: round(Math.max(totalGross, volumetricWeight), 2) } }
function distanceKm(a: [number, number], b: [number, number]) { const radius = 6371; const lat1 = a[1] * Math.PI / 180; const lat2 = b[1] * Math.PI / 180; const dLat = (b[1] - a[1]) * Math.PI / 180; const dLng = (b[0] - a[0]) * Math.PI / 180; const value = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2; return Math.round(radius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value))) }
function transitEstimate(distance: number, mode: FreightMode) { if (!distance) return "Calculated after selection"; if (mode === "Air") return distance < 1500 ? "1-2 days" : distance < 6000 ? "2-4 days" : "3-6 days"; return distance < 1500 ? "3-7 days" : distance < 6000 ? "7-16 days" : "14-30 days" }
function estimateForwarders(origin: LogisticsLocation | null, destination: LogisticsLocation | null) { if (!origin || !destination) return "Pending"; const first = origin.estimatedForwarders.split("-").map(Number); const second = destination.estimatedForwarders.split("-").map(Number); return `${Math.max(3, Math.min(first[0] || 3, second[0] || 3))}-${Math.max(5, Math.min(first[1] || 5, second[1] || 5))}` }
function round(value: number, precision: number) { const multiplier = 10 ** precision; return Math.round(value * multiplier) / multiplier }
function formatNumber(value: number) { return value.toLocaleString("en-HK", { maximumFractionDigits: 3 }) }
function formatFileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB` }
function tomorrow() { const date = new Date(); date.setDate(date.getDate() + 1); return date.toISOString().slice(0, 10) }
function relativeTime(date: Date) { const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000)); if (seconds < 10) return "just now"; if (seconds < 60) return `${seconds}s ago`; return `${Math.floor(seconds / 60)} min ago` }
function incotermDescription(term: string) { const descriptions: Record<string, string> = { EXW: "Buyer takes responsibility from the seller's premises.", FCA: "Seller delivers goods to the named carrier.", FOB: "Seller handles goods until loaded at the origin port.", CFR: "Seller pays freight; buyer assumes transit risk.", CIF: "Seller pays freight and minimum insurance.", DAP: "Seller delivers ready for unloading at destination.", DDP: "Seller handles delivery, duties and import clearance." }; return descriptions[term] || "Select the agreed commercial responsibility." }
function errorMessage(code: string) { const messages: Record<string, string> = { UNAUTHENTICATED: "Your session expired. Sign in again before submitting.", CLIENT_CAPABILITY_REQUIRED: "Client capability is not enabled for this company account.", ORIGIN_REQUIRED: "Select an origin from the verified suggestions.", DESTINATION_REQUIRED: "Select a destination from the verified suggestions.", VALID_WEIGHT_REQUIRED: "Enter valid piece count and gross weight.", VALID_VOLUME_REQUIRED: "Enter valid length, width and height.", SERVICE_REQUIRED: "Select at least one service.", INVALID_SHIPMENT_DATE: "Select a valid pickup date.", NETWORK_ERROR: "LBID could not reach the server. Check your connection and try again." }; return messages[code] || code || "The request could not be submitted." }
