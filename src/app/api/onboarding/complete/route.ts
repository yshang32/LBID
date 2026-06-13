import { NextResponse } from "next/server"

import { companyProfile } from "@/lib/data"

export async function POST() {
  return NextResponse.json({
    ok: true,
    companyProfile: {
      ...companyProfile,
      onboardingCompleted: true,
      membershipStatus: "trial",
      tokenBalancePaid: companyProfile.tokenBalancePaid + 10,
    },
    subscription: {
      plan: "trial",
      status: "trial",
      trialEndsAt: companyProfile.trialEndsAt,
    },
    tokenTransaction: {
      type: "free_grant",
      source: "trial",
      amount: 10,
      balanceType: "paid",
    },
    redirect: "/dashboard",
  })
}
