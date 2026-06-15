# LBID Supabase RPC Smoke Test

Run this sequence when connecting LBID to a real Supabase project.

## 1. Environment

Create `.env.local`:

```powershell
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://127.0.0.1:5301
```

## 2. SQL

In Supabase SQL Editor, run these in order:

1. `src/lib/schema.sql`
2. `supabase-rls-policies.sql`
3. `supabase-v3-01-grants-rls.sql`
4. `supabase-v3-02-submit-bid-rpc.sql`
5. `supabase-v3-03-adjust-token-rpc.sql`

If Supabase shows an RLS warning, choose `Run without RLS`. These files already
enable RLS explicitly.

## 3. Local App

Start the local Next app:

```powershell
npx.cmd next dev -H 127.0.0.1 -p 5301
```

## 4. Seed + Smoke Test

Seed a forwarder test user, agency test user, trial subscription, company profile, and open shipment request:

```powershell
npm.cmd run supabase:seed-rpc
```

Run the smoke test:

```powershell
npm.cmd run supabase:smoke-rpc
```

Expected result:

- `/api/bids` returns `success: true`
- one `bids` row is created
- `company_profiles.token_balance_free + token_balance_paid` decreases by `1`
- one `token_transactions` row is created and linked to the bid
