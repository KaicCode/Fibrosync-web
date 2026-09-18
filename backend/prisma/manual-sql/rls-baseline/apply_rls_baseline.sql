-- FibroSync — RLS baseline (F-12): idempotent, reproducible version of the
-- one-off fix done on 2026-09-03 (see ../2026-09-03-rls-fix/). Safe to run
-- repeatedly against ANY environment (fresh database, staging, production)
-- without manual bookkeeping of what has already been applied.
--
-- What this does, for the 23 application tables in the `public` schema:
--   1. Enables Row Level Security (ENABLE, not FORCE — the backend
--      connects as the table owner, e.g. `postgres`, which Postgres always
--      exempts from RLS unless FORCE is used; this does not affect the
--      Prisma-backed API in any way).
--   2. Revokes the DML privileges (SELECT/INSERT/UPDATE/DELETE/TRUNCATE/
--      REFERENCES/TRIGGER) that Supabase grants by default to the `anon`
--      and `authenticated` PostgREST roles.
--
-- Both ALTER TABLE ... ENABLE ROW LEVEL SECURITY and REVOKE are naturally
-- idempotent in Postgres — re-running this against a database that is
-- already in the desired state is a safe no-op.
--
-- This script does NOT create any RLS policy: with RLS enabled and no
-- permissive policy, anon/authenticated see zero rows by default, and the
-- REVOKE below removes their write privileges as defense in depth on top
-- of that default-deny.
--
-- Scope is intentionally narrow: only these 23 tables, only anon/
-- authenticated. It never touches other schemas (auth, storage, realtime,
-- extensions, graphql, vault) nor the `authenticator` role used internally
-- by PostgREST to switch roles, nor schema-level USAGE grants.
--
-- HOW TO RUN (manual — never executed automatically by this repo):
--   psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f apply_rls_baseline.sql
-- Run this after every fresh database provisioning / restore, and as a
-- required step (not yet automated) in any CI/CD pipeline that creates a
-- new environment. Pair it with verify_rls_baseline.sql to confirm the
-- result.

BEGIN;

ALTER TABLE public._prisma_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_access_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_records ENABLE ROW LEVEL SECURITY;

REVOKE SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON TABLE
    public._prisma_migrations,
    public.ai_insights,
    public.ai_predictions,
    public.community_posts,
    public.crisis_predictions,
    public.daily_records,
    public.doctor_notes,
    public.doctor_patient_access,
    public.doctor_patient_access_audit_logs,
    public.exercise_histories,
    public.exercises,
    public.notifications,
    public.refresh_tokens,
    public.reports,
    public.symptom_entries,
    public.symptom_signals,
    public.symptoms,
    public.system_settings,
    public.system_settings_audit_logs,
    public.user_risk_profiles,
    public.user_settings,
    public.users,
    public.weather_records
  FROM anon, authenticated;

COMMIT;
