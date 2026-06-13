import { existsSync, readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"

loadDotEnvLocal()
const testState = loadTestState()

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:5299"
const srId = process.env.SUPABASE_TEST_SR_ID || testState?.shipmentRequestId

if (!srId) {
  console.error("Missing SUPABASE_TEST_SR_ID and .supabase-rpc-test.json shipmentRequestId")
  process.exit(1)
}

const accessToken = process.env.SUPABASE_TEST_ACCESS_TOKEN || await signInForAccessToken()

async function jsonFetch(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  })
  const body = await response.json()
  return { status: response.status, body }
}

const before = await jsonFetch("/api/tokens")
console.log("BEFORE", JSON.stringify(before.body.wallet, null, 2))

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

if (bid.status !== 200 || !bid.body.success) {
  process.exit(1)
}

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

async function signInForAccessToken() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const email = process.env.SUPABASE_TEST_EMAIL || testState?.email
  const password = process.env.SUPABASE_TEST_PASSWORD || testState?.password

  if (!url || !anonKey || !email || !password) {
    console.error("Missing SUPABASE_TEST_ACCESS_TOKEN, or Supabase URL/anon/email/password for automatic sign-in")
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
