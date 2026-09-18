# FibroSync — Remediação LGPD & Segurança — FASE 0

**Data:** 2026-09-17
**Escopo desta execução:** somente os itens de FASE 0 do roadmap (`FIBROSYNC-LGPD-SECURITY-AUDIT.md`, Seção 32): F-02 (senha admin hardcoded), F-22 (histórico de `frontend/.env`) e F-11 (dependências vulneráveis, correções não destrutivas). Nenhum item de FASE 1-6 foi implementado nesta execução. Nenhum commit e nenhum push foram feitos. Nenhuma alteração de schema Prisma, migration, banco, Supabase, Vercel ou Render foi feita.

---

## F-02 — Senha administrativa hardcoded no seed

**Estado anterior:** `backend/prisma/seed.ts:25` continha `const adminSeedPassword = process.env.ADMIN_SEED_PASSWORD ?? '<senha em texto claro>';` — se a variável de ambiente não estivesse definida no momento em que o seed rodasse, o script criava/atualizava a conta ADMIN usando uma senha fixa, versionada no código-fonte.

**Correção aplicada:**
- Removido completamente o valor de fallback. A leitura da senha agora passa por uma função dedicada, `readAdminSeedPassword()` (`backend/prisma/seed.ts:42-66`), chamada dentro de `ensureAdminUser()` (`backend/prisma/seed.ts:119`).
- **`ADMIN_SEED_PASSWORD` ausente** → a função lança `Error` com mensagem explicativa (sem revelar nenhum valor), interrompendo o `main()` do seed através do `.catch` já existente (`seed.ts:565-569`, que já fazia `console.error(error)` + `process.exit(1)` — comportamento preservado, apenas agora recebe um erro intencional em vez de nunca ocorrer).
- **`ADMIN_SEED_PASSWORD` presente** → validada força mínima antes de prosseguir: comprimento ≥ 12 caracteres e presença de minúscula, maiúscula, dígito e símbolo (`ADMIN_SEED_PASSWORD_COMPLEXITY_REGEX`, `seed.ts:28-33`). Se não atender, o mesmo padrão de erro seguro é lançado. Se atender, o fluxo segue exatamente como antes: `bcrypt.hash(adminSeedPassword, bcryptSaltRounds)` e `upsert`/`update` do usuário ADMIN — **nenhuma outra lógica de criação/atualização do admin foi alterada**.
- Em nenhum ponto a senha é logada, incluída em mensagem de erro ou exposta de qualquer forma — as mensagens de erro citam apenas os requisitos, nunca o valor digitado.
- `backend/.env.example` atualizado com `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` (vazio) e `ADMIN_SEED_FULL_NAME`, todos como placeholders/documentação, com comentário explicando que não há senha padrão e que um valor real nunca deve ser commitado ali.

**Arquivos alterados:**
- `backend/prisma/seed.ts`
- `backend/.env.example`

**Resultado:** confirmado por leitura do diff (`git diff backend/prisma/seed.ts`) — o literal da senha antiga não existe mais em nenhuma linha do arquivo (nem mesmo como comentário). `npm run build` do backend continua passando (o seed não faz parte do build do NestJS, é executado separadamente via `tsx prisma/seed.ts`). O seed **não foi executado** nesta remediação (rodá-lo escreveria no banco de dados, o que está fora do escopo "não destrutivo" desta fase) — a validação foi feita por leitura e análise estática do código.

**AÇÃO MANUAL OBRIGATÓRIA:** não é possível, a partir do código, provar se algum ambiente real (local de desenvolvimento de terceiros, staging ou produção) já executou `npm run prisma:seed` (ou `tsx prisma/seed.ts` diretamente) em algum momento **sem** `ADMIN_SEED_PASSWORD` definida. Se isso já ocorreu, existe hoje uma conta com `role=ADMIN` cujo hash bcrypt corresponde à senha que estava hardcoded no código-fonte (agora removida, mas ainda visível no histórico do Git anterior a esta remediação).

**RECOMENDAÇÃO: caso haja qualquer possibilidade de isso ter ocorrido, ROTACIONAR IMEDIATAMENTE a senha da conta administrativa correspondente** (por padrão, o e-mail seria `fibrosyncadmin@gmail.com`, salvo se `ADMIN_SEED_EMAIL` tenha sido configurada com outro valor em algum ambiente). Esta auditoria não acessou nenhum ambiente de produção para verificar isso.

---

## F-22 — Histórico do `frontend/.env`

**Commits analisados** (identificados na auditoria principal via `git log --all --oneline --follow -- frontend/.env`):

| Commit | Data | Autor | Mensagem |
|---|---|---|---|
| `25f861e` | 2026-05-25 | voidgateway | integrações com frontend (adição do arquivo) |
| `de4194d` | 2026-05-26 | KaicCode | Finalmente funcionou |
| `bf84870` | 2026-06-03 | KaicCode | Atualizações |
| `a67a899` | 2026-08-22 | KaicCode | chore: remove .env from tracking (remoção) |

Inspeção feita com `git show <commit>:frontend/.env`, com os valores imediatamente descartados via `sed -E 's/=.*/=[REDACTED]/'` — **nenhum valor foi impresso, copiado ou registrado em nenhum momento**, apenas os nomes das variáveis à esquerda do `=`.

**Nomes de variáveis encontradas, por commit:**

| Commit | Variáveis presentes |
|---|---|
| `25f861e` | `VITE_API_URL` |
| `de4194d` | `VITE_API_URL` |
| `bf84870` | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `a67a899~1` (estado imediatamente antes da remoção) | `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` |

**Classificação:**

| Variável | Classificação | Justificativa |
|---|---|---|
| `VITE_API_URL` | **PÚBLICA / ESPERADA NO FRONTEND** | É apenas a URL base da própria API do FibroSync; variáveis `VITE_*` são inevitavelmente embutidas no bundle público do frontend. Sem risco. |
| `VITE_SUPABASE_URL` | **PÚBLICA** (mas operacionalmente relevante) | URL de projeto Supabase (formato `https://<ref>.supabase.co`) não é, por si só, um segredo — mas identifica qual projeto a chave abaixo acessa, o que é necessário para a ação de rotação. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **SENSÍVEL — achado NOVO e mais grave do que estimado na auditoria original** | Ver análise abaixo. |

**Achado crítico desta inspeção (escalada em relação ao que constava em F-22 na auditoria original, que ainda não tinha inspecionado o conteúdo):**

Uma chave pública/anônima do Supabase (`VITE_SUPABASE_PUBLISHABLE_KEY`) e a URL do projeto associado estiveram **versionadas em texto claro no histórico do Git entre 2026-06-03 (`bf84870`) e pelo menos 2026-08-22 (remoção em `a67a899`)** — aproximadamente **11 semanas**.

Cruzando com o Finding F-29 da auditoria principal: **antes de 2026-09-03**, todas as 23 tabelas do banco Supabase estavam com Row Level Security **desabilitada** e com grants completos (`SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER`) concedidos aos papéis `anon` e `authenticated` (evidência: `backend/prisma/manual-sql/2026-09-03-rls-fix/before_state_rls.txt` e `before_state_grants.txt`, produzidos e lidos na auditoria original).

**Isso significa que, durante toda a janela em que essa chave esteve no histórico do Git (2026-06-03 até pelo menos 2026-08-22, ou seja, até 12 dias antes da correção de RLS em 2026-09-03), qualquer pessoa com acesso ao histórico do repositório poderia ter usado essa chave "publishable"/anônima, junto com a URL do projeto, para ler e escrever livremente em TODAS as tabelas do banco de dados do FibroSync via API pública do Supabase (PostgREST)** — incluindo `daily_records`, `symptom_signals`, `doctor_notes`, `users`, `refresh_tokens`, etc. Isso não depende de nenhuma vulnerabilidade de código da aplicação: é uma via de acesso totalmente paralela ao backend NestJS.

**NÃO VERIFICADO nesta remediação (e não tentado, por estar fora do escopo seguro desta fase):**
- Se o repositório remoto (`git@github.com:KaicCode/Fibrosync-web.git`, confirmado via `git remote -v`) já foi público em algum momento no GitHub, ou se algum colaborador/serviço externo teve acesso a ele durante essa janela.
- Se essa chave e projeto Supabase específicos ainda são os mesmos usados em produção hoje, ou se já foram substituídos/migrados independentemente desta auditoria.
- Se a chave já foi rotacionada por outra via desde então.

**ROTAÇÃO MANUAL OBRIGATÓRIA:**
- **Supabase Anon/Publishable Key** do projeto identificado por aquele `VITE_SUPABASE_URL` histórico — rotacionar via painel do Supabase (Project Settings → API → rotacionar/gerar nova chave `anon`/`publishable`), **independentemente de a RLS já estar corrigida hoje**, porque a chave permanece extraível do histórico do Git por qualquer pessoa com acesso ao repositório (incluindo qualquer clone já existente, mesmo após a remoção do arquivo do tracking atual — remover um arquivo do HEAD não apaga commits antigos). Verificar também, ao rotacionar, se essa é de fato a mesma instância Supabase usada em produção atualmente (`DATABASE_URL`/`DIRECT_URL` do backend) antes de qualquer ação, para não afetar um projeto diferente por engano.
- Nenhuma outra credencial (`DATABASE_URL`, `JWT_*_SECRET`, `GEMINI_API_KEY`, `OPENAI_API_KEY`) foi encontrada em nenhum commit histórico de `frontend/.env` ou `backend/.env` — `backend/.env` **nunca** foi commitado em nenhum momento (confirmado por `git log --all --oneline -- backend/.env`, resultado vazio).

Nenhuma reescrita de histórico do Git (`filter-repo`/BFG) foi feita ou recomendada como ação automática — rotacionar a credencial exposta é suficiente e é a ação correta; reescrever histórico é uma decisão adicional que cabe ao time, fora do escopo desta fase.

---

## F-11 — Dependências vulneráveis

### `npm audit --production` — ANTES

| Projeto | Critical | High | Moderate | Low | Total |
|---|---|---|---|---|---|
| Backend | 0 | 10 | 11 | 1 | 22 |
| Frontend | 0 | 5 | 1 | 1 | 7 |
| **Combinado** | **0** | **15** | **12** | **2** | **29** |

### Ação executada

Rodado **apenas** `npm audit fix` (sem `--force`) em cada projeto — atualização somente de versões transitivas compatíveis com os intervalos semver já declarados em `package.json`. Confirmado por `git diff --stat`: em **nenhum** dos dois projetos `package.json` foi alterado — só `package-lock.json`.

- **Backend:** `package-lock.json` — 955 inserções / 445 remoções. Duas execuções sucessivas de `npm audit fix` foram necessárias para o npm convergir na resolução de dependências transitivas (comportamento normal do npm ao resolver árvores profundas).
- **Frontend:** `package-lock.json` — 191 inserções / 286 remoções. Uma única execução resolveu 100% das vulnerabilidades reportadas. Versões diretamente relevantes após a atualização: `axios@1.20.0`, `react-router-dom@7.18.4` / `react-router@7.18.4`, `form-data@4.0.6`, `postcss@8.5.28`, `nanoid@3.3.19` — todas dentro dos intervalos `^` já declarados em `frontend/package.json`.

Nenhum `npm audit fix --force` foi executado. Nenhum upgrade de major version foi aplicado.

### `npm audit --production` — DEPOIS

| Projeto | Critical | High | Moderate | Low | Total |
|---|---|---|---|---|---|
| Backend | 0 | 8 | 6 | 1 | 15 |
| Frontend | 0 | 0 | 0 | 0 | **0** |
| **Combinado** | **0** | **8** | **6** | **1** | **15** |

**Frontend: 100% das vulnerabilidades de produção eliminadas** sem nenhuma mudança destrutiva.

**Backend: reduzido de 22 para 15** (redução de ~32%). As **8 vulnerabilidades altas e 6 moderadas remanescentes exigem `npm audit fix --force`** com upgrade de major version das seguintes dependências diretas/indiretas — **não aplicado nesta fase, por ser potencialmente destrutivo**:

| Pacote vulnerável | Via (dependência direta afetada) | Upgrade que o npm propõe |
|---|---|---|
| `js-yaml` | `@nestjs/swagger` | `@nestjs/swagger@12.0.1` (major) |
| `lodash` | `@nestjs/config` | upgrade breaking de `@nestjs/config` |
| `multer` | `@nestjs/platform-express` | `@nestjs/platform-express@12.0.3` (major) |
| `mysql2` | tooling do Prisma (projeto não usa MySQL) | `prisma@6.19.3` (major, downgrade de v7 atual) |
| `qs` | `@nestjs/platform-express` | mesmo upgrade acima |
| `valibot`, `deepmerge-ts`, `file-type` | tooling do Prisma | `prisma@6.19.3` (major) |
| `@nestjs/core` (moderada) | — | upgrade de major do próprio Nest |

Essas correções envolvem migrar `@nestjs/swagger` e `@nestjs/platform-express` para major versions novas e fazer downgrade do Prisma de v7 para v6.19.3 — mudanças com risco real de regressão em Swagger, upload de arquivos e no client do Prisma. **Ficam documentadas para uma fase futura dedicada, com plano de teste de regressão próprio**, conforme instrução explícita desta fase de não fazer upgrade de major indiscriminado.

---

## Validação

| Verificação | Resultado |
|---|---|
| Backend build (`npm run build`) | **PASS** (exit code 0; `prisma generate` + `nest build` + `tsc-alias` sem erros) |
| Frontend build (`npm run build`) | **PASS** (exit code 0; inclui `tsc -b`; service worker PWA gerado normalmente — 96 entradas precache, `dist/sw.js` e `dist/workbox-*.js` presentes) |
| Backend lint (`npm run lint`) | 177 erros — **100% pré-existentes**, confirmados por análise de linha: todos localizados em `admin-dashboard.controller.ts`, `admin-dashboard.service.ts`, `daily-records.service.ts`, `exercises/*` e na seção de dados de exercícios do próprio `seed.ts` (linhas 187-533, array `defaultExercises`, não tocado nesta fase). **A região efetivamente editada nesta fase (linhas 20-66 e 119 de `seed.ts`) não aparece em nenhuma ocorrência de erro.** Nenhum erro novo introduzido. |
| Frontend lint (`npm run lint`) | **PASS** (0 erros) |
| Typecheck | Backend: coberto implicitamente pelo `nest build` (sem erros). Frontend: coberto pelo `tsc -b` dentro do próprio script `build` (sem erros). Nenhum script `typecheck` dedicado existe em nenhum dos dois `package.json` — não foi inventado, conforme instrução. |
| Testes (`npm test`) | **NÃO EXISTEM.** Nenhum script `"test"` está definido em `backend/package.json` nem em `frontend/package.json`. O único arquivo de teste do repositório, `backend/tests/system-settings-runtime.test.ts`, não está associado a nenhum test runner configurado (sem Jest/Vitest no `package.json`) — não foi executado, e não foi criado nenhum script novo para rodá-lo, conforme instrução de não inventar scripts. |
| Fluxos de autenticação (signup/login/refresh/logout) | Nenhum arquivo de `backend/src/modules/auth/*` foi tocado nesta fase. `seed.ts` é um script standalone, não faz parte do build/runtime do NestJS. **Arquitetura de autenticação inalterada**, confirmado por `git status` (arquivos alterados listados abaixo não incluem nenhum arquivo de auth). |

---

## Git Diff — arquivos modificados nesta fase

```
 M backend/.env.example        (placeholder para variáveis do seed — sem segredo)
 M backend/package-lock.json   (dependências transitivas, sem mudança em package.json)
 M backend/prisma/seed.ts      (F-02: remoção da senha hardcoded + validação)
 M frontend/package-lock.json  (dependências transitivas, sem mudança em package.json)
```

Confirmado via `git status --short` e `git diff --stat` que **nenhum outro arquivo** foi tocado. Confirmado por inspeção manual de cada diff que **nenhum segredo real foi adicionado** em nenhum arquivo (apenas placeholders documentais em `.env.example`). Nenhum commit foi criado. Nenhum push foi feito.

---

## Pendências manuais

1. **F-02:** confirmar se `prisma:seed` já rodou em algum ambiente real sem `ADMIN_SEED_PASSWORD` definida; se houver qualquer possibilidade disso, rotacionar imediatamente a senha da conta ADMIN correspondente (padrão: `fibrosyncadmin@gmail.com`, salvo override por `ADMIN_SEED_EMAIL`).
2. **F-22:** rotacionar a Supabase Anon/Publishable Key associada ao projeto identificado pelo `VITE_SUPABASE_URL` que esteve versionado entre 2026-06-03 e 2026-08-22 — confirmando antes se é o mesmo projeto em uso hoje. Opcionalmente, avaliar com o time se vale reescrever o histórico do Git (`git filter-repo`/BFG) para remover o arquivo por completo — isso não substitui a rotação da chave, apenas reduz exposição futura.
3. **F-11:** planejar, em fase dedicada e fora desta execução, o upgrade de `@nestjs/swagger`, `@nestjs/platform-express` e possível ajuste de versão do Prisma para eliminar as 15 vulnerabilidades remanescentes do backend (`js-yaml`, `lodash`, `multer`, `mysql2`, `qs`, `valibot`, `deepmerge-ts`, `file-type`, `@nestjs/core`), com plano de teste de regressão dedicado (upload de arquivos, geração de documentação Swagger, todas as queries Prisma).
4. Definir com o time se o repositório Git deve ter seu histórico reescrito/depurado, e verificar no GitHub se o repositório esteve público durante a janela de exposição da chave Supabase.

---

## Resultado no Terminal

```
========================================
FIBROSYNC — REMEDIATION PHASE 0
========================================

F-02:
CORRIGIDO (código); ação manual pendente de verificação/rotação

Possível senha comprometida:
NÃO VERIFICADO (não é possível confirmar via código se o seed já rodou em produção sem ADMIN_SEED_PASSWORD)

F-22:
SECRETS HISTÓRICOS:
SIM

Rotação necessária:
1. Supabase Anon/Publishable Key (VITE_SUPABASE_PUBLISHABLE_KEY)

F-11:
Vulnerabilidades antes (backend+frontend, --production):
Critical: 0
High: 15
Moderate: 12
Low: 2

Vulnerabilidades depois (backend+frontend, --production):
Critical: 0
High: 8
Moderate: 6
Low: 1

Frontend build:
PASS

Backend build:
PASS

Testes:
NÃO EXISTEM

AÇÕES MANUAIS:
1. Confirmar se o seed já rodou em produção sem ADMIN_SEED_PASSWORD; rotacionar senha do admin se sim.
2. Rotacionar a Supabase Anon/Publishable Key exposta no histórico do git (commits bf84870 a a67a899~1).
3. Confirmar se o repositório GitHub esteve/está público durante a janela de exposição.
4. Planejar upgrade de major version (@nestjs/swagger, @nestjs/platform-express, Prisma) em fase dedicada para eliminar as 15 vulnerabilidades restantes do backend.

========================================
```

**Nenhuma alteração desta fase foi commitada ou enviada ao repositório remoto.** Apenas os itens explicitamente listados na FASE 0 do roadmap foram tratados — nenhum item de FASE 1 a 6 foi implementado.
