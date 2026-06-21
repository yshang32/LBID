import { NextResponse } from "next/server"

import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { canAccessOrder, getOrderParties, getUserEmails } from "@/lib/order-parties"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })
  if (!(await canAccessOrder(service, params.id, session.user.id))) return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })

  const { data, error } = await service
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
  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponse.json({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, { status: 500 })
  if (!(await canAccessOrder(service, params.id, session.user.id))) return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  if (!body.content) return NextResponse.json({ error: "MESSAGE_CONTENT_REQUIRED" }, { status: 400 })

  const { data, error } = await service
    .from("messages")
    .insert({
      order_id: params.id,
      sender_id: session.user.id,
      content: body.content,
    })
    .select("id, order_id, sender_id, content, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const parties = await getOrderParties(service, params.id)
  const recipientIds = session.user.id === parties?.agencyId ? [parties.forwarderId] : session.user.id === parties?.forwarderId ? [parties.agencyId] : [parties?.agencyId, parties?.forwarderId]
  let notificationResult: any = null
  let emailResult: any = null

  if (recipientIds.filter(Boolean).length > 0) {
    const recipients = recipientIds.filter(Boolean) as string[]
    notificationResult = await Promise.all(recipients.map((userId) => createNotification(service, {
      userId,
      type: "order_message",
      title: "New order message",
      body: body.content,
      href: `/orders/${params.id}/messages`,
      metadata: { orderId: params.id, messageId: data.id },
    })))

    const emails = await getUserEmails(service, recipients)
    emailResult = await Promise.all(recipients.map((userId) => sendLbidEmail({
      to: emails[userId],
      subject: `LBID new message: ${params.id}`,
      html: renderSimpleEmail({
        title: "New order message",
        body: body.content,
        ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/orders/${params.id}/messages`,
        ctaLabel: "Open message thread",
      }),
      text: body.content,
      idempotencyKey: `order-message-${data.id}`,
    })))
  }

  return NextResponse.json({ ok: true, message: data, notification: notificationResult, email: emailResult }, { status: 201 })
}
