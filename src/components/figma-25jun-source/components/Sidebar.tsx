import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, Send, FileText, Package,
  Zap, Bell, Settings, ChevronRight, Plus,
  Users, Building2, Crown, ShieldCheck,
  Briefcase, Map, BarChart2, MessageCircle,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import lbidLogo from "../../imports/_____.png";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Today",          to: "/",              end: true,  badge: 0, badgeRed: false },
  // Forwarder
  { icon: Send,            label: "Opportunities",  to: "/opportunities", end: false, badge: 0, badgeRed: false },
  { icon: Briefcase,       label: "Active Bids",    to: "/active-bids",   end: false, badge: 0, badgeRed: false },
  // Client
  { icon: FileText,        label: "My Requests",    to: "/requests",      end: false, badge: 0, badgeRed: false },
  // Shared
  { icon: Package,         label: "Orders",         to: "/orders",        end: false, badge: 0, badgeRed: false },
  { icon: Bell,            label: "Notifications",  to: "/notifications", end: false, badge: 2, badgeRed: true  },
];

const NAV_SECONDARY = [
  { icon: Map,             label: "My Routes",      to: "/my-routes",     end: false },
  { icon: BarChart2,       label: "Analytics",      to: "/analytics",     end: false },
  { icon: Users,           label: "Directory",      to: "/forwarders",    end: false },
  { icon: MessageCircle,   label: "Community",      to: "/community",     end: false },
];

const ADMIN_ITEMS = [
  { icon: ShieldCheck, label: "Admin",    to: "/admin",           end: true  },
  { icon: FileText,    label: "Requests", to: "/admin/requests",  end: false },
  { icon: Building2,   label: "Accounts", to: "/admin/accounts",  end: false },
  { icon: Crown,       label: "Payments", to: "/admin/payments",  end: false },
];

export function Sidebar() {
  const navigate = useNavigate();

  return (
    <aside className="w-[228px] flex-shrink-0 flex flex-col bg-white border-r border-line">

      {/* ── Logo ──────────────────────────────────────────
          No explicit background — sidebar is bg-white, so the logo's
          white areas blend seamlessly via multiply (white × white = white).
          No border line below.
      */}
      <div style={{ overflow: "hidden", height: "88px" }}>
        <ImageWithFallback
          src={lbidLogo}
          alt="LBID — Logistics Bidding Platform"
          style={{
            width: "272px",
            height: "auto",
            display: "block",
            mixBlendMode: "multiply",
            userSelect: "none",
            marginTop: "-28px",
            marginLeft: "-12px",
          }}
          draggable={false}
        />
      </div>

      {/* ── Quick action ──────────────────────────────── */}
      <div className="px-3 mb-3">
        <button
          onClick={() => navigate("/requests/new")}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-line
                     text-[12.5px] font-medium text-ink-3 transition-all duration-200 ease-in-out cursor-pointer
                     hover:border-navy hover:text-navy hover:bg-navy-soft"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} /> New Request
        </button>
      </div>

      {/* ── Navigation ────────────────────────────────── */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map(({ icon: Icon, label, to, end, badge, badgeRed }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] transition-all duration-200 ease-in-out
               ${isActive
                 ? "bg-navy text-white font-medium cursor-default"
                 : "font-normal text-ink-2 hover:bg-navy-soft hover:text-ink cursor-pointer"
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.75} />
                {label}
                {badge > 0 && !isActive && (
                  <span
                    className={`ml-auto w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center
                      ${badgeRed ? "bg-red-500" : "bg-navy"}`}
                  >
                    {badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Secondary nav ──────────────────────────────── */}
      <div className="px-3 mb-1 mt-1 pt-2 border-t border-line-light flex flex-col gap-0.5">
        {NAV_SECONDARY.map(({ icon: Icon, label, to, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-[8px] rounded-xl text-[12.5px] transition-all duration-200 ease-in-out
               ${isActive ? "bg-navy text-white font-medium cursor-default" : "text-ink-3 hover:bg-navy-soft hover:text-ink cursor-pointer"}`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-[14px] h-[14px] flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* ── Token + Profile + Subscription ─────────────── */}
      <div className="px-3 mb-1 flex flex-col gap-0.5">
        {[
          { to: "/tokens",       label: "Token Wallet", icon: Zap,      badge: "12", badgeStyle: "bg-gold-soft text-gold-dark border border-gold-border" },
          { to: "/profile",      label: "Profile",      icon: Building2, badge: "",  badgeStyle: "" },
          { to: "/subscription", label: "Membership",   icon: Crown,     badge: "",  badgeStyle: "" },
        ].map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] transition-all duration-200 ease-in-out
               ${isActive ? "bg-navy text-white font-medium" : "text-ink-2 hover:bg-navy-soft hover:text-ink cursor-pointer"}`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.75} />
                <span>{item.label}</span>
                {item.badge && !isActive && (
                  <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${isActive ? "bg-white/20 text-white" : item.badgeStyle}`}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* ── Admin section ──────────────────────────────── */}
      <div className="px-3 mb-2 pt-2 border-t border-line-light mt-1">
        <p className="text-[9.5px] font-bold text-ink-3 uppercase tracking-[0.09em] px-3 mb-1">Admin</p>
        {ADMIN_ITEMS.map(({ icon: Icon, label, to, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-[8px] rounded-xl text-[12.5px] transition-all duration-200 ease-in-out
               ${isActive
                 ? "bg-amber-600 text-white font-medium"
                 : "text-ink-3 hover:bg-amber-50 hover:text-amber-700 cursor-pointer"
               }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-[14px] h-[14px] flex-shrink-0" strokeWidth={isActive ? 2.2 : 1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* ── Footer ────────────────────────────────────── */}
      <div className="flex flex-col gap-3 px-3 pb-6 pt-3 border-t border-line-light">
        <button className="flex items-center gap-3 px-3 py-[9px] rounded-xl text-[13px] font-normal text-ink-2 w-full text-left
                           transition-all duration-200 ease-in-out hover:bg-navy-soft hover:text-ink cursor-pointer">
          <Settings className="w-[15px] h-[15px] flex-shrink-0" strokeWidth={1.75} />
          Settings
        </button>

        {/* Premier membership badge — gradient border */}
        <div
          className="p-[1.5px] rounded-[13px]"
          style={{ background: "linear-gradient(135deg, #E8D9A0, #C49A3C 50%, #E8D9A0)" }}
        >
          <div className="flex flex-col gap-1.5 px-3 py-2.5 rounded-[11.5px] bg-gold-soft">
            <div className="flex items-center gap-2">
              <div className="w-[18px] h-[18px] rounded-full bg-gold flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[9px] font-bold leading-none select-none">★</span>
              </div>
              <span className="text-[10.5px] font-bold tracking-[0.07em] uppercase text-gold-dark select-none">
                Premier Forwarder
              </span>
            </div>
            <p className="text-[11px] text-gold leading-[1.4]">Priority access · 3 routes certified</p>
          </div>
        </div>

        {/* User profile */}
        <div className="flex items-center gap-2.5 px-1 group cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-navy-soft border border-line flex items-center justify-center flex-shrink-0
                          transition-all duration-200 group-hover:border-navy/30">
            <span className="text-[11px] font-bold text-navy select-none">KL</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-medium text-ink truncate">Kenny Lam</p>
            <p className="text-[11px] text-ink-3 truncate">Pacific Forward Ltd.</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-line flex-shrink-0 transition-colors duration-200 group-hover:text-ink-3" strokeWidth={2} />
        </div>
      </div>
    </aside>
  );
}
