# LBID Project Agent Instructions

## Project Boundary

This project is **LBID**, a sealed bidding SaaS platform for logistics demand matching.

The working project folder is:

`C:\Users\user\desktop\forwardflow_bid_desk`

Do **not** modify:

`C:\Users\user\desktop\hkjc_quant`

`hkjc_quant` is a separate horse racing quantitative analysis project. If the shell starts in `hkjc_quant`, treat it only as the default terminal cwd and always explicitly operate on `C:\Users\user\desktop\forwardflow_bid_desk` for LBID work.

## Brand

Company name: **LBID**

Logo asset:

`public/assets/lbid-logo-horizontal.png`

Source logo provided by user:

`C:\Users\user\Downloads\Horizontal Logo Variation with 'LBID'.png`

Current positioning:

- Traditional Chinese main line: `讓價格回到公平，讓實力取代關係。`
- English main line: `Fair prices. Real capability. No connections needed.`
- Supporting line: `Sealed bidding for fair logistics partnerships.`

Visual direction:

- Dark navy / black technology feel
- Futuristic logistics cockpit
- Premium, enterprise, investor-demo quality
- Use LBID logo prominently
- Avoid plain white SaaS template look
- Keep sealed bidding visual language: encrypted, hidden, locked, one-shot, timed window

## Product Concept

LBID helps overseas logistics agencies with cargo needing Hong Kong delivery connect with Hong Kong local logistics providers through sealed bidding.

## Codebase Decision

The **only primary product codebase** is the **Next.js 14 App Router + Supabase** application under:

- `src/app`
- `src/components`
- `src/lib`
- Supabase SQL / RPC files in the repository root

The old static demo files are **legacy concept-demo assets only**:

- `index.html`
- `backend/server.mjs`

Do not build new product features in the static `index.html` / in-memory `backend/server.mjs` path unless the user explicitly asks for a quick legacy demo. For Cyberport / CCMF and real MVP work, always implement in the Next.js + Supabase codebase.

Why:

- The static backend is in-memory and loses data on restart.
- It cannot support real users, persistent token ledger, RPC transaction safety, or payment/admin workflows.
- The current product specs, Supabase RPC, auth, storage, and Vercel deployment are all based on Next.js + Supabase.

## Product Decisions

Award mechanism:

- LBID uses a **hybrid award model**.
- After the bid window closes, the system highlights the lowest valid bid with a "Lowest quote" badge.
- Agency can still choose another bid based on reputation, transit time, service fit, or trust.
- If Agency chooses a non-lowest bid, show a confirmation modal explaining the price difference and requiring explicit confirmation.

Role model:

- LBID should move toward a **dual-capability company account** model.
- One company account can enable:
  - Client capability: create SRs and accept bids.
  - Forwarder capability: bid on SRs and fulfill orders.
- Current UI may still use Agency / Forwarder / Admin as role labels, but future navigation and dashboards should be capability-based.

Core logic:

1. Overseas agency submits a delivery request.
2. Agency email is required before the request can continue.
3. Request enters manual review first.
4. Platform publishes the request after review.
5. A fixed 3-hour bid window opens.
6. Hong Kong logistics providers submit exactly one sealed bid.
7. Providers cannot view competitor prices, names, or bid details.
8. After expiry, the lowest valid bid is highlighted, but Agency may choose any valid bid with confirmation.
9. Contact details unlock only after award.
10. A responsibility / legal record is generated.
11. Agency has 3 refusal chances.
12. Cancellation after award triggers cooling-off / review logic.
13. Platform role in phase 1: `workflow_platform_not_carrier_of_record`.

Important positioning:

- LBID does not guarantee that scraped agencies become paying customers.
- LBID guarantees data quality, workflow clarity, compliance awareness, and platform process.
- The pitch is helping Hong Kong small/mid logistics companies get more overseas demand while giving overseas agencies a fair sealed bidding process.

## Current Frontend

Primary frontend:

`src/app`

This is the Next.js 14 App Router frontend deployed to Vercel.

Language:

- Traditional Chinese / English toggle exists.
- Chinese text is written mostly as HTML entities to avoid Windows PowerShell encoding issues.
- Be careful when editing Chinese text. Prefer UTF-8 `.NET WriteAllText(..., UTF8Encoding(false))` or HTML entities.

Static legacy demo:

`index.html`

Keep this only as a historical concept demo. Do not use it as the main development target.

## Current Backend

Primary backend:

- Next.js route handlers under `src/app/api`
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase RPC functions:
  - `submit_bid_with_token`
  - `adjust_token_balance`

Legacy backend:

- `backend/server.mjs`
- In-memory only
- Do not use for real MVP work.

## Data / Scraping

Scraper file:

`scripts/scrape-agencies.mjs`

Current scraped public data:

- `public/data/agency_leads.json`
- `public/data/lead_summary.json`

Current verified email-only lead summary:

- Total: 275
- India: 60
- Malaysia: 38
- Indonesia: 60
- Philippines: 7
- Vietnam: 60
- Cambodia: 13
- Bangladesh: 37

Only leads with email should be counted for platform/demo purposes.

## Commands

Install dependencies if needed:

```powershell
npm.cmd install
```

Build:

```powershell
npm.cmd run build
```

Start backend on fresh port example:

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 5301
```

Start production build locally:

```powershell
npm.cmd run build
```

If opening a new preview after major changes, use a fresh port to avoid browser cache confusion.

## Verification Checklist

Before saying work is done, run at least:

```powershell
npm.cmd run build
```

For workflow changes, verify:

1. Create SR: `POST /api/shipment-requests`
2. Submit sealed bid: `POST /api/bids`
3. Confirm token ledger changes through RPC / token transactions
4. Accept bid: `POST /api/bids/[id]/accept`
5. Confirm quotation, order, and match record are created
6. Confirm platform role remains `workflow_platform_not_carrier_of_record`

## Coding Preferences

- Keep changes focused and avoid touching unrelated files.
- Do not modify `hkjc_quant` for LBID work.
- Prefer production-MVP improvements in the Next.js + Supabase path over legacy static-demo work.
- Preserve dark futuristic LBID brand direction.
- Avoid corrupting Chinese text through PowerShell encoding.
- Use `npm.cmd` on Windows.
- For manual file writes outside the workspace root, use `.NET WriteAllText` with UTF-8 no BOM.

## Next Recommended Work

Good next steps:

1. Clean corrupted Traditional Chinese copy across Next.js pages.
2. Build bid comparison by SR ID with lowest-bid badge and non-lowest confirmation modal.
3. Move role model toward dual-capability company accounts.
4. Connect Forwarder Directory frontend to live `/api/directory`.
5. Create Supabase Storage bucket and policy for `documents`.
6. Implement Quotation PDF generation.
7. Implement Supabase Realtime messages.
8. Add Admin forwarder verification workflow.
