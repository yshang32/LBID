import { NextResponse } from "next/server"

import { confirmPaymentIntent as confirmDemoPaymentIntent } from "@/lib/backend"
import { confirmPaymentIntent } from "@/lib/payment/confirmPaymentIntent"
import { getApiSupabaseServiceClient } from "@/lib/supabase/api"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const supabase = getApiSupabaseServiceClient()
  let result: unknown = { ok: true, event: body.type ?? "checkout.session.completed" }

  if (body.paymentIntentId && supabase) {
    result = await confirmPaymentIntent(supabase, body.paymentIntentId, null)
  } else if (body.paymentIntentId) {
    result = { ...confirmDemoPaymentIntent(body.paymentIntentId), mode: "demo_fallback" }
  }

  return NextResponse.json({
    ok: true,
    provider: body.provider ?? "stripe",
    handledEvent: body.type ?? "checkout.session.completed",
    result,
  })
}
