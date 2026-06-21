"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Crown, Loader2, ShieldCheck, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiJson } from "@/lib/api-client"
import { isLocale, type Locale } from "@/lib/i18n"

type Account = { id: string; email: string; company_name: string; role: string; profile?: { company_name_en?: string; company_name_zh?: string; region?: string }; subscription?: { plan: string; status: string; current_period_end?: string } }
type Plan = "trial" | "monthly" | "annual"

export default function AccountManagementPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isLocale(params.locale) ? params.locale : "en"
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState("")
  const [error, setError] = useState("")
  const text = locale === "zh" ? { badge: "ADMIN / ACCOUNTS", title: "帳戶與會員管理", intro: "在這裡查看公司帳戶、付款後會員狀態，以及在需要時作人工調整。Stripe 付款成功仍會由 webhook 自動更新。", loading: "載入帳戶中", empty: "未能讀取帳戶。請以 Admin 身份登入。", plan: "會員級別", save: "儲存級別", saved: "已更新", trial: "試用", monthly: "月費會員", annual: "年費會員", expires: "有效至" } : { badge: "ADMIN / ACCOUNTS", title: "Account and membership management", intro: "View company accounts and membership status. Stripe webhook confirmation remains the automatic source after payment; use this screen for authorised manual adjustments.", loading: "Loading accounts", empty: "Accounts are unavailable. Sign in as an Admin.", plan: "Membership", save: "Save membership", saved: "Updated", trial: "Trial", monthly: "Monthly member", annual: "Annual member", expires: "Valid until" }

  useEffect(() => { let cancelled = false; apiJson("/api/admin/accounts").then(({ response, body }) => { if (cancelled) return; if (!response.ok) setError(body.error || "ADMIN_REQUIRED"); else setAccounts(body.accounts || []); setLoading(false) }); return () => { cancelled = true } }, [])

  async function save(userId: string, plan: Plan) {
    setSaving(userId); setError("")
    const { response, body } = await apiJson("/api/admin/accounts", { method: "PATCH", body: JSON.stringify({ userId, plan }) })
    setSaving("")
    if (!response.ok) { setError(body.error || "UPDATE_FAILED"); return }
    setAccounts((items) => items.map((account) => account.id === userId ? { ...account, subscription: body.subscription } : account))
  }

  return <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:pb-10"><section className="border-b border-lblue/10 pb-7"><Badge variant="gold">{text.badge}</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight text-lblue sm:text-4xl">{text.title}</h1><p className="mt-3 max-w-3xl leading-7 text-slate-600">{text.intro}</p></section>{loading ? <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />{text.loading}</div> : error ? <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || text.empty}</div> : <section className="mt-6 space-y-3">{accounts.map((account) => <AccountRow key={account.id} account={account} text={text} saving={saving === account.id} onSave={save} />)}</section>}</main>
}

function AccountRow({ account, text, saving, onSave }: { account: Account; text: any; saving: boolean; onSave: (userId: string, plan: Plan) => void }) {
  const [plan, setPlan] = useState<Plan>((account.subscription?.plan || "trial") as Plan)
  useEffect(() => setPlan((account.subscription?.plan || "trial") as Plan), [account.subscription?.plan])
  return <Card><CardContent className="grid gap-4 p-5 lg:grid-cols-[1fr_auto_auto]"><div><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-lblue">{account.profile?.company_name_en || account.profile?.company_name_zh || account.company_name}</h2><Badge variant={account.subscription?.status === "active" ? "teal" : "secondary"}>{account.subscription?.status || "trial"}</Badge></div><p className="mt-1 text-sm text-slate-600">{account.email}{account.profile?.region ? ` · ${account.profile.region}` : ""}</p>{account.subscription?.current_period_end ? <p className="mt-2 text-xs text-slate-500">{text.expires}: {new Date(account.subscription.current_period_end).toLocaleDateString()}</p> : null}</div><label className="text-sm font-medium text-slate-600"><span className="mb-2 block">{text.plan}</span><select value={plan} className="h-10 min-w-40 rounded-md border border-lblue/15 bg-white px-3 text-sm text-lblue" onChange={(event) => setPlan(event.target.value as Plan)} disabled={saving}><option value="trial">{text.trial}</option><option value="monthly">{text.monthly}</option><option value="annual">{text.annual}</option></select></label><div className="flex items-end"><Button variant="outline" disabled={saving} onClick={() => onSave(account.id, plan)}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}{text.save}</Button></div></CardContent></Card>
}
