# LBID Product & Design Handoff

Purpose: this document explains the product thinking, user flow, page logic, button behavior, API relationships, and future roadmap for LBID. It is written so another AI agent, product designer, developer, or partner can quickly understand why the platform is designed this way and what should be built next.

Last updated: 2026-06-18

## 0. Codebase Decision

The primary codebase is **Next.js 14 App Router + Supabase**.

Primary development targets:

- `src/app`
- `src/components`
- `src/lib`
- Supabase SQL / RPC files
- Vercel deployment

Legacy demo assets:

- `index.html`
- `backend/server.mjs`

These legacy files should be kept for reference or quick concept demos only. They are not the main MVP. Do not build new production features in the in-memory static demo path.

Reason:

- LBID needs real auth, persistent database, token ledger, transaction-safe bidding, storage, payment records, and admin workflows.
- The static backend is in-memory and cannot support Cyberport / CCMF-level MVP requirements.
- The current product architecture and RPC smoke tests are already built around Supabase.

## 1. Product Summary

LBID is a matching-first logistics marketplace for Southeast Asian freight agencies and Hong Kong forwarders.

The core business problem:

- Overseas agencies often need reliable Hong Kong delivery partners but rely on manual email, phone, relationship-based referrals, and inconsistent pricing.
- Hong Kong forwarders, especially small and mid-sized providers, need a fairer way to access overseas demand without depending only on existing relationships.
- Logistics quotations are often opaque, hard to compare, and hard to audit after acceptance.

LBID solves this by creating a controlled sealed-bidding workflow:

1. Agency creates a Shipment Request.
2. Forwarders see enough masked information to decide whether to bid.
3. Forwarders submit sealed bids using tokens.
4. Competitor prices stay hidden before deadline.
5. Agency compares bids. The lowest bid is highlighted, but Agency may accept any valid bid.
6. The system creates a quotation, order, and match record.
7. Order documents, messages, status, and review are managed inside LBID.

The intended positioning:

> Fair logistics matching through sealed bidding, structured workflow, and reputation-backed execution.

## 2. Product Design Principles

### 2.1 Matching First, Not Directory First

LBID should not be only a static forwarder directory. The directory is useful, but the core value is the matching workflow.

Design implication:

- Homepage should guide users toward creating an SR or browsing forwarders.
- Marketplace should show actionable shipment opportunities.
- Directory should support trust discovery, but the final commercial action should happen through SR and sealed bid.

### 2.2 Sealed Bid = Fairness + Urgency

Forwarders should not see competitor prices before the bid window closes.

Design implication:

- Marketplace cards should show route, cargo category, deadline, service type, and masked details.
- The UI should reinforce that the bid is sealed.
- Bid submission should cost a token, creating intent and preventing spam.
- Bid result comparison should happen on the Agency side.

### 2.3 Progressive Disclosure

Pre-award information should be limited. Full contact details should unlock only after award.

Design implication:

- Before award: show masked route and enough cargo details for pricing.
- After award: create Match Record and Order.
- Contact / commercial relationship should be traceable through LBID.

### 2.4 Role-Based Workspaces

Agency, Forwarder, and Admin have different mental models.

Design implication:

- Agency dashboard should focus on SRs, received bids, accepted orders, and documents.
- Forwarder dashboard should focus on open SRs, submitted bids, token balance, and active orders.
- Admin dashboard should focus on payments, verification, tiers, and analytics.

### 2.5 Operational Tool, Not Marketing Website

LBID should feel like a logistics cockpit, not a generic SaaS landing page.

Design implication:

- Prioritize clear actions, dense but readable cards, status panels, tables, and workflow states.
- Use navy / gold brand language, but keep workspace backgrounds clean and readable.
- Avoid decorative sections that do not help the user move forward.

### 2.6 Trust Through Traceability

The platform should create a defensible record of commercial decisions.

Design implication:

- Accepted bid creates quotation, order, and match record.
- Documents are stored per order.
- Messages are scoped to each order.
- Reviews create reputation signals.
- Admin can audit payment and verification.

## 3. Core User Roles

Important product decision:

LBID should evolve from fixed single-role accounts into **dual-capability company accounts**.

One company account may enable:

- Client capability: create Shipment Requests, compare bids, accept bids, manage orders as buyer.
- Forwarder capability: bid on Shipment Requests, spend tokens, fulfill orders as supplier.

The current UI can still use `Agency`, `Forwarder`, and `Admin` labels for clarity, but future navigation should be capability-aware rather than assuming each company has only one permanent role.

| Role | Primary Goal | Main Objects | Main Actions |
|---|---|---|---|
| Agency | Find reliable Hong Kong forwarder at fair market price | Shipment Request, Bid, Order, Document, Review | Create SR, compare bids, accept bid, manage order, review forwarder |
| Forwarder | Win overseas logistics demand | Marketplace SR, Bid, Token Wallet, Order, Profile | Browse SRs, submit sealed bid, manage won order, upload documents, improve profile |
| Admin | Control marketplace quality and payment integrity | User, Company Profile, Payment Intent, Verification, Analytics | Verify forwarders, confirm manual payments, manage tiers, monitor activity |

## 4. End-to-End Flow

### 4.0 Award Logic

LBID uses a **hybrid award model**:

1. Forwarders submit sealed bids.
2. Competitor prices remain hidden before bid close.
3. After bid close, Agency sees all valid bids.
4. The system highlights the lowest valid bid with a `Lowest quote` badge.
5. Agency can choose the lowest bid or another bid.
6. If Agency chooses a non-lowest bid, the UI must show a confirmation modal:
   - selected bid price
   - lowest bid price
   - price difference
   - reminder that Agency may choose based on reputation, transit time, service fit, or reliability
7. Accepting any bid creates quotation, order, and match record.

This keeps sealed-bid fairness while allowing value-based B2B decision-making.

### 4.1 Agency Flow

1. Register or login as Agency.
2. Create Shipment Request.
3. SR becomes available to matching forwarders.
4. Receive sealed bids.
5. Review bid comparison page.
6. Accept one bid.
7. System creates:
   - Quotation
   - Order
   - Match Record
8. Manage order:
   - status pipeline
   - documents
   - messages
9. After completion, submit review.

### 4.2 Forwarder Flow

1. Register or login as Forwarder.
2. Complete onboarding and company profile.
3. Check token balance.
4. Browse Marketplace.
5. View SR detail.
6. Submit sealed bid.
7. Token is deducted.
8. If accepted, order is created.
9. Manage order:
   - update shipment status
   - upload documents
   - communicate with Agency
10. Receive review and reputation gain.

### 4.3 Admin Flow

1. Login as Admin.
2. Review dashboard.
3. Confirm pending manual payments.
4. Verify forwarder profiles.
5. Manage membership tiers.
6. Monitor bids, orders, tokens, and marketplace health.

## 5. Page-by-Page Functional Map

### 5.1 Home: `/zh` / `/en`

Purpose:

- Explain LBID positioning.
- Route users into SR creation, marketplace, directory, or auth.

Primary actions:

| Button | Function | Destination |
|---|---|---|
| Create SR | Start Agency request flow | `/[locale]/inquiries/new` |
| Browse Forwarders | Explore directory | `/[locale]/forwarders` |
| Sign In | Login / register | `/[locale]/auth` |

Design note:

- Home should communicate the core value quickly: fair sealed bidding for logistics partnerships.
- It should not become a long marketing site before the product is usable.

### 5.2 Auth: `/[locale]/auth`

Purpose:

- Supabase Auth login / registration.
- User selects role: Agency, Forwarder, Admin.
- After login, system reads `users.role` and redirects to matching dashboard.

Primary actions:

| Button | Function | API / Data |
|---|---|---|
| Sign In | Login with Supabase | Supabase Auth |
| Create trial account | Register user and upsert profile row | Supabase Auth + `users` |
| Role selector | Choose intended role at registration | `users.role` |

Design note:

- Role selection is important because the same platform has different workspaces.
- Login should redirect automatically; users should not need to think where to go.

### 5.3 Dashboard: `/[locale]/dashboard?role=agency`

Purpose:

- Agency control center.
- Show live workspace data where authenticated.

Primary actions:

| Button | Function | Destination / API |
|---|---|---|
| Create SR | Start request form | `/[locale]/inquiries/new` |
| Compare bids | Review quotation comparison | `/[locale]/quotations/compare` |
| Live workspace panel | Shows live SR, match, token/reputation summary | `/api/shipment-requests`, `/api/match-records`, `/api/company-profile` |

Future:

- Show only SRs created by current Agency.
- Show bids grouped by SR.
- Add acceptance queue and document alerts.

### 5.4 Dashboard: `/[locale]/dashboard?role=forwarder`

Purpose:

- Forwarder work cockpit.
- Focus on biddable SRs, token balance, submitted bids, active orders.

Primary actions:

| Button | Function | Destination / API |
|---|---|---|
| Marketplace | Browse open SRs | `/[locale]/marketplace` |
| Token wallet | Manage bid tokens | `/[locale]/tokens` |
| Live workspace panel | Shows open SRs, matches, tokens, reputation | `/api/shipment-requests`, `/api/tokens`, `/api/company-profile` |

Future:

- Add "My submitted bids" table using `GET /api/bids`.
- Show won/lost bid outcomes.
- Add token warning and subscription status.

### 5.5 Dashboard: `/[locale]/dashboard?role=admin`

Purpose:

- Admin overview for operational control.

Primary actions:

| Button | Function | Destination / API |
|---|---|---|
| Pending payments | Review FPS / PayMe payments | `/[locale]/admin/pending-payments` |
| Admin panel | Admin overview | `/[locale]/admin` |
| Live workspace panel | Shows pending payment count and platform metrics | `/api/admin/pending-payments` |

Future:

- Add forwarder verification queue.
- Add platform analytics.
- Add suspicious activity monitoring.

### 5.6 Create Shipment Request: `/[locale]/inquiries/new`

Purpose:

- Agency creates a Shipment Request.

Key fields:

- Origin / destination
- Cargo type
- Weight / CBM / pieces
- Ship date
- Bid deadline
- Services needed
- Notes

Primary actions:

| Button | Function | API |
|---|---|---|
| Submit SR | Create shipment request | `POST /api/shipment-requests` |
| Back / dashboard link | Return to workspace | dashboard |

Data created:

- `shipment_requests`

Future:

- Add validation per cargo mode.
- Add draft save.
- Add document pre-check.
- Add matching criteria to target forwarders.

### 5.7 Marketplace List: `/[locale]/marketplace`

Purpose:

- Forwarders browse open Shipment Requests.

Current behavior:

- Reads live SR list from `GET /api/shipment-requests`.
- Falls back to demo SR cards if no authenticated live data.

Primary actions:

| Button | Function | Destination |
|---|---|---|
| Submit sealed bid | Open SR detail / bid form | `/[locale]/marketplace/[id]` |
| Priority Bid | Same SR detail, future priority behavior | `/[locale]/marketplace/[id]` |
| View SR detail | Open SR detail | `/[locale]/marketplace/[id]` |

Design note:

- Marketplace should not reveal too much information before award.
- The key conversion action is bid submission.

Future:

- Filter by cargo mode, route, services, deadline.
- Hide SRs user has already bid on.
- Show token cost and eligibility.

### 5.8 Marketplace Detail: `/[locale]/marketplace/[id]`

Purpose:

- Forwarder reviews SR details and submits sealed bid.

Primary actions:

| Button | Function | API |
|---|---|---|
| Confirm bid | Submit bid and deduct token | `POST /api/bids` |
| Back marketplace | Return to SR list | `/[locale]/marketplace` |

Backend logic:

- `POST /api/bids` calls Supabase RPC `submit_bid_with_token`.
- RPC validates:
  - user identity
  - SR open status
  - deadline not expired
  - no duplicate bid
  - sufficient token balance
- RPC creates bid and token transaction.

Future:

- Add line-item pricing instead of simple total price.
- Add bid draft before final submit.
- Add clear warning: one sealed bid only.

### 5.9 Quotation Compare: `/[locale]/quotations/compare`

Purpose:

- Agency compares bids and accepts one.

Primary actions:

| Button | Function | API |
|---|---|---|
| Accept quotation | Accept selected bid | `POST /api/bids/[id]/accept` |
| Open order | Navigate to created order | `/[locale]/orders/[orderId]` |

Backend result after accept:

- Creates accepted quotation.
- Creates order.
- Creates match record.
- Updates SR status to `AWARDED`.

Future:

- Display all bids by SR.
- Sort by price, reputation, transit time.
- Add refusal logic for Agency.
- Add final confirmation modal.

### 5.10 Order Workspace: `/[locale]/orders/[id]`

Purpose:

- Central workspace after bid acceptance.

Core areas:

- Order reference
- Status pipeline
- Documents
- Messages
- Review

Primary actions:

| Button | Function | API / Destination |
|---|---|---|
| Status buttons | Update order status | `PATCH /api/orders/[id]` |
| Manage documents | Open document page | `/[locale]/orders/[id]/documents` |
| Open messages | Open message thread | `/[locale]/orders/[id]/messages` |
| Leave review | Open review page | `/[locale]/orders/[id]/review` |

Status pipeline:

1. confirmed
2. shipment_booked
3. in_transit
4. arrived_hk
5. customs_cleared
6. delivered
7. completed

Future:

- Permission rules by role.
- Status history log.
- Automatic notifications on status update.

### 5.11 Order Documents: `/[locale]/orders/[id]/documents`

Purpose:

- Manage documents per order.

Checklist:

- AWB / B/L
- Commercial Invoice
- Packing List
- Certificate of Origin

Primary actions:

| Button | Function | API / Storage |
|---|---|---|
| Upload document | Upload file to Supabase Storage and create document record | `POST /api/orders/[id]/documents` |
| E-confirm | Locally confirm uploaded doc | UI state currently |
| Send reminder | Queue reminder state | UI state currently |
| Smart AWB fill | Open AWB page | `/[locale]/orders/[id]/awb` |

Backend behavior:

- API supports JSON document record creation.
- API also supports multipart file upload.
- Files upload to Supabase Storage bucket: `documents`.
- A row is inserted into `documents` table.

Required setup:

- Supabase Storage bucket named `documents`.
- Correct bucket policy.

Future:

- Real e-confirmation table / timestamp.
- Auto reminder 24h before ship date.
- Document preview and download.

### 5.12 Order Messages: `/[locale]/orders/[id]/messages`

Purpose:

- In-platform communication per order.

Primary actions:

| Button | Function | API |
|---|---|---|
| Send message | Create message row | `POST /api/orders/[id]/messages` |

Current:

- API-backed message creation and loading.

Future:

- Supabase Realtime subscription.
- Unread count.
- File attachment.
- System messages on status/document changes.

### 5.13 Order Review: `/[locale]/orders/[id]/review`

Purpose:

- Agency leaves review after completion.

Primary actions:

| Button | Function | API |
|---|---|---|
| Submit review | Create review and reputation event | `POST /api/reviews` |

Current:

- API can resolve forwarder from order if forwarder ID is not supplied.

Future:

- Only allow review after delivered/completed.
- Prevent duplicate review.
- Display review on forwarder public profile.

### 5.14 Smart AWB: `/[locale]/orders/[id]/awb`

Purpose:

- Smart AWB form and PDF preview.

Primary actions:

| Button | Function | Current State |
|---|---|---|
| Generate PDF preview | Preview AWB-style document | Demo UI |

Future:

- Generate real PDF using React-PDF or Puppeteer.
- Save generated PDF to documents table.
- Auto-calculate volumetric weight.

### 5.15 Forwarder Directory: `/[locale]/forwarders`

Purpose:

- Public directory for agencies to discover Hong Kong forwarders.

Primary actions:

| Button | Function | Destination |
|---|---|---|
| Search | Filter displayed forwarders | Local UI |
| Service filter | Filter by service | Local UI |
| Tier filter | Filter by membership tier | Local UI |
| Create SR to invite bid | Start request | `/[locale]/inquiries/new` |
| View profile | Open forwarder profile | `/[locale]/forwarders/[slug]` |

Current:

- UI uses localized static data.
- `/api/directory` now supports live Supabase directory data.

Future:

- Frontend should consume live `/api/directory`.
- Directory should rank by reputation, membership, completed orders, boosts, and response time.

### 5.16 Forwarder Profile: `/[locale]/forwarders/[slug]`

Purpose:

- Public forwarder profile.

Current:

- Static localized forwarder profile.

Future:

- Connect to `company_profiles`.
- Show ratings, badges, completed orders, service coverage.
- Add "Invite to SR" action.

### 5.17 Tokens: `/[locale]/tokens`

Purpose:

- Token wallet and purchase page.

Primary actions:

| Button | Function | API / Future |
|---|---|---|
| Buy | Start token purchase | `/api/tokens/purchase` future full flow |
| Spend boost | Directory boost | `/api/tokens/boost` |
| Live wallet panel | Display token balance | `GET /api/tokens` |

Current:

- Wallet live data is displayed.
- Package purchase UI exists.

Future:

- Full Stripe checkout.
- FPS / PayMe proof upload.
- Transaction history.

### 5.18 Subscription: `/[locale]/subscription`

Purpose:

- Membership tiers:
  - Free
  - Standard
  - Premium
  - Partner

Primary actions:

| Button | Function | API / Future |
|---|---|---|
| Choose plan | Start subscription checkout | `/api/subscriptions/checkout` |

Future:

- Stripe subscriptions.
- FPS manual payment option.
- Admin tier management.

### 5.19 Profile: `/[locale]/profile`

Purpose:

- Forwarder company profile and reputation asset.

Primary actions:

| Button | Function | Destination |
|---|---|---|
| Manage tokens | Open token wallet | `/[locale]/tokens` |
| Manage subscription | Open subscription page | `/[locale]/subscription` |
| Live profile panel | Read actual company profile | `/api/company-profile` |

Future:

- Editable company profile form.
- Public/private profile toggle.
- Upload logo/gallery/certificates.

### 5.20 Admin Pending Payments: `/[locale]/admin/pending-payments`

Purpose:

- Admin confirms manual FPS / PayMe payment.

Primary actions:

| Button | Function | API |
|---|---|---|
| Confirm | Confirm payment intent | `POST /api/admin/pending-payments` |
| Reject | Current local state only | Future API needed |

Current:

- Page loads real pending payment intents.
- Confirm calls backend and can trigger token/subscription update.

Future:

- Add reject API.
- Add proof image viewer.
- Add admin audit log.

### 5.21 Admin Overview: `/[locale]/admin`

Purpose:

- Admin control panel entry.

Current:

- Mostly scaffold.

Future:

- Forwarder verification queue.
- Payment management.
- Tier management.
- Analytics.
- User management.

### 5.22 Community: `/[locale]/community`

Purpose:

- Community or announcement feed.

Current:

- Local post draft / static posts.

Future:

- Real posts table.
- Admin announcements.
- Member-only discussions.

### 5.23 Services: `/[locale]/services`

Purpose:

- Upsell ecosystem services:
  - website
  - app
  - ERP
  - CRM

Current:

- Static service cards.

Future:

- Service inquiry form.
- Admin service lead pipeline.

## 6. API Map

| API | Purpose | Current Status |
|---|---|---|
| `GET/POST /api/shipment-requests` | List/create SR | Live Supabase |
| `GET /api/shipment-requests/[id]` | Read SR detail | Live Supabase |
| `GET/POST /api/bids` | List/create bids | Live Supabase / RPC for create |
| `POST /api/bids/[id]/accept` | Accept bid | Live Supabase |
| `GET/PATCH /api/orders/[id]` | Read/update order | Live Supabase |
| `GET/POST /api/orders/[id]/documents` | List/upload documents | Live Supabase + Storage |
| `GET/POST /api/orders/[id]/messages` | List/send messages | Live Supabase |
| `GET/POST /api/reviews` | List/create reviews | Live Supabase |
| `GET /api/tokens` | Token wallet | Live Supabase |
| `POST /api/tokens/purchase` | Token purchase intent | Partial |
| `POST /api/tokens/boost` | Directory boost | Partial |
| `GET /api/company-profile` | Current user's profile | Live Supabase |
| `GET /api/directory` | Public forwarder directory | Live Supabase API, frontend still static |
| `GET /api/match-records` | Match records | Live Supabase |
| `GET/POST /api/admin/pending-payments` | Manual payment admin | Live Supabase |
| `POST /api/subscriptions/checkout` | Membership checkout | Partial |

## 7. Database Objects

Main tables:

- `users`
- `company_profiles`
- `subscriptions`
- `shipment_requests`
- `bids`
- `quotations`
- `orders`
- `documents`
- `messages`
- `reviews`
- `match_records`
- `token_transactions`
- `payment_intents`
- `directory_boosts`
- `reputation_events`

Important RPC:

- `submit_bid_with_token`
- `adjust_token_balance`

Critical business rule:

- Bid submission must be transactional:
  - validate token balance
  - deduct token
  - insert bid
  - insert token transaction

## 8. Current Completion Status

### Completed / Mostly Completed

- Supabase Auth login
- Role-based dashboard redirect
- Create SR real API
- Bid submission via RPC
- Token deduction
- Accept bid creates quotation/order/match
- Order status API
- Order documents API
- Supabase Storage document upload support
- Order messages API
- Review API
- Token wallet live panel
- Company profile live panel
- Marketplace live SR list
- Admin pending payment API
- Directory API

### Still Needs Product Completion

- Supabase Storage bucket and policies
- Quotation PDF generation
- Smart AWB PDF generation
- Realtime messages
- Forwarder verification admin workflow
- Directory frontend connected to live API
- Full payment checkout and webhook flow
- Reject payment API
- Full Chinese copy cleanup
- Analytics dashboard

## 9. Future Roadmap

### Phase 1A: Make Current MVP Truly Usable

Goal: let a real Agency and Forwarder complete the core workflow.

Tasks:

1. Create Supabase Storage bucket `documents`.
2. Add Storage RLS policies.
3. Connect Forwarder Directory frontend to live `/api/directory`.
4. Clean all Traditional Chinese copy and remove mojibake.
5. Add real bid comparison by SR ID.
6. Add order permission checks.
7. Add duplicate prevention for review and accepted bid.

### Phase 1B: Commercial Readiness

Goal: make LBID credible for early partner demos.

Tasks:

1. Quotation PDF generation.
2. AWB PDF generation.
3. Email notifications through Resend.
4. Admin forwarder verification.
5. Payment proof viewer and reject flow.
6. Transaction history for token wallet.

### Phase 1C: Marketplace Quality

Goal: improve matching quality and trust.

Tasks:

1. Forwarder badges and verification.
2. Reputation scoring.
3. Directory ranking algorithm.
4. Preferred partner tracking.
5. Match record and introduction period reporting.

### Phase 2: Growth Loops

Goal: increase network effects.

Tasks:

1. Referral codes.
2. Points redemption.
3. Profile boosts.
4. Community posts.
5. Event tickets / partner campaigns.

### Phase 3: Operational Automation

Goal: reduce manual logistics admin work.

Tasks:

1. Airline / carrier tracking integration.
2. OCR document extraction.
3. Auto-generated document checklist by shipment mode.
4. AI quotation assistant.
5. Compliance / legal audit exports.

## 10. Recommended UX Improvements

### 10.1 Navigation

- Show different nav items by role.
- Agency should see SR / Orders / Directory.
- Forwarder should see Marketplace / Tokens / Orders / Profile.
- Admin should see Admin / Payments / Verification / Analytics.

### 10.2 Data Feedback

- Every button that calls API should show:
  - loading
  - success
  - error
  - next step

### 10.3 Empty States

Add helpful empty states:

- No SR yet -> Create first SR.
- No token -> Buy token.
- No documents -> Upload first document.
- No messages -> Send first message.
- No pending payment -> All clear.

### 10.4 Trust UI

Use consistent trust signals:

- Sealed bid
- Token ledger
- Verified forwarder
- Match record
- Contact unlocked after award
- Platform not carrier of record

### 10.5 Copywriting

The product should use clear Traditional Chinese and English, not mixed or corrupted encoding.

Suggested Chinese tone:

- professional
- concise
- Hong Kong logistics-friendly
- not overly technical

Example:

- `提交密封報價`
- `剩餘競價時間`
- `得標後解鎖聯絡資料`
- `此訂單由 LBID 管理流程紀錄，LBID 並非承運人`

## 11. Design System Direction

Brand direction:

- Navy / black technology feel
- Gold accent for premium actions
- White/light workspace background for readability
- Compact operational cards
- Clear status badges

Primary UI components:

- Cards for repeated objects
- Badges for status/tier
- Buttons for commands
- Inputs/selects for forms
- Progress bars for status
- Tables/lists for admin operations

Avoid:

- Overly decorative landing-page sections
- Too many gradients
- Hiding primary workflow behind marketing content
- Mixing languages inside one page unless intentional
- Buttons that do not create visible feedback

## 12. What Claude AI Should Understand

If Claude or another AI continues the project, it should preserve this product direction:

1. LBID is a workflow platform first, directory second.
2. The core action loop is SR -> sealed bid -> accept -> order -> documents/messages/review.
3. Token spending must stay transactional and auditable.
4. Role-based experience matters.
5. Agency should feel protected from messy quotation workflows.
6. Forwarder should feel they have fair access to overseas demand.
7. Admin should have operational control and audit visibility.
8. UI should feel like a premium logistics cockpit, not a generic SaaS template.
9. Do not replace live Supabase wiring with mock-only behavior.
10. When adding UI, always connect it to the workflow or explain why it is currently a demo placeholder.

## 13. Immediate Next Build Recommendations

Recommended next implementation order:

1. Storage setup guide and SQL/policy for `documents` bucket.
2. Clean corrupted Traditional Chinese copy across existing pages.
3. Connect forwarder directory frontend to `/api/directory`.
4. Add bid comparison page that reads bids by SR ID.
5. Implement Quotation PDF generation.
6. Implement Realtime messages.
7. Add Admin forwarder verification page.
8. Add payment reject API and proof viewer.

The best next step is not to add more pages. The best next step is to make the existing critical pages feel complete, truthful, and connected.
