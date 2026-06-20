import { NextResponse } from "next/server"

import { createNotification } from "@/lib/notifications"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  const service = getApiSupabaseServiceClient()
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

  const { data: adminProfile } = await service
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  if (adminProfile?.role !== "admin") return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const approved = body.action !== "reject"
  const { data, error } = await service
    .from("company_profiles")
    .update({
      verification_status: approved ? "verified" : "rejected",
      verified_at: approved ? new Date().toISOString() : null,
      verified_by: session.user.id,
      is_public: approved ? true : body.isPublic ?? false,
    })
    .eq("user_id", params.id)
    .select("user_id, company_name_en, company_name_zh, verification_status, verified_at, is_public")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await createNotification(service, {
    userId: params.id,
    type: approved ? "forwarder_verified" : "forwarder_rejected",
    title: approved ? "Forwarder profile verified" : "Forwarder verification needs review",
    body: approved ? "Your company profile is now verified and visible in the LBID directory." : "Your company profile needs further review before publication.",
    href: "/profile",
    metadata: { userId: params.id },
  })

  return NextResponse.json({ ok: true, profile: data })
}
