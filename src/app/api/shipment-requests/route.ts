import { NextResponse } from "next/server"

import { checkAccess } from "@/lib/backend"
import { syncBidRecommendations } from "@/lib/bid-recommendations"
import { inquiries } from "@/lib/data"
import { createShipmentScopeHash, evaluateShipmentRequest } from "@/lib/shipment-request-validation"
import { getApiSupabaseServiceClient, getApiSupabaseSession, isSupabaseConfigured } from "@/lib/supabase/api"

const fields = "id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at, validation_decision, validation_reasons, validation_score, review_required, scope_version, scope_hash, scope_locked_at, published_at, closed_at, supersedes_request_id, idempotency_key"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)

  if (session) {
    const service = getApiSupabaseServiceClient()
    if (service) {
      await service
        .from("shipment_requests")
        .update({ status: "CLOSED", closed_at: new Date().toISOString() })
        .eq("status", "OPEN")
        .lt("bid_deadline", new Date().toISOString())
    }

    const { data, error } = await session.supabase
      .from("shipment_requests")
      .select(fields)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ shipmentRequests: data })
  }

  if (isSupabaseConfigured()) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  return NextResponse.json({ shipmentRequests: inquiries })
}

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  const body = await request.json().catch(() => ({}))

  if (session) {
    const rawDeadline = body.deadline ?? body.shipDate ?? new Date(Date.now() + 48 * 3600000).toISOString()
    const deadlineDate = new Date(rawDeadline)
    if (Number.isNaN(deadlineDate.getTime())) {
      return NextResponse.json({ error: "INVALID_SHIPMENT_DATE" }, { status: 400 })
    }
    const deadline = deadlineDate.toISOString()
    const suppliedCargo = body.cargo_details ?? body.cargoDetails ?? {}
    const suppliedRoute = body.route && typeof body.route === "object" ? body.route : {}
    const cargoDetails = {
      ...suppliedCargo,
      cargo: suppliedCargo.cargo ?? body.cargo ?? body.commodity ?? body.cargoType ?? "General cargo",
      cargo_type: suppliedCargo.cargo_type ?? body.cargoType ?? body.cargo_type ?? "general",
      weight_kg: Number(suppliedCargo.weight_kg ?? body.weightKg ?? body.grossWeight ?? 0),
      cbm: Number(suppliedCargo.cbm ?? body.cbm ?? body.volume ?? 0),
      pieces: Number(suppliedCargo.pieces ?? body.pieces ?? 0),
      mode: suppliedCargo.mode ?? body.mode ?? "air",
      incoterm: suppliedCargo.incoterm ?? body.incoterm ?? body.incoterms ?? null,
      budget: suppliedCargo.budget ?? body.budget ?? null,
      notes: suppliedCargo.notes ?? body.notes ?? null,
    }
    const route = {
      ...suppliedRoute,
      origin: String(suppliedRoute.origin ?? body.origin ?? "").trim(),
      destination: String(suppliedRoute.destination ?? body.destination ?? "").trim(),
    }
    const servicesNeeded = body.services_needed ?? body.servicesNeeded ?? body.services ?? []

    if (!route.origin) return NextResponse.json({ error: "ORIGIN_REQUIRED" }, { status: 400 })
    if (!route.destination) return NextResponse.json({ error: "DESTINATION_REQUIRED" }, { status: 400 })
    if (!String(cargoDetails.cargo_type || "").trim()) return NextResponse.json({ error: "CARGO_TYPE_REQUIRED" }, { status: 400 })
    if (!Number.isFinite(cargoDetails.weight_kg) || cargoDetails.weight_kg <= 0) return NextResponse.json({ error: "VALID_WEIGHT_REQUIRED" }, { status: 400 })
    if (!Number.isFinite(cargoDetails.cbm) || cargoDetails.cbm <= 0) return NextResponse.json({ error: "VALID_VOLUME_REQUIRED" }, { status: 400 })
    if (!Array.isArray(servicesNeeded) || servicesNeeded.length === 0) return NextResponse.json({ error: "SERVICE_REQUIRED" }, { status: 400 })

    const service = getApiSupabaseServiceClient()
    if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

    const idempotencyKey = String(request.headers.get("idempotency-key") ?? body.idempotencyKey ?? "").trim().slice(0, 160) || null
    if (idempotencyKey) {
      const { data: replay, error: replayError } = await service
        .from("shipment_requests")
        .select(fields)
        .eq("agent_id", session.user.id)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle()
      if (replayError) return NextResponse.json({ error: replayError.message }, { status: 500 })
      if (replay) return NextResponse.json({ ok: true, replayed: true, shipmentRequest: replay }, { status: 200 })
    }

    const scopeHash = createShipmentScopeHash({ cargoDetails, route, servicesNeeded, deadline })
    const duplicateSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const [profileResult, requestCountResult, duplicateResult] = await Promise.all([
      service
        .from("company_profiles")
        .select("can_be_client, verification_status, onboarding_completed")
        .eq("user_id", session.user.id)
        .maybeSingle(),
      service
        .from("shipment_requests")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", session.user.id),
      service
        .from("shipment_requests")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", session.user.id)
        .eq("scope_hash", scopeHash)
        .gte("created_at", duplicateSince)
        .neq("status", "CANCELLED"),
    ])
    if (profileResult.error) return NextResponse.json({ error: profileResult.error.message }, { status: 500 })
    if (!profileResult.data?.can_be_client) return NextResponse.json({ error: "CLIENT_CAPABILITY_REQUIRED" }, { status: 403 })
    if (requestCountResult.error) return NextResponse.json({ error: requestCountResult.error.message }, { status: 500 })
    if (duplicateResult.error) return NextResponse.json({ error: duplicateResult.error.message }, { status: 500 })

    const validation = evaluateShipmentRequest({
      cargoDetails,
      route,
      servicesNeeded,
      deadline,
      companyVerificationStatus: profileResult.data.verification_status,
      companyOnboardingCompleted: profileResult.data.onboarding_completed,
      previousRequestCount: requestCountResult.count ?? 0,
      duplicateRequest: (duplicateResult.count ?? 0) > 0,
    })
    const publishedAt = validation.reviewRequired ? null : new Date().toISOString()
    const bidDeadline = validation.reviewRequired ? null : new Date(Date.now() + 3 * 3600000).toISOString()

    const { data, error } = await service
      .from("shipment_requests")
      .insert({
        agent_id: session.user.id,
        cargo_details: cargoDetails,
        route,
        services_needed: servicesNeeded,
        deadline,
        bid_deadline: bidDeadline,
        is_anonymous: body.isAnonymous ?? body.is_anonymous ?? true,
        status: validation.reviewRequired ? "PENDING_REVIEW" : "OPEN",
        validation_decision: validation.decision,
        validation_reasons: validation.reasons,
        validation_score: validation.score,
        review_required: validation.reviewRequired,
        scope_version: 1,
        scope_hash: scopeHash,
        scope_locked_at: publishedAt,
        published_at: publishedAt,
        idempotency_key: idempotencyKey,
      })
      .select(fields)
      .single()

    if (error?.code === "23505" && idempotencyKey) {
      const { data: replay } = await service.from("shipment_requests").select(fields).eq("agent_id", session.user.id).eq("idempotency_key", idempotencyKey).maybeSingle()
      if (replay) return NextResponse.json({ ok: true, replayed: true, shipmentRequest: replay }, { status: 200 })
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const recommendationResult = data.status === "OPEN"
      ? await syncBidRecommendations(service, data)
      : { created: 0 }

    return NextResponse.json({
      ok: true,
      shipmentRequest: data,
      validation,
      recommendationsCreated: recommendationResult.created,
    }, { status: 201 })
  }

  if (isSupabaseConfigured()) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const access = checkAccess("create_shipment_request")
  if (!access.allowed) return NextResponse.json({ ok: false, error: "SUBSCRIPTION_REQUIRED", redirect: access.redirect }, { status: 403 })

  return NextResponse.json({
    ok: true,
    shipmentRequest: {
      id: `SR-${Date.now()}`,
      status: "PENDING_REVIEW",
      bidDeadline: null,
      isAnonymous: body.isAnonymous ?? true,
      ...body,
    },
  }, { status: 201 })
}
