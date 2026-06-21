import { NextResponse } from "next/server"

import { checkAccess } from "@/lib/backend"
import { renderSimpleEmail, sendLbidEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications"
import { getUserEmails } from "@/lib/order-parties"
import { getApiSupabaseServiceClient, getApiSupabaseSession, isSupabaseConfigured } from "@/lib/supabase/api"

type QuotationLine = {
  description?: string
  label?: string
  unit?: string
  quantity?: number
  unitPrice?: number
  amount?: number
  currency?: string
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const session = await getApiSupabaseSession(request)
  const lineItems = normalizeLineItems(body.lineItems || body.line_items || [])
  const totalAmount = Number(body.totalAmount ?? body.total_amount ?? lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0))
  const shipmentRequestId = String(body.shipmentRequestId || body.shipment_request_id || "")

  if (lineItems.length === 0 || totalAmount <= 0) {
    return NextResponse.json({ error: "QUOTATION_LINE_ITEMS_REQUIRED" }, { status: 400 })
  }

  if (!session) {
    if (isSupabaseConfigured()) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    const access = checkAccess("create_quotation")
    if (!access.allowed) return NextResponse.json({ ok: false, error: "SUBSCRIPTION_REQUIRED", redirect: access.redirect }, { status: 403 })

    const publicToken = `qt_${crypto.randomUUID().replace(/-/g, "")}`
    return NextResponse.json({
      ok: true,
      mode: "demo_fallback",
      quotation: {
        id: `quote-${Date.now()}`,
        publicToken,
        public_token: publicToken,
        pdfUrl: `/api/quotations/${publicToken}/pdf`,
        status: "generated",
        source: body.matchRecordId ? "match_record_rate_card" : "shipment_request_bid",
        lineItems,
        totalAmount,
      },
    }, { status: 201 })
  }

  if (!isUuid(shipmentRequestId)) {
    return NextResponse.json({ error: "SHIPMENT_REQUEST_ID_REQUIRED" }, { status: 400 })
  }

  const publicToken = `qt_${crypto.randomUUID().replace(/-/g, "")}`
  const { data, error } = await session.supabase
    .from("quotations")
    .insert({
      shipment_request_id: shipmentRequestId,
      forwarder_id: session.user.id,
      line_items: lineItems,
      total_amount: totalAmount,
      public_token: publicToken,
      pdf_url: `/api/quotations/${publicToken}/pdf`,
      status: "submitted",
    })
    .select("id, shipment_request_id, forwarder_id, line_items, total_amount, public_token, pdf_url, status, created_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const service = getApiSupabaseServiceClient()
  const { data: requestRow } = service ? await service
    .from("shipment_requests")
    .select("id, agent_id")
    .eq("id", shipmentRequestId)
    .maybeSingle() : { data: null }

  if (requestRow?.agent_id) {
    await createNotification(service || session.supabase, {
      userId: requestRow.agent_id,
      type: "quotation_submitted",
      title: "New quotation submitted",
      body: `A forwarder submitted a quotation for SR ${shipmentRequestId}.`,
      href: `/quotations/compare?sr=${shipmentRequestId}`,
      metadata: { shipmentRequestId, quotationId: data.id },
    })

    const emails = await getUserEmails(service || session.supabase, [requestRow.agent_id])
    await sendLbidEmail({
      to: emails[requestRow.agent_id],
      subject: "LBID new quotation submitted",
      html: renderSimpleEmail({
        title: "New quotation submitted",
        body: `A forwarder submitted a sealed quotation for SR ${shipmentRequestId}. You can compare quotations after the bid window closes.`,
        ctaHref: `${process.env.NEXT_PUBLIC_APP_URL || ""}/quotations/compare?sr=${shipmentRequestId}`,
        ctaLabel: "Compare quotations",
      }),
      text: `A forwarder submitted a sealed quotation for SR ${shipmentRequestId}.`,
      idempotencyKey: `quotation-submitted-${data.id}`,
    })
  }

  return NextResponse.json({
    ok: true,
    quotation: {
      ...data,
      publicToken: data.public_token,
      pdfUrl: data.pdf_url,
    },
  }, { status: 201 })
}

function normalizeLineItems(items: QuotationLine[]) {
  if (!Array.isArray(items)) return []
  return items.map((item) => {
    const quantity = Number(item.quantity ?? 1)
    const unitPrice = Number(item.unitPrice ?? 0)
    const amount = Number(item.amount ?? quantity * unitPrice)
    return {
      label: item.label || item.description || "Service",
      description: item.description || item.label || "Service",
      unit: item.unit || "lot",
      quantity,
      unitPrice,
      amount,
      currency: item.currency || "USD",
    }
  }).filter((item) => item.amount > 0)
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
