import type { SupabaseClient } from "@supabase/supabase-js"

type PaymentConfirmationContext = {
  eventId?: string | null
  eventType?: string | null
  stripeSessionId?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}

export async function confirmPaymentIntent(
  supabase: SupabaseClient,
  intentId: string,
  confirmedBy: string | null,
  context: PaymentConfirmationContext = {},
) {
  const { data, error } = await supabase.rpc("confirm_payment_intent_atomic", {
    p_intent_id: intentId,
    p_confirmed_by: confirmedBy,
    p_event_id: context.eventId ?? `manual:${intentId}`,
    p_event_type: context.eventType ?? "manual.confirmed",
    p_stripe_session_id: context.stripeSessionId ?? null,
    p_stripe_customer_id: context.stripeCustomerId ?? null,
    p_stripe_subscription_id: context.stripeSubscriptionId ?? null,
  })
  if (error) throw error

  return {
    ok: Boolean(data?.ok),
    intentId: data?.intent_id ?? intentId,
    userId: data?.user_id,
    type: data?.type,
    alreadyConfirmed: Boolean(data?.already_confirmed),
    alreadyProcessed: Boolean(data?.already_processed),
  }
}
