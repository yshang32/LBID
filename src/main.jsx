import React, { useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Check,
  Clock,
  Database,
  EyeOff,
  FileCheck,
  Gavel,
  Globe2,
  Handshake,
  MailCheck,
  Search,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
} from 'lucide-react'
import './styles.css'

const requestRows = [
  ['HK-IN-24018', 'Mumbai, India', 'Airport pickup + HK B2B delivery', '30 kg electronic components', '2h 15m', '6', 'Open'],
  ['HK-MY-24021', 'Kuala Lumpur, Malaysia', 'Warehouse receiving + 18 local drops', '96 kg ecommerce parcels', '5h 40m', '4', 'Open'],
  ['HK-IN-24009', 'Delhi, India', 'Same-day document delivery', '12 envelopes', 'Closed', '8', 'Awarded'],
]

const fallbackLeadRows = [
  ['A.S. Logistics Sdn Bhd', 'Malaysia', 'Klang', 'general@aslogistics.com.my', 'FMFF membership directory', '85'],
  ['Advance International Freight Sdn Bhd', 'Malaysia', 'Kuala Lumpur', 'imports-kul@fmlogistics.com', 'FMFF membership directory', '85'],
  ['Astraco Freight Forwarders Sdn Bhd', 'Malaysia', 'Klang', 'cs@astraco.com.my', 'FMFF membership directory', '85'],
  ['24X7 Logistics Private Limited', 'India', 'Mumbai', 'Email required', 'FIATA India directory', '75'],
  ['Aargus Global Logistics Pvt. Ltd.', 'India', 'New Delhi', 'Email required', 'FIATA India directory', '75'],
]

const copy = {
  en: {
    nav: ['Proposal', 'Bid Board', 'Agency Request', 'Plans', 'Trust', 'Leads'],
    brandSub: 'Inbound bid desk',
    topLabel: 'HK Inbound Local Delivery',
    topText: 'A private bidding desk connecting SEA agency shipment requests with verified Hong Kong local logistics capacity.',
    heroEyebrow: 'ForwardFlow Pilot',
    heroTitle: 'Enterprise bid desk for Hong Kong inbound local delivery',
    heroText: 'Agencies submit requests for free. Hong Kong logistics partners pay for verified opportunities and submit sealed bids before expiry.',
    heroPrimary: 'HKD 588 pilot',
    heroSecondary: 'Sealed bid workflow',
    activeRequests: 'Active requests',
    sealedBids: 'Sealed bids',
    markets: 'Agency markets',
    verified: 'Email verified',
    proposalTitle: 'Pilot proposal for Hong Kong logistics companies',
    proposalText: 'A focused 30-day pilot designed for local delivery operators that have capacity but need overseas agency demand.',
    why: 'Why it matters',
    what: 'What we deliver',
    pilot: 'Pilot offer',
    criteria: 'Success criteria',
    boundary: 'Promise boundary',
    boardTitle: 'Sealed Bid Board',
    boardText: 'HK partners see request details and bid privately. Competitor prices stay hidden.',
    formTitle: 'Agency Shipment Request',
    formText: 'A controlled request intake for India and Malaysia agencies. Company email is required before publication.',
    plansTitle: 'HK Partner Plans',
    plansText: 'Pricing is based on access to verified inbound requests, not generic scraped contacts.',
    trustTitle: 'Trust, Verification and Records',
    trustText: 'We reduce risk with identity checks, bid logs, acceptance records and document trails.',
    leadsTitle: 'Agency Lead Evidence',
    leadsText: 'Public directory research supports the first invitation campaign into the request desk.',
    submitBid: 'Submit sealed bid',
    publish: 'Publish request',
    choosePlan: 'Choose plan',
    email: 'Company email',
    market: 'Origin market',
    service: 'Hong Kong service needed',
    weight: 'Weight',
    window: 'Bid window',
    notes: 'Shipment notes',
    recommended: 'Recommended',
    cards: {
      why: ['Local delivery companies have capacity but limited overseas sales channels.', 'SEA agencies need Hong Kong pickup, sorting, delivery and partner support.', 'Email chains and WhatsApp quotes are slow, unstructured and hard to audit.'],
      what: ['Verified agency request intake with email gate and manual review.', 'Private sealed bid board with deadline and winner selection.', 'Winner-only contact unlock with acceptance and document records.', 'Monthly reporting for requests, bids, response time and outcomes.'],
      pilot: ['HKD 588/month launch pilot for early partners.', '10 sealed bid credits included.', 'India and Malaysia agency sourcing included.', 'Weekly request and bid activity report.'],
      criteria: ['Verified overseas requests enter the bid board.', 'HK partner can review and submit sealed bids.', 'Every request has source, expiry and bid record.', 'No guarantee of closed customers or fixed shipment volume.'],
      boundary: ['We provide request access, data quality, verification workflow and bid records.', 'We do not promise every request becomes a paying customer.', 'Agency contact details stay hidden until approval or winner selection.', 'High-risk requests can be held for manual review.'],
    },
    trust: [['Domain verification', 'Company-domain emails score higher than free mailboxes.'], ['Business documents', 'Registration, licence, name card and address can be reviewed.'], ['Bid audit log', 'Price, lead time, validity, remarks and timestamp are recorded.'], ['Acceptance record', 'The selected bid creates a clear agreement trail.'], ['Document trail', 'Invoice, packing list, POD and change history can be attached.'], ['Verified badges', 'Email, business, document and transaction badges build confidence.']],
  },
  zh: {
    nav: ['Proposal', '競價看板', 'Agency 發單', 'Plan', '驗證', 'Leads'],
    brandSub: '香港入境競價台',
    topLabel: '香港入境本地派送',
    topText: '連接東南亞 agency 派送需求與香港本地物流運力的私密競價平台。',
    heroEyebrow: 'ForwardFlow Pilot',
    heroTitle: '企業級香港入境本地派送競價台',
    heroText: 'Agency 免費提交 request。香港物流公司付費接收已驗證生意機會，並在截止前提交完全不透明的 sealed bid。',
    heroPrimary: 'HKD 588 pilot',
    heroSecondary: 'Sealed bid workflow',
    activeRequests: '活躍 request',
    sealedBids: 'Sealed bids',
    markets: 'Agency 市場',
    verified: 'Email verified',
    proposalTitle: '給香港物流公司的 pilot proposal',
    proposalText: '30 日聚焦 pilot，專為有本地派送能力但缺少海外 agency demand 的物流公司而設。',
    why: '為甚麼值得做',
    what: '我們交付甚麼',
    pilot: 'Pilot offer',
    criteria: '成功標準',
    boundary: '承諾邊界',
    boardTitle: '不透明競價看板',
    boardText: '香港合作夥伴只看到 request 資料並私密出價，其他公司報價完全不公開。',
    formTitle: 'Agency 發單表格',
    formText: '印度和馬來西亞 agency 使用的受控 request intake。必須有公司 email 才能發佈。',
    plansTitle: '香港公司 Plan',
    plansText: '收費基於已驗證 inbound request access，而不是普通 scraped contact list。',
    trustTitle: '信任、驗證與紀錄',
    trustText: '用身份檢查、bid logs、acceptance records 和 document trails 降低雙方風險。',
    leadsTitle: 'Agency Lead 證據',
    leadsText: '公開 directory research 支持第一輪邀請 agency 進入 request desk。',
    submitBid: '提交 sealed bid',
    publish: '發佈 request',
    choosePlan: '選擇 plan',
    email: '公司 email',
    market: '出貨市場',
    service: '需要的香港服務',
    weight: '重量',
    window: '競價時限',
    notes: '貨物備註',
    recommended: '推薦',
    cards: {
      why: ['本地派送公司有運力，但缺少海外 agency 生意來源。', '東南亞 agency 需要香港 pickup、分貨、派送和 partner support。', 'Email 來回和 WhatsApp 報價慢、散亂、難追蹤。'],
      what: ['已驗證 agency request intake，包含 email gate 和人工審核。', '私密 sealed bid 看板，包含 deadline 和 winner selection。', '只有 winner 解鎖 contact，並保存 acceptance 和文件紀錄。', '每月報告 request、bid、response time 和 outcome。'],
      pilot: ['早期 partner launch pilot：HKD 588/月。', '包括 10 個 sealed bid credits。', '包括印度和馬來西亞 agency sourcing。', '每星期提供 request 和 bid activity report。'],
      criteria: ['已驗證海外 request 進入競價看板。', '香港 partner 可以審閱並提交 sealed bid。', '每個 request 有 source、expiry 和 bid record。', '不保證成交客戶或固定貨量。'],
      boundary: ['我們提供 request access、data quality、verification workflow 和 bid records。', '我們不承諾每個 request 一定變成付費客戶。', '未審核或未選中 winner 前，不公開 agency 聯絡資料。', '高風險 request 可以保留作人工審核。'],
    },
    trust: [['Domain verification', '公司 domain email 比免費 mailbox 風險分更低。'], ['Business documents', '可審核公司註冊、牌照、名片和地址。'], ['Bid audit log', '保存價格、時效、有效期、備註和 timestamp。'], ['Acceptance record', '被選中的 bid 會形成清晰 agreement trail。'], ['Document trail', 'Invoice、packing list、POD 和修改紀錄可以上傳。'], ['Verified badges', 'Email、business、document、transaction badges 增加信任。']],
  },
}

const viewKeys = ['proposal', 'board', 'form', 'plans', 'trust', 'leads']

function App() {
  const [lang, setLang] = useState('zh')
  const [view, setView] = useState('proposal')
  const [email, setEmail] = useState('')
  const [search, setSearch] = useState('')
  const c = copy[lang]
  const filteredLeads = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return leadRows.filter((lead) => !needle || lead.join(' ').toLowerCase().includes(needle))
  }, [search])

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><Truck size={24} /><div><strong>ForwardFlow</strong><span>{c.brandSub}</span></div></div>
        <nav>{c.nav.map((item, index) => <button className={view === viewKeys[index] ? 'active' : ''} key={item} onClick={() => setView(viewKeys[index])}>{item}</button>)}</nav>
        <div className="pilotBox"><small>Launch pilot</small><strong>India / Malaysia to HK</strong><span>Agency free. HK partners pay to bid.</span></div>
      </aside>
      <main>
        <header className="topbar"><div><small>{c.topLabel}</small><span>{c.topText}</span></div><button onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}><Globe2 size={16} />{lang === 'en' ? '中文' : 'EN'}</button></header>
        <section className="hero"><div><small>{c.heroEyebrow}</small><h1>{c.heroTitle}</h1><p>{c.heroText}</p><div className="heroActions"><button className="primary"><Sparkles size={16} />{c.heroPrimary}</button><span>{c.heroSecondary}</span></div></div><div className="heroCard"><small>Trust layer</small><strong>Verified request access</strong><p>Sealed bids · Email gate · Winner unlock · Audit trail</p></div></section>
        <section className="metrics">
          <Metric icon={Clock} label={c.activeRequests} value="3" sub="2 open · 1 awarded" />
          <Metric icon={EyeOff} label={c.sealedBids} value="18" sub="Private by default" />
          <Metric icon={Database} label={c.markets} value={leadSummary ? String(Object.keys(leadSummary.countries || {}).length) : "7"} sub="IN / MY / ID / PH / VN / KH / BD" />
          <Metric icon={ShieldCheck} label={c.verified} value={leadSummary ? String(leadSummary.totalEmailLeads) : "50"} sub="Email gate passed" />
        </section>
        {view === 'proposal' && <Proposal c={c} />}
        {view === 'board' && <Board c={c} />}
        {view === 'form' && <AgencyForm c={c} email={email} setEmail={setEmail} />}
        {view === 'plans' && <Plans c={c} />}
        {view === 'trust' && <Trust c={c} />}
        {view === 'leads' && <Leads c={c} search={search} setSearch={setSearch} leads={filteredLeads} />}
      </main>
    </div>
  )
}

function Metric({ icon: Icon, label, value, sub }) { return <div className="panel metric"><div><small>{label}</small><strong>{value}</strong><span>{sub}</span></div><Icon /></div> }
function CardList({ title, items, icon: Icon }) { return <div className="panel"><h2><Icon size={20} />{title}</h2><div className="list">{items.map((item) => <p key={item}><Check size={16} />{item}</p>)}</div></div> }
function Proposal({ c }) { return <div className="stack"><div className="panel proposalHead"><div><h2>{c.proposalTitle}</h2><p>{c.proposalText}</p></div><div className="price"><small>Launch pilot</small><strong>HKD 588</strong><span>per month</span></div></div><div className="grid2"><CardList title={c.why} items={c.cards.why} icon={Users} /><CardList title={c.what} items={c.cards.what} icon={Handshake} /><CardList title={c.pilot} items={c.cards.pilot} icon={Gavel} /><CardList title={c.criteria} items={c.cards.criteria} icon={FileCheck} /></div><CardList title={c.boundary} items={c.cards.boundary} icon={ShieldCheck} /></div> }
function Board({ c }) { return <div className="gridBoard"><div className="panel tablePanel"><h2>{c.boardTitle}</h2><p>{c.boardText}</p><table><thead><tr><th>ID</th><th>Origin</th><th>Service</th><th>Cargo</th><th>Deadline</th><th>Bids</th><th>Status</th></tr></thead><tbody>{requestRows.map((r) => <tr key={r[0]}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><strong>{r[4]}</strong></td><td>{r[5]}</td><td><span className={r[6] === 'Open' ? 'badge green' : 'badge gold'}>{r[6]}</span></td></tr>)}</tbody></table></div><div className="stack">{requestRows.slice(0,2).map((r) => <div className="panel dealCard" key={r[0]}><span className="badge green">{r[0]}</span><h3>{r[3]}</h3><p>{r[2]}</p><div className="facts"><span>Deadline<b>{r[4]}</b></span><span>Bid range<b>HKD 780-1,150</b></span><span>Agency<b>Email verified</b></span></div><button className="primary"><Gavel size={16} />{c.submitBid}</button></div>)}</div></div> }
function AgencyForm({ c, email, setEmail }) { const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); return <div className="gridBoard"><div className="panel"><h2>{c.formTitle}</h2><p>{c.formText}</p><div className="formGrid"><label>{c.email}<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ops@agency.com" /></label><label>{c.market}<select><option>India</option><option>Malaysia</option></select></label><label>{c.service}<select><option>Airport pickup + Hong Kong local delivery</option><option>Warehouse receiving + parcel sorting</option><option>B2B delivery in Hong Kong</option></select></label><label>{c.weight}<input defaultValue="30 kg" /></label><label>{c.window}<select><option>2 hours</option><option>6 hours</option><option>24 hours</option></select></label><label className="wide">{c.notes}<textarea defaultValue="Electronic components. Need pickup from HKG cargo terminal and delivery to Kwai Chung warehouse." /></label></div><button disabled={!valid} className="primary"><MailCheck size={16} />{c.publish}</button></div><div className="panel trustAside"><MailCheck className="accent" /><h3>Email gate</h3><p>Request cannot be published until a valid agency email is captured and manually reviewed.</p></div></div> }
function Plans({ c }) { return <div className="stack"><div className="panel"><h2>{c.plansTitle}</h2><p>{c.plansText}</p></div><div className="plans">{[['Launch Pilot','HKD 588','10 bid credits'],['Growth Partner','HKD 1,488','40 bid credits + priority alerts'],['Market Leader','HKD 3,888','High-volume bids + managed support']].map((p,i) => <div className={i===1 ? 'panel plan hot' : 'panel plan'} key={p[0]}><h3>{p[0]}</h3><strong>{p[1]}</strong><span>{p[2]}</span><small>Monthly pilot pricing</small><button className="primary">{c.choosePlan}</button></div>)}</div></div> }
function Trust({ c }) { return <div className="stack"><div className="panel"><h2>{c.trustTitle}</h2><p>{c.trustText}</p></div><div className="grid3">{c.trust.map(([title, body]) => <div className="panel trustCard" key={title}><ShieldCheck className="accent" /><h3>{title}</h3><p>{body}</p></div>)}</div></div> }
function Leads({ c, search, setSearch, leads }) { return <div className="panel tablePanel"><div className="tableHead"><div><h2>{c.leadsTitle}</h2><p>{c.leadsText}</p></div><div className="search"><Search size={16} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company" /></div></div><table><thead><tr><th>Company</th><th>Market</th><th>Contact</th><th>Source</th><th>Quality</th></tr></thead><tbody>{leads.map((lead) => <tr key={lead[0]}><td><strong>{lead[0]}</strong></td><td>{lead[1]} · {lead[2]}</td><td>{lead[3]}</td><td>{lead[4]}</td><td><span className={lead[3] === 'Email required' ? 'badge gold' : 'badge green'}>{lead[5]}</span></td></tr>)}</tbody></table></div> }

createRoot(document.getElementById('root')).render(<App />)