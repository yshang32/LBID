import { NextResponse } from "next/server"

import { createPaymentIntent } from "@/lib/backend"
import { getStripe } from "@/lib/stripe"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

const plans = {
  monthly: { amount: 388, interval: "month" as const, label: "LBID Monthly Member" },
  annual: { amount: 3880, interval: "year" as const, label: "LBID Annual Member" },
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const session = await getApiSupabaseSession(request)
  const planId = body.planId === "annual" ? "annual" : "monthly"

  if (session) {
    const service = getApiSupabaseServiceClient()
    const stripe = getStripe()
    if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 503 })
    if (!stripe) return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 503 })

    const plan = plans[planId]
    const { data: intent, error } = await service
      .from("payment_intents")
      .insert({
        user_id: session.user.id,
        type: "subscription",
        amount: plan.amount,
        currency: "HKD",
        payment_method: "stripe",
        status: "pending",
        related_plan: { plan_id: planId },
      })
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const checkout = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: session.user.email ?? undefined,
      client_reference_id: session.user.id,
      metadata: { paymentIntentId: intent.id, userId: session.user.id, kind: "subscription" },
      subscription_data: { metadata: { paymentIntentId: intent.id, userId: session.user.id } },
      line_items: [{
        quantity: 1,
        price_data: {
          currency: "hkd",
          unit_amount: plan.amount * 100,
          recurring: { interval: plan.interval },
          product_data: { name: plan.label },
        },
      }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:5299"}/zh/subscription?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:5299"}/zh/subscription?checkout=cancelled`,
    })

    await service.from("payment_intents").update({ stripe_session_id: checkout.id }).eq("id", intent.id)
    return NextResponse.json({ intent_id: intent.id, checkout_url: checkout.url }, { status: 201 })
  }

  const result = createPaymentIntent({
    type: "subscription",
    paymentMethod: body.paymentMethod ?? "stripe",
    planOrPackageId: planId,
  })

  if (!result.ok) return NextResponse.json(result, { status: 400 })
  return NextResponse.json(result, { status: 201 })
}
