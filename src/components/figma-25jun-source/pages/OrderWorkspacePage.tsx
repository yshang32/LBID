import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, CheckCircle2, Clock, Upload, Send,
  FileText, MessageSquare, MapPin, AlertTriangle, Package,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type Tab = "overview" | "documents" | "messages" | "tracking";

const STATUS_STEPS = [
  "Confirmed", "Shipment Booked", "In Transit", "Arrived HK",
  "Customs Cleared", "Delivered", "Completed",
];
const CURRENT_STEP = 2; // 0-indexed → "In Transit"

const ORDER = {
  id: "ORD-2026-0047",
  route: "Taipei → Hong Kong",
  originCode: "TPE", destCode: "HKG",
  mode: "Air", cargo: "Tech Components",
  weight: "450 kg", cbm: "3.1 CBM",
  forwarder: "Pacific Forward Ltd.",
  forwarderContact: "kenny.lam@pacificforward.com",
  client: "Apex Sourcing Ltd.",
  quoteHKD: 14200,
  transit: "1 day",
  awardedAt: "19 Jun 2026",
};

const DOCUMENTS = [
  { id: "awb",     label: "Air Waybill (AWB)",        status: "uploaded" as const, date: "21 Jun", responsible: "Forwarder", blocksNext: false },
  { id: "packing", label: "Packing List",              status: "uploaded" as const, date: "21 Jun", responsible: "Client",    blocksNext: false },
  { id: "invoice", label: "Commercial Invoice",        status: "missing"  as const, date: null,     responsible: "Client",    blocksNext: true  },
  { id: "coo",     label: "Certificate of Origin",    status: "pending"  as const, date: null,     responsible: "Forwarder", blocksNext: false },
  { id: "customs", label: "Customs Declaration Form", status: "pending"  as const, date: null,     responsible: "Forwarder", blocksNext: false },
];

const MESSAGES = [
  { id: 1, from: "Pacific Forward Ltd.", isOwn: false, text: "Good morning. AWB confirmed — EVA Air flight BR872, departing TPE 23 Jun 06:40. ETA HKG 09:10.", time: "21 Jun, 09:15" },
  { id: 2, from: "Apex Sourcing Ltd.",   isOwn: true,  text: "Thank you. Please note we still need the Commercial Invoice before cargo release. Can you confirm?", time: "21 Jun, 10:02" },
  { id: 3, from: "Pacific Forward Ltd.", isOwn: false, text: "Understood. We're waiting on the shipper. Will upload as soon as received, before the 23rd.", time: "21 Jun, 10:30" },
];

const TRACKING = [
  { label: "Order Confirmed",  detail: "Forwarder awarded. 24h cooling-off started.", ata: "19 Jun, 14:00", eta: null,             done: true  },
  { label: "Shipment Booked", detail: "EVA Air BR872 confirmed. MAWB received.",      ata: "21 Jun, 09:00", eta: null,             done: true  },
  { label: "In Transit",      detail: "Departed TPE. En route to HKG.",               ata: "23 Jun, 06:40", eta: "23 Jun, 09:10",  done: true  },
  { label: "Arrived HK",      detail: "Pending flight landing confirmation.",          ata: null,            eta: "23 Jun, 09:10",  done: false },
  { label: "Customs Cleared", detail: "Invoice required before clearance can begin.", ata: null,            eta: "23 Jun, 14:00",  done: false },
  { label: "Delivered",       detail: "Awaiting customs clearance.",                   ata: null,            eta: "24 Jun",         done: false },
  { label: "Completed",       detail: "Pending delivery confirmation.",                ata: null,            eta: "24 Jun",         done: false },
];

const DOC_STATUS_CONFIG = {
  uploaded: { label: "Uploaded", color: "text-emerald", bg: "bg-emerald-soft", border: "border-emerald/20" },
  missing:  { label: "Missing",  color: "text-red-600", bg: "bg-red-50",       border: "border-red-200"   },
  pending:  { label: "Pending",  color: "text-ink-3",   bg: "bg-canvas",       border: "border-line"      },
};

export function OrderWorkspacePage() {
  const navigate = useNavigate();
  const [tab,   setTab]   = useState<Tab>("overview");
  const [msg,   setMsg]   = useState("");
  const [msgs,  setMsgs]  = useState(MESSAGES);

  function sendMsg() {
    if (!msg.trim()) return;
    setMsgs((m) => [
      ...m,
      { id: Date.now(), from: "Apex Sourcing Ltd.", isOwn: true, text: msg.trim(), time: "Just now" },
    ]);
    setMsg("");
  }

  const TAB_ITEMS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "overview",   label: "Overview",   icon: Package       },
    { key: "documents",  label: "Documents",  icon: FileText      },
    { key: "messages",   label: "Messages",   icon: MessageSquare },
    { key: "tracking",   label: "Tracking",   icon: MapPin        },
  ];

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      <button
        onClick={() => navigate("/orders")}
        className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink transition-colors cursor-pointer w-fit"
      >
        <ChevronLeft className="w-4 h-4" strokeWidth={2} /> Orders
      </button>

      {/* Order header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <h1 className="text-[26px] font-bold text-ink tracking-[-0.6px] leading-none m-0">{ORDER.id}</h1>
            <span className="text-[11px] font-bold text-emerald bg-emerald-soft border border-emerald/25 px-2.5 py-1 rounded-full uppercase tracking-[0.07em]">
              In Transit
            </span>
          </div>
          <p className="text-[14px] text-ink-2">{ORDER.route} · {ORDER.weight} · {ORDER.cargo}</p>
          <p className="text-[13px] text-ink-3 mt-0.5">{ORDER.mode} · Awarded to {ORDER.forwarder}</p>
        </div>
        <div className="text-right">
          <p className="text-[10.5px] font-semibold text-ink-3 uppercase tracking-[0.07em]">Total Quote</p>
          <p className="text-[22px] font-bold text-ink tracking-[-0.5px]">HKD {ORDER.quoteHKD.toLocaleString()}</p>
        </div>
      </div>

      {/* Status pipeline */}
      <div
        className="bg-white rounded-[16px] border border-line px-7 py-5"
        style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-0">
          {STATUS_STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-0 flex-1">
              <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300
                    ${i < CURRENT_STEP  ? "bg-emerald shadow-[0_2px_8px_rgba(26,125,74,0.3)]"
                    : i === CURRENT_STEP ? "bg-navy shadow-[0_2px_8px_rgba(12,26,62,0.3)]"
                    : "bg-canvas border-2 border-line"}`}
                >
                  {i < CURRENT_STEP
                    ? <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.5} />
                    : i === CURRENT_STEP
                    ? <Clock className="w-3.5 h-3.5 text-white" strokeWidth={2.2} />
                    : <span className="w-2 h-2 rounded-full bg-line" />
                  }
                </div>
                <span
                  className={`text-[10px] font-semibold whitespace-nowrap text-center leading-tight
                    ${i === CURRENT_STEP ? "text-navy" : i < CURRENT_STEP ? "text-emerald" : "text-ink-3"}`}
                >
                  {s}
                </span>
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mx-1.5 mb-4 rounded-full transition-colors duration-300
                    ${i < CURRENT_STEP ? "bg-emerald" : "bg-line"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Missing document warning */}
      {DOCUMENTS.some((d) => d.status === "missing") && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="text-[13px] font-semibold text-red-700">Document Required</p>
            <p className="text-[12.5px] text-red-600 mt-0.5">
              Commercial Invoice is missing and required for customs clearance.
              {" "}<button onClick={() => setTab("documents")} className="underline font-medium cursor-pointer">Upload now →</button>
            </p>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="flex items-center gap-0 border-b border-line">
        {TAB_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 text-[13px] font-medium transition-all duration-200 cursor-pointer border-b-2 -mb-px
              ${tab === key ? "text-navy border-navy" : "text-ink-3 border-transparent hover:text-ink"}`}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* ── Overview ── */}
          {tab === "overview" && (
            <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 320px" }}>
              <div className="flex flex-col gap-4">
                {/* Next action */}
                <div
                  className="bg-white rounded-[16px] border border-navy/20 p-5"
                  style={{ boxShadow: "0 2px 12px rgba(12,26,62,0.06)" }}
                >
                  <p className="text-[10.5px] font-bold text-navy uppercase tracking-[0.08em] mb-2">Next Action</p>
                  <p className="text-[15px] font-semibold text-ink mb-1">Upload Commercial Invoice</p>
                  <p className="text-[13px] text-ink-3 mb-4">Required for customs clearance at HKG. Cargo may be held without it.</p>
                  <button
                    onClick={() => setTab("documents")}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-[13px] font-semibold
                               hover:bg-navy-hover hover:-translate-y-[1px] hover:shadow-[0_4px_14px_rgba(12,26,62,0.24)]
                               transition-all duration-200 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" strokeWidth={2} /> Upload Document
                  </button>
                </div>

                {/* Order details */}
                <div className="bg-white rounded-[16px] border border-line p-5">
                  <p className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.08em] mb-3">Shipment Details</p>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                    {[
                      ["Route",       ORDER.route       ],
                      ["Freight Mode",ORDER.mode        ],
                      ["Cargo",       ORDER.cargo       ],
                      ["Weight",      ORDER.weight      ],
                      ["Volume",      ORDER.cbm         ],
                      ["Transit",     ORDER.transit     ],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span className="text-[11px] text-ink-3">{k}</span>
                        <p className="text-[13px] font-medium text-ink mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Partner info */}
              <div className="bg-white rounded-[16px] border border-line p-5 flex flex-col gap-4">
                <p className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.08em]">Partner</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[11px] bg-navy-soft flex items-center justify-center">
                    <span className="text-[11px] font-bold text-navy">PF</span>
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">{ORDER.forwarder}</p>
                    <p className="text-[12px] text-ink-3">Freight Forwarder</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-3 border-t border-line">
                  <div>
                    <span className="text-[11px] text-ink-3">Contact (unlocked)</span>
                    <p className="text-[12.5px] font-medium text-navy mt-0.5">{ORDER.forwarderContact}</p>
                  </div>
                  <button
                    onClick={() => setTab("messages")}
                    className="flex items-center gap-2 mt-2 px-3.5 py-2 rounded-lg border border-line text-[12.5px] font-medium text-ink-2
                               hover:bg-canvas hover:border-navy/30 hover:text-navy transition-all duration-200 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} /> Send Message
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Documents ── */}
          {tab === "documents" && (
            <div className="flex flex-col gap-2 max-w-[680px]">
              {/* Column header */}
              <div className="grid gap-4 px-5 mb-1" style={{ gridTemplateColumns: "1fr 100px 90px 100px" }}>
                <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.08em]">Document</span>
                <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.08em]">Responsible</span>
                <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.08em]">Status</span>
                <span />
              </div>

              {DOCUMENTS.map((doc) => {
                const cfg = DOC_STATUS_CONFIG[doc.status];
                return (
                  <div
                    key={doc.id}
                    className={`grid items-center gap-4 bg-white rounded-[14px] border px-5 py-4 transition-all duration-200
                      ${doc.blocksNext ? "border-red-200 bg-red-50/30" : "border-line"}`}
                    style={{ gridTemplateColumns: "1fr 100px 90px 100px" }}
                  >
                    {/* Doc label */}
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText
                        className={`w-4 h-4 flex-shrink-0 ${doc.blocksNext ? "text-red-400" : "text-ink-3"}`}
                        strokeWidth={1.75}
                      />
                      <div>
                        <p className="text-[13.5px] font-medium text-ink">{doc.label}</p>
                        {doc.date
                          ? <p className="text-[11.5px] text-ink-3 mt-0.5">Uploaded {doc.date}</p>
                          : doc.blocksNext
                          ? <p className="text-[11.5px] text-red-500 font-medium mt-0.5">Blocking customs clearance</p>
                          : null
                        }
                      </div>
                    </div>

                    {/* Responsible party */}
                    <span
                      className={`text-[11.5px] font-medium px-2.5 py-1 rounded-full text-center
                        ${doc.responsible === "Client"
                          ? "bg-navy-soft text-navy"
                          : "bg-canvas text-ink-2 border border-line"
                        }`}
                    >
                      {doc.responsible}
                    </span>

                    {/* Status badge */}
                    <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full border text-center ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                      {cfg.label}
                    </span>

                    {/* Action */}
                    {doc.status !== "uploaded" ? (
                      <button
                        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-200 cursor-pointer
                                   bg-canvas border border-line text-ink-2 hover:bg-navy-soft hover:border-navy/20 hover:text-navy"
                      >
                        <Upload className="w-3.5 h-3.5" strokeWidth={2} /> Upload
                      </button>
                    ) : (
                      <div />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Messages ── */}
          {tab === "messages" && (
            <div className="flex flex-col gap-0 max-w-[620px]">
              <div className="flex flex-col gap-3 mb-4">
                {msgs.map((m) => (
                  <div key={m.id} className={`flex gap-3 ${m.isOwn ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.isOwn ? "bg-navy" : "bg-navy-soft"}`}>
                      <span className={`text-[10px] font-bold ${m.isOwn ? "text-white" : "text-navy"}`}>
                        {m.from.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                      </span>
                    </div>
                    <div className={`max-w-[72%] ${m.isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div className={`px-4 py-3 rounded-2xl text-[13.5px] leading-relaxed
                        ${m.isOwn ? "bg-navy text-white rounded-tr-sm" : "bg-white border border-line text-ink rounded-tl-sm"}`}
                      >
                        {m.text}
                      </div>
                      <span className="text-[10.5px] text-ink-3 px-1">{m.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div
                className="flex items-end gap-3 p-3 rounded-[16px] border-2 border-line bg-white transition-all duration-200
                           focus-within:border-navy focus-within:shadow-[0_0_0_3px_rgba(12,26,62,0.07)]"
              >
                <textarea
                  value={msg}
                  onChange={(e) => setMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); }}}
                  placeholder="Type a message… (Enter to send)"
                  rows={2}
                  className="flex-1 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-ink-3 resize-none"
                />
                <button
                  onClick={sendMsg}
                  disabled={!msg.trim()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-navy text-white flex-shrink-0
                             transition-all duration-200 cursor-pointer
                             hover:enabled:bg-navy-hover hover:enabled:shadow-[0_3px_10px_rgba(12,26,62,0.25)]
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* ── Tracking ── */}
          {tab === "tracking" && (
            <div className="flex flex-col gap-0 max-w-[620px]">
              {/* ETA / ATA column header */}
              <div className="grid mb-3 pl-11 pr-2" style={{ gridTemplateColumns: "1fr 130px 130px" }}>
                <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.08em]">Milestone</span>
                <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.08em] text-right">ETA</span>
                <span className="text-[10.5px] font-bold text-ink-3 uppercase tracking-[0.08em] text-right">ATA (Actual)</span>
              </div>

              <div className="relative">
                {/* Vertical connector line */}
                <div
                  aria-hidden
                  className="absolute top-3.5 bottom-3.5 left-[13px] w-px bg-line-light"
                />
                {TRACKING.map((t, i) => (
                  <div key={i} className="relative flex items-start gap-4 pb-5">
                    {/* Step dot */}
                    <div
                      className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
                        ${t.done
                          ? i === CURRENT_STEP
                            ? "bg-navy shadow-[0_2px_8px_rgba(12,26,62,0.25)]"
                            : "bg-emerald"
                          : "bg-white border-2 border-line"}`}
                    >
                      {t.done
                        ? <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={2.2} />
                        : <span className="w-2 h-2 rounded-full bg-line" />
                      }
                    </div>

                    {/* Content row: label+detail | ETA | ATA */}
                    <div className="flex-1 grid pt-0.5" style={{ gridTemplateColumns: "1fr 130px 130px" }}>
                      <div>
                        <p className={`text-[13.5px] font-semibold ${t.done ? "text-ink" : "text-ink-3"}`}>
                          {t.label}
                        </p>
                        <p className="text-[12px] text-ink-3 mt-0.5 leading-snug">{t.detail}</p>
                      </div>
                      {/* ETA column */}
                      <p className={`text-[12px] text-right pt-0.5 ${t.eta ? "text-ink-2" : "text-ink-3"}`}>
                        {t.eta ?? "—"}
                      </p>
                      {/* ATA column */}
                      <p
                        className={`text-[12px] text-right pt-0.5 font-medium
                          ${t.ata
                            ? t.eta && t.ata > t.eta
                              ? "text-amber-600"   // late
                              : "text-emerald"     // on time
                            : "text-ink-3"
                          }`}
                      >
                        {t.ata ?? "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
