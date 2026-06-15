import { NextResponse } from "next/server"

import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const { data, error } = await session.supabase
    .from("documents")
    .select("id, order_id, type, file_url, uploaded_by, created_at")
    .eq("order_id", params.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ documents: data })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (!body.type || !body.fileUrl) {
    return NextResponse.json({ error: "DOCUMENT_TYPE_AND_FILE_URL_REQUIRED" }, { status: 400 })
  }

  const { data, error } = await session.supabase
    .from("documents")
    .insert({
      order_id: params.id,
      type: body.type,
      file_url: body.fileUrl,
      uploaded_by: session.user.id,
    })
    .select("id, order_id, type, file_url, uploaded_by, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, document: data }, { status: 201 })
}
