import { documentChecklist, forwarders, membershipTiers, pointRules, quotation } from "@/lib/data"
import type { Locale } from "@/lib/i18n"

const zhForwarderCopy: Record<string, { description: string; badges: string[]; coverage: string[]; responseTime: string }> = {
  "harbourlink-cargo": {
    description: "香港冷鏈及空運貨代，擅長溫控貨物、機場處理和本地商業派送。",
    badges: ["已驗證", "冷鏈", "快速回覆"],
    coverage: ["香港", "深圳", "澳門"],
    responseTime: "18 分鐘",
  },
  "kowloon-gateway-logistics": {
    description: "專注東南亞進口香港的海運及倉儲銜接，適合 LCL、B/L 和本地拖車流程。",
    badges: ["已驗證", "海運"],
    coverage: ["香港", "鹽田", "南沙"],
    responseTime: "42 分鐘",
  },
  "aeroport-express-forwarding": {
    description: "空運文件及 AWB 流程專家，適合高頻文件、POD 和機場交收場景。",
    badges: ["AWB 專家", "高級會員"],
    coverage: ["香港機場", "葵涌", "荃灣"],
    responseTime: "25 分鐘",
  },
}

const zhTierCopy: Record<string, { name: string; price: string; perks: string[] }> = {
  Free: { name: "免費", price: "HKD0", perks: ["基本目錄曝光", "每月 3 次報價", "基本通知"] },
  Standard: { name: "標準", price: "HKD500/月", perks: ["不限次數競價", "PDF 報價", "文件提醒"] },
  Premium: { name: "高級", price: "HKD1500/月", perks: ["Profile boost", "優先配對", "營運分析"] },
  Partner: { name: "合作夥伴", price: "自訂", perks: ["已驗證徽章", "活動門票", "專屬支援"] },
}

const zhQuotationLabels = [
  "機場提貨及 terminal handling",
  "首 24 小時冷鏈倉儲",
  "清關支援",
  "18 個本地派送點",
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

  return ["AWB / B/L", "Commercial Invoice 商業發票", "Packing List 裝箱單", "Certificate of Origin 產地證"]
}

export function getLocalizedPointRules(locale: Locale) {
  if (locale === "en") return pointRules

  return ["完成訂單：+120 分", "五星評價：+80 分", "30 分鐘內回覆：+40 分", "推薦客戶成交：+300 分"]
}
