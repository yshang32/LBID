# LBID Codebase Decision

Date: 2026-06-19

## Decision

The official LBID MVP codebase is:

**Next.js 14 App Router + Supabase**

Primary folders/files:

- `src/app`
- `src/components`
- `src/lib`
- `src/app/api`
- Supabase SQL / RPC files in repository root

Deployment target:

- Vercel

Database / backend target:

- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase RPC

## Legacy Demo

The following files are legacy concept-demo assets only:

- `index.html`
- `backend/server.mjs`

They should not receive new production MVP features unless explicitly requested for a quick static demo.

## Reason

LBID is aiming for a real MVP suitable for Cyberport / CCMF preparation.

That requires:

- real user authentication
- persistent database
- transaction-safe token ledger
- sealed bid RPC
- payment records
- document storage
- admin auditability

The static `index.html` + in-memory backend cannot satisfy those requirements because data disappears on restart and there is no real transaction boundary.

## Product Decisions Tied To This

Award mechanism:

- Hybrid model.
- Show lowest valid bid.
- Agency may choose another bid.
- Non-lowest choice requires explicit confirmation with price difference.

Role model:

- Move toward dual-capability company accounts.
- One account may enable Client capability and Forwarder capability.
- UI can still show Agency / Forwarder / Admin labels while the data model evolves.

## Instruction For Future Agents

Do not split work between the legacy static demo and the Next.js application.

When asked to improve LBID, default to the Next.js + Supabase codebase.
