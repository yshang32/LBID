import { NextResponse } from "next/server"

import { matchRecords } from "@/lib/data"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)

  if (session) {
    const { data, error } = await session.supabase
      .from("match_records")
      .select("id, shipment_request_id, agent_id, forwarder_id, winning_quotation_id, matched_at, is_preferred_partner, introduction_period_start, introduction_period_end, rate_card_snapshot, stage, contact_revealed_at")
      .order("matched_at", { ascending: false })
      .limit(50)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ matchRecords: data })
  }

  return NextResponse.json({ matchRecords })
}
