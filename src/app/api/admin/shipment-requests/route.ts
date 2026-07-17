import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/audit-log"
import { syncBidRecommendations } from "@/lib/bid-recommendations"
import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"
import { getAdminApiContext } from "@/lib/admin"
import { createNotification } from "@/lib/notifications"

const fields = "id, agent_id, cargo_details, route, services_needed, deadline, bid_deadline, is_anonymous, status, created_at, validation_decision, validation_reasons, validation_score, review_required, scope_version, scope_hash, scope_locked_at, published_at, closed_at, supersedes_request_id"

export async function GET(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const status = new URL(request.url).searchParams.get("status")?.toLowerCase() || "pending"
  let query = admin.service
    .from("shipment_requests")
    .select(fields)
    .order("created_at", { ascending: false })
    .limit(100)

  if (status === "pending") query = query.eq("status", "PENDING_REVIEW")
  if (status === "approved") query = query.in("status", ["OPEN", "CLOSED", "AWARDED"])
  if (status === "rejected") query = query.in("status", ["NEEDS_CHANGES", "REJECTED"])

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const agentIds = Array.from(new Set((data || []).map((item) => item.agent_id).filter(Boolean)))
  const { data: profiles, error: profilesError } = agentIds.length
    ? await admin.service.from("company_profiles").select("user_id, company_name_en, company_name_zh").in("user_id", agentIds)
    : { data: [], error: null }
  if (profilesError) return NextResponse.json({ error: profilesError.message }, { status: 500 })

  const profileByUser = new Map((profiles || []).map((profile) => [profile.user_id, profile]))
  const shipmentRequests = (data || []).map((item) => {
    const profile = profileByUser.get(item.agent_id)
    return {
      ...item,
      company_name_en: profile?.company_name_en || null,
      company_name_zh: profile?.company_name_zh || null,
    }
  })
  return NextResponse.json({ shipmentRequests })
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

  const reviewedAt = new Date().toISOString()
  const update = action === "publish"
    ? {
        status: "OPEN",
        bid_deadline: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        reviewed_by: admin.userId,
        reviewed_at: reviewedAt,
        review_reason: null,
        review_required: false,
        validation_decision: "MANUAL_APPROVED",
        scope_locked_at: reviewedAt,
        published_at: reviewedAt,
      }
    : {
        status: "NEEDS_CHANGES",
        bid_deadline: null,
        reviewed_by: admin.userId,
        reviewed_at: reviewedAt,
        review_reason: reason,
        review_required: true,
        validation_decision: "NEEDS_CHANGES",
        scope_locked_at: null,
        published_at: null,
      }
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
  const recommendationResult = action === "publish" ? await syncBidRecommendations(admin.service, data) : { created: 0 }
  await Promise.all([
    writeAuditLog(admin.service, { actorId: admin.userId, action: `shipment_request_${action}ed`, entityType: "shipment_request", entityId: data.id, metadata: { reason: reason || null } }),
    createNotification(admin.service, { userId: data.agent_id, type: action === "publish" ? "shipment_request_published" : "shipment_request_needs_changes", title, body: bodyText, href: `/requests/${data.id}`, metadata: { shipmentRequestId: data.id } }),
  ])
  const { data: agency } = await admin.service.from("users").select("email").eq("id", data.agent_id).maybeSingle()
  await sendLbidEmail({ to: agency?.email, subject: `LBID: ${title}`, text: bodyText, html: renderSimpleEmail({ title, body: bodyText, ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/zh/requests/${data.id}`, ctaLabel: "Open request" }), idempotencyKey: `sr-review-${data.id}-${action}` })
  return NextResponse.json({ ok: true, shipmentRequest: data, recommendationsCreated: recommendationResult.created })
}
