import type { SupabaseClient } from "@supabase/supabase-js"

export async function confirmPaymentIntent(
  supabase: SupabaseClient,
  intentId: string,
  confirmedBy: string | null,
) {
  const { data: intent, error: intentError } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("id", intentId)
    .single()

  if (intentError) throw intentError
  if (!intent) throw new Error("INVALID_INTENT")
  if (intent.status === "confirmed") return { ok: true, intentId, userId: intent.user_id, type: intent.type, alreadyConfirmed: true }
  if (intent.status !== "pending") throw new Error("INVALID_INTENT")

  if (intent.type === "token_purchase") {
    const tokens = Number(intent.related_token_package?.tokens ?? intent.related_plan?.tokens ?? 0)
    if (tokens <= 0) throw new Error("INVALID_TOKEN_PACKAGE")

    const { error } = await supabase.rpc("adjust_token_balance", {
      p_user_id: intent.user_id,
      p_amount: tokens,
      p_balance_type: "paid",
      p_type: "purchase",
      p_source: "token_package",
      p_related_id: intent.id,
    })
    if (error) throw error
  }

  if (intent.type === "subscription") {
    const plan = intent.related_plan?.plan_id ?? intent.related_plan?.id ?? "monthly"
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + (plan === "annual" ? 12 : 1))

    const { error } = await supabase
      .from("subscriptions")
      .upsert({
        user_id: intent.user_id,
        plan,
        status: "active",
        current_period_end: periodEnd.toISOString(),
        stripe_customer_id: intent.stripe_customer_id ?? null,
        stripe_subscription_id: intent.stripe_subscription_id ?? null,
      }, { onConflict: "user_id" })
    if (error) throw error
  }

  const { error: updateError } = await supabase
    .from("payment_intents")
    .update({
      status: "confirmed",
      confirmed_by: confirmedBy,
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", intentId)

  if (updateError) throw updateError

  return { ok: true, intentId, userId: intent.user_id, type: intent.type }
}
