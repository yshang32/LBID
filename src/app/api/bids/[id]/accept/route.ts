import { NextResponse } from "next/server"

import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

type BidRow = {
  id: string
  sr_id: string
  forwarder_id: string
  price: number
  currency: string
  transit_time: string | null
  terms: string | null
}

type ShipmentRequestRow = {
  id: string
  agent_id: string
  cargo_details: Record<string, unknown>
  route: Record<string, unknown>
  services_needed: string[]
  status: string
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

  const body = await request.json().catch(() => ({}))

  const { data: bid, error: bidError } = await service
    .from("bids")
    .select("id, sr_id, forwarder_id, price, currency, transit_time, terms")
    .eq("id", params.id)
    .maybeSingle<BidRow>()

  if (bidError) return NextResponse.json({ error: bidError.message }, { status: 500 })
  if (!bid) return NextResponse.json({ error: "BID_NOT_FOUND" }, { status: 404 })

  const { data: shipmentRequest, error: srError } = await service
    .from("shipment_requests")
    .select("id, agent_id, cargo_details, route, services_needed, status")
    .eq("id", bid.sr_id)
    .maybeSingle<ShipmentRequestRow>()

  if (srError) return NextResponse.json({ error: srError.message }, { status: 500 })
  if (!shipmentRequest) return NextResponse.json({ error: "SR_NOT_FOUND" }, { status: 404 })
  if (shipmentRequest.agent_id !== session.user.id) {
    return NextResponse.json({ error: "ONLY_AGENCY_OWNER_CAN_ACCEPT_BID" }, { status: 403 })
  }

  const publicToken = `qt_${crypto.randomUUID().replaceAll("-", "")}`
  const lineItems = body.lineItems ?? [
    {
      label: "Accepted sealed bid",
      quantity: 1,
      unit: "shipment",
      amount: Number(bid.price),
      currency: bid.currency,
      notes: bid.terms,
    },
  ]

  const { data: quotation, error: quotationError } = await service
    .from("quotations")
    .insert({
      shipment_request_id: shipmentRequest.id,
      forwarder_id: bid.forwarder_id,
      line_items: lineItems,
      total_amount: Number(body.totalAmount ?? bid.price),
      public_token: publicToken,
      status: "accepted",
    })
    .select("id, shipment_request_id, forwarder_id, line_items, total_amount, public_token, status, created_at")
    .single()

  if (quotationError) return NextResponse.json({ error: quotationError.message }, { status: 500 })

  const { data: order, error: orderError } = await service
    .from("orders")
    .insert({
      quotation_id: quotation.id,
      status: "confirmed",
    })
    .select("id, quotation_id, status, created_at")
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  const { data: matchRecord, error: matchError } = await service
    .from("match_records")
    .insert({
      shipment_request_id: shipmentRequest.id,
      agent_id: shipmentRequest.agent_id,
      forwarder_id: bid.forwarder_id,
      winning_quotation_id: quotation.id,
      is_preferred_partner: true,
      rate_card_snapshot: {
        source: "accepted_sealed_bid",
        bid_id: bid.id,
        total_amount: quotation.total_amount,
        currency: bid.currency,
        route: shipmentRequest.route,
        services_needed: shipmentRequest.services_needed,
        transit_time: bid.transit_time,
      },
      stage: "order_created",
      contact_revealed_at: new Date().toISOString(),
    })
    .select("id, shipment_request_id, agent_id, forwarder_id, winning_quotation_id, stage, contact_revealed_at, matched_at")
    .single()

  if (matchError) return NextResponse.json({ error: matchError.message }, { status: 500 })

  await service
    .from("shipment_requests")
    .update({ status: "AWARDED" })
    .eq("id", shipmentRequest.id)

  return NextResponse.json({
    ok: true,
    bidId: bid.id,
    quotation,
    order,
    matchRecord,
  }, { status: 201 })
}
