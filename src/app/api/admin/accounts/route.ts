import { NextResponse } from "next/server"

import { writeAuditLog } from "@/lib/audit-log"
import { createNotification } from "@/lib/notifications"
import { getAdminApiContext } from "@/lib/admin"

const plans = ["trial", "monthly", "annual"] as const
type Plan = (typeof plans)[number]

export async function GET(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const [usersResult, profilesResult, subscriptionsResult] = await Promise.all([
    admin.service.from("users").select("id, email, company_name, role, created_at").order("created_at", { ascending: false }).limit(200),
    admin.service.from("company_profiles").select("user_id, company_name_en, company_name_zh, region, can_be_client, can_be_forwarder"),
    admin.service.from("subscriptions").select("user_id, plan, status, current_period_end, trial_ends_at").order("created_at", { ascending: false }),
  ])
  const error = usersResult.error || profilesResult.error || subscriptionsResult.error
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const profiles = new Map((profilesResult.data || []).map((profile) => [profile.user_id, profile]))
  const subscriptions = new Map((subscriptionsResult.data || []).map((subscription) => [subscription.user_id, subscription]))
  const accounts = (usersResult.data || []).map((user) => ({
    ...user,
    profile: profiles.get(user.id) || null,
    subscription: subscriptions.get(user.id) || null,
  }))
  return NextResponse.json({ accounts })
}

export async function PATCH(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const userId = typeof body.userId === "string" ? body.userId : ""
  const plan = body.plan as Plan
  if (!userId || !plans.includes(plan)) return NextResponse.json({ error: "INVALID_MEMBERSHIP_UPDATE" }, { status: 400 })

  const now = new Date()
  const periodEnd = new Date(now)
  if (plan === "annual") periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  else periodEnd.setMonth(periodEnd.getMonth() + 1)
  const status = plan === "trial" ? "trial" : "active"

  const { data, error } = await admin.service
    .from("subscriptions")
    .upsert({
      user_id: userId,
      plan,
      status,
      current_period_end: periodEnd.toISOString(),
      trial_ends_at: plan === "trial" ? periodEnd.toISOString() : null,
    }, { onConflict: "user_id" })
    .select("id, user_id, plan, status, current_period_end, trial_ends_at")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await Promise.all([
    writeAuditLog(admin.service, { actorId: admin.userId, action: "membership_adjusted", entityType: "subscription", entityId: data.id, metadata: { userId, plan, status } }),
    createNotification(admin.service, { userId, type: "membership_updated", title: "Membership updated", body: `Your LBID membership is now ${plan}.`, href: "/subscription", metadata: { plan, status } }),
  ])
  return NextResponse.json({ ok: true, subscription: data })
}
