# Claude Handoff Prompt for LBID

You are helping continue the LBID logistics marketplace project.

Please first read:

- `AGENTS.md`
- `LBID_PRODUCT_DESIGN_HANDOFF.md`
- `LBID_DESIGN_REVIEW_OPTIMIZATION_CLEAN.md`
- `SUPABASE_RPC_SETUP.md`

Context:

LBID is a sealed-bidding logistics marketplace connecting Southeast Asian freight agencies with Hong Kong forwarders.

Critical codebase decision:

Use Next.js 14 + Supabase as the only primary MVP codebase. Work in `src/app`, `src/components`, `src/lib`, and Supabase SQL/RPC files. Do not build new production features in the legacy static `index.html` or in-memory `backend/server.mjs` path unless explicitly asked for a quick concept demo.

Core flow:

1. Agency creates Shipment Request.
2. Forwarders browse marketplace and submit sealed bids.
3. Bid submission uses token and must be transactional.
4. Agency accepts one bid.
5. System creates quotation, order, and match record.
6. Order workspace manages status, documents, messages, and review.
7. Admin manages pending payments, forwarder verification, tiers, and analytics.

Product principle:

LBID is a workflow platform first, directory second. Do not turn it into only a static directory or marketing website.

Confirmed product decisions:

1. Award logic is hybrid:
   - show the lowest valid bid with a badge
   - Agency can choose another bid
   - choosing a non-lowest bid must show a confirmation modal with price difference
2. Role model should move toward dual-capability company accounts:
   - Client capability: create SRs and accept bids
   - Forwarder capability: bid on SRs and fulfill orders
   - avoid assuming one company can only be one fixed role forever

Design direction:

- Premium logistics cockpit
- Navy / black technology feel with gold accent
- Clean white workspace areas for readability
- Role-based dashboards
- Sealed bid, progressive disclosure, token ledger, and match record should be visible product concepts

Current important implementation:

- Next.js 14 App Router
- Supabase Auth / PostgreSQL / Storage / RPC
- `submit_bid_with_token` RPC handles bid creation and token deduction
- `adjust_token_balance` RPC handles token adjustments
- Marketplace, SR creation, bidding, accept bid, order status, documents, messages, reviews, token wallet, company profile, admin pending payments are partially or mostly connected to live APIs

Do not remove existing live Supabase API wiring.

Best next tasks:

1. Create and document Supabase Storage bucket `documents` plus policies.
2. Clean corrupted Traditional Chinese copy across pages.
3. Build real bid comparison by SR ID with lowest-bid badge and non-lowest confirmation modal.
4. Connect forwarder directory frontend to live `/api/directory`.
5. Implement Quotation PDF generation.
6. Implement Supabase Realtime messages.
7. Add Admin forwarder verification workflow.
8. Add payment reject API and proof viewer.

When making changes:

- Keep changes focused.
- Preserve existing product flow.
- Prefer real API behavior over mock-only UI.
- If something is demo-only, label it clearly and explain what backend connection is still needed.
