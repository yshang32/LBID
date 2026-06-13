import Link from "next/link"
import { ArrowRight, Boxes, FileText, MessageSquare, ShieldCheck, Star } from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { dictionary, isLocale, type Locale } from "@/lib/i18n"
import { getLocalizedMembershipTiers } from "@/lib/localized-data"

const icons = [Boxes, FileText, MessageSquare, Star]

export function generateStaticParams() {
  return [{ locale: "zh" }, { locale: "en" }]
}

export default function LocalizedHomePage({ params }: { params: { locale: string } }) {
  if (!isLocale(params.locale)) notFound()

  const locale = params.locale as Locale
  const t = dictionary[locale]
  const prefix = `/${locale}`
  const tiers = getLocalizedMembershipTiers(locale)

  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <Badge variant="gold">{t.home.eyebrow}</Badge>
          <h1 className="mt-5 max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">{t.home.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">{t.home.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href={`${prefix}/inquiries/new`}>
                {t.home.primary} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href={`${prefix}/forwarders`}>{t.home.secondary}</Link>
            </Button>
          </div>
        </div>
        <Card className="border-white/10 bg-white/[0.055]">
          <CardHeader>
            <CardTitle>{t.home.pipelineTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {t.home.pipeline.map((step, index) => (
              <div key={step} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-md bg-lgold/15 text-sm font-black text-lgold">
                  {index + 1}
                </span>
                <span className="font-semibold">{step}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-12 sm:px-6 md:grid-cols-4">
        {t.home.modules.map((item, index) => {
          const Icon = icons[index]
          return (
            <Card key={item.title} className="border-white/10 bg-white/[0.045]">
              <CardHeader>
                <Icon className="h-5 w-5 text-lgold" />
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-6 text-muted-foreground">{item.text}</CardContent>
            </Card>
          )
        })}
      </section>
      <section className="mx-auto grid w-full max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-4">
        {tiers.map((tier) => (
          <Card key={tier.name} className="border-white/10 bg-white/[0.04]">
            <CardHeader>
              <Badge variant={tier.name === "Premium" ? "gold" : "secondary"}>{tier.price}</Badge>
              <CardTitle>{tier.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {tier.perks.map((perk) => (
                <div key={perk} className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-lgold" />
                  {perk}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
