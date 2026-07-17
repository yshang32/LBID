import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/audit-log"
import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

  const body = await request.json().catch(() => ({}))

  const { data: bid, error: bidLookupError } = await service
    .from("bids")
    .select("sr_id, forwarder_id")
    .eq("id", params.id)
    .maybeSingle()
  if (bidLookupError) return NextResponse.json({ error: bidLookupError.message }, { status: 500 })
  if (!bid) return NextResponse.json({ error: "BID_NOT_FOUND" }, { status: 404 })

  await service
    .from("shipment_requests")
    .update({ status: "CLOSED", closed_at: new Date().toISOString() })
    .eq("id", bid.sr_id)
    .eq("status", "OPEN")
    .lt("bid_deadline", new Date().toISOString())

  const selectionReason = typeof (body.selectionReason ?? body.selection_reason) === "string"
    ? String(body.selectionReason ?? body.selection_reason).trim().slice(0, 1000)
    : null
  const { data, error } = await service.rpc("accept_bid_to_order_v2", {
    p_bid_id: params.id,
    p_requester_id: session.user.id,
    p_selection_reason: selectionReason,
    p_selection_context: body.selectionContext ?? body.selection_context ?? {},
    p_line_items: body.lineItems ?? body.line_items ?? null,
  })

  if (error) {
    if (error.message.includes("Could not find the function") || error.message.includes("accept_bid_to_order_v2")) return NextResponse.json({ error: "ACCEPT_BID_RPC_NOT_INSTALLED" }, { status: 503 })
    if (error.message.includes("BID_NOT_FOUND")) return NextResponse.json({ error: "BID_NOT_FOUND" }, { status: 404 })
    if (error.message.includes("SR_NOT_FOUND")) return NextResponse.json({ error: "SR_NOT_FOUND" }, { status: 404 })
    if (error.message.includes("ONLY_AGENCY_OWNER_CAN_ACCEPT_BID")) return NextResponse.json({ error: "ONLY_AGENCY_OWNER_CAN_ACCEPT_BID" }, { status: 403 })
    if (error.message.includes("SR_ALREADY_AWARDED")) return NextResponse.json({ error: "SR_ALREADY_AWARDED" }, { status: 409 })
    if (error.message.includes("BID_WINDOW_NOT_CLOSED")) return NextResponse.json({ error: "BID_WINDOW_NOT_CLOSED" }, { status: 409 })
    if (error.message.includes("BID_NOT_VALID_FOR_CURRENT_SCOPE")) return NextResponse.json({ error: "BID_NOT_VALID_FOR_CURRENT_SCOPE" }, { status: 409 })
    if (error.message.includes("NON_LOWEST_SELECTION_REASON_REQUIRED")) return NextResponse.json({ error: "NON_LOWEST_SELECTION_REASON_REQUIRED" }, { status: 400 })
    if (error.message.includes("UNAUTHENTICATED")) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const coolingOffUntil = data?.cooling_off_until
  await Promise.all([
    writeAuditLog(service, { actorId: session.user.id, action: "bid_accepted", entityType: "shipment_request", entityId: bid.sr_id, metadata: { bidId: params.id, orderId: data?.order?.id || null, coolingOffUntil, wasLowest: data?.was_lowest ?? null, priceDifference: data?.price_difference ?? null, selectionReason } }),
    createNotification(service, { userId: bid.forwarder_id, type: "bid_awarded", title: "Your bid was selected", body: "The agency selected your bid. Open LBID to continue the order workflow.", href: `/orders/${data?.order?.id || ""}`, metadata: { shipmentRequestId: bid.sr_id, orderId: data?.order?.id || null } }),
  ])
  const { data: forwarder } = await service.from("users").select("email").eq("id", bid.forwarder_id).maybeSingle()
  await sendLbidEmail({ to: forwarder?.email, subject: "LBID: Your bid was selected", text: "Open LBID to continue the order workflow.", html: renderSimpleEmail({ title: "Your bid was selected", body: "The agency selected your bid. Open LBID to continue the order workflow.", ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/zh/orders/${data?.order?.id || ""}`, ctaLabel: "Open order" }), idempotencyKey: `bid-awarded-${params.id}` })

  return NextResponse.json({
    ok: true,
    bidId: data?.bid_id ?? params.id,
    quotation: data?.quotation,
    order: data?.order,
    matchRecord: data?.match_record,
    wasLowest: data?.was_lowest,
    lowestAmount: data?.lowest_amount,
    priceDifference: data?.price_difference,
    coolingOffUntil: data?.cooling_off_until,
  }, { status: 201 })
}
