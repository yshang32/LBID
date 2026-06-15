import { ArrowRight, BriefcaseBusiness, CheckCircle2, Code2, FileText, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4Services } from "@/lib/v4"

const copy = {
  zh: {
    badge: "Value-added Services",
    title: "平台幫你接單，也幫你升級公司能力。",
    intro: "v4 把 LBID 定位成物流生態系統：用戶在平台找到生意後，可以再申請網站、App、ERP、CRM 等增值服務。",
    cta: "申請報價",
    process: "流程",
    steps: ["提交需求", "LBID admin 跟進 scope", "確認報價", "開始交付"],
  },
  en: {
    badge: "Value-added Services",
    title: "LBID helps you win work and upgrade operations.",
    intro: "v4 positions LBID as a logistics ecosystem. After users find business, they can request websites, apps, ERP and CRM services.",
    cta: "Request quote",
    process: "Process",
    steps: ["Submit scope", "LBID admin reviews", "Confirm quote", "Start delivery"],
  },
}

const icons = [Code2, FileText, BriefcaseBusiness]

export default function ServicesPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section>
        <Badge variant="gold">{t.badge}</Badge>
        <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {v4Services.map((service, index) => {
          const Icon = icons[index]
          return (
            <Card key={service.name}>
              <CardHeader>
                <Icon className="h-6 w-6 text-lgold" />
                <CardTitle>{service.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-7 text-muted-foreground">{service.description}</p>
                <div className="mt-4 text-xl font-black text-lblue">{service.price}</div>
                <Button className="mt-5 w-full" variant="gold">
                  {t.cta} <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </section>

      <Card className="mt-6">
        <CardHeader>
          <Sparkles className="h-5 w-5 text-lgold" />
          <CardTitle>{t.process}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          {t.steps.map((step, index) => (
            <div key={step} className="rounded-md border border-lblue/10 bg-slate-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="mt-3 text-sm text-muted-foreground">Step {index + 1}</div>
              <div className="font-black text-lblue">{step}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  )
}
