import { NextResponse } from "next/server"

import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const body = await request.json().catch(() => ({}))

  const { data, error } = await session.supabase.rpc("accept_bid_to_order", {
    p_bid_id: params.id,
    p_total_amount: body.totalAmount ?? body.total_amount ?? null,
    p_line_items: body.lineItems ?? body.line_items ?? null,
  })

  if (error) {
    if (error.message.includes("Could not find the function") || error.message.includes("accept_bid_to_order")) {
      const fallback = await acceptBidWithoutRpc(params.id, session.user.id, body)
      if ("error" in fallback) return NextResponse.json(fallback.body, { status: fallback.status })
      return NextResponse.json(fallback.body, { status: 201 })
    }
    if (error.message.includes("BID_NOT_FOUND")) return NextResponse.json({ error: "BID_NOT_FOUND" }, { status: 404 })
    if (error.message.includes("SR_NOT_FOUND")) return NextResponse.json({ error: "SR_NOT_FOUND" }, { status: 404 })
    if (error.message.includes("ONLY_AGENCY_OWNER_CAN_ACCEPT_BID")) return NextResponse.json({ error: "ONLY_AGENCY_OWNER_CAN_ACCEPT_BID" }, { status: 403 })
    if (error.message.includes("SR_ALREADY_AWARDED")) return NextResponse.json({ error: "SR_ALREADY_AWARDED" }, { status: 409 })
    if (error.message.includes("UNAUTHENTICATED")) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    bidId: data?.bid_id ?? params.id,
    quotation: data?.quotation,
    order: data?.order,
    matchRecord: data?.match_record,
  }, { status: 201 })
}

async function acceptBidWithoutRpc(bidId: string, userId: string, body: any) {
  const service = getApiSupabaseServiceClient()
  if (!service) {
    return {
      error: true,
      status: 501,
      body: { error: "ACCEPT_BID_RPC_NOT_INSTALLED", migration: "supabase-v4-accept-bid-rpc.sql" },
    }
  }

  const { data: bid, error: bidError } = await service
    .from("bids")
    .select("id, sr_id, forwarder_id, price, currency, transit_time, terms")
    .eq("id", bidId)
    .maybeSingle()

  if (bidError) return { error: true, status: 500, body: { error: bidError.message } }
  if (!bid) return { error: true, status: 404, body: { error: "BID_NOT_FOUND" } }

  const { data: sr, error: srError } = await service
    .from("shipment_requests")
    .select("id, agent_id, route, services_needed, status")
    .eq("id", bid.sr_id)
    .maybeSingle()

  if (srError) return { error: true, status: 500, body: { error: srError.message } }
  if (!sr) return { error: true, status: 404, body: { error: "SR_NOT_FOUND" } }
  if (sr.agent_id !== userId) return { error: true, status: 403, body: { error: "ONLY_AGENCY_OWNER_CAN_ACCEPT_BID" } }
  if (sr.status === "AWARDED") return { error: true, status: 409, body: { error: "SR_ALREADY_AWARDED" } }

  const lineItems = body.lineItems ?? body.line_items ?? [
    {
      label: "Accepted sealed bid",
      quantity: 1,
      unit: "shipment",
      amount: bid.price,
      currency: bid.currency,
      notes: bid.terms,
    },
  ]

  const { data: quotation, error: quotationError } = await service
    .from("quotations")
    .insert({
      shipment_request_id: sr.id,
      forwarder_id: bid.forwarder_id,
      line_items: lineItems,
      total_amount: body.totalAmount ?? body.total_amount ?? bid.price,
      public_token: `qt_${crypto.randomUUID().replaceAll("-", "")}`,
      status: "accepted",
    })
    .select("id, shipment_request_id, forwarder_id, line_items, total_amount, public_token, status, created_at")
    .single()

  if (quotationError) return { error: true, status: 500, body: { error: quotationError.message } }

  const { data: order, error: orderError } = await service
    .from("orders")
    .insert({ quotation_id: quotation.id, status: "confirmed" })
    .select("id, quotation_id, status, created_at")
    .single()

  if (orderError) return { error: true, status: 500, body: { error: orderError.message } }

  const { data: matchRecord, error: matchError } = await service
    .from("match_records")
    .insert({
      shipment_request_id: sr.id,
      agent_id: sr.agent_id,
      forwarder_id: bid.forwarder_id,
      winning_quotation_id: quotation.id,
      is_preferred_partner: true,
      stage: "order_created",
      contact_revealed_at: new Date().toISOString(),
      rate_card_snapshot: {
        source: "accepted_sealed_bid_fallback",
        bid_id: bid.id,
        order_id: order.id,
        total_amount: quotation.total_amount,
        currency: bid.currency,
        route: sr.route,
        services_needed: sr.services_needed,
        transit_time: bid.transit_time,
      },
    })
    .select("*")
    .single()

  if (matchError) return { error: true, status: 500, body: { error: matchError.message } }

  const { error: srUpdateError } = await service
    .from("shipment_requests")
    .update({ status: "AWARDED" })
    .eq("id", sr.id)

  if (srUpdateError) return { error: true, status: 500, body: { error: srUpdateError.message } }

  return {
    body: {
      ok: true,
      mode: "service_role_fallback",
      bidId,
      quotation,
      order,
      matchRecord,
    },
  }
}
