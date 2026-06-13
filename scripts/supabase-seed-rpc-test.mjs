import { createClient } from "@supabase/supabase-js"
import { existsSync, readFileSync, writeFileSync } from "node:fs"

loadDotEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const email = process.env.SUPABASE_TEST_EMAIL || "forwarder-test@lbid.local"
const password = process.env.SUPABASE_TEST_PASSWORD || "LBID-test-123456"

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: authData, error: authError } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

if (authError && !authError.message.includes("already registered")) {
  console.error(authError.message)
  process.exit(1)
}

let userId = authData.user?.id
if (!userId) {
  const { data: users, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error(error.message)
    process.exit(1)
  }
  userId = users.users.find((user) => user.email === email)?.id
}

if (!userId) {
  console.error("Unable to resolve test user id")
  process.exit(1)
}

const agentId = crypto.randomUUID()

await supabase.from("users").upsert([
  {
    id: userId,
    role: "forwarder",
    company_name: "LBID Test Forwarder",
    country: "Hong Kong",
    email,
    referral_code: `TEST-FWD-${userId.slice(0, 6)}`,
  },
  {
    id: agentId,
    role: "agency",
    company_name: "LBID Test Agent",
    country: "Vietnam",
    email: `agent-${Date.now()}@lbid.local`,
    referral_code: `TEST-AGT-${Date.now()}`,
  },
])

await supabase.from("company_profiles").upsert({
  user_id: userId,
  company_name_en: "LBID Test Forwarder",
  region: "Hong Kong",
  is_public: true,
  onboarding_completed: true,
  reputation_score: 25,
  token_balance_free: 5,
  token_balance_paid: 0,
  token_free_reset_at: new Date(Date.now() + 30 * 86400000).toISOString(),
})

await supabase.from("subscriptions").upsert({
  user_id: userId,
  plan: "trial",
  status: "trial",
  trial_ends_at: new Date(Date.now() + 7 * 86400000).toISOString(),
})

const { data: sr, error: srError } = await supabase
  .from("shipment_requests")
  .insert({
    agent_id: agentId,
    cargo_details: { cargo: "Electronic components", weight_kg: 500, cbm: 3 },
    route: { origin: "Mumbai", destination: "Hong Kong" },
    services_needed: ["customs_clearance", "local_delivery"],
    deadline: new Date(Date.now() + 48 * 3600000).toISOString(),
    bid_deadline: new Date(Date.now() + 3 * 3600000).toISOString(),
    status: "OPEN",
  })
  .select()
  .single()

if (srError) {
  console.error(srError.message)
  process.exit(1)
}

const output = {
  email,
  password,
  userId,
  shipmentRequestId: sr.id,
  tokenBalanceFree: 5,
}

writeFileSync(".supabase-rpc-test.json", `${JSON.stringify(output, null, 2)}\n`)
console.log(JSON.stringify(output, null, 2))

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
