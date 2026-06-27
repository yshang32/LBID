# LBID P0-P2 Readiness Audit

Last updated: 2026-06-27

This file tracks the current product readiness after the Figma UI migration. The source of truth remains the Next.js + Supabase app under `src/app`, `src/components`, and `src/lib`.

## P0 - Core User Flow

| Area | Current state | User-facing result | Remaining work |
| --- | --- | --- | --- |
| Auth gate | Implemented through `SessionGate` in `src/app/[locale]/layout.tsx`. Public pages are auth, bid demo, product preview and demo cases. | Logged-out users are redirected to `/zh/auth` or `/en/auth`. | Add stronger middleware-level redirect later if we need server-side protection before hydration. |
| Login / sign up | Supabase Auth UI exists at `/[locale]/auth`. | User can enter through the official auth entry instead of seeing the workspace first. | Add polished success, failure and email-verification states. |
| Unified company account | Onboarding page uses client + forwarder capability model. | One company can enable request creation and bidding, instead of being locked to one role. | Store richer capability metadata and admin approval state. |
| Dashboard / Today | Rebuilt with Figma-style workspace UI. | User sees priority opportunity, stats, activity and next actions. | Replace demo cards with live tasks from SR, bid, document and payment APIs. |
| Marketplace / Opportunities | Rebuilt with Figma-style opportunity queue. | Forwarder can visually understand recommended vs open bidding. | Bind recommendation cards to `/api/shipment-requests` and match score data. |
| Bid detail / Quote console | Rebuilt with sealed quote UI. | Bid flow communicates match score, urgency, sealed quote and token cost. | Submit quote to `/api/bids` using live SR ID and show RPC result. |
| Requests / Create SR / Request detail | Figma-style pages are routed. Real onboarding remains API-backed. | Agency/client flow is visually coherent. | Connect create/detail pages fully to `/api/shipment-requests` and admin review status. |
| Quote comparison | Figma-style comparison page is routed. | Lowest bid and recommended bid concepts are visible. | Bind to live `/api/bids` and `/api/bids/[id]/accept`, with non-lowest confirmation. |
| Orders workspace | Figma-style order workspace is routed for orders, documents, messages, tracking, AWB and review. | Post-award flow is visible in one workspace. | Bind documents, messages, status update and review to live order APIs. |
| Admin | Admin dashboard, request review, accounts, payments and audit pages are routed. | Admin flow is visible and structured. | Add full search, filters, rejection reasons, internal notes and action audit writes. |

## P1 - Product Clarity And Operational Detail

| Area | Current state | Remaining work |
| --- | --- | --- |
| Empty / loading / error states | Main auth/session loading exists. Analytics dynamic loading skeleton added. | Standardize all pages with reusable empty, loading and error patterns. |
| Dummy data audit | Most Figma pages intentionally use demo data so the full UI can be reviewed. | Replace demo data page by page only after UI approval, starting with dashboard tasks, marketplace, bids and orders. |
| Account status display | Top bar shows signed-in/demo state, token count, plan and company avatar. | Add account menu: profile, billing, admin switch, sign out and role/capability badges. |
| Notifications | Notification page exists; sidebar/top bar highlight notification presence. | Connect to Supabase notifications table and realtime updates. |
| Membership | Membership page exists; plan is shown in top bar and sidebar. | Connect Stripe/FPS payment confirmation to subscription tier and celebration screen. |
| Community | Community page exists and is routed. | Define MVP scope: announcements, verified member posts, events and moderation. |
| i18n | Core pages support locale routes; onboarding Chinese copy is stored safely with Unicode escapes. | Clean remaining English-only Figma labels and decide which operational pages must be bilingual for launch. |

## P2 - Performance, Deployment And Maintainability

| Area | Current state | Remaining work |
| --- | --- | --- |
| Bundle splitting | Analytics now loads dynamically because it depends on `recharts`. | Consider lazy-loading other heavy Figma pages after route-level API binding is complete. |
| Vercel build | Build should be run after stopping the dev server to avoid `.next` conflicts. | Keep GitHub connected and deploy only after local `npm.cmd run build` passes. |
| API boundary | `apiJson` is the frontend helper for Next route handlers. | Keep all Supabase service-role writes inside route handlers/RPC, not client components. |
| Legacy code | Static `index.html` and `backend/server.mjs` remain legacy concept demo only. | Do not add new product work there. |
| Auditability | SQL/RPC files and admin audit page exist. | Ensure every payment, membership, award and order-state change writes an audit event. |

## Recommended Next Sequence

1. Freeze the Figma visual direction after user review.
2. Bind `/dashboard`, `/marketplace`, `/active-bids` and `/requests` to live APIs first.
3. Bind quote submission and bid acceptance next because this validates the token/RPC foundation.
4. Bind orders, documents, messages and reviews.
5. Finish admin operational controls and payment/email production checks.

