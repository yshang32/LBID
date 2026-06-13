import { NextResponse } from "next/server"

import { checkAccess, spendToken } from "@/lib/backend"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  const body = await request.json().catch(() => ({}))

  if (session) {
    const { supabase, user } = session
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
      p_sr_id: body.sr_id ?? body.shipmentRequestId,
      p_price: body.price,
      p_currency: body.currency ?? "HKD",
      p_transit_time: body.transit_time ?? body.transitTime ?? null,
      p_terms: body.terms ?? null,
    })

    if (error) {
      if (error.message.includes("INSUFFICIENT_TOKENS")) {
        return NextResponse.json({ error: "INSUFFICIENT_TOKENS", redirect: "/tokens" }, { status: 402 })
      }
      if (error.message.includes("PROFILE_NOT_FOUND")) {
        return NextResponse.json({ error: "PROFILE_NOT_FOUND", redirect: "/onboarding/forwarder" }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, ...data })
  }

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
