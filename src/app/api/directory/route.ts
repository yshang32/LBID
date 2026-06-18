import { NextResponse } from "next/server"

import { getDirectory } from "@/lib/backend"
import { getApiSupabaseServiceClient } from "@/lib/supabase/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const supabase = getApiSupabaseServiceClient()
  if (supabase) {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("user_id, company_name_zh, company_name_en, logo_url, region, service_routes, service_types, slogan, description, advantage_tags, certifications, reputation_score, is_public")
      .eq("is_public", true)
      .order("reputation_score", { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ directory: data })
  }

  return NextResponse.json({ directory: getDirectory() })
}
