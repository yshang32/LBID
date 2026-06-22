import { NextResponse } from "next/server"

import { confirmPaymentIntent as confirmDemoPaymentIntent, listPaymentIntents } from "@/lib/backend"
import { getAdminApiContext } from "@/lib/admin"
import { confirmPaymentIntent } from "@/lib/payment/confirmPaymentIntent"
import { createNotification } from "@/lib/notifications"

export async function GET(request: Request) {
  const admin = await getAdminApiContext(request)
  if (admin) {
    const { data, error } = await admin.service
      .from("payment_intents")
      .select("id, user_id, type, amount, currency, payment_method, status, fps_reference, proof_url, related_plan, related_token_package, created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(100)

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
    return NextResponse.json({ paymentIntents })
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
      if (body.action === "reject") {
        const { data: payment, error } = await admin.service
          .from("payment_intents")
          .update({ status: "rejected" })
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
        return NextResponse.json({ ok: true, paymentIntentId: payment.id, status: "rejected" })
      }
      const result = await confirmPaymentIntent(admin.service, body.paymentIntentId, admin.userId)
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
