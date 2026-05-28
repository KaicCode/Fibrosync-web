# Cálculos Atuais do Projeto

Atualizado com base no código real do projeto em 28/05/2026.

Este arquivo documenta o que o sistema realmente calcula hoje em:

- `frontend/src/pages/patient/pain-log-page.tsx`
- `frontend/src/features/clinical/record-analytics.ts`
- `frontend/src/pages/patient/dashboard-page.tsx`
- `frontend/src/hooks/useWeather.ts`
- `backend/src/modules/daily-records/daily-records.service.ts`
- `backend/src/common/utils/data-reliability.util.ts`
- `backend/src/modules/weather/weather.service.ts`
- `backend/src/modules/crisis-prediction/crisis-prediction.service.ts`
- `backend/src/modules/reports/reports.service.ts`
- `backend/src/modules/ai/pattern-analysis.service.ts`
- `backend/src/modules/ai/pattern-score.engine.ts`

O objetivo aqui e registrar o comportamento atual do sistema, inclusive detalhes que podem parecer estranhos, mas que sao exatamente o que o codigo faz hoje.

## 1. O que mudou de verdade

As regras abaixo nao valem mais no fluxo principal do app:

```ts
fatigueLevel = painLevel
stressLevel = painLevel
mood = 10 - painLevel
sleepQuality = 0
```

Hoje o formulario principal envia:

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
- `frontPainAreas`
- `backPainAreas`
- `weatherImpact`
- `notes`
- `symptomSignal`

Tambem mudou:

- `symptomEntries` agora entram no fluxo principal porque o backend os gera a partir de `symptomSignal`
- o dashboard nao usa mais uma primeira pagina fixa de 20 registros; ele busca tudo dentro da janela selecionada
- o relatorio trabalha com agregacao por dia, combinando `DailyRecord`, `SymptomSignal`, `CrisisPrediction`, `AiPrediction` e `UserRiskProfile`

## 2. Como o registro clinico e salvo

### 2.1. Campos obrigatorios e normalizacao

No `DailyRecordsService`, o backend resolve o payload assim:

| Campo | Regra atual |
| --- | --- |
| `recordDate` | Vai para `normalizeDateOnly()`, ficando como data UTC sem horario. |
| `painLevel` | Usa o valor enviado; se faltar, tenta inferir pelo fallback antigo. |
| `fatigueLevel` | Obrigatorio, arredondado e limitado entre `0` e `10`. |
| `stressLevel` | Obrigatorio, arredondado e limitado entre `0` e `10`. |
| `moodLevel` | Obrigatorio, aceita `moodLevel` ou `mood`, arredondado e limitado entre `0` e `10`. |
| `sleepQuality` | Obrigatorio, arredondado e limitado entre `0` e `10`. |
| `sleepHours` | Opcional, mantido com ate 2 casas decimais. |
| `hydration` | Opcional, arredondado para inteiro e limitado ao minimo `0`. |
| `physicalActivityMinutes` | Opcional, arredondado para inteiro e limitado ao minimo `0`. |
| `medicationTaken` | Opcional, salvo como `boolean` ou `null`. |
| `weatherImpact` / `weatherFeeling` | Ambos convergem para `weatherFeeling`. |
| `notes` / `painType` | Passam por `trim()` e colapso de espacos. |
| `painAreas` / `painTriggers` | Removem vazios e duplicados via `normalizeText()`. |

`normalizeText()` e usado para deduplicacao com:

- lowercase
- remocao de acentos
- colapso de espacos

### 2.2. Areas corporais

O frontend atual usa 19 areas clinicas, separadas em:

- `frontPainAreas`: 16 areas
- `backPainAreas`: 3 areas

As listas particionadas sao salvas em `metadata.frontPainAreas` e `metadata.backPainAreas`.

O campo `painAreas` final do `DailyRecord` e a combinacao normalizada das duas listas.

### 2.3. Fallback de `painLevel`

Se `painLevel` nao vier no payload, o backend ainda usa este fallback defensivo:

```ts
painLevel = round((fatigueLevel + stressLevel + (10 - moodLevel)) / 3)
painLevel = clamp(0, 10)
```

No fluxo principal atual, isso quase nao deveria acontecer, porque o frontend envia `painLevel` explicitamente.

### 2.4. `symptomSignal` e `symptomEntries`

O backend monta `symptomSignal` com base em:

- payload novo
- valor ja salvo no registro, no caso de update
- niveis centrais do proprio registro:
  - `fatigueLevel`
  - `sleepQuality`
  - `moodLevel`
  - `stressLevel`

Regra de severidade por sintoma (`resolveSymptomLevel()`):

```ts
if (level numerico valido) {
  return clamp(level, 0, 10) > 0 ? clamp(level, 0, 10) : null
}

if (flag booleano === true) {
  return 5
}

return null
```

Ou seja:

- se vier nivel, ele prevalece
- se vier apenas `true`, o backend assume nivel `5`
- se o nivel for `0`, o sintoma fica inativo

Os sintomas que podem gerar `symptomEntries` automaticamente sao:

- `Fibro fog`
- `Cefaleia`
- `Alteracoes digestivas`
- `Ansiedade`
- `Humor depressivo`
- `Sensibilidade a luz`
- `Sensibilidade a ruido`
- `Rigidez corporal`

Regras do merge final:

1. o backend gera entradas automaticas a partir do `symptomSignal`
2. depois mistura as entradas explicitas de `dto.symptomEntries`
3. entradas explicitas com mesmo sintoma sobrescrevem as automaticas
4. se nada vier no payload e o registro antigo tiver entradas, ele reaproveita as antigas
5. no fim, remove entradas com severidade `<= 0` e ordena por severidade decrescente

Toda severidade de `symptomEntry` fica em `0..10` apos arredondamento.

### 2.5. Clima no `DailyRecord`

A resolucao de `weatherSnapshot` segue esta prioridade:

1. `dto.weatherSnapshot`
2. `metadata.weatherSnapshot` ja salvo no registro
3. ultimo `WeatherRecord` do usuario na mesma data

Quando existe snapshot:

- ele vai para `metadata.weatherSnapshot`
- ele pode gerar um `WeatherRecord`

No `persistWeatherSnapshot()` do `DailyRecordsService`, o backend nao grava um novo `WeatherRecord` se o ultimo registro salvo tiver exatamente os mesmos valores de:

- temperatura
- umidade
- sensacao termica
- precipitacao
- pressao
- vento
- `weatherCode`

### 2.6. `derivedSignals`

Hoje o backend salva:

```ts
derivedSignals: false
```

Entao o fluxo principal atual ja nao marca sinais clinicos como derivados artificialmente.

## 3. Score de confiabilidade do dado

O score de confiabilidade vem de `calculateDataReliability()` e vai para:

- `DailyRecordResponse`
- dashboard
- predicao de crise
- relatorios

### 3.1. Pontos somados

| Sinal | Pontos |
| --- | ---: |
| `painLevel` presente | `+9` |
| `fatigueLevel` presente | `+9` |
| `stressLevel` presente | `+9` |
| `moodLevel` presente | `+9` |
| `sleepQuality` presente | `+8` |
| `sleepHours` presente | `+12` |
| `hydration` presente | `+6` |
| `physicalActivity` presente | `+5` |
| `medicationTaken` presente | `+4` |
| `weatherFeeling` com texto | `+4` |
| `painType` com texto | `+4` |
| `painAreas` com ao menos um item | `+6` |
| `painTriggers` com ao menos um item | `+4` |
| `notes` com texto | `+4` |
| `symptomSignalPresent` ou `symptomEntryCount > 0` | `+12` |

### 3.2. Consistencia temporal

Tambem soma:

- `+8` se `createdAt` estiver ate `1.1` dias de distancia de `recordDate`
- `+4` se estiver ate `3.1` dias
- `+0` acima disso

### 3.3. Penalidade

Se `derivedSignals === true`, aplica:

```ts
-18 pontos
```

### 3.4. Score final e rotulo

```ts
score = clamp(round(soma_total), 0, 100)
```

Rotulos:

- `<= 40`: `Baixa confiabilidade`
- `<= 70`: `Confiabilidade moderada`
- `> 70`: `Alta confiabilidade`

## 4. Clima atual e mensagens de impacto

### 4.1. Cache e fallback do backend

No `WeatherService`:

- cache em memoria: `30 minutos`
- se houver cache valido, usa cache e persiste para o usuario
- se a chamada live falhar, a ordem de fallback e:
  1. cache valido
  2. ultimo clima salvo do usuario
  3. fallback seguro:

```ts
{
  temperature: 24,
  humidity: 55,
  apparentTemperature: 24,
  precipitation: 0,
  pressure: 1013,
  windSpeed: 8,
  weatherCode: 1
}
```

### 4.2. Regra de risco climatico elevado

Frontend e backend usam a mesma ideia de risco climatico elevado:

```ts
isWeatherRiskElevated =
  (temperature < 20 && humidity > 70) ||
  pressure < 1000 ||
  precipitation > 0
```

### 4.3. Mensagem do hook `useWeather`

Prioridade atual de mensagem no frontend:

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

## 5. Dashboard do paciente

### 5.1. Fonte de dados

O dashboard atual usa:

```ts
useDailyRecords({
  dateFrom,
  dateTo,
  includeAll: true
})
```

O recorte pode ser de:

- `7 dias`
- `30 dias`
- `90 dias`

`dateFrom` e `dateTo` sao calculados por `resolveDateWindow()` usando a data local do navegador.

### 5.2. Agregacao diaria real

Toda a logica do dashboard passa por `buildDailyAggregates(records)`.

Passos:

1. agrupa registros por dia
2. ordena os registros do dia por `createdAt` crescente
3. define `latestRecord` como o ultimo do dia
4. calcula as medias por dia

Para cada dia agregado:

| Campo agregado | Formula atual |
| --- | --- |
| `painAverage` | media de `painLevel` |
| `painPeak` | `max(painLevel)` |
| `stressAverage` | media de `stressLevel` |
| `fatigueAverage` | media de `fatigueLevel` |
| `moodAverage` | media de `moodLevel` |
| `sleepHoursAverage` | media dos valores nao nulos |
| `sleepQualityAverage` | media dos valores nao nulos |
| `hydrationAverage` | media dos valores nao nulos |
| `reliabilityAverage` | media dos `dataReliabilityScore` nao nulos |
| `symptomLoadAverage` | media diaria de carga de sintomas |

Carga de sintomas por registro:

- se existir `symptomSignal`, usa a media dos niveis positivos de:
  - `stiffness`
  - `cognitiveFogLevel`
  - `headacheLevel`
  - `digestiveIssuesLevel`
  - `anxietyLevel`
  - `depressionLevel`
  - `sensitivityLightLevel`
  - `sensitivityNoiseLevel`
- se nao existir `symptomSignal`, usa a media de `symptomEntries[].severity`
- se nao houver nada, retorna `null`

### 5.3. Cards principais

`Dor mais recente`

```ts
latestRecord = latestDay?.latestRecord ?? null
value = latestRecord?.painLevel ?? 0
```

Classificacao visual:

- `>= 8`: `Dor muito alta`
- `>= 6`: `Dor alta`
- `>= 3`: `Dor moderada`
- `< 3`: `Dor controlada`

`Media recente`

```ts
averagePain =
  soma(day.painAverage) / quantidade_de_dias_agregados
```

`Pico recente`

```ts
peakDay = dia com maior painPeak
```

`Confiabilidade`

```ts
averageReliability =
  media(day.reliabilityAverage dos dias com valor)
```

Tons do card:

- `>= 71`: `success`
- `>= 41`: `default`
- `< 41`: `warning`

Observacao importante:

- o valor exibido no card e a media do periodo
- o texto auxiliar usa `latestRecord.dataReliabilityLabel`, nao o rotulo da media

### 5.4. Grafico de evolucao

O grafico principal usa:

- linha principal: `day.painAverage`
- linha secundaria: `day.stressAverage`

### 5.5. Rankings de areas e gatilhos

O ranking do dashboard usa `buildFrequency()`.

Essa funcao:

1. conta quantas vezes cada item apareceu
2. acha o maior `count`
3. calcula:

```ts
percentage = round((count / maxCount) * 100)
```

Isso significa que o percentual do dashboard nao e percentual sobre todos os registros, e sim percentual relativo ao item mais frequente.

### 5.6. Cobertura do periodo

```ts
coverage = min((aggregates.length / rangeDays) * 100, 100)
```

Ou seja, e a proporcao de dias agregados com dados dentro da janela escolhida.

### 5.7. Carga de sintomas recente

O card final da tela mostra:

```ts
latestDay?.symptomLoadAverage ?? 0
```

Ele nao mostra a media do periodo inteiro; mostra apenas a carga media do ultimo dia agregado da janela.

## 6. Motor clinico de risco de crise

O motor principal esta em `CrisisPredictionService`.

Cada `DailyRecord` gera ou atualiza uma `CrisisPrediction` com `predictedFor = recordDate + 1 dia`.

### 6.1. Carga de sintomas

Primeiro o motor resolve `symptomBurden`.

Se existir `symptomSignal`, usa:

```ts
average([
  stiffness,
  cognitiveFogLevel,
  sensitivityLightLevel,
  sensitivityNoiseLevel,
  digestiveIssuesLevel,
  headacheLevel,
  anxietyLevel,
  depressionLevel
])
```

Se nao existir `symptomSignal`, usa:

```ts
average(symptomEntries[].severity)
```

Se nao houver nenhum dos dois, usa `0`.

### 6.2. Contribuicoes de cada fator

| Fator | Formula |
| --- | --- |
| Dor | `(painLevel / 10) * 25` |
| Fadiga | `(fatigueLevel / 10) * 20` |
| Estresse | `(stressLevel / 10) * 15` |
| Sintomas | `(symptomBurden / 10) * 15` |
| Clima | `0..10` por regra fixa |
| Hidratacao | `0..5` por regra fixa |
| Sono | `0..20` por qualidade + penalidade de horas |
| Humor | `0..10` por penalidade + tendencia |

#### Sono

```ts
sleepQualityContribution = ((10 - sleepQuality) / 10) * 12

sleepPenalty =
  sleepHours < 5 ? 15 :
  sleepHours < 7 ? 8 :
  0

sleepContribution = min(sleepQualityContribution + sleepPenalty, 20)
```

#### Humor

```ts
moodPenalty =
  moodLevel <= 3 ? 10 :
  moodLevel <= 5 ? 5 :
  0

moodTrendContribution = ((10 - moodLevel) / 10) * 4

moodContribution = clamp(moodPenalty + moodTrendContribution, 0, 10)
```

#### Hidratacao

```ts
if hydration < 1   => 5
if hydration < 1.5 => 4
if hydration < 2   => 2
else               => 0
```

#### Clima

```ts
contribution = 0

if temperature < 18 || apparentTemperature < 17 => +3
else if temperature > 32 || apparentTemperature > 34 => +2

if humidity >= 75 => +2
if pressure < 1000 => +3

if precipitation > 0 {
  precipitation >= 5 ? +2 : +1
}

weatherContribution = min(contribution, 10)
```

### 6.3. Score, probabilidade e nivel de risco

```ts
maximumScore = 120
score = min(sum(contributions), 120)
probability = Number((score / 120).toFixed(4))
```

Nivel de risco:

- `probability >= 0.85`: `CRITICAL`
- `probability >= 0.65`: `HIGH`
- `probability >= 0.4`: `MODERATE`
- abaixo disso: `LOW`

No frontend, o percentual exibido vem de:

```ts
probabilityScore = Math.round(probability * 100)
```

### 6.4. Confidence score

O motor usa a confiabilidade do dado para gerar `confidenceScore`:

```ts
confidenceScore =
  clamp(dataReliabilityScore / 100, 0.45, 0.98)
```

Com arredondamento para 4 casas.

### 6.5. Recomendacoes textuais

Base por risco:

- `CRITICAL`: reduzir carga do dia, priorizar descanso e considerar equipe de cuidado
- `HIGH`: reforcar autocuidado, hidratacao e pausas
- `MODERATE`: observar dor, estresse e sono
- `LOW`: manter rotina e continuar registrando

Notas extras de clima:

- `temperature < 20 && humidity > 70`
- `pressure < 1000`
- `precipitation > 0`

Essas observacoes sao concatenadas ao resumo final.

## 7. Relatorios

### 7.1. Janela de dados

`ReportsService.resolveWindow()` trabalha sempre ate o dia atual:

- semanal: `7 dias`
- mensal: `30 dias`
- trimestral: `90 dias`

### 7.2. Fontes usadas

O relatorio cruza:

- `DailyRecord`
- `SymptomSignal`
- `AiPrediction`
- `UserRiskProfile`

### 7.3. Agregacao por dia

`buildDaySnapshots()` cria um objeto por dia.

Regras principais:

- `painLevel`: maior `painLevel` do dia
- `sleepHours`: ultimo valor nao nulo do dia
- `sleepQuality`: ultimo valor nao nulo do dia
- `fatigueLevel`: ultimo valor do dia
- `moodLevel`: ultimo valor do dia
- `stressLevel`: ultimo valor do dia
- `physicalActivity`: ultimo valor nao nulo do dia
- `hydration`: ultimo valor nao nulo do dia
- `medicationTaken`: ultimo valor nao nulo do dia
- `weatherFeeling`: ultimo texto nao vazio do dia
- `derivedSignalsPresent`: OR entre os registros do dia
- `dataReliabilityScore`: media progressiva dos scores dos registros do dia
- `ruleBasedProbabilityScore`: maior `Math.round(probability * 100)` do dia
- `aiProbabilityScore`: maior `probabilityScore` de IA do dia
- `combinedProbabilityScore`: `max(ruleBasedProbabilityScore, aiProbabilityScore)`

Para `SymptomSignal` do relatorio:

- `symptomLoad`: maior carga de sintomas do dia
- flags como `cognitiveFog`, `headache`, `anxiety` etc. usam OR
- `coldBodyTemperature` vira `true` se `bodyTemperatureFeeling` indicar frio

### 7.4. Overview do relatorio

Principais campos:

| Campo | Formula |
| --- | --- |
| `recordedEntries` | quantidade de `DailyRecord` na janela |
| `recordedDays` | dias distintos com `DailyRecord` |
| `averagePainLevel` | media de `day.painLevel` |
| `dataCoverageRate` | `(activeDays / expectedDays) * 100` |
| `averageSleepHours` | media de `day.sleepHours` |
| `averageFatigueLevel` | media de `day.fatigueLevel` |
| `averageMoodLevel` | media de `day.moodLevel` |
| `averageStressLevel` | media de `day.stressLevel` |
| `averageProbabilityScore` | media de `combinedProbabilityScore` |
| `averageDataReliabilityScore` | media de `day.dataReliabilityScore` |
| `derivedRecordRate` | percentual de registros com `derivedSignals = true` |

Observacao importante:

- `activeDays` e `daySnapshots.length`
- isso pode incluir dias com sinais ou IA, mesmo sem `DailyRecord`

### 7.5. Evolucao de metricas

`buildMetricEvolution()` faz:

```ts
midpoint = ceil(points.length / 2)
firstHalf = primeira metade
secondHalf = segunda metade

baseline = average(firstHalf)
comparisonBase = average(secondHalf) ou baseline
delta = comparisonBase - baseline
```

Trend:

- `stable` se `abs(delta) < stableThreshold`
- se `higherIsBetter === true`:
  - `delta > 0` => `improving`
  - `delta < 0` => `worsening`
- se `higherIsBetter === false`:
  - `delta < 0` => `improving`
  - `delta > 0` => `worsening`

Thresholds usados hoje:

- dor: `0.4`
- horas de sono: `0.35`
- qualidade do sono: `0.4`
- fadiga: `0.4`
- humor: `0.4`

### 7.6. Padroes de dor

`buildPainPatterns()` gera distribuicoes de:

- `painType`
- `painAreas`
- `painTriggers`

Percentual no relatorio:

```ts
percentage = (occurrences / totalEntries) * 100
```

Aqui `totalEntries` e a quantidade de `DailyRecord` da janela.

Detalhe importante:

- em `painAreas` e `painTriggers`, cada registro remove duplicados internos com `new Set()` antes de contar
- o relatorio retorna no maximo `6` itens por distribuicao

### 7.7. Gatilhos recorrentes

Um dia entra como `highRiskDay` quando:

```ts
combinedProbabilityScore >= 70
```

Os gatilhos avaliados hoje sao:

- sono abaixo de `5h`
- qualidade do sono `<= 4`
- fadiga `>= 7`
- estresse `>= 7`
- humor `<= 4`
- hidratacao `< 1.5`
- sensacao de frio
- umidade `>= 70`
- pressao `< 1000`
- chuva
- frio com umidade alta
- atividade fisica `< 15`
- medicacao nao tomada
- nevoa cognitiva
- cefaleia
- alteracoes digestivas
- ansiedade
- humor depressivo

Para cada gatilho:

```ts
occurrenceRate = (occurrences / activeDays) * 100
highRiskRate =
  highRiskDays.length > 0
    ? (highRiskOccurrences / highRiskDays.length) * 100
    : 0
```

So entram no resultado final gatilhos com:

- `occurrences >= 2`, ou
- `highRiskOccurrences > 0`

O relatorio devolve no maximo `8`.

### 7.8. Probabilidade de crise no relatorio

Serie diaria:

- `ruleBasedProbabilityScore`
- `aiProbabilityScore`
- `combinedProbabilityScore = max(rule, ai)`

`highestSource`:

- `ai_prediction` se a IA for a maior daquele dia
- senao `rule_engine`

Resumo:

- `averageProbabilityScore`: media dos combinados
- `maxProbabilityScore`: maior score combinado
- `highRiskDays`: quantidade de scores `>= 70`
- `urgentRiskDays`: quantidade de scores `>= 90`
- `latestProbabilityScore`: ultimo score combinado nao nulo

### 7.9. Correlacoes

O relatorio usa correlacao de Pearson em pares como:

- dor x risco de crise
- sono x risco de crise
- fadiga x risco de crise
- estresse x risco de crise
- humor x risco de crise
- hidratacao x risco de crise
- atividade x risco de crise
- umidade x carga de sintomas
- sensacao termica x fadiga
- pressao x risco de crise
- chuva x risco de crise

Regras:

- precisa de pelo menos `4` amostras validas
- se o coeficiente for `null`, o par e descartado
- direcao:
  - `> 0.15`: `positive`
  - `< -0.15`: `negative`
  - caso contrario: `none`
- forca:
  - `>= 0.7`: `strong`
  - `>= 0.4`: `moderate`
  - abaixo disso: `weak`

O relatorio devolve no maximo `6` correlacoes.

## 8. Perfil personalizado de risco

O perfil personalizado usa:

- `PatternAnalysisService`
- `PatternScoreEngine`

### 8.1. Janela de analise

`lookbackDays`:

- usa `ai.patternAnalysisLookbackDays` do config, se existir
- fallback para `30`
- depois aplica:

```ts
lookbackDays = clamp(round(valor), 14, 90)
```

### 8.2. Como os dias sao montados

Cada `PatternAnalysisDay` combina:

- `DailyRecord`
- `SymptomSignal`

Do `DailyRecord`:

- `sleepHours`
- `sleepQuality`
- `fatigueLevel`
- `mood`
- `stressLevel`
- `physicalActivity`
- `hydration`
- `medicationTaken`
- `weatherFeeling`
- `riskProbability`
- `riskLevel`

Do `SymptomSignal`:

- `fatigueLevel`: pega o maior valor do dia
- `sleepQuality`: pega o menor valor do dia
- `stiffness`: pega o maior valor do dia
- `mood`: pega o menor valor do dia
- `stressLevel`: pega o maior valor do dia
- flags booleanas usam OR
- `bodyTemperatureFeeling` e acumulado como lista sem duplicatas

### 8.3. O que e um dia precursor

Um dia vira `isPrecursorDay = true` quando:

- `riskLevel === HIGH`, ou
- `riskLevel === CRITICAL`, ou
- `probability >= 0.6` no score bruto do motor, ainda em escala `0..1`

### 8.4. Features avaliadas

Features atuais e pesos padrao:

- `sleepUnder5h`: `18`
- `poorSleepQuality`: `9`
- `highFatigue`: `15`
- `highStress`: `16`
- `lowMood`: `11`
- `coldWeather`: `10`
- `lowHydration`: `12`
- `lowPhysicalActivity`: `6`
- `skippedMedication`: `8`
- `highStiffness`: `10`
- `cognitiveFog`: `8`
- `sensorySensitivity`: `7`
- `digestiveIssues`: `6`
- `headache`: `5`
- `anxiety`: `7`
- `depression`: `7`

Ativacao das features:

- `sleepUnder5h`: `sleepHours < 5`
- `poorSleepQuality`: `sleepQuality <= 4`
- `highFatigue`: `fatigueLevel >= 7`
- `highStress`: `stressLevel >= 7`
- `lowMood`: `mood <= 4`
- `coldWeather`: texto de frio em `weatherFeeling` ou `bodyTemperatureFeelings`
- `lowHydration`: `hydration < 1.5`
- `lowPhysicalActivity`: `physicalActivity < 20`
- `skippedMedication`: `medicationTaken === false`
- `highStiffness`: `stiffness >= 7`
- `cognitiveFog`: flag booleana
- `sensorySensitivity`: luz ou ruido sensivel
- `digestiveIssues`: flag booleana
- `headache`: flag booleana
- `anxiety`: flag booleana
- `depression`: flag booleana

### 8.5. Ajuste do peso personalizado

Para cada feature:

```ts
overallOccurrenceRate = overallCount / totalDays
precursorOccurrenceRate = precursorCount / precursorDays.length

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

adjustedWeight =
  precursorDays.length === 0
    ? defaultWeight
    : defaultWeight *
      (1 + enrichment * 1.8 + max(0, lift - 1) * 0.35) *
      (1 - suppression * 0.2) *
      (0.8 + confidenceFactor * 0.2)

personalizedWeight = clamp(
  adjustedWeight,
  defaultWeight * 0.65,
  defaultWeight * 2.4
)
```

No codigo, `personalizedWeight` fica com 2 casas decimais.

### 8.6. Score atual e baseline

`currentPersonalizedScore`:

```ts
activeWeightSum = soma de todos os personalizedWeight
activeScore = soma dos pesos das features ativas no ultimo dia

currentPersonalizedScore =
  round((activeScore / activeWeightSum) * 100)
```

`baselineScore`:

```ts
media dos dayScores de toda a janela
```

Ambos ficam limitados a `0..100`.

### 8.7. Padroes antes de crise

Padroes simples entram quando:

- `evidenceCount >= 2`
- `precursorOccurrenceRate >= 0.55`
- `personalizedWeight >= defaultWeight * 1.05`

Padroes em pares avaliados hoje:

- `sleepUnder5h + highStress`
- `sleepUnder5h + lowHydration`
- `coldWeather + lowHydration`
- `highStress + lowMood`
- `highFatigue + cognitiveFog`
- `poorSleepQuality + highStress`

Um padrao em par so entra quando:

- `evidenceCount >= 2`
- `occurrenceRateBeforeCrisis >= 0.4`
- `weightedSupport >= 18`

Forca do padrao:

- `HIGH` se taxa `>= 0.6`
- senao `MEDIUM`

O perfil guarda no maximo `8` padroes.

## 9. Resumo curto do estado atual

Hoje o projeto faz isto:

- o formulario salva escalas independentes reais, nao mais campos derivados da dor
- `symptomSignal` ja impacta risco, dashboard e relatorio
- o score de confiabilidade participa do dashboard, da predicao e dos relatorios
- o motor clinico calcula risco por soma ponderada limitada a `120`
- o dashboard trabalha por agregacao diaria em janelas de `7`, `30` ou `90` dias
- o relatorio usa o maior risco do dia entre `rule_engine` e `ai_prediction`
- o perfil personalizado recalcula pesos com base na repeticao de sinais antes de dias de risco alto

Se esse arquivo voltar a divergir do codigo, as fontes de verdade sao os arquivos listados no topo.
