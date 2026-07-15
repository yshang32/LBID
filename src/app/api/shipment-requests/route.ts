import { NextResponse } from "next/server"

import { checkAccess } from "@/lib/backend"
import { syncBidRecommendations } from "@/lib/bid-recommendations"
import { inquiries } from "@/lib/data"
import { getApiSupabaseServiceClient, getApiSupabaseSession, isSupabaseConfigured } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)

  if (session) {
    const service = getApiSupabaseServiceClient()
    if (service) {
      await service
        .from("shipment_requests")
        .update({ status: "CLOSED" })
        .eq("status", "OPEN")
        .lt("bid_deadline", new Date().toISOString())
    }

    const { data, error } = await session.supabase
      .from("shipment_requests")
      .select("id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at")
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
    // Submission launches the sealed-bid window immediately.
    const bidDeadline = new Date(Date.now() + 3 * 3600000).toISOString()
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

    const { data, error } = await session.supabase
      .from("shipment_requests")
      .insert({
        agent_id: session.user.id,
        cargo_details: cargoDetails,
        route,
        services_needed: servicesNeeded,
        deadline,
        bid_deadline: bidDeadline,
        is_anonymous: body.isAnonymous ?? body.is_anonymous ?? true,
        status: "OPEN",
      })
      .select("id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at")
      .single()

    if (error?.code === "42501") return NextResponse.json({ error: "CLIENT_CAPABILITY_REQUIRED" }, { status: 403 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const service = getApiSupabaseServiceClient()
    const recommendationResult = service
      ? await syncBidRecommendations(service, data)
      : { created: 0 }

    return NextResponse.json({
      ok: true,
      shipmentRequest: data,
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
      status: "OPEN",
      bidDeadline: body.bidDeadline ?? "3h",
      isAnonymous: body.isAnonymous ?? true,
      ...body,
    },
  }, { status: 201 })
}
