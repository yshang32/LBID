import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/audit-log"
import { confirmPaymentIntent as confirmDemoPaymentIntent, listPaymentIntents } from "@/lib/backend"
import { getAdminApiContext } from "@/lib/admin"
import { confirmPaymentIntent } from "@/lib/payment/confirmPaymentIntent"
import { createNotification } from "@/lib/notifications"
import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"

export async function GET(request: Request) {
  const admin = await getAdminApiContext(request)
  if (admin) {
    const url = new URL(request.url)
    const status = url.searchParams.get("status") || "pending"
    const query = url.searchParams.get("q")?.trim()
    let paymentQuery = admin.service
      .from("payment_intents")
      .select("id, user_id, type, amount, currency, payment_method, status, fps_reference, proof_url, related_plan, related_token_package, review_note, confirmed_by, confirmed_at, created_at")
      .order("created_at", { ascending: true })
      .limit(100)
    if (status !== "all") paymentQuery = paymentQuery.eq("status", status)
    const { data, error } = await paymentQuery

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const userIds = (data || []).map((payment) => payment.user_id)
    const { data: users } = userIds.length
      ? await admin.service.from("users").select("id, company_name, email").in("id", userIds)
      : { data: [] }
    const userMap = new Map((users || []).map((user) => [user.id, user]))

    const paymentIntents = await Promise.all((data || []).map(async (payment) => {
      const user = userMap.get(payment.user_id)
      const storagePath = typeof payment.proof_url === "string" && payment.proof_url.startsWith("storage://payment-proofs/")
        ? payment.proof_url.replace("storage://payment-proofs/", "")
        : null
      const proof = storagePath
        ? await admin.service.storage.from("payment-proofs").createSignedUrl(storagePath, 60 * 10)
        : null
      return {
        ...payment,
        company_name: user?.company_name || null,
        email: user?.email || null,
        proof_url: proof?.data?.signedUrl || payment.proof_url,
      }
    }))
    const filtered = query ? paymentIntents.filter((payment) => [payment.company_name, payment.email, payment.fps_reference, payment.id].filter(Boolean).some((value) => String(value).toLowerCase().includes(query.toLowerCase()))) : paymentIntents
    return NextResponse.json({ paymentIntents: filtered })
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })
  return NextResponse.json({ paymentIntents: listPaymentIntents().filter((intent) => intent.status === "pending"), mode: "demo_fallback" })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  if (!['confirm', 'reject'].includes(body.action)) return NextResponse.json({ ok: false, error: "UNSUPPORTED_ADMIN_ACTION" }, { status: 400 })

  const admin = await getAdminApiContext(request)
  if (admin) {
    try {
      const note = typeof body.note === "string" ? body.note.trim().slice(0, 1000) : ""
      if (body.action === "reject" && !note) return NextResponse.json({ error: "PAYMENT_REJECTION_REASON_REQUIRED" }, { status: 400 })
      if (body.action === "reject") {
        const { data: payment, error } = await admin.service
          .from("payment_intents")
          .update({ status: "rejected", review_note: note, confirmed_by: admin.userId, confirmed_at: new Date().toISOString() })
          .eq("id", body.paymentIntentId)
          .eq("status", "pending")
          .select("id, user_id")
          .maybeSingle()
        if (error) throw error
        if (!payment) return NextResponse.json({ error: "PAYMENT_INTENT_NOT_PENDING" }, { status: 409 })
        await createNotification(admin.service, {
          userId: payment.user_id,
          type: "payment_rejected",
          title: "Payment requires review",
          body: "Your payment confirmation was not accepted. Please contact LBID support with an updated reference or proof.",
          href: "/zh/subscription",
          metadata: { paymentIntentId: payment.id },
        })
        await writeAuditLog(admin.service, { actorId: admin.userId, action: "payment_rejected", entityType: "payment_intent", entityId: payment.id, metadata: { note } })
        const { data: user } = await admin.service.from("users").select("email").eq("id", payment.user_id).maybeSingle()
        await sendLbidEmail({ to: user?.email, subject: "LBID: Payment requires review", text: note, html: renderSimpleEmail({ title: "Payment requires review", body: note, ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/zh/subscription`, ctaLabel: "Open membership" }), idempotencyKey: `payment-rejected-${payment.id}` })
        return NextResponse.json({ ok: true, paymentIntentId: payment.id, status: "rejected" })
      }
      const result = await confirmPaymentIntent(admin.service, body.paymentIntentId, admin.userId)
      if (!result.alreadyConfirmed) {
        await Promise.all([
          writeAuditLog(admin.service, { actorId: admin.userId, action: "payment_confirmed", entityType: "payment_intent", entityId: body.paymentIntentId, metadata: { note } }),
          createNotification(admin.service, { userId: result.userId, type: "payment_confirmed", title: "Payment confirmed", body: "Your LBID payment has been confirmed and access is now updated.", href: "/subscription", metadata: { paymentIntentId: body.paymentIntentId } }),
        ])
        const { data: user } = await admin.service.from("users").select("email").eq("id", result.userId).maybeSingle()
        await sendLbidEmail({ to: user?.email, subject: "LBID: Payment confirmed", text: "Your LBID payment has been confirmed and access is now updated.", html: renderSimpleEmail({ title: "Payment confirmed", body: "Your LBID payment has been confirmed and access is now updated.", ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/zh/subscription`, ctaLabel: "Open membership" }), idempotencyKey: `payment-confirmed-${body.paymentIntentId}` })
      }
      return NextResponse.json(result)
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "CONFIRM_FAILED" }, { status: 500 })
    }
  }

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })
  const result = confirmDemoPaymentIntent(body.paymentIntentId)
  if (!result.ok) return NextResponse.json(result, { status: 404 })

  return NextResponse.json({ ...result, mode: "demo_fallback" })
}
