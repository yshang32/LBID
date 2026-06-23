import { NextResponse } from "next/server"

import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

  const [profileResult, userResult, requestsResult, ordersResult] = await Promise.all([
    service.from("company_profiles").select("company_name_en, company_name_zh, token_balance_free, token_balance_paid, onboarding_completed, can_be_client, can_be_forwarder").eq("user_id", session.user.id).maybeSingle(),
    service.from("users").select("role").eq("id", session.user.id).maybeSingle(),
    service.from("shipment_requests").select("id, agent_id, route, cargo_details, services_needed, bid_deadline, status, created_at").or(`agent_id.eq.${session.user.id},status.eq.OPEN`).order("created_at", { ascending: false }).limit(100),
    service.from("orders").select("id, status, created_at, quotations(forwarder_id, shipment_request_id, total_amount, shipment_requests(agent_id, route, cargo_details))").order("created_at", { ascending: false }).limit(100),
  ])

  const error = profileResult.error || userResult.error || requestsResult.error || ordersResult.error
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ownRequests = (requestsResult.data || []).filter((item) => item.agent_id === session.user.id)
  const opportunities = (requestsResult.data || []).filter((item) => item.agent_id !== session.user.id && item.status === "OPEN")
  const orders = (ordersResult.data || []).filter((order: any) => {
    const quote = Array.isArray(order.quotations) ? order.quotations[0] : order.quotations
    const shipmentRequest = Array.isArray(quote?.shipment_requests) ? quote.shipment_requests[0] : quote?.shipment_requests
    return quote?.forwarder_id === session.user.id || shipmentRequest?.agent_id === session.user.id
  })

  const closedRequestIds = ownRequests.filter((item) => item.status === "CLOSED").map((item) => item.id)
  const { data: closedBids, error: bidsError } = closedRequestIds.length
    ? await service.from("bids").select("sr_id").in("sr_id", closedRequestIds)
    : { data: [], error: null }
  if (bidsError) return NextResponse.json({ error: bidsError.message }, { status: 500 })

  const bidCountByRequest = new Map<string, number>()
  for (const bid of closedBids || []) bidCountByRequest.set(bid.sr_id, (bidCountByRequest.get(bid.sr_id) || 0) + 1)
  const orderIds = orders.map((order) => order.id)
  const { data: documents, error: documentsError } = orderIds.length
    ? await service.from("documents").select("order_id, type").in("order_id", orderIds)
    : { data: [], error: null }
  if (documentsError) return NextResponse.json({ error: documentsError.message }, { status: 500 })

  const documentTypesByOrder = new Map<string, string[]>()
  for (const document of documents || []) {
    const types = documentTypesByOrder.get(document.order_id) || []
    types.push(String(document.type || "").toLowerCase())
    documentTypesByOrder.set(document.order_id, types)
  }

  return NextResponse.json({
    profile: profileResult.data,
    role: userResult.data?.role || null,
    ownRequests,
    opportunities,
    orders,
    bidCountByRequest: Object.fromEntries(bidCountByRequest),
    documentTypesByOrder: Object.fromEntries(documentTypesByOrder),
  })
}
