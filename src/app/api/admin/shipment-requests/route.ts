import { NextResponse } from "next/server"

import { getAdminApiContext } from "@/lib/admin"

const fields = "id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at"

export async function GET(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const { data, error } = await admin.service
    .from("shipment_requests")
    .select(fields)
    .eq("status", "PENDING_REVIEW")
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shipmentRequests: data || [] })
}

export async function PATCH(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const id = typeof body.id === "string" ? body.id : ""
  const action = body.action === "reject" ? "reject" : "publish"
  if (!id) return NextResponse.json({ error: "SHIPMENT_REQUEST_ID_REQUIRED" }, { status: 400 })

  const update = action === "publish"
    ? { status: "OPEN", bid_deadline: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() }
    : { status: "REJECTED" }
  const { data, error } = await admin.service
    .from("shipment_requests")
    .update(update)
    .eq("id", id)
    .eq("status", "PENDING_REVIEW")
    .select(fields)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "REQUEST_NOT_PENDING_REVIEW" }, { status: 409 })
  return NextResponse.json({ ok: true, shipmentRequest: data })
}
