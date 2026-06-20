import { getApiSupabaseServiceClient, getApiSupabaseSession } from "@/lib/supabase/api"

export async function getAdminApiContext(request: Request) {
  const session = await getApiSupabaseSession(request)
  const service = getApiSupabaseServiceClient()
  if (!session || !service) return null

  const { data: user } = await service
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  if (user?.role !== "admin") return null
  return { service, userId: session.user.id }
}
