-- ROLLBACK do 04_revoke_grants.sql — restaura os grants exatamente como
-- estavam antes (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES,
-- TRIGGER para anon e authenticated nas 23 tabelas), confirmados no
-- levantamento "antes" da correção (before_03_grants.txt).
-- Use apenas em caso de regressão causada pela Fase 4 que não possa ser
-- resolvida de outra forma. Isso reabre o acesso de anon/authenticated às
-- tabelas (RLS da Fase 1, se ainda ativo, continua bloqueando o acesso a
-- dados mesmo com os grants restaurados — só desfaz a camada de defesa em
-- profundidade da Fase 4, não a proteção principal).

BEGIN;

GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
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
  TO anon, authenticated;

SELECT grantee, table_name, count(*) AS privileges_restored
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND grantee IN ('anon','authenticated')
GROUP BY grantee, table_name
ORDER BY table_name, grantee;

COMMIT;
