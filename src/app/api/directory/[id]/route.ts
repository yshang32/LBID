import { NextResponse } from "next/server"

import { getDirectory } from "@/lib/backend"
import { getApiSupabaseServiceClient } from "@/lib/supabase/api"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const supabase = getApiSupabaseServiceClient()
  if (supabase) {
    const { data, error } = await supabase
      .from("company_profiles")
      .select("user_id, company_name_zh, company_name_en, logo_url, region, founded_year, company_size, service_routes, service_types, slogan, description, advantage_tags, gallery_images, certifications, reputation_score, is_public")
      .eq("user_id", params.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (data) return NextResponse.json({ profile: data })
  }

  const profile = getDirectory().find((item) => item.slug === params.id)
  if (!profile) return NextResponse.json({ error: "DIRECTORY_PROFILE_NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ profile })
}
