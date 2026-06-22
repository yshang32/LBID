import { existsSync, readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

loadDotEnvLocal()
const testState = loadTestState()

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:5299"
let srId = process.env.SUPABASE_TEST_SR_ID || testState?.shipmentRequestId

if (!srId) {
  console.error("Missing SUPABASE_TEST_SR_ID and .supabase-rpc-test.json shipmentRequestId")
  process.exit(1)
}

const accessToken = process.env.SUPABASE_TEST_ACCESS_TOKEN || await signInForAccessToken()
const supabase = createAuthedSupabase(accessToken)
const agencyAccessToken = await signInForAccessToken({
  email: process.env.SUPABASE_TEST_AGENCY_EMAIL || testState?.agencyEmail,
  password: process.env.SUPABASE_TEST_AGENCY_PASSWORD || testState?.agencyPassword,
  label: "agency",
})

async function jsonFetch(path, options = {}) {
  const requestAccessToken = options.accessToken || accessToken
  const { accessToken: _accessToken, ...fetchOptions } = options
  const response = await fetch(`${baseUrl}${path}`, {
    ...fetchOptions,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${requestAccessToken}`,
      ...(options.headers || {}),
    },
  })
  const body = await response.json()
  return { status: response.status, body }
}

async function multipartFetch(path, options = {}) {
  const form = new FormData()
  form.append("type", options.type)
  form.append("file", new Blob(["%PDF-1.4\nLBID smoke document\n"], { type: "application/pdf" }), "invoice.pdf")

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { authorization: `Bearer ${options.accessToken || accessToken}` },
    body: form,
  })
  const body = await response.json()
  return { status: response.status, body }
}

const before = await jsonFetch("/api/tokens")
console.log("BEFORE", JSON.stringify(before.body.wallet, null, 2))

const createdSr = await jsonFetch("/api/shipment-requests", {
  accessToken: agencyAccessToken,
  method: "POST",
  body: JSON.stringify({
    cargoDetails: { cargo: "Smoke test electronics", weight_kg: 320, cbm: 2.4 },
    route: { origin: "Bangkok", destination: "Hong Kong" },
    servicesNeeded: ["customs_clearance", "local_delivery"],
    deadline: new Date(Date.now() + 48 * 3600000).toISOString(),
    bidDeadline: new Date(Date.now() + 3 * 3600000).toISOString(),
    status: "OPEN",
  }),
})
console.log("CREATE_SR", createdSr.status, JSON.stringify(createdSr.body, null, 2))
if (createdSr.status !== 201 || !createdSr.body.shipmentRequest?.id) {
  process.exit(1)
}
srId = createdSr.body.shipmentRequest.id

if (createdSr.body.shipmentRequest.status !== "PENDING_REVIEW") {
  console.error(`Expected PENDING_REVIEW after creation, got ${createdSr.body.shipmentRequest.status}`)
  process.exit(1)
}

const publishResult = await createServiceSupabase()
  .from("shipment_requests")
  .update({ status: "OPEN", bid_deadline: new Date(Date.now() + 3 * 3600000).toISOString() })
  .eq("id", srId)
  .select("id, status, bid_deadline")
  .single()
console.log("PUBLISH_SR", JSON.stringify(publishResult.data, null, 2))
if (publishResult.error || publishResult.data?.status !== "OPEN") {
  console.error(publishResult.error?.message || "Unable to publish smoke-test shipment request")
  process.exit(1)
}

const bid = await jsonFetch("/api/bids", {
  method: "POST",
  body: JSON.stringify({
    sr_id: srId,
    price: 12880,
    currency: "HKD",
    transit_time: "2 days",
    terms: "Door delivery included",
  }),
})
console.log("BID", bid.status, JSON.stringify(bid.body, null, 2))

const after = await jsonFetch("/api/tokens")
console.log("AFTER", JSON.stringify(after.body.wallet, null, 2))

if (bid.status !== 200 || !bid.body.success || !bid.body.bid_id || !bid.body.token_transaction_id) {
  process.exit(1)
}

const beforeTotal = Number(before.body.wallet?.total)
const afterTotal = Number(after.body.wallet?.total)
if (!Number.isFinite(beforeTotal) || !Number.isFinite(afterTotal) || beforeTotal - afterTotal !== 1) {
  console.error(`Expected total token balance to decrease by 1, got before=${beforeTotal} after=${afterTotal}`)
  process.exit(1)
}

const { data: bidRow, error: bidError } = await supabase
  .from("bids")
  .select("id, sr_id, forwarder_id, price, currency, token_transaction_id")
  .eq("id", bid.body.bid_id)
  .single()

if (bidError || !bidRow) {
  console.error(bidError?.message || "Bid row not found")
  process.exit(1)
}

const closeResult = await createServiceSupabase()
  .from("shipment_requests")
  .update({ status: "CLOSED", bid_deadline: new Date(Date.now() - 1000).toISOString() })
  .eq("id", srId)
  .eq("status", "OPEN")
  .select("id, status, bid_deadline")
  .single()
console.log("CLOSE_SR", JSON.stringify(closeResult.data, null, 2))
if (closeResult.error || closeResult.data?.status !== "CLOSED") {
  console.error(closeResult.error?.message || "Unable to close smoke-test shipment request")
  process.exit(1)
}

const { data: txnRow, error: txnError } = await supabase
  .from("token_transactions")
  .select("id, type, source, amount, related_bid_id, balance_after")
  .eq("id", bid.body.token_transaction_id)
  .single()

if (txnError || !txnRow || txnRow.amount !== -1 || txnRow.related_bid_id !== bid.body.bid_id) {
  console.error(txnError?.message || `Invalid token transaction: ${JSON.stringify(txnRow)}`)
  process.exit(1)
}

const accepted = await jsonFetch(`/api/bids/${bid.body.bid_id}/accept`, {
  accessToken: agencyAccessToken,
  method: "POST",
  body: JSON.stringify({}),
})
console.log("ACCEPT", accepted.status, JSON.stringify(accepted.body, null, 2))
if (
  accepted.status !== 201 ||
  accepted.body.mode === "service_role_fallback" ||
  !accepted.body.quotation?.id ||
  !accepted.body.order?.id ||
  !accepted.body.matchRecord?.id
) {
  process.exit(1)
}

const { data: quotationRow, error: quotationError } = await supabase
  .from("quotations")
  .select("id, shipment_request_id, forwarder_id, total_amount, status")
  .eq("id", accepted.body.quotation.id)
  .single()

if (quotationError || !quotationRow || quotationRow.status !== "accepted") {
  console.error(quotationError?.message || `Invalid quotation: ${JSON.stringify(quotationRow)}`)
  process.exit(1)
}

const { data: orderRow, error: orderError } = await supabase
  .from("orders")
  .select("id, quotation_id, status")
  .eq("id", accepted.body.order.id)
  .single()

if (orderError || !orderRow || orderRow.status !== "confirmed") {
  console.error(orderError?.message || `Invalid order: ${JSON.stringify(orderRow)}`)
  process.exit(1)
}

const { data: matchRow, error: matchError } = await supabase
  .from("match_records")
  .select("id, shipment_request_id, forwarder_id, winning_quotation_id, stage")
  .eq("id", accepted.body.matchRecord.id)
  .single()

if (matchError || !matchRow || matchRow.stage !== "order_created") {
  console.error(matchError?.message || `Invalid match record: ${JSON.stringify(matchRow)}`)
  process.exit(1)
}

const orderUpdate = await jsonFetch(`/api/orders/${accepted.body.order.id}`, {
  method: "PATCH",
  body: JSON.stringify({ status: "shipment_booked" }),
})
console.log("ORDER_PATCH", orderUpdate.status, JSON.stringify(orderUpdate.body, null, 2))
if (orderUpdate.status !== 200 || orderUpdate.body.order?.status !== "shipment_booked") {
  process.exit(1)
}

const matchGet = await jsonFetch(`/api/match-records/${accepted.body.matchRecord.id}`)
console.log("MATCH_GET", matchGet.status, JSON.stringify(matchGet.body, null, 2))
if (matchGet.status !== 200 || matchGet.body.matchRecord?.id !== accepted.body.matchRecord.id) {
  process.exit(1)
}

const documentCreate = await multipartFetch(`/api/orders/${accepted.body.order.id}/documents`, {
  type: "Commercial Invoice",
})
console.log("DOCUMENT_CREATE", documentCreate.status, JSON.stringify(documentCreate.body, null, 2))
if (
  documentCreate.status !== 201 ||
  !documentCreate.body.document?.id ||
  !documentCreate.body.document?.file_url ||
  documentCreate.body.document.file_url.includes("/object/public/")
) {
  process.exit(1)
}

const messageCreate = await jsonFetch(`/api/orders/${accepted.body.order.id}/messages`, {
  accessToken: agencyAccessToken,
  method: "POST",
  body: JSON.stringify({
    content: "Please confirm booking cut-off and delivery window.",
  }),
})
console.log("MESSAGE_CREATE", messageCreate.status, JSON.stringify(messageCreate.body, null, 2))
if (messageCreate.status !== 201 || !messageCreate.body.message?.id) {
  process.exit(1)
}

for (const status of ["in_transit", "arrived_hk", "customs_cleared", "delivered", "completed"]) {
  const orderUpdate = await jsonFetch(`/api/orders/${accepted.body.order.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  })
  console.log("ORDER_PROGRESS", status, orderUpdate.status, JSON.stringify(orderUpdate.body, null, 2))
  if (orderUpdate.status !== 200 || orderUpdate.body.order?.status !== status) {
    process.exit(1)
  }
}

const reviewCreate = await jsonFetch("/api/reviews", {
  accessToken: agencyAccessToken,
  method: "POST",
  body: JSON.stringify({
    orderId: accepted.body.order.id,
    forwarderId: accepted.body.quotation.forwarder_id,
    rating: 5,
    comment: "Fast response and clear document handling.",
  }),
})
console.log("REVIEW_CREATE", reviewCreate.status, JSON.stringify(reviewCreate.body, null, 2))
if (reviewCreate.status !== 201 || !reviewCreate.body.review?.id) {
  process.exit(1)
}

console.log("VERIFIED", JSON.stringify({
  bidId: bidRow.id,
  tokenTransactionId: txnRow.id,
  quotationId: quotationRow.id,
  orderId: orderRow.id,
  matchRecordId: matchRow.id,
  documentId: documentCreate.body.document.id,
  messageId: messageCreate.body.message.id,
  reviewId: reviewCreate.body.review.id,
  beforeTotal,
  afterTotal,
}, null, 2))

function loadDotEnvLocal() {
  if (!existsSync(".env.local")) return
  const lines = readFileSync(".env.local", "utf8").split(/\r?\n/)
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
    const index = trimmed.indexOf("=")
    const key = trimmed.slice(0, index).trim()
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = value
  }
}

function loadTestState() {
  if (!existsSync(".supabase-rpc-test.json")) return null
  return JSON.parse(readFileSync(".supabase-rpc-test.json", "utf8"))
}

async function signInForAccessToken(options = {}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const email = options.email ?? process.env.SUPABASE_TEST_EMAIL ?? testState?.email
  const password = options.password ?? process.env.SUPABASE_TEST_PASSWORD ?? testState?.password

  if (!url || !anonKey || !email || !password) {
    console.error(`Missing ${options.label ?? "forwarder"} Supabase URL/anon/email/password for automatic sign-in`)
    process.exit(1)
  }

  const supabase = createClient(url, anonKey)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error || !data.session?.access_token) {
    console.error(error?.message || "Unable to sign in test user")
    process.exit(1)
  }

  return data.session.access_token
}

function createAuthedSupabase(accessToken) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    process.exit(1)
  }

  return createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })
}

function createServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for smoke-test publication")
    process.exit(1)
  }
  return createClient(url, serviceKey)
}
