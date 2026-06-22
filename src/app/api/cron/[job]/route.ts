import { NextResponse } from "next/server"

import { runCronJob } from "@/lib/backend"
import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { getOrderParties, getUserEmails } from "@/lib/order-parties"
import { getApiSupabaseServiceClient } from "@/lib/supabase/api"

const requiredDocumentGroups = [
  ["awb", "b/l"],
  ["commercial invoice"],
  ["packing list"],
]

export async function POST(request: Request, { params }: { params: { job: string } }) {
  return handleCron(request, params.job)
}

export async function GET(request: Request, { params }: { params: { job: string } }) {
  return handleCron(request, params.job)
}

async function handleCron(request: Request, job: string) {
  const cronSecret = process.env.CRON_SECRET
  const authorization = request.headers.get("authorization")
  const suppliedSecret = request.headers.get("x-lbid-cron-secret") || authorization?.replace(/^Bearer\s+/i, "")
  if (cronSecret && suppliedSecret !== cronSecret) {
    return NextResponse.json({ error: "CRON_UNAUTHORIZED" }, { status: 401 })
  }

  if (job === "document-reminders") return runDocumentReminderCron()
  if (job === "bid-window-close") return runBidWindowCloseCron()

  const result = runCronJob(job)
  const status = "error" in result ? 400 : 200
  return NextResponse.json(result, { status })
}

async function runBidWindowCloseCron() {
  const supabase = getApiSupabaseServiceClient()
  if (!supabase) return NextResponse.json({ job: "bid-window-close", mode: "demo_fallback", closedRequests: 0 })

  const { data: closedRequests, error } = await supabase
    .from("shipment_requests")
    .update({ status: "CLOSED" })
    .eq("status", "OPEN")
    .lt("bid_deadline", new Date().toISOString())
    .select("id, agent_id")

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const requestIds = (closedRequests || []).map((request) => request.id)
  if (requestIds.length === 0) return NextResponse.json({ job: "bid-window-close", closedRequests: 0, notificationsCreated: 0 })

  const { data: bids } = await supabase
    .from("bids")
    .select("sr_id, forwarder_id")
    .in("sr_id", requestIds)

  const recipients = new Map<string, Set<string>>()
  for (const request of closedRequests || []) recipients.set(request.id, new Set([request.agent_id]))
  for (const bid of bids || []) recipients.get(bid.sr_id)?.add(bid.forwarder_id)

  let notificationsCreated = 0
  for (const [requestId, userIds] of recipients) {
    for (const userId of userIds) {
      await createNotification(supabase, {
        userId,
        type: "bid_window_closed",
        title: "Bid window closed",
        body: "The sealed bid window has ended. The agency can now compare valid quotations.",
        href: `/zh/requests/${requestId}`,
        metadata: { shipmentRequestId: requestId },
      })
      notificationsCreated += 1
    }
  }

  return NextResponse.json({ job: "bid-window-close", closedRequests: requestIds.length, notificationsCreated })
}

async function runDocumentReminderCron() {
  const supabase = getApiSupabaseServiceClient()
  if (!supabase) return NextResponse.json({ job: "document-reminders", mode: "demo_fallback", remindersQueued: 1, emails: "skipped" })

  const { data: orders, error } = await supabase
    .from("orders")
    .select("id, status, created_at, documents(type), quotations(shipment_request_id, shipment_requests(agent_id))")
    .neq("status", "completed")
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let remindersQueued = 0
  let emailsAttempted = 0

  for (const order of orders || []) {
    const uploadedTypes = ((order as any).documents || []).map((doc: any) => String(doc.type || "").toLowerCase())
    const missing = requiredDocumentGroups
      .filter((group) => !uploadedTypes.some((type: string) => group.some((required) => type.includes(required))))
      .map((group) => group.join(" / "))
    if (missing.length === 0) continue

    const parties = await getOrderParties(supabase, order.id)
    const recipients = [parties?.agencyId, parties?.forwarderId].filter(Boolean) as string[]
    const emails = await getUserEmails(supabase, recipients)

    for (const userId of recipients) {
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", userId)
        .eq("type", "document_reminder")
        .contains("metadata", { orderId: order.id })
        .gte("created_at", new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString())
        .limit(1)

      if (existing && existing.length > 0) continue

      await createNotification(supabase, {
        userId,
        type: "document_reminder",
        title: "Documents required",
        body: `Order ${order.id} is missing: ${missing.join(", ")}.`,
        href: `/orders/${order.id}/documents`,
        metadata: { orderId: order.id, missing },
      })

      const emailResult = await sendLbidEmail({
        to: emails[userId],
        subject: `LBID document reminder: ${order.id}`,
        html: renderSimpleEmail({
          title: "Documents required",
          body: `Order ${order.id} is missing: ${missing.join(", ")}. Please upload or confirm the checklist before ship date.`,
          ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/orders/${order.id}/documents`,
          ctaLabel: "Open document checklist",
        }),
        text: `Order ${order.id} is missing: ${missing.join(", ")}.`,
        idempotencyKey: `document-reminder-cron-${order.id}-${userId}`,
      })
      if (!("skipped" in emailResult)) emailsAttempted += 1
      remindersQueued += 1
    }
  }

  return NextResponse.json({ job: "document-reminders", remindersQueued, emailsAttempted })
}
