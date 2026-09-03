-- Fase 4: revoga os grants de DML que o Supabase concede por padrão a
-- anon/authenticated nas 23 tabelas do schema public usadas pelo FibroSync.
-- Escopo estrito: somente essas 23 tabelas, somente os roles anon e
-- authenticated. NÃO toca em outros schemas (auth, storage, realtime,
-- extensions, graphql, vault) nem no role authenticator (usado internamente
-- pelo PostgREST para trocar de role) nem em USAGE de schema.
-- Defesa em profundidade sobre o RLS já ativado na Fase 1.

BEGIN;

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

-- Verificação: não deve sobrar nenhuma linha para anon/authenticated nessas
-- 23 tabelas.
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated')
ORDER BY table_name, grantee, privilege_type;

COMMIT;
