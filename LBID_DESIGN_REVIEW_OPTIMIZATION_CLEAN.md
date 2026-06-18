# LBID Design Review & Optimization Notes

Purpose: this document turns the design review notes into a clean product / UX optimization brief. It complements `LBID_PRODUCT_DESIGN_HANDOFF.md` and should be read by any AI agent or partner before making more product changes.

Last updated: 2026-06-18

## 0. Non-Negotiable Product / Codebase Decisions

### Primary Codebase

Use **Next.js 14 + Supabase** as the only primary MVP codebase.

Do not continue production work in:

- `index.html`
- `backend/server.mjs`

Those files are legacy concept-demo assets only.

Reason:

- The in-memory backend loses data on restart.
- It cannot support real user auth, token ledger, RPC transactions, payment records, storage, or Cyberport-ready MVP requirements.
- Current architecture, RPC functions, and Vercel deployment are already based on Next.js + Supabase.

### Award Mechanism

Use **hybrid award mode**:

- System highlights the lowest valid bid.
- Agency can still select a non-lowest bid.
- If selecting a non-lowest bid, show confirmation modal with price difference and reason reminder.

### Role Model

Move toward **dual-capability company accounts**:

- Client capability: create SRs and accept bids.
- Forwarder capability: bid SRs and fulfill orders.

Avoid hard-coding the assumption that a company must be only Agency or only Forwarder forever.

## 1. Executive Review

The current product direction is correct:

- LBID should be a workflow platform first and a directory second.
- Sealed Bid + Token + Progressive Disclosure are the core product mechanics.
- Live API / partial API / demo UI must be clearly separated.
- Trust should come from traceability: accepted bid creates quotation, order, match record, documents, messages, and review.

The main design issue is not that LBID lacks pages. The issue is that several pages still need a clearer user flow, stronger role-based navigation, and more complete action states.

## 2. Key Product Risks

### Risk 1: Role Experience Is Still Not Sharp Enough

Agency, Forwarder, and Admin should not feel like they are using the same generic dashboard.

Required improvement:

- Agency should immediately see:
  - My Shipment Requests
  - Bids received
  - Orders needing action
  - Missing documents
- Forwarder should immediately see:
  - Open SRs worth bidding
  - My submitted bids
  - Token balance
  - Active won orders
- Admin should immediately see:
  - Pending payments
  - Forwarder verification
  - Platform activity
  - Risk / exception queue

### Risk 2: Marketplace And Directory Need Clear Separation

Marketplace and Directory should not feel like two versions of the same list.

Correct meaning:

- Marketplace = shipment opportunities that forwarders can bid on.
- Directory = forwarder capability discovery for agencies.

Required improvement:

- Marketplace cards should emphasize SR, deadline, sealed bid, token cost.
- Directory cards should emphasize forwarder reputation, coverage, badges, completed orders.
- Directory should always guide the agency back to "Create SR / Invite Bid", not direct off-platform contact.

### Risk 3: Bid Comparison Is A Conversion-Critical Page

The Bid Comparison page should not be treated as a future nice-to-have. It is where Agency decides whether LBID is valuable.

Required improvement:

- Bid comparison should be by Shipment Request ID.
- It should show all bids received for that SR.
- It should allow sorting by:
  - price
  - transit time
  - reputation score
  - service coverage
- Accept action must use a final confirmation modal because it creates quotation, order, and match record.

### Risk 4: Status UI Needs Two Layers

There are two different status concepts:

1. Match / commercial status
2. Shipment / operational status

Recommended split:

Match status:

- matched
- token used
- contact unlocked
- in trade
- completed

Order shipment status:

- confirmed
- shipment_booked
- in_transit
- arrived_hk
- customs_cleared
- delivered
- completed

UI recommendation:

- Show the match/commercial status as a high-level progress rail.
- Show shipment status as the detailed operational pipeline.

## 3. Function-Level UX Recommendations

## 3.1 Onboarding

### Target Flow

1. User registers.
2. User selects role:
   - Agency
   - Forwarder
   - Admin
3. System routes user to the correct onboarding wizard.
4. Wizard uses 5 steps.
5. Completion creates a clear "ready to use LBID" moment.
6. User lands on the correct dashboard.

### UX Recommendations

- Use wizard UI with progress: `Step X / 5`.
- Agency onboarding should capture demand-side behavior:
  - countries
  - shipment frequency
  - cargo types
  - common Hong Kong service needs
- Forwarder onboarding should capture supply-side capability:
  - service coverage
  - routes
  - certifications
  - documents
  - company profile
- Completion screen should feel rewarding:
  - "Your LBID workspace is ready"
  - "You can now create SR" for Agency
  - "You can now bid on marketplace SRs" for Forwarder

### Why This Matters

Onboarding decides whether users understand their role in the marketplace. If onboarding is vague, the whole platform feels vague.

## 3.2 Dashboard

### Target Flow

After login, the user lands on one role-specific dashboard.

Agency dashboard should show:

- Active SRs
- Received bids
- Orders requiring documents
- Pending decisions

Forwarder dashboard should show:

- Open SRs
- Submitted bids
- Token wallet
- Won orders

Admin dashboard should show:

- Pending payments
- Verification queue
- Platform activity
- Exception queue

### UX Recommendations

- Put the most important next action in the first viewport.
- Use action cards, not only stats.
- Each card should answer:
  - What is happening?
  - Why does it matter?
  - What should I click next?

### Example CTAs

Agency:

- `Create Shipment Request`
- `Review Received Bids`
- `Upload Missing Documents`

Forwarder:

- `View Open SRs`
- `Submit Sealed Bid`
- `Buy Tokens`

Admin:

- `Review Payment Proof`
- `Verify Forwarder`
- `View Platform Analytics`

## 3.3 Create Shipment Request

### Target Flow

Recommended wizard:

1. Route and shipment mode
2. Cargo details
3. Required services
4. Bid window and disclosure settings
5. Review and submit

### UX Recommendations

- Do not show one long form.
- Split the SR form into manageable steps.
- Add draft save.
- Add a final review screen explaining:
  - what forwarders can see before award
  - what stays hidden
  - when contact unlocks
  - how sealed bidding works

### Why This Matters

Agency needs confidence that creating an SR will not expose too much information too early.

## 3.4 Marketplace

### Target Flow

1. Forwarder opens Marketplace.
2. Forwarder sees SR opportunity cards.
3. Forwarder filters by:
   - lane
   - cargo type
   - shipment mode
   - deadline
   - required services
4. Forwarder opens SR detail.
5. Forwarder submits one sealed bid.
6. Token is deducted.
7. Forwarder receives confirmation and waits for result.

### UX Recommendations

Marketplace card should show:

- masked route
- cargo category
- weight / volume range
- deadline
- required services
- token cost
- sealed bid badge
- number of bid slots or bid window state

Bid button should not immediately spend token without confirmation.

Recommended modal:

- Bid amount
- Transit time
- Terms
- Token cost
- Remaining token balance
- Confirmation that bid is sealed and final

### Why This Matters

Marketplace is the forwarder's revenue interface. It must feel high-signal and fair.

## 3.5 Bid Comparison

### Target Flow

1. Bid window closes or Agency opens comparison.
2. Agency sees all bids for one SR.
3. Agency compares price, transit time, reputation, service scope.
4. Agency accepts one bid.
5. System creates quotation, order, match record.
6. Agency is redirected to Order Workspace.

### UX Recommendations

Use a comparison table:

| Forwarder | Price | Transit Time | Reputation | Coverage | Terms | Action |
|---|---|---|---|---|---|---|

Add sorting:

- lowest price
- fastest transit
- highest reputation

Add final confirmation modal:

- "Accepting this bid will create an order and unlock contact details."
- "LBID remains workflow platform, not carrier of record."

### Why This Matters

This is the key conversion moment for Agency. If this page is weak, the entire sealed-bid product feels incomplete.

## 3.6 Order Workspace

### Target Flow

Order Workspace should be the single source of truth after bid acceptance.

Recommended layout:

1. Top summary:
   - order ID
   - agency
   - forwarder
   - route
   - accepted quotation
2. Match progress:
   - matched
   - contact unlocked
   - in trade
   - completed
3. Shipment pipeline:
   - confirmed
   - shipment_booked
   - in_transit
   - arrived_hk
   - customs_cleared
   - delivered
   - completed
4. Tabs:
   - documents
   - messages
   - review

### UX Recommendations

- Status update should show loading and success.
- Status changes should create system messages.
- Missing documents should be visible from the order summary.
- Review should unlock only near completion.

### Why This Matters

The order page is where LBID proves it is more than lead generation.

## 3.7 Documents

### Target Flow

1. User opens order documents.
2. User sees checklist.
3. User uploads required files.
4. File goes to Supabase Storage.
5. Document record is created.
6. Other party can confirm.
7. Missing document reminders trigger before ship date.

### UX Recommendations

- Replace basic file input with a clearer upload zone later.
- Show file name, upload time, uploader, confirmation state.
- Use document type icons:
  - PDF
  - image
  - spreadsheet
- Show progress: `3 / 4 documents uploaded`.

### Required Backend Setup

- Supabase Storage bucket: `documents`
- Storage RLS policy
- Document table RLS policy

### Why This Matters

Documents are operational proof. If upload feels fake, the whole order workflow feels fake.

## 3.8 Messages

### Target Flow

1. Order has its own message thread.
2. Agency and Forwarder communicate inside LBID.
3. System messages are inserted when:
   - status changes
   - document is uploaded
   - document is confirmed
   - bid is accepted
4. Realtime updates appear without refresh.

### UX Recommendations

- Use familiar chat layout.
- Separate user messages and system messages.
- Add timestamps and sender labels.
- Add unread count.

### Future Technical Requirement

- Supabase Realtime subscription to order messages.

### Why This Matters

Messages replace messy email and WhatsApp fragments. They are part of the audit trail.

## 3.9 Review

### Target Flow

1. Order reaches delivered or completed.
2. Review becomes available.
3. Agency submits rating and optional comment.
4. Review creates reputation event.
5. Forwarder profile updates.

### UX Recommendations

- Disable review until order is delivered/completed.
- Prevent duplicate reviews.
- Offer quick tags:
  - fast response
  - clear documents
  - on-time delivery
  - professional communication

### Why This Matters

Reputation is the long-term marketplace quality engine.

## 3.10 Forwarder Directory

### Target Flow

1. Agency opens directory.
2. Agency filters by service, region, membership tier, rating.
3. Agency reviews forwarder profile.
4. Agency creates SR or invites forwarder into SR.

### UX Recommendations

- Directory frontend should consume `/api/directory`.
- Cards should show:
  - company name
  - rating
  - badges
  - completed orders
  - coverage
  - services
  - membership tier
- Do not make direct contact the main CTA.
- Main CTA should be: `Create SR to invite bid`.

### Why This Matters

Directory supports trust discovery, but the commercial workflow must still go through LBID.

## 3.11 Token Wallet

### Target Flow

1. Forwarder sees free token, paid token, total token.
2. Forwarder sees next reset date.
3. Forwarder sees token transaction history.
4. Forwarder buys tokens if balance is low.
5. Token purchase creates payment intent.

### UX Recommendations

- Split free and paid token clearly.
- Show "1 token = 1 sealed bid".
- Add transaction ledger.
- Add insufficient token flow:
  - show current balance
  - show required token
  - offer buy token action

### Why This Matters

Token is LBID's action currency. It must feel transparent and auditable.

## 3.12 Admin

### Target Flow

Admin should manage:

- pending payments
- payment proof
- rejected payment
- forwarder verification
- badges
- membership tiers
- platform analytics

### UX Recommendations

- Use tables for operational queues.
- Add filters:
  - pending
  - confirmed
  - rejected
  - high value
  - old pending
- Add proof viewer.
- Add reject reason.
- Add admin audit log.

### Why This Matters

Admin UI protects platform quality and payment integrity.

## 4. General UI / UX Rules

### 4.1 Visual Hierarchy

Each page should answer three questions within the first viewport:

1. Where am I?
2. What is the current state?
3. What should I do next?

### 4.2 Button Feedback

Every API action should show:

- loading
- success
- error
- next step

Examples:

- `Submitting sealed bid...`
- `Bid submitted. Token deducted.`
- `Insufficient tokens. Buy tokens to continue.`

### 4.3 Empty States

Every empty state should include an action:

- No SR -> `Create first SR`
- No bids -> `Wait for bids` / `Invite forwarders`
- No tokens -> `Buy tokens`
- No documents -> `Upload first document`
- No messages -> `Send first message`
- No pending payments -> `All caught up`

### 4.4 Role-Based Navigation

Navigation should change by role.

Agency nav:

- Dashboard
- Shipment Requests
- Orders
- Directory

Forwarder nav:

- Dashboard
- Marketplace
- Bids
- Orders
- Tokens
- Profile

Admin nav:

- Admin Dashboard
- Payments
- Verification
- Users
- Analytics

### 4.5 Consistent Status Language

Use consistent labels across UI:

- `Open`
- `Sealed bidding`
- `Awarded`
- `Confirmed`
- `In transit`
- `Delivered`
- `Completed`

Avoid mixing informal labels with database status labels unless the UI provides a display mapping.

## 5. Priority Optimization Backlog

### P0: Must Fix Before Serious Demo

1. Clarify onboarding flow by role.
2. Connect directory frontend to live `/api/directory`.
3. Build bid comparison by SR ID.
4. Clean corrupted Traditional Chinese copy.
5. Add Supabase Storage bucket and policy for documents.
6. Add clear loading/success/error states for every API button.

### P1: Commercial Readiness

1. Quotation PDF generation.
2. Realtime order messages.
3. Admin payment proof viewer.
4. Payment reject API.
5. Forwarder verification workflow.
6. Token transaction history UI.

### P2: Marketplace Quality

1. Reputation scoring UI.
2. Directory ranking algorithm display.
3. Smart AWB PDF.
4. System messages for all order events.
5. Analytics dashboard.

## 6. Final Design Position

LBID should not become a collection of disconnected pages.

Every page should either:

- move an Agency closer to creating or accepting an SR,
- move a Forwarder closer to submitting or fulfilling a bid,
- help Admin maintain trust and payment integrity,
- or strengthen the traceable workflow after award.

The best next product work is not adding more pages. It is making the existing critical pages feel connected, truthful, and action-ready.
