-- FibroSync — RLS baseline verification (F-12). Read-only: performs no
-- writes. Raises an exception (causing a non-zero psql exit code under
-- `-v ON_ERROR_STOP=1`) if either check fails, so it can gate a CI/CD
-- pipeline or a manual pre-deploy checklist.
--
-- Checks, for the same 23 tables covered by apply_rls_baseline.sql:
--   1. Row Level Security is ENABLED on every one of them.
--   2. Neither `anon` nor `authenticated` holds any of
--      SELECT/INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER on any of
--      them.
--
-- HOW TO RUN (manual — never executed automatically by this repo):
--   psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f verify_rls_baseline.sql
-- A clean run prints two NOTICEs ("... OK") and exits 0. Any violation
-- raises an EXCEPTION and exits non-zero, naming the offending table(s).

DO $$
DECLARE
  protected_tables text[] := ARRAY[
    '_prisma_migrations', 'ai_insights', 'ai_predictions', 'community_posts',
    'crisis_predictions', 'daily_records', 'doctor_notes',
    'doctor_patient_access', 'doctor_patient_access_audit_logs',
    'exercise_histories', 'exercises', 'notifications', 'refresh_tokens',
    'reports', 'symptom_entries', 'symptom_signals', 'symptoms',
    'system_settings', 'system_settings_audit_logs', 'user_risk_profiles',
    'user_settings', 'users', 'weather_records'
  ];
  rls_offenders text[];
  grant_offenders text[];
BEGIN
  -- 1. RLS must be enabled on every protected table.
  SELECT array_agg(c.relname ORDER BY c.relname)
    INTO rls_offenders
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname = ANY(protected_tables)
     AND c.relrowsecurity = false;

  IF rls_offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'RLS BASELINE VIOLATION: Row Level Security is DISABLED on: %',
      array_to_string(rls_offenders, ', ');
  END IF;

  RAISE NOTICE 'RLS enabled on all % protected tables — OK', array_length(protected_tables, 1);

  -- 2. Neither anon nor authenticated may hold any DML grant on these
  --    tables.
  SELECT array_agg(DISTINCT format('%s.%s (%s)', table_name, privilege_type, grantee)
                    ORDER BY format('%s.%s (%s)', table_name, privilege_type, grantee))
    INTO grant_offenders
    FROM information_schema.role_table_grants
   WHERE table_schema = 'public'
     AND table_name = ANY(protected_tables)
     AND grantee IN ('anon', 'authenticated');

  IF grant_offenders IS NOT NULL THEN
    RAISE EXCEPTION
      'RLS BASELINE VIOLATION: unexpected grant(s) for anon/authenticated: %',
      array_to_string(grant_offenders, ', ');
  END IF;

  RAISE NOTICE 'No anon/authenticated grants remain on protected tables — OK';
END $$;
