-- Fase 2: valida que anon e authenticated ficaram bloqueados após ativar RLS.
-- Tudo dentro de uma única transação com ROLLBACK no final — nada é persistido.

BEGIN;

-- ===== anon =====
SET LOCAL ROLE anon;
SELECT 'anon' AS role, 'users' AS table_name, count(*) AS visible_rows FROM users;
SELECT 'anon', 'daily_records', count(*) FROM daily_records;
SELECT 'anon', 'refresh_tokens', count(*) FROM refresh_tokens;
SELECT 'anon', 'doctor_notes', count(*) FROM doctor_notes;
SELECT 'anon', 'reports', count(*) FROM reports;
SELECT 'anon', 'user_settings', count(*) FROM user_settings;

-- INSERT deve ser rejeitado pela RLS (sem policy permissiva de WITH CHECK).
SAVEPOINT sp_anon_insert;
INSERT INTO user_settings (id, user_id) VALUES (gen_random_uuid(), gen_random_uuid());
ROLLBACK TO SAVEPOINT sp_anon_insert;

-- UPDATE deve afetar 0 linhas (RLS filtra a visibilidade antes do UPDATE).
SAVEPOINT sp_anon_update;
UPDATE user_settings SET daily_summary_enabled = daily_summary_enabled;
ROLLBACK TO SAVEPOINT sp_anon_update;

-- DELETE deve afetar 0 linhas.
SAVEPOINT sp_anon_delete;
DELETE FROM notifications WHERE false; -- guarda extra; medimos via segunda consulta abaixo
ROLLBACK TO SAVEPOINT sp_anon_delete;

RESET ROLE;

-- ===== authenticated =====
SET LOCAL ROLE authenticated;
SELECT 'authenticated' AS role, 'users' AS table_name, count(*) AS visible_rows FROM users;
SELECT 'authenticated', 'daily_records', count(*) FROM daily_records;
SELECT 'authenticated', 'refresh_tokens', count(*) FROM refresh_tokens;
SELECT 'authenticated', 'doctor_notes', count(*) FROM doctor_notes;
SELECT 'authenticated', 'reports', count(*) FROM reports;
SELECT 'authenticated', 'user_settings', count(*) FROM user_settings;

SAVEPOINT sp_auth_insert;
INSERT INTO user_settings (id, user_id) VALUES (gen_random_uuid(), gen_random_uuid());
ROLLBACK TO SAVEPOINT sp_auth_insert;

RESET ROLE;

-- ===== postgres (deve continuar enxergando tudo normalmente) =====
SELECT 'postgres' AS role, 'users' AS table_name, count(*) AS visible_rows FROM users;
SELECT 'postgres', 'daily_records', count(*) FROM daily_records;
SELECT 'postgres', 'refresh_tokens', count(*) FROM refresh_tokens;

ROLLBACK;
