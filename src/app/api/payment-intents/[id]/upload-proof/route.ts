import { NextResponse } from "next/server"

import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const formData = await request.formData()
  const proof = formData.get("proof")
  const reference = String(formData.get("reference") ?? "")

  if (!(proof instanceof File)) return NextResponse.json({ error: "PROOF_FILE_REQUIRED" }, { status: 400 })
  if (proof.size > 10 * 1024 * 1024) return NextResponse.json({ error: "PROOF_FILE_TOO_LARGE" }, { status: 400 })

  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })

  const { data: intent, error: intentError } = await service
    .from("payment_intents")
    .select("id, user_id, status")
    .eq("id", params.id)
    .maybeSingle()
  if (intentError) return NextResponse.json({ error: intentError.message }, { status: 500 })
  if (!intent) return NextResponse.json({ error: "PAYMENT_INTENT_NOT_FOUND" }, { status: 404 })
  if (intent.user_id !== session.user.id) return NextResponse.json({ error: "PAYMENT_INTENT_ACCESS_DENIED" }, { status: 403 })
  if (intent.status !== "pending") return NextResponse.json({ error: "PAYMENT_INTENT_NOT_PENDING" }, { status: 409 })

  const extension = proof.name.split(".").pop() || "jpg"
  const fileName = `${session.user.id}/${params.id}-${Date.now()}.${extension}`
  const { error: uploadError } = await service.storage
    .from("payment-proofs")
    .upload(fileName, proof, { upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { error: updateError } = await service
    .from("payment_intents")
    .update({ proof_url: `storage://payment-proofs/${fileName}`, fps_reference: reference })
    .eq("id", params.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, proofPath: fileName })
}
