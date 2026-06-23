import { NextResponse } from "next/server"

import { syncBidRecommendations } from "@/lib/bid-recommendations"
import { getAdminApiContext } from "@/lib/admin"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

const requestFields = "id, route, cargo_details, services_needed, bid_deadline, status, created_at"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  const service = getApiSupabaseServiceClient()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

  const { data, error } = await service
    .from("bid_recommendations")
    .select(`id, shipment_request_id, match_score, reasons, status, created_at, shipment_requests(${requestFields})`)
    .eq("forwarder_id", session.user.id)
    .order("match_score", { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const recommendations = (data || []).filter((item: any) => item.shipment_requests?.status === "OPEN")
  const pendingIds = recommendations.filter((item: any) => item.status === "pending").map((item: any) => item.id)
  if (pendingIds.length) {
    await service
      .from("bid_recommendations")
      .update({ status: "viewed", viewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .in("id", pendingIds)
  }

  return NextResponse.json({ recommendations })
}

export async function POST(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const { data: requests, error } = await admin.service
    .from("shipment_requests")
    .select(requestFields)
    .eq("status", "OPEN")
    .gt("bid_deadline", new Date().toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const results = await Promise.all((requests || []).map((shipmentRequest) => syncBidRecommendations(admin.service, shipmentRequest)))
  const failures = results.filter((result) => result.error)
  if (failures.length) return NextResponse.json({ error: failures[0].error }, { status: 500 })

  return NextResponse.json({ ok: true, requestsProcessed: results.length, recommendationsCreated: results.reduce((total, result) => total + result.created, 0) })
}
