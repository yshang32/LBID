import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/audit-log"
import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"
import { confirmPaymentIntent } from "@/lib/payment/confirmPaymentIntent"
import { createNotification } from "@/lib/notifications"
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
    const result = await confirmPaymentIntent(supabase, intentId, null)
    if (!result.alreadyConfirmed) {
      await Promise.all([
        writeAuditLog(supabase, { action: "stripe_payment_confirmed", entityType: "payment_intent", entityId: intentId, metadata: { stripeSessionId: checkout.id } }),
        createNotification(supabase, { userId: result.userId, type: "payment_confirmed", title: "Payment confirmed", body: "Your LBID payment has been confirmed and access is now updated.", href: "/subscription", metadata: { paymentIntentId: intentId } }),
      ])
      const { data: user } = await supabase.from("users").select("email").eq("id", result.userId).maybeSingle()
      await sendLbidEmail({ to: user?.email, subject: "LBID: Payment confirmed", text: "Your LBID payment has been confirmed and access is now updated.", html: renderSimpleEmail({ title: "Payment confirmed", body: "Your LBID payment has been confirmed and access is now updated.", ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/zh/subscription`, ctaLabel: "Open membership" }), idempotencyKey: `stripe-payment-confirmed-${intentId}` })
    }
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
