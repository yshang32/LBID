import {
  calculateDirectoryScore,
  companyProfile,
  directoryBoosts,
  forwarders,
  getMonthlyFreeTokenGrant,
  inquiries,
  matchRecords,
  rateCards,
  reorders,
  subscriptionPlans,
  tokenPackages,
  volumeTracking,
} from "@/lib/data"

type PaymentMethod = "stripe" | "fps" | "payme"
type PaymentIntentType = "subscription" | "token_purchase"
type SubscriptionStatus = "trial" | "active" | "expired" | "pending_payment"
type TokenBalanceType = "free" | "paid"

const demoUserId = "demo-user-forwarder"

const demoSubscription = {
  id: "sub-demo-trial",
  userId: demoUserId,
  plan: "trial",
  status: companyProfile.membershipStatus as SubscriptionStatus,
  trialEndsAt: companyProfile.trialEndsAt,
  currentPeriodEnd: companyProfile.trialEndsAt,
}

const tokenTransactions = [
  {
    id: "txn-trial-grant",
    userId: demoUserId,
    type: "free_grant",
    source: "trial",
    amount: 10,
    balanceType: "paid" as TokenBalanceType,
    balanceAfter: companyProfile.tokenBalancePaid,
    createdAt: "2026-06-12T00:00:00.000Z",
  },
]

const paymentIntents: Array<{
  id: string
  userId: string
  type: PaymentIntentType
  amount: number
  currency: "HKD"
  paymentMethod: PaymentMethod
  status: "pending" | "confirmed" | "rejected"
  stripeSessionId: string | null
  fpsReference: string | null
  proofUrl: string | null
  relatedPlanOrPackage: unknown
  createdAt: string
  confirmedAt: string | null
}> = []

export function checkAccess(action: string) {
  const isActiveOrTrial = ["trial", "active"].includes(demoSubscription.status)
  const restrictedActions = ["create_shipment_request", "submit_bid", "create_quotation", "show_in_directory"]

  if (restrictedActions.includes(action) && !isActiveOrTrial) {
    return { allowed: false, redirect: "/subscription" }
  }

  return { allowed: true, redirect: null }
}

export function getTokenWallet() {
  return {
    userId: demoUserId,
    free: companyProfile.tokenBalanceFree,
    paid: companyProfile.tokenBalancePaid,
    total: companyProfile.tokenBalanceFree + companyProfile.tokenBalancePaid,
    nextFreeGrant: getMonthlyFreeTokenGrant(companyProfile.reputationScore),
    freeTokenResetAt: companyProfile.freeTokenResetAt,
    transactions: tokenTransactions,
  }
}

export function spendToken(source: "bid" | "directory_boost", amount = 1) {
  const wallet = getTokenWallet()
  if (wallet.total < amount) {
    return { ok: false as const, error: "TOKEN_INSUFFICIENT", wallet }
  }

  const useFree = Math.min(wallet.free, amount)
  const usePaid = amount - useFree
  const balanceAfter = wallet.total - amount

  tokenTransactions.unshift({
    id: `txn-${Date.now()}`,
    userId: demoUserId,
    type: "spend",
    source,
    amount: -amount,
    balanceType: useFree > 0 && usePaid === 0 ? "free" : "paid",
    balanceAfter,
    createdAt: new Date().toISOString(),
  })

  return {
    ok: true as const,
    spent: { free: useFree, paid: usePaid, amount },
    balanceAfter,
  }
}

export function createPaymentIntent({
  type,
  paymentMethod,
  planOrPackageId,
}: {
  type: PaymentIntentType
  paymentMethod: PaymentMethod
  planOrPackageId: string
}) {
  const item =
    type === "subscription"
      ? subscriptionPlans.find((plan) => plan.id === planOrPackageId)
      : tokenPackages.find((pack) => pack.id === planOrPackageId)

  if (!item) return { ok: false as const, error: "UNKNOWN_PLAN_OR_PACKAGE" }

  const priceText = "price" in item ? item.price : "HKD 0"
  const amount = Number(priceText.replace(/[^0-9]/g, "")) || 0
  const id = `pi-${Date.now()}`
  const paymentIntent = {
    id,
    userId: demoUserId,
    type,
    amount,
    currency: "HKD" as const,
    paymentMethod,
    status: "pending" as const,
    stripeSessionId: paymentMethod === "stripe" ? `cs_test_${id}` : null,
    fpsReference: paymentMethod === "fps" ? `LBID-${id}` : null,
    proofUrl: null,
    relatedPlanOrPackage: item,
    createdAt: new Date().toISOString(),
    confirmedAt: null,
  }

  paymentIntents.unshift(paymentIntent)

  return {
    ok: true as const,
    paymentIntent,
    nextAction:
      paymentMethod === "stripe"
        ? { type: "redirect", url: `https://checkout.stripe.com/c/pay/${paymentIntent.stripeSessionId}` }
        : { type: "manual_proof", reference: paymentIntent.fpsReference ?? id },
  }
}

export function confirmPaymentIntent(id: string) {
  const intent = paymentIntents.find((item) => item.id === id)
  if (!intent) return { ok: false as const, error: "PAYMENT_INTENT_NOT_FOUND" }

  intent.status = "confirmed"
  intent.confirmedAt = new Date().toISOString()

  if (intent.type === "token_purchase") {
    const pack = intent.relatedPlanOrPackage as (typeof tokenPackages)[number]
    tokenTransactions.unshift({
      id: `txn-purchase-${Date.now()}`,
      userId: demoUserId,
      type: "purchase",
      source: "admin",
      amount: pack.tokens,
      balanceType: "paid",
      balanceAfter: companyProfile.tokenBalanceFree + companyProfile.tokenBalancePaid + pack.tokens,
      createdAt: new Date().toISOString(),
    })
  }

  return { ok: true as const, paymentIntent: intent }
}

export function listPaymentIntents() {
  return paymentIntents
}

export function getDirectory() {
  return forwarders
    .map((forwarder) => {
      const activeBoost = forwarder.tier === "Partner"
      const directoryScore = calculateDirectoryScore({
        reputationScore: forwarder.rating * 10,
        membershipBonus: forwarder.tier === "Premium" || forwarder.tier === "Partner" ? 20 : 10,
        recentBidCount: forwarder.completedOrders % 10,
        activeBoost,
      })

      return { ...forwarder, activeBoost, directoryScore: Math.round(directoryScore) }
    })
    .sort((a, b) => b.directoryScore - a.directoryScore)
}

export function getBackendSnapshot() {
  return {
    userId: demoUserId,
    companyProfile,
    subscription: demoSubscription,
    tokenWallet: getTokenWallet(),
    shipmentRequests: inquiries,
    matchRecords,
    rateCards,
    reorders,
    volumeTracking,
    paymentIntents,
    directoryBoosts,
  }
}

export function runCronJob(job: string) {
  if (job === "monthly-token-reset") {
    const grant = getMonthlyFreeTokenGrant(companyProfile.reputationScore)
    return {
      job,
      expiredFreeTokens: companyProfile.tokenBalanceFree,
      grantedFreeTokens: grant,
      transactionTypes: ["free_expire", "free_grant"],
    }
  }

  if (job === "trial-expiry") {
    return {
      job,
      checkedSubscriptions: 1,
      expiredSubscriptions: demoSubscription.status === "trial" ? 0 : 1,
      notification: "upgrade_reminder",
    }
  }

  if (job === "reputation-decay") {
    return { job, checkedMatches: matchRecords.length, decayedProfiles: 0, scoreChange: -5 }
  }

  if (job === "directory-boost-expiry") {
    return { job, checkedBoosts: directoryBoosts.length, expiredBoosts: 0 }
  }

  if (job === "sr-deadline-close") {
    return { job, checkedShipmentRequests: inquiries.length, closedForBidding: 0 }
  }

  if (job === "subscription-reminders") {
    return { job, remindersQueued: 1, channels: ["email", "in_app"] }
  }

  return { job, error: "UNKNOWN_CRON_JOB" }
}
