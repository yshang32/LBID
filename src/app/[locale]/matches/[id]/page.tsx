import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileLock2,
  Handshake,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  Star,
  Truck,
} from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4Matches } from "@/lib/v4"

const copy = {
  zh: {
    back: "返回工作台",
    badge: "Match Record",
    title: "配對完成後，交易要留喺平台內推進。",
    intro: "Match Record 會保存中標報價、責任分工、文件、通訊和評分。聯絡資料只喺 award 後解鎖，避免平台價值流失。",
    parties: "交易雙方",
    route: "路線",
    status: "目前狀態",
    unlocked: "資料解鎖",
    actions: "下一步",
    sendMessage: "開啟訂單訊息",
    uploadDocs: "上傳文件",
    createQuotation: "生成 Quotation PDF",
    checklist: "文件清單",
    paperTrail: "平台責任記錄",
    commercial: "商業條款",
    community: "平台守則",
    stages: ["配對成立", "報價已扣", "資料解鎖", "交易中", "完成"],
    docs: [
      ["Quotation PDF", "已生成"],
      ["AWB / B/L", "待上傳"],
      ["Commercial Invoice", "待確認"],
      ["Packing List", "待確認"],
      ["Delivery proof", "未開始"],
    ],
    record: [
      "中標報價已鎖定，任何改價需要雙方確認。",
      "完整聯絡資料已解鎖，但交易溝通仍應留在 LBID 訊息欄。",
      "平台角色：workflow_platform_not_carrier_of_record。",
      "完成後 Client 會留下評分，影響 Forwarder Directory 排名。",
    ],
    terms: [
      ["Token cost", "1 paid bid token 已扣除"],
      ["Winning quote", "HKD 12,800"],
      ["Service scope", "Freight + import handling + local delivery"],
      ["Introduction period", "90 days"],
    ],
  },
  en: {
    back: "Back to Workspace",
    badge: "Match Record",
    title: "After matching, the trade should progress inside LBID.",
    intro: "Match Record stores the winning quote, responsibility split, documents, messages and review trail. Contact details unlock only after award to protect platform value.",
    parties: "Matched parties",
    route: "Route",
    status: "Current status",
    unlocked: "Contact unlocked",
    actions: "Next actions",
    sendMessage: "Open order messages",
    uploadDocs: "Upload documents",
    createQuotation: "Generate Quotation PDF",
    checklist: "Document checklist",
    paperTrail: "Platform record",
    commercial: "Commercial terms",
    community: "Community rules",
    stages: ["Matched", "Token used", "Contact unlocked", "In trade", "Completed"],
    docs: [
      ["Quotation PDF", "Generated"],
      ["AWB / B/L", "Pending upload"],
      ["Commercial Invoice", "Pending confirmation"],
      ["Packing List", "Pending confirmation"],
      ["Delivery proof", "Not started"],
    ],
    record: [
      "The winning quote is locked. Price changes require mutual confirmation.",
      "Full contacts are unlocked, but trade communication should remain in LBID messages.",
      "Platform role: workflow_platform_not_carrier_of_record.",
      "After completion, the client review affects the Forwarder Directory ranking.",
    ],
    terms: [
      ["Token cost", "1 paid bid token deducted"],
      ["Winning quote", "HKD 12,800"],
      ["Service scope", "Freight + import handling + local delivery"],
      ["Introduction period", "90 days"],
    ],
  },
}

export function generateStaticParams() {
  return [
    ...v4Matches.map((match) => ({ locale: "zh", id: match.id })),
    ...v4Matches.map((match) => ({ locale: "en", id: match.id })),
  ]
}

export default function MatchRecordPage({ params }: { params: { locale: string; id: string } }) {
  if (!isLocale(params.locale)) notFound()

  const locale = params.locale as Locale
  const t = copy[locale]
  const match = v4Matches.find((item) => item.id === params.id)
  if (!match) notFound()

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <Button asChild variant="ghost">
        <Link href={`/${locale}/dashboard`}>
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
      </Button>

      <section className="mt-4 rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="gold">{t.badge} {match.id}</Badge>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
            <p className="mt-3 text-muted-foreground">{t.intro}</p>
          </div>
          <div className="grid gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 sm:min-w-[260px]">
            <div className="flex items-center gap-2 font-black">
              <LockKeyhole className="h-4 w-4" />
              {t.unlocked}
            </div>
            <div className="text-sm">Client: Saigon Freight Agency</div>
            <div className="text-sm">Forwarder: HarbourLink Cargo</div>
          </div>
        </div>
        <ProgressSteps labels={t.stages} active={match.stage} />
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.parties}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Info icon={Handshake} label={t.parties} value={match.title} />
            <Info icon={Truck} label={t.route} value={match.route} />
            <Info icon={Clock3} label={t.status} value={match.status} />
          </CardContent>
        </Card>

        <Card className="border-lgold/30">
          <CardHeader>
            <CardTitle>{t.actions}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <Button asChild variant="gold">
              <Link href={`/${locale}/orders/${match.id}/messages`}>
                <MessageSquareText className="h-4 w-4" />
                {t.sendMessage}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/orders/${match.id}/documents`}>
                <FileCheck2 className="h-4 w-4" />
                {t.uploadDocs}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/quotations/new`}>
                <FileLock2 className="h-4 w-4" />
                {t.createQuotation}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t.checklist}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {t.docs.map(([name, status], index) => (
              <div key={name} className="flex items-center justify-between rounded-md border border-lblue/10 bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-8 w-8 place-items-center rounded-md ${index === 0 ? "bg-green-100 text-green-700" : "bg-white text-muted-foreground"}`}>
                    {index === 0 ? <CheckCircle2 className="h-4 w-4" /> : <FileCheck2 className="h-4 w-4" />}
                  </div>
                  <div className="font-black text-lblue">{name}</div>
                </div>
                <Badge variant={index === 0 ? "teal" : "secondary"}>{status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.commercial}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {t.terms.map(([label, value]) => (
              <div key={label} className="rounded-md border border-lblue/10 bg-white p-3">
                <div className="text-sm text-muted-foreground">{label}</div>
                <div className="mt-1 font-black text-lblue">{value}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="border-lgold/30 bg-lgold/10">
          <CardHeader>
            <ShieldCheck className="h-5 w-5 text-lgold" />
            <CardTitle>{t.community}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#6f5514]">
            <p>LBID prohibits moving quotes, contact exchange and deal confirmation outside the platform during an active Match Record.</p>
            <p>Repeated breaches can affect reputation score, directory ranking and account visibility.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Star className="h-5 w-5 text-lgold" />
            <CardTitle>{t.paperTrail}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {t.record.map((item) => (
              <div key={item} className="flex gap-3 rounded-md border border-lblue/10 bg-slate-50 p-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                <span>{item}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

function Info({ icon: Icon, label, value }: { icon: typeof Handshake; label: string; value: string }) {
  return (
    <div className="rounded-md border border-lblue/10 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 text-lgold" />
        {label}
      </div>
      <div className="mt-1 font-black text-lblue">{value}</div>
    </div>
  )
}

function ProgressSteps({ labels, active }: { labels: string[]; active: number }) {
  return (
    <div className="mt-6 grid grid-cols-5 gap-1">
      {labels.map((label, index) => {
        const done = index < active
        const current = index === active
        return (
          <div key={label} className="text-center">
            <div className={`mx-auto h-3 w-full rounded-full ${done ? "bg-green-600" : current ? "bg-lgold" : "bg-slate-200"}`} />
            <div className="mt-2 text-[11px] font-semibold text-muted-foreground">{label}</div>
          </div>
        )
      })}
    </div>
  )
}
