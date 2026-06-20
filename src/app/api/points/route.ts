import { NextResponse } from "next/server"

import { getPointBalance, redeemPoints } from "@/lib/points"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  const result = await getPointBalance(session?.supabase || null, session?.user.id || null)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  const body = await request.json().catch(() => ({}))
  if (!body.rewardId) return NextResponse.json({ error: "REWARD_REQUIRED" }, { status: 400 })

  const result = await redeemPoints(session?.supabase || null, session?.user.id || null, body.rewardId)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.error === "INSUFFICIENT_POINTS" ? 402 : 400 })
  return NextResponse.json(result, { status: 201 })
}
