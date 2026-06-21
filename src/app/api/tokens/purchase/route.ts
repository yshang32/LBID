import { NextResponse } from "next/server"

import { createPaymentIntent } from "@/lib/backend"
import { tokenPackages } from "@/lib/data"
import { getStripe } from "@/lib/stripe"
import { getApiSupabaseServiceClient, getApiSupabaseSession, isSupabaseConfigured } from "@/lib/supabase/api"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const session = await getApiSupabaseSession(request)
  const packageId = body.package_id ?? body.packageId ?? "tk-20"
  const paymentMethod = body.payment_method ?? body.paymentMethod ?? "fps"

  if (session) {
    const tokenPackage = tokenPackages.find((item) => item.id === packageId)
    if (!tokenPackage) return NextResponse.json({ error: "INVALID_PACKAGE" }, { status: 400 })

    const amount = Number(tokenPackage.price.replace(/[^0-9]/g, "")) || 0
    const service = getApiSupabaseServiceClient()
    if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 503 })

    const { data: intent, error } = await service
      .from("payment_intents")
      .insert({
        user_id: session.user.id,
        type: "token_purchase",
        amount,
        currency: "HKD",
        payment_method: paymentMethod,
        status: "pending",
        related_token_package: {
          package_id: tokenPackage.id,
          tokens: tokenPackage.tokens,
          price: tokenPackage.price,
        },
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (paymentMethod === "stripe") {
      const stripe = getStripe()
      if (!stripe) return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 503 })

      const checkout = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: session.user.email ?? undefined,
        client_reference_id: session.user.id,
        metadata: { paymentIntentId: intent.id, userId: session.user.id, kind: "token_purchase" },
        line_items: [{
          quantity: 1,
          price_data: {
            currency: "hkd",
            unit_amount: Math.round(amount * 100),
            product_data: { name: `LBID ${tokenPackage.tokens} Token Package` },
          },
        }],
        success_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:5299"}/zh/tokens?checkout=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:5299"}/zh/tokens?checkout=cancelled`,
      })

      await service.from("payment_intents").update({ stripe_session_id: checkout.id }).eq("id", intent.id)
      return NextResponse.json({
        intent_id: intent.id,
        checkout_url: checkout.url,
      }, { status: 201 })
    }

    return NextResponse.json({
      intent_id: intent.id,
      fps_info: { id: "12345678", name: "LBID Limited" },
      upload_url: `/api/payment-intents/${intent.id}/upload-proof`,
    }, { status: 201 })
  }

  if (isSupabaseConfigured()) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const result = createPaymentIntent({
    type: "token_purchase",
    paymentMethod,
    planOrPackageId: packageId,
  })

  if (!result.ok) return NextResponse.json(result, { status: 400 })
  return NextResponse.json({ ...result, mode: "demo_fallback" }, { status: 201 })
}
