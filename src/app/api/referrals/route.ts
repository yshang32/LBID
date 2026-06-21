import { NextResponse } from "next/server"

import { createNotification } from "@/lib/notifications"
import { getApiSupabaseSession, isSupabaseConfigured } from "@/lib/supabase/api"

export async function GET(request: Request) {
  const session = await getApiSupabaseSession(request)
  if (!session) {
    if (isSupabaseConfigured()) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    return NextResponse.json({
      referralCode: "LBID-DEMO",
      referrals: [
        { id: "ref-demo-1", referred_email: "ops@agency.vn", status: "joined", points_awarded: 0 },
        { id: "ref-demo-2", referred_email: "sales@forwarder.hk", status: "transacted", points_awarded: 300 },
      ],
      mode: "demo_fallback",
    })
  }

  const [{ data: user }, { data: referrals, error }] = await Promise.all([
    session.supabase.from("users").select("referral_code").eq("id", session.user.id).maybeSingle(),
    session.supabase.from("referrals").select("*").eq("referrer_id", session.user.id).order("created_at", { ascending: false }),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ referralCode: user?.referral_code, referrals: referrals || [] })
}

export async function POST(request: Request) {
  const session = await getApiSupabaseSession(request)
  const body = await request.json().catch(() => ({}))
  if (!body.email) return NextResponse.json({ error: "EMAIL_REQUIRED" }, { status: 400 })

  if (!session) {
    if (isSupabaseConfigured()) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    return NextResponse.json({ ok: true, mode: "demo_fallback", referral: { id: `ref-${Date.now()}`, referred_email: body.email, status: "invited" } }, { status: 201 })
  }

  const { data, error } = await session.supabase.from("referrals").insert({
    referrer_id: session.user.id,
    referred_email: body.email,
    status: "invited",
    points_awarded: 0,
  }).select("*").single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await createNotification(session.supabase, {
    userId: session.user.id,
    type: "referral_invited",
    title: "Referral invited",
    body: `${body.email} has been added to your referral tracker.`,
    href: "/tokens",
    metadata: { referralId: data.id },
  })

  return NextResponse.json({ ok: true, referral: data }, { status: 201 })
}
