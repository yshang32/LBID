import { NextResponse } from "next/server"

import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

  await service
    .from("shipment_requests")
    .update({ status: "CLOSED", closed_at: new Date().toISOString() })
    .eq("status", "OPEN")
    .lte("bid_deadline", new Date().toISOString())

  const [profileResult, userResult, subscriptionResult, requestsResult, ordersResult, recommendationsResult, bidsResult] = await Promise.all([
    service.from("company_profiles").select("company_name_en, company_name_zh, token_balance_free, token_balance_paid, onboarding_completed, can_be_client, can_be_forwarder, verification_status, service_routes, service_types, certifications, reputation_score").eq("user_id", session.user.id).maybeSingle(),
    service.from("users").select("role").eq("id", session.user.id).maybeSingle(),
    service.from("subscriptions").select("plan, status, trial_ends_at, current_period_end").eq("user_id", session.user.id).maybeSingle(),
    service.from("shipment_requests").select("id, agent_id, route, cargo_details, services_needed, bid_deadline, status, created_at").or(`agent_id.eq.${session.user.id},status.eq.OPEN`).order("created_at", { ascending: false }).limit(100),
    service.from("orders").select("id, status, created_at, quotations(forwarder_id, shipment_request_id, total_amount, shipment_requests(agent_id, route, cargo_details), forwarder:users!quotations_forwarder_id_fkey(company_name))").order("created_at", { ascending: false }).limit(100),
    service.from("bid_recommendations").select("id, shipment_request_id, match_score, reasons, status, shipment_requests(id, route, cargo_details, bid_deadline, status)").eq("forwarder_id", session.user.id).order("match_score", { ascending: false }).limit(20),
    service.from("bids").select("id, sr_id, forwarder_id, price, currency, transit_time, submitted_at, shipment_requests(id, status, bid_deadline, created_at, route, cargo_details)").eq("forwarder_id", session.user.id).order("submitted_at", { ascending: false }).limit(500),
  ])

  const error = profileResult.error || userResult.error || subscriptionResult.error || requestsResult.error || ordersResult.error || recommendationsResult.error || bidsResult.error
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ownRequests = (requestsResult.data || []).filter((item) => item.agent_id === session.user.id)
  const canBrowseOpportunities = Boolean(profileResult.data?.can_be_forwarder && profileResult.data?.onboarding_completed)
  const opportunityRows = (requestsResult.data || []).filter((item) => item.agent_id !== session.user.id && item.status === "OPEN")
  const clientIds = Array.from(new Set(opportunityRows.map((item) => item.agent_id).filter(Boolean)))
  const { data: clientProfiles, error: clientProfilesError } = clientIds.length
    ? await service.from("company_profiles").select("user_id, verification_status, onboarding_completed").in("user_id", clientIds)
    : { data: [], error: null }
  if (clientProfilesError) return NextResponse.json({ error: clientProfilesError.message }, { status: 500 })
  const clientProfileByUser = new Map((clientProfiles || []).map((profile) => [profile.user_id, profile]))
  const opportunities = canBrowseOpportunities
    ? opportunityRows.map((item) => {
      const { agent_id: clientId, ...publicOpportunity } = item
      return {
        ...publicOpportunity,
        client_verified: clientProfileByUser.get(clientId)?.verification_status === "verified",
        client_onboarded: Boolean(clientProfileByUser.get(clientId)?.onboarding_completed),
      }
    })
    : []
  const orders = (ordersResult.data || []).filter((order: any) => {
    const quote = Array.isArray(order.quotations) ? order.quotations[0] : order.quotations
    const shipmentRequest = Array.isArray(quote?.shipment_requests) ? quote.shipment_requests[0] : quote?.shipment_requests
    return quote?.forwarder_id === session.user.id || shipmentRequest?.agent_id === session.user.id
  })

  const ownRequestIds = ownRequests.map((item) => item.id)
  const { data: requestBids, error: bidsError } = ownRequestIds.length
    ? await service.from("bids").select("sr_id").in("sr_id", ownRequestIds)
    : { data: [], error: null }
  if (bidsError) return NextResponse.json({ error: bidsError.message }, { status: 500 })

  const bidCountByRequest = new Map<string, number>()
  for (const bid of requestBids || []) bidCountByRequest.set(bid.sr_id, (bidCountByRequest.get(bid.sr_id) || 0) + 1)
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
    userId: session.user.id,
    profile: profileResult.data,
    subscription: subscriptionResult.data,
    role: userResult.data?.role || null,
    ownRequests,
    opportunities,
    orders,
    recommendations: (recommendationsResult.data || []).filter((item: any) => {
      const shipmentRequest = Array.isArray(item.shipment_requests) ? item.shipment_requests[0] : item.shipment_requests
      return shipmentRequest?.status === "OPEN" && new Date(shipmentRequest.bid_deadline).getTime() > Date.now()
    }),
    bids: bidsResult.data || [],
    bidCountByRequest: Object.fromEntries(bidCountByRequest),
    documentTypesByOrder: Object.fromEntries(documentTypesByOrder),
  })
}
