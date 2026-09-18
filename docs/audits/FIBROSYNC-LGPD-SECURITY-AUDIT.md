# FibroSync — LGPD & Security Audit

**Data:** 2026-09-17
**Escopo:** Repositório completo (`backend/` NestJS+Prisma+PostgreSQL/Supabase, `frontend/` React+Vite+PWA), análise estática, somente leitura.
**Nenhuma alteração corretiva foi aplicada durante esta auditoria.** Nenhum código, banco, migration, variável de ambiente, infraestrutura (Vercel/Render/Supabase) ou configuração de RLS foi modificado. Dois `npm audit` (sem `--fix`) foram executados como única operação não puramente leitura, por serem seguros e locais.
**Metodologia:** revisão manual do schema Prisma, migrations e SQL manual de RLS; rastreamento completo Controller → Guard → Service → Prisma para autorização; leitura de todos os DTOs, controllers e services do backend; leitura da configuração PWA/Workbox, storage do navegador e chamadas de rede do frontend; `npm audit --production` em backend e frontend. Toda afirmação técnica cita arquivo e linha. Onde não foi possível confirmar via código estático, consta **NÃO VERIFICADO**. Onde a resposta depende de interpretação jurídica, consta **REQUER ANÁLISE JURÍDICA**.

---

## 1. Executive Summary

O FibroSync é uma healthtech para acompanhamento de fibromialgia com arquitetura tecnicamente robusta em pontos centrais: **autorização é corretamente aplicada no backend** (nenhum IDOR/BOLA encontrado em nenhum endpoint auditado), **o vínculo médico-paciente exige consentimento explícito do paciente e vínculo ativo, verificado a cada requisição** (`doctor.service.ts:1033-1050`), **RLS do Supabase está habilitada e os grants padrão foram revogados** (remediação de 2026-09-03), e a **configuração PWA bloqueia explicitamente qualquer cache de rota de API** (`vite.config.ts:57-88`).

Por outro lado, existem lacunas relevantes de conformidade LGPD e de segurança: **não há mecanismo de autoexclusão de conta nem apagamento real de dados de saúde** (apenas soft-delete administrativo, sem expurgo), **não há política de retenção nem job de purga em lugar nenhum do sistema**, **o consentimento de Termos/Privacidade é validado somente no frontend e nunca chega ao backend**, **não existe Política de Privacidade nem Termos de Uso reais** (apenas texto de marketing atrás de um link morto), **dados clínicos completos — incluindo texto livre do paciente — são enviados ao Google Gemini** para predição de crise, **Community Posts não podem ser editados/excluídos por ninguém**, **o e-mail do usuário é enviado a um serviço terceiro (Dicebear) para gerar avatar**, e **não há rate limiting em login/signup/refresh**.

Este documento não conclui que o FibroSync está ou não "em conformidade com a LGPD" — isso depende de definições jurídicas e de produto que não podem ser resolvidas apenas lendo código (bases legais, políticas formais, DPAs com terceiros). O objetivo é dar uma fotografia técnica precisa, com evidência, para embasar essas decisões.

## 2. Architecture

Confirmado no repositório:

```
Frontend: React 19 + TypeScript + Vite 8 + vite-plugin-pwa (Workbox) — hospedado na Vercel (vercel.json)
Backend:  NestJS 10 + TypeScript + Prisma 7 (@prisma/adapter-pg) + Joi (env validation)
Banco:    PostgreSQL via Supabase (DATABASE_URL/DIRECT_URL apontam para *.pooler.supabase.com)
```

Fluxo real: `Frontend → HTTPS + Bearer JWT → NestJS API (/api/v1) → Prisma → PostgreSQL/Supabase`.
**Confirmado:** o frontend não possui nenhuma dependência ou chamada a `@supabase/supabase-js` — todo acesso a dado passa pela API NestJS, conforme arquitetura oficial esperada.
Guards globais (`app.module.ts:60-67`): `JwtAuthGuard` e `RolesGuard` aplicados via `APP_GUARD` a **toda** rota por padrão (modelo *deny-by-default*, opt-out via `@Public()`).
Host real de produção do backend (Render ou outro): **NÃO VERIFICADO** a partir do repositório.

## 3. Data Inventory

Ver documento dedicado: [`docs/audits/LGPD-DATA-INVENTORY.md`](./LGPD-DATA-INVENTORY.md). Resumo: 21 modelos Prisma, dos quais 12 armazenam dado de saúde direto ou derivado; nenhum campo tem base legal formalmente documentada no repositório.

## 4. Sensitive Health Data

Campos de saúde confirmados (schema.prisma): `painLevel/Type/Areas/Triggers`, `fatigueLevel`, `sleepHours/Quality`, `stressLevel`, `moodLevel`, `medicationAdherence`, `stiffness`, `cognitiveFog(Level)`, `sensitivityLight/Noise(Level)`, `digestiveIssues(Level)`, `headache(Level)`, `anxiety(Level)`, `depression(Level)` (saúde mental), `notes` (texto livre em dois modelos), `heightCm/weightKg` (no próprio `User`), predições de crise/IA e notas médicas (`DoctorNote.content`).

| Ação | Quem pode | Evidência |
|---|---|---|
| Criar | Paciente (via `POST /daily-records`) | `daily-records.controller.ts`, escopado por `@CurrentUser('sub')` |
| Ler (próprio) | Paciente | `where: { userId }` em todos os services (`daily-records.service.ts:228-242`) |
| Ler (paciente vinculado) | Médico com vínculo ACTIVE + `clinicalDataSharingEnabled=true` | `doctor.service.ts:1001-1052` |
| Ler (agregado) | Admin | `admin-analytics.service.ts` — resposta sempre agregada, sem `userId`/`fullName` |
| Ler (individual bruto) | Admin | `symptoms.controller.ts` rotas `admin/:id`, `users.controller.ts :id` — **sem audit log dedicado** |
| Editar | Paciente (próprio registro) | `PATCH /daily-records/:id` com `findOneForUser` antes |
| Excluir | Paciente (próprio registro), Admin (conta inteira via soft-delete) | Nenhum expurgo real — ver Seção 24 |
| Compartilhar | Sistema → Google Gemini | Ver Seção 21 |
| Exportar | Ninguém (relatório é JSON interno; PDF não implementado) | `reports.service.ts:369-405` — `pdfExport.generated: false` sempre |

**Nenhum acesso clínico sem autorização adequada foi encontrado** — todas as rotas que servem dado individual de saúde passam por checagem de posse (`userId` do JWT) ou pela função `ensureDoctorAccess`.

## 5. Data Flow

Ver documento dedicado: [`docs/audits/LGPD-DATA-FLOW.md`](./LGPD-DATA-FLOW.md).

## 6. LGPD Principles

| Princípio | Status | Evidência | Risco | Recomendação |
|---|---|---|---|---|
| **Finalidade** | PARCIAL | Finalidades são infereis pelo código (ex.: dor → acompanhamento), mas nenhuma está documentada formalmente para o titular | MÉDIO | Redigir política de privacidade real listando finalidade de cada categoria de dado |
| **Adequação** | PARCIAL | Coleta é coerente com o produto de saúde, mas dados são reaproveitados para IA externa sem aviso específico | MÉDIO | Avaliar se envio à IA precisa de consentimento destacado adicional (Art. 11) |
| **Necessidade** | PARCIAL | Ex.: admin-analytics consulta todos os pacientes mesmo com `clinicalDataSharingEnabled=false` (`admin-analytics.service.ts:102-135`); latitude/longitude trafega em URL quando poderia ir no corpo | MÉDIO | Aplicar a flag de compartilhamento também às consultas agregadas internas; mover coordenadas para o corpo da requisição |
| **Livre Acesso** | PARCIAL | `GET /users/me` existe; não há endpoint de exportação completa de dados ("baixar meus dados") | MÉDIO | Implementar exportação/portabilidade (Seção 12) |
| **Qualidade dos Dados** | OK | `class-validator` com `whitelist`+`forbidNonWhitelisted`+`transform` globais (`main.ts:108-117`) | BAIXO | — |
| **Transparência** | AUSENTE | Política de Privacidade e Termos de Uso são placeholders de marketing atrás de link `href="#"` morto (`landing-page.tsx:716-777`) | **ALTO** | Redigir e publicar documentos reais antes de qualquer nova coleta |
| **Segurança** | PARCIAL | Autorização forte, mas sem rate limiting, sem Helmet/CSP/HSTS, tokens em localStorage | ALTO | Ver Seções 10, 11, 16 |
| **Prevenção** | PARCIAL | RLS remediada, mas fora do pipeline de migrations (regressão possível em novo ambiente) | ALTO | Automatizar aplicação de RLS/grants (Seção 32) |
| **Não Discriminação** | REQUER ANÁLISE JURÍDICA | Existem "risk profiles"/predições de crise — uso para qualquer decisão automatizada que afete o titular precisaria de avaliação | — | Confirmar que predições nunca geram decisão automatizada sem revisão humana |
| **Responsabilização/Prestação de Contas** | PARCIAL | Auditoria existe para vínculo médico-paciente e configurações do sistema, mas não para CRUD administrativo de usuários/sintomas (Finding F-18) | MÉDIO | Estender audit log a todas as ações administrativas sobre dado pessoal |

## 7. Legal Basis Mapping Status

**BASE LEGAL NÃO DOCUMENTADA** para praticamente todo o inventário (ver Seção 3/Data Inventory). O único mecanismo que se aproxima de uma base legal ativa e revogável é a flag `clinicalDataSharingEnabled` para acesso médico — e mesmo essa não está formalizada como "consentimento" no sentido do Art. 8º LGPD (sem versão de termo, sem timestamp de consentimento specífico). **REQUER ANÁLISE JURÍDICA** para definir a base legal de cada finalidade (provável: execução de contrato para o núcleo do serviço; consentimento específico e destacado para compartilhamento com IA de terceiros e para pesquisa/analytics, conforme Art. 11).

## 8. Consent

- Frontend: checkbox obrigatório "Aceito os Termos de Uso e a Política de Privacidade" (`signup-page.tsx:525-537`), mas os links apontam para `href="#"` (nenhum documento real) e o campo `acceptedTerms` **nunca é enviado ao backend** — confirmado que `SignupDto` (`signup.dto.ts:17-76`) não tem nenhum campo de consentimento.
- **Não existe modelo `Consent` no Prisma.** Nenhum campo `termsAcceptedAt`, `privacyAcceptedAt`, `consentVersion`, IP ou user-agent do aceite.
- O único consentimento efetivamente modelado e revogável é `UserSettings.clinicalDataSharingEnabled`, controlado pelo próprio paciente e **aplicado corretamente no backend para acesso médico** — mas ignorado pelas consultas agregadas de admin-analytics (Finding F-19).
- Não há separação entre finalidades de consentimento (uso do serviço vs. compartilhamento médico vs. IA vs. analytics vs. marketing) — o único checkbox do cadastro agrupa "Termos de Uso" e "Política de Privacidade" em um único aceite "tudo ou nada".
- **REQUER ANÁLISE JURÍDICA DA BASE LEGAL** de cada finalidade antes de desenhar o modelo de consentimento correto.

## 9. Data Subject Rights

| Direito | Existe? | Endpoint | UI | Funciona? | Problema |
|---|---|---|---|---|---|
| Confirmação do tratamento | PARCIAL | `GET /users/me` | Sim (perfil) | Mostra perfil, não todo o tratamento | Não lista finalidades/terceiros |
| Acesso | PARCIAL | `GET /users/me`, `GET /daily-records`, etc. | Sim, por tela | Sim, mas fragmentado | Não há "ver todos os meus dados" consolidado |
| Correção | OK | `PATCH /users/me`, `PATCH /daily-records/:id` | Sim | Sim | — |
| Anonimização | AUSENTE | Nenhum endpoint | Não | — | Não implementado |
| Bloqueio | AUSENTE | Nenhum endpoint | Não | — | Não implementado |
| Eliminação | **AUSENTE (autoatendimento)** | Só `DELETE /users/:id` (Admin-only) | Não há botão "excluir minha conta" no app (não localizado) | Soft-delete apenas, sem apagar dado de saúde | Finding F-03 |
| Portabilidade | AUSENTE | Nenhum endpoint de exportação | Não | — | Não implementado |
| Informação sobre compartilhamento | AUSENTE | Nenhum endpoint/documento lista terceiros | Não | — | Nenhuma política menciona Google Gemini, Open-Meteo ou Dicebear |
| Revogação de consentimento (compartilhamento médico) | **OK** | `PATCH /users/me/settings` (`clinicalDataSharingEnabled`) | Sim | **Sim, confirmado no backend** | Ponto forte real |
| Revogar médico especificamente | OK | Endpoint de revogação em `professional-links`/`doctor` | Sim | Sim, com audit log | — |
| Oposição | AUSENTE | Nenhum endpoint | Não | — | Não implementado |

## 10. Authentication

- Hash de senha: bcrypt, custo configurável via `BCRYPT_SALT_ROUNDS` (padrão 12, faixa 8-15 validada por Joi) — `auth.service.ts:93`, `env.validation.ts:19`.
- JWT: segredos de acesso e refresh **separados**, ambos obrigatórios e com **mínimo de 32 caracteres** (`env.validation.ts:15,17`). TTL padrão: access 15 min, refresh 7 dias.
- **Transporte do token: corpo da resposta JSON, não cookie.** Nenhum uso de `cookie`/`Set-Cookie` encontrado em `backend/src`. Frontend armazena ambos os tokens em `window.localStorage` (`frontend/src/lib/auth-session.ts:5-40`) — ver Finding F-14.
- Refresh token: hash bcrypt antes de persistir (`auth.service.ts:304-307`), **rotação a cada uso com detecção de reuso** (token revogado reutilizado dispara revogação de todas as sessões do usuário — `auth.service.ts:171-194`). Ponto forte.
- Logout: individual e "logout de todos os dispositivos" implementados (`auth.service.ts:206-243`).
- **Reset de senha, verificação de e-mail e login social (Google) NÃO EXISTEM** — grep completo sem resultados em `backend/src/modules/auth`.
- **Nenhum rate limiting** em `/auth/login`, `/auth/signup`, `/auth/refresh` (todos `@Public()`, sem `@Throttle`/`ThrottlerModule` em lugar nenhum do backend) — Finding F-10.

## 11. Authorization

**Resultado geral: nenhum IDOR/BOLA/Broken Access Control encontrado** em rastreamento completo Controller → Service → Prisma dos módulos `daily-records`, `symptoms`, `reports`, `exercises`, `notifications`, `community-posts`, `users`, `doctor`, `ai`, `crisis-prediction`, `weather`, `admin-dashboard`, `admin-analytics`, `system-settings`.

Padrão confirmado em todo endpoint self-service: `userId` vem exclusivamente de `@CurrentUser('sub')` (claim do JWT), nunca de parâmetro de URL/body, e toda consulta usa `where: { id, userId }` (ex.: `daily-records.service.ts:228-242`, `symptoms.service.ts:130-147`, `reports.service.ts:331-345`, `notifications.service.ts:262-276`).

**Mass Assignment:** protegido globalmente por `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` (`main.ts:108-117`). DTOs que contêm `role`/`doctorId`/`patientId` estão todos atrás de `@Roles(Role.ADMIN)`. `UpdateProfileDto` (usado por `PATCH /users/me`) não contém nenhum campo de privilégio.

**Injeção SQL:** nenhuma ocorrência de SQL concatenado. Os únicos `$queryRaw` usam `Prisma.sql` com template tagged (parametrizado) e os dois `$queryRawUnsafe` encontrados (`app.controller.ts:20`, `admin-dashboard.service.ts:511`) usam a string literal fixa `'select 1'`, sem interpolação de entrada do usuário.

Pontos residuais (não são IDOR, mas relevantes):
- Erro `P2002` (conflito de unicidade) retorna os nomes das colunas em conflito via `exception.meta` (`all-exceptions.filter.ts:53`) — pequeno vazamento de estrutura interna (Finding F-24, BAIXO).
- Nenhum audit log para CRUD administrativo de usuários/sintomas (Finding F-18, MÉDIO).

## 12. Doctor ↔ Patient

Testado conceitualmente e confirmado por rastreamento de código:

| Cenário | Resultado |
|---|---|
| Paciente A acessando dado de Paciente B | Bloqueado — toda consulta usa `userId` do próprio JWT |
| Paciente acessando rota médica (`/doctor/*`) | Bloqueado — `@Roles(Role.MEDICAL, Role.ADMIN)` na classe do controller |
| Médico A acessando paciente não vinculado | Bloqueado — `ensureDoctorAccess` lança `ForbiddenException` se não houver `DoctorPatientAccess` com `status=ACTIVE` |
| Médico acessando paciente que revogou acesso | Bloqueado — `buildAccessibleAccessWhere` exige `revokedAt: null` (`doctor.service.ts:1033-1050`) |
| Médico acessando paciente que desligou `clinicalDataSharingEnabled` | Bloqueado — a mesma função exige `patient.userSettings.clinicalDataSharingEnabled: true` |
| Alterar nota de outro médico | Bloqueado — `updateNote`/`deleteNote` conferem `doctorId` da nota antes de `ensureDoctorAccess` |

Ciclo de vida do vínculo: solicitação por código → aceite/rejeição pelo paciente → revogação pelo paciente ou admin, com **timestamp e audit log em todas as transições** (`doctor_patient_access_audit_logs`, `professional-links.service.ts`). Rate limiting próprio (não genérico) protege as ações de busca/solicitação/regeneração de código (`assertWithinRateLimit`, `professional-links.service.ts:897-920`).

**Este é o controle mais bem implementado do sistema.** Nenhuma dependência de validação apenas no frontend foi encontrada.

## 13. Admin Security

- RBAC via `RolesGuard` global; rotas administrativas (`admin/dashboard`, `admin/analytics`, `admin/settings`, `users` CRUD) corretamente marcadas com `@Roles(Role.ADMIN)`.
- **Admin não recebe conteúdo clínico individual via `admin-analytics`/`admin-dashboard`** — ambos retornam apenas agregados (contagens, percentuais, co-ocorrências), confirmado lendo os tipos de resposta (`admin-analytics.types.ts`) e o service (`groupBy`/`count`, `admin-dashboard.service.ts:275-297`).
- **Ressalva de necessidade:** a consulta de agregação (`admin-analytics.service.ts:102-135`) varre `dailyRecord`/`symptomEntry`/`symptomSignal` de **todos** os pacientes, inclusive os que desativaram `clinicalDataSharingEnabled` — essa flag só é respeitada no acesso médico, não no processamento agregado interno do admin. **VIOLAÇÃO POTENCIAL DO PRINCÍPIO DA NECESSIDADE**, pendente de decisão de produto/jurídica sobre se analytics agregado é uma finalidade que dispensa esse controle.
- Admin **tem** acesso a conteúdo clínico individual bruto via `symptoms.controller.ts` (rotas `admin/:id`) e `users.controller.ts` (`GET/PATCH/DELETE /users/:id`) — capacidade operacional plausível para uma plataforma de saúde, mas **sem audit log dedicado** (diferente do padrão já usado para vínculo médico-paciente e configurações do sistema).
- Nenhuma evidência de impersonation, reset de sessão de terceiros ou escalonamento de privilégio por admin.

## 14. Database

- Schema Prisma com 21 modelos, FKs bem definidas, a maioria com `onDelete: Cascade` a partir de `User` (ver mapa completo em `LGPD-DATA-INVENTORY.md`).
- RLS habilitada e grants padrão revogados desde 2026-09-03 (ver Seção 2) — **mas fora do pipeline de migrations do Prisma**, exigindo reaplicação manual em qualquer ambiente novo (Finding F-12).
- Nenhuma migration do Prisma contém `POLICY`/`GRANT`/`REVOKE`/RLS — confirmado via grep em todos os `migration.sql`.
- Nenhum uso de SQL raw não parametrizado com entrada do usuário (Seção 11).
- `backend/prisma/seed.ts:25`: fallback de senha de admin **hardcoded em texto claro no código-fonte**, usado se a variável `ADMIN_SEED_PASSWORD` não estiver definida no ambiente em que o seed rodar. **Requer verificação manual imediata**: confirmar se algum ambiente real (staging/produção) já rodou este seed sem a variável definida — se sim, o hash bcrypt resultante no banco corresponde a uma senha conhecida publicamente por qualquer pessoa com acesso ao repositório (Finding F-02, CRÍTICO condicional).

## 15. API

Tabela de rotas críticas (auth/guard/ownership confirmados por rastreamento de código; ✅ = confirmado seguro, ⚠️ = gap identificado):

| Método | Rota | Auth? | Role? | Ownership? | Dados sensíveis? | Rate limit? | Risco |
|---|---|---|---|---|---|---|---|
| POST | `/auth/signup` | `@Public()` | — | N/A | Senha, dados de perfil | ⚠️ Não | ALTO (força bruta/spam) |
| POST | `/auth/login` | `@Public()` | — | N/A | Credenciais | ⚠️ Não | **ALTO** (credential stuffing) |
| POST | `/auth/refresh` | `@Public()` + `RefreshTokenGuard` | — | Token hash validado | Token | ⚠️ Não | MÉDIO |
| GET/PATCH | `/users/me`, `/users/me/settings` | ✅ JWT | — | ✅ `userId` do JWT | Perfil, saúde (altura/peso) | N/A | BAIXO |
| CRUD | `/daily-records` | ✅ JWT | — | ✅ `where: {id,userId}` | **SAÚDE** | N/A | BAIXO |
| CRUD | `/symptoms` | ✅ JWT | User/Admin | ✅ | **SAÚDE** | N/A | BAIXO |
| GET | `/reports`, `/reports/generate` | ✅ JWT | — | ✅ `where: {id,userId}` | **SAÚDE (derivado)** | N/A | BAIXO |
| CRUD | `/exercises/history` | ✅ JWT | — | ✅ | Saúde leve | N/A | BAIXO |
| GET/POST | `/community-posts` | ✅ JWT | — | N/A (público entre usuários) | Potencialmente saúde (auto-revelado) | N/A | **ALTO** (sem delete/edit — Finding F-08) |
| GET | `/weather/current` | ✅ JWT | — | N/A | Localização | N/A | MÉDIO (lat/lon em query string) |
| GET/POST/PATCH/DELETE | `/doctor/*` | ✅ JWT | `MEDICAL,ADMIN` | ✅ `ensureDoctorAccess` | **SAÚDE + notas médicas** | Rate limit dedicado em links | BAIXO |
| GET/POST/DELETE | `/users` (admin) | ✅ JWT | `ADMIN` | N/A (por natureza) | Identificação + acesso a saúde individual | N/A | MÉDIO (sem audit log) |
| GET | `/admin/analytics`, `/admin/dashboard` | ✅ JWT | `ADMIN` | N/A | Saúde agregada | N/A | MÉDIO (ignora `clinicalDataSharingEnabled`) |
| GET | `/docs` (Swagger) | **⚠️ Nenhum** | — | N/A | Superfície completa da API | N/A | MÉDIO (Finding F-23) |

## 16. Frontend

- Tokens de acesso e refresh em `window.localStorage` (`frontend/src/lib/auth-session.ts`) — exposição a XSS (Finding F-14).
- **Nenhum uso de `@supabase/supabase-js`** — confirma arquitetura esperada.
- **Nenhum `dangerouslySetInnerHTML`** em todo o `frontend/src` — conteúdo de posts renderizado como texto (React escapa automaticamente).
- Apenas 4 ocorrências de `console.*` em todo o frontend, nenhuma logando token ou payload bruto de formulário (`login-page.tsx:65`, `app-error-boundary.tsx:28`, `settings-page.tsx:526,538`).
- E-mail do usuário enviado em texto claro a `api.dicebear.com` para gerar avatar (`frontend/src/lib/user-profile.ts:80-83`) — Finding F-09.
- Latitude/longitude enviadas via query string GET, não corpo da requisição (`frontend/src/services/weather.service.ts:22-26`) — Finding F-20.
- Código morto duplicando lógica de token com `fetch` bruto e chaves de `localStorage` hardcoded (`services/admin.ts`, `services/api.service.ts`, `services/auth.ts`, `hooks/use-admin.ts`, `hooks/useAdmin.ts`) — não referenciado por nenhuma rota ativa, mas risco latente se reativado (Finding F-27, BAIXO).
- Datas (não valores clínicos) aparecem na URL para pré-selecionar formulário (`/app/pain-log?date=...`) — risco baixo isolado.

## 17. PWA

Configuração completa em `frontend/vite.config.ts:10-118` (Workbox via `vite-plugin-pwa`), sem service worker customizado adicional.

**Confirmado, citação literal do código:**
```js
runtimeCaching: [
  { urlPattern: (...) => url.pathname.startsWith('/api/'), handler: 'NetworkOnly', method: 'GET' },
  { ...method: 'POST' }, { ...method: 'PATCH' }, { ...method: 'PUT' }, { ...method: 'DELETE' },
  { urlPattern: /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/i, handler: 'CacheFirst', options: { cacheName: 'same-origin-images', ... } },
  { urlPattern: /^https:\/\/images\.unsplash\.com\//, handler: 'StaleWhileRevalidate', options: { cacheName: 'exercise-images', ... } },
]
```
Todas as 5 combinações de método sob `/api/*` são `NetworkOnly` — nenhum token, dado clínico, relatório ou resposta de médico/admin é lido ou gravado no cache do service worker. Apenas imagens (mesma origem e Unsplash decorativas) são cacheadas. **Isto está corretamente implementado conforme o esperado pela auditoria.**

Ressalva de robustez (não é uma falha ativa): o matcher usa `url.pathname.startsWith('/api/')` como string fixa; se a variável de produção `VITE_API_URL` for configurada de forma que o caminho da API não comece por `/api/`, a regra de segurança deixaria de casar silenciosamente (nenhuma outra regra cobriria essas requisições, então elas simplesmente não seriam cacheadas — não cacheariam por engano, mas o comportamento ficaria implícito em vez de explícito). **NÃO VERIFICADO** o valor real de `VITE_API_URL` em produção.

Manifest (`vite.config.ts:13-42`): sem dado sensível.

## 18. Logs

- `request-logging.interceptor.ts:15-29`: loga somente `MÉTODO URL STATUS - DURAÇÃOms`. Exemplo redigido: `POST /api/v1/daily-records 201 - 42ms`. **Sem corpo, sem headers, sem token.**
- `all-exceptions.filter.ts`: para erros 5xx, loga `MÉTODO URL` + stack trace (só no servidor, nunca na resposta HTTP). Exemplo redigido: `[ERROR] POST /api/v1/ai/predict — TypeError: Cannot read properties of undefined ...`
- `weather.service.ts:50-52`: loga `Weather fetch failed for user [UUID]: <mensagem>` — inclui UUID do usuário (não nome/e-mail/dado de saúde) — Finding F-25 (BAIXO).
- `database/prisma.service.ts:41`: `log: ['error', 'warn']` — **confirmado que logging de queries com parâmetros está desabilitado** (não há `'query'` na lista). `onModuleInit` loga host/porta/nome do banco (não credenciais) ao conectar — Finding F-26 (INFORMATIVO, log de servidor apenas).
- Nenhum `console.log`/`console.error` encontrado em `backend/src` (grep vazio).
- **Nenhum log de senha, token, Authorization header, cookie, sintoma, dor, nota médica ou relatório foi encontrado** nos módulos revisados.

## 19. Reports/PDF

Apesar do nome, **não há geração de PDF implementada**. `reports.service.ts:369-405` grava explicitamente `pdfExport: { readyForFutureGeneration: true, generated: false, fileUrl: null }`. Nenhuma lib de PDF (`pdfkit`, `puppeteer`, `jspdf`) está em `backend/package.json`. `fileUrl` é sempre `null` — **não existe URL pública nem previsível de relatório**. Posse verificada corretamente: `reports.service.ts:331-345`, `where: { id, userId }`. Não há endpoint de médico acessando relatório de paciente fora do módulo `doctor` (que já passa por `ensureDoctorAccess`).

## 20. Community

- **Não existe endpoint de exclusão nem edição de post** em nenhuma camada (backend `community-posts.controller.ts` só expõe `POST`/`GET`; frontend `community.service.ts` só expõe `getPosts`/`createPost`; o botão "..." na UI não tem `onClick`).
- Visibilidade: qualquer usuário autenticado vê todos os posts, sem filtro (`community-posts.service.ts:41-98`).
- Autor exposto com nome completo real (`community-posts.select.ts:12-18`).
- Conteúdo é texto livre de 3 a 1200 caracteres, sem qualquer filtro de conteúdo sensível — paciente pode publicar sintomas/diagnósticos vinculados ao próprio nome.
- Renderização segura (React escapa texto; `dangerouslySetInnerHTML` não é usado).
- **Nenhuma moderação identificada.**

## 21. Third Parties

Ver tabela completa em [`LGPD-DATA-FLOW.md`](./LGPD-DATA-FLOW.md#8-inventário-de-terceiros). Resumo: **Google Gemini** (dado clínico completo, CRÍTICO), **Open-Meteo** (só lat/lon, sem identidade, baixo risco), **api.dicebear.com** (e-mail/nome em texto claro, ALTO), **Supabase** (banco primário), **Vercel** (hospedagem frontend), **Render** (hospedagem backend, host real NÃO VERIFICADO). Nenhum DPA/contrato de processamento de dados foi encontrado no repositório para nenhum desses terceiros.

## 22. International Data Transfers

Toda infraestrutura confirmada (Google, Vercel, Supabase conforme região do projeto, Dicebear) é potencialmente hospedada fora do Brasil. **NÃO VERIFICADO** a região exata de cada serviço a partir do código-fonte — isso depende de configuração de conta/projeto em cada plataforma, não do repositório. **REQUER ANÁLISE JURÍDICA** para transferência internacional de dado de saúde (Art. 33 LGPD) caso alguma dessas regiões esteja fora do Brasil/países com nível adequado de proteção.

## 23. Retention

**Nenhuma política de retenção existe em nenhuma camada do sistema.** Confirmado por grep negativo em todo `backend/src` por `@Cron|CronJob|node-cron|retention|purge|SchedulerRegistry|@Interval`. Nenhum TTL de banco de dados, nenhum job de expurgo de refresh tokens revogados/expirados, nenhuma rotina de anonimização de contas soft-deletadas. **RISCO LGPD — RETENÇÃO NÃO DEFINIDA** para toda categoria de dado, incluindo dado de saúde (Finding F-04, ALTO).

## 24. Account Deletion

**Fluxo real, confirmado no código:**
```
DELETE /users/:id  (@Roles(Role.ADMIN) — SEM endpoint de autoexclusão para o próprio titular)
  → users.service.ts:388-423 softDeleteUser(adminUserId, userId)
      → User.deletedAt = now()
      → RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: now() })
```
Isso é **tudo** que acontece. Login é corretamente bloqueado após soft-delete (`findByEmail` filtra `deletedAt: null`). **Nenhuma das 15+ tabelas relacionadas é apagada, anonimizada ou sequer marcada**: `DailyRecord`, `SymptomSignal`, `SymptomEntry`, `CrisisPrediction`, `AiPrediction`, `AIInsight`, `UserRiskProfile`, `WeatherRecord`, `DoctorNote`, `Report`, `Notification`, `CommunityPost`, `ExerciseHistory` — todas permanecem integralmente no banco, indefinidamente, vinculadas ao UUID do usuário "excluído".

Mapa de cascade (documentado por completo em [`LGPD-DATA-INVENTORY.md`](./LGPD-DATA-INVENTORY.md)): o schema Prisma está bem desenhado para um **hard delete** (quase todas as relações são `onDelete: Cascade`), mas **nenhum caminho de código executa `prisma.user.delete()`** — busca por esse padrão em todo `backend/src` retornou zero resultados. O desenho técnico para apagar de verdade já existe no schema; falta o código que o aciona.

`DoctorPatientAccessAuditLog` não tem FK para `User` (proposital, para sobreviver a exclusões) — aceitável como exceção de auditoria, mas não formalizada como política de retenção (Finding F-28).

**ACCOUNT-DELETION-MAP:** ver seção "2. Account Deletion Cascade Map" replicada acima e detalhada por tabela no inventário de dados.

## 25. Incident Response

Nenhum `SECURITY.md`, runbook ou plano de resposta a incidentes foi encontrado (busca por `*security*`/`*incident*`/`*runbook*` só retornou um script SQL de teste de RLS, que não é um plano de resposta). **ALTO — PLANO DE RESPOSTA A INCIDENTES AUSENTE** (Finding F-13).

## 26. Children/Adolescents

`birthDate` é **opcional** tanto no cadastro (`signup.dto.ts:38-41`) quanto no perfil, sem qualquer validação de idade mínima (`@Min`/comparação com data atual) em nenhuma camada (frontend ou backend). Nenhuma lógica de bloqueio para menores, consentimento parental ou termos específicos foi encontrada. Isso é especialmente relevante porque o app coleta dados de saúde mental (níveis de ansiedade/depressão). **DECISÃO JURÍDICA/PRODUTO NECESSÁRIA** (Finding F-07, ALTO).

## 27. RIPD Readiness

Insumos técnicos levantados nesta auditoria (processos, dados, finalidades aparentes, riscos, controles, terceiros, fluxos, mitigações) estão consolidados nos três documentos desta pasta e podem servir de ponto de partida para um Relatório de Impacto à Proteção de Dados Pessoais formal. **Este conjunto de documentos não substitui uma RIPD nem uma revisão jurídica** — falta, por exemplo, a análise de proporcionalidade e necessidade sob a ótica legal, e a consulta formal ao encarregado (DPO), que não foi identificado em nenhum lugar do repositório.

## 28. Dependency Security

`npm audit --production` executado (sem `--fix`) em ambos os pacotes:

**Backend:** 22 vulnerabilidades (1 baixa, 11 moderadas, **10 altas**) — destaque: `js-yaml` (poluição de protótipo/DoS, via `@nestjs/swagger`), `lodash` (injeção de código via `_.template`, via `@nestjs/config`), `multer` (múltiplos DoS), `mysql2` (downgrade de plugin de autenticação vazando credenciais — presente na árvore de dependências do Prisma mesmo o projeto usando Postgres), `qs`, `valibot`. Correção não-destrutiva disponível para parte delas; outras exigem upgrade de major version (`@nestjs/swagger@12`, `@nestjs/platform-express@12`, `prisma@6.19.3`).

**Frontend:** 7 vulnerabilidades (1 baixa, 1 moderada, **5 altas**) — destaque: **`axios`** (poluição de protótipo permitindo injeção de Basic-auth, bypass de `maxBodyLength`, DoS) — **é o cliente HTTP que carrega o token JWT e todo dado de saúde**, prioridade máxima de correção; `form-data` (injeção CRLF); `nanoid`; `postcss` (XSS, leitura arbitrária de arquivo local via `sourceMappingURL`, risco de build); **`react-router`/`react-router-dom`** (open redirect, XSS em tratamento de erro RSC, DoS por matching de rotas ineficiente, bypass de CSRF) — biblioteca de roteamento central do app. `npm audit fix` reporta correção não-destrutiva disponível para a maioria destes.

Nenhuma correção foi aplicada durante esta auditoria.

## 29. Findings

Todos os achados desta auditoria, com evidência, severidade e nível de confiança. Numeração usada de forma consistente em todo o conjunto de documentos.

| ID | Severidade | Confiança | Título | Arquivo:Linha | Cenário/Impacto |
|---|---|---|---|---|---|
| F-01 | **CRÍTICO** | ALTA | Dados clínicos completos, incluindo texto livre, enviados ao Google Gemini e persistidos indefinidamente | `backend/src/modules/ai/prediction-providers/gemini-ai-prediction.provider.ts:66-140`, `ai-prediction-context.type.ts:74-84`, `ai.service.ts:122-125` | Prontuário comportamental completo do paciente sai da infraestrutura própria para um processador de IA de terceiro, sem pseudonimização do texto livre, sem TTL na cópia local (`inputSnapshot`) |
| F-02 | **CRÍTICO** (condicional) | MÉDIA | Senha de admin de fallback hardcoded em `seed.ts` | `backend/prisma/seed.ts:25` | Se o seed já rodou em qualquer ambiente real sem `ADMIN_SEED_PASSWORD` definida, existe uma conta ADMIN com senha conhecida por qualquer leitor do repositório — **verificar manualmente e rotacionar se aplicável** |
| F-03 | ALTO | ALTA | Sem autoexclusão de conta; soft-delete não apaga dado de saúde | `users.controller.ts:90-98`, `users.service.ts:388-423` | Titular não consegue exercer direito de eliminação (Art. 18 LGPD); dado de saúde de contas "excluídas" permanece para sempre |
| F-04 | ALTO | ALTA | Nenhuma política/mecanismo de retenção em todo o backend | Ausência confirmada por grep em `backend/src` | Dado de saúde retido sem prazo definido, para sempre |
| F-05 | ALTO | ALTA | Consentimento de Termos/Privacidade é só client-side, nunca persistido no backend | `signup-page.tsx:59,71,286-288,525-537`, `signup.dto.ts:17-76` | Impossível comprovar consentimento perante fiscalização (Art. 8º §único LGPD) |
| F-06 | ALTO | ALTA | Nenhum documento real de Política de Privacidade/Termos de Uso | `landing-page.tsx:716-777` (texto de marketing), `signup-page.tsx:531,535` (`href="#"`) | Cadastro exige aceite de documento que não existe de fato |
| F-07 | ALTO | ALTA | Nenhuma política de idade mínima/proteção de menores | `signup.dto.ts:38-41`, `schema.prisma:14` | App de saúde mental/física acessível sem verificação de idade nem consentimento parental |
| F-08 | ALTO | ALTA | Community Posts sem exclusão/edição em nenhuma camada; nome real exposto | `community-posts.controller.ts`, `community-posts.service.ts:21-98`, `community-post-card.tsx:75,81-86` | Paciente não pode remover post com conteúdo de saúde publicado sob o próprio nome |
| F-09 | ALTO | ALTA | E-mail do usuário enviado em texto claro para serviço de avatar de terceiro (Dicebear) | `frontend/src/lib/user-profile.ts:80-83` | PII sai da arquitetura declarada (frontend → só API própria) sem aviso nem contrato verificável |
| F-10 | ALTO | ALTA | Sem rate limiting em login/signup/refresh | `auth.controller.ts:40-83` | Força bruta e credential stuffing sem mitigação |
| F-11 | ALTO | ALTA | Dependências com vulnerabilidades altas ativas (axios, react-router no frontend; js-yaml, lodash, multer no backend) | `npm audit` (Seção 28) | `axios` carrega o JWT e dado de saúde; `react-router` tem XSS/open-redirect conhecidos |
| F-12 | ALTO | ALTA | RLS/revogação de grants do Supabase só existe como SQL manual, fora do pipeline de migrations | `backend/prisma/manual-sql/2026-09-03-rls-fix/`, ausência confirmada em `backend/prisma/migrations/` | Um ambiente novo/recriado não reaplica a proteção automaticamente |
| F-13 | ALTO | ALTA | Nenhum plano de resposta a incidentes documentado | Busca repo-wide sem resultado | Sem processo definido para detectar/conter/comunicar incidente envolvendo dado de saúde |
| F-14 | MÉDIO-ALTO | ALTA | Tokens de acesso/refresh em `localStorage`, não em cookie httpOnly | `frontend/src/lib/auth-session.ts:5-40` | XSS na aplicação (agravado por F-11) permite roubo de sessão completa |
| F-15 | MÉDIO | ALTA | CORS libera `https://*.vercel.app` com `credentials: true` | `backend/src/main.ts:16-23,84-106` | Qualquer app hospedado em subdomínio `*.vercel.app` (obtenível por qualquer pessoa) passa na checagem de origem |
| F-16 | MÉDIO | ALTA | Ausência de Helmet/CSP/HSTS | `backend/src/main.ts` (nenhuma menção), `package.json` sem `helmet` | Sem defesa em profundidade contra clickjacking, MIME sniffing, downgrade de protocolo |
| F-17 | MÉDIO | ALTA | Sem reset de senha, verificação de e-mail ou OAuth | `backend/src/modules/auth/*` | Sem verificação de propriedade do e-mail no cadastro; sem via de recuperação de conta |
| F-18 | MÉDIO | ALTA | Sem audit log para CRUD de usuários/sintomas por admin | `users.service.ts` (createAdminUser/updateUserByAdmin/softDeleteUser), `symptoms.service.ts` (admin CRUD) | Acesso administrativo a dado individual sem trilha de auditoria, ao contrário do padrão já usado em outros módulos |
| F-19 | MÉDIO | MÉDIA | Admin-analytics ignora `clinicalDataSharingEnabled` na consulta agregada | `admin-analytics.service.ts:102-135` | Paciente que desativou compartilhamento ainda tem dado processado internamente para estatística — requer decisão de produto/jurídica sobre finalidade |
| F-20 | MÉDIO | ALTA | Latitude/longitude precisas trafegam via query string GET, correlacionadas a registro de saúde | `frontend/src/services/weather.service.ts:22-26`, `hooks/useWeather.ts:126-146` | Localização exata em logs de proxy/histórico do navegador, combinada a contexto de saúde |
| F-21 | MÉDIO | MÉDIA | Payload de relatório administrativo (potencialmente agregado clínico) cacheado em `sessionStorage` | `frontend/src/pages/admin/reports-page.tsx:104-130`, `types/admin.ts:444-449` | Conteúdo de relatório persistido fora do estado React, acessível via DevTools/XSS na aba do admin |
| F-22 | MÉDIO | MÉDIA | `frontend/.env` esteve rastreado no git por 3 commits antes de remoção | `git log --all -- frontend/.env` (commits `25f861e`, `de4194d`, `bf84870`, removido em `a67a899`) | Conteúdo histórico não inspecionado nesta auditoria (deliberadamente); requer checagem manual |
| F-23 | MÉDIO | ALTA | Swagger (`/docs`) exposto sem qualquer gate de ambiente/autenticação | `backend/src/config/swagger.config.ts` | Superfície completa da API (rotas, DTOs) exposta publicamente, auxiliando reconhecimento por atacante |
| F-24 | BAIXO | ALTA | Erro `P2002` retorna nomes de colunas em conflito | `all-exceptions.filter.ts:53` | Pequeno vazamento de estrutura interna do banco |
| F-25 | BAIXO | ALTA | Log de falha de clima inclui UUID do usuário | `backend/src/modules/weather/weather.service.ts:50-52` | Identificador interno em log de servidor (não PII direta) |
| F-26 | INFORMATIVO | ALTA | Log de conexão ao Postgres inclui host/porta/nome do banco | `backend/src/database/prisma.service.ts:47-58` | Apenas em log de servidor, nunca em resposta de API |
| F-27 | BAIXO | ALTA | Código morto no frontend duplica lógica de token de forma insegura | `frontend/src/services/admin.ts,api.service.ts,auth.ts`, `hooks/use-admin.ts,useAdmin.ts` | Não é executado por nenhuma rota ativa, mas risco se reativado sem revisão |
| F-28 | INFORMATIVO | ALTA | Log de auditoria de vínculo médico-paciente sem FK para `User` | `schema.prisma:355-372` | Proposital (sobrevive a exclusões), mas retenção não formalizada como política |
| F-29 | CRÍTICO (**histórico, remediado**) | ALTA | Antes de 2026-09-03, todas as 23 tabelas Supabase tinham RLS desabilitada e grants completos para `anon`/`authenticated` | `backend/prisma/manual-sql/2026-09-03-rls-fix/before_state_rls.txt`, `before_state_grants.txt` | Historicamente, acesso direto a tabelas clínicas via API pública do Supabase era possível para quem tivesse a chave `anon`. **Corrigido** — ver estado "after" nos mesmos arquivos. Gap de processo residual documentado em F-12 |

**Controles verificados e confirmados corretos (para não gerar falso positivo — ver Seção 44 do prompt de auditoria):** guards globais deny-by-default; ownership check ponta a ponta em todos os módulos self-service; `ensureDoctorAccess` com defesa em profundidade; `ValidationPipe` restritivo; ausência de SQL injection; rotação de refresh token com detecção de reuso; PWA com `NetworkOnly` em toda API; ausência de acesso direto do frontend ao Supabase; ausência de `dangerouslySetInnerHTML`; RLS habilitada e grants revogados no estado atual do banco; relatórios sem PDF/URL pública; weather sem persistir coordenadas nem enviar identidade a terceiro.

## 30. LGPD Compliance Matrix

| Controle | Status | Evidência | Risco |
|---|---|---|---|
| Inventário de dados | OK (produzido nesta auditoria) | `LGPD-DATA-INVENTORY.md` | — |
| Finalidades documentadas | AUSENTE | Nenhum documento formal | MÉDIO |
| Bases legais | AUSENTE | Nenhum campo/documento | ALTO — REQUER ANÁLISE JURÍDICA |
| Dados sensíveis mapeados | OK (produzido nesta auditoria) | `LGPD-DATA-INVENTORY.md` Seção 3-5 | — |
| Consentimento | AUSENTE (backend) | F-05 | ALTO |
| Transparência | AUSENTE | F-06 | ALTO |
| Acesso | PARCIAL | Seção 9 | MÉDIO |
| Correção | OK | `PATCH /users/me` etc. | BAIXO |
| Exclusão | AUSENTE (autoatendimento) / PARCIAL (admin) | F-03 | ALTO |
| Portabilidade | AUSENTE | Seção 9 | MÉDIO |
| Revogação (compartilhamento médico) | **OK** | Seção 12 | BAIXO |
| Compartilhamento (transparência sobre terceiros) | AUSENTE | Seção 21 | ALTO |
| Retenção | AUSENTE | F-04 | ALTO |
| Privacy by Design | PARCIAL | Deny-by-default OK; minimização parcial (F-19, F-20) | MÉDIO |
| Autenticação | PARCIAL | Forte em hashing/rotação; fraca em rate limit/recovery (F-10, F-17) | MÉDIO-ALTO |
| Autorização | **OK** | Seção 11-12 | BAIXO |
| Doctor/Patient | **OK** | Seção 12 | BAIXO |
| Admin | PARCIAL | Sem audit log de CRUD (F-18); ressalva de necessidade (F-19) | MÉDIO |
| RLS | OK (atual) / PARCIAL (processo) | F-12, F-29 | MÉDIO |
| API | PARCIAL | Rate limit ausente (F-10); Swagger exposto (F-23) | MÉDIO |
| Frontend | PARCIAL | Tokens em localStorage (F-14); e-mail a terceiro (F-09) | MÉDIO-ALTO |
| PWA | **OK** | Seção 17 | BAIXO |
| Logs | OK | Seção 18 | BAIXO |
| Backups | NÃO VERIFICADO | Fora do escopo do repositório | — |
| Terceiros | PARCIAL/AUSENTE | Sem DPA verificável; F-01, F-09 | ALTO |
| Transferência internacional | NÃO VERIFICADO | REQUER ANÁLISE JURÍDICA | — |
| Incidentes | AUSENTE | F-13 | ALTO |
| RIPD | Insumos parciais produzidos | Seção 27 | — |
| Menores | AUSENTE | F-07 | ALTO — REQUER DECISÃO JURÍDICA/PRODUTO |
| Política de Privacidade | AUSENTE | F-06 | ALTO |
| Termos de Uso | AUSENTE | F-06 | ALTO |

## 31. Manual Checks Required

1. Confirmar se `backend/prisma/seed.ts` já rodou em qualquer ambiente real sem `ADMIN_SEED_PASSWORD` definida (F-02) — se sim, rotacionar a senha/hash daquela conta admin imediatamente.
2. Inspecionar o conteúdo histórico de `frontend/.env` nos commits `25f861e`, `de4194d`, `bf84870` (antes de `a67a899`) — se algo além de `VITE_API_URL` estiver lá, tratar como comprometido e rotacionar (F-22).
3. Confirmar host real de produção do backend (Render ou outro) e suas variáveis de ambiente/configuração de rede.
4. Confirmar região de hospedagem do projeto Supabase, da conta Google Gemini/Vertex e política de retenção de dados de cada terceiro (F-01, Seção 22).
5. Verificar existência de contrato/DPA com Google, Supabase, Vercel, Render e Dicebear.
6. Verificar política de backup do Supabase (retenção, quem acessa, se backups contêm dados já "excluídos").
7. Confirmar valor real de `VITE_API_URL` em produção e se o matcher `/api/` do Workbox (Seção 17) continua válido.
8. Rodar `npm audit fix` (não destrutivo) em ambiente de teste e validar regressões antes de aplicar em produção (F-11).
9. Avaliar com jurídico a base legal de cada finalidade de tratamento, especialmente para dado de saúde enviado à IA (F-01) e para o público-alvo menor de idade (F-07).

## 32. Remediation Roadmap

**Nenhuma destas fases foi implementada nesta auditoria — apenas propostas para decisão do time.**

- **FASE 0 — Falhas com possibilidade de exposição imediata:** verificar/rotacionar senha de seed (F-02); verificar histórico de `frontend/.env` (F-22); `npm audit fix` não destrutivo em backend e frontend, priorizando `axios`/`react-router` (F-11).
- **FASE 1 — Autenticação/autorização/dados clínicos:** rate limiting em auth (F-10); mover tokens para cookie httpOnly+Secure+SameSite ou mitigar XSS de outra forma (F-14); Helmet/CSP/HSTS (F-16); ajustar CORS para não depender de wildcard `*.vercel.app` em produção (F-15); mover lat/lon para corpo da requisição (F-20); automatizar RLS/grants no pipeline de deploy (F-12).
- **FASE 2 — Consentimento e direitos LGPD:** modelar `Consent` no backend com versão/timestamp/IP/UA (F-05); publicar Política de Privacidade e Termos de Uso reais (F-06); aplicar `clinicalDataSharingEnabled` também ao processamento agregado de admin (F-19); avaliar necessidade de consentimento específico para envio de dado a IA externa (F-01); revisar exposição de PII à Dicebear (F-09).
- **FASE 3 — Retenção/exclusão/portabilidade:** implementar autoexclusão de conta com apagamento/anonimização real de dado de saúde (F-03); definir e implementar política de retenção com job de expurgo (F-04); implementar exportação/portabilidade de dados (Seção 9); implementar exclusão/edição de Community Posts (F-08).
- **FASE 4 — Privacy Policy/Terms/RIPD/processos:** produzir RIPD formal a partir dos insumos desta auditoria (Seção 27); definir política de idade mínima/consentimento parental (F-07); redigir plano de resposta a incidentes (F-13); formalizar contratos/DPA com terceiros (Seção 21/31).
- **FASE 5 — Hardening e governança:** audit log para CRUD administrativo (F-18); gate de ambiente para Swagger (F-23); reset de senha/verificação de e-mail/OAuth (F-17); revisão/remoção de código morto no frontend (F-27); revisar armazenamento de `sessionStorage` de relatórios admin (F-21).
- **FASE 6 — Testes finais:** repetir esta auditoria após as fases acima; adicionar testes automatizados de autorização/ownership/consentimento/exclusão de conta (nenhum teste desse tipo existe hoje — `backend/tests/` contém apenas `system-settings-runtime.test.ts`).

---

## Resultado no Terminal

```
========================================
FIBROSYNC — LGPD & SECURITY AUDIT
========================================

CRÍTICOS: 2 (+ 1 histórico, já remediado)
ALTOS: 11
MÉDIOS: 10
BAIXOS: 4
INFORMATIVOS: 2

LGPD (matriz de 30 controles, Seção 30)
OK: 7
PARCIAL: 12
AUSENTE: 9
NÃO VERIFICADO: 2
REQUER ANÁLISE JURÍDICA: transversal a Bases Legais, Menores, Transferência Internacional

Principais riscos:
1. Dados clínicos completos (incl. texto livre) enviados ao Google Gemini sem base legal específica documentada (F-01)
2. Nenhum mecanismo real de exclusão/anonimização de dado de saúde — soft-delete apenas, admin-only (F-03, F-04)
3. Consentimento de Termos/Privacidade nunca chega ao backend; documentos legais são placeholders atrás de link morto (F-05, F-06)
4. Nenhum rate limiting em autenticação + dependências com vulnerabilidades altas no cliente HTTP/roteador (F-10, F-11)
5. E-mail enviado a terceiro não declarado (Dicebear) e Community Posts sem exclusão/edição (F-09, F-08)

Arquivos produzidos:
- docs/audits/LGPD-DATA-INVENTORY.md
- docs/audits/LGPD-DATA-FLOW.md
- docs/audits/FIBROSYNC-LGPD-SECURITY-AUDIT.md

Testes executados:
- npm audit --production (backend e frontend, sem --fix)
- Rastreamento estático completo Controller → Guard → Service → Prisma para autorização (todos os módulos)
- Leitura integral de schema.prisma, migrations, SQL manual de RLS, DTOs, guards, interceptors, filters
- Leitura de configuração PWA/Workbox e storage do navegador (frontend)

Testes não executados:
- backend/tests/ (único teste existente, system-settings-runtime.test.ts, não foi executado — poderia exigir banco de dados real, o que estaria fora do escopo "não destrutivo" sem confirmação prévia)
- Nenhum teste de penetração dinâmico/runtime contra ambiente real
- npm audit fix (não aplicado, conforme instrução de não corrigir nesta etapa)

Verificações manuais necessárias:
- Ver Seção 31 (9 itens), incluindo rotação potencial de senha de seed e checagem de histórico de frontend/.env

========================================
```

**Nenhuma alteração corretiva foi aplicada nesta auditoria.**
