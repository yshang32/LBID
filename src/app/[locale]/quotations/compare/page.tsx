"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Award, CheckCircle2, ShieldCheck, Timer } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type Bid = { id: string; forwarder_id: string; price: number; currency: string; transit_time?: string | null; terms?: string | null }
const copy = {
  zh: { badge: "報價比較", title: "比較有效報價，選擇最適合的合作方。", intro: "系統會標示最低有效報價；你仍可按服務能力、時效和信譽選擇其他 Forwarder。", missing: "請從已關標需求進入報價比較。", loading: "正在載入密封報價", empty: "這個需求暫時沒有可供選擇的有效報價。", lowest: "最低報價", total: "總報價", transit: "運輸時間", accept: "接受報價", accepting: "處理中", accepted: "已接受", note: "競價期間，Forwarder 無法查看其他公司的價格或資料。", nonLowestTitle: "確認選擇非最低報價", nonLowestBody: "這份報價並非最低。請確認服務能力、時效或信譽更符合此貨件需要。", selected: "已選擇報價", difference: "高於最低報價", cancel: "返回比較", confirm: "確認接受", orderRef: "訂單編號", viewOrder: "前往訂單工作台", loadError: "未能載入報價資料。" },
  en: { badge: "Quotation comparison", title: "Compare valid quotes and choose the best fit.", intro: "LBID highlights the lowest valid quote; you can still select another forwarder for capability, transit time or reputation.", missing: "Open quotation comparison from a closed shipment request.", loading: "Loading sealed bids", empty: "There are no valid bids to compare for this request yet.", lowest: "Lowest quote", total: "Total", transit: "Transit", accept: "Accept quotation", accepting: "Accepting", accepted: "Accepted", note: "During an active bid window, forwarders cannot see competitor prices or bid details.", nonLowestTitle: "Confirm non-lowest selection", nonLowestBody: "This quote is not the lowest. Confirm it only when service capability, transit time or reputation is a better fit.", selected: "Selected quote", difference: "Above lowest", cancel: "Back to comparison", confirm: "Accept this quote", orderRef: "Order reference", viewOrder: "View order workspace", loadError: "Unable to load quotations." },
}

export default function QuotationComparePage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const t = copy[locale]
  const [srId, setSrId] = useState("")
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [pending, setPending] = useState<Bid | null>(null)
  const [accepted, setAccepted] = useState<Bid | null>(null)
  const [orderId, setOrderId] = useState("")
  const [accepting, setAccepting] = useState("")

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("srId") || new URLSearchParams(window.location.search).get("sr_id") || ""
    setSrId(id)
    if (!id) { setLoading(false); return }
    apiJson(`/api/bids?sr_id=${encodeURIComponent(id)}`).then(({ response, body }) => { setLoading(false); if (!response.ok) { setError(body.error || t.loadError); return }; setBids(Array.isArray(body.bids) ? body.bids : []) }).catch(() => { setLoading(false); setError(t.loadError) })
  }, [t.loadError])

  const lowest = useMemo(() => bids.length ? Math.min(...bids.map((bid) => Number(bid.price))) : 0, [bids])
  async function accept(bid: Bid, confirmed = false) {
    if (Number(bid.price) > lowest && !confirmed) { setPending(bid); return }
    setAccepting(bid.id); setError("")
    const { response, body } = await apiJson(`/api/bids/${bid.id}/accept`, { method: "POST", body: JSON.stringify({ totalAmount: Number(bid.price) }) })
    setAccepting(""); setPending(null)
    if (!response.ok) { setError(body.error || t.loadError); return }
    setAccepted(bid); setOrderId(body.order?.id || "")
  }

  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10"><section className="border-b border-lblue/10 pb-7"><Badge variant="gold">{t.badge}</Badge><h1 className="mt-4 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{t.title}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{t.intro}</p>{srId ? <p className="mt-4 font-mono text-xs text-slate-500">SR {srId}</p> : null}</section>
    {!srId ? <Empty message={t.missing} /> : loading ? <Empty message={t.loading} /> : error ? <Empty message={error} error /> : !bids.length ? <Empty message={t.empty} /> : <section className="mt-6 grid gap-4">{[...bids].sort((a, b) => Number(a.price) - Number(b.price)).map((bid) => { const isLowest = Number(bid.price) === lowest; const isAccepted = accepted?.id === bid.id; return <Card key={bid.id} className={isLowest ? "border-lgold/40 bg-[#fcf8ec]" : "bg-white"}><CardContent className="grid gap-4 p-5 md:grid-cols-[1.2fr_150px_150px_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-lblue">Forwarder {bid.forwarder_id.slice(0, 8)}</h2>{isLowest ? <Badge variant="gold">{t.lowest}</Badge> : null}<Badge variant="teal"><ShieldCheck className="mr-1 h-3 w-3" />Verified</Badge></div>{bid.terms ? <p className="mt-2 text-sm leading-6 text-slate-600">{bid.terms}</p> : null}</div><Metric icon={<Award className="h-4 w-4" />} label={t.total} value={`${bid.currency || "HKD"} ${Number(bid.price).toLocaleString()}`} /><Metric icon={<Timer className="h-4 w-4" />} label={t.transit} value={bid.transit_time || "-"} /><Button variant={isAccepted ? "secondary" : "gold"} disabled={Boolean(accepting)} onClick={() => accept(bid)}>{accepting === bid.id ? t.accepting : isAccepted ? t.accepted : t.accept}</Button></CardContent></Card> })}</section>}
    <Card className="mt-5"><CardContent className="p-4 text-sm text-slate-600">{t.note}</CardContent></Card>{accepted && orderId ? <Card className="mt-5 border-emerald-200 bg-emerald-50"><CardHeader><CheckCircle2 className="h-5 w-5 text-emerald-700" /><CardTitle>{t.accepted}</CardTitle><CardDescription>{t.orderRef}: <span className="font-mono">{orderId}</span></CardDescription></CardHeader><CardContent><Button asChild variant="gold"><Link href={`/${locale}/orders/${orderId}`}>{t.viewOrder}</Link></Button></CardContent></Card> : null}
    {pending ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-lblue/40 px-4 backdrop-blur-sm"><Card className="w-full max-w-lg"><CardHeader><CardTitle>{t.nonLowestTitle}</CardTitle><CardDescription>{t.nonLowestBody}</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-2"><Metric icon={<Award className="h-4 w-4" />} label={t.selected} value={`${pending.currency || "HKD"} ${Number(pending.price).toLocaleString()}`} /><Metric icon={<Timer className="h-4 w-4" />} label={t.difference} value={`${pending.currency || "HKD"} ${Number(pending.price - lowest).toLocaleString()}`} /></div><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setPending(null)}>{t.cancel}</Button><Button variant="gold" onClick={() => accept(pending, true)}>{t.confirm}</Button></div></CardContent></Card></div> : null}
  </main>
}
function Empty({ message, error }: { message: string; error?: boolean }) { return <Card className={`mt-6 ${error ? "border-red-200 bg-red-50" : ""}`}><CardContent className={`p-6 text-sm ${error ? "text-red-700" : "text-slate-600"}`}>{message}</CardContent></Card> }
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <div className="rounded-md border border-lblue/10 bg-slate-50 p-3"><div className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</div><p className="mt-1 font-semibold text-lblue">{value}</p></div> }
