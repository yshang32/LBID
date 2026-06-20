import { NextResponse } from "next/server"

import { getDirectory } from "@/lib/backend"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  const service = getApiSupabaseServiceClient()

  if (!session || !service) {
    return NextResponse.json({ forwarders: getDirectory().slice(0, 3).map((item) => ({
      id: item.slug,
      companyName: item.name,
      region: "Hong Kong",
      verificationStatus: "pending",
      isPublic: true,
      mode: "demo_fallback",
    })) })
  }

  const { data: user } = await service.from("users").select("role").eq("id", session.user.id).maybeSingle()
  if (user?.role !== "admin") return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const { data, error } = await service
    .from("company_profiles")
    .select("user_id, company_name_zh, company_name_en, region, verification_status, verified_at, is_public, reputation_score")
    .order("verified_at", { ascending: true, nullsFirst: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ forwarders: (data || []).map((item: any) => ({
    id: item.user_id,
    companyName: item.company_name_en || item.company_name_zh || item.user_id,
    region: item.region || "Hong Kong",
    verificationStatus: item.verification_status || "pending",
    verifiedAt: item.verified_at,
    isPublic: item.is_public,
    reputationScore: item.reputation_score || 0,
  })) })
}
