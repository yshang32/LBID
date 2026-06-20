import { NextResponse } from "next/server"

import { confirmPaymentIntent } from "@/lib/payment/confirmPaymentIntent"
import { getStripe } from "@/lib/stripe"
import { getApiSupabaseServiceClient } from "@/lib/supabase/api"

export async function POST(request: Request) {
  const stripe = getStripe()
  const supabase = getApiSupabaseServiceClient()
  const signature = request.headers.get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripe || !supabase || !signature || !secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_NOT_CONFIGURED" }, { status: 503 })
  }

  let event
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret)
  } catch {
    return NextResponse.json({ error: "INVALID_STRIPE_SIGNATURE" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const checkout = event.data.object
    const intentId = checkout.metadata?.paymentIntentId
    if (!intentId) return NextResponse.json({ error: "PAYMENT_INTENT_METADATA_MISSING" }, { status: 400 })

    await supabase
      .from("payment_intents")
      .update({
        stripe_session_id: checkout.id,
        stripe_customer_id: typeof checkout.customer === "string" ? checkout.customer : null,
        stripe_subscription_id: typeof checkout.subscription === "string" ? checkout.subscription : null,
      })
      .eq("id", intentId)
    await confirmPaymentIntent(supabase, intentId, null)
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object
    await supabase
      .from("subscriptions")
      .update({ status: "expired" })
      .eq("stripe_subscription_id", subscription.id)
  }

  return NextResponse.json({
    ok: true,
    handledEvent: event.type,
  })
}
