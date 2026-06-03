# Testes de Registro de Sintomas no FibroSync

Atualizado com base no codigo real do projeto em 28/05/2026.

Este arquivo cobre todas as possibilidades relevantes de registrar sintomas hoje para validar se:

- a persistencia esta correta
- o `symptomSignal` esta sendo salvo como o codigo realmente monta
- os `symptomEntries` automaticos estao corretos
- a carga de sintomas esta sendo calculada corretamente
- o motor de risco esta reagindo como esperado
- dashboard, relatorios, IA e perfil personalizado continuam coerentes

Importante:

- este plano nao tenta listar o produto cartesiano infinito de todos os campos ao mesmo tempo
- ele cobre todas as classes de entrada que mudam formula, agregacao, risco, persistencia ou validacao
- para validar calculo clinico real, o caminho mais importante e `POST /daily-records`
- `POST /symptoms` tambem existe, mas se comporta de forma diferente e precisa ser testado separadamente

## 1. Fontes reais usadas para montar este plano

- `frontend/src/pages/patient/pain-log-page.tsx`
- `frontend/src/features/clinical/clinical-model.ts`
- `frontend/src/features/clinical/record-analytics.ts`
- `frontend/src/hooks/useWeather.ts`
- `backend/src/modules/daily-records/daily-records.service.ts`
- `backend/src/modules/daily-records/dto/create-daily-record.dto.ts`
- `backend/src/modules/daily-records/dto/symptom-signal-input.dto.ts`
- `backend/src/modules/daily-records/dto/symptom-entry-input.dto.ts`
- `backend/src/common/utils/symptom-signal.util.ts`
- `backend/src/common/utils/data-reliability.util.ts`
- `backend/src/modules/crisis-prediction/crisis-prediction.service.ts`
- `backend/src/modules/reports/reports.service.ts`
- `backend/src/modules/ai/ai.service.ts`
- `backend/src/modules/ai/pattern-analysis.service.ts`
- `backend/src/modules/ai/pattern-score.engine.ts`
- `backend/src/modules/symptoms/symptoms.service.ts`
- `backend/commands/calculos.md`

## 2. Canais de registro de sintomas existentes hoje

### 2.1. Fluxo principal da tela `/app/pain-log`

Esse fluxo chama `POST /daily-records` e envia:

- `recordDate`
- `painLevel`
- `fatigueLevel`
- `stressLevel`
- `moodLevel`
- `sleepQuality`
- `sleepHours`
- `hydration`
- `physicalActivityMinutes`
- `medicationTaken`
- `painType`
- `painTriggers`
- `painAreas`
- `frontPainAreas`
- `backPainAreas`
- `weatherImpact`
- `notes`
- `symptomSignal`
- `weatherSnapshot` somente quando o registro e do dia atual e o clima foi obtido

Esse e o fluxo que realmente dispara:

- `DailyRecord`
- `SymptomSignal`
- `SymptomEntry`
- `CrisisPrediction`
- atualizacao de `WeatherRecord`, quando houver snapshot

### 2.2. API `POST /daily-records`

Esse caminho aceita tudo que a UI envia e ainda permite testar casos que a tela atual nao cobre diretamente:

- `symptomEntries` explicitos
- `symptomSignal.notes`
- payloads parciais
- combinacoes inconsistentes de flag e nivel
- datas futuras ou payloads que a UI bloqueia

### 2.3. API `POST /symptoms`

Esse caminho cria um `SymptomSignal` isolado, sem `DailyRecord`.

Ele serve para testar:

- persistencia do modulo de sintomas
- agregacao por dia em relatorios
- contagem de flags em IA
- perfil personalizado baseado em sinais

Mas ele nao cria:

- `DailyRecord`
- `SymptomEntry`
- `CrisisPrediction`

E ele se comporta diferente do fluxo principal porque nao recebe niveis individuais para quase todos os sintomas, so booleans e `stiffness`.

## 3. Catalogo completo do que pode ser registrado hoje

### 3.1. Areas corporais da UI

Frente:

- Mandibula esquerda
- Mandibula direita
- Ombro esquerdo
- Ombro direito
- Braco superior esquerdo
- Braco superior direito
- Braco inferior esquerdo
- Braco inferior direito
- Torax
- Abdomen
- Quadril esquerdo
- Quadril direito
- Coxa esquerda
- Coxa direita
- Joelho esquerdo
- Joelho direito

Costas:

- Cervical
- Costas superiores
- Costas inferiores

### 3.2. Tipos de dor da UI

- Pontada
- Queimacao
- Pressao
- Rigidez
- Latejante
- Ardencia
- Sensacao de peso

### 3.3. Gatilhos da UI

- Sono irregular
- Estresse emocional
- Clima frio
- Umidade alta
- Esforco fisico
- Longo periodo sentada
- Excesso de tela
- Pouca hidratacao
- Barulho intenso
- Luz forte

### 3.4. Sintomas associados do fluxo principal

- Rigidez corporal
- Fibro fog
- Cefaleia
- Alteracoes digestivas
- Ansiedade
- Humor depressivo
- Sensibilidade a luz
- Sensibilidade a ruido

### 3.5. Temperatura corporal percebida

- Frio
- Neutro
- Quente

### 3.6. Campos livres que interferem em calculo ou contexto

- `weatherImpact`
- `notes`
- `symptomSignal.notes` via API
- `symptomEntries[].notes` via API

## 4. Regras do sistema que precisam ser conhecidas antes de testar

### 4.1. O frontend sempre envia `symptomSignal`

Mesmo com todos os sintomas zerados, o fluxo atual do `pain-log` envia um objeto `symptomSignal`.

Na pratica, isso significa:

- a linha de `SymptomSignal` e criada mesmo sem sintomas ativos
- `symptomSignalPresent` tende a ficar `true` no fluxo principal
- `dataReliabilityScore` ganha `+12` por presenca de `symptomSignal`, mesmo quando todos os niveis estao em `0`
- isso nao significa que exista carga de sintomas

### 4.2. `symptomLoad` nao olha booleans puros; ele olha niveis positivos

No fluxo principal, a carga de sintomas usa a media dos niveis positivos de:

- `stiffness`
- `cognitiveFogLevel`
- `headacheLevel`
- `digestiveIssuesLevel`
- `anxietyLevel`
- `depressionLevel`
- `sensitivityLightLevel`
- `sensitivityNoiseLevel`

Se todos estiverem em `0` ou `null`:

- `symptomLoad` vira `null` no dashboard
- a contribuicao de sintomas no motor de crise vira `0`

### 4.3. Precedencia entre flag e nivel em `POST /daily-records`

No backend:

- se vier nivel valido `> 0`, ele prevalece
- se vier so flag `true`, o backend assume nivel `5`
- se vier nivel `0`, o sintoma fica inativo mesmo que a flag venha `true`
- se vier flag `false` e nivel `8`, o nivel prevalece e o sintoma fica ativo

### 4.4. O endpoint `POST /symptoms` se comporta diferente

No modulo `/symptoms`:

- `cognitiveFog`, `headache`, `digestiveIssues`, `anxiety`, `depression`, `sensitivityLight` e `sensitivityNoise` entram como booleans
- nao existe nivel individual para esses sintomas nesse endpoint
- `stiffness` continua numerico

Consequencia:

- um `POST /symptoms` com `cognitiveFog: true` marca a flag, mas nao cria `cognitiveFogLevel = 5`
- em relatorios e IA a flag conta como presente
- porem a `symptomLoad` desse snapshot isolado so sobe por `stiffness`, porque os outros niveis continuam `null`

### 4.5. `symptomEntries` explicitos podem ser persistidos sem dirigir o calculo principal

No `POST /daily-records`:

- o backend gera `symptomEntries` automaticamente a partir de `symptomSignal`
- depois mistura os `symptomEntries` explicitos
- entradas explicitas com o mesmo nome sobrescrevem as automaticas

Mas, como o fluxo principal sempre cria um `symptomSignal`, os calculos de:

- `symptomLoad`
- `symptomBurden`
- contribuicao de sintomas no motor de risco

continuam sendo dirigidos pelos niveis do `symptomSignal`, e nao pelos `symptomEntries`.

### 4.6. `PATCH /daily-records/:id` tem comportamento de merge

Ao atualizar um registro:

- campos nao enviados podem herdar o valor anterior
- `symptomSignal` parcial reaproveita campos antigos nao enviados
- se nenhuma entrada nova for montada e o registro antigo ja tiver `symptomEntries`, o backend reaproveita as antigas

Isso quer dizer que "limpar tudo" via update precisa ser testado com cuidado, porque o comportamento atual pode preservar entradas antigas.

### 4.7. Clima automatico e manual sao coisas diferentes

- `weatherSnapshot` automatico depende do registro ser do dia atual e do clima/geolocalizacao
- `weatherImpact` e texto manual
- o motor de crise usa `weatherSnapshot`
- a confiabilidade usa `weatherImpact` ou `weatherFeeling` com texto

Ou seja:

- clima automatico mexe no risco e nos relatorios
- texto manual de clima mexe na confiabilidade e no perfil frio/quente se contiver palavras relevantes

## 5. Payload base para repetir testes de API

### 5.1. Base para `POST /daily-records`

Use este payload como ponto de partida e altere so o trecho do caso de teste:

```json
{
  "recordDate": "2026-05-28",
  "painLevel": 4,
  "fatigueLevel": 5,
  "stressLevel": 4,
  "moodLevel": 6,
  "sleepQuality": 5,
  "sleepHours": 7,
  "hydration": 1.8,
  "physicalActivityMinutes": 20,
  "medicationTaken": false,
  "painType": "",
  "painAreas": ["Ombro esquerdo"],
  "frontPainAreas": ["Ombro esquerdo"],
  "backPainAreas": [],
  "painTriggers": [],
  "weatherImpact": "",
  "notes": "",
  "symptomSignal": {
    "stiffness": 0,
    "cognitiveFog": false,
    "cognitiveFogLevel": 0,
    "headache": false,
    "headacheLevel": 0,
    "digestiveIssues": false,
    "digestiveIssuesLevel": 0,
    "anxiety": false,
    "anxietyLevel": 0,
    "depression": false,
    "depressionLevel": 0,
    "sensitivityLight": false,
    "sensitivityLightLevel": 0,
    "sensitivityNoise": false,
    "sensitivityNoiseLevel": 0,
    "bodyTemperatureFeeling": "",
    "notes": ""
  }
}
```

### 5.2. Base para `POST /symptoms`

```json
{
  "fatigueLevel": 5,
  "sleepQuality": 5,
  "stiffness": 0,
  "mood": 6,
  "stress": 4,
  "cognitiveFog": false,
  "sensitivityLight": false,
  "sensitivityNoise": false,
  "digestiveIssues": false,
  "headache": false,
  "anxiety": false,
  "depression": false,
  "bodyTemperatureFeeling": "",
  "notes": ""
}
```

## 6. Checklist de cobertura obrigatoria no fluxo principal `POST /daily-records`

### 6.1. Casos base do registro

| ID | O que registrar | O que precisa acontecer |
| --- | --- | --- |
| DR-01 | Registro base com todos os sintomas em `0` | Cria `DailyRecord`, cria `SymptomSignal`, cria `CrisisPrediction`, `symptomEntries` ficam vazios, `symptomLoad` fica `null`, confiabilidade ainda recebe `+12` por `symptomSignalPresent`. |
| DR-02 | Mesmo registro no dia atual com geolocalizacao e clima ativos | `weatherSnapshot` entra em `metadata`, risco pode mudar pelo clima, mas confiabilidade nao sobe so por causa do snapshot. |
| DR-03 | Mesmo registro em data anterior | Sem `weatherSnapshot` automatico; so o texto manual de `weatherImpact` pode entrar. |
| DR-04 | Mesmo registro com `notes` preenchido | `notes` persistem e confiabilidade recebe `+4`. |
| DR-05 | Mesmo registro com `painType` preenchido | `painType` persiste e confiabilidade recebe `+4`. |
| DR-06 | Mesmo registro com pelo menos um `painTrigger` | `painTriggers` persistem e confiabilidade recebe `+4`. |
| DR-07 | Mesmo registro com `weatherImpact` preenchido | O texto e salvo em `weatherFeeling` e confiabilidade recebe `+4`. |
| DR-08 | Mesmo registro com `medicationTaken = true` | Persistencia correta do boolean e impacto em perfil/relatorio. |
| DR-09 | Mesmo registro com `medicationTaken = false` | Persistencia correta do boolean e feature `skippedMedication` ativa no perfil personalizado. |
| DR-10 | Mesmo registro sem `painType`, sem gatilhos, sem notas e sem `weatherImpact` | Validar que so os pontos realmente presentes entram na confiabilidade. |

### 6.2. Cobertura completa das 19 areas corporais

Crie ao menos um registro para cada area abaixo, de preferencia mudando so a area selecionada:

- [ ] Mandibula esquerda
- [ ] Mandibula direita
- [ ] Ombro esquerdo
- [ ] Ombro direito
- [ ] Braco superior esquerdo
- [ ] Braco superior direito
- [ ] Braco inferior esquerdo
- [ ] Braco inferior direito
- [ ] Torax
- [ ] Abdomen
- [ ] Quadril esquerdo
- [ ] Quadril direito
- [ ] Coxa esquerda
- [ ] Coxa direita
- [ ] Joelho esquerdo
- [ ] Joelho direito
- [ ] Cervical
- [ ] Costas superiores
- [ ] Costas inferiores

Esperado em todos:

- `painAreas` final contem a label selecionada
- `frontPainAreas` e `backPainAreas` vao para `metadata`
- confiabilidade recebe `+6` por haver ao menos uma area
- relatorios contam a area uma vez por registro

### 6.3. Cobertura completa dos tipos de dor

Crie ao menos um registro com cada tipo:

- [ ] Pontada
- [ ] Queimacao
- [ ] Pressao
- [ ] Rigidez
- [ ] Latejante
- [ ] Ardencia
- [ ] Sensacao de peso

Esperado:

- o tipo aparece em `painType`
- confiabilidade recebe `+4`
- relatorios contam distribuicao de `painType`

### 6.4. Cobertura completa dos gatilhos

Crie ao menos um registro com cada gatilho individualmente:

- [ ] Sono irregular
- [ ] Estresse emocional
- [ ] Clima frio
- [ ] Umidade alta
- [ ] Esforco fisico
- [ ] Longo periodo sentada
- [ ] Excesso de tela
- [ ] Pouca hidratacao
- [ ] Barulho intenso
- [ ] Luz forte

Depois crie tambem:

- [ ] um registro sem nenhum gatilho
- [ ] um registro com todos os 10 gatilhos

Esperado:

- qualquer lista nao vazia de gatilhos da `+4` de confiabilidade
- dashboard e relatorios contam recorrencia por texto
- duplicatas dentro do mesmo registro nao devem contar duas vezes no relatorio

### 6.5. Matriz completa dos sintomas associados no fluxo principal

| Sintoma | Casos obrigatorios | Persistencia esperada | Impacto calculado esperado |
| --- | --- | --- | --- |
| Rigidez corporal | testar `0`, `1`, `7`, `10` | `symptomSignal.stiffness` salva exatamente o nivel | Se for o unico sintoma ativo, `symptomLoad = stiffness`; `highStiffness` ativa com `>= 7`. |
| Fibro fog | testar toggle simples `5`, depois `1`, `10`; testar API `true` sem nivel; testar API `false` com nivel `8`; testar API `true` com nivel `0` | Gera `symptomEntry` `Fibro fog` quando nivel final `> 0` | Sozinho: `symptomLoad = nivel`; ativa flag `cognitiveFog`; em repeticao com luz/ruido entra em ciclo de IA. |
| Cefaleia | testar `5`, `1`, `10` | Gera `symptomEntry` `Cefaleia` | Sozinha: `symptomLoad = nivel`; em relatorios pode virar gatilho recorrente `cefaleia`. |
| Alteracoes digestivas | testar `5`, `1`, `10` | Gera `symptomEntry` `Alteracoes digestivas` | Sozinha: `symptomLoad = nivel`; com ansiedade ou depressao entra em ciclo de IA. |
| Ansiedade | testar `5`, `1`, `10` | Gera `symptomEntry` `Ansiedade` | Sozinha: `symptomLoad = nivel`; em relatorios pode virar gatilho recorrente `ansiedade`. |
| Humor depressivo | testar `5`, `1`, `10` | Gera `symptomEntry` `Humor depressivo` | Sozinha: `symptomLoad = nivel`; em relatorios pode virar gatilho recorrente `humor depressivo`. |
| Sensibilidade a luz | testar `5`, `1`, `10` | Gera `symptomEntry` `Sensibilidade a luz` | Sozinha: `symptomLoad = nivel`; com ruido ou luz ativa feature `sensorySensitivity`. |
| Sensibilidade a ruido | testar `5`, `1`, `10` | Gera `symptomEntry` `Sensibilidade a ruido` | Sozinha: `symptomLoad = nivel`; com luz ou ruido ativa feature `sensorySensitivity`. |

Observacoes obrigatorias dessa matriz:

- no clique simples da UI, cada sintoma pill sobe com nivel inicial `5`
- na UI, `stiffness` nao entra no contador visual `ativos`, mas entra em calculo
- no `POST /daily-records`, `true` sem nivel vira nivel `5`
- no `POST /daily-records`, nivel `0` mata o sintoma mesmo se a flag vier `true`
- no `POST /daily-records`, nivel positivo vence a flag `false`

### 6.6. Temperatura corporal percebida

Teste todos os casos abaixo:

- [ ] vazio
- [ ] Frio
- [ ] Neutro
- [ ] Quente
- [ ] API com valor customizado `gelado`
- [ ] API com valor customizado `cold front`

Esperado:

- o valor persiste em `symptomSignal.bodyTemperatureFeeling`
- `Frio`, `gelado`, `cold` e textos equivalentes podem ativar `coldBodyTemperature` em relatorios
- isso tambem pode ativar a feature `coldWeather` no perfil personalizado
- `Neutro` e `Quente` persistem, mas nao devem ativar gatilho de frio

## 7. Casos combinados que realmente mudam formula

### 7.1. Combinacoes de carga de sintomas

| ID | Configuracao | `symptomLoad` esperado | Contribuicao de sintomas no risco |
| --- | --- | --- | --- |
| CM-01 | So `cognitiveFogLevel = 5` | `5` | `7.5` pontos |
| CM-02 | `cognitiveFogLevel = 1` e `headacheLevel = 10` | `(1 + 10) / 2 = 5.5` | `8.25` pontos |
| CM-03 | Todos os 8 sintomas em `5` | `5` | `7.5` pontos |
| CM-04 | Niveis `10, 9, 8, 7, 6, 5, 4, 3` | `6.5` | `9.75` pontos |
| CM-05 | Todos em `0` | `null` no dashboard e `0` no motor de risco | `0` pontos |

Formula usada:

```ts
symptomLoad = media dos niveis positivos
symptomContribution = (symptomLoad / 10) * 15
```

### 7.2. Combinacoes clinicas que precisam aparecer em relatorios e IA

- [ ] `cognitiveFog + sensitivityLight`
- [ ] `cognitiveFog + sensitivityNoise`
- [ ] `digestiveIssues + anxiety`
- [ ] `digestiveIssues + depression`
- [ ] `stressLevel >= 7 + fatigueLevel >= 7`
- [ ] `bodyTemperatureFeeling = Frio + hydration < 1.5`
- [ ] `medicationTaken = false + sleepHours < 5`

Esperado:

- `cognitiveFog + sensitivityLight/noise` pode aparecer como ciclo repetido de IA quando houver repeticao
- `digestiveIssues + anxiety/depression` pode aparecer como ciclo repetido de IA quando houver repeticao
- `stress >= 7` e `fatigue >= 7` entram em sinais recorrentes e perfil personalizado
- `Frio + baixa hidratacao` pode fortalecer o padrao `coldWeather` e `lowHydration`
- `medicationTaken = false` ativa `skippedMedication`

### 7.3. Cenarios canonicos de risco para validar o motor

| ID | Configuracao sugerida | Probabilidade esperada |
| --- | --- | --- |
| RK-01 | `pain=4`, `fatigue=5`, `stress=4`, `mood=6`, `sleepQuality=5`, `sleepHours=7`, `hydration=1.8`, sem sintomas ativos, sem clima ruim | aproximadamente `0.2967`, risco `LOW` |
| RK-02 | `pain=6`, `fatigue=6`, `stress=6`, `mood=5`, `sleepQuality=5`, `sleepHours=6`, `hydration=1.8`, um sintoma em `5` | aproximadamente `0.5542`, risco `MODERATE` |
| RK-03 | `pain=8`, `fatigue=8`, `stress=8`, `mood=4`, `sleepQuality=4`, `sleepHours=4.5`, `hydration=1.4`, um sintoma em `7`, sem clima | aproximadamente `0.7492`, risco `HIGH` |
| RK-04 | `pain=10`, `fatigue=10`, `stress=10`, `mood=0`, `sleepQuality=0`, `sleepHours=0`, `hydration=0.5`, todos os sintomas em `10`, clima frio/umido/baixa pressao/com chuva forte | `1.0`, risco `CRITICAL` |

## 8. Casos de API que a UI atual nao cobre, mas o sistema aceita

### 8.1. `painLevel` omitido

- [ ] criar `DailyRecord` sem `painLevel`

Esperado:

- backend usa fallback:

```ts
round((fatigueLevel + stressLevel + (10 - moodLevel)) / 3)
```

### 8.2. `recordDate` omitido

- [ ] criar `DailyRecord` sem `recordDate`

Esperado:

- backend usa a data atual normalizada

### 8.3. `recordDate` futuro

- [ ] criar `DailyRecord` com data futura pela API

Esperado:

- a UI bloqueia isso
- o backend atual nao bloqueia explicitamente
- validar se o sistema aceita e como isso impacta listas, previsoes e relatorios

### 8.4. Diferenca entre limites da UI e da API

Teste:

- [ ] `hydration = 8` pela UI
- [ ] `hydration = 12` pela API
- [ ] `physicalActivityMinutes = 1440`

Esperado:

- UI limita hidratacao a `8`
- API aceita hidratacao ate `15`
- atividade fisica aceita ate `1440`

### 8.5. Normalizacao de texto

Teste pela API:

- [ ] `painType = "  Pontada   "`
- [ ] `weatherImpact = "   frio   forte  "`
- [ ] `notes = "  piorou   no fim do dia  "`

Esperado:

- `trim()`
- colapso de espacos internos

### 8.6. Normalizacao de arrays

Teste pela API:

- [ ] `painTriggers = ["Luz forte", " luz forte ", "LUZ FORTE"]`
- [ ] `painAreas = ["Ombro esquerdo", " ombro esquerdo "]`

Esperado:

- duplicatas e vazios saem no `DailyRecord`
- relatorios nao devem contar duplicatas internas do mesmo registro

## 9. Casos de `symptomEntries` explicitos via API

### 9.1. Entrada customizada sem sintoma da UI

- [ ] enviar `symptomEntries` com `symptomName = "Tontura"`, `severity = 6`, `category = "OTHER"`

Esperado:

- entrada persiste com esse nome
- categoria fica `OTHER` se nao houver mapeamento melhor
- ela nao muda o `symptomLoad` principal se o `symptomSignal` do registro existir, o que hoje sempre acontece no fluxo principal

### 9.2. Sobrescrever entrada automatica

- [ ] enviar `cognitiveFog = true` com `cognitiveFogLevel = 5`
- [ ] junto, enviar `symptomEntries` explicito `Fibro fog` com `severity = 9`

Esperado:

- o `symptomEntry` final `Fibro fog` fica com severidade `9`
- o `symptomLoad` e o risco continuam usando o nivel do `symptomSignal`, nao o `symptomEntry` sobrescrito

### 9.3. Entrada explicita com `severity = 0`

- [ ] enviar `symptomEntries` com severidade `0`

Esperado:

- essa entrada e descartada

### 9.4. Update que tenta limpar entradas

- [ ] criar registro com `symptomEntries` explicitos
- [ ] depois fazer `PATCH` sem `symptomEntries` novos e com todos os niveis em `0`

Esperado no comportamento atual:

- se nenhuma entrada nova for montada e o registro antigo ja tiver entradas, o backend pode reaproveitar as antigas
- isso precisa ser validado porque impacta regressao e entendimento do sistema

## 10. Casos do endpoint standalone `POST /symptoms`

Use estes testes para validar o segundo caminho de ingestao de sintomas.

### 10.1. Casos obrigatorios

- [ ] `stiffness = 0`, todas as flags `false`
- [ ] `stiffness = 7`, todas as flags `false`
- [ ] `cognitiveFog = true`
- [ ] `headache = true`
- [ ] `digestiveIssues = true`
- [ ] `anxiety = true`
- [ ] `depression = true`
- [ ] `sensitivityLight = true`
- [ ] `sensitivityNoise = true`
- [ ] `bodyTemperatureFeeling = Frio`

### 10.2. O que validar nesse endpoint

- nao cria `DailyRecord`
- nao cria `CrisisPrediction`
- nao cria `symptomEntries`
- aparece como `SymptomSignal` isolado
- pode influenciar relatorios e IA no dia do `createdAt`
- flags booleanas contam nas analises
- `symptomLoad` desse snapshot isolado depende de `stiffness`, porque os outros niveis nao sao enviados nesse endpoint

### 10.3. Diferenca essencial entre os dois caminhos

Compare:

- [ ] `POST /daily-records` com `cognitiveFog: true` e sem nivel
- [ ] `POST /symptoms` com `cognitiveFog: true`

Esperado:

- no `daily-records`, o backend assume nivel `5`
- no `symptoms`, a flag fica `true`, mas sem `cognitiveFogLevel = 5`
- por isso o impacto em `symptomLoad` e diferente

## 11. Onde conferir se os calculos bateram

Depois de cada caso importante, validar:

- [ ] resposta do `POST /daily-records`
- [ ] `GET /daily-records`
- [ ] `GET /crisis-predictions/latest`
- [ ] `GET /reports/generate?period=weekly`
- [ ] dashboard do paciente em `/app/dashboard`
- [ ] relatorios do paciente em `/app/reports`

Conferencias principais:

- `symptomSignal` salvo com os campos corretos
- `symptomEntries` gerados com nomes e severidades corretos
- `dataReliabilityScore` coerente com os pontos esperados
- `dataReliabilityLabel` coerente com o score
- `probability` e `riskLevel` da previsao de crise
- `symptomLoadAverage` no dashboard
- gatilhos recorrentes no relatorio
- `coldBodyTemperature` e gatilhos de frio
- contagem de `cognitiveFog`, `headache`, `digestiveIssues`, `anxiety`, `depression`

## 12. Resumo rapido das formulas que mais importam nesses testes

### 12.1. Carga de sintomas

```ts
symptomLoad = media dos niveis positivos dos 8 sintomas
```

### 12.2. Contribuicao de sintomas no risco

```ts
symptomContribution = (symptomLoad / 10) * 15
```

### 12.3. Confiabilidade ligada a sintomas

```ts
if (symptomSignalPresent || symptomEntryCount > 0) {
  score += 12
}
```

No fluxo principal atual:

- esse `+12` normalmente sempre entra
- porque a tela sempre envia `symptomSignal`

### 12.4. Thresholds que valem testar

- `highStiffness`: `stiffness >= 7`
- `highFatigue`: `fatigueLevel >= 7`
- `highStress`: `stressLevel >= 7`
- `lowMood`: `mood <= 4`
- `poorSleepQuality`: `sleepQuality <= 4`
- `sleepUnder5h`: `sleepHours < 5`
- `lowHydration`: `hydration < 1.5`
- `lowPhysicalActivity`: `physicalActivity < 20`
- `skippedMedication`: `medicationTaken === false`
- `coldWeather`: texto contendo `frio`, `cold`, `gelado`, `gelada`, `chilly`, `freezing` ou `cold front`

## 13. Ordem recomendada de execucao

1. Rodar `DR-01` a `DR-10` para garantir que o fluxo principal salva tudo.
2. Cobrir as 19 areas, 7 tipos de dor e 10 gatilhos.
3. Rodar a matriz completa dos 8 sintomas.
4. Rodar `CM-01` a `CM-05` para validar `symptomLoad`.
5. Rodar `RK-01` a `RK-04` para validar o motor de risco.
6. Rodar os casos de `symptomEntries` explicitos.
7. Rodar os casos do endpoint `POST /symptoms`.
8. Fechar conferindo dashboard, relatorios e ultima previsao.

Se todos os grupos acima passarem, voce tera coberto praticamente tudo que hoje pode alterar calculo de sintomas no FibroSync sem depender de suposicoes fora do codigo real.
