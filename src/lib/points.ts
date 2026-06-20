import type { SupabaseClient } from "@supabase/supabase-js"

export const pointRewards = [
  { id: "profile_boost_1d", label: "1-day profile boost", points: 300, type: "directory_boost" },
  { id: "subscription_discount_100", label: "HKD 100 subscription discount", points: 500, type: "subscription_discount" },
  { id: "event_ticket", label: "LBID logistics event ticket", points: 800, type: "event_ticket" },
]

export async function getPointBalance(supabase: SupabaseClient | null, userId: string | null) {
  if (!supabase || !userId) {
    return { balance: 1240, events: demoPointEvents(), rewards: pointRewards, mode: "demo_fallback" }
  }

  const [{ data: user }, { data: events, error }] = await Promise.all([
    supabase.from("users").select("points, referral_code").eq("id", userId).maybeSingle(),
    supabase.from("point_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
  ])

  if (error) return { error: error.message }
  return { balance: user?.points || 0, referralCode: user?.referral_code, events: events || [], rewards: pointRewards }
}

export async function redeemPoints(supabase: SupabaseClient | null, userId: string | null, rewardId: string) {
  const reward = pointRewards.find((item) => item.id === rewardId)
  if (!reward) return { error: "UNKNOWN_REWARD" }

  if (!supabase || !userId) {
    return { ok: true, mode: "demo_fallback", redemption: { id: `redeem-${Date.now()}`, reward, points: -reward.points } }
  }

  const { data: user, error: userError } = await supabase.from("users").select("points").eq("id", userId).maybeSingle()
  if (userError) return { error: userError.message }
  if (!user || Number(user.points || 0) < reward.points) return { error: "INSUFFICIENT_POINTS" }

  const { error: updateError } = await supabase.from("users").update({ points: Number(user.points) - reward.points }).eq("id", userId)
  if (updateError) return { error: updateError.message }

  const { data, error } = await supabase.from("point_transactions").insert({
    user_id: userId,
    type: "redeem",
    source: reward.type,
    points: -reward.points,
    metadata: { rewardId: reward.id, label: reward.label },
  }).select("*").single()

  if (error) return { error: error.message }
  return { ok: true, redemption: data, reward }
}

function demoPointEvents() {
  return [
    { id: "pt-complete", type: "earn", source: "completed_order", points: 120, created_at: "2026-06-18T09:00:00Z" },
    { id: "pt-review", type: "earn", source: "five_star_review", points: 80, created_at: "2026-06-17T09:00:00Z" },
    { id: "pt-fast", type: "earn", source: "fast_response", points: 40, created_at: "2026-06-16T09:00:00Z" },
  ]
}
