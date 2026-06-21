"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type MatchRecord = { id: string; shipment_request_id: string; matched_at?: string; stage?: string; rate_card_snapshot?: { order_id?: string } }

export function OrderListPanel({ locale }: { locale: "zh" | "en" }) {
  const [state, setState] = useState({ loading: true, signedIn: false, records: [] as MatchRecord[], error: "" })
  const copy = locale === "zh" ? { title: "訂單", intro: "已確認的配對會在這裡變成可追蹤的物流訂單。", load: "載入訂單中", signIn: "請先登入以查看訂單。", empty: "尚未有已確認的訂單。", open: "開啟訂單" } : { title: "Orders", intro: "Confirmed matches become trackable logistics orders here.", load: "Loading orders", signIn: "Sign in to view orders.", empty: "No confirmed orders yet.", open: "Open order" }
  useEffect(() => { let cancelled = false; async function load() { const client = getSupabaseBrowserClient(); const { data } = client ? await client.auth.getSession() : { data: { session: null } }; if (!data.session) { if (!cancelled) setState({ loading: false, signedIn: false, records: [], error: "" }); return }; const { response, body } = await apiJson("/api/match-records"); if (cancelled) return; if (!response.ok) { setState({ loading: false, signedIn: true, records: [], error: body.error || "ORDERS_UNAVAILABLE" }); return }; setState({ loading: false, signedIn: true, records: body.matchRecords || [], error: "" }) }; load(); return () => { cancelled = true } }, [])
  return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="border-b border-lblue/10 pb-7"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a17e22]">LBID workflow</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{copy.title}</h1><p className="mt-2 text-slate-600">{copy.intro}</p></section><section className="mt-6 space-y-3">{state.loading ? <div className="flex items-center gap-2 py-10 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{copy.load}</div> : !state.signedIn || state.error ? <Empty label={state.error || copy.signIn} /> : !state.records.length ? <Empty label={copy.empty} /> : state.records.map((record) => { const orderId = record.rate_card_snapshot?.order_id; return <Card key={record.id}><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"><div className="min-w-0 flex-1"><Badge variant="teal">{record.stage || "confirmed"}</Badge><h2 className="mt-3 font-mono text-sm font-semibold text-lblue">{orderId || record.id}</h2><p className="mt-1 text-sm text-slate-600">SR {record.shipment_request_id}</p></div><p className="text-sm text-slate-500">{record.matched_at ? new Date(record.matched_at).toLocaleDateString(locale === "zh" ? "zh-HK" : "en-HK") : ""}</p>{orderId ? <Button asChild variant="outline"><Link href={`/${locale}/orders/${orderId}`}>{copy.open}<ArrowRight className="h-4 w-4" /></Link></Button> : null}</CardContent></Card> })}</section></main>
}
function Empty({ label }: { label: string }) { return <div className="border border-dashed border-lblue/15 bg-white px-5 py-12 text-center text-sm text-slate-500">{label}</div> }
