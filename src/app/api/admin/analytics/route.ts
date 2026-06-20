import { NextResponse } from "next/server"

import { getAdminApiContext } from "@/lib/admin"

export async function GET(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })

  const [forwarders, verified, paidMembers, orders, completed] = await Promise.all([
    admin.service.from("company_profiles").select("user_id", { count: "exact", head: true }),
    admin.service.from("company_profiles").select("user_id", { count: "exact", head: true }).eq("verification_status", "verified"),
    admin.service.from("subscriptions").select("user_id", { count: "exact", head: true }).eq("status", "active"),
    admin.service.from("orders").select("id", { count: "exact", head: true }),
    admin.service.from("orders").select("id", { count: "exact", head: true }).eq("status", "completed"),
  ])
  const failure = [forwarders, verified, paidMembers, orders, completed].find((item) => item.error)
  if (failure?.error) return NextResponse.json({ error: failure.error.message }, { status: 500 })

  const totalOrders = orders.count || 0
  return NextResponse.json({
    forwarders: forwarders.count || 0,
    verifiedForwarders: verified.count || 0,
    paidMembers: paidMembers.count || 0,
    orderCompletionRate: totalOrders ? Math.round(((completed.count || 0) / totalOrders) * 100) : 0,
  })
}
