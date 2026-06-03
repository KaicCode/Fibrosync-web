# Testes do Sistema FibroSync

Este arquivo reune todas as formas praticas de testar o sistema hoje para ganhar o maximo de confianca possivel antes de entregar, subir ambiente ou publicar mudancas.

Importante:

- hoje o projeto nao possui Jest, Vitest, Playwright, Cypress ou outro runner de testes automatizados configurado em `backend/package.json` e `frontend/package.json`
- por isso, para verificar se "esta funcionando tudo perfeitamente", o ideal e combinar:
  - validacoes estaticas
  - smoke test
  - testes manuais de interface
  - testes de API
  - testes de contrato frontend x backend
  - testes de resiliencia
  - testes de seguranca e permissao

## 1. Objetivo

Este plano cobre:

- backend NestJS
- frontend React + Vite
- banco PostgreSQL
- clima com Open-Meteo
- predicoes por motor clinico
- recursos com IA
- rotas de paciente, medico e admin

Se todos os grupos abaixo passarem, o sistema fica com um nivel alto de confianca funcional.

## 2. Ambiente minimo para testar

### 2.1. Requisitos

- Node `>= 20`
- Docker
- PostgreSQL via `backend/docker-compose.yml`
- navegador desktop
- opcional: celular ou DevTools mobile para responsividade

### 2.2. Portas e URLs atuais

- backend: `http://localhost:3100/api/v1`
- Swagger: `http://localhost:3100/docs`
- frontend: `http://localhost:5173`
- banco: `localhost:5433`

### 2.3. Subida do ambiente

No backend:

```bash
cd backend
npm install
npm run db:up
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

No frontend:

```bash
cd frontend
npm install
npm run dev
```

### 2.4. Validacao inicial obrigatoria

Backend:

```bash
cd backend
npm run lint
npm run build
```

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Smoke de infraestrutura:

```bash
curl http://localhost:3100/api/v1/health
```

Esperado:

- status HTTP `200`
- payload com `success: true`
- `data.status = "ok"`

## 3. Tipos de teste que fazem sentido hoje

| Tipo | O que prova |
| --- | --- |
| Lint | Se ha erros de padrao e alguns problemas simples de codigo |
| Build | Se backend e frontend compilam |
| Smoke test | Se o sistema sobe e os fluxos basicos respondem |
| Teste manual de UI | Se a experiencia real funciona no navegador |
| Teste de API | Se rotas, validacoes, filtros e contratos estao corretos |
| Teste de permissao | Se usuario comum, admin e medico veem so o que deveriam |
| Teste de regressao | Se funcionalidades antigas continuam funcionando apos mudancas |
| Teste de resiliencia | Se o sistema se comporta bem com falhas de clima, IA, token e rede |
| Teste de dados | Se o banco grava e relaciona tudo corretamente |
| Teste de seguranca | Se autenticacao, autorizacao e exposicao de dados estao seguras |
| Teste de performance | Se tela e API respondem bem com mais volume |
| Teste de compatibilidade | Se layout, navegacao e formularios funcionam em resolucoes diferentes |

## 4. Smoke test de 15 minutos

Esse e o primeiro checklist obrigatorio depois de subir o ambiente.

### 4.1. Backend

- [ ] `GET /health` responde `200`
- [ ] Swagger abre em `/docs`
- [ ] `POST /auth/signup` cria usuario
- [ ] `POST /auth/login` retorna tokens
- [ ] `GET /users/me` retorna o usuario autenticado
- [ ] `POST /daily-records` cria um registro valido
- [ ] `GET /crisis-predictions/latest` retorna a predicao criada a partir do registro
- [ ] `GET /reports/generate?period=weekly` retorna um relatorio
- [ ] `POST /auth/logout` encerra a sessao

### 4.2. Frontend

- [ ] pagina de login abre
- [ ] cadastro funciona
- [ ] login redireciona para `/app`
- [ ] registro de dor salva com sucesso
- [ ] dashboard atualiza com os novos dados
- [ ] relatorios carregam
- [ ] settings carregam perfil e preferencias
- [ ] logout limpa sessao e volta para `/`

## 5. Testes de API por modulo

A melhor forma de executar esta parte hoje e via Swagger, Postman, Insomnia, Bruno ou `curl`.

## 5.1. Health

Rota:

- `GET /health`

Testar:

- [ ] retorno `200`
- [ ] payload no envelope padrao `{ success, timestamp, path, data }`
- [ ] `data.service = "FibroSync API"`

## 5.2. Auth

Rotas:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Testar signup:

- [ ] cadastro com payload minimo valido
- [ ] cadastro com todos os campos opcionais
- [ ] email duplicado
- [ ] email invalido
- [ ] senha vazia
- [ ] timezone e `countryCode` persistidos corretamente
- [ ] resposta retorna `accessToken`, `refreshToken` e `user`

Testar login:

- [ ] login valido
- [ ] email errado
- [ ] senha errada
- [ ] login com letras maiusculas/minusculas no email
- [ ] token salvo no frontend em `accessToken` e `access_token`

Testar refresh:

- [ ] refresh valido com `Authorization: Bearer <refreshToken>`
- [ ] refresh sem token
- [ ] refresh com token expirado
- [ ] refresh com token invalido
- [ ] refresh atualiza os tokens no frontend

Testar logout:

- [ ] logout normal
- [ ] logout com token invalido
- [ ] logout apos refresh
- [ ] logout remove tokens do navegador
- [ ] `logoutFromAllDevices` quando aplicavel

Testar `auth/me`:

- [ ] usuario autenticado recebe proprio perfil
- [ ] sem token retorna `401`
- [ ] token expirado tenta refresh e depois recupera a sessao

## 5.3. Users e Settings

Rotas:

- `GET /users/me`
- `PATCH /users/me`
- `GET /users/me/settings`
- `PATCH /users/me/settings`
- `GET /users`
- `GET /users/:id`

Perfil:

- [ ] buscar perfil com token valido
- [ ] atualizar nome, data de nascimento, genero, altura, peso, pais e timezone
- [ ] enviar tipos invalidos
- [ ] enviar campos extras e confirmar rejeicao pelo `ValidationPipe`
- [ ] verificar se o frontend atualiza o estado local apos salvar

Configuracoes:

- [ ] carregar preferencias iniciais
- [ ] atualizar toggles de notificacao
- [ ] atualizar horarios
- [ ] salvar com horario silencioso ligado e horarios preenchidos
- [ ] salvar com horario silencioso ligado e horarios vazios
- [ ] conferir persistencia apos reload da pagina

Admin:

- [ ] `GET /users` com admin
- [ ] `GET /users` com usuario comum deve falhar
- [ ] `GET /users/:id` com admin
- [ ] `GET /users/:id` com usuario comum deve falhar
- [ ] filtros e paginacao de usuarios, se usados pela tela

## 5.4. Daily Records

Rotas:

- `POST /daily-records`
- `GET /daily-records`
- `GET /daily-records/:id`
- `PATCH /daily-records/:id`
- `DELETE /daily-records/:id`

Criacao:

- [ ] criar registro com payload minimo valido
- [ ] criar registro com payload completo
- [ ] criar com `frontPainAreas` e `backPainAreas`
- [ ] criar com `painAreas` direto
- [ ] criar com `symptomSignal` completo
- [ ] criar com `weatherSnapshot`
- [ ] criar com `weatherImpact`
- [ ] criar sem `painLevel` para validar fallback de inferencia

Validacoes:

- [ ] sem `fatigueLevel`
- [ ] sem `stressLevel`
- [ ] sem `moodLevel`
- [ ] sem `sleepQuality`
- [ ] `recordDate` invalida
- [ ] valores abaixo de `0`
- [ ] valores acima de `10`
- [ ] `sleepHours` invalido
- [ ] arrays com itens vazios
- [ ] arrays com duplicados

Leitura:

- [ ] listar registros sem filtros
- [ ] listar com `page` e `limit`
- [ ] listar com `dateFrom`
- [ ] listar com `dateTo`
- [ ] listar com intervalo completo
- [ ] listar com `includeAll=true`
- [ ] buscar registro por id valido
- [ ] buscar registro inexistente
- [ ] buscar registro de outro usuario

Atualizacao:

- [ ] atualizar escalas
- [ ] atualizar areas
- [ ] atualizar gatilhos
- [ ] atualizar notas
- [ ] atualizar clima
- [ ] atualizar `symptomSignal`
- [ ] atualizar registro inexistente
- [ ] atualizar registro de outro usuario

Exclusao:

- [ ] excluir registro proprio
- [ ] excluir duas vezes
- [ ] excluir registro de outro usuario

Side effects que precisam ser validados:

- [ ] cria `SymptomSignal`
- [ ] cria ou atualiza `SymptomEntry`
- [ ] faz `upsert` de `CrisisPrediction`
- [ ] persiste `weatherSnapshot` em metadata
- [ ] pode criar `WeatherRecord`
- [ ] calcula `dataReliabilityScore`

## 5.5. Symptoms

Rotas:

- `POST /symptoms`
- `GET /symptoms`
- `GET /symptoms/:id`
- `PATCH /symptoms/:id`
- `DELETE /symptoms/:id`

Testar:

- [ ] criar sintoma indireto valido
- [ ] criar com `dailyRecordId`
- [ ] criar com intensidade invalida
- [ ] listar sintomas
- [ ] buscar por id
- [ ] atualizar sintoma
- [ ] excluir sintoma
- [ ] garantir isolamento entre usuarios

Contrato frontend x backend para revisar:

- [ ] conferir se a resposta real da listagem bate com o que `frontend/src/services/symptoms.service.ts` espera

## 5.6. Weather

Rotas:

- `GET /weather/current`

Testar clima atual:

- [ ] coordenadas validas
- [ ] latitude invalida
- [ ] longitude invalida
- [ ] chamada autenticada
- [ ] chamada sem token

Testar comportamento:

- [ ] primeira chamada pega dados live
- [ ] segunda chamada com mesma coordenada usa cache
- [ ] clima fica salvo para o usuario
- [ ] fallback para ultimo clima salvo
- [ ] fallback seguro quando nem cache nem banco estiverem disponiveis

Testar frontend:

- [ ] geolocalizacao permitida
- [ ] geolocalizacao negada
- [ ] navegador sem geolocalizacao
- [ ] erro temporario de localizacao
- [ ] recarregar clima manualmente
- [ ] registrar dor no dia atual usando clima automatico
- [ ] registrar dor em data antiga sem GPS

## 5.7. Crisis Predictions

Rotas:

- `GET /crisis-predictions/latest`
- `GET /crisis-predictions`
- `POST /crisis-predictions/recalculate/:dailyRecordId`

Testar:

- [ ] buscar ultima predicao apos criar `DailyRecord`
- [ ] buscar ultima predicao sem historico
- [ ] historico com paginacao
- [ ] historico com filtro por `riskLevel`
- [ ] historico com intervalo de datas
- [ ] recalcular predicao para registro valido
- [ ] recalcular predicao para registro inexistente
- [ ] recalcular predicao para registro de outro usuario

Validar consistencia:

- [ ] `probability` entre `0` e `1`
- [ ] `riskLevel` coerente com a probabilidade
- [ ] `confidenceScore` coerente com a confiabilidade do dado
- [ ] `riskFactors` presentes e legiveis
- [ ] notificacao de crise criada quando risco justificar

## 5.8. Reports

Rotas:

- `GET /reports/generate`
- `GET /reports`
- `GET /reports/:id`

Geracao:

- [ ] gerar semanal
- [ ] gerar mensal
- [ ] gerar trimestral
- [ ] gerar sem nenhum dado
- [ ] gerar com poucos dados
- [ ] gerar com varios registros no mesmo dia
- [ ] gerar com `AiPrediction`
- [ ] gerar com `UserRiskProfile`

Listagem e leitura:

- [ ] listar relatorios gerados
- [ ] buscar relatorio por id
- [ ] buscar relatorio inexistente
- [ ] garantir que usuario nao acessa relatorio de outro usuario

Validar calculos:

- [ ] `recordedEntries`
- [ ] `recordedDays`
- [ ] `averagePainLevel`
- [ ] `averageProbabilityScore`
- [ ] `averageDataReliabilityScore`
- [ ] `painPatterns`
- [ ] `recurringTriggers`
- [ ] `correlations`
- [ ] `personalizedRiskProfile`

Frontend:

- [ ] alternar entre semana, mes e 90 dias
- [ ] estado vazio
- [ ] estado de loading
- [ ] erro ao gerar relatorio
- [ ] impressao via `Exportar PDF`

## 5.9. AI

Rotas:

- `POST /ai/predict`
- `GET /ai/predictions/latest`
- `POST /ai/pattern-analysis`
- `GET /ai/risk-profile`
- `POST /ai/insights`
- `GET /ai/insights`

Predicao IA:

- [ ] predizer com historico suficiente
- [ ] predizer sem historico suficiente
- [ ] predizer com provider configurado
- [ ] predizer sem provider configurado
- [ ] falha do provider retorna erro controlado
- [ ] buscar ultima predicao IA quando existir
- [ ] buscar ultima predicao IA quando nao existir

Pattern analysis:

- [ ] rodar analise com historico suficiente
- [ ] rodar analise sem historico
- [ ] testar `lookbackDays` abaixo de `14`
- [ ] testar `lookbackDays` acima de `90`
- [ ] validar `currentPersonalizedScore`
- [ ] validar `baselineScore`
- [ ] validar `triggerPatterns`
- [ ] validar `topWeights`

Insights:

- [ ] gerar insight
- [ ] listar insights
- [ ] testar paginacao/filtros da listagem
- [ ] testar erro de provider

## 5.10. Notifications

Rotas:

- `GET /notifications`
- `PATCH /notifications/:id/read`

Testar:

- [ ] listar notificacoes
- [ ] listar com paginacao
- [ ] listar somente nao lidas
- [ ] marcar como lida
- [ ] marcar duas vezes
- [ ] marcar notificacao inexistente
- [ ] marcar notificacao de outro usuario

Frontend:

- [ ] contador de nao lidas
- [ ] lista recarrega apos marcar como lida

## 5.11. Community Posts

Rotas:

- `POST /community-posts`
- `GET /community-posts`

Testar:

- [ ] criar post valido
- [ ] criar post com texto minimo
- [ ] criar post com texto longo
- [ ] criar post invalido
- [ ] listar posts
- [ ] filtrar por tipo
- [ ] buscar por texto
- [ ] paginacao
- [ ] ordenacao

Frontend:

- [ ] feed carrega
- [ ] criacao invalida mostra erro
- [ ] criacao valida atualiza a lista

## 5.12. Admin e medico

Rotas frontend:

- `/medical`
- `/admin`
- `/admin/dashboard`
- `/admin/users`
- `/admin/reports`
- `/admin/analytics`
- `/admin/settings`

Essas areas merecem teste especial de aderencia, porque o codigo atual mostra sinais de integracao parcial ou mock.

Testar:

- [ ] acesso de usuario comum deve ser bloqueado
- [ ] acesso de admin deve carregar
- [ ] acesso de medico deve carregar somente a area medica
- [ ] frontend nao deve quebrar se o backend nao expuser uma rota esperada
- [ ] estados de loading e erro devem ser legiveis

## 6. Testes de interface por rota

## 6.1. Auth

Rotas:

- `/landingpage`
- `/`
- `/signup`

Landing:

- [ ] renderiza sem erros
- [ ] CTA "Comecar agora" vai para `/signup`
- [ ] CTA "Ja tenho uma conta" leva o usuario ao login
- [ ] layout responsivo no mobile

Login:

- [ ] email obrigatorio
- [ ] senha obrigatoria
- [ ] botao de mostrar/ocultar senha
- [ ] erro de credenciais invalidas
- [ ] login com sucesso redireciona para `/app`
- [ ] refresh de pagina preserva sessao quando token esta valido

Signup:

- [ ] cadastro com dados obrigatorios
- [ ] cadastro com dados opcionais
- [ ] mensagens de erro do formulario
- [ ] redirecionamento apos sucesso

## 6.2. Dashboard do paciente

Rota:

- `/app`

Testar:

- [ ] estado vazio sem registros
- [ ] estado com registros
- [ ] mudanca de janela `7`, `30`, `90`
- [ ] grafico de evolucao carrega
- [ ] areas mais citadas
- [ ] gatilhos mais citados
- [ ] bloco de clima com geolocalizacao permitida
- [ ] bloco de clima com geolocalizacao negada
- [ ] bloco "Rule Engine"
- [ ] bloco "AI Prediction"
- [ ] card de confiabilidade
- [ ] card de carga de sintomas

## 6.3. Pain Log

Rota:

- `/app/pain-log`

Testar:

- [ ] data padrao no dia atual
- [ ] data passada no query param `?date=`
- [ ] selecao de areas frontais
- [ ] selecao de areas traseiras
- [ ] validacao de ao menos uma area
- [ ] slider de dor
- [ ] sliders de fadiga, estresse, humor, sono e rigidez
- [ ] horas de sono dentro de `0..24`
- [ ] hidratacao dentro de `0..8`
- [ ] atividade fisica dentro de `0..1440`
- [ ] tipo de dor
- [ ] gatilhos
- [ ] sintomas associados
- [ ] clima automatico no dia atual
- [ ] percepcao corporal
- [ ] observacoes
- [ ] salvar com sucesso
- [ ] erro de API no salvar
- [ ] redireciona ao dashboard apos salvar

## 6.4. Reports

Rota:

- `/app/reports`

Testar:

- [ ] semanal
- [ ] mensal
- [ ] trimestral
- [ ] estado vazio
- [ ] erro ao carregar
- [ ] atualizacao de aba
- [ ] grafico de dor
- [ ] grafico de sono
- [ ] grafico de probabilidade
- [ ] distribuicao clinica
- [ ] gatilhos recorrentes
- [ ] correlacoes
- [ ] perfil personalizado
- [ ] impressao do relatorio

## 6.5. Calendar

Rota:

- `/app/calendar`

Testar:

- [ ] navegar entre meses
- [ ] selecionar dia com registro
- [ ] selecionar dia sem registro
- [ ] abrir detalhe do registro
- [ ] CTA para criar registro no dia selecionado

## 6.6. Community

Rota:

- `/app/community`

Testar:

- [ ] feed inicial
- [ ] filtros
- [ ] busca
- [ ] criacao de post
- [ ] atualizacao do feed
- [ ] estado vazio

## 6.7. Profile

Rota:

- `/app/profile`

Testar:

- [ ] dados do usuario
- [ ] ultimo registro de dor
- [ ] campos opcionais vazios
- [ ] consistencia com `/users/me`

## 6.8. Settings

Rota:

- `/app/settings`

Testar:

- [ ] carrega perfil
- [ ] carrega preferencias
- [ ] carrega notificacoes recentes
- [ ] salva perfil
- [ ] salva preferencias
- [ ] validacao de horario silencioso
- [ ] marcar notificacao como lida
- [ ] mensagem de sucesso
- [ ] mensagem de erro

## 6.9. Assistant

Rota:

- `/app/assistant`

Testar:

- [ ] renderiza sem quebrar
- [ ] textos e componentes aparecem
- [ ] responsividade

## 6.10. Medical

Rota:

- `/medical`

Testar:

- [ ] renderiza sem quebrar
- [ ] cards, lista e grafico aparecem
- [ ] responsividade

Observacao:

- [ ] confirmar se os dados ainda sao mock e se isso esta aceitavel para o ambiente atual

## 6.11. Admin

Rotas:

- `/admin`
- `/admin/dashboard`
- `/admin/users`
- `/admin/reports`
- `/admin/analytics`
- `/admin/settings`

Testar:

- [ ] navega sem tela branca
- [ ] bloqueia usuario nao admin
- [ ] dashboards carregam
- [ ] listas carregam
- [ ] estados de erro sao amigaveis
- [ ] responsividade minima

## 7. Testes de contrato frontend x backend

Essa secao e obrigatoria porque o repositorio atual mostra alguns pontos de risco.

Testar primeiro:

- [ ] `VITE_API_URL` do frontend aponta para `http://localhost:3100/api/v1`
- [ ] todas as respostas protegidas batem com o envelope `{ success, timestamp, path, data }`
- [ ] token refresh funciona nos clients `api.ts` e `lib/api-client.ts`
- [ ] servicos do frontend esperam o mesmo shape retornado pelos controllers
- [ ] URLs usadas no frontend realmente existem no backend

Pontos de risco identificados no codigo atual:

- [ ] o link da landing usa `/login`, mas a rota de login real no router esta em `/`
- [ ] existem duas pilhas de admin no frontend:
  - `useAdmin.ts` + `admin.service.ts`
  - `use-admin.ts` + `admin.ts`
- [ ] a area admin usa endpoints `/admin/*` e `/analytics/dashboard`, mas o backend atual exposto nos controllers lidos nao mostra essas rotas
- [ ] a area medica usa `mock-data`
- [ ] o servico de sintomas precisa ser confrontado com a resposta real da API

## 8. Testes de integridade no banco

Usar `npm run prisma:studio` no backend e conferir tabelas apos cada fluxo.

Verificar:

- [ ] `users`
- [ ] `user_settings`
- [ ] `daily_records`
- [ ] `symptom_signals`
- [ ] `symptom_entries`
- [ ] `weather_records`
- [ ] `crisis_predictions`
- [ ] `ai_predictions`
- [ ] `user_risk_profiles`
- [ ] `reports`
- [ ] `notifications`
- [ ] `community_posts`

Fluxos de integridade importantes:

- [ ] criar usuario gera configuracoes basicas esperadas
- [ ] criar `DailyRecord` gera `SymptomSignal`
- [ ] criar `DailyRecord` gera `SymptomEntry`
- [ ] criar `DailyRecord` gera ou atualiza `CrisisPrediction`
- [ ] criar `DailyRecord` com clima pode gerar `WeatherRecord`
- [ ] gerar relatorio faz `upsert` em `reports`
- [ ] riscos altos podem refletir em `notifications`
- [ ] pattern analysis atualiza `user_risk_profiles`

## 9. Testes de resiliencia e falha

## 9.1. Falha de autenticacao

- [ ] access token expirado
- [ ] refresh token expirado
- [ ] refresh token ausente
- [ ] varias chamadas simultaneas recebendo `401`

## 9.2. Falha de rede

- [ ] backend fora do ar
- [ ] frontend sem `VITE_API_URL`
- [ ] timeout na API
- [ ] perda de conexao durante submit de registro

## 9.3. Falha de clima

- [ ] Open-Meteo indisponivel
- [ ] geolocalizacao negada
- [ ] coordenadas invalidas
- [ ] fallback para cache
- [ ] fallback para ultimo clima salvo
- [ ] fallback seguro

## 9.4. Falha de IA

- [ ] Gemini nao configurado
- [ ] provider fora do ar
- [ ] historico insuficiente
- [ ] previsao demora demais

## 9.5. Falha de banco

- [ ] banco nao sobe
- [ ] migracao falha
- [ ] seed falha
- [ ] porta `5433` ocupada

## 10. Testes de seguranca

- [ ] todas as rotas protegidas bloqueiam requests sem token
- [ ] usuario nao acessa dados de outro usuario por id
- [ ] admin only realmente exige role admin
- [ ] medico nao enxerga rotas indevidas
- [ ] tokens sao limpos no logout
- [ ] refresh token nao pode ser usado no lugar do access token
- [ ] campos de texto nao quebram a interface quando recebem HTML
- [ ] observacoes, posts e notas longas nao geram XSS visivel
- [ ] IDs invalidos retornam erro controlado
- [ ] CORS permite o frontend esperado

## 11. Testes de performance

- [ ] login com resposta aceitavel
- [ ] dashboard com varios registros
- [ ] relatorio trimestral com bastante historico
- [ ] listagem paginada de notificacoes
- [ ] feed da comunidade com muitos posts
- [ ] admin com mais usuarios
- [ ] build continua aceitavel

Ferramentas possiveis:

- `Chrome DevTools`
- `Lighthouse`
- `k6`
- `autocannon`

## 12. Testes de compatibilidade e UX

- [ ] desktop grande
- [ ] notebook
- [ ] tablet
- [ ] mobile portrait
- [ ] mobile landscape
- [ ] Chrome
- [ ] Firefox
- [ ] Edge

Tambem validar:

- [ ] loading states
- [ ] empty states
- [ ] mensagens de erro
- [ ] botoes desabilitados durante submit
- [ ] sem dupla submissao
- [ ] navegacao apos sucesso

## 13. Testes de regressao por jornada

## 13.1. Jornada do paciente

- [ ] cadastrar conta
- [ ] fazer login
- [ ] completar um registro de dor
- [ ] ver dashboard atualizado
- [ ] ver predicao de crise
- [ ] gerar relatorio
- [ ] abrir calendario
- [ ] alterar configuracoes
- [ ] marcar notificacao como lida
- [ ] criar post na comunidade
- [ ] sair da conta

## 13.2. Jornada clinica

- [ ] criar varios registros em dias diferentes
- [ ] confirmar consolidacao no dashboard
- [ ] confirmar consolidacao no relatorio
- [ ] rodar `pattern-analysis`
- [ ] validar `risk-profile`
- [ ] rodar `ai/predict`

## 13.3. Jornada admin

- [ ] entrar como admin
- [ ] abrir dashboard admin
- [ ] listar usuarios
- [ ] abrir analytics
- [ ] abrir reports
- [ ] abrir settings

## 14. Automacao ideal para o futuro

Mesmo sem automacao hoje, estas sao as melhores possibilidades para cobrir o sistema de forma continua:

Backend:

- Jest + Supertest para controllers e services
- banco de teste separado com Prisma
- fixtures para `DailyRecord`, `CrisisPrediction`, `Report` e `UserRiskProfile`

Frontend:

- Vitest + React Testing Library
- testes de hooks:
  - `useAuth`
  - `useDailyRecords`
  - `useReports`
  - `usePrediction`
  - `useWeather`
- testes de pagina:
  - login
  - signup
  - dashboard
  - pain log
  - reports
  - settings

E2E:

- Playwright
- fluxo feliz completo
- fluxo com erro de login
- fluxo de refresh token
- fluxo de registro de dor
- fluxo de geracao de relatorio

Contrato:

- Postman + Newman
- Bruno

Carga:

- k6
- autocannon

## 15. Criterio de saida

So considerar o sistema "bem testado" quando:

- [ ] backend linta
- [ ] backend builda
- [ ] frontend linta
- [ ] frontend builda
- [ ] smoke test passa
- [ ] todas as rotas principais de paciente passam
- [ ] autenticacao e refresh passam
- [ ] registro de dor, predicao e relatorio passam
- [ ] settings e notificacoes passam
- [ ] testes de permissao passam
- [ ] testes de fallback de clima e IA passam
- [ ] testes de aderencia frontend x backend passam
- [ ] nenhum erro critico aparece no console do navegador ou no log do backend

## 16. Ordem recomendada de execucao

Se for testar tudo do jeito mais eficiente possivel, use esta ordem:

1. lint e build
2. health e Swagger
3. signup e login
4. `users/me` e `users/me/settings`
5. criar `DailyRecord`
6. validar `CrisisPrediction`
7. validar dashboard
8. gerar relatorios
9. validar IA
10. validar notificacoes
11. validar comunidade
12. validar settings
13. validar admin e medico
14. rodar testes de falha, seguranca e performance

Com isso, este arquivo cobre praticamente todas as possibilidades reais de teste do sistema no estado atual do projeto.
