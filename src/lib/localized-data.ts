import { documentChecklist, forwarders, membershipTiers, pointRules, quotation } from "@/lib/data"
import type { Locale } from "@/lib/i18n"

const zhForwarderCopy: Record<string, { description: string; badges: string[]; coverage: string[]; responseTime: string }> = {
  "harbourlink-cargo": {
    description: "專注香港冷鏈、醫藥和高價貨派送，熟悉機場提貨、溫控交收和最後一公里派送要求。",
    badges: ["已驗證", "冷鏈", "快速回覆"],
    coverage: ["香港", "九龍", "新界"],
    responseTime: "18 分鐘",
  },
  "kowloon-gateway-logistics": {
    description: "處理東南亞到香港的 LCL、FCL 和本地倉儲派送，適合中小型 Agent 建立長期 rate card。",
    badges: ["已驗證", "海運"],
    coverage: ["香港", "葵涌", "屯門"],
    responseTime: "42 分鐘",
  },
  "aeroport-express-forwarding": {
    description: "空運清關和 AWB 文件處理經驗較強，支援 urgent shipment、COD 和機場直送。",
    badges: ["AWB 文件", "空運專線"],
    coverage: ["香港機場", "觀塘", "荃灣"],
    responseTime: "25 分鐘",
  },
}

const zhTierCopy: Record<string, { name: string; price: string; perks: string[] }> = {
  Free: { name: "免費", price: "HKD0", perks: ["Directory 基本曝光", "每月 3 次報價", "基本通知"] },
  Standard: { name: "標準", price: "HKD500/月", perks: ["更多報價額度", "PDF 報價工具", "配對提醒"] },
  Premium: { name: "高級", price: "HKD1500/月", perks: ["Profile boost", "優先配對", "營運分析"] },
  Partner: { name: "合作夥伴", price: "洽談", perks: ["已驗證徽章", "專屬配對支援", "共同市場推廣"] },
}

const zhQuotationLabels = [
  "機場 / 碼頭處理及 terminal handling",
  "24 小時本地派送",
  "清關文件處理",
  "18 度溫控派送附加費",
]

export function getLocalizedForwarders(locale: Locale) {
  if (locale === "en") return forwarders

  return forwarders.map((forwarder) => {
    const local = zhForwarderCopy[forwarder.slug]
    return local ? { ...forwarder, ...local } : forwarder
  })
}

export function getLocalizedMembershipTiers(locale: Locale) {
  if (locale === "en") return membershipTiers

  return membershipTiers.map((tier) => zhTierCopy[tier.name] ?? tier)
}

export function getLocalizedQuotation(locale: Locale) {
  if (locale === "en") return quotation

  return {
    ...quotation,
    lineItems: quotation.lineItems.map((item, index) => ({
      ...item,
      label: zhQuotationLabels[index] ?? item.label,
    })),
  }
}

export function getLocalizedDocumentChecklist(locale: Locale) {
  if (locale === "en") return documentChecklist

  return ["AWB / B/L", "Commercial Invoice 商業發票", "Packing List 裝箱單", "Certificate of Origin 產地來源證"]
}

export function getLocalizedPointRules(locale: Locale) {
  if (locale === "en") return pointRules

  return ["完成訂單：+120 分", "獲得評價：+80 分", "30 分鐘內回覆：+40 分", "成功推薦新用戶交易：+300 分"]
}
