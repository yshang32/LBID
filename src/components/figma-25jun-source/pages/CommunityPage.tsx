import { useState } from "react";
import {
  Star, Shield, CheckCircle2, AlertTriangle,
  Send, MessageSquare, ThumbsUp, MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

/* Compliance: detect contact info attempts */
const CONTACT_PATTERNS = [
  /\b[\w.-]+@[\w.-]+\.\w{2,}\b/i,           // email
  /(\+?\d[\d\s\-()]{8,})/,                   // phone
  /whatsapp|wechat|telegram|line\s?app/i,    // messaging apps
  /\bww?w?\.\S+\.\S+/i,                      // website URL
  /contact\s+me\s+(directly|outside)/i,      // solicitation
];

function hasContactInfo(text: string): boolean {
  return CONTACT_PATTERNS.some(p => p.test(text));
}

type PostType = "Company update" | "Route insight" | "Certification" | "Completed milestone";

const POST_TYPES: PostType[] = ["Company update", "Route insight", "Certification", "Completed milestone"];

const POST_TYPE_CFG: Record<PostType, { color: string; bg: string; border: string }> = {
  "Company update":      { color: "text-navy",      bg: "bg-navy-soft",    border: "border-navy/20"      },
  "Route insight":       { color: "text-blue-700",  bg: "bg-blue-50",      border: "border-blue-200"     },
  "Certification":       { color: "text-gold-dark", bg: "bg-gold-soft",    border: "border-gold-border"  },
  "Completed milestone": { color: "text-emerald",   bg: "bg-emerald-soft", border: "border-emerald/20"   },
};

interface Post {
  id: number; company: string; country: string;
  rating: number; verified: boolean; premier: boolean;
  type: PostType; content: string; routes: string[];
  timestamp: string; likes: number; comments: number;
}

const FEED_POSTS: Post[] = [
  {
    id: 1, company: "Pacific Forward Ltd.", country: "HK", rating: 4.9, verified: true, premier: true,
    type: "Completed milestone",
    content: "Proud to announce our 150th completed order on LBID across Vietnam to HKG air freight. Thank you to all agency partners who trusted us with time-sensitive cargo.",
    routes: ["Vietnam to HKG"], timestamp: "2 hours ago", likes: 14, comments: 3,
  },
  {
    id: 2, company: "Orient Cargo Solutions", country: "HK", rating: 4.8, verified: true, premier: true,
    type: "Route insight",
    content: "Air capacity on PVG to HKG is tightening ahead of the Q3 peak season. If your cargo pickup is in late July, we recommend a 14-day lead time for booking. SGN to HKG lanes remain stable.",
    routes: ["Vietnam to HKG"], timestamp: "2 hours ago", likes: 14, comments: 3,
  },
  {
    id: 3, company: "Blue Ocean Freight HK", country: "HK", rating: 4.7, verified: true, premier: false,
    type: "Certification",
    content: "We are pleased to confirm renewal of our IATA Cargo Agent accreditation for 2026-2027. This covers all air freight lanes we operate, including BKK, KUL, and CGK routes to HKG.",
    routes: ["Thailand to HKG", "Malaysia to HKG", "Indonesia to HKG"], timestamp: "Yesterday", likes: 21, comments: 5,
  },
  {
    id: 4, company: "Trans-Pacific Logistics HK", country: "HK", rating: 4.5, verified: true, premier: false,
    type: "Company update",
    content: "We have expanded our cold-chain capability with temperature-controlled units at our HKG warehouse, supporting Temp 2-8 C for pharmaceutical and food shipments from Japan and South Korea.",
    routes: ["Japan to HKG", "South Korea to HKG"], timestamp: "2 days ago", likes: 7, comments: 2,
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className="w-3 h-3" strokeWidth={1.5}
          fill={n <= Math.round(rating) ? "#C49A3C" : "none"}
          stroke={n <= Math.round(rating) ? "#C49A3C" : "#D1D6E0"} />
      ))}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const cfg = POST_TYPE_CFG[post.type];
  return (
    <div className="bg-white rounded-[16px] border border-line p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-[11px] bg-navy-soft flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-navy">{post.company.split(" ").map(w => w[0]).slice(0,2).join("")}</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[13.5px] font-semibold text-ink">{post.company}</p>
              {post.verified && <Shield className="w-3.5 h-3.5 text-emerald" strokeWidth={2} />}
              {post.premier && <span className="text-[9.5px] font-bold text-gold-dark bg-gold-soft border border-gold-border px-1.5 py-0.5 rounded-full">Premier</span>}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Stars rating={post.rating} />
              <span className="text-[11px] text-ink-3">{post.country} · {post.timestamp}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
            {post.type}
          </span>
          <button className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-3 hover:bg-canvas transition-all cursor-pointer">
            <MoreHorizontal className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <p className="text-[13.5px] text-ink-2 leading-relaxed">{post.content}</p>

      <div className="flex items-center gap-2 flex-wrap">
        {post.routes.map(r => (
          <span key={r} className="text-[11px] font-medium text-ink-2 bg-canvas border border-line px-2 py-0.5 rounded-full">{r}</span>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-3 border-t border-line-light">
        <button className="flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-navy transition-colors cursor-pointer">
          <ThumbsUp className="w-3.5 h-3.5" strokeWidth={1.75} /> {post.likes}
        </button>
        <button className="flex items-center gap-1.5 text-[12px] text-ink-3 hover:text-navy transition-colors cursor-pointer">
          <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} /> {post.comments}
        </button>
        <span className="ml-auto text-[11px] text-ink-3">
          {post.company.split(" ")[0]} · via LBID
        </span>
      </div>
    </div>
  );
}

export function CommunityPage() {
  const [draft,      setDraft]      = useState("");
  const [postType,   setPostType]   = useState<PostType>("Company update");
  const [published,  setPublished]  = useState(false);
  const [posts,      setPosts]      = useState(FEED_POSTS);

  const complianceViolation = hasContactInfo(draft);
  const canPost = draft.trim().length > 20 && !complianceViolation;

  function handlePost() {
    if (!canPost) return;
    const newPost: Post = {
      id: Date.now(), company: "Pacific Forward Ltd.", country: "HK",
      rating: 4.9, verified: true, premier: true,
      type: postType, content: draft.trim(),
      routes: ["Vietnam to HKG"],
      timestamp: "Just now", likes: 0, comments: 0,
    };
    setPosts(prev => [newPost, ...prev]);
    setDraft("");
    setPublished(true);
    setTimeout(() => setPublished(false), 3000);
  }

  return (
    <div className="px-9 pt-8 pb-14 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-ink tracking-[-0.7px] leading-[1.1] mb-1.5 m-0">Community</h1>
          <p className="text-[14px] text-ink-3">Verified logistics companies sharing capability, milestones and market insight.</p>
        </div>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 280px" }}>
        {/* Main feed */}
        <div className="flex flex-col gap-5">

          {/* Composer */}
          <div className="bg-white rounded-[18px] border border-line p-5"
            style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-navy-soft flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-navy">PF</span>
              </div>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                rows={3}
                placeholder="Share a company update, route insight, certification or milestone."
                className="flex-1 bg-transparent outline-none text-[13.5px] text-ink placeholder:text-ink-3 resize-none leading-relaxed"
              />
            </div>

            {/* Post type selector */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {POST_TYPES.map(t => {
                const cfg = POST_TYPE_CFG[t];
                return (
                  <button key={t} onClick={() => setPostType(t)}
                    className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-all duration-200 cursor-pointer border
                      ${postType === t ? `${cfg.color} ${cfg.bg} ${cfg.border}` : "text-ink-3 border-line hover:border-navy/20 hover:bg-canvas"}`}>
                    {t}
                  </button>
                );
              })}
            </div>

            {/* Compliance warning */}
            <AnimatePresence>
              {complianceViolation && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <p className="text-[12.5px] font-semibold text-amber-800">Contact information detected</p>
                      <p className="text-[12px] text-amber-700 mt-0.5 leading-relaxed">
                        Public posts cannot include phone numbers, email addresses, WhatsApp links, website URLs or invitations to contact outside LBID.
                        Interested companies can discover you through the <span className="font-medium">LBID Directory</span> and connect after award.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success flash */}
            <AnimatePresence>
              {published && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-emerald-soft border border-emerald/20 mb-3"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald" strokeWidth={2} />
                  <span className="text-[12.5px] font-medium text-emerald">Post published to Community</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-between">
              <span className="text-[11.5px] text-ink-3">
                {draft.length > 0 && `${draft.length} characters`}
              </span>
              <button
                onClick={handlePost}
                disabled={!canPost}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-[12.5px] font-semibold
                           transition-all duration-200 cursor-pointer
                           hover:enabled:bg-navy-hover hover:enabled:-translate-y-[1px] hover:enabled:shadow-[0_4px_14px_rgba(12,26,62,0.24)]
                           disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={2} /> Post
              </button>
            </div>
          </div>

          {/* Feed */}
          <div className="flex flex-col gap-4">
            {posts.map(post => <PostCard key={post.id} post={post} />)}
          </div>
        </div>

        {/* Guidelines sidebar */}
        <div className="flex flex-col gap-4 sticky top-4 self-start">
          <div className="bg-white rounded-[16px] border border-line p-5">
            <p className="text-[12.5px] font-bold text-ink mb-3">Community Guidelines</p>
            <div className="flex flex-col gap-3">
              {[
                { icon: CheckCircle2, color: "text-emerald", text: "Share verified route capability, certifications, milestones and market insight." },
                { icon: CheckCircle2, color: "text-emerald", text: "Keep commercial discussions and documents inside LBID order messages after award." },
                { icon: AlertTriangle, color: "text-amber-600", text: "Never post contact details (phone, email, WhatsApp, website). These are blocked automatically." },
                { icon: AlertTriangle, color: "text-amber-600", text: "Repeated off-platform solicitation may affect your directory visibility and reputation score." },
              ].map((g, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <g.icon className={`w-4 h-4 ${g.color} flex-shrink-0 mt-0.5`} strokeWidth={2} />
                  <p className="text-[12px] text-ink-2 leading-relaxed">{g.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-navy-soft rounded-[16px] border border-navy/15 p-5">
            <p className="text-[12px] font-semibold text-navy mb-2">Contact unlock policy</p>
            <p className="text-[12px] text-ink-2 leading-relaxed">
              Contact details are only unlocked for both parties <strong className="font-medium text-navy">after a bid is awarded</strong>. This ensures all commercial activity is properly recorded and both parties are protected.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
