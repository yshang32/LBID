import { NextResponse } from "next/server"

import { getApiSupabaseSession } from "@/lib/supabase/api"

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
      return NextResponse.json({ error: "ACCEPT_BID_RPC_NOT_INSTALLED", migration: "supabase-v4-accept-bid-rpc.sql" }, { status: 501 })
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
