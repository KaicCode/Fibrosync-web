-- FibroSync — Fase 1: ativa Row Level Security nas 23 tabelas do schema public.
-- Gerado em 2026-09-03. NÃO usa FORCE ROW LEVEL SECURITY. NÃO cria policies.
-- Seguro para o Prisma: a conexão do backend usa o role "postgres" (dono das
-- tabelas), que o Postgres sempre isenta de RLS a menos que FORCE seja usado.
-- Efeito esperado: anon/authenticated deixam de enxergar qualquer linha
-- (SELECT) e deixam de conseguir INSERT/UPDATE/DELETE, pois não há nenhuma
-- policy permissiva. NestJS/Prisma continuam funcionando normalmente.

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

-- Verificação dentro da própria transação antes do COMMIT.
SELECT c.relname AS table_name, c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS rls_forced
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r'
ORDER BY c.relname;

COMMIT;
