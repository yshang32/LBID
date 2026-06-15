"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Heart, MessageSquare, Plus, Repeat2, ShieldAlert, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { isLocale, type Locale } from "@/lib/i18n"
import { v4CommunityPosts } from "@/lib/v4"

const copy = {
  zh: {
    badge: "Community",
    title: "LBID 行業社群",
    intro: "展示公司能力、分享物流資訊、累積信譽。貼文不可包含電話、Email、WhatsApp 或外部導流。",
    newPost: "發貼文",
    placeholder: "分享公司近況、行業資訊或平台活動...",
    warningTitle: "貼文包含聯絡資料",
    warning: "請喺平台內聯絡其他用戶，Community 不可公開分享個人聯絡方式。",
    suggestion: "建議改為：對我哋服務有興趣，可以喺平台 Directory 搵到我哋。",
    edit: "修改貼文",
  },
  en: {
    badge: "Community",
    title: "LBID Community",
    intro: "Showcase capability, share logistics insights and build reputation. Posts cannot include phone numbers, email, WhatsApp or external contact routes.",
    newPost: "New post",
    placeholder: "Share company updates, market insights or LBID activity...",
    warningTitle: "Contact details detected",
    warning: "Please contact other users inside LBID. Public contact details are not allowed in Community posts.",
    suggestion: "Suggested wording: interested companies can find us through the LBID Directory.",
    edit: "Edit post",
  },
}

export default function CommunityPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [draft, setDraft] = useState("")
  const hasContact = useMemo(() => /\b\d{8,11}\b|[\w.+-]+@[\w.-]+\.\w+|whatsapp|wa\.me/i.test(draft), [draft])

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Badge variant="gold">{t.badge}</Badge>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-lblue sm:text-6xl">{t.title}</h1>
          <p className="mt-3 max-w-3xl text-muted-foreground">{t.intro}</p>
        </div>
        <Button variant="gold">
          <Plus className="h-4 w-4" />
          {t.newPost}
        </Button>
      </section>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t.newPost}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={t.placeholder} />
          {hasContact ? (
            <div className="rounded-md border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              <div className="flex items-center gap-2 font-black">
                <ShieldAlert className="h-4 w-4" />
                {t.warningTitle}
              </div>
              <p className="mt-1">{t.warning}</p>
              <p className="mt-1 font-semibold">{t.suggestion}</p>
              <Button className="mt-3" size="sm" variant="outline">{t.edit}</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 text-lgold" />
              No phone number, email, WhatsApp or external contact details.
            </div>
          )}
        </CardContent>
      </Card>

      <section className="mt-6 space-y-4">
        {v4CommunityPosts.map((post) => (
          <Card key={`${post.company}-${post.time}`}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-lblue text-sm font-black text-white">
                  {post.company.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="font-black text-lblue">{post.company}</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 fill-lgold text-lgold" />
                    {post.score} · {post.time} · {post.type}
                  </div>
                </div>
                <Badge variant="teal">Verified</Badge>
              </div>
              <p className="mt-4 leading-7 text-lblue">{post.content}</p>
              <div className="mt-4 flex gap-4 text-sm font-semibold text-muted-foreground">
                <span className="flex items-center gap-1"><Heart className="h-4 w-4" />{post.likes}</span>
                <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{post.comments}</span>
                <span className="flex items-center gap-1"><Repeat2 className="h-4 w-4" />{post.shares}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  )
}
