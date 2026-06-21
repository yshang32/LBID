import { NextResponse } from "next/server"

import { checkAccess } from "@/lib/backend"
import { inquiries } from "@/lib/data"
import { getApiSupabaseSession, isSupabaseConfigured } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)

  if (session) {
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
    const deadline = body.deadline ?? body.shipDate ?? new Date(Date.now() + 48 * 3600000).toISOString()
    const bidDeadline = body.bidDeadline ?? body.bid_deadline ?? new Date(Date.now() + 3 * 3600000).toISOString()
    const cargoDetails = body.cargo_details ?? body.cargoDetails ?? {
      cargo: body.cargo ?? body.commodity ?? "General cargo",
      cargo_type: body.cargoType ?? body.cargo_type ?? "general",
      weight_kg: Number(body.weightKg ?? body.grossWeight ?? 0),
      cbm: Number(body.cbm ?? body.volume ?? 0),
      pieces: Number(body.pieces ?? 0),
      mode: body.mode ?? "air",
      incoterm: body.incoterm ?? body.incoterms ?? null,
      budget: body.budget ?? null,
      notes: body.notes ?? null,
    }
    const route = body.route ?? {
      origin: body.origin ?? "Origin pending",
      destination: body.destination ?? "Hong Kong",
    }

    const { data, error } = await session.supabase
      .from("shipment_requests")
      .insert({
        agent_id: session.user.id,
        cargo_details: cargoDetails,
        route,
        services_needed: body.services_needed ?? body.servicesNeeded ?? body.services ?? [],
        deadline,
        bid_deadline: bidDeadline,
        is_anonymous: body.isAnonymous ?? body.is_anonymous ?? true,
        status: body.status ?? "OPEN",
      })
      .select("id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, shipmentRequest: data }, { status: 201 })
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
