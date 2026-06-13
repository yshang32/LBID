export type Role = "agency" | "forwarder" | "admin"

export const membershipTiers = [
  { name: "Free", price: "HKD0", perks: ["Directory listing", "3 quotations / month", "Basic notifications"] },
  { name: "Standard", price: "HKD500/mo", perks: ["Unlimited bidding", "Quotation PDF", "Document reminders"] },
  { name: "Premium", price: "HKD1500/mo", perks: ["Profile boost", "Priority matching", "Analytics"] },
  { name: "Partner", price: "Custom", perks: ["Verified badge", "Events", "Dedicated support"] },
]

export const forwarders = [
  {
    slug: "harbourlink-cargo",
    name: "HarbourLink Cargo",
    rating: 4.9,
    reviews: 128,
    completedOrders: 342,
    badges: ["Verified", "Cold Chain", "Fast Response"],
    tier: "Premium",
    coverage: ["Hong Kong", "Shenzhen", "Macau"],
    services: ["Customs clearance", "Air freight", "Local delivery", "Warehousing"],
    responseTime: "18 min",
    description: "Hong Kong forwarder focused on temperature-sensitive air shipments and last-mile commercial delivery.",
  },
  {
    slug: "kowloon-gateway-logistics",
    name: "Kowloon Gateway Logistics",
    rating: 4.7,
    reviews: 94,
    completedOrders: 221,
    badges: ["Verified", "Sea Freight"],
    tier: "Standard",
    coverage: ["Hong Kong", "Yantian", "Nansha"],
    services: ["Sea freight", "B/L handling", "Warehouse receiving", "Trucking"],
    responseTime: "42 min",
    description: "Reliable cross-border sea freight operator for Southeast Asian agency cargo into Hong Kong.",
  },
  {
    slug: "aeroport-express-forwarding",
    name: "Aeroport Express Forwarding",
    rating: 4.8,
    reviews: 76,
    completedOrders: 188,
    badges: ["AWB Expert", "Premium"],
    tier: "Partner",
    coverage: ["Hong Kong Airport", "Kwai Chung", "Tsuen Wan"],
    services: ["AWB preparation", "Air freight", "Customs clearance", "POD"],
    responseTime: "25 min",
    description: "Air cargo specialist with standardised AWB handling and high-volume document workflows.",
  },
]

export const inquiries = [
  {
    id: "INQ-SEA-24091",
    agency: "Saigon Freight Agency",
    route: "Ho Chi Minh City -> Hong Kong",
    cargo: "420 kg chilled food samples",
    mode: "Air",
    incoterm: "CIF",
    services: ["Cold storage", "Customs clearance", "Local delivery"],
    deadline: "48h",
    status: "quoting",
  },
  {
    id: "INQ-MY-24077",
    agency: "Penang Export Desk",
    route: "Penang -> Hong Kong",
    cargo: "6.4 CBM consumer electronics",
    mode: "Sea",
    incoterm: "FOB",
    services: ["B/L handling", "Warehouse receiving", "Trucking"],
    deadline: "24h",
    status: "review",
  },
]

export const matchRecords = [
  {
    id: "MATCH-SEA-HK-001",
    shipmentRequestId: "INQ-SEA-24091",
    agency: "Saigon Freight Agency",
    forwarder: "HarbourLink Cargo",
    route: "Ho Chi Minh City -> Hong Kong",
    cargoLane: "Cold-chain air freight",
    winningBid: 12880,
    currency: "HKD",
    matchedAt: "2026-06-01",
    introductionPeriodStart: "2026-06-01",
    introductionPeriodEnd: "2026-08-31",
    isPreferredPartner: true,
    status: "introduction_period",
  },
  {
    id: "MATCH-MY-HK-002",
    shipmentRequestId: "INQ-MY-24077",
    agency: "Penang Export Desk",
    forwarder: "Kowloon Gateway Logistics",
    route: "Penang -> Hong Kong",
    cargoLane: "Sea freight LCL electronics",
    winningBid: 9400,
    currency: "HKD",
    matchedAt: "2026-05-18",
    introductionPeriodStart: "2026-05-18",
    introductionPeriodEnd: "2026-08-17",
    isPreferredPartner: true,
    status: "introduction_period",
  },
]

export const rateCards = [
  {
    id: "RC-SEA-HK-001",
    matchRecordId: "MATCH-SEA-HK-001",
    route: "Ho Chi Minh City -> Hong Kong",
    lane: "Cold-chain air freight",
    pricePerKg: 28,
    minimumCharge: 9800,
    currency: "HKD",
    validFrom: "2026-06-01",
    validTo: "2026-08-31",
  },
  {
    id: "RC-MY-HK-002",
    matchRecordId: "MATCH-MY-HK-002",
    route: "Penang -> Hong Kong",
    lane: "LCL sea freight",
    pricePerCbm: 1180,
    minimumCharge: 6800,
    currency: "HKD",
    validFrom: "2026-05-18",
    validTo: "2026-08-17",
  },
]

export const reorders = [
  {
    id: "RO-SEA-HK-1001",
    matchRecordId: "MATCH-SEA-HK-001",
    orderDate: "2026-06-12",
    volume: 420,
    unit: "kg",
    agreedPrice: 11760,
    currency: "HKD",
    status: "shipment_booked",
    introductionFeeRate: 0.08,
    feeStatus: "pending",
  },
  {
    id: "RO-MY-HK-1002",
    matchRecordId: "MATCH-MY-HK-002",
    orderDate: "2026-06-10",
    volume: 6.4,
    unit: "CBM",
    agreedPrice: 7552,
    currency: "HKD",
    status: "confirmed",
    introductionFeeRate: 0.05,
    feeStatus: "pending",
  },
]

export const volumeTracking = [
  {
    matchRecordId: "MATCH-SEA-HK-001",
    totalOrders: 3,
    totalVolume: "1,260 kg",
    totalValue: 36400,
    currency: "HKD",
    lastOrderDate: "2026-06-12",
  },
  {
    matchRecordId: "MATCH-MY-HK-002",
    totalOrders: 2,
    totalVolume: "12.8 CBM",
    totalValue: 16952,
    currency: "HKD",
    lastOrderDate: "2026-06-10",
  },
]

export function calculateIntroductionFee(introductionPeriodStart: string, orderDate: string, agreedPrice: number) {
  const start = new Date(introductionPeriodStart)
  const order = new Date(orderDate)
  const monthsSinceMatch = Math.max(0, (order.getFullYear() - start.getFullYear()) * 12 + order.getMonth() - start.getMonth())
  const feeSchedule = [0.08, 0.05, 0.03]
  const feeRate = feeSchedule[monthsSinceMatch] ?? 0

  return {
    feeRate,
    feeAmount: Math.round(agreedPrice * feeRate),
  }
}

export const quotation = {
  id: "QT-HK-8821",
  forwarder: "HarbourLink Cargo",
  total: 12880,
  currency: "HKD",
  lineItems: [
    { label: "Airport pickup and terminal handling", amount: 2600 },
    { label: "Cold storage first 24 hours", amount: 1880 },
    { label: "Customs clearance support", amount: 3200 },
    { label: "18 local delivery drops", amount: 5200 },
  ],
}

export const orderPipeline = [
  "confirmed",
  "shipment_booked",
  "in_transit",
  "arrived_hk",
  "customs_cleared",
  "delivered",
  "completed",
]

export const documentChecklist = ["AWB / B/L", "Commercial Invoice", "Packing List", "Certificate of Origin"]

export const pointRules = [
  "Complete order: +120 points",
  "5-star review: +80 points",
  "Fast response under 30 min: +40 points",
  "Referral transacts: +300 points",
]

export const subscriptionPlans = [
  {
    id: "monthly",
    name: "Monthly Member",
    price: "HKD 188/mo",
    trial: "7-day trial",
    includedTokens: 10,
    perks: ["Submit bids with tokens", "Create SRs", "Quotation builder", "Directory visibility"],
  },
  {
    id: "annual",
    name: "Annual Member",
    price: "HKD 1,880/yr",
    trial: "7-day trial",
    includedTokens: 10,
    perks: ["2 months free", "Higher renewal token grant", "Directory visibility", "Priority support"],
  },
]

export const tokenPackages = [
  { id: "tk-5", tokens: 5, price: "HKD 300", unitPrice: "HKD 60/token", bestFor: "Submit 5 sealed bids" },
  { id: "tk-20", tokens: 20, price: "HKD 1,000", unitPrice: "HKD 50/token", bestFor: "Regular SR bidding" },
  { id: "tk-50", tokens: 50, price: "HKD 2,000", unitPrice: "HKD 40/token", bestFor: "High-volume forwarders" },
]

export const directoryBoosts = [
  { id: "boost-1d", label: "1-day Directory Boost", cost: "5 tokens", scoreBonus: 1000 },
  { id: "boost-7d", label: "7-day Directory Boost", cost: "25 tokens", scoreBonus: 1000 },
]

export const companyProfile = {
  companyName: "HarbourLink Cargo",
  slogan: "Cold-chain air freight into Hong Kong, handled with proof.",
  region: "Hong Kong",
  membershipStatus: "trial",
  trialEndsAt: "2026-06-19",
  reputationScore: 57,
  directoryRank: 3,
  tokenBalanceFree: 8,
  tokenBalancePaid: 12,
  freeTokenResetAt: "2026-07-01",
  onboardingCompleted: true,
  advantageTags: ["Cold Chain", "AWB Expert", "Fast Response"],
}

export const matchStages = [
  "Matched",
  "Token used",
  "Contact revealed",
  "Quotation agreed",
  "Completed",
]

export function getMonthlyFreeTokenGrant(reputationScore: number) {
  if (reputationScore >= 50) return 12
  if (reputationScore >= 20) return 8
  return 5
}

export function calculateDirectoryScore({
  reputationScore,
  membershipBonus,
  recentBidCount,
  activeBoost,
}: {
  reputationScore: number
  membershipBonus: number
  recentBidCount: number
  activeBoost: boolean
}) {
  return reputationScore * 0.5 + membershipBonus + recentBidCount * 2 + (activeBoost ? 1000 : 0)
}
