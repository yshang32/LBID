import { NextResponse } from "next/server"

import { getBackendSnapshot } from "@/lib/backend"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (session) {
    const { data, error } = await session.supabase
      .from("subscriptions")
      .select("user_id, plan, status, trial_ends_at, current_period_end, created_at")
      .eq("user_id", session.user.id)
      .maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ subscription: data })
  }
  return NextResponse.json({ subscription: getBackendSnapshot().subscription })
}
