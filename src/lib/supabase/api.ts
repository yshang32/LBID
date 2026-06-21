import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js"

export type ApiSupabaseSession = {
  supabase: SupabaseClient
  user: User
}

export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function getApiSupabaseSession(request: Request): Promise<ApiSupabaseSession | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const authHeader = request.headers.get("authorization")

  if (!url || !anonKey || !authHeader?.toLowerCase().startsWith("bearer ")) return null

  const accessToken = authHeader.slice("bearer ".length)
  const supabase = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  })

  const { data, error } = await supabase.auth.getUser(accessToken)
  if (error || !data.user) return null

  return { supabase, user: data.user }
}

export function getApiSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}
