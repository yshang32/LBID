import React from "react"
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer"

import { quotation as demoQuotation } from "@/lib/data"
import { DOCUMENTS_BUCKET, documentStorageReference, resolveDocumentUrl } from "@/lib/document-storage"
import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

type LineItem = {
  label?: string
  description?: string
  amount?: number
  currency?: string
  quantity?: number
  unit?: string
  notes?: string
}

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, color: "#1B2B5E", fontFamily: "Helvetica" },
  header: { borderBottomWidth: 1, borderBottomColor: "#C9A84C", paddingBottom: 16, marginBottom: 22 },
  brand: { fontSize: 24, fontWeight: 700, letterSpacing: 2 },
  subtitle: { marginTop: 6, color: "#64748b" },
  metaGrid: { display: "flex", flexDirection: "row", gap: 12, marginBottom: 20 },
  metaBox: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 6, padding: 10 },
  label: { color: "#64748b", fontSize: 8, textTransform: "uppercase", marginBottom: 4 },
  value: { fontSize: 11, fontWeight: 700 },
  table: { borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 6, overflow: "hidden" },
  row: { display: "flex", flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0" },
  head: { backgroundColor: "#f8fafc", fontWeight: 700 },
  cellDesc: { flex: 1.6, padding: 9 },
  cellQty: { width: 60, padding: 9, textAlign: "right" },
  cellAmount: { width: 96, padding: 9, textAlign: "right" },
  total: { marginTop: 16, display: "flex", flexDirection: "row", justifyContent: "flex-end" },
  totalBox: { width: 220, borderWidth: 1, borderColor: "#C9A84C", borderRadius: 6, padding: 12, backgroundColor: "#fff8df" },
  footer: { marginTop: 28, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#e2e8f0", color: "#64748b", lineHeight: 1.5 },
})

export async function GET(_request: Request, { params }: { params: { token: string } }) {
  const { buffer } = await buildQuotationPdf(params.token)
  return pdfResponse(buffer, params.token)
}

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const session = await getApiSupabaseSession(request)
  const adminSecret = process.env.ADMIN_API_SECRET
  const requestSecret = request.headers.get("x-lbid-admin-secret")

  if (!session && (!adminSecret || requestSecret !== adminSecret)) {
    return NextResponseJson({ error: "UNAUTHENTICATED" }, 401)
  }

  const service = getApiSupabaseServiceClient()
  if (!service) return NextResponseJson({ error: "SUPABASE_SERVICE_NOT_CONFIGURED" }, 500)

  const body = await request.json().catch(() => ({}))
  const { buffer, quotation } = await buildQuotationPdf(params.token)
  if (!quotation?.id) return NextResponseJson({ error: "QUOTATION_NOT_FOUND" }, 404)

  const path = `quotations/${params.token}.pdf`
  const { error: uploadError } = await service.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, buffer, { contentType: "application/pdf", upsert: true })

  if (uploadError) return NextResponseJson({ error: uploadError.message, bucket: DOCUMENTS_BUCKET }, 500)

  const storageReference = documentStorageReference(path)
  const pdfUrl = await resolveDocumentUrl(service, storageReference)
  if (!pdfUrl) return NextResponseJson({ error: "DOCUMENT_SIGNING_FAILED" }, 500)

  const { error: updateError } = await service
    .from("quotations")
    .update({ pdf_url: storageReference })
    .eq("id", quotation.id)

  if (updateError) return NextResponseJson({ error: updateError.message }, 500)

  if (body.orderId) {
    await service.from("documents").insert({
      order_id: body.orderId,
      type: "Quotation PDF",
      file_url: storageReference,
      uploaded_by: session?.user.id || quotation.forwarder_id,
    })
  }

  return NextResponseJson({ ok: true, quotationId: quotation.id, pdfUrl, path }, 201)
}

async function buildQuotationPdf(token: string) {
  const service = getApiSupabaseServiceClient()
  let quotation: any = null

  if (service) {
    const { data } = await service
      .from("quotations")
      .select("id, shipment_request_id, forwarder_id, line_items, total_amount, public_token, status, created_at")
      .eq("public_token", token)
      .maybeSingle()
    quotation = data
  }

  const lineItems: LineItem[] = quotation?.line_items || demoQuotation.lineItems
  const total = Number(quotation?.total_amount ?? lineItems.reduce((sum, item) => sum + Number(item.amount || 0), 0))
  const currency = lineItems[0]?.currency || demoQuotation.currency || "HKD"
  const title = quotation?.id ? `Quotation ${quotation.id}` : `Quotation ${token}`

  const pdf = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.brand }, "LBID"),
        React.createElement(Text, { style: styles.subtitle }, "Sealed bidding logistics quotation"),
      ),
      React.createElement(
        View,
        { style: styles.metaGrid },
        React.createElement(MetaBox, { label: "Quotation", value: title }),
        React.createElement(MetaBox, { label: "Public token", value: token }),
        React.createElement(MetaBox, { label: "Status", value: quotation?.status || "generated" }),
      ),
      React.createElement(
        View,
        { style: styles.table },
        React.createElement(
          View,
          { style: [styles.row, styles.head] },
          React.createElement(Text, { style: styles.cellDesc }, "Line item"),
          React.createElement(Text, { style: styles.cellQty }, "Qty"),
          React.createElement(Text, { style: styles.cellAmount }, "Amount"),
        ),
        ...lineItems.map((item, index) => React.createElement(
          View,
          { key: `${item.label || item.description}-${index}`, style: styles.row },
          React.createElement(Text, { style: styles.cellDesc }, item.label || item.description || "Service"),
          React.createElement(Text, { style: styles.cellQty }, String(item.quantity || 1)),
          React.createElement(Text, { style: styles.cellAmount }, `${item.currency || currency} ${formatMoney(Number(item.amount || 0))}`),
        )),
      ),
      React.createElement(
        View,
        { style: styles.total },
        React.createElement(
          View,
          { style: styles.totalBox },
          React.createElement(Text, { style: styles.label }, "Total quotation"),
          React.createElement(Text, { style: { fontSize: 20, fontWeight: 700 } }, `${currency} ${formatMoney(total)}`),
        ),
      ),
      React.createElement(
        Text,
        { style: styles.footer },
        "This quotation was generated by LBID. Platform role: workflow_platform_not_carrier_of_record. Final operating terms remain between the matched parties.",
      ),
    ),
  )

  const buffer = await renderToBuffer(pdf)
  return { buffer, quotation }
}

function pdfResponse(buffer: Buffer, token: string) {
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `inline; filename="LBID-${token}.pdf"`,
      "cache-control": "no-store",
    },
  })
}

function NextResponseJson(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })
}

function MetaBox({ label, value }: { label: string; value: string }) {
  return React.createElement(
    View,
    { style: styles.metaBox },
    React.createElement(Text, { style: styles.label }, label),
    React.createElement(Text, { style: styles.value }, value),
  )
}

function formatMoney(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
