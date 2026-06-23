import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/audit-log"
import { createNotification } from "@/lib/notifications"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  const service = getApiSupabaseServiceClient()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : ""
  if (!reason) return NextResponse.json({ error: "CANCELLATION_REASON_REQUIRED" }, { status: 400 })

  const { data: shipmentRequest, error } = await service
    .from("shipment_requests")
    .select("id, agent_id, status, refusal_count, refusal_limit, award_cooling_off_until")
    .eq("id", params.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!shipmentRequest) return NextResponse.json({ error: "SHIPMENT_REQUEST_NOT_FOUND" }, { status: 404 })
  if (shipmentRequest.agent_id !== session.user.id) return NextResponse.json({ error: "SHIPMENT_REQUEST_ACCESS_DENIED" }, { status: 403 })
  if (["CANCELLED", "REJECTED"].includes(shipmentRequest.status)) return NextResponse.json({ error: "SHIPMENT_REQUEST_ALREADY_CLOSED" }, { status: 409 })

  if (shipmentRequest.status !== "AWARDED") {
    const { error: updateError } = await service.from("shipment_requests").update({ status: "CANCELLED", cancellation_reason: reason, cancelled_at: new Date().toISOString() }).eq("id", params.id)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
    await writeAuditLog(service, { actorId: session.user.id, action: "shipment_request_cancelled", entityType: "shipment_request", entityId: params.id, metadata: { reason } })
    return NextResponse.json({ ok: true, status: "CANCELLED" })
  }

  if (Number(shipmentRequest.refusal_count || 0) >= Number(shipmentRequest.refusal_limit || 3)) return NextResponse.json({ error: "REFUSAL_LIMIT_REACHED", refusalLimit: shipmentRequest.refusal_limit }, { status: 409 })
  const now = new Date()
  const withinCoolingOff = shipmentRequest.award_cooling_off_until ? new Date(shipmentRequest.award_cooling_off_until) >= now : false
  const nextRefusalCount = Number(shipmentRequest.refusal_count || 0) + 1
  const { error: refusalError } = await service.from("shipment_requests").update({ refusal_count: nextRefusalCount, cancellation_reason: reason }).eq("id", params.id).eq("refusal_count", shipmentRequest.refusal_count || 0)
  if (refusalError) return NextResponse.json({ error: refusalError.message }, { status: 500 })
  const { data: cancellation, error: cancellationError } = await service.from("cancellation_requests").insert({ shipment_request_id: params.id, requested_by: session.user.id, reason, kind: withinCoolingOff ? "post_award_cooling_off" : "post_award_review" }).select("id, status, kind").single()
  if (cancellationError) return NextResponse.json({ error: cancellationError.message }, { status: 500 })
  await Promise.all([
    writeAuditLog(service, { actorId: session.user.id, action: "award_cancellation_requested", entityType: "shipment_request", entityId: params.id, metadata: { cancellationRequestId: cancellation.id, withinCoolingOff, nextRefusalCount, reason } }),
    createNotification(service, { userId: session.user.id, type: "cancellation_requested", title: "Cancellation request recorded", body: "LBID has recorded your request for platform review.", href: `/requests/${params.id}`, metadata: { cancellationRequestId: cancellation.id } }),
  ])
  return NextResponse.json({ ok: true, cancellationRequest: cancellation, refusalCount: nextRefusalCount, refusalLimit: shipmentRequest.refusal_limit, withinCoolingOff })
}
