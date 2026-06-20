import { NextResponse } from "next/server"

import { confirmPaymentIntent } from "@/lib/payment/confirmPaymentIntent"
import { getAdminApiContext } from "@/lib/admin"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  try {
    const result = await confirmPaymentIntent(admin.service, params.id, admin.userId)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CONFIRM_FAILED" }, { status: 500 })
  }
}
