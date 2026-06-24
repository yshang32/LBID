import { Outlet, useLocation } from "react-router";
import { Bell, HelpCircle, Search } from "lucide-react";
import { Sidebar } from "../components/Sidebar";

const PAGE_TITLES: Record<string, string> = {
  "/":                   "Today",
  "/opportunities":      "Opportunities",
  "/active-bids":        "Active Bids",
  "/my-routes":          "My Routes",
  "/analytics":          "Analytics",
  "/requests":           "My Requests",
  "/requests/new":       "New Request",
  "/quotations/compare": "Compare Bids",
  "/orders":             "Orders",
  "/community":          "Community",
  "/forwarders":         "Forwarder Directory",
  "/profile":            "Company Profile",
  "/subscription":       "Membership",
  "/tokens":             "Token Wallet",
  "/notifications":      "Notifications",
  "/admin":              "Admin Dashboard",
  "/admin/requests":     "Admin · Requests",
  "/admin/accounts":     "Admin · Accounts",
  "/admin/payments":     "Admin · Payments",
  "/admin/audit":        "Admin · Audit Trail",
};

function TopBar() {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? "LBID";

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between
                 h-14 px-9 border-b border-line
                 bg-white/80 backdrop-blur-xl"
    >
      {/* Left: page title + date */}
      <div className="flex items-center gap-3">
        <span className="text-[14px] font-semibold text-ink tracking-[-0.2px]">
          {title}
        </span>
        <span className="text-[13px] text-ink-3 pl-3 border-l border-line">
          Tuesday, 23 June 2026
        </span>
      </div>

      {/* Right: global actions */}
      <div className="flex items-center gap-1">
        <IconBtn aria-label="Search">
          <Search className="w-4 h-4" strokeWidth={1.75} />
        </IconBtn>

        <div className="relative">
          <IconBtn aria-label="Notifications">
            <Bell className="w-4 h-4" strokeWidth={1.75} />
          </IconBtn>
          {/* Notification dot — absolute, decorative */}
          <span
            aria-hidden
            className="absolute top-[8px] right-[8px] w-[5px] h-[5px] rounded-full bg-gold border-[1.5px] border-white pointer-events-none"
          />
        </div>

        <IconBtn aria-label="Help">
          <HelpCircle className="w-4 h-4" strokeWidth={1.75} />
        </IconBtn>

        <div className="w-px h-5 bg-line mx-2" />

        {/* Live status chip */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-line shadow-[0_1px_4px_rgba(0,0,0,0.05)]">
          <span className="w-[6px] h-[6px] rounded-full bg-emerald flex-shrink-0" />
          <span className="text-[12px] font-medium text-ink-2">Bidding open</span>
        </div>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  "aria-label": label,
}: {
  children: React.ReactNode;
  "aria-label": string;
}) {
  return (
    <button
      aria-label={label}
      className="w-[34px] h-[34px] flex items-center justify-center rounded-lg text-ink-3
                 transition-all duration-200 ease-in-out cursor-pointer
                 hover:bg-white hover:text-ink hover:shadow-[0_1px_6px_rgba(0,0,0,0.07)]
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30
                 active:scale-95"
    >
      {children}
    </button>
  );
}

/* ── Root Layout ──────────────────────────────────── */
export function RootLayout() {
  return (
    <div
      className="flex h-screen font-sans text-ink overflow-hidden"
      style={{ background: "linear-gradient(150deg, #F0F2F8 0%, #ECEEF5 100%)" }}
    >
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />

        {/* Page content rendered here by React Router */}
        <div
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#D1D6E0 transparent" }}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
