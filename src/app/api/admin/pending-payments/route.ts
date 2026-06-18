import { NextResponse } from "next/server"

import { confirmPaymentIntent as confirmDemoPaymentIntent, listPaymentIntents } from "@/lib/backend"
import { confirmPaymentIntent } from "@/lib/payment/confirmPaymentIntent"
import { getApiSupabaseServiceClient } from "@/lib/supabase/api"

export async function GET() {
  const supabase = getApiSupabaseServiceClient()
  if (supabase) {
    const { data, error } = await supabase
      .from("payment_intents")
      .select("id, user_id, type, amount, currency, payment_method, status, fps_reference, proof_url, related_plan, related_token_package, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ paymentIntents: data })
  }

  return NextResponse.json({ paymentIntents: listPaymentIntents().filter((intent) => intent.status === "pending") })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  if (body.action !== "confirm") return NextResponse.json({ ok: false, error: "UNSUPPORTED_ADMIN_ACTION" }, { status: 400 })

  const supabase = getApiSupabaseServiceClient()
  if (supabase) {
    try {
      const result = await confirmPaymentIntent(supabase, body.paymentIntentId, null)
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "CONFIRM_FAILED" }, { status: 500 })
    }
  }

  const result = confirmDemoPaymentIntent(body.paymentIntentId)
  if (!result.ok) return NextResponse.json(result, { status: 404 })

  return NextResponse.json({ ...result, mode: "demo_fallback" })
}
