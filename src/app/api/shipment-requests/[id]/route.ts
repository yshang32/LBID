import { NextResponse } from "next/server"

import { inquiries } from "@/lib/data"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)

  if (session) {
    const service = getApiSupabaseServiceClient()
    if (service) {
      await service
        .from("shipment_requests")
        .update({ status: "CLOSED" })
        .eq("id", params.id)
        .eq("status", "OPEN")
        .lt("bid_deadline", new Date().toISOString())
    }

    const { data, error } = await session.supabase
      .from("shipment_requests")
      .select("id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at")
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
      .select("id, agent_id, status")
      .eq("id", params.id)
      .maybeSingle()

    if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })
    if (!existing) return NextResponse.json({ error: "SR_NOT_FOUND" }, { status: 404 })
    if (existing.agent_id !== session.user.id) return NextResponse.json({ error: "SR_ACCESS_DENIED" }, { status: 403 })
    if (existing.status !== "PENDING_REVIEW") return NextResponse.json({ error: "SR_NOT_EDITABLE" }, { status: 409 })

    const update = {
      cargo_details: body.cargo_details ?? body.cargoDetails,
      route: body.route,
      services_needed: body.services_needed ?? body.servicesNeeded,
      deadline: body.deadline,
      is_anonymous: body.isAnonymous ?? body.is_anonymous,
    }

    const { data, error } = await service
      .from("shipment_requests")
      .update(Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)))
      .eq("id", params.id)
      .select("id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at")
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
