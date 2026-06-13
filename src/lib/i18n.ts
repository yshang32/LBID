export type Locale = "zh" | "en"

export const locales: Locale[] = ["zh", "en"]

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export const dictionary = {
  zh: {
    langName: "繁體中文",
    otherLang: "English",
    otherHref: "/en",
    nav: {
      auth: "登入 / 註冊",
      forwarders: "Directory",
      workflow: "SR 流程",
      dashboard: "Dashboard",
      profile: "Profile",
      tokens: "Tokens",
      subscription: "訂閱",
      admin: "管理後台",
      cta: "建立 SR",
    },
    home: {
      eyebrow: "Matching-first logistics platform",
      title: "LBID 先配對，再建立長期物流合作。",
      body:
        "海外 Agent 先提交 Shipment Request，香港 Forwarder 以 sealed bid 回應。勝出後不是只完成一次訂單，而是建立 Match Record、Preferred Partner、Rate Card、Reorder 和 Introduction Fee tracking。",
      primary: "建立第一張 SR",
      secondary: "瀏覽香港 Forwarder",
      pipelineTitle: "Matching-first flow",
      modules: [
        {
          title: "Shipment Request",
          text: "Agent 提交貨物、路線、服務要求和截止時間，LBID 配對合適香港 Forwarder。",
        },
        {
          title: "Sealed Bid",
          text: "Forwarder 提交一次密封報價，其他 Forwarder 看不到價格或內容。",
        },
        {
          title: "Match Record",
          text: "勝出報價會轉成配對紀錄，建立 Preferred Partner 和 Rate Card。",
        },
        {
          title: "Reorder Loop",
          text: "後續 Reorder 會追蹤貨量、訂單價值和 Introduction Fee，支持長期合作。",
        },
      ],
      pipeline: ["提交 SR", "Forwarder 密封報價", "Agent 選擇勝出者", "建立 Match Record", "生成 Rate Card", "Reorder", "Volume Tracking"],
    },
  },
  en: {
    langName: "English",
    otherLang: "繁體中文",
    otherHref: "/zh",
    nav: {
      auth: "Auth",
      forwarders: "Directory",
      workflow: "SR Flow",
      dashboard: "Dashboard",
      profile: "Profile",
      tokens: "Tokens",
      subscription: "Subscription",
      admin: "Admin",
      cta: "Create SR",
    },
    home: {
      eyebrow: "Matching-first logistics platform",
      title: "LBID matches once, then builds long-term logistics trust.",
      body:
        "Overseas agents submit Shipment Requests and Hong Kong forwarders respond with sealed bids. The winning bid becomes a Match Record, Preferred Partner, Rate Card, Reorder flow and Introduction Fee tracking layer.",
      primary: "Create first SR",
      secondary: "Browse HK forwarders",
      pipelineTitle: "Matching-first flow",
      modules: [
        {
          title: "Shipment Request",
          text: "Agents submit cargo, route, service requirements and deadlines for LBID to match qualified Hong Kong forwarders.",
        },
        {
          title: "Sealed Bid",
          text: "Forwarders submit one sealed quotation. Competitor prices, names and details stay hidden.",
        },
        {
          title: "Match Record",
          text: "The winning bid becomes a relationship record with Preferred Partner status and Rate Card.",
        },
        {
          title: "Reorder Loop",
          text: "Future reorders track volume, order value and Introduction Fee for long-term collaboration.",
        },
      ],
      pipeline: ["Submit SR", "Forwarder sealed bid", "Agent selects winner", "Create Match Record", "Generate Rate Card", "Reorder", "Volume Tracking"],
    },
  },
} as const
