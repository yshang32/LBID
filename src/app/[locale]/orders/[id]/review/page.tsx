"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCircle2, MessageSquareReply, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"

type RatingKey = "overall" | "communication" | "price" | "speed" | "documents" | "resolution"

const copy = {
  zh: {
    badge: "Completion review",
    title: "完成後評價 Forwarder。",
    intro: "Agency 在訂單完成後提交評價。評分會影響 Forwarder profile、badge、points 和搜尋排序。",
    order: "Order reference",
    forwarder: "Forwarder",
    submit: "提交評價",
    submitted: "評價已提交",
    back: "返回訂單工作區",
    wouldRecommend: "會否推薦",
    comment: "評價內容",
    placeholder: "例如：回覆快，文件清楚，派送準時。",
    note: "Production 會寫入 reviews table，並為 Forwarder 自動加 points。",
    labels: {
      overall: "整體評分",
      communication: "溝通",
      price: "價格",
      speed: "速度",
      documents: "文件處理",
      resolution: "問題處理",
    },
    recommend: {
      yes: "會",
      maybe: "視乎情況",
      no: "不會",
    },
    points: "Forwarder earned +80 points for 5-star review preview.",
    average: "平均分",
  },
  en: {
    badge: "Completion review",
    title: "Review the forwarder after completion.",
    intro: "After order completion, the agency submits a review. Ratings influence the forwarder profile, badges, points and search ranking.",
    order: "Order reference",
    forwarder: "Forwarder",
    submit: "Submit review",
    submitted: "Review submitted",
    back: "Back to order workspace",
    wouldRecommend: "Would recommend",
    comment: "Review comment",
    placeholder: "Example: Fast response, clear documents, on-time delivery.",
    note: "Production writes to the reviews table and automatically awards forwarder points.",
    labels: {
      overall: "Overall",
      communication: "Communication",
      price: "Price",
      speed: "Speed",
      documents: "Documents",
      resolution: "Problem resolution",
    },
    recommend: {
      yes: "Yes",
      maybe: "Maybe",
      no: "No",
    },
    points: "Forwarder earned +80 points for 5-star review preview.",
    average: "Average score",
  },
}

const ratingKeys: RatingKey[] = ["overall", "communication", "price", "speed", "documents", "resolution"]

export default function OrderReviewPage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    overall: 5,
    communication: 5,
    price: 4,
    speed: 5,
    documents: 5,
    resolution: 4,
  })
  const [recommend, setRecommend] = useState("yes")
  const [comment, setComment] = useState(locale === "zh" ? "回覆快，文件清楚，派送準時。" : "Fast response, clear documents, on-time delivery.")
  const [submitted, setSubmitted] = useState(false)
  const average = Number((Object.values(ratings).reduce((sum, value) => sum + value, 0) / ratingKeys.length).toFixed(1))
  const pointPreview = average >= 4.8 ? 80 : average >= 4.2 ? 50 : 20

  function updateRating(key: RatingKey, value: number) {
    setRatings((items) => ({ ...items, [key]: value }))
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">{t.title}</h1>
          <p className="mt-4 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card>
          <CardHeader>
            <Star className="h-5 w-5 text-lgold" />
            <CardTitle>{t.labels.overall}</CardTitle>
            <CardDescription>{t.note}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {ratingKeys.map((key) => (
              <RatingControl
                key={key}
                label={t.labels[key]}
                value={ratings[key]}
                onChange={(value) => updateRating(key, value)}
              />
            ))}
            <label className="space-y-2 text-sm font-semibold">
              {t.wouldRecommend}
              <Select value={recommend} onChange={(event) => setRecommend(event.target.value)}>
                <option value="yes">{t.recommend.yes}</option>
                <option value="maybe">{t.recommend.maybe}</option>
                <option value="no">{t.recommend.no}</option>
              </Select>
            </label>
            <label className="space-y-2 text-sm font-semibold md:col-span-2">
              {t.comment}
              <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={t.placeholder} />
            </label>
            <Button className="md:col-span-2" variant="gold" onClick={() => setSubmitted(true)}>
              <MessageSquareReply className="h-4 w-4" />
              {t.submit}
            </Button>
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-5">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <div className="text-sm text-muted-foreground">{t.order}</div>
              <div className="font-mono text-xl font-black text-lgold">{params.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.forwarder}</div>
              <div className="font-bold">HarbourLink Cargo</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t.badge}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-1 text-lgold">
              {Array.from({ length: ratings.overall }).map((_, index) => <Star key={index} className="h-5 w-5 fill-current" />)}
            </div>
            <div className="rounded-md border border-lblue/10 bg-slate-50 p-3">
              <div className="text-sm text-muted-foreground">{t.average}</div>
              <div className="text-3xl font-black text-lblue">{average}</div>
              <div className="text-sm text-muted-foreground">+{pointPreview} points preview</div>
            </div>
            <p className="text-sm text-muted-foreground">{comment}</p>
            <Badge variant="teal">{t.recommend[recommend as keyof typeof t.recommend]}</Badge>
          </CardContent>
        </Card>
        {submitted ? (
          <Card className="border-teal-400/30 bg-teal-400/10">
            <CardHeader>
              <CheckCircle2 className="h-5 w-5 text-teal-300" />
              <CardTitle>{t.submitted}</CardTitle>
              <CardDescription>{average >= 4.8 ? t.points : `Forwarder earned +${pointPreview} points preview.`}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}
        <Button asChild className="w-full" variant="outline">
          <Link href={`/${locale}/orders/${params.id}`}>{t.back}</Link>
        </Button>
      </aside>
    </main>
  )
}

function RatingControl({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div className="rounded-lg border border-lblue/10 bg-slate-50 p-4">
      <div className="text-sm font-semibold">{label}</div>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} type="button" className="text-lgold" onClick={() => onChange(star)} aria-label={`${label} ${star}`}>
            <Star className={`h-5 w-5 ${star <= value ? "fill-current" : ""}`} />
          </button>
        ))}
      </div>
    </div>
  )
}
