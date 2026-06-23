import type { SupabaseClient } from "@supabase/supabase-js"

export async function writeAuditLog(
  supabase: SupabaseClient,
  entry: { actorId?: string | null; action: string; entityType: string; entityId?: string | null; metadata?: Record<string, unknown> },
) {
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: entry.actorId ?? null,
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
  })
  return { recorded: !error, error: error?.message }
}
