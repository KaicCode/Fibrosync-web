# FibroSync — Mapeamento de Fluxo de Dados (LGPD)

**Data:** 2026-09-17 · Análise estática, somente leitura. Nenhum dado real foi transmitido durante esta auditoria.

## 1. Fluxo principal (arquitetura confirmada)

```
Paciente / Médico / Admin
        │  HTTPS
        ▼
Frontend (React + Vite + PWA, hospedado na Vercel)
        │  HTTPS + Bearer JWT (armazenado em localStorage)
        ▼
NestJS API (backend/src) — Render (inferido por README/.env.example; NÃO VERIFICADO o host real)
        │  Prisma (@prisma/adapter-pg)
        ▼
PostgreSQL (Supabase)
```

**Confirmado no código:** o frontend não importa `@supabase/supabase-js` nem usa `createClient()`/`VITE_SUPABASE_*` em nenhum arquivo (`frontend/src`, `frontend/package.json`) — todo acesso a dados passa pela API NestJS. Isso corresponde à arquitetura oficial esperada (frontend nunca acessa tabelas clínicas do Supabase diretamente).

**Camada de defesa adicional confirmada no banco:** desde 2026-09-03 (`backend/prisma/manual-sql/2026-09-03-rls-fix/`), as 23 tabelas do schema `public` têm Row Level Security **habilitada** e os grants padrão do Supabase para `anon`/`authenticated` (SELECT/INSERT/UPDATE/DELETE/...) foram **revogados**. Antes dessa data, o estado registrado (`before_state_rls.txt`, `before_state_grants.txt`) mostra RLS **desabilitada** em todas as 23 tabelas com grants completos para `anon`/`authenticated` — ou seja, historicamente existia uma via de acesso direto às tabelas clínicas via API pública do Supabase (PostgREST) para quem tivesse a chave `anon`. **Esse cenário está remediado no estado atual do banco**, mas a correção não faz parte do pipeline de migrations do Prisma (`backend/prisma/migrations/`) — um banco recriado do zero (novo ambiente, disaster recovery, CI) **não reaplica automaticamente** RLS/revogação de grants.

## 2. Fluxo de dado clínico diário (paciente)

```
Paciente preenche formulário "pain-log"
   (dor, fadiga, sono, humor, estresse, ansiedade, depressão, notas livres)
        │
        ▼
Frontend (pain-log-page.tsx) — POST /api/v1/daily-records
        │  Authorization: Bearer <access_token> (lido do localStorage)
        ▼
NestJS DailyRecordsController → DailyRecordsService
        │  Prisma: INSERT com where/userId derivado do JWT (nunca do body)
        ▼
PostgreSQL — tabelas daily_records, symptom_signals, symptom_entries
        │
        ├──► GET /api/v1/daily-records (o próprio paciente)
        ├──► GET /api/v1/doctor/patients/:id/records (médico, SE vínculo ACTIVE e
        │      clinicalDataSharingEnabled=true — checado em doctor.service.ts:1033-1050)
        ├──► admin-analytics (agregado, sem identificação individual na resposta)
        └──► IA (ver fluxo 3 abaixo)
```

## 3. Fluxo de IA / predição de crise (Google Gemini) — CRÍTICO PARA REVISÃO DE PRIVACIDADE

```
DailyRecord + SymptomSignal + UserRiskProfile + predição local (regra)
        │  ai.service.ts monta AiPredictionContext (JSON completo, incluindo
        │  texto livre "notes" do paciente, sem nome/e-mail mas com UUIDs internos)
        ▼
gemini-ai-prediction.provider.ts
        │  client.models.generateContent({ model: 'gemini-2.5-flash', ... })
        │  Prompt = JSON.stringify(context) injetado verbatim
        ▼
Google Gemini API (@google/genai SDK, endpoint generativelanguage.googleapis.com — NÃO VERIFICADO o endpoint exato/servidores)
        │  resposta (texto, probabilidade, explicação, ação sugerida)
        ▼
NestJS persiste ai_predictions.input_snapshot (cópia do que foi enviado)
        e ai_predictions.provider_response (resposta bruta) — SEM TTL
        ▼
Paciente vê insight/predição (GET /ai/*, notificações in-app)
```

**Dado enviado ao Google:** níveis de dor/fadiga/sono/humor/estresse, sintomas booleanos e níveis (incl. ansiedade/depressão), clima recente, aderência a medicação, **texto livre do paciente**, estatísticas agregadas dos últimos dias, perfil de risco personalizado. **Não enviado:** nome, e-mail — mas os UUIDs internos (id do registro, do usuário) são reais e reversíveis dentro do próprio banco da FibroSync.
**País/região do processamento:** NÃO VERIFICADO (depende da configuração de região do Google Gemini/Vertex e não é controlável a partir do código-fonte revisado).
**Política de retenção do Google para os dados enviados:** NÃO VERIFICADO — depende dos termos contratuais/Enterprise da conta Google usada, que não fazem parte deste repositório.

## 4. Fluxo de clima/geolocalização

```
Frontend solicita navigator.geolocation.getCurrentPosition()
        │  (opt-in, trata PERMISSION_DENIED graciosamente — useWeather.ts:149-157)
        ▼
lat/lon (6 casas decimais, ~11cm de precisão) → GET /api/v1/weather/current?lat=&lon=
        │  (coordenadas trafegam na QUERY STRING, não no corpo — Finding F-20)
        ▼
NestJS WeatherService → GET https://api.open-meteo.com/v1/forecast?latitude=&longitude=
        │  (nenhum identificador do usuário é enviado à Open-Meteo — requisição anônima)
        ▼
Open-Meteo retorna métricas (temperatura, umidade, pressão, vento, precipitação)
        ▼
NestJS persiste weather_records (userId + métricas — SEM latitude/longitude)
        ▼
Métricas usadas para correlacionar clima × sintomas (exibido ao paciente;
possivelmente enviado à IA como parte do contexto — ver fluxo 3)
```

**Observação:** embora a coordenada exata não seja persistida no banco, ela trafega em texto claro na URL da chamada `GET /weather/current` (frontend → backend), ficando potencialmente visível em logs de proxy/CDN/histórico do navegador — combinar isso com o fato de a consulta ser feita por um paciente identificado (JWT) é uma combinação sensível (localização + saúde).

## 5. Fluxo de avatar (terceiro não declarado)

```
Frontend (qualquer tela que exiba avatar do usuário ou de um autor de post)
        │  resolveUserAvatar(user) — frontend/src/lib/user-profile.ts:80-83
        │  seed = user.email (ou nome completo, para posts de comunidade)
        ▼
GET https://api.dicebear.com/9.x/notionists/svg?seed=<email ou nome, em texto claro>
        │  (chamada feita diretamente do navegador do usuário — NÃO passa pelo backend)
        ▼
Dicebear (Alemanha/infra própria — NÃO VERIFICADO o país de hospedagem exato)
```

**Isto é uma transferência de dado pessoal (e-mail) para um terceiro (Dicebear) que não está listada em nenhuma política de privacidade nem contrato verificável no repositório.** Não há evidência de DPA (Data Processing Agreement) ou de que este fluxo tenha sido avaliado. Classificado como **ALTO** (Finding F-09).

## 6. Fluxo de acesso do médico ao paciente

```
Médico solicita vínculo com código do paciente (professional-links.service.ts)
        │  Cria doctor_patient_access (status=PENDING) + doctor_patient_access_audit_logs
        ▼
Paciente aceita/rejeita (endpoint próprio, escopado por patientId do JWT)
        │  status=ACTIVE/REJECTED + timestamp + audit log
        ▼
[Médico acessa dados do paciente]
        │  TODA rota /doctor/patients/:patientId/* chama
        │  ensureDoctorAccess(doctorId, patientId) ANTES de qualquer leitura,
        │  que exige: status=ACTIVE, revokedAt=null, E
        │  patient.userSettings.clinicalDataSharingEnabled=true
        │  (doctor.service.ts:1033-1050 — verificado no código, não é confiança apenas no papel do JWT)
        ▼
[Paciente revoga o vínculo]
        │  status=REVOKED, revokedAt=now() + audit log
        │  A partir daqui, ensureDoctorAccess() falha (ForbiddenException) em qualquer
        │  nova chamada do médico — CONFIRMADO por rastreamento de código, não testado em runtime
```

**Este é o controle de autorização mais crítico do sistema e está corretamente implementado no backend**, com defesa em profundidade (vínculo ativo + consentimento explícito do paciente), não dependendo de nenhuma validação client-side.

## 7. Fluxo administrativo (ADMIN)

```
Admin → GET /admin/analytics, GET /admin/dashboard
        │  Prisma consulta dailyRecord/symptomEntry/symptomSignal de TODOS os pacientes
        │  (inclusive os que desativaram clinicalDataSharingEnabled — Finding F-19)
        │  userId é usado internamente para agrupar, mas NUNCA retornado na resposta
        ▼
Resposta = estatísticas agregadas (frequência, percentuais, co-ocorrência)
        — sem nome, e-mail ou userId de pacientes individuais

Admin → GET/PATCH/DELETE /users/:id, /symptoms/admin/:id
        │  Acesso a dado individual, incluindo conteúdo clínico bruto
        │  SEM audit log dedicado (Finding F-18) — diferente do padrão usado
        │  em doctor_patient_access_audit_logs e system_settings_audit_logs
```

## 8. Inventário de terceiros

| Terceiro | Dado recebido | Por quê | Endpoint/local no código | Dado pessoal? | Dado de saúde? | País/região | Retenção conhecida? | Risco | Transferência internacional potencial? |
|---|---|---|---|---|---|---|---|---|---|
| **Google Gemini** (`@google/genai`) | Contexto clínico completo (níveis, sintomas, texto livre, perfil de risco) | Predição de crise por IA | `backend/src/modules/ai/prediction-providers/gemini-ai-prediction.provider.ts` | Indireto (sem nome/e-mail, mas com UUIDs e texto livre potencialmente identificável) | **Sim** | NÃO VERIFICADO | NÃO VERIFICADO (depende dos termos Google) | **CRÍTICO** | **Sim, provável** — infraestrutura Google é global |
| **Open-Meteo** | Latitude/longitude | Buscar dados climáticos | `backend/src/modules/weather/weather.service.ts:99-101` | Sim (localização), mas sem identidade associada | Não diretamente | Europa (serviço público europeu) — NÃO VERIFICADO formalmente | NÃO VERIFICADO | Baixo (requisição anônima) | Possível (serviço europeu, dados de usuários brasileiros) |
| **api.dicebear.com** | E-mail ou nome completo (em texto claro, via URL) | Gerar avatar visual | `frontend/src/lib/user-profile.ts:80-83`, `community-post-card.tsx:62` | **Sim, PII direta** | Não | NÃO VERIFICADO | NÃO VERIFICADO — sem contrato/DPA visível no repositório | **ALTO** | Possível |
| **Supabase** | Todo o banco de dados da aplicação (é o Postgres primário) | Hospedagem de banco de dados | `DATABASE_URL`/`DIRECT_URL` (`*.pooler.supabase.com`) | Sim, integral | Sim, integral | NÃO VERIFICADO (depende da região do projeto Supabase escolhida) | NÃO VERIFICADO | Depende da configuração RLS (ver seção 1) | Depende da região do projeto |
| **Vercel** | Assets estáticos do frontend; potencialmente logs de acesso/CDN | Hospedagem do frontend | `vercel.json`, CORS libera `https://*.vercel.app` | Indireto (logs de acesso podem conter IP) | Não diretamente | NÃO VERIFICADO | NÃO VERIFICADO | Baixo/Médio | Possível |
| **Render** (inferido) | Execução do backend NestJS | Hospedagem da API | Mencionado no prompt de auditoria; não confirmado nos arquivos do repositório | N/A | N/A | NÃO VERIFICADO | NÃO VERIFICADO | — | NÃO VERIFICADO — **requer confirmação manual de qual provedor realmente hospeda o backend em produção** |
| **OpenAI** | Nenhum (variável `OPENAI_API_KEY` existe em `.env.example`/`env.validation.ts` mas não há nenhuma chamada ao SDK da OpenAI no código) | — | — | — | — | — | — | Nenhum (não utilizado atualmente) | — |

## 9. NÃO VERIFICADO — requer checagem manual

- Host real de produção do backend (Render? outro?) e suas configurações de rede/variáveis de ambiente.
- Se a variável `GEMINI_API_KEY` está de fato configurada em produção e qual a região/configuração de retenção de dados da conta Google associada.
- Política de retenção e localização de dados da Open-Meteo e da Dicebear para as requisições feitas por esta aplicação.
- Se existe algum DPA (Data Processing Agreement) assinado com Google, Supabase, Vercel, Render ou Dicebear — não há nenhum documento desse tipo no repositório.
- Conteúdo real do histórico de 3 commits em que `frontend/.env` esteve rastreado no git antes de `a67a899` — não inspecionado para evitar risco de expor um segredo ainda vigente.
