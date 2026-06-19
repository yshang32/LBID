import { documentChecklist, forwarders, membershipTiers, pointRules, quotation } from "@/lib/data"
import type { Locale } from "@/lib/i18n"

const zhForwarderCopy: Record<string, { description: string; badges: string[]; coverage: string[]; responseTime: string }> = {
  "harbourlink-cargo": {
    description: "專注香港本地派送、清關及倉儲支援，適合需要穩定回覆和清晰文件流程的海外 agent。",
    badges: ["已驗證", "清關", "快速回覆"],
    coverage: ["香港", "九龍", "新界"],
    responseTime: "18 分鐘",
  },
  "kowloon-gateway-logistics": {
    description: "擅長香港 LCL / FCL 海運銜接、本地拖車和倉儲協調，適合需要 rate card 和長期合作的 agent。",
    badges: ["已驗證", "海運"],
    coverage: ["香港", "華南", "東南亞"],
    responseTime: "42 分鐘",
  },
  "aeroport-express-forwarding": {
    description: "空運和 AWB 文件處理能力強，適合 urgent shipment、POD 和高時效要求的訂單。",
    badges: ["AWB 文件", "空運專家"],
    coverage: ["香港機場", "亞洲", "歐洲"],
    responseTime: "25 分鐘",
  },
}

const zhTierCopy: Record<string, { name: string; price: string; perks: string[] }> = {
  Free: { name: "免費", price: "HKD0", perks: ["Directory 基本展示", "每月 3 次報價", "基本 profile"] },
  Standard: { name: "標準", price: "HKD500/月", perks: ["更多報價額度", "PDF 報價模板", "基本數據"] },
  Premium: { name: "進階", price: "HKD1500/月", perks: ["Profile boost", "更多曝光", "進階報表"] },
  Partner: { name: "合作夥伴", price: "自訂", perks: ["已驗證標記", "專屬配對支援", "市場推廣合作"] },
}

const zhQuotationLabels = [
  "港口 / 機場 terminal handling",
  "24 小時香港本地派送",
  "清關文件處理",
  "18 個月 rate record 保存",
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

  return ["完成訂單：+120 分", "5 星評價：+80 分", "30 分鐘內回覆：+40 分", "推薦客戶成功交易：+300 分"]
}
