import { NextResponse } from "next/server"

import { matchRecords } from "@/lib/data"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)

  if (session) {
    const { data, error } = await session.supabase
      .from("match_records")
      .select("id, shipment_request_id, agent_id, forwarder_id, winning_quotation_id, matched_at, is_preferred_partner, introduction_period_start, introduction_period_end, rate_card_snapshot, stage, contact_revealed_at")
      .eq("id", params.id)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: "MATCH_RECORD_NOT_FOUND" }, { status: 404 })
    return NextResponse.json({ matchRecord: data })
  }

  const matchRecord = matchRecords.find((item) => item.id === params.id)
  if (!matchRecord) return NextResponse.json({ error: "MATCH_RECORD_NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ matchRecord })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  const body = await request.json().catch(() => ({}))
  const stage = body.stage ?? "in_progress"

  if (session) {
    const { data, error } = await session.supabase
      .from("match_records")
      .update({ stage })
      .eq("id", params.id)
      .select("id, shipment_request_id, agent_id, forwarder_id, winning_quotation_id, matched_at, is_preferred_partner, introduction_period_start, introduction_period_end, rate_card_snapshot, stage, contact_revealed_at")
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({
      ok: true,
      matchRecord: data,
      reputationEvent: stage === "completed" ? { eventType: "match_completed", scoreChange: 5 } : null,
    })
  }

  return NextResponse.json({
    ok: true,
    matchRecord: {
      id: params.id,
      stage,
      updatedAt: new Date().toISOString(),
    },
    reputationEvent: stage === "completed" ? { eventType: "match_completed", scoreChange: 5 } : null,
  })
}
