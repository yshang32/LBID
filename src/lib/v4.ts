export const v4Status = {
  tokens: 8,
  reputation: 57,
  membership: "Standard Member",
  notifications: 3,
  companyName: "HarbourLink Cargo",
}

export const v4ShipmentRequests = [
  {
    id: "SR-2026-00123",
    lane: "香港 -> 馬尼拉",
    laneEn: "Hong Kong -> Manila",
    flags: "HK -> PH",
    cargo: "20ft FCL Container",
    deadline: "02:15:30",
    usedSlots: 3,
    totalSlots: 5,
    reputationRequired: 30,
    budgetLevel: "$$$$",
    mode: "Sea Freight",
    routeMask: "Hong Kong port area -> Metro Manila",
    tokenCost: 1,
    priorityCost: 2,
    hot: true,
  },
  {
    id: "SR-2026-00124",
    lane: "胡志明市 -> 香港",
    laneEn: "Ho Chi Minh City -> Hong Kong",
    flags: "VN -> HK",
    cargo: "420 kg chilled food samples",
    deadline: "05:42:10",
    usedSlots: 2,
    totalSlots: 5,
    reputationRequired: 20,
    budgetLevel: "$$$",
    mode: "Air Freight",
    routeMask: "Vietnam city level -> Hong Kong",
    tokenCost: 1,
    priorityCost: 2,
    hot: false,
  },
  {
    id: "SR-2026-00125",
    lane: "檳城 -> 香港",
    laneEn: "Penang -> Hong Kong",
    flags: "MY -> HK",
    cargo: "6.4 CBM electronics LCL",
    deadline: "08:18:44",
    usedSlots: 1,
    totalSlots: 5,
    reputationRequired: 10,
    budgetLevel: "$$$",
    mode: "Sea Freight LCL",
    routeMask: "Penang port area -> Hong Kong",
    tokenCost: 1,
    priorityCost: 2,
    hot: false,
  },
]

export const v4Matches = [
  {
    id: "MATCH-1234",
    title: "Saigon Freight Agency x HarbourLink Cargo",
    stage: 3,
    status: "In trade",
    route: "Ho Chi Minh City -> Hong Kong",
  },
  {
    id: "MATCH-1235",
    title: "Penang Export Desk x Kowloon Gateway Logistics",
    stage: 2,
    status: "Quotation accepted",
    route: "Penang -> Hong Kong",
  },
]

export const v4TokenPackages = [
  { id: "starter", name: "Starter", tokens: 5, price: "HKD 200", unit: "HKD 40/token" },
  { id: "basic", name: "Basic", tokens: 10, price: "HKD 380", unit: "HKD 38/token" },
  { id: "popular", name: "Popular", tokens: 50, price: "HKD 1,750", unit: "HKD 35/token", popular: true },
  { id: "growth", name: "Growth", tokens: 100, price: "HKD 3,200", unit: "HKD 32/token" },
  { id: "business", name: "Business", tokens: 200, price: "HKD 5,800", unit: "HKD 29/token" },
  { id: "scale", name: "Scale", tokens: 500, price: "HKD 13,000", unit: "HKD 26/token" },
  { id: "enterprise", name: "Enterprise", tokens: 1000, price: "HKD 22,000", unit: "HKD 22/token" },
]

export const v4CommunityPosts = [
  {
    company: "ABC Logistics",
    score: 47,
    time: "1 hour ago",
    type: "Market update",
    content: "Looking for reliable HK to Sydney air freight capacity this week. Transit time matters more than lowest cost.",
    likes: 12,
    comments: 3,
    shares: 1,
  },
  {
    company: "HarbourLink Cargo",
    score: 57,
    time: "Today",
    type: "Operations note",
    content: "We completed two sealed-bid matches this week. Clear SR details reduced quotation back-and-forth significantly.",
    likes: 18,
    comments: 5,
    shares: 2,
  },
]

export const v4Services = [
  { name: "Logistics Website", description: "A focused lead-generation website for forwarders, with SEO landing pages and enquiry capture.", price: "From HKD 18,000" },
  { name: "Quotation CRM", description: "Replace Excel and WhatsApp quotation tracking with a structured CRM workflow.", price: "From HKD 38,000" },
  { name: "ERP / Workflow", description: "Custom booking, AWB, document checklist and operations workflow for logistics teams.", price: "Custom" },
]
