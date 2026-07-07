import { NextResponse } from "next/server"

import { getTokenWallet } from "@/lib/backend"
import { getApiSupabaseSession } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)

  if (session) {
    const { supabase, user } = session
    const [{ data: profile, error: profileError }, { data: transactions, error: transactionsError }] = await Promise.all([
      supabase
        .from("company_profiles")
        .select("token_balance_free, token_balance_paid, token_free_reset_at, reputation_score")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("token_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ])

    // maybeSingle() returns { data: null, error: null } when the account has no
    // company_profiles row yet (e.g. onboarding never completed) instead of the
    // PGRST116 "Cannot coerce the result to a single JSON object" error that
    // .single() throws in that case - which was crashing the whole wallet page.
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
    if (transactionsError) return NextResponse.json({ error: transactionsError.message }, { status: 500 })

    return NextResponse.json({
      wallet: {
        userId: user.id,
        free: profile?.token_balance_free ?? 0,
        paid: profile?.token_balance_paid ?? 0,
        total: (profile?.token_balance_free ?? 0) + (profile?.token_balance_paid ?? 0),
        freeTokenResetAt: profile?.token_free_reset_at ?? null,
        reputationScore: profile?.reputation_score ?? 0,
        transactions,
      },
    })
  }

  return NextResponse.json({ wallet: getTokenWallet() })
}
