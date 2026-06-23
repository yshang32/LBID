import Link from "next/link"
import { FileCheck2, MessageSquare, Star, Truck } from "lucide-react"

import { LiveOrderPanel } from "@/components/orders/live-order-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = {
  zh: { badge: "訂單工作台", title: "由確認到交付，所有工作集中處理。", intro: "在這裡查看真實訂單狀態、管理文件、與合作方溝通及完成後留下評價。", documents: "管理文件", messages: "訂單訊息", tracking: "運輸追蹤", review: "完成後評價", role: "平台角色：workflow_platform_not_carrier_of_record" },
  en: { badge: "Order workspace", title: "Move every order from confirmation to delivery.", intro: "View live order status, manage documents, message your partner and leave a review after completion.", documents: "Manage documents", messages: "Order messages", tracking: "Shipment tracking", review: "Completion review", role: "Platform role: workflow_platform_not_carrier_of_record" },
}

export default function OrderWorkspacePage({ params }: { params: { locale: string; id: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10"><section className="border-b border-lblue/10 pb-7"><Badge variant="gold">{t.badge}</Badge><h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{t.intro}</p><div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="font-mono">{params.id}</span><span>{t.role}</span></div></section><LiveOrderPanel locale={locale} orderId={params.id} /><section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Action href={`/${locale}/orders/${params.id}/documents`} icon={<FileCheck2 className="h-5 w-5" />} label={t.documents} /><Action href={`/${locale}/orders/${params.id}/messages`} icon={<MessageSquare className="h-5 w-5" />} label={t.messages} /><Action href={`/${locale}/orders/${params.id}/tracking`} icon={<Truck className="h-5 w-5" />} label={t.tracking} /><Action href={`/${locale}/orders/${params.id}/review`} icon={<Star className="h-5 w-5" />} label={t.review} /></section></main>
}

function Action({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) { return <Card><CardContent className="p-4"><div className="text-lgold">{icon}</div><Button asChild className="mt-4 w-full" variant="outline"><Link href={href}>{label}</Link></Button></CardContent></Card> }
