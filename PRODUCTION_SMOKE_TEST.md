# LBID Production Smoke Test

Last run: 2026-06-21
Environment: local Next.js server against configured Supabase project

## P0 Result

| Area | Status | Evidence |
| --- | --- | --- |
| Auth UI | Pass | `/zh/auth` renders clean Traditional Chinese copy. |
| Agency creates SR | Pass | `POST /api/shipment-requests` created a real `shipment_requests` row. |
| Forwarder submits bid | Pass | `POST /api/bids` created a real `bids` row. |
| Token debit | Pass | `submit_bid_with_token` deducted 1 free token and inserted `token_transactions`. |
| Agency accepts bid | Pass with fallback | `/api/bids/[id]/accept` created quotation, order, match record, and marked SR awarded. |
| Order status update | Pass | `PATCH /api/orders/[id]` moved order to `shipment_booked` and `completed`. |
| Document record | Pass | `POST /api/orders/[id]/documents` created a real document row. |
| Order message | Pass | `POST /api/orders/[id]/messages` created message and in-app notification. |
| Review | Pass | `POST /api/reviews` created review, point transaction, and reputation event. |
| Unauthenticated writes | Pass | Production-configured API now returns `401` instead of demo write fallback. |

## Verified Smoke IDs

- Bid: `fe62b638-8af8-4a98-b2ad-51c3011a60b7`
- Token transaction: `05252432-7978-46d1-a53e-41ba46932ff9`
- Quotation: `20446051-0c7d-475a-9370-c1b32039c3d2`
- Order: `815aa430-ece9-40df-8152-45b404e58a85`
- Match record: `da106109-04f0-49c9-bcbb-c3ac0c163492`
- Document: `f1c1ed9c-d5c1-49d5-99cd-6c4701e39abe`
- Message: `7fd87d66-ff0c-4ea8-af7f-23953cc5c83b`
- Review: `82d39c43-b0f0-49cb-aa1a-3f15f8aadd47`

## Remaining P0 Risk

`accept_bid_to_order` RPC is not installed in the connected Supabase project. The API currently falls back to service-role writes so the MVP flow works, but this is not atomic.

Recommended next database step:

1. Open Supabase SQL Editor.
2. Run `supabase-v4-accept-bid-rpc.sql`.
3. Re-run `npm.cmd run supabase:smoke-rpc`.
4. Confirm `/api/bids/[id]/accept` no longer returns `mode: service_role_fallback`.

## Environment Gaps

- Resend is not configured, so email sending is skipped while in-app notifications work.
- Stripe/FPS payment flows are outside this P0 smoke and should be verified in the payment pass.
