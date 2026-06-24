"use client"

import Link from "next/link"
import { useState } from "react"
import { Building2, CheckCheck, CheckCircle2, ChevronLeft, FileText, Globe, MapPin, ShieldCheck, Zap } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

const REGIONS = ["Hong Kong", "Singapore", "Malaysia", "Vietnam", "Thailand", "Indonesia", "Philippines", "India", "Other"]
const SERVICES = ["Air Freight", "Sea Freight", "Road Freight", "Customs Clearance", "Warehousing", "Last-mile Delivery"]
const ROUTES = ["Southeast Asia → Hong Kong", "Vietnam → Hong Kong", "Malaysia → Hong Kong", "Thailand → Hong Kong", "Indonesia → Hong Kong", "India → Hong Kong", "Hong Kong local delivery"]
const CERTIFICATIONS = ["IATA Cargo Agent", "IATA Accredited Agent", "HKG Customs Registered", "ISO 9001 Certified", "FIATA Member", "HK Logistics Association"]

const copy = {
  zh: {
    title: "設定你的公司工作方式", intro: "只需幾個步驟。之後可隨時在公司檔案中更新。", steps: ["公司資料", "公司能力", "服務範圍", "文件與認證"],
    company: "公司資料", companyText: "這些資料會用於你的公司檔案及正式報價。", name: "公司名稱", region: "主要地區", description: "公司簡介", address: "公司地址", phone: "聯絡電話", website: "公司網站",
    capability: "選擇公司能力", capabilityText: "同一帳戶可同時發出需求及提交競價。", client: "Client 能力", clientText: "建立 Shipment Request，選擇合適的物流供應商。", forwarder: "Forwarder 能力", forwarderText: "接收合適需求，提交一次性密封報價。",
    coverage: "設定服務範圍", coverageText: "選擇最常用的服務及航線，LBID 才能推送合適機會。", service: "主要服務", route: "主要航線", routes: "已選航線",
    documents: "認證與公開設定", documentsText: "可先略過文件，稍後由公司檔案補上。", certification: "公司認證", visibility: "公司目錄公開設定", private: "暫時不公開", public: "公開公司檔案",
    back: "返回", next: "繼續", complete: "完成設定", saving: "儲存中…", required: "請先填寫公司名稱並選擇至少一項能力。", done: "公司設定完成", doneText: "你的公司現已可同時建立 Shipment Request 及提交密封競價。", workspace: "進入工作台", request: "建立第一個需求",
  },
  en: {
    title: "Set up how your company works", intro: "A few quick details now. You can refine every item later from Company Profile.", steps: ["Company", "Capabilities", "Coverage", "Documents"],
    company: "Company information", companyText: "These details appear in your company profile and official quotations.", name: "Company name", region: "Primary region", description: "Company description", address: "Company address", phone: "Contact phone", website: "Company website",
    capability: "Choose your capabilities", capabilityText: "The same company account can create demand and submit sealed bids.", client: "Client capability", clientText: "Create shipment requests and select the best logistics partner.", forwarder: "Forwarder capability", forwarderText: "Receive relevant requests and submit one sealed quote.",
    coverage: "Set your service coverage", coverageText: "Select your common services and routes so LBID can surface relevant opportunities.", service: "Primary service", route: "Primary route", routes: "Selected routes",
    documents: "Credentials and visibility", documentsText: "Credentials can be added later from Company Profile.", certification: "Company credentials", visibility: "Directory visibility", private: "Keep private for now", public: "Publish company profile",
    back: "Back", next: "Continue", complete: "Complete setup", saving: "Saving…", required: "Enter your company name and select at least one capability.", done: "Your company is ready", doneText: "Your account can create shipment requests and submit sealed bids from the same workspace.", workspace: "Enter workspace", request: "Create first request",
  },
} as const

const stepIcons = [Building2, Zap, MapPin, FileText]

export default function OnboardingPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [step, setStep] = useState(0)
  const [company, setCompany] = useState({ name: "", region: "Hong Kong", description: "", address: "", phone: "", website: "" })
  const [capabilities, setCapabilities] = useState({ client: true, forwarder: true })
  const [service, setService] = useState(SERVICES[0])
  const [routes, setRoutes] = useState<string[]>([ROUTES[0]])
  const [certifications, setCertifications] = useState<string[]>([])
  const [visibility, setVisibility] = useState("private")
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState("")

  const valid = () => step !== 0 || Boolean(company.name.trim())
  const next = () => { if (!valid() || (step === 1 && !capabilities.client && !capabilities.forwarder)) { setError(t.required); return }; setError(""); setStep((value) => Math.min(3, value + 1)) }
  const toggle = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => setter((items) => items.includes(value) ? items.filter((item) => item !== value) : [...items, value])

  async function finish() {
    if (!company.name.trim() || (!capabilities.client && !capabilities.forwarder)) { setError(t.required); setStep(0); return }
    setSaving(true); setError("")
    const { response, body } = await apiJson("/api/company-profile", { method: "PATCH", body: JSON.stringify({
      companyNameEn: company.name.trim(), region: company.region, description: company.description.trim(),
      serviceRoutes: routes, serviceTypes: [service], isPublic: visibility === "public", canBeClient: capabilities.client,
      canBeForwarder: capabilities.forwarder, onboardingCompleted: true, onboardingStep: 4,
    }) })
    setSaving(false)
    if (!response.ok) { setError(body.error || "Unable to save company setup."); return }
    setCompleted(true)
  }

  if (completed) return <main className="grid min-h-screen place-items-center bg-[linear-gradient(150deg,#f0f2f8_0%,#eceef5_100%)] px-6 text-[#172038]"><motion.section initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .35, ease: [0.16, 1, .3, 1] }} className="max-w-sm text-center"><span className="mx-auto grid h-16 w-16 place-items-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-8 w-8" /></span><h1 className="mt-5 text-[22px] font-bold tracking-[-.5px]">{t.done}</h1><p className="mt-2 text-[14px] leading-relaxed text-[#7e8ba1]">{t.doneText}</p><div className="mt-7 flex flex-col gap-2"><Link href={`/${locale}/inquiries/new`} className="rounded-xl bg-[#0c1a3e] py-3 text-[13.5px] font-semibold text-white transition hover:-translate-y-px hover:bg-[#172d63]">{t.request}</Link><Link href={`/${locale}/dashboard`} className="rounded-xl border border-[#dfe4ed] bg-white py-3 text-[13.5px] font-medium text-[#4c5870] transition hover:bg-[#f6f8fc]">{t.workspace}</Link></div></motion.section></main>

  const heading = [t.company, t.capability, t.coverage, t.documents][step]
  const description = [t.companyText, t.capabilityText, t.coverageText, t.documentsText][step]
  return <main className="min-h-screen bg-[linear-gradient(150deg,#f0f2f8_0%,#eceef5_100%)] px-5 py-10 text-[#172038] sm:px-6"><section className="mx-auto w-full max-w-[580px]"><div className="mb-8 text-center"><h1 className="text-[22px] font-bold tracking-[-.4px]">{t.title}</h1><p className="mt-1 text-[14px] text-[#8c98ac]">{t.intro}</p></div><StepIndicator labels={t.steps} step={step} /><section className="mt-8 rounded-[20px] border border-[#dfe4ed] bg-white p-6 shadow-[0_4px_24px_rgba(0,0,0,.06),0_1px_4px_rgba(0,0,0,.04)] sm:p-8"><AnimatePresence mode="wait"><motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: .22, ease: [0.16, 1, .3, 1] }}><h2 className="text-[16px] font-semibold">{heading}</h2><p className="mt-1 text-[13px] text-[#8c98ac]">{description}</p>{step === 0 ? <CompanyFields company={company} setCompany={setCompany} t={t} /> : null}{step === 1 ? <CapabilityFields capabilities={capabilities} setCapabilities={setCapabilities} t={t} /> : null}{step === 2 ? <CoverageFields service={service} setService={setService} routes={routes} toggleRoute={(item) => toggle(item, setRoutes)} t={t} /> : null}{step === 3 ? <DocumentFields certifications={certifications} toggleCertification={(item) => toggle(item, setCertifications)} visibility={visibility} setVisibility={setVisibility} t={t} /> : null}</motion.div></AnimatePresence>{error ? <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] font-medium text-red-700">{error}</p> : null}<div className="mt-8 flex items-center justify-between gap-3">{step > 0 ? <button type="button" onClick={() => { setError(""); setStep((value) => value - 1) }} className="inline-flex items-center gap-2 text-[12.5px] font-medium text-[#68758c] transition hover:text-[#172038]"><ChevronLeft className="h-4 w-4" />{t.back}</button> : <span />}{step < 3 ? <button type="button" onClick={next} className="rounded-xl bg-[#0c1a3e] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:-translate-y-px hover:bg-[#172d63]">{t.next}</button> : <button disabled={saving} type="button" onClick={finish} className="inline-flex items-center gap-2 rounded-xl bg-[#0c1a3e] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:-translate-y-px hover:bg-[#172d63] disabled:opacity-60"><CheckCheck className="h-4 w-4" />{saving ? t.saving : t.complete}</button>}</div></section></section></main>
}

function StepIndicator({ labels, step }: { labels: readonly string[]; step: number }) { return <div className="flex items-start">{labels.map((label, index) => { const Icon = stepIcons[index]; return <div key={label} className="flex flex-1 items-start last:flex-none"><div className="flex flex-col items-center gap-1.5"><span className={`grid h-8 w-8 place-items-center rounded-full text-[12px] font-bold transition ${index < step ? "bg-emerald-600 text-white" : index === step ? "bg-[#0c1a3e] text-white" : "border-2 border-[#dfe4ed] bg-white text-[#8c98ac]"}`}>{index < step ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}</span><span className={`whitespace-nowrap text-[10.5px] font-medium ${index === step ? "text-[#0c1a3e]" : index < step ? "text-emerald-700" : "text-[#8c98ac]"}`}>{label}</span></div>{index < labels.length - 1 ? <span className={`mx-2 mt-[15px] h-[2px] flex-1 rounded-full ${index < step ? "bg-emerald-600" : "bg-[#dfe4ed]"}`} /> : null}</div> })}</div> }
function Label({ children }: { children: React.ReactNode }) { return <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold text-[#4c5870]">{children}</label> }
function Input({ value, onChange, placeholder = "" }: { value: string; onChange: (value: string) => void; placeholder?: string }) { return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="auth-input" /> }
function Select({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) { return <select value={value} onChange={(event) => onChange(event.target.value)} className="auth-input appearance-auto">{children}</select> }
function CompanyFields({ company, setCompany, t }: { company: { name: string; region: string; description: string; address: string; phone: string; website: string }; setCompany: React.Dispatch<React.SetStateAction<{ name: string; region: string; description: string; address: string; phone: string; website: string }>>; t: typeof copy.en }) { const change = (key: keyof typeof company) => (value: string) => setCompany((current) => ({ ...current, [key]: value })); return <div className="mt-6 grid gap-4 sm:grid-cols-2"><Label>{t.name}<Input value={company.name} onChange={change("name")} placeholder="Pacific Forward Ltd." /></Label><Label>{t.region}<Select value={company.region} onChange={change("region")}>{REGIONS.map((item) => <option key={item}>{item}</option>)}</Select></Label><Label>{t.address}<Input value={company.address} onChange={change("address")} placeholder="Optional" /></Label><Label>{t.phone}<Input value={company.phone} onChange={change("phone")} placeholder="Optional" /></Label><Label>{t.website}<Input value={company.website} onChange={change("website")} placeholder="Optional" /></Label><Label>{t.description}<textarea value={company.description} onChange={(event) => change("description")(event.target.value)} placeholder="Optional" className="auth-input min-h-[84px] resize-y" /></Label></div> }
function CapabilityFields({ capabilities, setCapabilities, t }: { capabilities: { client: boolean; forwarder: boolean }; setCapabilities: React.Dispatch<React.SetStateAction<{ client: boolean; forwarder: boolean }>>; t: typeof copy.en }) { return <div className="mt-6 grid gap-3"><CapabilityCard icon={Building2} title={t.client} text={t.clientText} checked={capabilities.client} onChange={() => setCapabilities((value) => ({ ...value, client: !value.client }))} /><CapabilityCard icon={Zap} title={t.forwarder} text={t.forwarderText} checked={capabilities.forwarder} onChange={() => setCapabilities((value) => ({ ...value, forwarder: !value.forwarder }))} /></div> }
function CapabilityCard({ icon: Icon, title, text, checked, onChange }: { icon: typeof Building2; title: string; text: string; checked: boolean; onChange: () => void }) { return <button type="button" onClick={onChange} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${checked ? "border-[#d8bd67] bg-[#fffaf0] shadow-[0_5px_18px_rgba(196,154,60,.10)]" : "border-[#dfe4ed] bg-white hover:border-[#b9c5d8]"}`}><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${checked ? "bg-[#c49a3c] text-white" : "bg-[#f0f2f8] text-[#59667d]"}`}><Icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-[#172038]">{title}</span><span className="mt-1 block text-[12px] leading-5 text-[#7e8ba1]">{text}</span></span><span className={`mt-0.5 grid h-5 w-5 place-items-center rounded-full border ${checked ? "border-[#c49a3c] bg-[#c49a3c] text-white" : "border-[#cbd3e0]"}`}>{checked ? <CheckCheck className="h-3 w-3" /> : null}</span></button> }
function CoverageFields({ service, setService, routes, toggleRoute, t }: { service: string; setService: (value: string) => void; routes: string[]; toggleRoute: (item: string) => void; t: typeof copy.en }) { return <div className="mt-6 space-y-5"><Label>{t.service}<Select value={service} onChange={setService}>{SERVICES.map((item) => <option key={item}>{item}</option>)}</Select></Label><div><p className="text-[12.5px] font-semibold text-[#4c5870]">{t.routes}</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{ROUTES.map((item) => <button key={item} type="button" onClick={() => toggleRoute(item)} className={`rounded-lg border px-3 py-2.5 text-left text-[12px] font-medium transition ${routes.includes(item) ? "border-[#d8bd67] bg-[#fffaf0] text-[#725b1d]" : "border-[#dfe4ed] bg-white text-[#59667d] hover:border-[#b9c5d8]"}`}>{routes.includes(item) ? "✓ " : ""}{item}</button>)}</div></div></div> }
function DocumentFields({ certifications, toggleCertification, visibility, setVisibility, t }: { certifications: string[]; toggleCertification: (item: string) => void; visibility: string; setVisibility: (value: string) => void; t: typeof copy.en }) { return <div className="mt-6 space-y-5"><div><p className="text-[12.5px] font-semibold text-[#4c5870]">{t.certification}</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{CERTIFICATIONS.map((item) => <button key={item} type="button" onClick={() => toggleCertification(item)} className={`rounded-lg border px-3 py-2.5 text-left text-[12px] font-medium transition ${certifications.includes(item) ? "border-[#b7ddcf] bg-emerald-50 text-emerald-800" : "border-[#dfe4ed] bg-white text-[#59667d] hover:border-[#b9c5d8]"}`}>{certifications.includes(item) ? "✓ " : ""}{item}</button>)}</div></div><Label>{t.visibility}<Select value={visibility} onChange={setVisibility}><option value="private">{t.private}</option><option value="public">{t.public}</option></Select></Label><div className="flex gap-3 rounded-xl border border-[#ead59b] bg-[#fffaf0] p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#e5c66e] text-[#463407]"><ShieldCheck className="h-5 w-5" /></span><p className="text-[12px] leading-5 text-[#725b1d]">You can add credentials and verification documents later. LBID will only publish the company profile when you choose public visibility.</p></div></div> }
