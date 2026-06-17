import { NextResponse } from "next/server"

import { companyProfile } from "@/lib/data"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)

  if (session) {
    const { data, error } = await session.supabase
      .from("company_profiles")
      .select("user_id, company_name_zh, company_name_en, region, service_routes, service_types, reputation_score, token_balance_free, token_balance_paid, onboarding_completed, onboarding_step, is_public")
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ companyProfile: data })
  }

  return NextResponse.json({ companyProfile })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    ok: true,
    companyProfile: {
      ...companyProfile,
      ...body,
      updatedAt: new Date().toISOString(),
    },
  })
}
