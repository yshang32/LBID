import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export async function getAuthHeaders() {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return {}

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { authorization: `Bearer ${token}` } : {}
}

export async function apiJson(path: string, init: RequestInit = {}) {
  const authHeaders = await getAuthHeaders()
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...authHeaders,
      ...(init.headers || {}),
    },
  })

  const body = await response.json().catch(() => ({}))
  return { response, body }
}
