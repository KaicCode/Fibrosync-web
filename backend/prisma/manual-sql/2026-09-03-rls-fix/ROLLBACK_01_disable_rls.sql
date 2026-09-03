-- ROLLBACK do 01_enable_rls.sql — restaura o estado ANTERIOR exato
-- (RLS desabilitado em todas as 23 tabelas, como estava antes da correção).
-- Use somente se ativar RLS causar alguma regressão inesperada na aplicação
-- que não possa ser resolvida de outra forma. Isso reabre a exposição via
-- Data API do Supabase enquanto estiver aplicado — é uma medida de reversão
-- de emergência, não o estado desejado a médio prazo.

BEGIN;

ALTER TABLE public._prisma_migrations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_access DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_patient_access_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_histories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_signals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptoms DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings_audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_risk_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.weather_records DISABLE ROW LEVEL SECURITY;

SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

COMMIT;
