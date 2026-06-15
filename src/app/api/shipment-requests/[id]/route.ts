import { NextResponse } from "next/server"

import { inquiries } from "@/lib/data"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)

  if (session) {
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
    const update = {
      cargo_details: body.cargo_details ?? body.cargoDetails,
      route: body.route,
      services_needed: body.services_needed ?? body.servicesNeeded,
      deadline: body.deadline,
      bid_deadline: body.bidDeadline ?? body.bid_deadline,
      is_anonymous: body.isAnonymous ?? body.is_anonymous,
      status: body.status,
    }

    const { data, error } = await session.supabase
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
