import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { TrendingUp, Activity, Clock, Award, Lightbulb } from "lucide-react";
import { motion } from "motion/react";

const METRICS = [
  { icon: Activity,   label: "Bids Submitted",     value: "23",       delta: "+4 vs last month",  positive: true,  color: "text-navy"    },
  { icon: TrendingUp, label: "Win Rate",            value: "91%",      delta: "+2pp vs last month",positive: true,  color: "text-emerald" },
  { icon: Clock,      label: "Avg Response Time",  value: "47 min",   delta: "−8 min vs last mo.", positive: true,  color: "text-blue-600"},
  { icon: Award,      label: "Awarded Value",       value: "HKD 2.4M", delta: "Jun 2026",          positive: false, color: "text-gold-dark"},
];

const FUNNEL = [
  { stage: "Bids Submitted",    count: 23, pct: 100 },
  { stage: "Shortlisted",       count: 18, pct: 78  },
  { stage: "Awaiting Decision", count: 8,  pct: 35  },
  { stage: "Awarded",           count: 21, pct: 91  },
];

const ROUTE_PERF = [
  { route: "VN → HKG", bids: 12, wins: 10, rate: 83 },
  { route: "CN → HKG", bids: 7,  wins: 6,  rate: 86 },
  { route: "TW → HKG", bids: 3,  wins: 2,  rate: 67 },
  { route: "TH → HKG", bids: 1,  wins: 0,  rate: 0  },
];

const RESPONSE_TREND = [
  { week: "W1 May", mins: 68 }, { week: "W2 May", mins: 62 },
  { week: "W3 May", mins: 55 }, { week: "W4 May", mins: 58 },
  { week: "W1 Jun", mins: 51 }, { week: "W2 Jun", mins: 47 },
  { week: "W3 Jun", mins: 47 },
];

const INSIGHTS = [
  { text: "Vietnam → HKG is your strongest route at 83% win rate. Prioritise it for upcoming opportunities.", type: "positive" },
  { text: "Your average response time of 47 min is significantly faster than the platform median of 92 min. This boosts recommendation ranking.", type: "positive" },
  { text: "Taiwan → HKG has a 67% win rate. Adding IATA certification for TPE routes may improve eligibility and match score.", type: "action" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-line rounded-xl px-3.5 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.1)]">
      <p className="text-[11px] font-semibold text-ink-3 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-[13px] font-semibold" style={{ color: p.color }}>{p.value}{p.name === "mins" ? " min" : ""}</p>
      ))}
    </div>
  );
};

export function AnalyticsPage() {
  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Analytics</h1>
        <p className="text-[14px] text-ink-3">Bid performance · June 2026</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-4 gap-4">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="bg-white rounded-[16px] border border-line p-5 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <m.icon className={`w-4 h-4 ${m.color}`} strokeWidth={1.75} />
              <span className="text-[10.5px] font-semibold text-ink-3 uppercase tracking-[0.07em]">{m.label}</span>
            </div>
            <p className={`text-[24px] font-bold tracking-[-0.5px] leading-none ${m.color}`}>{m.value}</p>
            <p className={`text-[11px] font-medium ${m.positive ? "text-emerald" : "text-ink-3"}`}>{m.delta}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">

        {/* Bid funnel */}
        <div className="bg-white rounded-[16px] border border-line p-5">
          <p className="text-[13px] font-semibold text-ink mb-5">Bid Funnel</p>
          <div className="flex flex-col gap-3">
            {FUNNEL.map((f, i) => (
              <div key={f.stage}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-[12.5px] text-ink-2">{f.stage}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[13.5px] font-bold text-ink">{f.count}</span>
                    <span className="text-[11px] text-ink-3">{f.pct}%</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${f.pct}%` }}
                    transition={{ duration: 0.7, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className={`h-full rounded-full ${i === FUNNEL.length - 1 ? "bg-emerald" : "bg-navy"}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route performance */}
        <div className="bg-white rounded-[16px] border border-line p-5">
          <p className="text-[13px] font-semibold text-ink mb-4">Route Performance</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ROUTE_PERF} barSize={28} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#EEF0F5" strokeDasharray="3 3" />
              <XAxis dataKey="route" tick={{ fontSize: 11, fill: "#9099A8", fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#9099A8" }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]}>
                {ROUTE_PERF.map((r, i) => (
                  <Cell key={i} fill={r.rate >= 80 ? "#1A7D4A" : r.rate >= 60 ? "#0C1A3E" : "#E2E6EE"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Response time trend */}
      <div className="bg-white rounded-[16px] border border-line p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-semibold text-ink">Response Time Trend</p>
          <span className="text-[12px] text-ink-3">Bid submission speed from opportunity publish · minutes</span>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={RESPONSE_TREND} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
            <CartesianGrid stroke="#EEF0F5" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: "#9099A8", fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#9099A8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="mins" name="mins" stroke="#0C1A3E" strokeWidth={2} dot={{ fill: "#0C1A3E", r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-gold" strokeWidth={1.75} />
          <p className="text-[13.5px] font-semibold text-ink">Insights</p>
        </div>
        <div className="flex flex-col gap-3">
          {INSIGHTS.map((ins, i) => (
            <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${ins.type === "positive" ? "bg-emerald-soft border-emerald/20" : "bg-gold-soft border-gold-border"}`}>
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${ins.type === "positive" ? "bg-emerald" : "bg-gold"}`} />
              <p className="text-[13px] text-ink-2 leading-relaxed">{ins.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
