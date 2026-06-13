"use client"

import Link from "next/link"
import { useState } from "react"
import { Boxes, Building2, CheckCircle2, PackageSearch } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Agency onboarding",
    title: "3 步完成 Agency 設定。",
    intro: "建立公司資料和常見 shipment profile，之後即可提交第一張香港物流詢價。",
    next: "下一步",
    back: "上一步",
    complete: "完成並建立第一張詢價",
    browse: "先瀏覽 Forwarder",
    steps: ["公司身份", "Shipment profile", "完成"],
    identity: "公司身份",
    shipment: "常見出貨資料",
    done: "歡迎使用 LBID",
    doneText: "你可以立即建立第一張詢價，或先瀏覽香港 Forwarder 目錄。",
    fields: {
      logo: "公司 Logo",
      description: "公司簡介",
      country: "營運國家",
      city: "主要港口 / 城市",
      cargo: "常見貨物",
      size: "常見 shipment size",
    },
    placeholders: {
      description: "例如：印度出口代理，主要處理電子零件和冷鏈樣本。",
      city: "Mumbai / BOM",
    },
    cargos: ["General Cargo", "Electronics", "Garments / Textiles", "Dangerous Goods", "Cold Chain", "Oversized / Heavy Cargo", "E-commerce / Parcels"],
    sizes: ["Small (< 100kg)", "Medium (100kg - 1,000kg)", "Large (1,000kg - 10,000kg)", "Very Large (10,000kg+)"],
  },
  en: {
    badge: "Agency onboarding",
    title: "Set up your agency in 3 steps.",
    intro: "Add company identity and typical shipment profile, then submit your first Hong Kong logistics inquiry.",
    next: "Next",
    back: "Back",
    complete: "Complete and create first inquiry",
    browse: "Browse forwarders first",
    steps: ["Company identity", "Shipment profile", "Done"],
    identity: "Company identity",
    shipment: "Typical shipment profile",
    done: "Welcome to LBID",
    doneText: "You can create your first inquiry now, or browse the Hong Kong forwarder directory first.",
    fields: {
      logo: "Company logo",
      description: "Company description",
      country: "Country of operation",
      city: "Main port / city",
      cargo: "Typical cargo",
      size: "Typical shipment size",
    },
    placeholders: {
      description: "Example: India export agency handling electronics and cold-chain samples.",
      city: "Mumbai / BOM",
    },
    cargos: ["General Cargo", "Electronics", "Garments / Textiles", "Dangerous Goods", "Cold Chain", "Oversized / Heavy Cargo", "E-commerce / Parcels"],
    sizes: ["Small (< 100kg)", "Medium (100kg - 1,000kg)", "Large (1,000kg - 10,000kg)", "Very Large (10,000kg+)"],
  },
}

export default function AgencyOnboardingPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [step, setStep] = useState(0)
  const [selectedCargo, setSelectedCargo] = useState<string[]>(["Electronics"])

  function toggleCargo(cargo: string) {
    setSelectedCargo((items) => items.includes(cargo) ? items.filter((item) => item !== cargo) : [...items, cargo])
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-4">
        <Badge variant="gold">{t.badge}</Badge>
        <h1 className="text-4xl font-black tracking-tight">{t.title}</h1>
        <p className="text-muted-foreground">{t.intro}</p>
        <Card className="border-white/10 bg-white/[0.045]">
          <CardContent className="space-y-3 p-4">
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
              <CardTitle>{t.identity}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="space-y-2 text-sm font-semibold">{t.fields.logo}<Input type="file" accept="image/png,image/jpeg" /></label>
              <label className="space-y-2 text-sm font-semibold">{t.fields.description}<Textarea maxLength={300} placeholder={t.placeholders.description} /></label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm font-semibold">{t.fields.country}<Select defaultValue="India"><option>India</option><option>Philippines</option><option>Indonesia</option><option>Malaysia</option><option>Thailand</option><option>Vietnam</option><option>Singapore</option><option>Hong Kong</option></Select></label>
                <label className="space-y-2 text-sm font-semibold">{t.fields.city}<Input placeholder={t.placeholders.city} /></label>
              </div>
            </CardContent>
          </Card>
        ) : null}
        {step === 1 ? (
          <Card className="border-white/10 bg-white/[0.055]">
            <CardHeader>
              <Boxes className="h-5 w-5 text-lgold" />
              <CardTitle>{t.shipment}</CardTitle>
              <CardDescription>{selectedCargo.length} selected</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-3 md:grid-cols-2">
                {t.cargos.map((cargo) => (
                  <label key={cargo} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                    <input type="checkbox" checked={selectedCargo.includes(cargo)} onChange={() => toggleCargo(cargo)} />
                    <span className="text-sm font-semibold">{cargo}</span>
                  </label>
                ))}
              </div>
              <label className="space-y-2 text-sm font-semibold">
                {t.fields.size}
                <Select defaultValue={t.sizes[1]}>
                  {t.sizes.map((size) => <option key={size}>{size}</option>)}
                </Select>
              </label>
            </CardContent>
          </Card>
        ) : null}
        {step === 2 ? (
          <Card className="border-lgold/30 bg-lgold/10">
            <CardHeader>
              <PackageSearch className="h-5 w-5 text-lgold" />
              <CardTitle>{t.done}</CardTitle>
              <CardDescription>{t.doneText}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild variant="gold">
                <Link href={`/${locale}/inquiries/new`}>{t.complete}</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/${locale}/forwarders`}>{t.browse}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <div className="flex justify-between">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep((value) => Math.max(0, value - 1))}>{t.back}</Button>
          <Button variant="gold" disabled={step === t.steps.length - 1} onClick={() => setStep((value) => Math.min(t.steps.length - 1, value + 1))}>{t.next}</Button>
        </div>
      </section>
    </main>
  )
}
