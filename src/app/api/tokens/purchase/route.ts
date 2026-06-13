import { NextResponse } from "next/server"

import { createPaymentIntent } from "@/lib/backend"
import { tokenPackages } from "@/lib/data"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const session = await getApiSupabaseSession(request)
  const packageId = body.package_id ?? body.packageId ?? "tk-20"
  const paymentMethod = body.payment_method ?? body.paymentMethod ?? "fps"

  if (session) {
    const tokenPackage = tokenPackages.find((item) => item.id === packageId)
    if (!tokenPackage) return NextResponse.json({ error: "INVALID_PACKAGE" }, { status: 400 })

    const amount = Number(tokenPackage.price.replace(/[^0-9]/g, "")) || 0
    const { data: intent, error } = await session.supabase
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
      return NextResponse.json({
        intent_id: intent.id,
        checkout_url: null,
        message: "Stripe session creation is ready to connect when STRIPE_SECRET_KEY is configured.",
      }, { status: 201 })
    }

    return NextResponse.json({
      intent_id: intent.id,
      fps_info: { id: "12345678", name: "LBID Limited" },
      upload_url: `/api/payment-intents/${intent.id}/upload-proof`,
    }, { status: 201 })
  }

  const result = createPaymentIntent({
    type: "token_purchase",
    paymentMethod,
    planOrPackageId: packageId,
  })

  if (!result.ok) return NextResponse.json(result, { status: 400 })
  return NextResponse.json({ ...result, mode: "demo_fallback" }, { status: 201 })
}
