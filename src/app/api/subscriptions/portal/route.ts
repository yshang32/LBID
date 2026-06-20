import { NextResponse } from "next/server"

import { getStripe } from "@/lib/stripe"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  const service = getApiSupabaseServiceClient()
  const stripe = getStripe()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!service || !stripe) return NextResponse.json({ error: "STRIPE_NOT_CONFIGURED" }, { status: 503 })

  const { data: subscription, error } = await service
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", session.user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!subscription?.stripe_customer_id) return NextResponse.json({ error: "NO_STRIPE_SUBSCRIPTION" }, { status: 404 })

  const portal = await stripe.billingPortal.sessions.create({
    customer: subscription.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:5299"}/zh/subscription`,
  })
  return NextResponse.json({ url: portal.url })
}
