"use client"

import { useEffect, useState } from "react"
import { Loader2, ScrollText } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

const copy = { zh: { badge: "ADMIN / AUDIT LOG", title: "關鍵營運操作紀錄", intro: "這裡保留管理、付款、會員、得標、取消及訂單狀態的稽核紀錄。", all: "全部", loading: "正在載入稽核紀錄", empty: "暫時沒有紀錄。" }, en: { badge: "ADMIN / AUDIT LOG", title: "Operational audit trail", intro: "This retains auditable records for Admin, payment, membership, award, cancellation and order-status actions.", all: "All", loading: "Loading audit log", empty: "No records yet." } }

export default function AuditLogPage({ params }: { params: { locale: string } }) { const locale: Locale = isLocale(params.locale) ? params.locale : "en"; const t = copy[locale]; const [entries, setEntries] = useState<any[]>([]); const [loading, setLoading] = useState(true); useEffect(() => { apiJson("/api/admin/audit-logs").then(({ body }) => { setEntries(body.auditLogs || []); setLoading(false) }) }, []); return <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="border-b border-lblue/10 pb-7"><Badge variant="gold">{t.badge}</Badge><h1 className="mt-3 text-3xl font-semibold text-lblue">{t.title}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{t.intro}</p></section>{loading ? <div className="flex gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{t.loading}</div> : !entries.length ? <p className="mt-8 border border-dashed border-lblue/15 p-10 text-center text-sm text-slate-500">{t.empty}</p> : <section className="mt-6 space-y-3">{entries.map((entry) => <Card key={entry.id}><CardContent className="flex gap-3 p-4"><ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-lgold" /><div className="min-w-0"><p className="font-medium text-lblue">{entry.action}</p><p className="mt-1 text-xs text-slate-500">{entry.entity_type} · {entry.entity_id || "-"} · {entry.actor?.email || "system"}</p><p className="mt-1 text-xs text-slate-400">{new Date(entry.created_at).toLocaleString(locale === "zh" ? "zh-HK" : "en-HK")}</p></div></CardContent></Card>)}</section>}</main> }
