import type { SupabaseClient } from "@supabase/supabase-js"

export type LbidNotification = {
  userId: string
  type: string
  title: string
  body: string
  href?: string | null
  metadata?: Record<string, unknown>
}

export async function createNotification(supabase: SupabaseClient | null, notification: LbidNotification) {
  if (!supabase) return { created: false, skipped: true, reason: "SUPABASE_NOT_CONFIGURED" }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      href: notification.href ?? null,
      metadata: notification.metadata ?? {},
      read_at: null,
    })
    .select("id, user_id, type, title, body, href, metadata, read_at, created_at")
    .single()

  if (error) return { created: false, error: error.message }
  return { created: true, notification: data }
}

export async function listNotifications(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, href, metadata, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) return { notifications: [], error: error.message }
  return { notifications: data || [] }
}
