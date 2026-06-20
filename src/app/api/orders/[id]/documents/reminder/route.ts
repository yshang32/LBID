import { NextResponse } from "next/server"

import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { getOrderParties, getUserEmails } from "@/lib/order-parties"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getApiSupabaseSession(request)
  if (!session) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })

  const service = getApiSupabaseServiceClient()
  const parties = await getOrderParties(service || session.supabase, params.id)
  if (parties?.agencyId && parties?.forwarderId && ![parties.agencyId, parties.forwarderId].includes(session.user.id)) {
    return NextResponse.json({ error: "ORDER_ACCESS_DENIED" }, { status: 403 })
  }

  const recipients = [parties?.agencyId, parties?.forwarderId].filter(Boolean) as string[]
  const targetRecipients = recipients.length > 0 ? recipients : [session.user.id]
  const emails = await getUserEmails(service || session.supabase, targetRecipients)
  const href = `/orders/${params.id}/documents`

  const notificationResults = await Promise.all(targetRecipients.map((userId) => createNotification(service || session.supabase, {
    userId,
    type: "document_reminder",
    title: "Documents required",
    body: `Required order documents are still missing for order ${params.id}.`,
    href,
    metadata: { orderId: params.id },
  })))

  const emailResults = await Promise.all(targetRecipients.map((userId) => sendLbidEmail({
    to: emails[userId],
    subject: `LBID document reminder: ${params.id}`,
    html: renderSimpleEmail({
      title: "Documents required",
      body: `Required order documents are still missing for order ${params.id}. Please upload or confirm the checklist before ship date.`,
      ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}${href}`,
      ctaLabel: "Open document checklist",
    }),
    text: `Required order documents are still missing for order ${params.id}.`,
    idempotencyKey: `document-reminder-${params.id}-${userId}`,
  })))

  return NextResponse.json({
    ok: true,
    recipients: targetRecipients.length,
    notifications: notificationResults,
    emails: emailResults,
  })
}
