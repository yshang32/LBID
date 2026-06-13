import { NextResponse } from "next/server"

import { spendToken } from "@/lib/backend"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const duration = body.duration ?? body.boostType ?? "1day"
  const amount = duration === "7day" ? 25 : 5
  const session = await getApiSupabaseSession(request)

  if (session) {
    const { supabase, user } = session
    const { data: profile, error: profileError } = await supabase
      .from("company_profiles")
      .select("token_balance_free, token_balance_paid")
      .eq("user_id", user.id)
      .single()

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
    if (profile.token_balance_free + profile.token_balance_paid < amount) {
      return NextResponse.json({ error: "INSUFFICIENT_TOKENS", redirect: "/tokens" }, { status: 402 })
    }

    const balanceType = profile.token_balance_free >= amount ? "free" : "paid"
    const { data: adjustment, error: adjustmentError } = await supabase.rpc("adjust_token_balance", {
      p_user_id: user.id,
      p_amount: -amount,
      p_balance_type: balanceType,
      p_type: "spend",
      p_source: "directory_boost",
      p_related_id: null,
    })

    if (adjustmentError) {
      if (adjustmentError.message.includes("INSUFFICIENT_TOKENS")) {
        return NextResponse.json({ error: "INSUFFICIENT_TOKENS", redirect: "/tokens" }, { status: 402 })
      }
      return NextResponse.json({ error: adjustmentError.message }, { status: 500 })
    }

    const endsAt = new Date()
    endsAt.setDate(endsAt.getDate() + (duration === "7day" ? 7 : 1))

    const { data: boost, error: boostError } = await supabase
      .from("directory_boosts")
      .insert({
        user_id: user.id,
        boost_type: duration,
        starts_at: new Date().toISOString(),
        ends_at: endsAt.toISOString(),
        token_transaction_id: adjustment.token_transaction_id,
      })
      .select()
      .single()

    if (boostError) return NextResponse.json({ error: boostError.message }, { status: 500 })

    return NextResponse.json({ success: true, boost, ...adjustment }, { status: 201 })
  }

  const tokenResult = spendToken("directory_boost", amount)

  if (!tokenResult.ok) return NextResponse.json({ ok: false, error: tokenResult.error, wallet: tokenResult.wallet }, { status: 402 })

  return NextResponse.json({
    ok: true,
    directoryBoost: {
      id: `boost-${Date.now()}`,
      boostType: duration,
      startsAt: new Date().toISOString(),
      endsAt: duration === "7day" ? "in 7 days" : "in 1 day",
      tokenSpend: tokenResult.spent,
    },
    mode: "demo_fallback",
  }, { status: 201 })
}
