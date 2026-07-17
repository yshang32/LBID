import { createHash } from "node:crypto"

export type ShipmentValidationDecision = "AUTO_APPROVED" | "MANUAL_REVIEW"

type ValidationInput = {
  cargoDetails: Record<string, unknown>
  route: Record<string, unknown>
  servicesNeeded: string[]
  deadline: string
  companyVerificationStatus?: string | null
  companyOnboardingCompleted?: boolean | null
  previousRequestCount: number
  duplicateRequest: boolean
}

export type ShipmentValidationResult = {
  decision: ShipmentValidationDecision
  reviewRequired: boolean
  score: number
  reasons: string[]
}

const HIGH_RISK_TERMS = [
  "battery",
  "cold chain",
  "dangerous",
  "dg",
  "fragile",
  "hazardous",
  "high value",
  "perishable",
  "temperature controlled",
]

function normalizedText(value: unknown): string {
  if (Array.isArray(value)) return value.map(normalizedText).join(" ")
  if (value && typeof value === "object") return Object.values(value).map(normalizedText).join(" ")
  return String(value ?? "").toLowerCase()
}

function hasStandardLocation(route: Record<string, unknown>, prefix: "origin" | "destination") {
  const code = String(route[`${prefix}_code`] ?? "").trim()
  const coordinates = route[`${prefix}_coordinates`]
  return /^[A-Z0-9]{3,5}$/i.test(code)
    && Array.isArray(coordinates)
    && coordinates.length === 2
    && coordinates.every((value) => Number.isFinite(Number(value)))
}

export function evaluateShipmentRequest(input: ValidationInput): ShipmentValidationResult {
  const reasons: string[] = []
  let score = 100
  const verificationStatus = String(input.companyVerificationStatus ?? "pending").toLowerCase()
  const verifiedCompany = ["approved", "verified"].includes(verificationStatus)
    && input.companyOnboardingCompleted === true

  if (!verifiedCompany) {
    reasons.push("COMPANY_VERIFICATION_REQUIRED")
    score -= 35
  }
  if (input.previousRequestCount === 0) {
    reasons.push("FIRST_REQUEST_REVIEW")
    score -= 15
  }
  if (input.duplicateRequest) {
    reasons.push("POSSIBLE_DUPLICATE_REQUEST")
    score -= 50
  }
  if (!hasStandardLocation(input.route, "origin") || !hasStandardLocation(input.route, "destination")) {
    reasons.push("ROUTE_STANDARDISATION_REQUIRED")
    score -= 25
  }

  const cargoRiskText = normalizedText({
    cargo: input.cargoDetails.cargo,
    cargoType: input.cargoDetails.cargo_type,
    characteristics: input.cargoDetails.characteristics,
    notes: input.cargoDetails.notes,
  })
  if (HIGH_RISK_TERMS.some((term) => cargoRiskText.includes(term))) {
    reasons.push("HIGH_RISK_CARGO_REVIEW")
    score -= 35
  }
  if (input.cargoDetails.urgent === true) {
    reasons.push("URGENT_SHIPMENT_REVIEW")
    score -= 15
  }

  const reviewRequired = reasons.length > 0
  return {
    decision: reviewRequired ? "MANUAL_REVIEW" : "AUTO_APPROVED",
    reviewRequired,
    score: Math.max(0, score),
    reasons,
  }
}

export function createShipmentScopeHash(input: {
  cargoDetails: Record<string, unknown>
  route: Record<string, unknown>
  servicesNeeded: string[]
  deadline: string
}) {
  const stableScope = {
    originCode: String(input.route.origin_code ?? input.route.origin ?? "").trim().toUpperCase(),
    destinationCode: String(input.route.destination_code ?? input.route.destination ?? "").trim().toUpperCase(),
    mode: String(input.cargoDetails.mode ?? "").trim().toLowerCase(),
    cargoType: String(input.cargoDetails.cargo_type ?? "").trim().toLowerCase(),
    weightKg: Number(input.cargoDetails.weight_kg ?? 0),
    cbm: Number(input.cargoDetails.cbm ?? 0),
    services: [...input.servicesNeeded].map((item) => item.trim().toLowerCase()).sort(),
    deadline: new Date(input.deadline).toISOString(),
  }
  return createHash("sha256").update(JSON.stringify(stableScope)).digest("hex")
}
