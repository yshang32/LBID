import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, Clock3, FileText, Loader2, Plane, Ship, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { apiJson } from "@/lib/api-client";

type Filter = "all" | "pending" | "approved" | "rejected";
type JsonRecord = Record<string, any>;

type RequestRow = {
  id: string;
  agentId: string;
  origin: string;
  destination: string;
  mode: "Air" | "Sea";
  weight: string;
  volume: string;
  cargo: string;
  client: string;
  submitted: string;
  status: string;
  services: string[];
};

const STATUS_CFG = {
  pending: { label: "Pending Validation", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  approved: { label: "Approved", color: "text-emerald", bg: "bg-emerald-soft", border: "border-emerald/20" },
  rejected: { label: "Changes Required", color: "text-red-600", bg: "bg-red-50", border: "border-red-200" },
};

function category(status: string): Exclude<Filter, "all"> {
  if (status === "PENDING_REVIEW") return "pending";
  if (["NEEDS_CHANGES", "REJECTED"].includes(status)) return "rejected";
  return "approved";
}

function requestView(item: JsonRecord): RequestRow {
  const route = item.route && typeof item.route === "object" ? item.route : {};
  const cargo = item.cargo_details && typeof item.cargo_details === "object" ? item.cargo_details : {};
  const mode = String(cargo.mode || "air").toLowerCase() === "sea" ? "Sea" : "Air";
  return {
    id: String(item.id || ""),
    agentId: String(item.agent_id || ""),
    origin: String(route.origin || "Origin pending"),
    destination: String(route.destination || "Hong Kong (HKG)"),
    mode,
    weight: `${Number(cargo.weight_kg || 0).toLocaleString()} kg`,
    volume: `${Number(cargo.cbm || 0).toLocaleString()} CBM`,
    cargo: String(cargo.cargo || cargo.cargo_type || "Cargo details pending"),
    client: String(item.company_name_en || item.company_name_zh || `Company ${String(item.agent_id || "").slice(0, 8)}`),
    submitted: item.created_at ? new Intl.DateTimeFormat("en-HK", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.created_at)) : "Unknown",
    status: String(item.status || "PENDING_REVIEW"),
    services: Array.isArray(item.services_needed) ? item.services_needed.map(String) : [],
  };
}

function ReviewModal({ request, onClose, onReview }: {
  request: RequestRow;
  onClose: () => void;
  onReview: (id: string, action: "publish" | "reject", reason: string) => Promise<boolean>;
}) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(action: "publish" | "reject") {
    if (action === "reject" && !reason.trim()) return;
    setBusy(true);
    setError("");
    const ok = await onReview(request.id, action, reason.trim());
    setBusy(false);
    if (ok) onClose();
    else setError("The review could not be saved. Check your Admin access and try again.");
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-navy/45 px-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <motion.div initial={{ opacity: 0, scale: 0.97, y: 14 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-[560px] rounded-[22px] border border-line bg-white p-6 shadow-[0_28px_90px_rgba(0,0,0,0.22)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-[18px] font-bold text-ink">Review shipment request</p><p className="mt-1 text-[12.5px] text-ink-3">SR {request.id.slice(0, 8)} · Submitted {request.submitted}</p></div>
          <button disabled={busy} onClick={onClose} aria-label="Close review" className="grid h-9 w-9 place-items-center rounded-lg text-ink-3 transition hover:bg-canvas hover:text-ink disabled:opacity-40"><X className="h-4 w-4" /></button>
        </div>

        <dl className="mt-6 grid gap-3 rounded-xl border border-line bg-canvas/60 p-4 sm:grid-cols-2">
          <Detail label="Route" value={`${request.origin} to ${request.destination}`} wide />
          <Detail label="Freight" value={request.mode} />
          <Detail label="Cargo" value={request.cargo} />
          <Detail label="Weight" value={request.weight} />
          <Detail label="Volume" value={request.volume} />
          <Detail label="Client" value={request.client} wide />
          <Detail label="Services" value={request.services.join(", ") || "Not specified"} wide />
        </dl>

        {rejecting ? (
          <div className="mt-5">
            <label className="text-[12.5px] font-semibold text-ink-2" htmlFor="rejection-reason">Rejection reason <span className="text-red-500">*</span></label>
            <textarea id="rejection-reason" value={reason} onChange={(event) => setReason(event.target.value)} rows={4} maxLength={1000} placeholder="Explain what the client must correct before resubmitting." className="mt-2 w-full resize-none rounded-xl border border-line px-4 py-3 text-[13px] text-ink outline-none transition placeholder:text-ink-3 focus:border-red-400 focus:shadow-[0_0_0_3px_rgba(220,38,38,0.08)]" />
            <div className="mt-4 flex gap-3">
              <button disabled={busy} onClick={() => { setRejecting(false); setError(""); }} className="h-11 flex-1 rounded-xl border border-line text-[13px] font-semibold text-ink-2 transition hover:bg-canvas disabled:opacity-40">Back</button>
              <button disabled={busy || !reason.trim()} onClick={() => void submit("reject")} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-[13px] font-semibold text-white transition hover:enabled:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Request changes</button>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex gap-3">
            <button disabled={busy} onClick={() => setRejecting(true)} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 text-[13px] font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-40"><X className="h-4 w-4" /> Request changes</button>
            <button disabled={busy} onClick={() => void submit("publish")} className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald text-[13px] font-semibold text-white transition hover:bg-[#15693d] disabled:opacity-40">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Approve & publish</button>
          </div>
        )}
        {error ? <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-[12px] font-medium text-red-700"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />{error}</p> : null}
      </motion.div>
    </motion.div>
  );
}

function Detail({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? "sm:col-span-2" : ""}><dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-3">{label}</dt><dd className="mt-1 text-[13px] font-medium leading-5 text-ink">{value}</dd></div>;
}

export function AdminRequestsPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [reviewing, setReviewing] = useState<RequestRow | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const load = useCallback(async () => {
    setState("loading");
    setError("");
    const { response, body } = await apiJson(`/api/admin/shipment-requests?status=${filter}`).catch(() => ({ response: null, body: { error: "NETWORK_ERROR" } }));
    if (!response?.ok) {
      setRows([]);
      setError(body.error || "ADMIN_REQUESTS_LOAD_FAILED");
      setState("error");
      return;
    }
    setRows((body.shipmentRequests || []).map(requestView));
    setState("ready");
  }, [filter]);

  useEffect(() => { void load(); }, [load, reloadKey]);

  async function review(id: string, action: "publish" | "reject", reason: string) {
    const { response } = await apiJson("/api/admin/shipment-requests", { method: "PATCH", body: JSON.stringify({ id, action, reason }) }).catch(() => ({ response: null, body: {} }));
    if (!response?.ok) return false;
    setReloadKey((value) => value + 1);
    return true;
  }

  const counts = useMemo(() => ({ pending: rows.filter((row) => category(row.status) === "pending").length }), [rows]);

  return (
    <main className="px-5 pb-16 pt-8 sm:px-8 lg:px-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-gold-dark">Platform operations</p><h1 className="mt-2 text-[30px] font-bold leading-tight text-ink">Shipment request validation</h1><p className="mt-1.5 text-[14px] text-ink-3">Validate scope integrity and risk before publishing the fixed three-hour sealed bidding window.</p></div>
        <div className="inline-flex h-11 items-center gap-2 self-start rounded-xl border border-amber-200 bg-amber-50 px-4 text-[12.5px] font-semibold text-amber-800 sm:self-auto"><Clock3 className="h-4 w-4" />{filter === "pending" ? counts.pending : "-"} awaiting review</div>
      </header>

      <div className="mt-7 flex overflow-x-auto border-b border-line">
        {(["pending", "all", "approved", "rejected"] as const).map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`relative h-11 flex-shrink-0 px-4 text-[13px] font-semibold capitalize transition ${filter === item ? "text-navy" : "text-ink-3 hover:text-ink"}`}>
            {item}{item === "pending" && filter === "pending" && counts.pending > 0 ? <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] text-white">{counts.pending}</span> : null}
            {filter === item ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-navy" /> : null}
          </button>
        ))}
      </div>

      <section className="mt-5 space-y-3">
        {state === "loading" ? <div className="flex min-h-[220px] items-center justify-center rounded-[18px] border border-line bg-white"><Loader2 className="h-6 w-6 animate-spin text-navy" /><span className="ml-3 text-[13px] text-ink-3">Loading live requests...</span></div> : null}
        {state === "error" ? <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[18px] border border-red-200 bg-red-50/50 px-5 text-center"><AlertCircle className="h-6 w-6 text-red-600" /><p className="mt-3 text-[14px] font-semibold text-red-700">Requests could not load</p><p className="mt-1 text-[12px] text-red-600">{error}</p><button onClick={() => setReloadKey((value) => value + 1)} className="mt-4 h-9 rounded-lg border border-red-200 bg-white px-4 text-[12px] font-semibold text-red-700 transition hover:bg-red-50">Try again</button></div> : null}
        {state === "ready" && rows.length === 0 ? <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[18px] border border-dashed border-line bg-white px-5 text-center"><FileText className="h-7 w-7 text-ink-3" /><p className="mt-3 text-[14px] font-semibold text-ink">No {filter === "all" ? "shipment" : filter} requests</p><p className="mt-1 text-[12px] text-ink-3">New submissions will appear here as soon as they are saved in Supabase.</p></div> : null}
        {state === "ready" ? rows.map((request, index) => {
          const requestCategory = category(request.status);
          const cfg = STATUS_CFG[requestCategory];
          return (
            <motion.article key={request.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22, delay: Math.min(index * 0.035, 0.2) }} className="grid gap-4 rounded-[16px] border border-line bg-white px-5 py-4 shadow-[0_8px_24px_rgba(12,26,62,0.04)] transition hover:border-navy/15 hover:shadow-[0_14px_34px_rgba(12,26,62,0.08)] lg:grid-cols-[44px_minmax(0,1fr)_auto] lg:items-center">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-canvas text-navy">{request.mode === "Air" ? <Plane className="h-5 w-5" /> : <Ship className="h-5 w-5" />}</span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><p className="text-[14px] font-bold text-ink">SR {request.id.slice(0, 8)}</p><span className={`rounded-full border px-2.5 py-1 text-[10.5px] font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>{cfg.label}</span></div>
                <p className="mt-1.5 truncate text-[13px] font-medium text-ink-2">{request.origin} to {request.destination}</p>
                <p className="mt-1 text-[11.5px] text-ink-3">{request.client} · {request.cargo} · {request.weight} · {request.volume} · {request.submitted}</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                {requestCategory === "pending" ? <button onClick={() => setReviewing(request)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-navy px-4 text-[12.5px] font-semibold text-white transition hover:-translate-y-px hover:bg-navy-hover hover:shadow-[0_6px_18px_rgba(12,26,62,0.20)]">Review <ChevronRight className="h-4 w-4" /></button> : <span className="inline-flex h-10 items-center gap-2 rounded-xl border border-line px-3.5 text-[12px] font-semibold text-ink-2"><CheckCircle2 className={`h-4 w-4 ${requestCategory === "rejected" ? "text-red-500" : "text-emerald"}`} />{cfg.label}</span>}
              </div>
            </motion.article>
          );
        }) : null}
      </section>

      <AnimatePresence>{reviewing ? <ReviewModal request={reviewing} onClose={() => setReviewing(null)} onReview={review} /> : null}</AnimatePresence>
    </main>
  );
}
