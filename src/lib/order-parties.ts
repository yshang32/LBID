import type { SupabaseClient } from "@supabase/supabase-js"

export async function getOrderParties(supabase: SupabaseClient | null, orderId: string) {
  if (!supabase) return null

  const { data, error } = await supabase
    .from("orders")
    .select("id, quotations(forwarder_id, shipment_request_id, shipment_requests(agent_id))")
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return null
  const quotation = Array.isArray(data.quotations) ? data.quotations[0] : data.quotations
  const shipmentRequest = Array.isArray(quotation?.shipment_requests) ? quotation?.shipment_requests[0] : quotation?.shipment_requests

  return {
    orderId: data.id,
    agencyId: shipmentRequest?.agent_id as string | undefined,
    forwarderId: quotation?.forwarder_id as string | undefined,
  }
}

export async function canAccessOrder(supabase: SupabaseClient | null, orderId: string, userId: string) {
  const parties = await getOrderParties(supabase, orderId)
  if (!parties || !supabase) return false
  if ([parties.agencyId, parties.forwarderId].includes(userId)) return true

  const { data } = await supabase
    .from("users")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  return data?.role === "admin"
}

export async function getUserEmails(supabase: SupabaseClient | null, userIds: string[]) {
  if (!supabase || userIds.length === 0) return {}

  const { data } = await supabase
    .from("users")
    .select("id, email")
    .in("id", userIds)

  return Object.fromEntries((data || []).map((user: any) => [user.id, user.email]))
}
