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
      auth: "登入",
      forwarders: "香港 Forwarder",
      workflow: "配對流程",
      dashboard: "工作台",
      profile: "公司檔案",
      tokens: "Token 錢包",
      subscription: "會員方案",
      admin: "管理後台",
      cta: "建立需求",
    },
    home: {
      eyebrow: "Matching-first logistics platform",
      title: "讓價格回到公平，讓實力取代關係。",
      body:
        "LBID 讓海外 Agent 先提交 Shipment Request，香港 Forwarder 以密封報價回應。中標後不只是完成一次訂單，而是建立 Match Record、Preferred Partner、Rate Card、Reorder 和 Introduction Fee tracking。",
      primary: "建立第一張 SR",
      secondary: "瀏覽香港 Forwarder",
      pipelineTitle: "由需求到長期合作",
      modules: [
        {
          title: "Shipment Request",
          text: "Agent 提交貨物、路線、服務要求和期限，LBID 先整理需求，再配對合資格香港 Forwarder。",
        },
        {
          title: "Sealed Bid",
          text: "Forwarder 在限時內提交一次密封報價。其他公司的價格、名稱和內容全部不可見。",
        },
        {
          title: "Match Record",
          text: "中標結果會轉成合作記錄，保留責任、價格、服務範圍和後續跟進。",
        },
        {
          title: "Reorder Loop",
          text: "之後的重複訂單會追蹤成交額、貨量和平台 introduction fee，形成長期合作資料。",
        },
      ],
      pipeline: ["提交 SR", "Forwarder 密封報價", "Agent 選擇中標方", "建立 Match Record", "生成 Rate Card", "Reorder", "Volume Tracking"],
    },
  },
  en: {
    langName: "English",
    otherLang: "繁體中文",
    otherHref: "/zh",
    nav: {
      auth: "Auth",
      forwarders: "HK Forwarders",
      workflow: "Workflow",
      dashboard: "Workspace",
      profile: "Company Profile",
      tokens: "Token Wallet",
      subscription: "Membership",
      admin: "Admin",
      cta: "Create SR",
    },
    home: {
      eyebrow: "Matching-first logistics platform",
      title: "Fair prices. Real capability. No connections needed.",
      body:
        "LBID helps overseas agents submit Shipment Requests and lets Hong Kong forwarders respond through sealed bids. The winning bid becomes a Match Record, Preferred Partner, Rate Card, Reorder flow and Introduction Fee tracking layer.",
      primary: "Create first SR",
      secondary: "Browse HK forwarders",
      pipelineTitle: "From request to long-term partner",
      modules: [
        {
          title: "Shipment Request",
          text: "Agents submit cargo, route, service requirements and deadlines for LBID to match qualified Hong Kong forwarders.",
        },
        {
          title: "Sealed Bid",
          text: "Forwarders submit one sealed quotation within the bid window. Competitor prices, names and details stay hidden.",
        },
        {
          title: "Match Record",
          text: "The winning bid becomes a relationship record covering responsibility, price, service scope and follow-up.",
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
