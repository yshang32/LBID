import { NextResponse } from "next/server"

import { orderPipeline } from "@/lib/data"
import { canAccessOrder } from "@/lib/order-parties"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })
  if (!(await canAccessOrder(service, params.id, session.user.id))) return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })

  const { data, error } = await service
    .from("orders")
    .select("id, quotation_id, status, created_at, quotations(id, shipment_request_id, forwarder_id, total_amount, line_items, status, created_at)")
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

  const { data, error } = await service
    .from("orders")
    .update({ status })
    .eq("id", params.id)
    .select("id, quotation_id, status, created_at, quotations(id, shipment_request_id, forwarder_id, total_amount, line_items, status, created_at)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, order: data })
}
