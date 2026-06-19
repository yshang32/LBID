"use client"

import Link from "next/link"
import { useState } from "react"
import { CheckCircle2, MessageSquareReply, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type RatingKey = "overall" | "communication" | "price" | "speed" | "documents" | "resolution"

const copy = {
  zh: {
    badge: "Completion review",
    title: "完成訂單後評價 Forwarder",
    intro: "Order completed 後，Agency 可提交 review。評分會影響 forwarder profile、badges、points 和 search ranking。",
    order: "Order reference",
    forwarder: "Forwarder",
    submit: "Submit review",
    submitting: "Submitting...",
    submitted: "Review submitted",
    back: "返回 order workspace",
    wouldRecommend: "會否推薦",
    comment: "Review comment",
    placeholder: "例如：回覆快、文件清晰、準時送達。",
    note: "Production 會寫入 reviews table。",
    labels: {
      overall: "Overall",
      communication: "Communication",
      price: "Price",
      speed: "Speed",
      documents: "Documents",
      resolution: "Problem resolution",
    },
    recommend: { yes: "Yes", maybe: "Maybe", no: "No" },
    points: "Forwarder earned +80 points for 5-star review preview.",
    average: "Average score",
    defaultComment: "回覆快、文件清晰、準時送達。",
  },
  en: {
    badge: "Completion review",
    title: "Review the forwarder after completion.",
    intro: "After order completion, the agency submits a review. Ratings influence the forwarder profile, badges, points and search ranking.",
    order: "Order reference",
    forwarder: "Forwarder",
    submit: "Submit review",
    submitting: "Submitting...",
    submitted: "Review submitted",
    back: "Back to order workspace",
    wouldRecommend: "Would recommend",
    comment: "Review comment",
    placeholder: "Example: Fast response, clear documents, on-time delivery.",
    note: "Production writes to the reviews table.",
    labels: {
      overall: "Overall",
      communication: "Communication",
      price: "Price",
      speed: "Speed",
      documents: "Documents",
      resolution: "Problem resolution",
    },
    recommend: { yes: "Yes", maybe: "Maybe", no: "No" },
    points: "Forwarder earned +80 points for 5-star review preview.",
    average: "Average score",
    defaultComment: "Fast response, clear documents, on-time delivery.",
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
  const [comment, setComment] = useState(t.defaultComment)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const average = Number((Object.values(ratings).reduce((sum, value) => sum + value, 0) / ratingKeys.length).toFixed(1))
  const pointPreview = average >= 4.8 ? 80 : average >= 4.2 ? 50 : 20

  function updateRating(key: RatingKey, value: number) {
    setRatings((items) => ({ ...items, [key]: value }))
  }

  async function submitReview() {
    setSubmitting(true)
    setError("")
    const { response, body } = await apiJson("/api/reviews", {
      method: "POST",
      body: JSON.stringify({
        orderId: params.id,
        rating: Math.round(average),
        comment: `${comment}\nRecommend: ${recommend}`,
      }),
    })

    setSubmitting(false)
    if (!response.ok) {
      setError(body.error || "Unable to submit review")
      return
    }

    setSubmitted(true)
  }

  return (
    <main className="mx-auto grid w-full max-w-7xl gap-6 px-4 pb-24 pt-6 sm:px-6 lg:grid-cols-[1fr_360px] lg:pb-10">
      <section className="space-y-5">
        <div className="rounded-lg border border-lblue/10 bg-white p-5 shadow-[0_18px_50px_rgba(27,43,94,0.07)]">
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-lblue sm:text-5xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Card>
          <CardHeader>
            <Star className="h-5 w-5 text-lgold" />
            <CardTitle>{t.labels.overall}</CardTitle>
            <CardDescription>{t.note}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {ratingKeys.map((key) => (
              <RatingControl key={key} label={t.labels[key]} value={ratings[key]} onChange={(value) => updateRating(key, value)} />
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
            {error ? <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 md:col-span-2">{error}</div> : null}
            <Button className="md:col-span-2" variant="gold" disabled={submitting} onClick={submitReview}>
              <MessageSquareReply className="h-4 w-4" />
              {submitting ? t.submitting : t.submit}
            </Button>
          </CardContent>
        </Card>
      </section>
      <aside className="space-y-5">
        <Card>
          <CardContent className="space-y-3 p-4">
            <div>
              <div className="text-sm text-muted-foreground">{t.order}</div>
              <div className="break-all font-mono text-xl font-black text-lgold">{params.id}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">{t.forwarder}</div>
              <div className="font-bold text-lblue">Forwarder ID from accepted order</div>
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
          <Card className="border-teal-200 bg-teal-50">
            <CardHeader>
              <CheckCircle2 className="h-5 w-5 text-teal-700" />
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
