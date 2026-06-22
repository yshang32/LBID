import { NextResponse } from "next/server"

import { createNotification } from "@/lib/notifications"
import { canAccessOrder, canManageOrderFulfillment, getOrderParties } from "@/lib/order-parties"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })
  if (!(await canAccessOrder(service, params.id, session.user.id))) return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })
  if (!(await canManageOrderFulfillment(service, params.id, session.user.id))) return NextResponse.json({ error: "TRACKING_UPDATE_DENIED" }, { status: 403 })

  const { data, error } = await service
    .from("tracking_events")
    .select("*")
    .eq("order_id", params.id)
    .order("occurred_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tracking: data || [] })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (!body.status || !body.description) return NextResponse.json({ error: "TRACKING_FIELDS_REQUIRED" }, { status: 400 })

  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })
  if (!(await canAccessOrder(service, params.id, session.user.id))) return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })

  const { data, error } = await service.from("tracking_events").insert({
    order_id: params.id,
    status: body.status,
    location: body.location || null,
    description: body.description,
    occurred_at: body.occurredAt || new Date().toISOString(),
    created_by: session.user.id,
  }).select("*").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const parties = await getOrderParties(service, params.id)
  await Promise.all([parties?.agencyId, parties?.forwarderId].filter(Boolean).map((userId) => createNotification(service, {
    userId: userId as string,
    type: "tracking_update",
    title: "Tracking updated",
    body: `${body.status}: ${body.description}`,
    href: `/orders/${params.id}/tracking`,
    metadata: { orderId: params.id, trackingEventId: data.id },
  })))

  return NextResponse.json({ ok: true, event: data }, { status: 201 })
}
