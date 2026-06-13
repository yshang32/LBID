import { NextResponse } from "next/server"

import { checkAccess } from "@/lib/backend"
import { inquiries } from "@/lib/data"

export function GET() {
  return NextResponse.json({ shipmentRequests: inquiries })
}

export async function POST(request: Request) {
  const access = checkAccess("create_shipment_request")
  if (!access.allowed) return NextResponse.json({ ok: false, error: "SUBSCRIPTION_REQUIRED", redirect: access.redirect }, { status: 403 })

  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    ok: true,
    shipmentRequest: {
      id: `SR-${Date.now()}`,
      status: "OPEN",
      bidDeadline: body.bidDeadline ?? "3h",
      isAnonymous: body.isAnonymous ?? true,
      ...body,
    },
  }, { status: 201 })
}
