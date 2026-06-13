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

Core logic:

1. Overseas agency submits a delivery request.
2. Agency email is required before the request can continue.
3. Request enters manual review first.
4. Platform publishes the request after review.
5. A fixed 3-hour bid window opens.
6. Hong Kong logistics providers submit exactly one sealed bid.
7. Providers cannot view competitor prices, names, or bid details.
8. After expiry, the lowest valid bid wins.
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

Main frontend file:

`index.html`

This is currently a Vite static frontend with inline CSS/JS.

Current pages / views:

- Home
- Dashboard
- Bid Cockpit
- Packages

Language:

- Traditional Chinese / English toggle exists.
- Chinese text is written mostly as HTML entities to avoid Windows PowerShell encoding issues.
- Be careful when editing Chinese text. Prefer UTF-8 `.NET WriteAllText(..., UTF8Encoding(false))` or HTML entities.

Current frontend API target:

`http://127.0.0.1:5340`

Current verified preview URL:

`http://127.0.0.1:5199/`

## Current Backend

Backend file:

`backend/server.mjs`

Backend is an in-memory Node HTTP server.

Current verified backend:

`http://127.0.0.1:5340`

Important endpoints:

- `GET /api/health`
- `GET /api/leads`
- `GET /api/lead-summary`
- `GET /api/requests`
- `GET /api/plans`
- `POST /api/requests`
- `POST /api/admin/requests/:id/publish`
- `POST /api/requests/:id/bids`
- `POST /api/requests/:id/auto-award`
- `POST /api/agency/requests/:id/refuse-award`
- `POST /api/agency/requests/:id/cancel`

Note: backend state is in-memory. If tests mutate state, start a fresh backend on a new port or restart the backend.

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
$env:PORT=5340; node backend/server.mjs
```

Start preview example:

```powershell
npx.cmd vite preview --host 127.0.0.1 --port 5199 --strictPort
```

If opening a new preview after major changes, use a fresh port to avoid browser cache confusion.

## Verification Checklist

Before saying work is done, run at least:

```powershell
npm.cmd run build
Invoke-WebRequest -Uri http://127.0.0.1:<preview-port>/ -UseBasicParsing
Invoke-WebRequest -Uri http://127.0.0.1:<preview-port>/assets/lbid-logo-horizontal.png -UseBasicParsing
Invoke-RestMethod -Uri http://127.0.0.1:<backend-port>/api/health
```

For workflow changes, verify:

1. Create request: `POST /api/requests`
2. Publish request: `POST /api/admin/requests/:id/publish`
3. Submit sealed bid: `POST /api/requests/:id/bids`
4. Auto award: `POST /api/requests/:id/auto-award`
5. Confirm legal record includes `workflow_platform_not_carrier_of_record`

## Coding Preferences

- Keep changes focused and avoid touching unrelated files.
- Do not modify `hkjc_quant` for LBID work.
- Prefer simple, demo-ready improvements over broad rewrites unless requested.
- Preserve dark futuristic LBID brand direction.
- Avoid corrupting Chinese text through PowerShell encoding.
- Use `npm.cmd` on Windows.
- For manual file writes outside the workspace root, use `.NET WriteAllText` with UTF-8 no BOM.

## Next Recommended Work

Good next steps:

1. Make the proposal/client-demo flow more polished.
2. Improve mobile layout for the Bid Cockpit.
3. Add package detail screens for website/app/ERP/CRM services.
4. Add a visible compliance/process page.
5. Convert static frontend to React components if the UI grows larger.
6. Deploy frontend to Vercel when ready for client viewing.
7. Later replace in-memory backend with persistent storage.