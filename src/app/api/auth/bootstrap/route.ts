import { NextResponse } from "next/server"

import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "NO_ACTIVE_SESSION" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const companyName = String(body.companyName || body.company_name || "").trim()
  const fullName = String(body.fullName || body.full_name || "").trim()
  const canBeClient = Boolean(body.canBeClient ?? body.can_be_client ?? true)
  const canBeForwarder = Boolean(body.canBeForwarder ?? body.can_be_forwarder ?? false)
  const primaryRole = canBeForwarder && !canBeClient ? "forwarder" : "agency"
  const supabase = getApiSupabaseServiceClient() ?? session.supabase

  const { error: userError } = await supabase
    .from("users")
    .upsert({
      id: session.user.id,
      role: primaryRole,
      company_name: companyName || session.user.email || "LBID Company",
      country: body.country || "Hong Kong",
      email: session.user.email,
      referral_code: `LBID-${session.user.id.slice(0, 8)}`,
    })

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  const { error: profileError } = await supabase
    .from("company_profiles")
    .upsert({
      user_id: session.user.id,
      company_name_en: companyName || session.user.email || "LBID Company",
      region: body.region || "Hong Kong",
      description: fullName ? `Primary contact: ${fullName}` : null,
      service_routes: [],
      service_types: [],
      is_public: false,
      can_be_client: canBeClient,
      can_be_forwarder: canBeForwarder,
      onboarding_completed: false,
      onboarding_step: 1,
      token_balance_free: 5,
    })

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })

  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .upsert({
      user_id: session.user.id,
      plan: "trial",
      status: "trial",
      trial_ends_at: trialEndsAt,
      current_period_end: trialEndsAt,
    }, { onConflict: "user_id" })

  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    user: {
      id: session.user.id,
      role: primaryRole,
      email: session.user.email,
    },
    companyProfile: {
      can_be_client: canBeClient,
      can_be_forwarder: canBeForwarder,
      token_balance_free: 5,
    },
  })
}
