import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/audit-log"
import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"
import { getAdminApiContext } from "@/lib/admin"
import { createNotification } from "@/lib/notifications"

const fields = "id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at"

export async function GET(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const { data, error } = await admin.service
    .from("shipment_requests")
    .select(fields)
    .eq("status", "PENDING_REVIEW")
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ shipmentRequests: data || [] })
}

export async function PATCH(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const id = typeof body.id === "string" ? body.id : ""
  const action = body.action === "reject" ? "reject" : "publish"
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 1000) : ""
  if (!id) return NextResponse.json({ error: "SHIPMENT_REQUEST_ID_REQUIRED" }, { status: 400 })
  if (action === "reject" && !reason) return NextResponse.json({ error: "REJECTION_REASON_REQUIRED" }, { status: 400 })

  const update = action === "publish"
    ? { status: "OPEN", bid_deadline: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), reviewed_by: admin.userId, reviewed_at: new Date().toISOString(), review_reason: null }
    : { status: "REJECTED", reviewed_by: admin.userId, reviewed_at: new Date().toISOString(), review_reason: reason }
  const { data, error } = await admin.service
    .from("shipment_requests")
    .update(update)
    .eq("id", id)
    .eq("status", "PENDING_REVIEW")
    .select(fields)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: "REQUEST_NOT_PENDING_REVIEW" }, { status: 409 })
  const title = action === "publish" ? "Shipment Request approved" : "Shipment Request needs revision"
  const bodyText = action === "publish" ? "Your request is live. A three-hour sealed bid window has opened." : reason
  await Promise.all([
    writeAuditLog(admin.service, { actorId: admin.userId, action: `shipment_request_${action}ed`, entityType: "shipment_request", entityId: data.id, metadata: { reason: reason || null } }),
    createNotification(admin.service, { userId: data.agent_id, type: action === "publish" ? "shipment_request_published" : "shipment_request_rejected", title, body: bodyText, href: `/requests/${data.id}`, metadata: { shipmentRequestId: data.id } }),
  ])
  const { data: agency } = await admin.service.from("users").select("email").eq("id", data.agent_id).maybeSingle()
  await sendLbidEmail({ to: agency?.email, subject: `LBID: ${title}`, text: bodyText, html: renderSimpleEmail({ title, body: bodyText, ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/zh/requests/${data.id}`, ctaLabel: "Open request" }), idempotencyKey: `sr-review-${data.id}-${action}` })
  return NextResponse.json({ ok: true, shipmentRequest: data })
}
