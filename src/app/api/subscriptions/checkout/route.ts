import { NextResponse } from "next/server"

import { createPaymentIntent } from "@/lib/backend"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const result = createPaymentIntent({
    type: "subscription",
    paymentMethod: body.paymentMethod ?? "stripe",
    planOrPackageId: body.planId ?? "monthly",
  })

  if (!result.ok) return NextResponse.json(result, { status: 400 })
  return NextResponse.json(result, { status: 201 })
}
