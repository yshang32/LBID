import { NextResponse } from "next/server"

import { syncBidRecommendations } from "@/lib/bid-recommendations"
import { createShipmentScopeHash, evaluateShipmentRequest } from "@/lib/shipment-request-validation"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

  const body = await request.json().catch(() => ({}))
  const cargoDetails = body.cargo_details ?? body.cargoDetails
  const route = body.route
  const servicesNeeded = body.services_needed ?? body.servicesNeeded
  const deadline = body.deadline ?? body.shipDate
  if (!route?.origin || !route?.destination) return NextResponse.json({ error: "VALID_ROUTE_REQUIRED" }, { status: 400 })
  if (!Array.isArray(servicesNeeded) || servicesNeeded.length === 0) return NextResponse.json({ error: "SERVICE_REQUIRED" }, { status: 400 })
  if (!Number.isFinite(Number(cargoDetails?.weight_kg)) || Number(cargoDetails.weight_kg) <= 0) return NextResponse.json({ error: "VALID_WEIGHT_REQUIRED" }, { status: 400 })
  if (!Number.isFinite(Number(cargoDetails?.cbm)) || Number(cargoDetails.cbm) <= 0) return NextResponse.json({ error: "VALID_VOLUME_REQUIRED" }, { status: 400 })
  if (!deadline || Number.isNaN(new Date(deadline).getTime())) return NextResponse.json({ error: "INVALID_SHIPMENT_DATE" }, { status: 400 })

  const [{ data: profile, error: profileError }, { count, error: countError }] = await Promise.all([
    service.from("company_profiles").select("can_be_client, verification_status, onboarding_completed").eq("user_id", session.user.id).maybeSingle(),
    service.from("shipment_requests").select("id", { count: "exact", head: true }).eq("agent_id", session.user.id),
  ])
  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
  if (!profile?.can_be_client) return NextResponse.json({ error: "CLIENT_CAPABILITY_REQUIRED" }, { status: 403 })
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

  const normalizedDeadline = new Date(deadline).toISOString()
  const scopeHash = createShipmentScopeHash({ cargoDetails, route, servicesNeeded, deadline: normalizedDeadline })
  const validation = evaluateShipmentRequest({
    cargoDetails,
    route,
    servicesNeeded,
    deadline: normalizedDeadline,
    companyVerificationStatus: profile.verification_status,
    companyOnboardingCompleted: profile.onboarding_completed,
    previousRequestCount: count ?? 0,
    duplicateRequest: false,
  })
  const idempotencyKey = String(request.headers.get("idempotency-key") ?? body.idempotencyKey ?? crypto.randomUUID()).slice(0, 160)

  const { data, error } = await service.rpc("amend_shipment_request_scope", {
    p_original_sr_id: params.id,
    p_requester_id: session.user.id,
    p_cargo_details: cargoDetails,
    p_route: route,
    p_services_needed: servicesNeeded,
    p_deadline: normalizedDeadline,
    p_is_anonymous: body.isAnonymous ?? body.is_anonymous ?? true,
    p_validation_decision: validation.decision,
    p_validation_reasons: validation.reasons,
    p_validation_score: validation.score,
    p_scope_hash: scopeHash,
    p_idempotency_key: idempotencyKey,
  })

  if (error) {
    if (error.message.includes("SR_NOT_FOUND")) return NextResponse.json({ error: "SR_NOT_FOUND" }, { status: 404 })
    if (error.message.includes("SR_ACCESS_DENIED")) return NextResponse.json({ error: "SR_ACCESS_DENIED" }, { status: 403 })
    if (error.message.includes("SR_SCOPE_NOT_AMENDABLE")) return NextResponse.json({ error: "SR_SCOPE_NOT_AMENDABLE" }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const shipmentRequest = data?.shipment_request
  const recommendationResult = shipmentRequest?.status === "OPEN"
    ? await syncBidRecommendations(service, shipmentRequest)
    : { created: 0 }

  return NextResponse.json({
    ok: true,
    shipmentRequest,
    refundedBids: data?.refunded_bids ?? 0,
    validation,
    recommendationsCreated: recommendationResult.created,
  }, { status: 201 })
}
