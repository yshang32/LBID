export type ShipmentRequestStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "CLOSED" | "AWARDED" | string

export const shipmentWorkflow = [
  { key: "submitted", zh: "已提交", en: "Submitted" },
  { key: "review", zh: "平台審核", en: "Platform review" },
  { key: "open", zh: "密封競價", en: "Sealed bidding" },
  { key: "compare", zh: "比較報價", en: "Compare quotes" },
  { key: "awarded", zh: "已選擇合作方", en: "Awarded" },
]

export function workflowProgress(status?: ShipmentRequestStatus) {
  return ({ DRAFT: 0, PENDING_REVIEW: 1, OPEN: 2, CLOSED: 3, AWARDED: 4 } as Record<string, number>)[status || ""] ?? 1
}

export function statusLabel(status: ShipmentRequestStatus | undefined, locale: "zh" | "en") {
  const labels: Record<string, [string, string]> = {
    DRAFT: ["草稿", "Draft"], PENDING_REVIEW: ["等待審核", "Awaiting review"], OPEN: ["競價進行中", "Bidding open"], CLOSED: ["可比較報價", "Ready to compare"], AWARDED: ["已選擇合作方", "Awarded"],
  }
  return (labels[status || ""] || [status || "處理中", status || "In progress"])[locale === "zh" ? 0 : 1]
}
