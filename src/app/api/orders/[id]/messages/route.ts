import { NextResponse } from "next/server"

import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const { data, error } = await session.supabase
    .from("messages")
    .select("id, order_id, sender_id, content, created_at")
    .eq("order_id", params.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (!body.content) return NextResponse.json({ error: "MESSAGE_CONTENT_REQUIRED" }, { status: 400 })

  const { data, error } = await session.supabase
    .from("messages")
    .insert({
      order_id: params.id,
      sender_id: session.user.id,
      content: body.content,
    })
    .select("id, order_id, sender_id, content, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, message: data }, { status: 201 })
}
