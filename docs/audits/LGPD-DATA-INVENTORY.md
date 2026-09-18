# FibroSync — Inventário de Dados Pessoais (LGPD)

**Data da auditoria:** 2026-09-17
**Método:** Análise estática do código-fonte (backend NestJS/Prisma + frontend React/Vite), leitura de schema, migrations, DTOs, controllers, services e código de UI. Nenhuma alteração foi feita no código, banco ou infraestrutura.
**Como ler este documento:** cada linha representa um dado pessoal (ou grupo de campos correlatos) efetivamente encontrado no código. "Base legal identificada" reflete **apenas o que está tecnicamente implementado ou documentado no repositório** — nunca uma opinião jurídica. Onde não há evidência, consta `BASE LEGAL NÃO DOCUMENTADA`.

---

## 1. Identidade da conta (`User`, `backend/prisma/schema.prisma:9-62`)

| Dado | Categoria | Sensível? | Origem | Finalidade aparente | Tabela/campo | Endpoint | Quem acessa | Onde armazenado | Compartilhado? | Terceiro envolvido? | Retenção identificada? | Forma de exclusão | Base legal | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| E-mail | CONTATO/AUTENTICAÇÃO | Não | Cadastro (`signup-page.tsx`) | Login, identificação única | `users.email` | `POST /auth/signup`, `GET/PATCH /users/me` | Próprio usuário; ADMIN (`GET/PATCH/DELETE /users/:id`) | PostgreSQL (Supabase) | Sim, indiretamente | **api.dicebear.com** (avatar) — `frontend/src/lib/user-profile.ts:80-83` envia o e-mail em texto claro como query string `?seed=` | Não definida | Nenhuma (soft-delete apenas marca `deletedAt`) | BASE LEGAL NÃO DOCUMENTADA | Envio do e-mail a terceiro (Dicebear) não está previsto em nenhuma política; ver Finding F-09 |
| Senha (hash) | AUTENTICAÇÃO | Não (mas crítico p/ segurança) | Cadastro | Autenticação | `users.password_hash` | `POST /auth/signup`, `POST /auth/login` | Ninguém em texto claro; bcrypt (custo 12, `env.validation.ts:19`, `auth.service.ts:93`) | PostgreSQL | Não | Não | N/A | Nunca exibida/exportada | Execução de contrato | — |
| Nome completo | IDENTIFICAÇÃO | Não | Cadastro | Identificação, exibição em posts/comunidade, notas médicas, relatórios admin | `users.full_name` | Múltiplos | Próprio usuário; médico vinculado; admin; outros usuários (via Community Posts, nome real exposto) | PostgreSQL | Sim | **api.dicebear.com** (avatar de posts de comunidade, `community-post-card.tsx:62`) | Não definida | Soft-delete apenas | BASE LEGAL NÃO DOCUMENTADA | Nome real fica público a outros usuários da comunidade junto de relatos de saúde |
| Data de nascimento | IDENTIFICAÇÃO | Não (mas relevante p/ menores) | Cadastro (opcional) | Cálculo de idade (não implementado) | `users.birth_date` | `POST /auth/signup`, `PATCH /users/me` | Próprio usuário; médico vinculado (`doctor.service.ts:248`); admin | PostgreSQL | Não | Não | Não definida | Soft-delete apenas | BASE LEGAL NÃO DOCUMENTADA | Campo **opcional**, sem validação de idade mínima — ver Finding F-07 |
| Gênero | IDENTIFICAÇÃO | Não | Cadastro (opcional) | Perfil | `users.gender` | `PATCH /users/me` | Próprio usuário; admin | PostgreSQL | Não | Não | Não definida | Soft-delete apenas | BASE LEGAL NÃO DOCUMENTADA | — |
| Altura / peso | SAÚDE | **Sim** | Cadastro/perfil (opcional) | Cálculo de IMC/contexto clínico | `users.height_cm`, `users.weight_kg` | `PATCH /users/me` | Próprio usuário; médico vinculado; admin | PostgreSQL | Não | Não | Não definida | Soft-delete apenas | BASE LEGAL NÃO DOCUMENTADA | Dado de saúde armazenado diretamente no registro de identidade, não em tabela clínica separada |
| País / fuso horário | TÉCNICO | Não | Cadastro | Localização aproximada, agendamento | `users.country_code`, `users.timezone` | `PATCH /users/me` | Próprio usuário; admin | PostgreSQL | Não | Não | Não definida | Soft-delete apenas | BASE LEGAL NÃO DOCUMENTADA | — |
| Dados profissionais (especialidade, conselho, telefone, clínica, bio) | ADMINISTRATIVO | Não | Cadastro médico | Identificação profissional, validação de conselho | `users.specialty`, `professional_council_*`, `professional_phone`, `professional_clinic`, `professional_bio` | `PATCH /users/me` (role MEDICAL) | Próprio médico; pacientes vinculados; admin | PostgreSQL | Sim (a pacientes vinculados) | Não | Não definida | Soft-delete apenas | BASE LEGAL NÃO DOCUMENTADA | — |
| Código de vínculo (`patientLinkCode`) | SEGURANÇA | Não | Gerado pelo sistema | Permitir que médico solicite vínculo com paciente | `users.patient_link_code` | `professional-links` endpoints | Paciente; médico que possui o código | PostgreSQL | Não | Não | Regenerável | Regeneração invalida o anterior | Execução de contrato | Protegido por rate limit (`professional-links.service.ts:897-920`) |
| Papel (role) / status da conta | ADMINISTRATIVO | Não | Sistema | Controle de acesso (RBAC) | `users.role`, `users.account_status` | Diversos | Sistema; admin | PostgreSQL | Não | Não | N/A | N/A | Execução de contrato | Nunca setável pelo próprio usuário (DTO `UpdateProfileDto` não inclui `role`) |
| `deletedAt` / `lastLoginAt` | TÉCNICO | Não | Sistema | Soft-delete, telemetria de login | `users.deleted_at`, `users.last_login_at` | — | Admin, sistema | PostgreSQL | Não | Não | Indefinida (nunca expurgado) | N/A | — | Ver Finding F-03/F-04 |

## 2. Sessão e autenticação

| Dado | Categoria | Sensível? | Origem | Finalidade | Tabela/campo | Endpoint | Quem acessa | Onde armazenado | Compartilhado? | Terceiro? | Retenção | Exclusão | Base legal | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Token de acesso (JWT) | AUTENTICAÇÃO | Não | Login | Autorizar requisições | Não persistido (stateless, 15 min) | Header `Authorization` | Cliente (frontend) | **`window.localStorage`** no navegador (`frontend/src/lib/auth-session.ts:5-40`) | Não | Não | 15 min (TTL) | Expira; não há blacklist de access token | Execução de contrato | XSS no frontend pode roubar o token — Finding F-14 |
| Refresh token (hash) | AUTENTICAÇÃO | Não | Login | Renovar sessão | `refresh_tokens.token_hash` (bcrypt) | `POST /auth/refresh`, `POST /auth/logout` | Sistema | PostgreSQL + `localStorage` (valor bruto no cliente) | Não | Não | 7 dias (TTL) ou até revogação | Revogado em logout; sem expurgo de linhas antigas revogadas/expiradas (sem cron) | Execução de contrato | Rotação com detecção de reuso implementada (`auth.service.ts:171-194`) — ponto forte |
| IP e User-Agent da sessão | TÉCNICO/SEGURANÇA | Não | Requisição HTTP | Segurança, auditoria de sessão | `refresh_tokens.ip_address`, `refresh_tokens.user_agent` | Implícito no login/refresh | Sistema | PostgreSQL | Não | Não | Igual ao refresh token | Nunca expurgado isoladamente | Legítimo interesse (segurança) | — |

## 3. Dados clínicos — registro diário (`DailyRecord`, `SymptomSignal`, `SymptomEntry`)

| Dado | Categoria | Sensível? | Origem | Finalidade | Tabela/campo | Endpoint | Quem acessa | Onde armazenado | Compartilhado? | Terceiro? | Retenção | Exclusão | Base legal | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Nível/tipo/área/gatilho de dor | **SAÚDE** | **Sim** | Formulário "pain-log" | Acompanhamento clínico, IA, relatórios | `daily_records.pain_level/type/areas/triggers` | `POST/GET/PATCH/DELETE /daily-records` | Paciente; médico vinculado (com consentimento); admin (agregado); **Google Gemini** (via IA) | PostgreSQL | Sim (médico, IA) | **Google Gemini** (texto e valores enviados como contexto de predição) | Indefinida — sem TTL/expurgo | Cascade ao apagar `User` (nunca ocorre na prática — só soft-delete) | BASE LEGAL NÃO DOCUMENTADA (dado de saúde exige consentimento específico ou tutela de saúde — Art. 11 LGPD) | Ver Finding F-01 |
| Fadiga, sono, humor, estresse, exercício, hidratação, adesão a medicação | **SAÚDE** | **Sim** | Formulário diário | Idem acima | `daily_records.fatigue_level, sleep_hours/quality, stress_level, mood_level, exercise_minutes, water_intake_liters, medication_adherence` | Idem | Idem | PostgreSQL | Sim | Google Gemini | Indefinida | Idem | BASE LEGAL NÃO DOCUMENTADA | `medication_adherence` é dado de saúde de alta sensibilidade |
| Notas livres do paciente | **SAÚDE** | **Sim** | Formulário diário / sinais | Contexto clínico | `daily_records.notes`, `symptom_signals.notes` | Idem | Idem | PostgreSQL | Sim | **Google Gemini** (texto livre, sem sanitização — maior vetor de reidentificação) | Indefinida | Idem | BASE LEGAL NÃO DOCUMENTADA | Texto livre pode conter nomes de terceiros, diagnósticos, localização — Finding F-01 |
| Rigidez, névoa cognitiva, sensibilidade a luz/ruído, questões digestivas, cefaleia, ansiedade, depressão | **SAÚDE (inclui saúde mental)** | **Sim** | Formulário de sinais | Acompanhamento clínico | `symptom_signals.*` (`schema.prisma:180-213`) | `POST/GET /daily-records` (aninhado) | Idem | PostgreSQL | Sim | Google Gemini | Indefinida | Idem | BASE LEGAL NÃO DOCUMENTADA | `anxietyLevel`/`depressionLevel` são dados de saúde mental — tratamento reforçado recomendado |
| Severidade/duração por sintoma catalogado | **SAÚDE** | **Sim** | Formulário | Detalhamento clínico | `symptom_entries.severity/duration_minutes/notes` | Idem | Idem | PostgreSQL | Sim (agregado ao admin) | Não diretamente | Indefinida | Cascade com `DailyRecord` | BASE LEGAL NÃO DOCUMENTADA | — |
| Sensação climática auto-relatada | COMPORTAMENTAL | Não | Formulário | Correlação clima × sintomas | `daily_records.weather_feeling` | Idem | Idem | PostgreSQL | Não | Não | Indefinida | Idem | BASE LEGAL NÃO DOCUMENTADA | — |

## 4. Clima e localização

| Dado | Categoria | Sensível? | Origem | Finalidade | Tabela/campo | Endpoint | Quem acessa | Onde armazenado | Compartilhado? | Terceiro? | Retenção | Exclusão | Base legal | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Latitude/longitude precisas (do dispositivo) | **LOCALIZAÇÃO** | **Sim** (combinada com saúde) | `navigator.geolocation` (frontend, `useWeather.ts:126-146`) | Buscar clima local para correlação com sintomas | **Não persistidas** (não há coluna lat/lon no schema) | `GET /weather/current?lat=&lon=` (query string) | Backend (repassa à Open-Meteo); Open-Meteo | Trafega em texto claro na URL (logs de proxy/CDN, histórico do navegador) | Sim | **Open-Meteo** (`api.open-meteo.com`) — recebe só lat/lon, sem identidade | N/A (não persistida) | N/A | BASE LEGAL NÃO DOCUMENTADA | Enviar coordenada exata via GET (não body) é falha de minimização — Finding F-20 |
| Métricas climáticas (temperatura, umidade, pressão, vento, precipitação) | CLIMÁTICO | Não isoladamente (sensível quando ligado a `userId` + saúde) | Resposta da Open-Meteo | Correlacionar clima com crises de dor | `weather_records.*` | `GET /weather/current` | Paciente; sistema de IA/análise | PostgreSQL | Não | Não (já processado) | Indefinida — sem TTL | Cascade com `User` | BASE LEGAL NÃO DOCUMENTADA | Vinculado a `userId`, retenção indefinida |

## 5. Predições, IA e risco clínico

| Dado | Categoria | Sensível? | Origem | Finalidade | Tabela/campo | Endpoint | Quem acessa | Onde armazenado | Compartilhado? | Terceiro? | Retenção | Exclusão | Base legal | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Predição de crise (regra local) | **SAÚDE/PREDIÇÃO** | **Sim** | Motor de regras interno (`crisis-prediction.service.ts`) | Alertar risco de crise | `crisis_predictions.*` | `GET /crisis-prediction` | Paciente; médico vinculado | PostgreSQL | Não (cálculo local) | Não | Indefinida | Cascade com `DailyRecord`/`User` | BASE LEGAL NÃO DOCUMENTADA | Não envolve terceiro — ponto positivo |
| Snapshot completo enviado à IA (`inputSnapshot`) + resposta bruta do Gemini | **SAÚDE/PREDIÇÃO** | **Sim** | `AiPrediction` | Auditoria/reprodutibilidade da predição de IA | `ai_predictions.input_snapshot`, `provider_response` (JSON) | `GET/POST /ai/*` | Paciente; admin (indireto); Google (já recebeu) | PostgreSQL | Sim (já enviado ao Google) | **Google Gemini** | Indefinida — sem TTL | Cascade com `User` | BASE LEGAL NÃO DOCUMENTADA | Guarda para sempre uma cópia do que foi enviado ao Gemini — Finding F-01 |
| Perfil de risco personalizado (`UserRiskProfile`) | **SAÚDE/PREDIÇÃO** | **Sim** | Motor de análise de padrões | Personalizar predição | `user_risk_profiles.*` | Interno (usado por `ai`/`crisis-prediction`) | Sistema; indiretamente paciente/médico via relatórios | PostgreSQL | Sim (via prompt à IA) | Google Gemini | Indefinida | Cascade com `User` | BASE LEGAL NÃO DOCUMENTADA | — |
| Insights de IA (texto, tipo, relevância) | COMPORTAMENTAL/SAÚDE | Sim | Geração automática | Recomendações ao paciente | `ai_insights.*` | `GET /ai/insights` | Paciente | PostgreSQL | Não | Não | Indefinida | Cascade com `User` | BASE LEGAL NÃO DOCUMENTADA | — |

## 6. Relacionamento médico ↔ paciente

| Dado | Categoria | Sensível? | Origem | Finalidade | Tabela/campo | Endpoint | Quem acessa | Onde armazenado | Compartilhado? | Terceiro? | Retenção | Exclusão | Base legal | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Vínculo médico-paciente (status, datas) | ADMINISTRATIVO/MÉDICO | Não isoladamente | Fluxo de convite/aceite | Autorizar compartilhamento clínico | `doctor_patient_access.*` | `doctor/professional-links` endpoints | Médico; paciente; admin | PostgreSQL | Não | Não | Indefinida | Cascade com `User` | Consentimento do paciente (flag `clinicalDataSharingEnabled`) — implementado tecnicamente | Ponto forte: aplicado no backend, não só na UI (`doctor.service.ts:1033-1050`) |
| Log de auditoria do vínculo (quem pediu/aceitou/revogou) | SEGURANÇA/ADMINISTRATIVO | Não | Sistema | Rastreabilidade | `doctor_patient_access_audit_logs.*` | Interno | Admin (implícito) | PostgreSQL | Não | Não | Indefinida — **sem FK para `User`, sobrevive a exclusões** | Nunca expurgado | Legítimo interesse / obrigação de auditoria | Ver Finding F-28 |
| Nota clínica do médico sobre o paciente | **MÉDICO/SAÚDE** | **Sim** | Médico | Registro clínico | `doctor_notes.content` | `POST/PATCH/DELETE /doctor/notes` | Médico autor; paciente (indireto, não confirmado endpoint de leitura pelo paciente); admin | PostgreSQL | Não a terceiros | Não | Indefinida | Soft-delete (`deletedAt` próprio) + Cascade se doctor/patient apagados | BASE LEGAL NÃO DOCUMENTADA | Nota é apagada em cascade se o **paciente** apaga a conta — pode conflitar com dever de guarda de prontuário do médico; requer decisão jurídica |
| Compartilhamento clínico habilitado (`clinicalDataSharingEnabled`) | CONSENTIMENTO | Não | Configurações do paciente | Controlar acesso médico aos dados | `user_settings.clinical_data_sharing_enabled` | `PATCH /users/me/settings` | Paciente (controla); médico (efeito); sistema | PostgreSQL | Não | Não | N/A | Reversível a qualquer momento pelo paciente | **Este é o mecanismo de consentimento mais próximo de "real" no sistema** | Não é usado para bloquear consultas agregadas do admin — Finding F-19 |

## 7. Relatórios, notificações e comunidade

| Dado | Categoria | Sensível? | Origem | Finalidade | Tabela/campo | Endpoint | Quem acessa | Onde armazenado | Compartilhado? | Terceiro? | Retenção | Exclusão | Base legal | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Relatório agregado (semanal/mensal/trimestral) | **SAÚDE (derivado)** | **Sim** | Agregação de `DailyRecord` etc. | Visão consolidada para paciente/médico | `reports.summary` (JSON), `reports.file_url` (sempre `null` — PDF não implementado) | `GET /reports`, `GET /doctor/patients/:id/reports` | Dono (`where: {id, userId}` — checado); médico vinculado (via `ensureDoctorAccess`) | PostgreSQL | Sim (médico) | Não | Indefinida | Cascade com `User` | BASE LEGAL NÃO DOCUMENTADA | Sem geração real de PDF nem storage externo — menor superfície de exposição do que o esperado |
| Conteúdo de notificação (inclui explicação da IA e fatores de risco) | **SAÚDE (derivado)** | **Sim** | Sistema (crise/IA) | Alertar paciente | `notifications.title/message/payload` | `GET /notifications` | Somente dono (`where: {userId}`) | PostgreSQL | Não | Não (apenas canal IN_APP implementado; EMAIL/SMS/PUSH nunca usados) | Indefinida | Cascade com `User` | BASE LEGAL NÃO DOCUMENTADA | — |
| Post de comunidade (texto livre + nome real do autor) | COMPORTAMENTAL/SAÚDE (auto-revelado) | Pode ser | Usuário | Interação social entre pacientes | `community_posts.content`, autor exposto (`fullName`) | `POST/GET /community-posts` | Qualquer usuário autenticado (sem filtro) | PostgreSQL | Sim (público na plataforma) | Não | Indefinida | **Nenhuma** — não existe endpoint de exclusão/edição (nem frontend, nem backend) | Consentimento por ato de publicação (implícito, não documentado) | Finding F-08 — viola direito de retificação/eliminação de conteúdo autogerado |

## 8. Exercícios

| Dado | Categoria | Sensível? | Origem | Finalidade | Tabela/campo | Endpoint | Quem acessa | Onde armazenado | Compartilhado? | Terceiro? | Retenção | Exclusão | Base legal | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Histórico de exercício realizado (duração, dificuldade percebida, notas) | SAÚDE (leve) | Sim | Registro de sessão de exercício | Acompanhamento de adesão | `exercise_histories.*` | `POST/GET /exercises/history` | Paciente | PostgreSQL | Não | Não | Indefinida | Cascade com `User` | BASE LEGAL NÃO DOCUMENTADA | — |

## 9. Dados administrativos (`SystemSettings`, `SystemSettingsAuditLog`)

| Dado | Categoria | Sensível? | Origem | Finalidade | Tabela/campo | Endpoint | Quem acessa | Onde armazenado | Compartilhado? | Terceiro? | Retenção | Exclusão | Base legal | Observações |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Configurações globais e log de alteração (quem mudou o quê) | ADMINISTRATIVO | Não | Admin | Governança da plataforma | `system_settings.*`, `system_settings_audit_logs.*` | `/admin/settings` | Admin | PostgreSQL | Não | Não | Indefinida | `SetNull` no autor se apagado | Execução de contrato/legítimo interesse | Bom exemplo de auditoria — modelo a replicar para CRUD de usuários (Finding F-18) |

## 10. Dados no dispositivo do usuário (frontend)

| Dado | Categoria | Sensível? | Origem | Finalidade | Local | Quem acessa | Compartilhado? | Retenção | Exclusão | Observações |
|---|---|---|---|---|---|---|---|---|---|---|
| Access token / refresh token | AUTENTICAÇÃO | Não | Login | Autenticar requisições | `window.localStorage` (`accessToken`/`access_token`, `refreshToken`/`refresh_token`) | Qualquer script no mesmo domínio (inclui XSS) | Não | Até logout/expiração | `localStorage.removeItem` no logout | Finding F-14 |
| Estado de "lembrete diário exibido" | COMPORTAMENTAL | Não | Uso do app | Evitar repetir lembrete no mesmo dia | `localStorage` (`fibrosync:routine:<userId>:...`) | Cliente | Não | Sobrescrito diariamente | Nunca expurgado explicitamente | Baixo risco; contém `userId` na chave |
| Histórico de relatórios administrativos gerados (inclui `payload: unknown`) | SAÚDE (agregado, potencial) | Possivelmente | Geração de relatório pelo admin | Cache de UI entre navegações | `sessionStorage` (`fibrosync-admin-reports-history`) | Admin (na própria sessão do navegador) | Não | Até fechar a aba | Nunca expurgado manualmente | Finding F-21 — conteúdo exato do `payload` não verificado em runtime |
| Data (não valor) de registro diário na URL | TÉCNICO | Não | Navegação (`?date=YYYY-MM-DD`) | Pré-selecionar dia no formulário | URL / histórico do navegador | Qualquer um com acesso ao histórico do navegador | Não | Enquanto no histórico do navegador | N/A | Baixo risco isolado |

---

## Resumo por categoria

| Categoria | Nº de linhas de dado identificadas | Observação |
|---|---|---|
| SAÚDE (incluindo saúde mental) | 18 | Núcleo do produto; maior parte sem base legal documentada |
| IDENTIFICAÇÃO / CONTATO | 6 | — |
| AUTENTICAÇÃO / SEGURANÇA | 6 | Tokens em localStorage é o principal risco técnico |
| LOCALIZAÇÃO / CLIMÁTICO | 2 | Coordenadas não persistidas, mas trafegam em URL |
| MÉDICO / ADMINISTRATIVO | 5 | Controle de acesso tecnicamente sólido |
| COMPORTAMENTAL | 3 | Community Posts sem exclusão é o ponto crítico |
| TÉCNICO | 3 | — |

**Nenhuma base legal está formalmente documentada no repositório para nenhum dado pessoal ou sensível.** Onde a tabela indica algo diferente de `BASE LEGAL NÃO DOCUMENTADA`, trata-se de uma inferência técnica razoável (ex.: execução de contrato para autenticação), **não uma determinação jurídica** — **REQUER ANÁLISE JURÍDICA** formal da base legal de cada finalidade, especialmente para dados de saúde (Art. 11 LGPD exige consentimento específico e destacado, ou hipótese de tutela da saúde).
