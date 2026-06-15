import { NextResponse } from "next/server"

import { getApiSupabaseSession } from "@/lib/supabase/api"

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
    if (!body.orderId || !body.forwarderId) {
      return NextResponse.json({ error: "ORDER_AND_FORWARDER_REQUIRED" }, { status: 400 })
    }

    const { data, error } = await session.supabase
      .from("reviews")
      .insert({
        order_id: body.orderId,
        agency_id: session.user.id,
        forwarder_id: body.forwarderId,
        rating,
        comment: body.comment ?? null,
      })
      .select("id, order_id, agency_id, forwarder_id, rating, comment, created_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({
      ok: true,
      review: data,
      reputationEvent: { eventType: rating >= 4 ? "review_positive" : rating <= 2 ? "review_negative" : "review_neutral", scoreChange },
    }, { status: 201 })
  }

  return NextResponse.json({
    ok: true,
    review: { id: `review-${Date.now()}`, ...body, rating },
    reputationEvent: { eventType: rating >= 4 ? "review_positive" : rating <= 2 ? "review_negative" : "review_neutral", scoreChange },
  }, { status: 201 })
}
