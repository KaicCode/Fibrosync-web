# RLS baseline (F-12)

Reproducible, idempotent version of the manual fix in
[`../2026-09-03-rls-fix/`](../2026-09-03-rls-fix/). That directory documents
*what happened once*; this one is *what must be true on every environment,
forever*, and gives a way to both apply and check it.

## Why this exists

Supabase grants its `anon` and `authenticated` PostgREST roles broad DML
access to every table by default, and does not enable Row Level Security on
tables Prisma creates. Before 2026-09-03 this meant every FibroSync table —
including clinical data — was reachable directly through Supabase's public
API by anyone holding the project's `anon` key. That was fixed manually once
(see the sibling directory), but **the fix lives outside Prisma's migration
history**, so a fresh database (new environment, disaster recovery, a CI job
that provisions Postgres from scratch) does **not** get it automatically.

## Files

- `apply_rls_baseline.sql` — enables RLS and revokes `anon`/`authenticated`
  grants on the 23 application tables. Safe to run any number of times.
- `verify_rls_baseline.sql` — read-only; fails loudly (non-zero exit under
  `psql -v ON_ERROR_STOP=1`) if RLS is off or a forbidden grant exists on
  any of those tables.

## How to run

Both scripts need a role that owns the tables (the same role the Prisma
`DIRECT_URL`/`DATABASE_URL` already connects as) — run them against
`DIRECT_URL` (session-mode, supports DDL) rather than the transaction
pooler:

```bash
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f prisma/manual-sql/rls-baseline/apply_rls_baseline.sql
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f prisma/manual-sql/rls-baseline/verify_rls_baseline.sql
```

Convenience npm scripts wrapping the same commands are available in
`package.json`:

```bash
npm run db:rls:apply
npm run db:rls:verify
```

**Neither script runs automatically** — not in `postinstall`, not in
`prisma:deploy`, not in CI. This is deliberate: DDL/GRANT changes against a
real database should always be a reviewed, explicit step. Run `apply` once
per environment after provisioning (or after any manual `ROLLBACK_*` was
used), then run `verify` — and re-run `verify` as a gate before promoting an
environment to serve real traffic (staging → production), or on a schedule
against production as a drift check.

## When to run this

- Immediately after provisioning any new Supabase/Postgres database for
  this project (a fresh environment, a restored backup, a disaster-recovery
  target).
- After running any of the `ROLLBACK_*.sql` scripts in
  `../2026-09-03-rls-fix/` (those intentionally re-expose the tables and
  must never be left applied).
- As a periodic drift check against every real environment (nothing today
  prevents someone from manually re-granting access in the Supabase
  dashboard).

## What this does NOT do

- It does not create any RLS *policy*. With RLS enabled and no permissive
  policy, `anon`/`authenticated` see zero rows by default — which is the
  desired state, since the NestJS backend never authenticates to Postgres
  as `anon`/`authenticated`, only as the table-owning role.
- It does not touch any other Supabase schema (`auth`, `storage`,
  `realtime`, `extensions`, `graphql`, `vault`) or the internal
  `authenticator` role.
- It is not wired into any automated pipeline in this repository. Doing so
  safely (choosing where the DB credential comes from in CI, deciding
  whether a failed `verify` should block a deploy) is an infrastructure
  decision left to the team — this phase only produces the reproducible,
  auditable scripts.
