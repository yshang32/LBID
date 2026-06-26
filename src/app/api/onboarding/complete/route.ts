import { NextResponse } from "next/server"

import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const update = {
    company_name_zh: body.company_name_zh ?? body.companyNameZh,
    company_name_en: body.company_name_en ?? body.companyNameEn,
    region: body.region,
    service_routes: body.service_routes ?? body.serviceRoutes,
    service_types: body.service_types ?? body.serviceTypes,
    description: body.description,
    is_public: body.is_public ?? body.isPublic,
    can_be_client: body.can_be_client ?? body.canBeClient ?? true,
    can_be_forwarder: body.can_be_forwarder ?? body.canBeForwarder ?? true,
    onboarding_completed: true,
    onboarding_step: 4,
  }

  const { data, error } = await session.supabase
    .from("company_profiles")
    .upsert({
      user_id: session.user.id,
      ...Object.fromEntries(Object.entries(update).filter(([, value]) => value !== undefined)),
    })
    .select("user_id, company_name_zh, company_name_en, region, service_routes, service_types, onboarding_completed, onboarding_step, is_public, can_be_client, can_be_forwarder")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    companyProfile: data,
    redirect: "/dashboard",
  })
}
