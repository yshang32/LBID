export type ShipmentRequestStatus =
  | "DRAFT"
  | "VALIDATING"
  | "PENDING_REVIEW"
  | "NEEDS_CHANGES"
  | "OPEN"
  | "CLOSED"
  | "AWARDED"
  | "CANCELLED"
  | "COMPLETED"
  | string

export const shipmentWorkflow = [
  { key: "submitted", zh: "已提交", en: "Submitted" },
  { key: "review", zh: "平台驗證", en: "Platform validation" },
  { key: "open", zh: "密封競價", en: "Sealed bidding" },
  { key: "compare", zh: "比較報價", en: "Compare quotes" },
  { key: "awarded", zh: "已選定合作夥伴", en: "Awarded" },
]

export function workflowProgress(status?: ShipmentRequestStatus) {
  return ({
    DRAFT: 0,
    VALIDATING: 1,
    PENDING_REVIEW: 1,
    NEEDS_CHANGES: 1,
    OPEN: 2,
    CLOSED: 3,
    AWARDED: 4,
    COMPLETED: 4,
  } as Record<string, number>)[status || ""] ?? 1
}

export function statusLabel(status: ShipmentRequestStatus | undefined, locale: "zh" | "en") {
  const labels: Record<string, [string, string]> = {
    DRAFT: ["草稿", "Draft"],
    VALIDATING: ["驗證中", "Validating"],
    PENDING_REVIEW: ["等待平台驗證", "Awaiting validation"],
    NEEDS_CHANGES: ["需要修改", "Changes required"],
    OPEN: ["密封競價中", "Bidding open"],
    CLOSED: ["可比較報價", "Ready to compare"],
    AWARDED: ["已選定合作夥伴", "Awarded"],
    CANCELLED: ["已取消", "Cancelled"],
    COMPLETED: ["已完成", "Completed"],
  }
  return (labels[status || ""] || [status || "處理中", status || "In progress"])[locale === "zh" ? 0 : 1]
}
