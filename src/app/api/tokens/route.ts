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
        .single(),
      supabase
        .from("token_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ])

    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 })
    if (transactionsError) return NextResponse.json({ error: transactionsError.message }, { status: 500 })

    return NextResponse.json({
      wallet: {
        userId: user.id,
        free: profile.token_balance_free,
        paid: profile.token_balance_paid,
        total: profile.token_balance_free + profile.token_balance_paid,
        freeTokenResetAt: profile.token_free_reset_at,
        reputationScore: profile.reputation_score,
        transactions,
      },
    })
  }

  return NextResponse.json({ wallet: getTokenWallet() })
}
