export type JourneyCamera = {
  /** Normalized focus center of the source image, 0..1 */
  from: { cx: number; cy: number; zoom: number }
  to: { cx: number; cy: number; zoom: number }
}

export type JourneyScene = {
  id: string
  src: string
  srcSmall: string
  camera: JourneyCamera
  /** Subtle color grade painted over the frame, as [topColor, bottomColor] rgba strings. */
  grade: [string, string]
}

/**
 * Five keyframes of one continuous shipment journey. Scene N crossfades into
 * scene N+1 over the last CROSSFADE fraction of its local timeline, and each
 * frame was generated from the previous one so cargo identity carries through.
 */
export const CROSSFADE = 0.24

export const journeyScenes: JourneyScene[] = [
  {
    id: "origin",
    src: "/journey/scene-1.webp",
    srcSmall: "/journey/scene-1-sm.webp",
    camera: { from: { cx: 0.3, cy: 0.6, zoom: 1.35 }, to: { cx: 0.58, cy: 0.52, zoom: 1.05 } },
    grade: ["rgba(255,196,120,0.10)", "rgba(16,37,77,0.12)"],
  },
  {
    id: "transport",
    src: "/journey/scene-2.webp",
    srcSmall: "/journey/scene-2-sm.webp",
    camera: { from: { cx: 0.26, cy: 0.52, zoom: 1.3 }, to: { cx: 0.66, cy: 0.42, zoom: 1.0 } },
    grade: ["rgba(69,183,209,0.08)", "rgba(8,21,47,0.16)"],
  },
  {
    id: "hongkong",
    src: "/journey/scene-3.webp",
    srcSmall: "/journey/scene-3-sm.webp",
    camera: { from: { cx: 0.45, cy: 0.6, zoom: 1.32 }, to: { cx: 0.58, cy: 0.48, zoom: 1.02 } },
    grade: ["rgba(8,21,47,0.14)", "rgba(69,183,209,0.10)"],
  },
  {
    id: "warehouse",
    src: "/journey/scene-4.webp",
    srcSmall: "/journey/scene-4-sm.webp",
    camera: { from: { cx: 0.35, cy: 0.58, zoom: 1.3 }, to: { cx: 0.62, cy: 0.5, zoom: 1.02 } },
    grade: ["rgba(255,255,255,0.05)", "rgba(16,37,77,0.10)"],
  },
  {
    id: "delivered",
    src: "/journey/scene-5.webp",
    srcSmall: "/journey/scene-5-sm.webp",
    camera: { from: { cx: 0.42, cy: 0.58, zoom: 1.26 }, to: { cx: 0.52, cy: 0.5, zoom: 1.0 } },
    grade: ["rgba(255,214,140,0.08)", "rgba(16,37,77,0.10)"],
  },
]

export const journeyPoster = "/journey/scene-1.webp"
export const journeyPosterDelivered = "/journey/scene-5.webp"

export type JourneyStage = {
  /** Progress position where this stage becomes active, 0..1 */
  at: number
  key: string
  label: { en: string; zh: string }
  mode: { en: string; zh: string }
  bid: { en: string; zh: string }
  docs: { en: string; zh: string }
  eta: string
}

export const journeyStages: JourneyStage[] = [
  {
    at: 0,
    key: "origin",
    label: { en: "Origin confirmed", zh: "起運點已確認" },
    mode: { en: "Multimodal", zh: "多式聯運" },
    bid: { en: "Bid window open", zh: "競價窗口開放" },
    docs: { en: "Packing list received", zh: "已收裝箱單" },
    eta: "T-72:00",
  },
  {
    at: 0.1,
    key: "matched",
    label: { en: "Transport matched", zh: "運力已配對" },
    mode: { en: "Multimodal", zh: "多式聯運" },
    bid: { en: "3 sealed bids in", zh: "3 份密封報價" },
    docs: { en: "Invoice verified", zh: "發票已核實" },
    eta: "T-64:30",
  },
  {
    at: 0.22,
    key: "awarded",
    label: { en: "Sealed bid awarded", zh: "密封競價已判定" },
    mode: { en: "Air / Sea", zh: "空運／海運" },
    bid: { en: "Awarded · sealed", zh: "已判定・密封" },
    docs: { en: "AWB issued", zh: "已簽發 AWB" },
    eta: "T-48:15",
  },
  {
    at: 0.4,
    key: "arrived",
    label: { en: "Arrived in Hong Kong", zh: "已抵達香港" },
    mode: { en: "Sea → Port", zh: "海運→碼頭" },
    bid: { en: "Awarded · sealed", zh: "已判定・密封" },
    docs: { en: "Manifest matched", zh: "艙單已匹配" },
    eta: "T-18:40",
  },
  {
    at: 0.52,
    key: "customs",
    label: { en: "Customs cleared", zh: "海關已放行" },
    mode: { en: "Port → Ground", zh: "碼頭→陸運" },
    bid: { en: "Awarded · sealed", zh: "已判定・密封" },
    docs: { en: "Clearance verified", zh: "清關已核實" },
    eta: "T-12:05",
  },
  {
    at: 0.66,
    key: "warehouse",
    label: { en: "Warehouse processed", zh: "倉庫已處理" },
    mode: { en: "Ground", zh: "陸運" },
    bid: { en: "Awarded · sealed", zh: "已判定・密封" },
    docs: { en: "Docs complete 4/4", zh: "文件齊備 4/4" },
    eta: "T-04:20",
  },
  {
    at: 0.82,
    key: "outfordelivery",
    label: { en: "Out for delivery", zh: "派送中" },
    mode: { en: "Final mile", zh: "最後一哩" },
    bid: { en: "Awarded · sealed", zh: "已判定・密封" },
    docs: { en: "POD pending", zh: "待簽收證明" },
    eta: "T-00:45",
  },
  {
    at: 0.97,
    key: "delivered",
    label: { en: "Delivered", zh: "已送達" },
    mode: { en: "Complete", zh: "已完成" },
    bid: { en: "Settled", zh: "已結算" },
    docs: { en: "POD confirmed", zh: "已確認簽收" },
    eta: "00:00",
  },
]

/** Top-line HUD waypoints: Origin → In Transit → Hong Kong → Warehouse → Delivered */
export const journeyWaypoints = [
  { at: 0, en: "Origin", zh: "起運" },
  { at: 0.16, en: "In Transit", zh: "運輸中" },
  { at: 0.42, en: "Hong Kong", zh: "香港" },
  { at: 0.66, en: "Warehouse", zh: "倉庫" },
  { at: 0.97, en: "Delivered", zh: "送達" },
]

export function stageIndexFor(progress: number): number {
  let index = 0
  for (let i = 0; i < journeyStages.length; i++) {
    if (progress >= journeyStages[i].at) index = i
  }
  return index
}

export const journeyShipmentId = "LB-2607-HKG"
