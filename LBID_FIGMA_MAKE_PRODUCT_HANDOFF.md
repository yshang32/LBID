# LBID Product and Technical Handoff for Figma Make

## Purpose

Give this document to Figma Make, ChatGPT, or any design AI together with the existing **LBID Today Workspace**. The Today Workspace is the visual master. This document defines product logic the UI must respect.

Never share `.env` files, Supabase keys, Stripe keys, Vercel tokens, or customer data with a design AI.

## Product

LBID is a B2B sealed-bidding workflow platform for logistics demand into Hong Kong. It connects overseas cargo demand with Hong Kong freight forwarders. LBID is a workflow platform, **not a carrier of record**.

Positioning: **Fair prices. Real capability. No connections needed.**

## Account model and rules

- One company account may enable both Client and Forwarder capabilities. Do not design a permanent Agency-only versus Forwarder-only split.
- Client capability: create shipment requests, compare closed bids, award one, and follow the order.
- Forwarder capability: browse eligible requests, receive recommendations, submit one sealed bid, and fulfil awarded orders.
- Admin: review requests, verify Forwarders, manage accounts/membership, confirm payments, and monitor operations.
- New shipment requests are `PENDING_REVIEW` until Admin publishes them.
- Published requests use a fixed 3-hour sealed-bid window.
- One Forwarder may submit exactly one bid per request.
- Before close, hide competitor price, identity, terms, contact details, and bid count.
- After close, highlight the lowest valid bid. Client may choose another bid after confirming the price difference.
- Contact details unlock only after award.
- Award creates quotation, order, match record, audit event, notification, email event, and 24-hour cooling-off period.
- One bid consumes one Token atomically through Supabase RPC.
- Platform role wording is `workflow_platform_not_carrier_of_record`.

## Actual implementation

| Layer | Implementation |
|---|---|
| Frontend | Next.js 14 App Router, React, Tailwind CSS |
| Product paths | `src/app`, `src/components`, `src/lib` |
| Authentication/database | Supabase Auth and PostgreSQL with RLS |
| Critical RPC | `submit_bid_with_token`, `accept_bid_to_order` |
| Documents | Supabase private document storage |
| Notifications | In-app notification table and email helper compatible with Resend |
| Payments | Stripe-compatible subscriptions, Tokens, manual payment proof flow |
| PDFs | React PDF quotation and AWB endpoints |
| Deployment | Vercel from GitHub `yshang32/LBID` main branch |

The old `index.html` and `backend/server.mjs` are legacy demos only. Do not use them as product source.

## Visual contract

Use the existing **LBID Today Workspace** as exact visual source of truth.

- Desktop app shell: 228px fixed sidebar and 56px top bar.
- Canvas: cool pale gray `#F4F5F9`.
- Feature cards: white, thin `#E2E6EE` border, 20px radius, restrained layered shadow.
- List cards: white, 14px radius, thin border, very slight lift on hover.
- Navy `#0C1A3E`: primary actions and selected navigation.
- Gold `#C49A3C`: membership, recommendation, limited premium emphasis.
- Emerald `#1A7D4A`: verified, success and healthy status.
- Urgency: amber only below 15 minutes; red only below 5 minutes.
- Typography: Inter/SF-inspired, compact and operational, never marketing-scale.
- Use Lucide icons.
- One major action per screen; supporting actions are quiet.

Do not create dark marketing heroes in internal product pages, generic rainbow dashboards, decorative blobs, social-media cards, or multiple competing primary CTAs.

## Main screens

| Route | Screen | Capability | Main purpose |
|---|---|---|---|
| `/{locale}/auth` | Authentication | All | Sign in, register and reset password through Supabase Auth. |
| `/{locale}/onboarding` | Unified onboarding | All | Configure company and enable Client/Forwarder capabilities. |
| `/{locale}/dashboard` | Today Workspace | Both | Next action, metrics, recommendation, activity. |
| `/{locale}/requests` | My requests | Client | Draft, review, open, closed and awarded requests. |
| `/{locale}/inquiries/new` | Create request | Client | Guided request form. |
| `/{locale}/requests/{id}` | Request detail | Client | Request status, bid window, documents, cancellation, comparison action. |
| `/{locale}/marketplace` | Opportunities | Forwarder | Browse public/eligible open requests and recommendations. |
| `/{locale}/marketplace/{id}` | Quote console | Forwarder | Review request and submit one sealed bid. |
| `/{locale}/quotations/compare?srId=...` | Quote comparison | Client | Compare closed bids and award one. |
| `/{locale}/orders` | Orders | Both | Active/completed operational orders. |
| `/{locale}/orders/{id}` | Order workspace | Both | Status, documents, messages and tracking. |
| `/{locale}/orders/{id}/documents` | Documents | Both | AWB/B-L, Invoice, Packing List, COO. |
| `/{locale}/orders/{id}/messages` | Messages | Both | Private order thread. |
| `/{locale}/orders/{id}/tracking` | Tracking | Both | Shipment milestones. |
| `/{locale}/orders/{id}/awb` | AWB | Both | AWB output/workflow. |
| `/{locale}/orders/{id}/review` | Review | Client | Review completed partner/order. |
| `/{locale}/forwarders` | Company directory | All | Search/filter verified companies. |
| `/{locale}/forwarders/{slug}` | Forwarder profile | All | Rating, badges, coverage, service details. |
| `/{locale}/profile` | Company profile | All | Details, capabilities, coverage, directory visibility. |
| `/{locale}/tokens` | Token wallet | Forwarder | Balance, ledger, purchase/boost activity. |
| `/{locale}/subscription` | Membership | All | Plan, checkout, billing management. |
| `/{locale}/notifications` | Notification centre | All | In-app action alerts. |
| `/{locale}/admin/...` | Admin operations | Admin | Reviews, verification, payments, audit and analytics. |

## Page-specific design requirements

### Today Workspace

This is the visual master. Include Today/date top bar, company/membership sidebar footer, four quiet metric cards, one dominant recommended opportunity, other opportunities, and an activity feed.

Recommended opportunity includes origin to Hong Kong route visual, freight mode, weight, volume, cargo, date strip, match score/reasons, real `bid_deadline` countdown, sealed quote input, privacy note, and one primary submit action. At under 15 minutes use amber final-window treatment; under 5 minutes use red urgency. Submission success shows a sealed quote receipt.

### Create Shipment Request

Use a guided sequence: `1 Route -> 2 Cargo -> 3 Services -> 4 Review`. Fields are origin, Hong Kong destination, freight mode, cargo type, weight, volume, pickup date, trade term, required services and notes. Explain that submit creates an Admin-review request; approval opens a 3-hour sealed bid window.

### Authentication and Account Entry

Authentication is a real Supabase Auth workflow, not a static marketing form. The auth screen must support four modes in one coherent panel:

| Mode | Required UI | Real behaviour |
|---|---|---|
| Sign in | Work email, password, sign-in action, link to register, link to reset password | Calls Supabase password sign-in. Persistent browser session is then maintained by Supabase. |
| Create company account | Company name, contact person, work email, password of at least 8 characters | Calls Supabase sign-up with company/contact metadata. Do not ask the user to choose a permanent Agency or Forwarder role. |
| Email verification | Calm success/next-step notice | When email confirmation is required, account creation ends with a verification notice rather than pretending user is already signed in. |
| Reset password | Work email, send-reset action, return-to-login link | Sends a secure reset link that returns to `/auth?mode=update`. |
| Set new password | New password, validation, update action | Updates password through Supabase and returns user to sign-in. |

After a successful sign-in, routing is automatic:

1. No completed company onboarding -> `/{locale}/onboarding`.
2. Completed normal company -> `/{locale}/dashboard`.
3. Completed Admin account -> `/{locale}/dashboard?mode=admin`.

After sign-up with an immediate session, the app calls `/api/auth/bootstrap` to create initial company context and then opens unified onboarding. The shell listens to Supabase Auth session changes; signed-in users see their company identity, membership tier, Token balance and notification entry instead of Login/Register buttons.

Design requirements: no role picker at registration, no dashboard sidebar on auth page, clear field-level validation, loading state, server-error state, reset-sent notice, verification-required notice and password-updated success notice.

### Opportunities

Forwarder cards may show route, mode, cargo summary, services, deadline and match fit. Never show Client contact data, bidder count, competitor price/name, or competitor terms.

### Quote Comparison

This is a Client-only screen after bid close. Cards show verified company, rating, total quote, transit time, service and terms. Mark lowest valid bid. Selecting another bid opens a price-difference confirmation modal before award.

### Order Workspace

Status pipeline: `confirmed -> shipment_booked -> in_transit -> arrived_hk -> customs_cleared -> delivered -> completed`.

Show a clear next action, tracking events, private messages, document checklist and missing-document warning. It is an operations workspace, not a consumer tracker.

## API contract relevant to UI

| Endpoint | Methods | UI contract |
|---|---|---|
| `/api/workspace` | GET | Dashboard profile, own requests, open opportunities, recommendations and orders. |
| `/api/company-profile` | GET, PATCH | Company details, capability flags, Token balances and directory settings. |
| `/api/onboarding/save-step` | POST | Persist one onboarding step. |
| `/api/onboarding/complete` | POST | Mark onboarding complete. |
| Supabase Auth browser client | sign-in, sign-up, reset password, update password, session listener | Authentication is performed in browser through Supabase Auth rather than a custom LBID password API. |
| `/api/shipment-requests` | GET, POST | New real request becomes `PENDING_REVIEW`. |
| `/api/shipment-requests/{id}` | GET, PATCH | Request detail and permitted update. |
| `/api/shipment-requests/{id}/cancel` | POST | Controlled cancellation workflow. |
| `/api/bids?sr_id={id}` | GET | Authorised comparison data. |
| `/api/bids` | POST | Submit sealed bid: `sr_id`, `price`, `currency`, optional `transit_time`, optional `terms`. |
| `/api/bids/{id}/accept` | POST | Award bid; optional `totalAmount`, `lineItems`; creates quotation/order/match record. |
| `/api/recommendations` | GET, POST | Forwarder match recommendations. |
| `/api/orders/{id}` | GET, PATCH | Order detail and permitted status update. |
| `/api/orders/{id}/tracking` | GET, POST | Read/add tracking milestones. |
| `/api/orders/{id}/documents` | GET, POST | List/upload documents; multipart upload, 10MB limit. |
| `/api/orders/{id}/documents/reminder` | POST | Trigger document reminder. |
| `/api/orders/{id}/messages` | GET, POST | Private message thread; create notification/email event. |
| `/api/orders/{id}/awb` | POST | Generate AWB output. |
| `/api/reviews` | GET, POST | Post-completion review. |
| `/api/tokens` | GET | Token balance and ledger. |
| `/api/tokens/purchase` | POST | Token purchase flow. |
| `/api/tokens/boost` | POST | Profile/directory boost. |
| `/api/subscriptions` | GET | Current tier/billing state. |
| `/api/subscriptions/checkout` | POST | Hosted checkout start. |
| `/api/subscriptions/portal` | POST | Billing management. |
| `/api/notifications` | GET, POST, PATCH | Notification list/create/read state. |
| `/api/directory` | GET | Searchable public Forwarder directory. |
| `/api/directory/{id}` | GET | Public company profile. |
| `/api/quotations` | POST | Create quotation record. |
| `/api/quotations/{token}` | GET | Public quotation access. |
| `/api/quotations/{token}/pdf` | GET, POST | Quotation PDF. |
| `/api/admin/shipment-requests` | GET, PATCH | Review/publish/reject request. |
| `/api/admin/forwarders` | GET | Verification queue. |
| `/api/admin/forwarders/{id}/verify` | POST | Verify/reject with notes. |
| `/api/admin/accounts` | GET, PATCH | Account capability/tier/status. |
| `/api/admin/pending-payments` | GET, POST | Payment review. |
| `/api/admin/payment-intents/{id}/confirm` | POST | Confirm payment. |
| `/api/admin/analytics` | GET | Platform metrics. |
| `/api/admin/audit-logs` | GET | Audit history. |

## Data model for screen content

| Entity | Design meaning |
|---|---|
| `company_profiles` | Company identity, onboarding, capability flags, visibility and Token balances. |
| `subscriptions` | Membership plan/trial/billing status. |
| `shipment_requests` | Route, cargo, services, deadlines, status, privacy/legal/cooling-off context. |
| `bids` | One sealed Forwarder offer per request. |
| `bid_recommendations` | Match score and reasons. |
| `quotations` | Awarded quotation, line items, total and public token. |
| `orders` | Post-award operational order. |
| `match_records` | Client-Forwarder relationship and contact unlock. |
| `documents` | Private order file metadata. |
| `messages` | Private order conversation. |
| `tracking_events` | Order milestone history. |
| `notifications` | In-app alerts. |
| `reviews` | Post-completion feedback. |
| `token_transactions` | Immutable Token ledger. |
| `payment_intents` | Payment evidence/confirmation state. |
| `points`, `referrals`, `reputation_events`, `directory_boosts` | Growth and trust features. |
| `audit_logs` | Admin and critical workflow history. |

## Privacy rules for screens

| Situation | UI may show | UI must hide |
|---|---|---|
| Open sealed bid | Route, cargo summary, services, deadline, eligibility | Competitor price/name/terms, bid count, Client contact data. |
| Forwarder quote | Own amount and receipt | Competitor data. |
| Closed comparison | Valid bid/company/reputation/price/transit/terms | Unselected contact before award. |
| Awarded order | Operational contact/workflow data for both parties | Internal Admin notes, other bid data, raw storage path. |
| Admin | Review/verification/payment/audit information | Service-role credentials and secrets. |

## Required UI states

Every workflow needs a contextual loading state, intentional empty state, field-level validation, permission/eligibility state, explicit confirmation for irreversible actions, success state with next step, and failure state that retains entered data where possible.

## Design AI prompt wrapper

Use this wording before a page-specific prompt:

`You are designing a screen for LBID, a B2B sealed-bidding logistics platform. Use the supplied LBID Product and Technical Handoff as product truth and the existing LBID Today Workspace as exact visual source of truth. Keep the 228px sidebar, 56px topbar, pale-gray canvas, white cards, typography, colour, spacing, shadows and interaction language. Do not redesign the visual system. A company can enable both Client and Forwarder capabilities. Respect sealed-bid privacy: never show competitor price, name, contact details or bid count before award. Create this page: [PASTE PAGE PROMPT].`

## Delivery workflow

1. Generate one page in Figma Make with this handoff plus the page prompt.
2. Export the page/project as ZIP.
3. Give the ZIP to Codex.
4. Codex ports the UI into Next.js while preserving Supabase Auth, permissions, APIs, i18n and route behaviour.
5. Codex builds, verifies the focused workflow, commits to GitHub and Vercel deploys from main.

The Figma ZIP is the visual source. Next.js plus Supabase is the functional source of truth.

---

## Appendix A: Complete Page Route Inventory

This appendix lists every page route currently present in the Next.js application. A design AI must distinguish between core product screens, supporting product screens, and legacy/design-preview screens.

### Core product screens

| Route | Status | Function and design requirement |
|---|---|---|
| `/{locale}` | Core | Localised app entry; routes users into the product/auth flow. |
| `/{locale}/auth` | Core | Supabase sign-in, registration and reset entry. No sidebar. |
| `/{locale}/onboarding` | Core | Unified company onboarding and dual-capability setup. |
| `/{locale}/dashboard` | Core | Capability-aware Today Workspace. |
| `/{locale}/requests` | Core | Client request list and status filter surface. |
| `/{locale}/requests/{id}` | Core | Client request detail and workflow state. |
| `/{locale}/inquiries/new` | Core | Client shipment request creator. |
| `/{locale}/marketplace` | Core | Forwarder opportunity marketplace. |
| `/{locale}/marketplace/{id}` | Core | Forwarder sealed quote console. |
| `/{locale}/quotations/compare` | Core | Client bid comparison and award decision. |
| `/{locale}/orders` | Core | Shared order list. |
| `/{locale}/orders/{id}` | Core | Shared operational order workspace. |
| `/{locale}/orders/{id}/documents` | Core | Private document checklist and upload. |
| `/{locale}/orders/{id}/messages` | Core | Private per-order thread. |
| `/{locale}/orders/{id}/tracking` | Core | Tracking event timeline. |
| `/{locale}/orders/{id}/awb` | Core | AWB form/output workflow. |
| `/{locale}/orders/{id}/review` | Core | Client review after completion. |
| `/{locale}/forwarders` | Core | Public Forwarder directory. |
| `/{locale}/forwarders/{slug}` | Core | Public Forwarder profile. |
| `/{locale}/profile` | Core | Private company profile and capability settings. |
| `/{locale}/tokens` | Core | Token wallet, ledger, purchase and boost work. |
| `/{locale}/subscription` | Core | Membership tier, checkout and billing management. |
| `/{locale}/notifications` | Core | Notification centre. |

### Admin screens

| Route | Function |
|---|---|
| `/{locale}/admin` | Operations overview / entry point. |
| `/{locale}/admin/shipment-requests` | Review, publish or reject requests. Rejection UI must collect a reason. |
| `/{locale}/admin/accounts` | Company capability, membership and account management. |
| `/{locale}/admin/pending-payments` | Payment evidence queue and confirmation work. |
| `/{locale}/admin/audit` | Audit history and critical workflow trace. |

### Supporting product and partner-growth screens

| Route | Current implementation | Design implication |
|---|---|---|
| `/{locale}/quotations/new` | Quotation builder with line items, calculation and quotation API integration. | Design as a professional pricing builder; show total, line items, generation and share/PDF success states. |
| `/{locale}/matches/{id}` | Match Record screen. Current page uses example/static match data while live match APIs exist. | Design as the post-award relationship record: parties, contact unlock, commercial terms, document checklist, messages, platform record. Do not claim all static sample values are live. |
| `/{locale}/community` | Community UI currently reads local fixture content; draft checks phone/email/WhatsApp patterns before publishing. | Treat as planned/pilot social-proof feature. Public posts must never expose contact details or move deals outside LBID. |
| `/{locale}/services` | Value-added services catalogue currently reads local fixture content. | Treat as separate LBID service-request lead funnel for website/app/ERP/CRM assistance, not as shipment fulfillment. |
| `/{locale}/directory` | Directory compatibility/entry route. | Use the same company directory visual system as `/forwarders`. |
| `/{locale}/onboarding/agency` | Compatibility route for earlier Agency onboarding. | Keep visual continuity but point users toward unified onboarding. |
| `/{locale}/onboarding/forwarder` | Compatibility route for earlier Forwarder onboarding. | Keep visual continuity but point users toward unified onboarding. |
| `/{locale}/workflow` | Product/workflow explanation screen. | Use for explaining the sealed-bid lifecycle, not for active transactional work. |

### Legacy and design-only screens

| Route | Purpose | Rule |
|---|---|---|
| `/{locale}/bid-demo` | Interactive visual demonstration of recommended vs open-market sealed bid. | No real Token debit or bid submission. Keep labelled as design/demo. |
| `/{locale}/product-preview` | Static full-product presentation preview. | Not a production workflow source. |
| `/`, `/auth`, `/forwarders`, `/forwarders/{slug}`, `/workflow`, `/admin` | Compatibility/root aliases. | Do not create a separate visual system; redirect or mirror localised routes. |

---

## Appendix B: Complete API Route Inventory

Every current Next.js route handler is listed below. Design AI should use this list to know whether a workflow is real, administrative, automated, or internal-only.

### Authentication, workspace and company

| Endpoint | Methods | Function |
|---|---|---|
| `/api/auth/bootstrap` | POST | Creates or initialises the authenticated user's product profile context. |
| `/api/workspace` | GET | Dashboard aggregate: profile, requests, opportunities, recommendations, orders, Token/document context. |
| `/api/company-profile` | GET, PATCH | Reads/updates company data and capability settings. |
| `/api/onboarding/save-step` | POST | Saves progress in unified onboarding. |
| `/api/onboarding/complete` | POST | Finalises onboarding. |
| `/api/backend/snapshot` | GET | Legacy/demo backend snapshot; not a source for new production design. |

### Requests, bids, awards and match records

| Endpoint | Methods | Function |
|---|---|---|
| `/api/shipment-requests` | GET, POST | Lists/creates requests. Real create begins in `PENDING_REVIEW`. |
| `/api/shipment-requests/{id}` | GET, PATCH | Request detail and permitted edits. |
| `/api/shipment-requests/{id}/cancel` | POST | Controlled cancellation/review workflow. |
| `/api/bids` | GET, POST | Lists authorised bid data and submits sealed bid through Token RPC. |
| `/api/bids/{id}/accept` | POST | Client accepts a bid and creates quotation, order and match record. |
| `/api/recommendations` | GET, POST | Match recommendations and recommendation status. |
| `/api/match-records` | GET | Match record list for authorised user. |
| `/api/match-records/{id}` | GET, PATCH | One match record and permitted relationship-stage update. |

### Orders, documents, tracking, messages and review

| Endpoint | Methods | Function |
|---|---|---|
| `/api/orders/{id}` | GET, PATCH | Order detail and status update. |
| `/api/orders/{id}/tracking` | GET, POST | Tracking history and fulfilment update. |
| `/api/orders/{id}/documents` | GET, POST | Private document list/upload. |
| `/api/orders/{id}/documents/reminder` | POST | Sends document completeness reminder. |
| `/api/orders/{id}/messages` | GET, POST | Private order messages plus notification/email event. |
| `/api/orders/{id}/awb` | POST | AWB PDF/generation workflow. |
| `/api/reviews` | GET, POST | Completed-order reviews. |

### Quotation, directory, notifications and growth

| Endpoint | Methods | Function |
|---|---|---|
| `/api/quotations` | POST | Creates formal quotation record. |
| `/api/quotations/{token}` | GET | Reads a public quotation through a share token. |
| `/api/quotations/{token}/pdf` | GET, POST | Retrieves/generates quotation PDF. |
| `/api/directory` | GET | Searchable public company directory. |
| `/api/directory/{id}` | GET | Public company profile. |
| `/api/notifications` | GET, POST, PATCH | Lists, creates and marks notifications read. |
| `/api/points` | GET, POST | Points balance/events and earning/redemption operations. |
| `/api/referrals` | GET, POST | Referral code, referred user and reward lifecycle. |

### Membership, tokens and payments

| Endpoint | Methods | Function |
|---|---|---|
| `/api/tokens` | GET | Token balance and ledger. |
| `/api/tokens/purchase` | POST | Token purchase request. |
| `/api/tokens/boost` | POST | Redeems Token-funded directory/profile boost. |
| `/api/subscriptions` | GET | Subscription tier/status. |
| `/api/subscriptions/checkout` | POST | Starts Stripe/hosted checkout. |
| `/api/subscriptions/portal` | POST | Opens billing-management flow. |
| `/api/subscriptions/webhook` | POST | Server-only payment webhook. Never design this as a human screen. |
| `/api/payment-intents/{id}/upload-proof` | POST | Uploads manual payment proof. |

### Admin and automation

| Endpoint | Methods | Function |
|---|---|---|
| `/api/admin/shipment-requests` | GET, PATCH | Review/publish/reject shipment requests. |
| `/api/admin/forwarders` | GET | Verification queue. |
| `/api/admin/forwarders/{id}/verify` | POST | Approve/reject forwarder verification. |
| `/api/admin/accounts` | GET, PATCH | Manage company capability, tier, Token and account state. |
| `/api/admin/pending-payments` | GET, POST | Manual payment review/processing. |
| `/api/admin/payment-intents/{id}/confirm` | POST | Confirms a payment intent. |
| `/api/admin/analytics` | GET | Platform operational metrics. |
| `/api/admin/audit-logs` | GET | Audit trail. |
| `/api/cron/{job}` | GET, POST | Protected scheduled job endpoint, including bid-window and reminder automation. Do not design as a public screen. |

---

## Appendix C: Function Coverage Checklist for Future Design ZIPs

When creating a Figma page, include appropriate states for these existing functions rather than only the happy path:

- Sign in, register, persistent authenticated session and sign out/account menu.
- Unified company onboarding with independent Client and Forwarder capability toggles.
- Request creation, review pending, publish/open, close, compare, award and cancellation/cooling-off.
- Recommended opportunity versus normal open-market opportunity.
- Sealed bid, Token debit, duplicate-bid prevention, insufficient Token, expired window and submission receipt.
- Quote comparison, lowest-quote badge and non-lowest confirmation.
- Formal quotation creation/share/PDF.
- Order milestones, document checklist/upload/reminder, tracking update, messages and review.
- Directory profile, verification, rating/reputation, membership and route coverage.
- Token ledger, token purchase, directory boost, points and referral surfaces.
- Subscription checkout, billing portal, manual payment proof and post-payment tier upgrade success.
- In-app notifications and email-triggering events.
- Admin review, verification, payments, analytics and audit trail.
- Community contact-detail warning and off-platform contact prevention.
- Value-added services lead request, clearly separate from shipping marketplace.

The design should make a distinction between **implemented transactional workflows**, **supporting product features**, and **legacy/static previews**. Never visually present a static preview as a confirmed live transaction.
