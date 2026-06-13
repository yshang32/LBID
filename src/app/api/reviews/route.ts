import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const rating = Number(body.rating ?? 5)
  const scoreChange = rating >= 4 ? 2 : rating <= 2 ? -3 : 0

  return NextResponse.json({
    ok: true,
    review: { id: `review-${Date.now()}`, ...body, rating },
    reputationEvent: { eventType: rating >= 4 ? "review_positive" : rating <= 2 ? "review_negative" : "review_neutral", scoreChange },
  }, { status: 201 })
}
