import { NextResponse } from "next/server"

import { checkAccess, spendToken } from "@/lib/backend"
import { getApiSupabaseServiceClient, getApiSupabaseSession, isSupabaseConfigured } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) {
    if (isSupabaseConfigured()) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    return NextResponse.json({ bids: [] })
  }

  const { searchParams } = new URL(request.url)
  const srId = searchParams.get("sr_id")

  if (srId) {
    const service = getApiSupabaseServiceClient()
    if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

    const { data: shipmentRequest, error: requestError } = await service
      .from("shipment_requests")
      .select("id, agent_id, status, bid_deadline, scope_version")
      .eq("id", srId)
      .maybeSingle()
    if (requestError) return NextResponse.json({ error: requestError.message }, { status: 500 })
    if (!shipmentRequest) return NextResponse.json({ error: "SHIPMENT_REQUEST_NOT_FOUND" }, { status: 404 })

    const expired = shipmentRequest.status === "OPEN" && shipmentRequest.bid_deadline
      && new Date(shipmentRequest.bid_deadline).getTime() <= Date.now()
    const currentStatus = expired ? "CLOSED" : shipmentRequest.status
    if (expired) {
      const { error: closeError } = await service
        .from("shipment_requests")
        .update({ status: "CLOSED", closed_at: new Date().toISOString() })
        .eq("id", srId)
        .eq("status", "OPEN")
      if (closeError) return NextResponse.json({ error: closeError.message }, { status: 500 })
    }

    const isOwner = shipmentRequest.agent_id === session.user.id
    if (isOwner && currentStatus === "OPEN") {
      const { count, error: countError } = await service
        .from("bids")
        .select("id", { count: "exact", head: true })
        .eq("sr_id", srId)
      if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })
      return NextResponse.json({
        bids: [],
        bidCount: count || 0,
        sealed: true,
        revealAt: shipmentRequest.bid_deadline,
      })
    }

    if (isOwner && ["CLOSED", "AWARDED"].includes(currentStatus)) {
      const { data: bids, error: bidsError } = await service
        .from("bids")
        .select("id, sr_id, forwarder_id, price, currency, transit_time, terms, submitted_at, status, scope_version")
        .eq("sr_id", srId)
        .eq("scope_version", shipmentRequest.scope_version)
        .in("status", ["SUBMITTED", "AWARDED", "NOT_AWARDED", "LEGACY"])
        .order("price", { ascending: true })
      if (bidsError) return NextResponse.json({ error: bidsError.message }, { status: 500 })

      const forwarderIds = [...new Set((bids || []).map((bid) => bid.forwarder_id))]
      const [profilesResult, statsResult] = forwarderIds.length
        ? await Promise.all([
          service
            .from("company_profiles")
            .select("user_id, company_name_zh, company_name_en, logo_url, region, founded_year, company_size, service_routes, service_types, slogan, description, advantage_tags, certifications, reputation_score, verification_status")
            .in("user_id", forwarderIds),
          service
            .from("forwarder_profiles")
            .select("user_id, tier, badges, service_coverage, rating, completed_orders, verified_at")
            .in("user_id", forwarderIds),
        ])
        : [{ data: [], error: null }, { data: [], error: null }]
      const profileError = profilesResult.error || statsResult.error
      if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

      const profiles = new Map((profilesResult.data || []).map((profile) => [profile.user_id, profile]))
      const stats = new Map((statsResult.data || []).map((profile) => [profile.user_id, profile]))
      return NextResponse.json({
        sealed: false,
        bidCount: bids?.length || 0,
        bids: (bids || []).map((bid) => ({
          ...bid,
          forwarder: {
            ...(profiles.get(bid.forwarder_id) || {}),
            ...(stats.get(bid.forwarder_id) || {}),
          },
        })),
      })
    }
  }

  let query = session.supabase
    .from("bids")
    .select("id, sr_id, forwarder_id, price, currency, transit_time, terms, submitted_at")
    .order("submitted_at", { ascending: false })
    .limit(100)

  if (srId) query = query.eq("sr_id", srId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ bids: data, sealed: false })
}

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  const body = await request.json().catch(() => ({}))

  if (session) {
    const { supabase, user } = session
    const srId = String(body.sr_id ?? body.shipmentRequestId ?? "").trim()
    const price = Number(body.price)
    const currency = String(body.currency ?? "HKD").trim().toUpperCase()
    const transitTime = body.transit_time ?? body.transitTime ?? null
    const terms = body.terms ?? null
    if (!srId) return NextResponse.json({ error: "SHIPMENT_REQUEST_ID_REQUIRED" }, { status: 400 })
    if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: "INVALID_BID_PRICE" }, { status: 400 })
    if (!/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ error: "INVALID_BID_CURRENCY" }, { status: 400 })
    if (transitTime != null && String(transitTime).length > 160) return NextResponse.json({ error: "INVALID_TRANSIT_TIME" }, { status: 400 })
    if (terms != null && String(terms).length > 4000) return NextResponse.json({ error: "BID_TERMS_TOO_LONG" }, { status: 400 })

    const { data: sub, error: subError } = await supabase
      .from("subscriptions")
      .select("status, trial_ends_at, current_period_end")
      .eq("user_id", user.id)
      .maybeSingle()

    if (subError) return NextResponse.json({ error: subError.message }, { status: 500 })

    const isTrialActive = sub?.status === "trial" && sub.trial_ends_at && new Date(sub.trial_ends_at) > new Date()
    const isSubscriptionActive = sub?.status === "active"
    if (!isTrialActive && !isSubscriptionActive) {
      return NextResponse.json({ error: "SUBSCRIPTION_REQUIRED", redirect: "/subscription" }, { status: 403 })
    }

    const { data, error } = await supabase.rpc("submit_bid_with_token", {
      p_user_id: user.id,
      p_sr_id: srId,
      p_price: price,
      p_currency: currency,
      p_transit_time: transitTime,
      p_terms: terms,
    })

    if (error) {
      if (error.message.includes("INSUFFICIENT_TOKENS")) {
        return NextResponse.json({ error: "INSUFFICIENT_TOKENS", redirect: "/tokens" }, { status: 402 })
      }
      if (error.message.includes("PROFILE_NOT_FOUND")) {
        return NextResponse.json({ error: "PROFILE_NOT_FOUND", redirect: "/onboarding" }, { status: 404 })
      }
      if (error.message.includes("BID_ALREADY_SUBMITTED")) {
        return NextResponse.json({ error: "BID_ALREADY_SUBMITTED" }, { status: 409 })
      }
      if (error.message.includes("SHIPMENT_REQUEST_NOT_OPEN")) {
        return NextResponse.json({ error: "SHIPMENT_REQUEST_NOT_OPEN" }, { status: 409 })
      }
      if (error.message.includes("INVALID_BID_PRICE") || error.message.includes("INVALID_BID_CURRENCY")) {
        return NextResponse.json({ error: error.message.includes("PRICE") ? "INVALID_BID_PRICE" : "INVALID_BID_CURRENCY" }, { status: 400 })
      }
      if (error.message.includes("UNAUTHORIZED")) {
        return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 403 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const service = getApiSupabaseServiceClient()
    if (service) {
      await service
        .from("bid_recommendations")
        .update({ status: "bid_submitted", updated_at: new Date().toISOString() })
        .eq("shipment_request_id", srId)
        .eq("forwarder_id", user.id)
    }

    return NextResponse.json({ success: true, ...data }, { status: 201 })
  }

  if (isSupabaseConfigured()) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const access = checkAccess("submit_bid")
  if (!access.allowed) return NextResponse.json({ ok: false, error: "SUBSCRIPTION_REQUIRED", redirect: access.redirect }, { status: 403 })

  const tokenResult = spendToken("bid", 1)
  if (!tokenResult.ok) return NextResponse.json({ ok: false, error: tokenResult.error, wallet: tokenResult.wallet }, { status: 402 })

  return NextResponse.json({
    ok: true,
    mode: "demo_fallback",
    bid: {
      id: `bid-${Date.now()}`,
      status: "sealed",
      tokenSpend: tokenResult.spent,
      tokenBalanceAfter: tokenResult.balanceAfter,
      ...body,
    },
  }, { status: 201 })
}
