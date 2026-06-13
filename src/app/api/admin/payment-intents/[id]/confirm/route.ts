import { NextResponse } from "next/server"

import { confirmPaymentIntent } from "@/lib/payment/confirmPaymentIntent"
import { getApiSupabaseServiceClient } from "@/lib/supabase/api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const adminSecret = process.env.ADMIN_API_SECRET
  const requestSecret = request.headers.get("x-lbid-admin-secret")

  if (adminSecret && requestSecret !== adminSecret) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 })
  }

  const supabase = getApiSupabaseServiceClient()
  if (!supabase) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 503 })

  try {
    const result = await confirmPaymentIntent(supabase, params.id, null)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "CONFIRM_FAILED" }, { status: 500 })
  }
}
