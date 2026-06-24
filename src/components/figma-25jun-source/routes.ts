import { createBrowserRouter } from "react-router";

import { AuthLayout }          from "./layouts/AuthLayout";
import { RootLayout }          from "./layouts/RootLayout";

// Auth + Onboarding
import { AuthPage }            from "./pages/AuthPage";
import { OnboardingPage }      from "./pages/OnboardingPage";

// Today Workspace
import { TodayPage }           from "./pages/TodayPage";

// Forwarder
import { OpportunitiesPage }   from "./pages/OpportunitiesPage";
import { QuoteConsolePage }    from "./pages/QuoteConsolePage";
import { ActiveBidsPage }      from "./pages/ActiveBidsPage";
import { MyRoutesPage }        from "./pages/MyRoutesPage";
import { AnalyticsPage }       from "./pages/AnalyticsPage";

// Client
import { MyRequestsPage }      from "./pages/MyRequestsPage";
import { CreateRequestPage }   from "./pages/CreateRequestPage";
import { RequestDetailPage }   from "./pages/RequestDetailPage";
import { QuoteComparisonPage } from "./pages/QuoteComparisonPage";

// Shared
import { OrdersPage }          from "./pages/OrdersPage";
import { OrderWorkspacePage }  from "./pages/OrderWorkspacePage";
import { NotificationsPage }   from "./pages/NotificationsPage";
import { CommunityPage }       from "./pages/CommunityPage";

// Directory + Profile + Account
import { ForwardersPage }         from "./pages/ForwardersPage";
import { ForwarderProfilePage }   from "./pages/ForwarderProfilePage";
import { CompanyProfilePage }     from "./pages/CompanyProfilePage";
import { SubscriptionPage }       from "./pages/SubscriptionPage";
import { TokenWalletPage }        from "./pages/TokenWalletPage";

// Admin
import { AdminDashboardPage }  from "./pages/AdminDashboardPage";
import { AdminRequestsPage }   from "./pages/AdminRequestsPage";
import { AdminAccountsPage }   from "./pages/AdminAccountsPage";
import { AdminPaymentsPage }   from "./pages/AdminPaymentsPage";
import { AdminAuditPage }      from "./pages/AdminAuditPage";

export const router = createBrowserRouter([
  /* ── No-sidebar ──────────────────────────────── */
  {
    path: "/auth",
    Component: AuthLayout,
    children: [{ index: true, Component: AuthPage }],
  },
  {
    path: "/onboarding",
    Component: OnboardingPage,
  },

  /* ── App shell ────────────────────────────────── */
  {
    path: "/",
    Component: RootLayout,
    children: [
      // Dashboard
      { index: true,                 Component: TodayPage           },

      // Forwarder
      { path: "opportunities",       Component: OpportunitiesPage   },
      { path: "opportunities/:id",   Component: QuoteConsolePage    },
      { path: "active-bids",         Component: ActiveBidsPage      },
      { path: "my-routes",           Component: MyRoutesPage        },
      { path: "analytics",           Component: AnalyticsPage       },

      // Client
      { path: "requests",            Component: MyRequestsPage      },
      { path: "requests/new",        Component: CreateRequestPage   },
      { path: "requests/:id",        Component: RequestDetailPage   },
      { path: "quotations/compare",  Component: QuoteComparisonPage },

      // Shared
      { path: "orders",              Component: OrdersPage          },
      { path: "orders/:id",          Component: OrderWorkspacePage  },
      { path: "notifications",       Component: NotificationsPage   },
      { path: "community",           Component: CommunityPage       },

      // Directory + Account
      { path: "forwarders",          Component: ForwardersPage      },
      { path: "forwarders/:slug",    Component: ForwarderProfilePage},
      { path: "profile",             Component: CompanyProfilePage  },
      { path: "subscription",        Component: SubscriptionPage    },
      { path: "tokens",              Component: TokenWalletPage     },

      // Admin
      { path: "admin",               Component: AdminDashboardPage  },
      { path: "admin/requests",      Component: AdminRequestsPage   },
      { path: "admin/accounts",      Component: AdminAccountsPage   },
      { path: "admin/payments",      Component: AdminPaymentsPage   },
      { path: "admin/audit",         Component: AdminAuditPage      },
    ],
  },
]);
