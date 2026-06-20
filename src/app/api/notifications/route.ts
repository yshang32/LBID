import { NextResponse } from "next/server"

import { createNotification, listNotifications } from "@/lib/notifications"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ notifications: [], authenticated: false })

  const result = await listNotifications(session.supabase, session.user.id)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json({ notifications: result.notifications, authenticated: true })
}

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (!body.title || !body.body || !body.type) return NextResponse.json({ error: "NOTIFICATION_FIELDS_REQUIRED" }, { status: 400 })

  const result = await createNotification(session.supabase, {
    userId: body.userId || session.user.id,
    type: body.type,
    title: body.title,
    body: body.body,
    href: body.href,
    metadata: body.metadata,
  })

  if (!result.created) return NextResponse.json({ error: result.error || result.reason || "NOTIFICATION_CREATE_FAILED" }, { status: 500 })
  return NextResponse.json({ ok: true, notification: result.notification }, { status: 201 })
}

export async function PATCH(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  let query = session.supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", session.user.id)

  if (!body.all) {
    if (!body.id) return NextResponse.json({ error: "NOTIFICATION_ID_REQUIRED" }, { status: 400 })
    query = query.eq("id", body.id)
  }

  const { error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
