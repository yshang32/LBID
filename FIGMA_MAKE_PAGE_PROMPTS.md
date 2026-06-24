# LBID Figma Make Page Prompts

Use the prompts in this document inside the existing **Design LBID Today Workspace** Figma Make project. The Today Workspace is the visual master. Do not ask Figma Make to redesign the product from scratch.

## Master Instruction

Paste this instruction before every page-specific prompt:

```text
Use the existing LBID Today Workspace as the exact visual source of truth.

Reuse the same fixed 228px left sidebar, 56px topbar, Inter/SF typography,
cool pale-gray canvas, white cards, navy (#0C1A3E), gold (#C49A3C),
emerald status treatment, thin #E2E6EE borders, rounded 14px list cards,
rounded 20px feature cards, restrained shadows, icon sizing, spacing and
hover language. Keep the same logo treatment, account footer, membership card,
and premium operational-dashboard feeling.

Do not create a landing page. Do not use a dark hero, oversized marketing copy,
gradient blobs, decorative illustrations, glassmorphism, or generic SaaS cards.
The interface is a frequently used logistics operating workspace: calm, dense,
highly scannable, and immediately actionable.

Keep all content in English for the design prototype. Use realistic but clearly
illustrative logistics data. Preserve the existing app shell exactly unless this
prompt explicitly asks for a change.
```

---

## 1. Forwarder Today Workspace

The existing page is the master. Use this only if you need Figma Make to improve it.

```text
Refine the existing LBID Today Workspace without changing its visual system.

Keep one recommended sealed-bid opportunity as the primary focus. Retain the
route visualization, match score, selection reasons, deadline, specs strip,
sealed quote entry, other opportunities, and activity feed. Make the hierarchy
even clearer: one decisive action, quieter supporting data, and no competing
primary buttons.

Add polished states for an urgent final 15-minute bid window and a submitted
quote success state. The urgent state should feel meaningfully time-sensitive
through motion, countdown treatment and an amber-to-red alert treatment, but
must remain enterprise-grade rather than playful or alarming.
```

## 2. Opportunities

```text
Create the LBID Opportunities page for a Hong Kong Forwarder.

Main purpose: scan open shipment requests and decide which sealed bids to pursue.

Use the shared app shell. In the content area, create a quiet page header with
title "Opportunities", a short supporting line, and compact filter controls for
Freight mode, Origin, Deadline, Cargo type, and Match score. Below it, place a
single recommended opportunity card first, using the same visual language as the
Today hero but in a more compact horizontal format. Then show a dense list of
public opportunities as 3 to 5 clean rows.

Each row must show: origin to destination, air or sea icon, weight, volume,
cargo, service tags, profile match %, remaining time, and a quiet chevron.
Use emerald for strong match, navy for normal match, and an urgent amber/red
deadline only when necessary. Never reveal competing bid prices, bidder names or
bid counts. Include an intentional empty-state version below the list.
```

## 3. Opportunity Detail and Sealed Quote

```text
Create the LBID Opportunity Detail page for a Forwarder preparing one sealed bid.

Use the shared app shell. The page has a compact breadcrumb back to Opportunities,
then a single major route panel: origin, flight or vessel connector, destination,
deadline and recommended-match badge. Use the Today Workspace visual vocabulary.

Below, make a two-column operational layout. Left: shipment information,
cargo specs, service requirements, pickup and delivery dates, and a sealed-bid
privacy explanation. Right: a sticky "Your Sealed Quote" panel with HKD price,
estimated transit time, included services, terms/remarks, token usage and one
decisive "Submit Sealed Quote" button.

Show a final confirmation dialog state before submission and a rewarding,
professional success state after submission. State clearly that competitor
prices, identities and terms remain unavailable until the bid window closes.
```

## 4. Active Bids

```text
Create the LBID Active Bids page for a Forwarder.

Main purpose: let a forwarder understand the status of every submitted sealed
quote without exposing competitors' information.

Use the shared app shell. Create a compact summary row for Open, Closing Soon,
Closed Awaiting Selection and Awarded. Below it, use a table-like card list with
route, freight mode, submitted date, quoted amount visible only to this company,
deadline/status, token reference, and a single action on each row.

For open bids, show "Sealed" and the countdown. For closed bids, show "Awaiting
agency selection". For awarded bids, use a satisfying emerald status and direct
the user to the order workspace. Include a small information note explaining the
hybrid award model: lowest price may be highlighted to the agency, but agency can
select another qualified forwarder.
```

## 5. My Routes

```text
Create the LBID My Routes page for a Forwarder.

Main purpose: manage the routes and service capabilities that power matching.

Use the shared app shell. Present a clean route coverage map-style summary at the
top using abstract route lines only, not a literal map image. Add a primary
"Add route" action. Below, list route capability cards showing origin region,
Hong Kong destination coverage, air/sea mode, certified services, capacity range,
verification status, completed jobs and match performance.

Each route card should feel like a maintained company capability, not a social
profile. Include clear states for verified, pending verification and incomplete
route data. Keep editing actions compact and secondary.
```

## 6. Analytics

```text
Create the LBID Analytics page for a Forwarder.

Main purpose: help a logistics company understand bid performance without making
the page feel like a generic analytics product.

Use the shared app shell. At the top show four restrained metric cards: bids
submitted, win rate, average response time, and completed order value. Below,
show a bid funnel, route performance by corridor, response-time trend, and a
small insight panel with three actionable observations.

Charts should be understated: navy as primary, gold only for highlight, emerald
for positive outcome, pale line grid, no rainbow palette. Use realistic labels
such as Vietnam to Hong Kong, Malaysia to Hong Kong and India to Hong Kong.
```

## 7. Client / Agency Today Workspace

```text
Create the LBID Today Workspace for a company using its Client capability.

Use the same shared app shell and visual system, but shift the operating focus:
the company creates shipment requests, receives sealed quotes and awards work.

The hero should show the single most important next action, for example "3 quotes
are ready to compare" or "Your shipment request is under review." Include a
clear route summary, status timeline and one primary action. Below, show recent
shipment requests on the left and activity on the right.

Do not make this look like a different product. Preserve the same sidebar,
spacing, card language and account footer. The company may also be a Forwarder,
so do not frame it as a permanently separate account type.
```

## 8. Create Shipment Request

```text
Create the LBID Create Shipment Request page.

Main purpose: guide an overseas agency through a clear, confidence-building
request submission flow.

Use the shared app shell. Create a focused, step-by-step form with a visible
progress indicator: 1 Route, 2 Cargo, 3 Services, 4 Review. Avoid a long wall
of fields. Each step should be a calm white panel with a short plain-language
instruction and familiar select controls.

Fields include origin, Hong Kong destination, freight mode, cargo type, weight,
volume, pickup date, trade term and required services. The review step summarises
the request, explains manual review and clearly states that an approved request
opens a fixed three-hour sealed bidding window.

Use dropdowns for suggested choices. Only company name and company description
should be free text elsewhere in the product. Include a graceful save-draft state
and an excellent validation/error state.
```

## 9. Shipment Request Status

```text
Create the LBID Shipment Request Detail page for the Client capability.

Use the shared app shell. The top panel shows the route, cargo summary, request
reference, current status and a concise timeline: Draft, Submitted for review,
Published, Bidding open, Quotes ready, Awarded.

When bidding is open, show the deadline and state that all bids remain sealed.
When the deadline has passed, switch the primary action to "Compare quotes".
Display documents and messages as quiet secondary panels below. Include a clear
cancel request path with cooling-off and review wording, not a casual delete
button.
```

## 10. Quote Comparison and Award

```text
Create the LBID Quote Comparison page for a Client after a bidding window closes.

Main purpose: compare valid sealed quotes fairly and award one logistics partner.

Use the shared app shell. Start with a calm route and request summary, then show
three comparison cards in a structured grid. Each card includes company badge,
verification state, rating, total quote, transit time, included services and
key terms. Clearly mark the lowest valid quote with an emerald "Lowest quote"
badge, but do not visually force its selection.

Allow selection of any quote. If a non-lowest quote is selected, show a precise
confirmation modal explaining the price difference and asking the user to confirm
the value-based decision. After award, present a premium but restrained success
state: contact details unlocked, order workspace created, and responsibility
record generated.
```

## 11. Orders

```text
Create the LBID Orders page shared by Client and Forwarder capabilities.

Use the shared app shell. Include filter chips for Active, Awaiting documents,
In transit, Delivered and Completed. Present orders as dense but readable cards
or rows, each showing route, counterparty after award, latest status, next action,
document completeness and last message time.

The page should immediately answer "what needs attention". Give missing documents
an amber treatment and completed deliveries an emerald treatment. Avoid a generic
e-commerce table.
```

## 12. Order Workspace

```text
Create the LBID Order Workspace for a matched shipment.

Use the shared app shell. Design a practical operations page with route and order
reference at the top, followed by a horizontal lifecycle: Confirmed, Shipment
Booked, In Transit, Arrived Hong Kong, Customs Cleared, Delivered, Completed.

Below, create a two-column workspace. Left: status updates and document checklist
for AWB or B/L, Commercial Invoice, Packing List and Certificate of Origin.
Right: order-specific messaging, the most recent message, and an input to reply.

Use an amber attention state for missing documents 24 hours before ship date. Use
clear ownership labels for Client, Forwarder and LBID platform. Keep the design
quiet and operational, not a chat app or a shipping tracker consumer app.
```

## 13. Company Directory

```text
Create the LBID Company Directory page.

Main purpose: help companies discover verified logistics partners, while keeping
the product professional and transaction-focused.

Use the shared app shell. Place a compact search field and filters for service,
Hong Kong route coverage, verification, rating and membership. Show company cards
in a two- or three-column responsive grid. Each card contains company name,
country, verification badge, rating, completed orders, coverage routes and
service tags.

Make the cards information-rich but not social-media-like. Include a detail page
preview interaction and an intentional no-results state.
```

## 14. Company Profile and Capabilities

```text
Create the LBID Company Profile and Capabilities page.

Use the shared app shell. The page should feel like account configuration, not an
onboarding marketing screen. Start with a company identity summary and profile
completion indicator. Organise content into compact sections: company details,
Client capability, Forwarder capability, service coverage, certifications,
directory visibility and notification preferences.

Use step-based guidance only where information is incomplete. A company can enable
both Client and Forwarder capabilities, so use two independent toggles and explain
each capability in one calm sentence. Use dropdowns for structured choices and
reserve free text for company name and company description.
```

## 15. Token Wallet and Membership

```text
Create the LBID Token Wallet and Membership page.

Use the shared app shell. Top area: current plan, token balance, free versus paid
tokens, next billing date and a compact primary action to buy tokens or manage
membership. Below, show a clean token ledger with reason, amount, balance after,
date and linked shipment request where relevant.

Include membership cards for Free, Standard, Premium and Partner. Make the active
tier obvious and rewarding with restrained gold detail, not a loud sales page.
For a successful upgrade, design a short celebratory confirmation state with a
subtle gold accent, new benefits and a direct button back to the workspace.
```

## 16. Authentication

```text
Create the LBID authentication page using the same product visual system.

Do not use the dashboard sidebar. Use a spacious white and pale-gray composition
with a compact LBID logo, a clean centred sign-in panel, email and password fields,
and clear links for account creation and password reset. Add a restrained abstract
route-line visual in the background using navy, pale blue and gold, but no stock
photography or dark full-screen background.

Explain in one line that a single company account may use both Client and
Forwarder capabilities after onboarding. The page should feel premium, secure and
simple enough for frequent business users.
```

## 17. Admin Operations

```text
Create the LBID Admin Operations page.

Use the shared visual system with a more data-dense operational layout. Include
pending shipment request review, forwarder verification, payment confirmation,
platform alerts and short analytics. Use a table-and-queue structure with clear
priority states, search and filters.

For request rejection, include a reason capture flow. For forwarder verification,
show uploaded certificates, internal notes and approve/reject actions. For payment
review, show payment reference, proof, history and confirmation status. This is an
internal work tool, so keep it quiet, precise and auditable.
```
