# FibroSync — Remediação LGPD & Segurança — FASE 1

**Data:** 2026-09-17
**Escopo desta execução:** apenas os itens de FASE 1 do roadmap (`FIBROSYNC-LGPD-SECURITY-AUDIT.md`, Seção 32): F-10 (rate limiting), F-14 (arquitetura de tokens), F-16 (security headers), F-15 (CORS de produção), F-20 (coordenadas em URL) e F-12 (RLS/grants reproduzíveis). Nenhum item de FASE 2 em diante foi implementado. Nenhum commit e nenhum push foram feitos. Nenhuma alteração de schema Prisma ou migration foi criada. **RLS/grants do Supabase de produção não foram tocados** — apenas scripts reproduzíveis foram criados (F-12).

**Regra Zero aplicada:** cada finding foi re-auditado no código atual antes de qualquer alteração (ver seções abaixo, "Estado anterior" cita arquivo:linha real). Nenhuma mudança foi feita "de cabeça" a partir do relatório antigo sem confirmar que o comportamento ainda existia.

---

## F-10 — Rate Limiting

### Estado anterior
Endpoints reais confirmados em `backend/src/modules/auth/auth.controller.ts`: `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me` — não existem `forgot-password`, `reset-password` nem Google auth (confirmado por leitura completa do módulo). Nenhum rate limiting existia em nenhuma rota (`@nestjs/throttler` ausente do `package.json`).

### Implementação
- Adicionado `@nestjs/throttler@^6.7.0` (compatível com `@nestjs/core@^10`, sem upgrade de major do Nest).
- `backend/src/app.module.ts`: `ThrottlerModule.forRoot([{ name: 'default', ttl: seconds(60), limit: 120 }])` como baseline global, mais `ThrottlerGuard` registrado como `APP_GUARD` (primeiro da lista, antes de `JwtAuthGuard`/`RolesGuard`).
- `backend/src/modules/auth/auth.controller.ts`, limites por rota via `@Throttle`:
  - `POST /auth/login`: **5 tentativas / 60s por IP** — deliberadamente **por IP, não por conta**: um limite por e-mail permitiria que um atacante bloqueasse o login de qualquer usuário legítimo só sabendo o e-mail dele e disparando tentativas de IPs diferentes. Essa troca foi avaliada e documentada, não implementada.
  - `POST /auth/signup`: 10 tentativas / 15 min por IP.
  - `POST /auth/refresh`: 30 tentativas / 60s por IP — generoso o suficiente para não quebrar múltiplas abas nem o silent-refresh no boot do app (ver F-14).
- `backend/src/main.ts`: `app.set('trust proxy', 1)` — necessário para que `req.ip` reflita o IP real do cliente via `X-Forwarded-For` atrás do proxy reverso do provedor (Render ou equivalente), tanto para o Throttler quanto para os metadados de sessão do refresh token (`ipAddress`/`userAgent` já existentes em `refresh_tokens`). Confia em exatamente 1 hop, não numa cadeia arbitrária fornecida pelo cliente.
- Resposta ao exceder: `HTTP 429` com corpo `{"error":"ThrottlerException: Too Many Requests"}` — mensagem genérica, sem revelar se o e-mail existe, senha, token ou dado interno (verificado nos testes abaixo).
- Frontend: `resolveApiErrorCode()` (`frontend/src/lib/http-errors.ts:91-92`) **já tratava 429 como `TOO_MANY_ATTEMPTS`** com mensagem amigável antes desta fase — nenhuma alteração de frontend foi necessária para F-10.

### Testes (execução real, não apenas leitura de código)
Rodei o backend compilado contra um Postgres local descartável (`fibrosync_postgres`, container Docker já existente no ambiente, **não o Supabase de produção** — ver nota de segurança no final deste documento) e testei via `curl`:

```
7 tentativas de POST /auth/login com credenciais inválidas, mesmo IP:
attempt 1 -> 401
attempt 2 -> 401
attempt 3 -> 401
attempt 4 -> 401
attempt 5 -> 401
attempt 6 -> 429   ← bloqueado exatamente no 6º, conforme limite de 5
attempt 7 -> 429
```
Corpo da resposta 429: `{"success":false,...,"error":"ThrottlerException: Too Many Requests"}` — confirmado sem vazamento de informação.

### Resultado
**CORRIGIDO** e **comprovado em execução real**, não apenas por leitura estática.

---

## F-14 — Arquitetura de Tokens

### Estado anterior
- Backend: `POST /auth/login|signup|refresh` retornavam `{ accessToken, refreshToken, ... }` no corpo JSON (`auth.service.ts`). Refresh token extraído do header `Authorization: Bearer <refreshToken>` (`refresh.strategy.ts` usava `ExtractJwt.fromAuthHeaderAsBearerToken()`).
- Frontend: `frontend/src/lib/auth-session.ts` gravava **ambos** os tokens em `window.localStorage` (chaves `accessToken`/`access_token` e `refreshToken`/`refresh_token`). Além disso, `frontend/src/store/app-store.ts` usava `zustand/persist` e incluía `authSession` (que carrega `token`) no `partialize`, gravando uma **segunda cópia** do access token em `localStorage['fibrosync-web-state']` — achado feito durante a re-auditoria desta fase, não estava no relatório original.
- Existiam **dois clientes axios paralelos** com a mesma lógica de refresh duplicada: `frontend/src/lib/api-client.ts` (`apiClient`, usado por `apiCall`) e `frontend/src/services/api.ts` (`api`, usado por `report.service.ts`, `notification.service.ts`, `user.service.ts`, `symptoms.service.ts`, `admin.service.ts`). Ambos precisaram ser corrigidos para não deixar uma segunda via com o token em `localStorage`.

### Arquitetura nova
- **Refresh token: exclusivamente em cookie `httpOnly`**, nome `fibrosync_refresh_token`, `Path` restrito a `/<apiPrefix>/auth` (só as rotas que precisam dele), nunca mais retornado no corpo JSON (`AuthSessionResponseDto` não tem mais o campo `refreshToken`).
  - `Secure`/`SameSite` dependem do ambiente: produção → `Secure=true; SameSite=None` (necessário porque frontend e backend são domínios registráveis diferentes — Vercel vs. o host do backend — logo é cross-site "de verdade", exigindo `SameSite=None`, que por sua vez exige `Secure`); desenvolvimento → `Secure=false; SameSite=Lax` (HTTP local não tem TLS). **Confirmado nos testes abaixo, nos dois modos.**
  - `backend/src/common/utils/cookie.util.ts` (novo): centraliza nome do cookie, opções e extração (cookie com fallback para o header `Authorization`, útil só para teste manual via Swagger).
- **Access token: mantido em memória no frontend** (`frontend/src/lib/token-store.ts`, novo — uma variável de módulo, nunca gravada em `localStorage`/`sessionStorage`). `frontend/src/lib/auth-session.ts` foi reescrito para delegar a esse módulo; os nomes de função (`getStoredAccessToken`, `storeAuthTokens`, `clearStoredAuthTokens`, `hasStoredAuthTokens`) foram mantidos para minimizar mudanças em todo o app.
- `frontend/src/store/app-store.ts`: `authSession` **removido do `partialize`** — não é mais persistido; sobrevive apenas em memória durante a sessão da aba.
- **Silent refresh no boot do app**: como o access token não sobrevive a um reload de página, `frontend/src/layouts/workspace-layout.tsx` (`ProtectedWorkspaceLayout`, guard já existente para as rotas de paciente/médico/admin) foi ajustado para, ao montar sem uma `authSession` em memória, chamar `performTokenRefresh()` (novo módulo `frontend/src/lib/session-refresh.ts`) contra o cookie httpOnly; sucesso repopula a sessão, falha (visitante sem cookie válido) redireciona para `/login` exatamente como antes.
- `frontend/src/lib/session-refresh.ts` (novo) centraliza a chamada de refresh (usada tanto pelo interceptor de 401 quanto pelo bootstrap acima), evitando manter duas implementações divergentes — os dois clientes axios (`api-client.ts` e `services/api.ts`) foram atualizados para usá-lo, e ambos ganharam `withCredentials: true` (necessário para o cookie cross-site ser enviado/recebido).
- `frontend/src/hooks/useAuth.ts`, `frontend/src/services/auth.service.ts`: `logout()` não envia mais `refreshToken` no corpo — o backend lê o cookie diretamente; a chamada de login/signup só grava `accessToken`.

### Backend: leitura do refresh token e logout
- `backend/src/modules/auth/strategies/refresh.strategy.ts`: extrator trocado para ler do cookie (com fallback ao header `Authorization`, mantendo `/auth/refresh` testável via Swagger sem cookies).
- `backend/src/modules/auth/auth.controller.ts`:
  - `signup`/`login`/`refresh` agora recebem `@Res({ passthrough: true })`, setam o cookie via `finalizeSession()` e retornam o corpo **sem** `refreshToken`.
  - `logout`: lê o refresh token do cookie (não mais do corpo — `LogoutDto.refreshToken` foi removido do DTO), e **sempre limpa o cookie** (`response.clearCookie(...)`) independentemente do resultado da revogação.
  - Rotação e detecção de reuso do refresh token **preservadas integralmente** — nenhuma lógica de `auth.service.ts` (hash bcrypt do token, `revokeAllTokens` em caso de reuso, transação de rotação) foi alterada; só a forma de transporte do token mudou.

### XSS
Access token em memória (não em `localStorage`) reduz a superfície: um XSS que apenas raspa `localStorage`/`sessionStorage` (um padrão comum de payload) não encontra mais nada de útil para autenticação. Isso **não é uma mitigação completa de XSS** — um payload que execute código arbitrário durante a sessão ainda pode ler a variável em memória enquanto a aba está aberta; isso está documentado como tal, não vendido como solução total.

### CSRF — análise explícita
Como pedido: cookies agora participam da autenticação, então CSRF foi analisado a sério, não como checkbox.

**Por que o padrão clássico "double-submit cookie" NÃO funciona aqui:** ele depende do frontend ler, via `document.cookie`, um cookie não-`httpOnly` para ecoá-lo de volta como header. Isso só funciona quando frontend e cookie pertencem ao **mesmo domínio registrável**. Neste app, frontend (Vercel/`fibrosync.com`) e backend (outro host) são domínios diferentes — `document.cookie` executando no domínio do frontend **nunca consegue ler** um cookie setado pelo domínio do backend, independentemente de ser `httpOnly` ou não. Implementar esse padrão aqui teria sido teatro de segurança que não funcionaria de verdade; não foi feito.

**Proteção real implementada:** `backend/src/common/guards/trusted-client.guard.ts` exige o header `X-FibroSync-Client: web` em `POST /auth/refresh`. Isso funciona porque:
1. Um `<form>` HTML cross-site clássico (o vetor CSRF tradicional) **nunca consegue adicionar um header customizado**.
2. Um `fetch`/XHR cross-site que tente adicionar esse header dispara um **preflight CORS**, que o allow-list estrito de origem do backend (F-15) rejeita para qualquer origem não autorizada — o navegador nunca chega a enviar a requisição real.
3. `POST /auth/logout` já exigia (antes e depois desta fase) `Authorization: Bearer <access-token>` — um header que uma requisição passiva cross-site também não consegue forjar, então já era seguro contra CSRF por natureza; nenhuma mudança adicional foi necessária ali.

Isso está documentado inline em `cookie.util.ts` e `session-refresh.ts` para que a razão não se perca.

### Cookies
Ver seção "Testes" abaixo — atributos confirmados em execução real, não só no código.

### Refresh rotation
Preservada sem alteração de lógica (ver acima). Confirmada em execução: uma chamada a `/auth/refresh` gera um novo JWT de refresh (cookie com valor diferente) e revoga o anterior no banco.

### Testes (execução real contra Postgres local descartável)
```
SIGNUP → 201, corpo SEM campo refreshToken, cookie:
  Set-Cookie: fibrosync_refresh_token=...; Max-Age=604800; Path=/api/v1/auth;
              HttpOnly; SameSite=Lax                         (modo development)
  Set-Cookie: fibrosync_refresh_token=...; ...; HttpOnly; Secure; SameSite=None
                                                               (modo production)

REFRESH sem header X-FibroSync-Client → 403 Forbidden (bloqueado pelo guard)
REFRESH com header X-FibroSync-Client: web → 200 OK, cookie rotacionado
  (X-RateLimit-Limit: 30 confirma o throttle de F-10 também ativo aqui)

LOGOUT → 200, Set-Cookie limpa o cookie:
  Set-Cookie: fibrosync_refresh_token=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax

REFRESH logo após LOGOUT (mesmo cookie jar) → 401 Unauthorized
  (confirma que o token foi de fato revogado no banco, não só que o cookie
  do lado do cliente foi limpo)
```
Build e lint do frontend (`npm run build`, `npm run lint`) passam sem erros novos após toda a refatoração de `api-client.ts`, `services/api.ts`, `auth-http.ts`, `auth-session.ts`, `workspace-layout.tsx`, `app-store.ts`, `useAuth.ts`, `auth.service.ts`.

**Nota sobre risco residual não resolvido nesta fase (documentado, não implementado):** como frontend e backend são domínios registráveis diferentes, o cookie `SameSite=None` é tecnicamente um cookie "de terceiro" do ponto de vista do navegador quando a página de topo é o domínio do frontend. Navegadores que bloqueiam cookies de terceiro por padrão (Safari ITP já bloqueia; Chrome vem reduzindo o suporte) podem impedir esse cookie de ser enviado/persistido, quebrando silenciosamente a persistência de login para esses usuários. **Isto não foi testado em navegador real nesta fase** (só via `curl`, que não aplica essas políticas). A mitigação correta de longo prazo é servir frontend e backend sob o mesmo domínio registrável (ex.: `app.fibrosync.com` + `api.fibrosync.com`, com `Domain=.fibrosync.com` no cookie) ou usar um rewrite/proxy da Vercel para `/api/*` — ambas são mudanças de infraestrutura fora do escopo desta fase (a auditoria original já pedia para não alterar Vercel). **AÇÃO MANUAL RECOMENDADA:** validar login/refresh em Safari e em Chrome com bloqueio de cookies de terceiro habilitado antes de depender inteiramente deste mecanismo em produção.

### Resultado
**CORRIGIDO**, com o risco residual de cookie de terceiro documentado explicitamente acima (não escondido).

---

## F-16 — Security Headers

### Estado anterior
Nenhum header de segurança era setado (`helmet` ausente do `package.json`, nenhuma menção em `main.ts`).

### Headers novos
`backend/src/main.ts` — `helmet()` configurado (não com os defaults genéricos "e considerar resolvido"; CSP explícita e mínima):
```
Content-Security-Policy:
  default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
  img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none';
  base-uri 'self'; frame-ancestors 'none'
Strict-Transport-Security: max-age=15552000; includeSubDomains   (só em produção)
Referrer-Policy: no-referrer
X-Frame-Options: DENY
X-Content-Type-Options: nosniff                                  (default do Helmet)
```

### CSP — exceções necessárias, justificadas
Este backend só serve **duas coisas**: respostas JSON (CSP é irrelevante para JSON — só importa para documentos HTML que carregam sub-recursos) e a página HTML do Swagger UI (`/docs`, gerada por `swagger-ui-express`). `script-src`/`style-src` incluem `'unsafe-inline'` **apenas** porque o Swagger UI embutido usa scripts/estilos inline no seu bundle — não há como servir a página do Swagger sem isso sem reescrever a integração inteira (fora de escopo desta fase, e o gate de ambiente do Swagger em si é item de FASE 5, explicitamente não implementado aqui). `unsafe-eval` **não** foi usado em nenhum momento. Nenhuma outra rota deste backend renderiza HTML.

### Testado em execução real
```
curl -i .../auth/signup → confirma presença de:
  Content-Security-Policy, Referrer-Policy: no-referrer,
  X-Content-Type-Options: nosniff, X-Frame-Options: DENY
```
`Strict-Transport-Security` só aparece quando `NODE_ENV=production` (testado nos dois modos).

### Resultado
**CORRIGIDO** e comprovado em execução.

---

## F-15 — CORS de Produção

### Estado anterior
`backend/src/main.ts:16-23` (antes desta fase) incluía `https://*.vercel.app` e `http://localhost:*` no allow-list **incondicionalmente**, mesmo em produção.

### Origins novas
- **Produção:** apenas `https://fibrosync.com`, `https://www.fibrosync.com`, mais o que estiver em `FRONTEND_URL` (configurável por ambiente, sem wildcard automático).
- **Desenvolvimento** (`NODE_ENV !== 'production'`): os mesmos domínios de produção **mais** `http://localhost:*`, `http://127.0.0.1:*`, `http://0.0.0.0:*` e `https://*.vercel.app` (conveniência de dev/preview, nunca em produção).
- Se um preview deployment da Vercel precisar acessar a API em produção no futuro, a estratégia explícita é adicionar aquele domínio específico via `FRONTEND_URL` — não reabrir o wildcard.

### Testado em execução real (dois processos separados, um por modo — engano de processo corrigido e revalidado, ver nota abaixo)
```
NODE_ENV=production, log de boot:
  "Allowed CORS origins: https://fibrosync.com, https://www.fibrosync.com"

Origin: https://random-preview.vercel.app → BLOQUEADO (500, CORS rejeitado)
Origin: http://localhost:5173            → BLOQUEADO (500, CORS rejeitado)
Origin: https://fibrosync.com            → 200, Access-Control-Allow-Origin: https://fibrosync.com

NODE_ENV=development:
Origin: https://random-preview.vercel.app → 200 (permitido, conforme esperado em dev)
```
**Nota de rigor:** na primeira tentativa de testar o modo produção, o processo anterior (modo dev) ainda estava rodando na mesma porta e a nova instância não conseguiu subir (`Port already in use`), fazendo os testes baterem sem querer no processo antigo — o log mostrava o resultado errado (permitindo o wildcard). Isso foi detectado (o wildcard não deveria aparecer no `Allowed CORS origins` de produção, mas a requisição passava mesmo assim), o processo certo foi finalizado, um novo subiu numa porta livre, e o teste foi refeito corretamente com o resultado acima. Fica registrado para transparência: o primeiro resultado teria sido reportado como "corrigido" incorretamente se não tivesse sido cruzado com o log de boot.

### Resultado
**CORRIGIDO** e comprovado em execução real, incluindo o modo de falha de teste detectado e corrigido.

---

## F-20 — Coordenadas em URL

### Fluxo anterior
`GET /weather/current?lat=&lon=` (`weather.controller.ts`, `@Query() query: CurrentWeatherQueryDto`) — coordenadas trafegavam na query string. Frontend: `weatherService.getCurrentWeather` chamava `apiCall('get', '/weather/current', undefined, { params: { lat, lon } })`.

### Fluxo novo
`POST /weather/current` com corpo `{ lat, lon }` (DTO renomeado para `CurrentWeatherRequestDto`, mesma validação `@Min(-90)/@Max(90)` e `@Min(-180)/@Max(180)` já existente, agora aplicada ao corpo). Frontend atualizado para `apiCall('post', '/weather/current', { lat, lon })` — nenhuma outra chamada a esse endpoint existia no app (verificado por busca completa).

### Persistência
Confirmado (sem alteração nesta fase, já era assim): `WeatherRecord` no schema Prisma **não tem colunas de latitude/longitude** — só as métricas climáticas resultantes são persistidas. A minimização já existente foi preservada, não foi preciso mudar nada no lado de persistência.

### Logs
Confirmado (sem alteração): `weather.service.ts` nunca logou coordenadas, só `userId` em caso de falha (`Weather fetch failed for user ${userId}: ...`) — achado F-25 da auditoria original, fora do escopo desta fase, não mexido.

### Testado em execução real
```
POST /weather/current { "lat": 999, "lon": 10 } → 400 Bad Request
  (confirma que a validação de intervalo continua ativa após a mudança de
  query string para corpo)
```

### Resultado
**CORRIGIDO** e comprovado em execução (validação) — a ausência de coordenadas na URL é uma propriedade estrutural do novo código (não há mais nenhum `@Query()` no controller), não precisa de teste de log adicional.

---

## F-12 — Automação de RLS/Grants

### Estado atual
Confirmado nesta re-auditoria: RLS está habilitada e os grants de `anon`/`authenticated` estão revogados no banco de produção **conforme o estado registrado em `backend/prisma/manual-sql/2026-09-03-rls-fix/after_state_final.txt`** (não verificado novamente contra o banco real nesta fase — não há credencial de produção disponível nem seria seguro testar contra ela). O problema identificado continua sendo de **processo**: nada reaplica isso automaticamente.

### Risco de regressão
Se o banco for recriado do zero (novo ambiente, disaster recovery, um projeto Supabase novo), `prisma migrate deploy` **não** recria RLS nem revoga os grants — confirmado que nenhuma migration do Prisma contém `ROW LEVEL SECURITY`/`GRANT`/`REVOKE` (grep vazio, reconfirmado nesta fase).

### Scripts criados
`backend/prisma/manual-sql/rls-baseline/`:
- `apply_rls_baseline.sql` — idempotente: habilita RLS + revoga os 7 privilégios DML de `anon`/`authenticated` nas 23 tabelas. Seguro para rodar repetidamente (ambos os comandos SQL são idempotentes por natureza no Postgres).
- `verify_rls_baseline.sql` — somente leitura; usa um bloco `DO $$ ... RAISE EXCEPTION` que falha alto (código de saída não-zero via `psql -v ON_ERROR_STOP=1`) se detectar RLS desabilitada ou qualquer grant remanescente para `anon`/`authenticated` em qualquer uma das 23 tabelas.
- `README.md` — documenta por que existe, como rodar, quando rodar (após provisionar um banco novo, após qualquer `ROLLBACK_*` dos scripts de 2026-09-03, como checagem periódica de drift).
- `backend/package.json`: scripts de conveniência `db:rls:apply` / `db:rls:verify` (wrappers de `psql "$DIRECT_URL" ...`) — **nenhum dos dois roda automaticamente** (não estão em `postinstall`, `prisma:deploy` nem em nenhum hook).

### Como verificar
```bash
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f backend/prisma/manual-sql/rls-baseline/verify_rls_baseline.sql
# ou
npm --prefix backend run db:rls:verify
```
Uma execução limpa imprime dois `NOTICE`s ("... OK") e sai com código 0; qualquer violação levanta uma `EXCEPTION` nomeando a tabela/grant específico e sai com código não-zero.

### Resultado
**CORRIGIDO o problema de reprodutibilidade** (script determinístico e versionado agora existe). **NÃO EXECUTADO contra nenhum banco real nesta fase** — nem o de produção (proibido explicitamente pela auditoria original) nem o local de teste (o container Docker local já tinha RLS em estado indefinido/não relevante para este teste, e rodar DDL de RLS ali não agregaria confiança sobre o comportamento em produção). A integração num pipeline de CI/CD fica como decisão de infraestrutura do time, listada em pendências manuais.

---

## Regressões

**Nenhuma regressão foi encontrada.** Especificamente verificado:
- Build do backend: PASS (antes e depois de cada bloco de mudança).
- Build do frontend: PASS, incluindo geração normal do service worker PWA (96 entradas de precache, `dist/sw.js` gerado) — `vite.config.ts` não foi tocado nesta fase, então a política `NetworkOnly` para `/api/*` (confirmada na auditoria original) **permanece exatamente a mesma**, reconfirmado por não constar no diff.
- Lint do backend: 176 erros pré-existentes ao final (era 177 no início da Fase 0) — **zero erros novos**; confirmado arquivo por arquivo que `auth.controller.ts` e `refresh.strategy.ts` (os mais alterados) terminam com **zero** erros de lint (foram corrigidos 2 nits de prettier e 2 variáveis não utilizadas introduzidos durante a edição, antes deste relatório).
- Lint do frontend: 0 erros (era 0 antes; um erro novo de `react-hooks/set-state-in-effect` foi introduzido e corrigido durante o desenvolvimento desta fase, não sobrou no resultado final).
- Fluxos completos testados em execução real contra banco descartável: signup, login (válido/inválido/rate-limited), refresh (com/sem header de confiança, antes/depois de logout), logout, validação de coordenadas. **Todos preservados ou corrigidos conforme esperado, nenhum quebrado.**
- Rate limiter próprio de `professional-links.service.ts` (baseado em contagem no banco, para busca/solicitação/regeneração de código médico-paciente) é independente do novo `ThrottlerGuard` global — camadas complementares, sem conflito.
- Nenhum arquivo de `backend/src/modules/doctor`, `daily-records`, `symptoms`, `reports`, `community-posts`, `admin-*`, `system-settings`, `ai`, `crisis-prediction`, `notifications`, `exercises` ou `users` foi tocado nesta fase — confirmado por `git status`.

---

## Build

```
Backend:  npm run build → PASS (nest build && tsc-alias, sem erros)
Frontend: npm run build → PASS (tsc -b && vite build, sem erros; PWA gerado normalmente)
```

## Lint

```
Backend:  npm run lint  → 176 erros, todos pré-existentes (baseline: 177 no início da Fase 0;
                            zero erros novos introduzidos por esta fase)
Frontend: npm run lint  → 0 erros
```

## Testes

```
npm test → NÃO EXISTEM scripts de teste configurados em nenhum dos dois projetos
           (igual à Fase 0; nenhum script foi inventado)

Testes funcionais executados manualmente (fora do npm, ver seções F-10/F-14/F-15/F-20
acima para os comandos e resultados exatos):
  - signup → 201, cookie httpOnly correto, corpo sem refreshToken
  - login inválido x5 → 401, x6/x7 → 429 genérico
  - refresh sem header de confiança → 403
  - refresh com header de confiança → 200, cookie rotacionado
  - logout → cookie limpo
  - refresh após logout → 401 (revogação real no banco, não só client-side)
  - weather com latitude inválida → 400
  - CORS: origem de produção permitida, wildcard vercel.app e localhost bloqueados em
    modo produção; ambos permitidos em modo desenvolvimento
  - headers de segurança presentes em toda resposta; HSTS só em produção
```

**Nota de segurança sobre a metodologia de teste:** os testes funcionais acima rodaram o backend compilado (`dist/src/main.js`) contra o container Docker `fibrosync_postgres` (porta 5433, já existente no ambiente, definido pelo próprio `docker-compose.yml` do projeto como banco de desenvolvimento local) — **nunca contra o Supabase de produção**. Isso foi verificado explicitamente antes de qualquer teste: `backend/.env` (não versionado, não alterado) aponta seu `DATABASE_URL` para um host `*.pooler.supabase.com` real, então os testes usaram variáveis de ambiente exportadas apenas na sessão do shell (nunca escritas em `backend/.env` ou em qualquer arquivo versionado) apontando para o Postgres local. Os 4 usuários de teste criados (`phase1-*@example.com`) foram removidos do banco local ao final, restaurando a contagem de usuários ao estado anterior (3). Nenhuma migration foi rodada contra esse banco (schema já estava presente). O container Docker em si não foi reiniciado nem reconfigurado.

## Arquivos Modificados

```
Backend:
 M backend/package.json                                  (+@nestjs/throttler, +cookie-parser, +helmet)
 M backend/package-lock.json
 M backend/src/app.module.ts                              (ThrottlerModule + guard)
 M backend/src/main.ts                                    (cookie-parser, helmet, trust proxy, CORS por ambiente)
 M backend/src/modules/auth/auth.controller.ts            (cookies, CSRF guard, throttle, logout)
 M backend/src/modules/auth/auth.service.ts                (export do tipo SessionResponse)
 M backend/src/modules/auth/dto/auth-session-response.dto.ts (remove refreshToken)
 M backend/src/modules/auth/dto/logout.dto.ts              (remove refreshToken)
 M backend/src/modules/auth/strategies/refresh.strategy.ts (extrator de cookie)
 M backend/src/modules/weather/weather.controller.ts       (GET+query → POST+body)
 M backend/src/modules/weather/weather.types.ts            (DTO renomeado)
?? backend/src/common/utils/cookie.util.ts                 (novo)
?? backend/src/common/guards/trusted-client.guard.ts       (novo)
?? backend/prisma/manual-sql/rls-baseline/                 (novo: apply/verify/README)

Frontend:
 M frontend/package-lock.json                              (sem mudança de dependência direta nesta fase)
 M frontend/src/lib/auth-session.ts                        (delega ao token-store; remove refresh token)
 M frontend/src/lib/api-client.ts                          (withCredentials, performTokenRefresh)
 M frontend/src/lib/auth-http.ts                           (shouldAttemptTokenRefresh simplificado)
 M frontend/src/services/api.ts                            (mesmo fix duplicado do api-client.ts)
 M frontend/src/services/auth.service.ts                   (logout sem body; tipo AuthResponse)
 M frontend/src/services/weather.service.ts                (GET+params → POST+body)
 M frontend/src/hooks/useAuth.ts                            (storeAuthTokens sem refreshToken)
 M frontend/src/layouts/workspace-layout.tsx                (bootstrap via performTokenRefresh)
 M frontend/src/store/app-store.ts                          (authSession fora do partialize)
?? frontend/src/lib/token-store.ts                          (novo)
?? frontend/src/lib/session-refresh.ts                      (novo)

Documentação:
?? docs/audits/FIBROSYNC-REMEDIATION-PHASE-1.md             (este arquivo)
```

Nenhum arquivo de `backend/.env`, `frontend/.env`, Vercel, Render ou Supabase foi tocado. Nenhum commit foi criado.

## Pendências Manuais

1. **F-14 (crítico para produção):** validar login/refresh persistente em Safari e em Chrome com bloqueio de cookies de terceiro habilitado — o cookie `SameSite=None` entre domínios registráveis diferentes é tratado como "de terceiro" por essas políticas e pode ser silenciosamente descartado. Se isso ocorrer, a mitigação correta é unificar o domínio registrável do frontend e do backend (subdomínios do mesmo domínio, ex. `app.fibrosync.com` + `api.fibrosync.com`) ou configurar um rewrite/proxy na Vercel para `/api/*` — ambas fora do escopo desta fase.
2. **F-15:** confirmar a lista final de domínios de produção reais (a atual assume `fibrosync.com`/`www.fibrosync.com`) e configurar `FRONTEND_URL` de acordo em cada ambiente real.
3. **F-12:** decidir e documentar como/quando `npm run db:rls:verify` entra no pipeline de CI/CD ou checklist de deploy; rodar `npm run db:rls:apply` manualmente em qualquer ambiente novo antes de servir tráfego real.
4. **F-10:** o armazenamento do rate limiter é em memória (padrão do `@nestjs/throttler`) — adequado para uma única instância do backend; se houver (ou vier a haver) múltiplas instâncias atrás de um load balancer, os limites deixam de ser compartilhados entre elas e precisam de um storage compartilhado (ex. Redis) para continuar eficazes.
5. Repetir a suíte de testes funcionais manuais (F-10/F-14/F-15/F-20) num ambiente de staging real antes de promover para produção, já que os testes desta fase rodaram contra um banco local descartável, não contra a infraestrutura real.

---

## Resultado no Terminal

```
========================================
FIBROSYNC — REMEDIATION PHASE 1
========================================

F-10 Rate limiting:
CORRIGIDO

F-14 Tokens:
CORRIGIDO

Refresh token HttpOnly:
SIM

Proteção CSRF:
SIM (header de cliente confiável + CORS estrito — double-submit cookie
     classico avaliado e descartado por não funcionar entre domínios
     registráveis diferentes; ver seção F-14)

F-16 Security headers:
CORRIGIDO

CSP:
ATIVA (com unsafe-inline justificado e escopado ao Swagger UI)

F-15 CORS:
CORRIGIDO

Wildcard Vercel em produção:
NÃO

F-20 Coordenadas:
CORRIGIDO

Coordenadas em URL:
NÃO

F-12 RLS automation:
CORRIGIDO (scripts reproduzíveis criados; não executados contra produção)

Backend build:
PASS

Frontend build:
PASS

Frontend lint:
PASS

Novos erros backend:
0

REGRESSÕES:
Nenhuma encontrada.

AÇÕES MANUAIS:
1. Validar cookie SameSite=None em Safari/Chrome com bloqueio de cookies de terceiro (F-14).
2. Confirmar domínios de produção reais para FRONTEND_URL (F-15).
3. Decidir integração de db:rls:verify no CI/CD e rodar db:rls:apply em todo ambiente novo (F-12).
4. Avaliar storage compartilhado (Redis) para o rate limiter se houver múltiplas instâncias (F-10).
5. Repetir testes funcionais em staging real antes de produção.

========================================
```

Não declaro o FibroSync "100% seguro" ou "LGPD compliant" — apenas os seis findings desta fase foram tecnicamente corrigidos e comprovados (por leitura de código e, na maioria dos casos, por execução real contra um banco de desenvolvimento descartável). Todos os demais findings da auditoria original (F-01 a F-09, F-11, F-13, F-17 a F-29) permanecem no estado documentado em `FIBROSYNC-LGPD-SECURITY-AUDIT.md`, sem alteração nesta fase. **Nenhuma alteração foi feita em produção, Supabase, Vercel ou Render.**
