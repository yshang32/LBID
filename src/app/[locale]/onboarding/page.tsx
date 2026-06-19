"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, BadgeCheck, BriefcaseBusiness, CheckCircle2, ClipboardList, Loader2, PackagePlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: {
    badge: "Unified onboarding",
    title: "設定公司能力：Client、Forwarder，或兩者。",
    intro: "LBID 不再把公司固定分成 Agency 或 Forwarder。一間公司可以發 SR，也可以接 SR。完成後 dashboard 會按已啟用能力顯示工作區。",
    capabilities: "公司能力",
    clientTitle: "Client 能力",
    clientText: "建立 Shipment Request，邀請 Forwarder 以 sealed bid 回應。",
    forwarderTitle: "Forwarder 能力",
    forwarderText: "瀏覽 marketplace、提交 bid、建立 profile 和接單。",
    company: "公司資料",
    companyName: "公司名稱",
    region: "地區",
    description: "公司簡介",
    services: "服務能力",
    routes: "主要航線 / 覆蓋範圍",
    serviceTypes: "服務類型",
    visibility: "Directory visibility",
    publicProfile: "公開公司 profile",
    privateProfile: "暫時不公開",
    complete: "完成 onboarding",
    saving: "儲存中...",
    saved: "Onboarding 已完成",
    dashboard: "進入工作台",
    createSr: "建立第一張 SR",
    marketplace: "查看 Marketplace",
    needOne: "請至少啟用一種能力。",
    error: "未能儲存 onboarding。",
  },
  en: {
    badge: "Unified onboarding",
    title: "Set company capabilities: Client, Forwarder, or both.",
    intro: "LBID no longer locks a company into Agency or Forwarder. One company can create SRs and also bid on SRs. The dashboard adapts to enabled capabilities.",
    capabilities: "Company capabilities",
    clientTitle: "Client capability",
    clientText: "Create Shipment Requests and invite forwarders to respond with sealed bids.",
    forwarderTitle: "Forwarder capability",
    forwarderText: "Browse marketplace, submit bids, build a profile and win orders.",
    company: "Company profile",
    companyName: "Company name",
    region: "Region",
    description: "Company description",
    services: "Service capability",
    routes: "Main routes / coverage",
    serviceTypes: "Service types",
    visibility: "Directory visibility",
    publicProfile: "Public company profile",
    privateProfile: "Keep private for now",
    complete: "Complete onboarding",
    saving: "Saving...",
    saved: "Onboarding complete",
    dashboard: "Enter workspace",
    createSr: "Create first SR",
    marketplace: "Open Marketplace",
    needOne: "Enable at least one capability.",
    error: "Unable to save onboarding.",
  },
}

export default function UnifiedOnboardingPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [canBeClient, setCanBeClient] = useState(true)
  const [canBeForwarder, setCanBeForwarder] = useState(true)
  const [companyName, setCompanyName] = useState("HarbourLink Cargo")
  const [region, setRegion] = useState("Hong Kong")
  const [description, setDescription] = useState("Hong Kong logistics company handling air, sea and local delivery workflows.")
  const [routes, setRoutes] = useState("Vietnam -> Hong Kong, Malaysia -> Hong Kong, India -> Hong Kong")
  const [services, setServices] = useState("Air Freight, Sea Freight, Customs Clearance, Local Delivery")
  const [isPublic, setIsPublic] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  async function completeOnboarding() {
    if (!canBeClient && !canBeForwarder) {
      setError(t.needOne)
      return
    }

    setSaving(true)
    setError("")
    const { response, body } = await apiJson("/api/company-profile", {
      method: "PATCH",
      body: JSON.stringify({
        companyNameEn: companyName,
        region,
        description,
        serviceRoutes: splitList(routes),
        serviceTypes: splitList(services),
        isPublic,
        canBeClient,
        canBeForwarder,
        onboardingCompleted: true,
        onboardingStep: 5,
      }),
    })

    setSaving(false)
    if (!response.ok) {
      setError(body.error || t.error)
      return
    }

    setSaved(true)
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">{t.intro}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <CapabilityCard icon={PackagePlus} active={canBeClient} title={t.clientTitle} text={t.clientText} onClick={() => setCanBeClient((value) => !value)} />
            <CapabilityCard icon={BriefcaseBusiness} active={canBeForwarder} title={t.forwarderTitle} text={t.forwarderText} onClick={() => setCanBeForwarder((value) => !value)} />
          </div>
        </div>

        <Card>
          <CardHeader>
            <ClipboardList className="h-5 w-5 text-lgold" />
            <CardTitle>{t.company}</CardTitle>
            <CardDescription>{t.capabilities}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">
                {t.companyName}
                <Input value={companyName} onChange={(event) => setCompanyName(event.target.value)} />
              </label>
              <label className="space-y-2 text-sm font-semibold">
                {t.region}
                <Input value={region} onChange={(event) => setRegion(event.target.value)} />
              </label>
            </div>
            <label className="space-y-2 text-sm font-semibold">
              {t.description}
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              {t.routes}
              <Input value={routes} onChange={(event) => setRoutes(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              {t.serviceTypes}
              <Input value={services} onChange={(event) => setServices(event.target.value)} />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              {t.visibility}
              <Select value={isPublic ? "public" : "private"} onChange={(event) => setIsPublic(event.target.value === "public")}>
                <option value="public">{t.publicProfile}</option>
                <option value="private">{t.privateProfile}</option>
              </Select>
            </label>
            {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div> : null}
            <Button variant="gold" disabled={saving} onClick={completeOnboarding}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              {saving ? t.saving : t.complete}
            </Button>
          </CardContent>
        </Card>
      </section>

      {saved ? (
        <Card className="mt-6 border-teal-200 bg-teal-50">
          <CardHeader>
            <BadgeCheck className="h-5 w-5 text-teal-700" />
            <CardTitle>{t.saved}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button asChild variant="gold">
              <Link href={`/${locale}/dashboard?role=${canBeForwarder ? "forwarder" : "agency"}`}>
                {t.dashboard} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {canBeClient ? <Button asChild variant="outline"><Link href={`/${locale}/inquiries/new`}>{t.createSr}</Link></Button> : null}
            {canBeForwarder ? <Button asChild variant="outline"><Link href={`/${locale}/marketplace`}>{t.marketplace}</Link></Button> : null}
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}

function CapabilityCard({ icon: Icon, active, title, text, onClick }: { icon: typeof PackagePlus; active: boolean; title: string; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-lg border p-4 text-left transition ${active ? "border-lgold/45 bg-lgold/10 shadow-[0_16px_38px_rgba(201,168,76,0.12)]" : "border-lblue/10 bg-white"}`}>
      <div className="flex items-center gap-3">
        <div className={`grid h-10 w-10 place-items-center rounded-md ${active ? "bg-lgold text-[#171104]" : "bg-slate-100 text-lblue"}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="font-black text-lblue">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{text}</div>
        </div>
      </div>
    </button>
  )
}

function splitList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}
