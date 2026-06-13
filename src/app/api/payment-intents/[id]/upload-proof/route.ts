import { NextResponse } from "next/server"

import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })

  const formData = await request.formData()
  const proof = formData.get("proof")
  const reference = String(formData.get("reference") ?? "")

  if (!(proof instanceof File)) return NextResponse.json({ error: "PROOF_FILE_REQUIRED" }, { status: 400 })

  const extension = proof.name.split(".").pop() || "jpg"
  const fileName = `${session.user.id}/${params.id}-${Date.now()}.${extension}`
  const { error: uploadError } = await session.supabase.storage
    .from("payment-proofs")
    .upload(fileName, proof, { upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: publicUrlData } = session.supabase.storage
    .from("payment-proofs")
    .getPublicUrl(fileName)

  const { error: updateError } = await session.supabase
    .from("payment_intents")
    .update({ proof_url: publicUrlData.publicUrl, fps_reference: reference })
    .eq("id", params.id)
    .eq("user_id", session.user.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({ success: true, proofUrl: publicUrlData.publicUrl })
}
