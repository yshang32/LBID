"use client"

import Link from "next/link"
import { useState } from "react"
import { BadgeCheck, Building2, CheckCircle2, FileUp, Globe2, Plane, UploadCloud } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Forwarder onboarding",
    title: "5 步完成 Forwarder Profile。",
    intro: "完成公司資料、服務、路線、證書和 profile preview，Admin 審核後會顯示 LBID Verified。",
    next: "下一步",
    back: "上一步",
    complete: "完成並前往 Dashboard",
    progress: "完成度",
    steps: ["公司身份", "服務", "路線覆蓋", "證書文件", "預覽完成"],
    sections: {
      identity: "公司身份",
      services: "服務範圍",
      routes: "路線覆蓋",
      docs: "證書及文件",
      preview: "Public Profile Preview",
    },
    fields: {
      logo: "公司 Logo",
      description: "公司簡介",
      established: "成立年份",
      team: "團隊人數",
      website: "公司網站",
      countries: "服務來源國家",
      routes: "專精路線",
      iata: "主要 IATA station codes",
      br: "香港商業登記證",
      iataCert: "IATA Cargo Agent Certificate",
      other: "其他牌照",
    },
    placeholders: {
      description: "例如：專注印度及東南亞空運清關和香港本地派送。",
      countries: "India, Vietnam, Malaysia",
      routes: "India pharmaceutical cargo, Vietnam e-commerce",
      iata: "BOM, DEL, MNL",
      website: "https://company.com",
    },
    services: [
      "Air Freight",
      "Sea Freight FCL",
      "Sea Freight LCL",
      "Customs Clearance Import HK",
      "Customs Clearance Export",
      "Warehousing & Storage",
      "Local Delivery HK",
      "Door-to-Door",
      "Dangerous Goods Handling",
      "Cold Chain",
      "Oversized Cargo",
    ],
    docsNote: "Demo 版顯示 upload checklist；真實版本會上傳到 Supabase Storage /forwarder-docs/{user_id}/。",
    missing: "請至少選擇一項服務。",
    verified: "提交後等待 Admin 審核，通過後取得 LBID Verified badge。",
  },
  en: {
    badge: "Forwarder onboarding",
    title: "Complete your forwarder profile in 5 steps.",
    intro: "Add identity, services, routes, certifications and a public preview. Admin review unlocks the LBID Verified badge.",
    next: "Next",
    back: "Back",
    complete: "Complete and go to Dashboard",
    progress: "Progress",
    steps: ["Company Identity", "Services", "Route Coverage", "Certifications", "Preview"],
    sections: {
      identity: "Company identity",
      services: "Service coverage",
      routes: "Route coverage",
      docs: "Certifications and documents",
      preview: "Public Profile Preview",
    },
    fields: {
      logo: "Company logo",
      description: "Company description",
      established: "Year established",
      team: "Team size",
      website: "Company website",
      countries: "Origin countries served",
      routes: "Specialised routes",
      iata: "Key IATA station codes",
      br: "Hong Kong Business Registration",
      iataCert: "IATA Cargo Agent Certificate",
      other: "Other licences",
    },
    placeholders: {
      description: "Example: Air freight customs clearance and Hong Kong local delivery for India and Southeast Asia cargo.",
      countries: "India, Vietnam, Malaysia",
      routes: "India pharmaceutical cargo, Vietnam e-commerce",
      iata: "BOM, DEL, MNL",
      website: "https://company.com",
    },
    services: [
      "Air Freight",
      "Sea Freight FCL",
      "Sea Freight LCL",
      "Customs Clearance Import HK",
      "Customs Clearance Export",
      "Warehousing & Storage",
      "Local Delivery HK",
      "Door-to-Door",
      "Dangerous Goods Handling",
      "Cold Chain",
      "Oversized Cargo",
    ],
    docsNote: "The demo shows the upload checklist; production uploads to Supabase Storage /forwarder-docs/{user_id}/.",
    missing: "Select at least one service.",
    verified: "After submission, admin review can award the LBID Verified badge.",
  },
}

export default function ForwarderOnboardingPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [step, setStep] = useState(0)
  const [description, setDescription] = useState("")
  const [selectedServices, setSelectedServices] = useState<string[]>(["Air Freight", "Customs Clearance Import HK"])
  const progress = Math.round(((step + 1) / t.steps.length) * 100)

  function toggleService(service: string) {
    setSelectedServices((items) => items.includes(service) ? items.filter((item) => item !== service) : [...items, service])
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <Badge variant="gold">{t.badge}</Badge>
        <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between text-sm">
              <span>{t.progress}</span>
              <span className="font-mono text-lgold">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-lgold" style={{ width: `${progress}%` }} />
            </div>
            {t.steps.map((item, index) => (
              <button
                key={item}
                className={`flex w-full items-center gap-2 rounded-md border p-3 text-left text-sm ${index === step ? "border-lgold/50 bg-lgold/15 text-lgold" : "border-white/10 bg-white/[0.025] text-muted-foreground"}`}
                onClick={() => setStep(index)}
              >
                <CheckCircle2 className="h-4 w-4" />
                {item}
              </button>
            ))}
          </CardContent>
        </Card>
      </aside>
      <section className="space-y-5">
        {step === 0 ? (
          <Card className="border-white/10 bg-white/[0.055]">
            <CardHeader>
              <Building2 className="h-5 w-5 text-lgold" />
              <CardTitle>{t.sections.identity}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="space-y-2 text-sm font-semibold">{t.fields.logo}<Input type="file" accept="image/png,image/jpeg" /></label>
              <label className="space-y-2 text-sm font-semibold">{t.fields.description}<Textarea maxLength={500} value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t.placeholders.description} /></label>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="space-y-2 text-sm font-semibold">{t.fields.established}<Input defaultValue="2016" /></label>
                <label className="space-y-2 text-sm font-semibold">{t.fields.team}<Select defaultValue="6-20"><option>1-5</option><option>6-20</option><option>21-50</option><option>50+</option></Select></label>
                <label className="space-y-2 text-sm font-semibold">{t.fields.website}<Input placeholder={t.placeholders.website} /></label>
              </div>
            </CardContent>
          </Card>
        ) : null}
        {step === 1 ? (
          <Card className="border-white/10 bg-white/[0.055]">
            <CardHeader>
              <Plane className="h-5 w-5 text-lgold" />
              <CardTitle>{t.sections.services}</CardTitle>
              <CardDescription>{selectedServices.length === 0 ? t.missing : `${selectedServices.length} selected`}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              {t.services.map((service) => (
                <label key={service} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <input type="checkbox" checked={selectedServices.includes(service)} onChange={() => toggleService(service)} />
                  <span className="text-sm font-semibold">{service}</span>
                </label>
              ))}
            </CardContent>
          </Card>
        ) : null}
        {step === 2 ? (
          <Card className="border-white/10 bg-white/[0.055]">
            <CardHeader>
              <Globe2 className="h-5 w-5 text-lgold" />
              <CardTitle>{t.sections.routes}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="space-y-2 text-sm font-semibold">{t.fields.countries}<Input placeholder={t.placeholders.countries} /></label>
              <label className="space-y-2 text-sm font-semibold">{t.fields.routes}<Textarea placeholder={t.placeholders.routes} /></label>
              <label className="space-y-2 text-sm font-semibold">{t.fields.iata}<Input placeholder={t.placeholders.iata} /></label>
            </CardContent>
          </Card>
        ) : null}
        {step === 3 ? (
          <Card className="border-white/10 bg-white/[0.055]">
            <CardHeader>
              <FileUp className="h-5 w-5 text-lgold" />
              <CardTitle>{t.sections.docs}</CardTitle>
              <CardDescription>{t.docsNote}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {[t.fields.br, t.fields.iataCert, t.fields.other].map((item) => (
                <label key={item} className="space-y-2 text-sm font-semibold">
                  {item}
                  <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/20 bg-white/[0.035] p-4 text-muted-foreground">
                    <UploadCloud className="h-5 w-5 text-lgold" />
                    <Input type="file" accept="application/pdf,image/*" />
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>
        ) : null}
        {step === 4 ? (
          <Card className="border-lgold/30 bg-lgold/10">
            <CardHeader>
              <BadgeCheck className="h-5 w-5 text-lgold" />
              <CardTitle>{t.sections.preview}</CardTitle>
              <CardDescription>{t.verified}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                <Badge variant="gold">LBID Verified pending</Badge>
                <h2 className="mt-3 text-2xl font-black">Harbour Gateway Logistics</h2>
                <p className="mt-2 text-sm text-muted-foreground">{description || t.placeholders.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedServices.slice(0, 5).map((service) => <Badge key={service} variant="teal">{service}</Badge>)}
                </div>
              </div>
              <Button asChild variant="gold">
                <Link href={`/${locale}/dashboard?role=forwarder`}>{t.complete}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <div className="flex justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>{t.back}</Button>
          <Button variant="gold" disabled={step === t.steps.length - 1 || (step === 1 && selectedServices.length === 0)} onClick={() => setStep((value) => Math.min(t.steps.length - 1, value + 1))}>{t.next}</Button>
        </div>
      </section>
    </main>
  )
}
