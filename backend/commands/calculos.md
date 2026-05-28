# Prisma, Registros e Cálculos do Sistema

Este arquivo agora serve como um README funcional de como os dados clínicos estão sendo salvos e de como o sistema calcula dashboard, risco, clima, relatórios e padrões.

> Atualização importante: o fluxo principal foi refatorado. As derivações artificiais `fatigueLevel = painLevel`, `stressLevel = painLevel`, `mood = 10 - painLevel` e `sleepQuality = 0` não fazem mais parte do formulário principal.

Os pontos abaixo refletem o comportamento real do código atual, principalmente nestes arquivos:

- `frontend/src/pages/patient/pain-log-page.tsx`
- `frontend/src/pages/patient/dashboard-page.tsx`
- `backend/src/modules/daily-records/daily-records.service.ts`
- `backend/src/modules/weather/weather.service.ts`
- `backend/src/modules/crisis-prediction/crisis-prediction.service.ts`
- `backend/src/modules/reports/reports.service.ts`
- `backend/src/modules/ai/pattern-analysis.service.ts`
- `backend/src/modules/ai/pattern-score.engine.ts`
- `backend/prisma/schema.prisma`

## 1. Estrutura de dados que alimenta os cálculos

| Modelo Prisma | Papel atual no sistema |
| --- | --- |
| `DailyRecord` | Registro principal de dor e contexto do dia. Alimenta dashboard, risco e relatórios. |
| `WeatherRecord` | Histórico de clima salvo por usuário. Serve de apoio para dashboard, registro e fallback. |
| `SymptomSignal` | Sinais complementares independentes ligados ao `DailyRecord`, como névoa cognitiva, cefaleia, sensibilidade etc. |
| `Symptom` | Catálogo de sintomas. |
| `SymptomEntry` | Relação entre `DailyRecord` e `Symptom`, com severidade e duração. Agora é criado junto com o fluxo principal. |
| `CrisisPrediction` | Predição por motor de regras, gerada a cada criação/edição de `DailyRecord`. |
| `AiPrediction` | Predição gerada por IA, separada do motor de regras. |
| `UserRiskProfile` | Perfil personalizado com pesos, padrões e score de risco com base no histórico. |
| `Report` | Snapshot consolidado do relatório semanal, mensal ou trimestral. |

## 2. Como o registro de dor é salvo hoje

### 2.1. O que o usuário preenche no formulário atual

No fluxo atual de `frontend/src/pages/patient/pain-log-page.tsx`, o usuário informa:

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
- tipo de dor
- áreas do corpo em mapa frontal e traseiro independentes
- gatilhos selecionados
- observações
- impacto percebido do clima
- clima automático do dia atual, quando o GPS está disponível
- `symptomSignal`
  - `stiffness`
  - `cognitiveFog`
  - `headache`
  - `digestiveIssues`
  - `anxiety`
  - `depression`
  - `sensitivityLight`
  - `sensitivityNoise`
  - `bodyTemperatureFeeling`
  - `notes`

### 2.2. O que não é mais derivado automaticamente

O frontend principal agora envia cada variável clínica de forma independente.

Não existe mais este comportamento no fluxo principal:

```ts
fatigueLevel = painLevel
stressLevel = painLevel
mood = 10 - painLevel
sleepQuality = 0
```

Essas fórmulas antigas ficaram apenas como referência histórica em trechos mais antigos deste documento.

### 2.3. Áreas, tipos e gatilhos disponíveis no fluxo atual

No frontend atual:

- `painType` usa um conjunto guiado de opções clínicas, mas a API continua aceitando string
- `painTriggers` usa opções guiadas e continua aceitando string
- `painAreas` agora usa as 19 áreas do ACR 2010 em dois estados separados:
  - `frontPainAreas`
  - `backPainAreas`

Áreas frontais:

- `Mandibula esquerda`
- `Mandibula direita`
- `Ombro esquerdo`
- `Ombro direito`
- `Braco superior esquerdo`
- `Braco superior direito`
- `Braco inferior esquerdo`
- `Braco inferior direito`
- `Quadril esquerdo`
- `Quadril direito`
- `Coxa esquerda`
- `Coxa direita`
- `Joelho esquerdo`
- `Joelho direito`
- `Torax`
- `Abdomen`

Áreas traseiras:

- `Cervical`
- `Costas superiores`
- `Costas inferiores`

### 2.4. Normalização feita no backend ao salvar `DailyRecord`

No `DailyRecordsService`:

- `recordDate` é normalizado para data UTC sem horário
- textos passam por limpeza visual com `trim()` e colapso de espaços
- comparações e deduplicação usam `normalizeText(value)`
  - lowercase
  - remoção de acentos
  - colapso de espaços
- `painAreas` e `painTriggers`
  - removem vazios
  - removem duplicados por versão normalizada
- `weatherImpact` e `weatherFeeling` acabam salvos em `weatherFeeling`
- `symptomEntries` podem ser montados automaticamente a partir de `symptomSignal`

### 2.5. Inferência de dor no backend

Se `painLevel` não vier no payload, o backend infere assim:

```ts
painLevel = round((fatigueLevel + stressLevel + (10 - mood)) / 3)
painLevel = clamp(0, 10)
```

Hoje isso existe apenas como compatibilidade defensiva. O frontend principal envia `painLevel` explicitamente.

### 2.6. Como o clima entra no `DailyRecord`

Prioridade de resolução do `weatherSnapshot`:

1. `dto.weatherSnapshot`
2. snapshot já salvo em `metadata` no update
3. último `WeatherRecord` do mesmo usuário na mesma data

O snapshot:

- é salvo em `metadata.weatherSnapshot`
- e também pode gerar um `WeatherRecord` dentro da mesma transação do registro

### 2.7. O que acontece depois de salvar um `DailyRecord`

Após criar ou atualizar um registro:

- o backend persiste:
  - `DailyRecord`
  - `SymptomSignal` ligado ao registro
  - `SymptomEntry`
  - `WeatherRecord`, quando há snapshot disponível
- o backend faz `upsert` da `CrisisPrediction`
- o frontend invalida cache de:
  - `dailyRecords`
  - `latestPrediction`
  - `latestAiPrediction`
  - `predictionHistory`
  - `report`

## 3. Como o dashboard do paciente é calculado

### 3.1. Fonte de dados do dashboard

O dashboard do paciente usa `useDailyRecords()` sem passar `limit`.

Na prática, a API retorna:

- `page = 1`
- `limit = 20`
- ordenação por `recordDate desc`, depois `createdAt desc`

Então o dashboard trabalha, no máximo, com os 20 registros mais recentes da primeira página.

### 3.2. Janelas internas usadas pelo dashboard

Depois que os registros chegam:

```ts
latestRecord = recordList[0] ?? null
trendWindow = recordList.slice(0, 7)
patternWindow = recordList.slice(0, 12)
recentEntries = recordList.slice(0, 4)
```

## 4. Fórmulas exatas de cada bloco do dashboard

### 4.1. Dor atual

Usa:

```ts
currentPainLevel = latestRecord?.painLevel ?? 0
```

Classificação visual:

- `>= 8`: `Muito alta`
- `>= 6`: `Alta`
- `>= 3`: `Moderada`
- `< 3`: `Controlada`

### 4.2. Média recente

Usa os últimos 7 registros de `trendWindow`:

```ts
recentPainAverage =
  average(trendWindow.map((record) => record.painLevel))
```

Regras:

- se não houver registros, retorna `0`
- arredonda para 1 casa decimal

### 4.3. Registros hoje

Conta quantos registros têm `createdAt` no mesmo dia do relógio do navegador:

```ts
recordsToday = recordList.filter((record) =>
  isSameCalendarDay(record.createdAt, new Date())
).length
```

Importante:

- usa `createdAt`
- não usa `recordDate`

Então um registro antigo cadastrado hoje conta como "registro hoje" se o `createdAt` for de hoje.

### 4.4. Pico recente

Procura o maior `painLevel` dentro dos últimos 7 registros:

```ts
peakPainRecord = trendWindow.reduce((highest, record) => {
  if (!highest || record.painLevel > highest.painLevel) {
    return record
  }
  return highest
}, null)
```

O card mostra:

- valor: `peakPainRecord.painLevel`
- horário: `peakPainRecord.createdAt` formatado como hora e minuto

Se houver empate, o reduce mantém o primeiro pico encontrado nessa janela.

### 4.5. Evolução das últimas ocorrências

O gráfico usa `trendWindow`, mas invertido para ficar do mais antigo para o mais recente:

```ts
dashboardTrend = trendWindow
  .slice()
  .reverse()
  .map((record) => ({
    label: formatEntryDateTime(record.createdAt),
    value: record.painLevel,
    comparison: record.stressLevel,
  }))
```

No gráfico:

- linha principal: `painLevel`
- linha secundária: `stressLevel`

Como o formulário atual seta `stressLevel = painLevel`, a tendência visual de dor e estresse tende a sair muito parecida no fluxo principal.

### 4.6. Como o tempo pode afetar hoje

O bloco usa geolocalização + `GET /weather/current`.

#### Regra de risco climático elevado

```ts
isWeatherRiskElevated =
  (temperature < 20 && humidity > 70) ||
  pressure < 1000 ||
  precipitation > 0
```

#### Mensagem de impacto climático

A mensagem segue esta ordem:

1. `temperature < 20 && humidity > 70`
   `Frio e umidade alta podem aumentar rigidez e dor hoje.`
2. `pressure < 1000`
   `Queda de pressão pode deixar o corpo mais sensível hoje.`
3. `precipitation > 0 && humidity >= 70`
   `Chuva e ar úmido podem aumentar fadiga e sensação de peso.`
4. `humidity >= 70`
   `Alta umidade pode aumentar fadiga hoje.`
5. `apparentTemperature > 32`
   `Calor e sensação térmica elevada podem pedir mais pausas e hidratação.`
6. fallback
   `Clima relativamente estável para acompanhar sintomas com mais clareza.`

#### Origem do clima

O bloco ainda informa a origem:

- `live`
- `cache`
- `database-fallback`
- `safe-fallback`

### 4.7. Resumo real da última dor

Esse bloco não faz cálculo estatístico. Ele mostra o `latestRecord`:

- `painType`
- `createdAt`
- `painLevel`
- `notes`
- `painAreas`
- `painTriggers`

Fallbacks:

- sem tipo: `Tipo de dor não informado`
- sem nota: `Sem observações adicionadas neste registro.`
- sem áreas: `Nenhuma área informada`
- sem gatilhos: `Nenhum gatilho informado`

### 4.8. Contexto atual

Esse bloco mostra diretamente:

- dor: `latestRecord.painLevel`
- humor: `latestRecord.mood`
- qualidade do sono: `latestRecord.sleepQuality`
- ocorrências de hoje: `recordsToday`

Observação importante:

- no formulário atual, `sleepQuality` é enviado como `0`
- então esse campo pode parecer "real", mas no fluxo principal ele está vindo de um valor fixo

#### Insight rápido

O bloco mostra dois tipos de insight:

1. alerta climático, se `isWeatherRiskElevated`
2. `latestPrediction.explanation`

Hoje `latestPrediction` vem do endpoint `/crisis-predictions/latest`, ou seja:

- a tela chama isso de "painel de IA"
- mas o texto mostrado aqui vem da `CrisisPrediction.recommendationSummary`
- na prática é o motor de regras, não a tabela `AiPrediction`

### 4.9. Últimas dores registradas

Usa os 4 primeiros registros:

- título: `painType`
- data/hora: `createdAt`
- badge: `painLevel`
- subtítulo: `painAreas.join(", ")`
- até 3 gatilhos por card

### 4.10. Áreas e gatilhos mais citados

Esse bloco usa `patternWindow`, ou seja, os últimos 12 registros.

#### Função de frequência usada no dashboard

```ts
buildFrequency(values):
  1. trim em cada valor
  2. ignora vazios
  3. conta ocorrências exatas
  4. maxCount = maior contagem encontrada
  5. percentage = round((count / maxCount) * 100)
```

Importante:

- a porcentagem aqui é relativa ao item mais frequente
- não é porcentagem sobre total de registros

#### Áreas mais afetadas

```ts
topPainAreas =
  buildFrequency(patternWindow.flatMap((record) => record.painAreas)).slice(0, 4)
```

#### Gatilhos mais percebidos

```ts
topPainTriggers =
  buildFrequency(patternWindow.flatMap((record) => record.painTriggers)).slice(0, 4)
```

#### Tipos de dor recorrentes

```ts
topPainTypes =
  buildFrequency(
    patternWindow
      .map((record) => record.painType)
      .filter(Boolean)
  ).slice(0, 3)
```

## 5. Como o clima é organizado no backend

### 5.1. Fonte externa

O backend usa Open-Meteo em `backend/src/modules/weather/weather.service.ts`.

Campos buscados:

- `temperature_2m`
- `relative_humidity_2m`
- `apparent_temperature`
- `precipitation`
- `surface_pressure`
- `wind_speed_10m`
- `weather_code`

### 5.2. Cache

Há cache em memória por coordenada com TTL de 30 minutos:

```ts
WEATHER_CACHE_TTL_MS = 30 * 60 * 1000
cacheKey = `${lat.toFixed(3)}:${lon.toFixed(3)}`
```

### 5.3. Persistência

Ao obter clima:

- o sistema tenta persistir em `weather_records`
- evita duplicar se o último registro for recente e idêntico

### 5.4. Fallbacks

Se a chamada ao provedor falhar, a ordem é:

1. cache em memória
2. último `WeatherRecord` salvo do usuário
3. fallback seguro:

```ts
temperature = 24
humidity = 55
apparentTemperature = 24
precipitation = 0
pressure = 1013
windSpeed = 8
weatherCode = 1
source = "safe-fallback"
```

## 6. Como os sintomas estão organizados hoje

### 7.1. Catálogo de sintomas

O seed cria sintomas padrão em `symptoms`:

- Dor generalizada
- Fadiga extrema
- Sono não reparador
- Fibro fog
- Rigidez matinal
- Ansiedade
- Sensibilidade gastrointestinal

### 7.2. `symptom_signals`

`SymptomSignal` é um registro separado do `DailyRecord`.

Ele guarda:

- numéricos:
  - `fatigueLevel`
  - `sleepQuality`
  - `stiffness`
  - `mood`
  - `stress`
- booleanos:
  - `cognitiveFog`
  - `sensitivityLight`
  - `sensitivityNoise`
  - `digestiveIssues`
  - `headache`
  - `anxiety`
  - `depression`
- texto:
  - `bodyTemperatureFeeling`
  - `notes`

### 7.3. `symptom_entries`

`SymptomEntry` foi modelado para conectar um `DailyRecord` a sintomas do catálogo com:

- `symptomId`
- `severity`
- `durationMinutes`
- `notes`

### 7.4. Situação atual do fluxo principal

Hoje o formulário principal de dor:

- não envia `symptomEntries`
- não cria itens na tabela `symptom_entries`

Consequência prática:

- `painAreas`, `painTriggers` e `painType` são os principais sinais do registro atual de dor
- `symptomEntries` só impactam o sistema se forem preenchidos por outro fluxo ou integração

## 8. Cálculo do risco de crise por motor de regras

Toda criação ou edição de `DailyRecord` dispara `upsertForDailyRecord()`.

### 8.1. Fatores usados

O score soma contribuições até o teto de 100.

#### Dor

```ts
(painLevel / 10) * 25
```

#### Fadiga

```ts
(fatigueLevel / 10) * 20
```

#### Estresse

```ts
(stressLevel / 10) * 15
```

#### Déficit de sono

Se `sleepHours` existir:

```ts
max(0, ((7 - sleepHours) / 7) * 15)
```

Se não existir:

```ts
5
```

#### Instabilidade de humor

```ts
((10 - moodLevel) / 10) * 10
```

#### Carga de sintomas

Se houver `symptomEntries`:

```ts
averageSymptomSeverity =
  sum(symptomEntries.severity) / symptomEntries.length

(averageSymptomSeverity / 10) * 15
```

Se não houver `symptomEntries`:

```ts
0
```

#### Déficit de hidratação

Se `waterIntakeLiters` existir:

```ts
max(0, ((2 - waterIntakeLiters) / 2) * 5)
```

Se não existir:

```ts
2
```

#### Fatores climáticos

- temperatura `< 20`: `+4`
- temperatura `> 32`: `+2`
- umidade `> 70`:
  - se também estiver frio: `+6`
  - senão: `+3`
- pressão `< 1000`: `+8`
- sensação térmica `< 18` ou `> 32`: `+4`
- precipitação:
  - `>= 5`: `+4`
  - `> 0`: `+2`

### 8.2. Score, probabilidade e faixa de risco

```ts
score = min(sum(contributions), 100)
probability = score / 100
```

Faixas:

- `< 0.35`: `LOW`
- `>= 0.35`: `MODERATE`
- `>= 0.6`: `HIGH`
- `>= 0.8`: `CRITICAL`

### 8.3. Confidence score

Conta quantos sinais extras existem:

- `sleepHours`
- `sleepQuality`
- `exerciseMinutes`
- `waterIntakeLiters`
- `medicationAdherence`
- `notes`
- presença de `symptomEntries`
- presença de `weatherSnapshot`

Depois:

```ts
confidenceScore = min(0.7 + filledSignals * 0.04, 0.98)
```

### 8.4. Recomendação textual

O texto final é:

```ts
recommendationSummary = baseRecommendation + weatherRecommendation
```

Onde:

- `baseRecommendation` depende da faixa `LOW`, `MODERATE`, `HIGH`, `CRITICAL`
- `weatherRecommendation` adiciona observações se houver:
  - frio + umidade alta
  - pressão baixa
  - chuva

## 9. Como os relatórios são calculados

### 9.1. Geração

O frontend chama:

```http
GET /reports/generate?period=weekly|monthly|quarterly
```

O backend gera ou atualiza um `Report` via `upsert`.

### 9.2. Janela de tempo

- `weekly`: 7 dias
- `monthly`: 30 dias
- `quarterly`: 90 dias

A janela sempre termina em `today` normalizado para data UTC.

### 9.3. Fontes consultadas

Na geração do relatório entram:

- `daily_records`
- `symptom_signals`
- `ai_predictions`
- `user_risk_profile`

### 9.4. Como os dias consolidados são montados

O relatório cria `daySnapshots`, um por dia.

Se houver vários `DailyRecord` no mesmo dia:

- `recordCount += 1`
- `painLevel` do dia vira o maior valor do dia
- `sleepHours` fica com o último valor não nulo do dia
- `sleepQuality` fica com o último valor não nulo do dia
- `fatigueLevel`, `moodLevel`, `stressLevel` ficam com o último registro do dia
- `physicalActivity`, `hydration`, `medicationTaken` ficam com o último valor não nulo do dia
- `weatherFeeling` fica com o último texto não vazio
- `weatherSnapshot` vem do último snapshot disponível em `metadata`
- `ruleBasedProbabilityScore` fica com a maior predição do dia

Se houver `SymptomSignal` no dia:

- booleans viram `OR`
- `signalCount += 1`
- `coldBodyTemperature` vira `true` se `bodyTemperatureFeeling` contiver algo como:
  - `frio`
  - `friagem`
  - `cold`
  - `cold front`
  - `gelado`

Se houver `AiPrediction` no dia:

- `aiProbabilityScore` fica com a maior probabilidade daquele dia

### 9.5. Overview do relatório

#### `recordedEntries`

```ts
dailyRecords.length
```

#### `recordedDays`

Quantidade de dias únicos em `dailyRecords.recordDate`.

#### `averagePainLevel`

Média simples de `dailyRecords.painLevel`.

#### `symptomSignalCount`

```ts
symptomSignals.length
```

#### `rulePredictionCount`

Quantidade de `DailyRecord` que possuem `crisisPrediction`.

#### `aiPredictionCount`

```ts
aiPredictions.length
```

#### `dataCoverageRate`

```ts
(activeDays / expectedDays) * 100
```

Onde `activeDays = daySnapshots.length`.

Importante: `activeDays` conta qualquer dia que tenha registro, sinal de sintoma ou predição, não apenas `DailyRecord`.

#### Médias complementares

O relatório também calcula:

- `averageSleepHours`
- `averageFatigueLevel`
- `averageMoodLevel`
- `averageStressLevel`
- `averageProbabilityScore`

Essa última usa a média da probabilidade combinada por dia.

### 9.6. Evolução de dor, sono, fadiga e humor

Todos esses blocos usam a mesma lógica base `buildMetricEvolution()`.

#### Métricas calculadas

- `average`
- `min`
- `max`
- `latest`
- `change`
- `trend`
- `series`

#### Como `change` é calculado

```ts
midpoint = ceil(points.length / 2)
firstHalf = values.slice(0, midpoint)
secondHalf = values.slice(midpoint)

baseline = average(firstHalf)
comparisonBase = secondHalf.length > 0 ? average(secondHalf) : baseline
change = comparisonBase - baseline
```

#### Como `trend` é definido

Se:

```ts
abs(change) < stableThreshold
```

então:

- `stable`

Senão:

- se `higherIsBetter = true`
  - `change > 0`: `improving`
  - `change < 0`: `worsening`
- se `higherIsBetter = false`
  - `change < 0`: `improving`
  - `change > 0`: `worsening`

#### Configuração por bloco

| Bloco | higherIsBetter | stableThreshold |
| --- | --- | --- |
| `painEvolution` | `false` | `0.4` |
| `sleepEvolution.hours` | `true` | `0.35` |
| `sleepEvolution.quality` | `true` | `0.4` |
| `fatigueEvolution` | `false` | `0.4` |
| `moodEvolution` | `true` | `0.4` |

#### Observação importante

Essas séries usam cada `DailyRecord` individualmente com `createdAt`, não um ponto único por dia.

### 9.7. Padrões de dor no relatório

O bloco `painPatterns` calcula:

- `types`
- `areas`
- `triggers`

#### Regra de distribuição

No relatório, a porcentagem é:

```ts
percentage = (occurrences / totalEntries) * 100
```

Ou seja:

- diferente do dashboard
- aqui a base é total de registros

#### Detalhes

- `types`: usa `painType` não vazio
- `areas`: remove duplicados dentro de cada registro antes de contar
- `triggers`: remove duplicados dentro de cada registro antes de contar
- retorna top 6 por volume

### 9.8. Gatilhos recorrentes do relatório

Primeiro o sistema define:

```ts
highRiskDays = dias com combinedProbabilityScore >= 70
```

Depois avalia condições como:

- sono abaixo de 5h
- qualidade do sono baixa
- fadiga alta
- estresse alto
- humor reduzido
- baixa hidratação
- sensação de frio
- alta umidade
- pressão baixa
- chuva
- frio com umidade alta
- atividade física muito baixa
- medicação não registrada
- névoa cognitiva
- cefaleia
- alterações digestivas
- ansiedade
- humor depressivo

Para cada gatilho:

- `occurrences`: quantas vezes apareceu em todos os dias ativos
- `occurrenceRate`: `occurrences / activeDays * 100`
- `highRiskOccurrences`: quantas vezes apareceu nos dias de risco >= 70
- `highRiskRate`: `highRiskOccurrences / highRiskDays.length * 100`

Filtros:

- mantém se `occurrences >= 2`
- ou se `highRiskOccurrences > 0`

Ordenação:

1. `highRiskOccurrences desc`
2. `occurrenceRate desc`
3. `occurrences desc`

Retorna top 8.

### 9.9. Probabilidade de crise no relatório

#### Probabilidade combinada

```ts
combinedProbabilityScore =
  max(ruleBasedProbabilityScore, aiProbabilityScore)
```

#### Fonte dominante do dia

```ts
highestSource =
  aiProbabilityScore === combinedProbabilityScore
    ? "ai_prediction"
    : "rule_engine"
```

Se não houver score algum, fica `null`.

#### Métricas finais

- `averageProbabilityScore`
- `maxProbabilityScore`
- `highRiskDays`: score `>= 70`
- `urgentRiskDays`: score `>= 90`
- `latestProbabilityScore`
- `latestRiskSource`
- `dailySeries`

### 9.10. Correlações do relatório

O relatório tenta calcular correlação de Pearson para pares como:

- dor x probabilidade de crise
- sono x probabilidade de crise
- fadiga x probabilidade de crise
- estresse x probabilidade de crise
- humor x probabilidade de crise
- hidratação x probabilidade de crise
- atividade física x probabilidade de crise
- umidade x carga de sintomas
- sensação térmica x fadiga
- pressão x probabilidade de crise
- precipitação x probabilidade de crise

#### Regras

- só calcula se houver ao menos 4 amostras válidas
- usa coeficiente de Pearson

#### Classificação da direção

- `> 0.15`: `positive`
- `< -0.15`: `negative`
- entre isso: `none`

#### Força

- `>= 0.7`: `strong`
- `>= 0.4`: `moderate`
- abaixo disso: `weak`

Ordenação final:

- maior valor absoluto do coeficiente
- top 6

## 10. Perfil personalizado de risco

Esse perfil entra no relatório em `personalizedRiskProfile` e também serve de contexto para IA.

### 10.1. Janela

Por padrão:

- `AI_PATTERN_ANALYSIS_LOOKBACK_DAYS = 30`
- mínimo `14`
- máximo `90`

### 10.2. Como o sistema marca dias precursores

Um dia vira `isPrecursorDay = true` se:

- `riskLevel` da `CrisisPrediction` for `HIGH` ou `CRITICAL`
- ou `probability >= 0.6`

### 10.3. Features analisadas

- sono abaixo de 5h
- qualidade do sono ruim
- fadiga alta
- estresse alto
- humor baixo
- sensibilidade a frio
- baixa hidratação
- baixa atividade física
- medicação não tomada
- rigidez alta
- névoa cognitiva
- sensibilidade à luz/ruído
- questões digestivas
- cefaleia
- ansiedade
- depressão

### 10.4. Pesos padrão

Exemplos:

- `sleepUnder5h = 18`
- `highStress = 16`
- `highFatigue = 15`
- `lowHydration = 12`
- `coldWeather = 10`
- `cognitiveFog = 8`

### 10.5. Fórmula do peso personalizado

Para cada feature:

```ts
overallOccurrenceRate = totalDays > 0 ? overallCount / totalDays : 0
precursorOccurrenceRate =
  precursorDays.length > 0 ? precursorCount / precursorDays.length : 0

lift =
  overallOccurrenceRate > 0
    ? precursorOccurrenceRate / overallOccurrenceRate
    : precursorCount > 0
      ? 2
      : 1

confidenceFactor =
  precursorDays.length > 0
    ? min(1, precursorCount / precursorDays.length)
    : 0

enrichment = max(0, precursorOccurrenceRate - overallOccurrenceRate)
suppression = max(0, overallOccurrenceRate - precursorOccurrenceRate)
```

Peso ajustado:

```ts
adjustedWeight =
  precursorDays.length === 0
    ? defaultWeight
    : defaultWeight *
      (1 + enrichment * 1.8 + max(0, lift - 1) * 0.35) *
      (1 - suppression * 0.2) *
      (0.8 + confidenceFactor * 0.2)
```

Clamp final:

```ts
personalizedWeight =
  clamp(adjustedWeight, defaultWeight * 0.65, defaultWeight * 2.4)
```

### 10.6. Score personalizado atual

No último dia da janela:

```ts
currentPersonalizedScore =
  round((sum(weights das features ativas no último dia) / sum(todos os pesos)) * 100)
```

### 10.7. Baseline

É a média dos scores de todos os dias da janela, arredondada para inteiro.

### 10.8. Trigger patterns personalizados

#### Padrões simples

Uma feature vira padrão se:

- `evidenceCount >= 2`
- `precursorOccurrenceRate >= 0.55`
- `personalizedWeight >= defaultWeight * 1.05`

Força:

- `>= 0.75`: `HIGH`
- senão: `MEDIUM`

#### Padrões em pares

Pares avaliados:

- sono curto + estresse alto
- sono curto + baixa hidratação
- frio + baixa hidratação
- estresse alto + humor baixo
- fadiga alta + névoa cognitiva
- sono ruim + estresse alto

Critérios:

- `evidenceCount >= 2`
- `occurrenceRateBeforeCrisis >= 0.4`
- `weightedSupport >= 18`

## 11. Pontos de atenção do estado atual

### 11.1. O formulário principal distorce variáveis clínicas

Hoje o fluxo principal faz:

- `fatigueLevel = painLevel`
- `stressLevel = painLevel`
- `mood = 10 - painLevel`
- `sleepQuality = 0`

Então:

- correlações podem ficar artificialmente fortes
- risco pode subir por variáveis derivadas, não por entradas realmente independentes
- relatórios de humor, estresse e sono podem refletir a regra do formulário, não percepção real do paciente

### 11.2. `Registros hoje` usa `createdAt`, não `recordDate`

Isso pode gerar leitura diferente do que o usuário imagina no calendário.

### 11.3. O dashboard só enxerga a primeira página da API

Sem filtro explícito, o dashboard trabalha com até 20 registros.

### 11.4. `Contexto atual` não mostra a IA generativa

Apesar do rótulo visual, o texto do insight vem hoje da `CrisisPrediction.recommendationSummary`.

### 11.5. `symptom_entries` existe, mas não entra no fluxo principal

Isso afeta principalmente:

- `symptom burden` do motor de risco
- análises por sintoma ligado ao `DailyRecord`

### 11.6. `symptom_signals` enriquecem relatório e perfil, mas dependem de outro fluxo

O backend está pronto para usar `symptom_signals`, porém eles não são gerados pelo formulário principal de dor.

### 11.7. Percentuais do dashboard e dos relatórios são diferentes

- dashboard: relativo ao item mais frequente
- relatório: relativo ao total de registros

### 11.8. Contagem por texto não normaliza caixa

O sistema faz `trim()`, mas não padroniza maiúsculas/minúsculas na contagem. Em integrações futuras, `Estresse` e `estresse` podem virar itens distintos.

## 12. Resumo executivo

Hoje o sistema está organizado assim:

- `DailyRecord` é a base do dashboard e dos relatórios
- o dashboard do paciente usa janelas curtas sobre os registros mais recentes
- o clima usa Open-Meteo com cache, persistência e fallback
- o risco de crise é calculado por motor de regras com pesos fixos
- os relatórios consolidam registros por dia, calculam tendências, padrões, gatilhos, correlações e score de risco
- `SymptomSignal` e `UserRiskProfile` enriquecem relatórios e IA
- `SymptomEntry` já existe no schema, mas ainda não faz parte do fluxo principal do registro de dor

Se quiser, o próximo passo natural é eu transformar esse diagnóstico em uma segunda parte no mesmo arquivo com:

- proposta de correção dos cálculos mais frágeis
- sugestão de novo payload para o registro de dor
- lista do que precisa mudar no frontend e no backend para os relatórios ficarem clinicamente mais confiáveis
