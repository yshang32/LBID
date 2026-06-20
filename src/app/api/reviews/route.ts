import { NextResponse } from "next/server"

import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get("order_id")

  let query = session.supabase
    .from("reviews")
    .select("id, order_id, agency_id, forwarder_id, rating, comment, created_at")
    .order("created_at", { ascending: false })

  if (orderId) query = query.eq("order_id", orderId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reviews: data })
}

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  const body = await request.json().catch(() => ({}))
  const rating = Number(body.rating ?? 5)
  const scoreChange = rating >= 4 ? 2 : rating <= 2 ? -3 : 0

  if (session) {
    if (!body.orderId) {
      return NextResponse.json({ error: "ORDER_REQUIRED" }, { status: 400 })
    }

    let forwarderId = body.forwarderId
    if (!forwarderId) {
      const service = getApiSupabaseServiceClient()
      if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

      const { data: order, error: orderError } = await service
        .from("orders")
        .select("quotation_id, quotations(forwarder_id)")
        .eq("id", body.orderId)
        .maybeSingle()

      if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })
      const quotation = Array.isArray(order?.quotations) ? order?.quotations[0] : order?.quotations
      forwarderId = quotation?.forwarder_id
    }

    if (!forwarderId) {
      return NextResponse.json({ error: "FORWARDER_NOT_FOUND_FOR_ORDER" }, { status: 404 })
    }

    const { data, error } = await session.supabase
      .from("reviews")
      .insert({
        order_id: body.orderId,
        agency_id: session.user.id,
        forwarder_id: forwarderId,
        rating,
        comment: body.comment ?? null,
      })
      .select("id, order_id, agency_id, forwarder_id, rating, comment, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const service = getApiSupabaseServiceClient()
    const pointsAwarded = rating >= 5 ? 80 : rating >= 4 ? 50 : 0
    let pointTransaction = null

    if (service) {
      if (scoreChange !== 0) {
        await service.from("reputation_events").insert({
          user_id: forwarderId,
          event_type: scoreChange > 0 ? "review_positive" : "review_negative",
          score_change: scoreChange,
        })
      }

      if (pointsAwarded > 0) {
        const { data: user } = await service.from("users").select("points").eq("id", forwarderId).maybeSingle()
        await service.from("users").update({ points: Number(user?.points || 0) + pointsAwarded }).eq("id", forwarderId)
        const { data: pointsRow } = await service.from("point_transactions").insert({
          user_id: forwarderId,
          type: "earn",
          source: rating >= 5 ? "five_star_review" : "positive_review",
          points: pointsAwarded,
          metadata: { reviewId: data.id, orderId: body.orderId, rating },
        }).select("*").single()
        pointTransaction = pointsRow
      }
    }

    return NextResponse.json({
      ok: true,
      review: data,
      pointTransaction,
      reputationEvent: { eventType: rating >= 4 ? "review_positive" : rating <= 2 ? "review_negative" : "review_neutral", scoreChange },
    }, { status: 201 })
  }

  return NextResponse.json({
    ok: true,
    review: { id: `review-${Date.now()}`, ...body, rating },
    reputationEvent: { eventType: rating >= 4 ? "review_positive" : rating <= 2 ? "review_negative" : "review_neutral", scoreChange },
  }, { status: 201 })
}
