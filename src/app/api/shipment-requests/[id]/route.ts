import { NextResponse } from "next/server"

import { inquiries } from "@/lib/data"
import { createShipmentScopeHash } from "@/lib/shipment-request-validation"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

const fields = "id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at, validation_decision, validation_reasons, validation_score, review_required, scope_version, scope_hash, scope_locked_at, published_at, closed_at, supersedes_request_id, review_reason"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)

  if (session) {
    const service = getApiSupabaseServiceClient()
    if (service) {
      await service
        .from("shipment_requests")
        .update({ status: "CLOSED", closed_at: new Date().toISOString() })
        .eq("id", params.id)
        .eq("status", "OPEN")
        .lt("bid_deadline", new Date().toISOString())
    }

    const { data, error } = await session.supabase
      .from("shipment_requests")
      .select(fields)
      .eq("id", params.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "SR_NOT_FOUND" }, { status: 404 })
    return NextResponse.json({ shipmentRequest: data })
  }

  const shipmentRequest = inquiries.find((item) => item.id === params.id)
  if (!shipmentRequest) return NextResponse.json({ error: "SR_NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ shipmentRequest })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  const body = await request.json().catch(() => ({}))

  if (session) {
    const service = getApiSupabaseServiceClient()
    if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

    const { data: existing, error: existingError } = await service
      .from("shipment_requests")
      .select(fields)
      .eq("id", params.id)
      .maybeSingle()

    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ error: "SR_NOT_FOUND" }, { status: 404 })
    if (existing.agent_id !== session.user.id) return NextResponse.json({ error: "SR_ACCESS_DENIED" }, { status: 403 })
    if (!["PENDING_REVIEW", "NEEDS_CHANGES"].includes(existing.status)) return NextResponse.json({ error: "SR_NOT_EDITABLE" }, { status: 409 })

    const cargoDetails = body.cargo_details ?? body.cargoDetails ?? existing.cargo_details
    const route = body.route ?? existing.route
    const servicesNeeded = body.services_needed ?? body.servicesNeeded ?? existing.services_needed
    const deadline = body.deadline ?? existing.deadline
    if (!route?.origin || !route?.destination) return NextResponse.json({ error: "VALID_ROUTE_REQUIRED" }, { status: 400 })
    if (!Array.isArray(servicesNeeded) || servicesNeeded.length === 0) return NextResponse.json({ error: "SERVICE_REQUIRED" }, { status: 400 })
    if (!Number.isFinite(Number(cargoDetails?.weight_kg)) || Number(cargoDetails.weight_kg) <= 0) return NextResponse.json({ error: "VALID_WEIGHT_REQUIRED" }, { status: 400 })
    if (!Number.isFinite(Number(cargoDetails?.cbm)) || Number(cargoDetails.cbm) <= 0) return NextResponse.json({ error: "VALID_VOLUME_REQUIRED" }, { status: 400 })
    if (Number.isNaN(new Date(deadline).getTime())) return NextResponse.json({ error: "INVALID_SHIPMENT_DATE" }, { status: 400 })

    const scopeHash = createShipmentScopeHash({ cargoDetails, route, servicesNeeded, deadline })

    const update = {
      cargo_details: cargoDetails,
      route,
      services_needed: servicesNeeded,
      deadline,
      is_anonymous: body.isAnonymous ?? body.is_anonymous,
      status: "PENDING_REVIEW",
      validation_decision: "MANUAL_REVIEW",
      validation_reasons: ["RESUBMITTED_AFTER_CHANGES"],
      review_required: true,
      review_reason: null,
      reviewed_by: null,
      reviewed_at: null,
      bid_deadline: null,
      scope_locked_at: null,
      published_at: null,
      scope_hash: scopeHash,
    }

    const { data, error } = await service
      .from("shipment_requests")
      .update(Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)))
      .eq("id", params.id)
      .select(fields)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, shipmentRequest: data })
  }

  return NextResponse.json({
    ok: true,
    shipmentRequest: {
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    },
  })
}
