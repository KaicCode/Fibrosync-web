import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type TrendLineChartPoint = {
  label: string
  value: number | null
  comparison?: number | null
  tooltipLabel?: string
  [key: string]: string | number | boolean | null | undefined
}

type TrendStateMessage = {
  title: string
  description: string
}

type TrendLineChartProps = {
  data: TrendLineChartPoint[]
  dataKey?: 'value' | 'comparison'
  secondaryKey?: 'comparison'
  height?: number
  color?: string
  showGrid?: boolean
  primaryLabel?: string
  secondaryLabel?: string
  showLegend?: boolean
  yDomain?: [number, number]
  yTicks?: number[]
  yTickFormatter?: (value: number) => string
  yAxisWidth?: number
  valueFormatter?: (value: number) => string
  tooltipValueFormatter?: (value: number, dataKey: string) => string
  emptyState?: TrendStateMessage
  singleRecordState?: TrendStateMessage
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function defaultValueFormatter(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  })
}

function resolveTickIndexes(length: number): number[] {
  if (length <= 0) {
    return []
  }

  if (length <= 7) {
    return Array.from({ length }, (_, index) => index)
  }

  const maxTicks = length <= 31 ? 5 : 6
  const indexes = new Set<number>([0, length - 1])
  const step = (length - 1) / (maxTicks - 1)

  for (let index = 1; index < maxTicks - 1; index += 1) {
    indexes.add(Math.round(step * index))
  }

  return [...indexes].sort((left, right) => left - right)
}

export function TrendLineChart({
  data,
  dataKey = 'value',
  secondaryKey,
  height = 220,
  color = '#7B4DFF',
  showGrid = true,
  primaryLabel = 'Valor',
  secondaryLabel = 'Comparacao',
  showLegend = false,
  yDomain,
  yTicks,
  yTickFormatter,
  yAxisWidth = 32,
  valueFormatter = defaultValueFormatter,
  tooltipValueFormatter = (value) => valueFormatter(value),
  emptyState,
  singleRecordState,
}: TrendLineChartProps) {
  const chartData = useMemo(
    () => data.map((point) => ({ ...point, baseline: 0 })),
    [data],
  )

  const primaryValues = useMemo(
    () =>
      chartData.filter((point) => isNumber(point[dataKey])).length,
    [chartData, dataKey],
  )

  const hasRecords = primaryValues > 0
  const hasSingleRecord = primaryValues === 1
  const hasMultipleRecords = primaryValues > 1
  const shouldShowDots = hasSingleRecord || primaryValues <= 8
  const xTicks = useMemo(
    () =>
      resolveTickIndexes(chartData.length)
        .map((index) => chartData[index]?.label)
        .filter((label): label is string => typeof label === 'string'),
    [chartData],
  )

  const stateMessage = !hasRecords ? emptyState : hasSingleRecord ? singleRecordState : null

  return (
    <div className="space-y-4">
      {showLegend && secondaryKey ? (
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            {primaryLabel}
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-violet-300/80" />
            {secondaryLabel}
          </span>
        </div>
      ) : null}

      <div
        className="overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/80"
        style={{ height }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ left: 6, right: 12, top: 14, bottom: 10 }}
          >
            <defs>
              <linearGradient id="fibrosync-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.24} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            {showGrid ? (
              <CartesianGrid
                stroke="rgba(123,77,255,0.14)"
                strokeDasharray="4 4"
                vertical={false}
              />
            ) : null}
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              ticks={xTicks}
              minTickGap={18}
              height={34}
              tick={{ fill: '#7B748A', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              width={yAxisWidth}
              tick={{ fill: '#7B748A', fontSize: 12 }}
              domain={yDomain ?? ['dataMin - 0.8', 'dataMax + 0.8']}
              ticks={yTicks}
              tickFormatter={yTickFormatter}
            />
            <Tooltip
              cursor={{
                stroke: 'rgba(123,77,255,0.16)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
              content={({ active, label, payload }) => {
                if (!active) {
                  return null
                }

                const point = payload?.[0]?.payload as TrendLineChartPoint | undefined
                const visibleItems =
                  payload?.filter(
                    (entry) =>
                      entry.dataKey !== 'baseline' && isNumber(entry.value),
                  ) ?? []

                return (
                  <div className="min-w-[12rem] rounded-[1.15rem] border border-white/90 bg-white/96 px-4 py-3 shadow-[0_18px_38px_rgba(123,77,255,0.18)]">
                    <p className="text-sm font-semibold text-foreground">
                      {point?.tooltipLabel ?? label}
                    </p>
                    {visibleItems.length > 0 ? (
                      <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                        {visibleItems.map((entry) => (
                          <div
                            key={String(entry.dataKey)}
                            className="flex items-center justify-between gap-4"
                          >
                            <span>
                              {entry.dataKey === dataKey
                                ? primaryLabel
                                : secondaryLabel}
                            </span>
                            <span className="font-medium text-foreground">
                              {tooltipValueFormatter(
                                Number(entry.value),
                                String(entry.dataKey),
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Sem registro neste dia.
                      </p>
                    )}
                  </div>
                )
              }}
            />
            {!hasRecords ? (
              <Line
                type="linear"
                dataKey="baseline"
                stroke="rgba(123,77,255,0.38)"
                strokeWidth={2.2}
                strokeDasharray="7 6"
                dot={false}
                activeDot={false}
                isAnimationActive={false}
              />
            ) : null}
            {secondaryKey ? (
              <Line
                type="monotone"
                dataKey={secondaryKey}
                stroke="rgba(123,77,255,0.38)"
                strokeWidth={2.2}
                strokeDasharray="6 6"
                dot={false}
                activeDot={false}
                connectNulls={hasMultipleRecords}
                isAnimationActive={false}
              />
            ) : null}
            {hasMultipleRecords ? (
              <Area
                type="monotone"
                dataKey={dataKey}
                fill="url(#fibrosync-area)"
                stroke="transparent"
                activeDot={false}
                connectNulls
                isAnimationActive={false}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={3.2}
              connectNulls={hasMultipleRecords}
              isAnimationActive={false}
              dot={
                shouldShowDots
                  ? {
                      r: hasSingleRecord ? 6 : 4,
                      fill: color,
                      stroke: '#fff',
                      strokeWidth: 2,
                    }
                  : false
              }
              activeDot={{
                r: 6,
                fill: color,
                stroke: '#fff',
                strokeWidth: 3,
              }}
            >
              {hasSingleRecord ? (
                <LabelList
                  dataKey={dataKey}
                  position="top"
                  offset={12}
                  formatter={(value) =>
                    isNumber(value) ? valueFormatter(value) : ''
                  }
                  fill={color}
                  fontSize={12}
                  fontWeight={700}
                />
              ) : null}
            </Line>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {stateMessage ? (
        <div className="rounded-[1.2rem] bg-violet-50/70 px-4 py-3 text-sm">
          <p className="font-semibold text-violet-950">{stateMessage.title}</p>
          <p className="mt-1 leading-6 text-violet-900/80">
            {stateMessage.description}
          </p>
        </div>
      ) : null}
    </div>
  )
}
