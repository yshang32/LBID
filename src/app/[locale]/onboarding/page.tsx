"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

const regions = ["Hong Kong", "Singapore", "Malaysia", "Vietnam", "Thailand", "Indonesia", "Philippines", "India", "Other"]
const services = ["Air Freight", "Sea Freight", "Road Freight", "Customs Clearance", "Warehousing", "Last-mile Delivery"]
const routes = ["Southeast Asia → Hong Kong", "Vietnam → Hong Kong", "Malaysia → Hong Kong", "Thailand → Hong Kong", "Indonesia → Hong Kong", "India → Hong Kong", "Hong Kong local delivery"]

export default function OnboardingPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const [step, setStep] = useState(0)
  const [companyName, setCompanyName] = useState("")
  const [description, setDescription] = useState("")
  const [region, setRegion] = useState("Hong Kong")
  const [service, setService] = useState("Air Freight")
  const [route, setRoute] = useState("Southeast Asia → Hong Kong")
  const [visibility, setVisibility] = useState("private")
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState("")
  const t = locale === "zh"
    ? { badge: "公司設定", title: ["先認識你的公司", "告訴我們你的服務", "選擇公開程度"], intro: ["只需兩項基本資料，之後可隨時在公司檔案修改。", "選擇最接近的主要服務和覆蓋範圍，讓系統把合適需求放到你面前。", "你可先保持私人；準備好後再公開公司名錄。"], steps: ["公司資料", "服務範圍", "完成設定"], company: "公司名稱", companyHint: "例如：HarbourLink Cargo", description: "公司簡介", descriptionHint: "用一句話說明你最擅長的物流服務。", region: "公司主要地區", service: "主要服務", route: "主要覆蓋航線", visibility: "公司名錄公開設定", private: "暫時不公開", public: "公開公司檔案", back: "上一步", next: "下一步", finish: "完成公司設定", saving: "正在儲存", required: "請先填寫公司名稱。", ready: "公司設定完成", readyBody: "你的公司已啟用發出需求及承接需求兩項能力。現在可以開始使用 LBID。", workspace: "進入工作台", both: "雙能力公司帳戶", bothText: "你的帳戶預設可建立 Shipment Request，也可在市場提交密封報價。" }
    : { badge: "Company setup", title: ["Tell us about your company", "Tell us how you help", "Choose your visibility"], intro: ["Just two basic details. You can refine your company profile later.", "Select the closest service and coverage so LBID can surface relevant opportunities.", "You can keep your profile private for now and publish it when ready."], steps: ["Company", "Service coverage", "Finish"], company: "Company name", companyHint: "For example: HarbourLink Cargo", description: "Company description", descriptionHint: "In one sentence, describe the logistics work you do best.", region: "Primary region", service: "Primary service", route: "Primary coverage route", visibility: "Directory visibility", private: "Keep private for now", public: "Publish company profile", back: "Back", next: "Continue", finish: "Complete company setup", saving: "Saving", required: "Please enter your company name.", ready: "Your company is ready", readyBody: "Your account can create shipment requests and submit sealed bids. You are ready to start using LBID.", workspace: "Enter workspace", both: "Dual-capability company account", bothText: "Your company can create shipment requests and submit sealed bids from the same account." }

  function next() {
    if (step === 0 && !companyName.trim()) { setError(t.required); return }
    setError("")
    setStep((current) => Math.min(2, current + 1))
  }

  async function finish() {
    setSaving(true); setError("")
    const { response, body } = await apiJson("/api/company-profile", { method: "PATCH", body: JSON.stringify({
      companyNameEn: companyName.trim(),
      region,
      description: description.trim(),
      serviceRoutes: [route],
      serviceTypes: [service],
      isPublic: visibility === "public",
      canBeClient: true,
      canBeForwarder: true,
      onboardingCompleted: true,
      onboardingStep: 3,
    }) })
    setSaving(false)
    if (!response.ok) { setError(body.error || "Unable to save company setup."); return }
    setCompleted(true)
  }

  if (completed) return <main className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-3xl place-items-center px-4 py-10 sm:px-6"><section className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#eaf7f2] text-emerald-700"><CheckCircle2 className="h-8 w-8" /></div><Badge className="mt-6" variant="teal">LBID READY</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.ready}</h1><p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">{t.readyBody}</p><Button asChild className="mt-8"><Link href={`/${locale}/dashboard`}>{t.workspace}<ArrowRight className="h-4 w-4" /></Link></Button></section></main>

  return <main className="mx-auto w-full max-w-4xl px-4 pb-24 pt-10 sm:px-6 lg:pb-10"><section className="mx-auto max-w-2xl"><Badge variant="gold">{t.badge}</Badge><div className="mt-5 grid grid-cols-3 gap-2">{t.steps.map((label, index) => <div key={label} className={`border-b-2 pb-3 text-sm font-semibold ${index === step ? "border-[#c9a84c] text-lblue" : index < step ? "border-emerald-500 text-emerald-700" : "border-slate-200 text-slate-400"}`}><span className="mr-2 font-mono text-xs">0{index + 1}</span>{label}</div>)}</div><h1 className="mt-8 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title[step]}</h1><p className="mt-3 leading-7 text-slate-600">{t.intro[step]}</p></section><Card className="mx-auto mt-8 max-w-2xl"><CardContent className="p-6 sm:p-8">{step === 0 ? <div className="space-y-5"><Field label={t.company}><Input autoFocus value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder={t.companyHint} /></Field><Field label={t.description}><Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder={t.descriptionHint} /></Field><Field label={t.region}><Select value={region} onChange={(event) => setRegion(event.target.value)}>{regions.map((item) => <option key={item}>{item}</option>)}</Select></Field></div> : null}{step === 1 ? <div className="space-y-5"><Field label={t.service}><Select value={service} onChange={(event) => setService(event.target.value)}>{services.map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label={t.route}><Select value={route} onChange={(event) => setRoute(event.target.value)}>{routes.map((item) => <option key={item}>{item}</option>)}</Select></Field><div className="rounded-md border border-lblue/10 bg-slate-50 p-4 text-sm leading-6 text-slate-600">You can add more services and routes later from your company profile.</div></div> : null}{step === 2 ? <div className="space-y-5"><Field label={t.visibility}><Select value={visibility} onChange={(event) => setVisibility(event.target.value)}><option value="private">{t.private}</option><option value="public">{t.public}</option></Select></Field><div className="rounded-md border border-[#ead59b] bg-[#fcf8ec] p-5"><div className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[#e5c66e] text-[#463407]"><ShieldCheck className="h-5 w-5" /></span><div><h2 className="font-semibold text-lblue">{t.both}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{t.bothText}</p></div></div></div></div> : null}{error ? <p className="mt-5 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}<div className="mt-8 flex items-center justify-between gap-3">{step > 0 ? <Button variant="ghost" onClick={() => { setError(""); setStep((current) => current - 1) }}><ArrowLeft className="h-4 w-4" />{t.back}</Button> : <span />}{step < 2 ? <Button onClick={next}>{t.next}<ArrowRight className="h-4 w-4" /></Button> : <Button variant="gold" disabled={saving} onClick={finish}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{saving ? t.saving : t.finish}</Button>}</div></CardContent></Card></main>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-2 text-sm font-semibold text-slate-700"><span>{label}</span>{children}</label> }
