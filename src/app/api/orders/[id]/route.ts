import { NextResponse } from "next/server"

import { orderPipeline } from "@/lib/data"
import { canAccessOrder, canManageOrderFulfillment, getOrderParties } from "@/lib/order-parties"
import { createNotification } from "@/lib/notifications"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })
  if (!(await canAccessOrder(service, params.id, session.user.id))) return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })
  if (!(await canManageOrderFulfillment(service, params.id, session.user.id))) return NextResponse.json({ error: "ORDER_STATUS_UPDATE_DENIED" }, { status: 403 })

  const { data, error } = await service
    .from("orders")
    .select("id, quotation_id, status, created_at, quotations(id, shipment_request_id, forwarder_id, total_amount, line_items, status, created_at, shipment_requests(route, cargo_details))")
    .eq("id", params.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ order: data })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })
  if (!(await canAccessOrder(service, params.id, session.user.id))) return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const status = body.status

  if (!orderPipeline.includes(status)) {
    return NextResponse.json({ error: "INVALID_ORDER_STATUS", allowed: orderPipeline }, { status: 400 })
  }

  const { data: existing, error: existingError } = await service
    .from("orders")
    .select("status")
    .eq("id", params.id)
    .maybeSingle()
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 })
  if (!existing) return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 })

  const currentIndex = orderPipeline.indexOf(existing.status)
  const nextIndex = orderPipeline.indexOf(status)
  if (nextIndex !== currentIndex && nextIndex !== currentIndex + 1) {
    return NextResponse.json({ error: "ORDER_STATUS_TRANSITION_INVALID", current: existing.status }, { status: 409 })
  }

  const { data, error } = await service
    .from("orders")
    .update({ status })
    .eq("id", params.id)
    .select("id, quotation_id, status, created_at, quotations(id, shipment_request_id, forwarder_id, total_amount, line_items, status, created_at, shipment_requests(route, cargo_details))")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (data.status !== existing.status) {
    const parties = await getOrderParties(service, params.id)
    const recipients = [parties?.agencyId, parties?.forwarderId].filter((id): id is string => Boolean(id) && id !== session.user.id)
    await Promise.all(recipients.map((userId) => createNotification(service, {
      userId,
      type: "order_status_updated",
      title: "Order status updated",
      body: `Order ${params.id} is now ${data.status}.`,
      href: `/orders/${params.id}`,
      metadata: { orderId: params.id, status: data.status },
    })))
  }

  return NextResponse.json({ ok: true, order: data })
}
