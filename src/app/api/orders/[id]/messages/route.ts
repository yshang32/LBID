import { NextResponse } from "next/server"

import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { getOrderParties, getUserEmails } from "@/lib/order-parties"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

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

  const service = getApiSupabaseServiceClient()
  const parties = await getOrderParties(service || session.supabase, params.id)
  const recipientId = session.user.id === parties?.agencyId ? parties?.forwarderId : parties?.agencyId
  let notificationResult: any = null
  let emailResult: any = null

  if (recipientId) {
    notificationResult = await createNotification(service || session.supabase, {
      userId: recipientId,
      type: "order_message",
      title: "New order message",
      body: body.content,
      href: `/orders/${params.id}/messages`,
      metadata: { orderId: params.id, messageId: data.id },
    })

    const emails = await getUserEmails(service || session.supabase, [recipientId])
    emailResult = await sendLbidEmail({
      to: emails[recipientId],
      subject: `LBID new message: ${params.id}`,
      html: renderSimpleEmail({
        title: "New order message",
        body: body.content,
        ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/orders/${params.id}/messages`,
        ctaLabel: "Open message thread",
      }),
      text: body.content,
      idempotencyKey: `order-message-${data.id}`,
    })
  }

  return NextResponse.json({ ok: true, message: data, notification: notificationResult, email: emailResult }, { status: 201 })
}
