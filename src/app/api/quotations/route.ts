import { NextResponse } from "next/server"

import { checkAccess } from "@/lib/backend"

export async function POST(request: Request) {
  const access = checkAccess("create_quotation")
  if (!access.allowed) return NextResponse.json({ ok: false, error: "SUBSCRIPTION_REQUIRED", redirect: access.redirect }, { status: 403 })

  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    ok: true,
    quotation: {
      id: `quote-${Date.now()}`,
      publicToken: `qt_${Math.random().toString(36).slice(2)}`,
      status: "generated",
      source: body.matchRecordId ? "match_record_rate_card" : "shipment_request_bid",
      ...body,
    },
  }, { status: 201 })
}
