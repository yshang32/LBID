import { NextResponse } from "next/server"

import { inquiries } from "@/lib/data"

export function GET(_request: Request, { params }: { params: { id: string } }) {
  const shipmentRequest = inquiries.find((item) => item.id === params.id)
  if (!shipmentRequest) return NextResponse.json({ error: "SR_NOT_FOUND" }, { status: 404 })

  return NextResponse.json({ shipmentRequest })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    ok: true,
    shipmentRequest: {
      id: params.id,
      ...body,
      updatedAt: new Date().toISOString(),
    },
  })
}
