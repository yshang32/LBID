import { NextResponse } from "next/server"

import { matchRecords } from "@/lib/data"

export function GET(_request: Request, { params }: { params: { id: string } }) {
  const matchRecord = matchRecords.find((item) => item.id === params.id)
  if (!matchRecord) return NextResponse.json({ error: "MATCH_RECORD_NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ matchRecord })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}))
  const stage = body.stage ?? "in_progress"

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
