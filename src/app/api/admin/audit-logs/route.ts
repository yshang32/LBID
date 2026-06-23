import { NextResponse } from "next/server"

import { getAdminApiContext } from "@/lib/admin"

export async function GET(request: Request) {
  const admin = await getAdminApiContext(request)
  if (!admin) return NextResponse.json({ error: "ADMIN_REQUIRED" }, { status: 403 })
  const url = new URL(request.url)
  const entityType = url.searchParams.get("entityType")?.trim()
  let query = admin.service.from("audit_logs").select("id, actor_id, action, entity_type, entity_id, metadata, created_at").order("created_at", { ascending: false }).limit(200)
  if (entityType && entityType !== "all") query = query.eq("entity_type", entityType)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const actorIds = [...new Set((data || []).map((entry) => entry.actor_id).filter(Boolean))]
  const { data: users } = actorIds.length ? await admin.service.from("users").select("id, email, company_name").in("id", actorIds) : { data: [] }
  const actors = new Map((users || []).map((user) => [user.id, user]))
  return NextResponse.json({ auditLogs: (data || []).map((entry) => ({ ...entry, actor: entry.actor_id ? actors.get(entry.actor_id) || null : null })) })
}
