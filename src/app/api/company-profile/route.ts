import { NextResponse } from "next/server"

import { companyProfile } from "@/lib/data"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)

  if (session) {
    const { data, error } = await session.supabase
      .from("company_profiles")
      .select("user_id, company_name_zh, company_name_en, region, service_routes, service_types, reputation_score, token_balance_free, token_balance_paid, onboarding_completed, onboarding_step, is_public, can_be_client, can_be_forwarder")
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ companyProfile: data })
  }

  return NextResponse.json({ companyProfile })
}

export async function PATCH(request: Request) {
  const session = await getApiSupabaseSession(request)
  const body = await request.json().catch(() => ({}))

  if (session) {
    const update = {
      company_name_zh: body.company_name_zh ?? body.companyNameZh,
      company_name_en: body.company_name_en ?? body.companyNameEn,
      region: body.region,
      service_routes: body.service_routes ?? body.serviceRoutes,
      service_types: body.service_types ?? body.serviceTypes,
      slogan: body.slogan,
      description: body.description,
      advantage_tags: body.advantage_tags ?? body.advantageTags,
      is_public: body.is_public ?? body.isPublic,
      onboarding_completed: body.onboarding_completed ?? body.onboardingCompleted,
      onboarding_step: body.onboarding_step ?? body.onboardingStep,
      can_be_client: body.can_be_client ?? body.canBeClient,
      can_be_forwarder: body.can_be_forwarder ?? body.canBeForwarder,
    }

    const { data, error } = await session.supabase
      .from("company_profiles")
      .upsert({
        user_id: session.user.id,
        ...Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)),
      })
      .select("user_id, company_name_zh, company_name_en, region, service_routes, service_types, reputation_score, token_balance_free, token_balance_paid, onboarding_completed, onboarding_step, is_public, can_be_client, can_be_forwarder")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, companyProfile: data })
  }

  return NextResponse.json({
    ok: true,
    companyProfile: {
      ...companyProfile,
      ...body,
      updatedAt: new Date().toISOString(),
    },
  })
}
