export const v4Status = {
  tokens: 8,
  reputation: 57,
  membership: "月費會員",
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
    routeMask: "香港九龍區 -> Metro Manila",
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
    status: "交易中：等對方確認文件",
    route: "Ho Chi Minh City -> Hong Kong",
  },
  {
    id: "MATCH-1235",
    title: "Penang Export Desk x Kowloon Gateway Logistics",
    stage: 2,
    status: "資料已解鎖：準備 quotation",
    route: "Penang -> Hong Kong",
  },
]

export const v4TokenPackages = [
  { id: "starter", name: "Starter", tokens: 5, price: "$200", unit: "$40/token" },
  { id: "basic", name: "Basic", tokens: 10, price: "$380", unit: "$38/token" },
  { id: "popular", name: "Popular", tokens: 50, price: "$1,750", unit: "$35/token", popular: true },
  { id: "growth", name: "Growth", tokens: 100, price: "$3,200", unit: "$32/token" },
  { id: "business", name: "Business", tokens: 200, price: "$5,800", unit: "$29/token" },
  { id: "scale", name: "Scale", tokens: 500, price: "$13,000", unit: "$26/token" },
  { id: "enterprise", name: "Enterprise", tokens: 1000, price: "$22,000", unit: "$22/token" },
]

export const v4CommunityPosts = [
  {
    company: "ABC Logistics",
    score: 47,
    time: "1小時前",
    type: "公司展示",
    content: "我哋公司啱啱完成一張 HK -> Sydney 嘅大柜，Transit Time 縮短咗 1 日。",
    likes: 12,
    comments: 3,
    shares: 1,
  },
  {
    company: "HarbourLink Cargo",
    score: 57,
    time: "今日",
    type: "行業資訊",
    content: "本週香港機場冷鏈倉位比較緊，建議 Agent 提早 48 小時建立 SR。",
    likes: 18,
    comments: 5,
    shares: 2,
  },
]

export const v4Services = [
  { name: "Logistics Website", description: "為 forwarder 建立公司網站、SEO landing page 和查詢表單。", price: "From HKD 18,000" },
  { name: "Quotation CRM", description: "把 Excel / WhatsApp 報價流程轉成可追蹤的 CRM。", price: "From HKD 38,000" },
  { name: "ERP / Workflow", description: "客製化 booking、AWB、文件、對帳和報表流程。", price: "Custom" },
]
