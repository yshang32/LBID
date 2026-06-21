export type ShipmentRequestStatus = "DRAFT" | "PENDING_REVIEW" | "OPEN" | "CLOSED" | "AWARDED" | string

export type WorkflowStep = {
  key: string
  zh: string
  en: string
}

export const shipmentWorkflow: WorkflowStep[] = [
  { key: "submitted", zh: "已提交", en: "Submitted" },
  { key: "review", zh: "平台審核", en: "Platform review" },
  { key: "open", zh: "密封競價", en: "Sealed bidding" },
  { key: "compare", zh: "比較報價", en: "Compare quotes" },
  { key: "awarded", zh: "已配對", en: "Awarded" },
]

export function workflowProgress(status?: ShipmentRequestStatus) {
  switch (status) {
    case "DRAFT": return 0
    case "PENDING_REVIEW": return 1
    case "OPEN": return 2
    case "CLOSED": return 3
    case "AWARDED": return 4
    default: return 1
  }
}

export function statusLabel(status: ShipmentRequestStatus | undefined, locale: "zh" | "en") {
  const labels: Record<string, [string, string]> = {
    DRAFT: ["草稿", "Draft"],
    PENDING_REVIEW: ["等待審核", "Awaiting review"],
    OPEN: ["競價進行中", "Bidding open"],
    CLOSED: ["等待選擇", "Ready to compare"],
    AWARDED: ["已配對", "Awarded"],
  }
  return (labels[status || ""] || [status || "處理中", status || "In progress"])[locale === "zh" ? 0 : 1]
}
