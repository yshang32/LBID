import type { SupabaseClient } from "@supabase/supabase-js"

import { createNotification } from "@/lib/notifications"

type ShipmentRequestForMatch = {
  id: string
  route?: { origin?: string; destination?: string } | null
  cargo_details?: { mode?: string } | null
  services_needed?: string[] | null
}

type Recommendation = {
  forwarderId: string
  matchScore: number
  reasons: string[]
}

function words(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(words)
  if (value && typeof value === "object") return Object.values(value).flatMap(words)
  return typeof value === "string" ? value.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean) : []
}

function includesAll(haystack: string[], tokens: string[]) {
  return tokens.length > 0 && tokens.every((token) => haystack.includes(token))
}

export function calculateBidRecommendation(request: ShipmentRequestForMatch, profile: any): Recommendation | null {
  const origin = words(request.route?.origin)
  const destination = words(request.route?.destination)
  const routeTokens = words(profile.service_routes)
  const capabilityTokens = words([profile.service_types, profile.advantage_tags, profile.certifications])
  const requestServices = words(request.services_needed)
  const modeTokens = words(request.cargo_details?.mode)
  const reasons: string[] = []
  let score = 0

  if (includesAll(routeTokens, origin) && includesAll(routeTokens, destination)) {
    score += 45
    reasons.push("Route coverage matches this shipment")
  } else if (includesAll(routeTokens, destination)) {
    score += 20
    reasons.push("Destination is within your stated coverage")
  }

  const matchedServices = requestServices.filter((service) => capabilityTokens.includes(service))
  if (requestServices.length && matchedServices.length) {
    score += Math.round((matchedServices.length / requestServices.length) * 25)
    reasons.push("Required services match your company profile")
  }

  if (modeTokens.length && modeTokens.some((token) => capabilityTokens.includes(token))) {
    score += 15
    reasons.push("Transport mode matches your stated capability")
  }

  const reputation = Math.max(0, Number(profile.reputation_score || 0))
  if (reputation > 0) {
    score += Math.min(10, Math.round(reputation / 10))
    reasons.push("Company reputation strengthens this match")
  }

  if (profile.verification_status === "verified") {
    score += 5
    reasons.push("Verified company profile")
  }

  score = Math.min(score, 100)
  return score >= 55 ? { forwarderId: profile.user_id, matchScore: score, reasons } : null
}

export async function syncBidRecommendations(service: SupabaseClient, request: ShipmentRequestForMatch) {
  const { data: profiles, error: profilesError } = await service
    .from("company_profiles")
    .select("user_id, service_routes, service_types, advantage_tags, certifications, reputation_score, verification_status")
    .eq("can_be_forwarder", true)
    .eq("onboarding_completed", true)

  if (profilesError) return { created: 0, error: profilesError.message }

  const matches = (profiles || [])
    .map((profile) => calculateBidRecommendation(request, profile))
    .filter((match): match is Recommendation => Boolean(match))

  if (!matches.length) return { created: 0 }

  const { data: existing, error: existingError } = await service
    .from("bid_recommendations")
    .select("forwarder_id")
    .eq("shipment_request_id", request.id)

  if (existingError) return { created: 0, error: existingError.message }
  const existingForwarderIds = new Set((existing || []).map((row) => row.forwarder_id))
  const created = matches.filter((match) => !existingForwarderIds.has(match.forwarderId))

  const { error: upsertError } = await service
    .from("bid_recommendations")
    .upsert(matches.map((match) => ({
      shipment_request_id: request.id,
      forwarder_id: match.forwarderId,
      match_score: match.matchScore,
      reasons: match.reasons,
      notified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })), { onConflict: "shipment_request_id,forwarder_id" })

  if (upsertError) return { created: 0, error: upsertError.message }

  await Promise.all(created.map((match) => createNotification(service, {
    userId: match.forwarderId,
    type: "bid_recommendation",
    title: "\u65b0\u7684\u7cfb\u7d71\u63a8\u85a6\u7af6\u50f9",
    body: `LBID \u8a8d\u70ba\u9019\u500b\u9700\u6c42\u8207\u4f60\u7684\u516c\u53f8\u6a94\u6848\u6709 ${match.matchScore}% \u914d\u5c0d\u5ea6\u3002`,
    href: `/marketplace/${request.id}`,
    metadata: { shipmentRequestId: request.id, matchScore: match.matchScore, reasons: match.reasons },
  })))

  return { created: created.length, matches: matches.length }
}
