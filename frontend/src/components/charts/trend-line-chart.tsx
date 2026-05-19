import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TrendPoint } from '@/services/mock-data'

type TrendLineChartProps = {
  data: TrendPoint[]
  dataKey?: 'value' | 'comparison'
  secondaryKey?: 'comparison'
  height?: number
  color?: string
  showGrid?: boolean
}

export function TrendLineChart({
  data,
  dataKey = 'value',
  secondaryKey,
  height = 220,
  color = '#7B4DFF',
  showGrid = true,
}: TrendLineChartProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: -18, right: 6, top: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="fibrosync-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.2} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showGrid ? (
            <CartesianGrid stroke="rgba(123,77,255,0.08)" strokeDasharray="3 3" vertical={false} />
          ) : null}
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8A8498', fontSize: 12 }}
          />
          <YAxis hide domain={['dataMin - 0.8', 'dataMax + 0.8']} />
          <Tooltip
            cursor={false}
            contentStyle={{
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 16px 36px rgba(123,77,255,0.14)',
              background: 'rgba(255,255,255,0.95)',
            }}
          />
          {secondaryKey ? (
            <Line
              type="monotone"
              dataKey={secondaryKey}
              stroke="rgba(123,77,255,0.16)"
              strokeWidth={2.2}
              dot={false}
              activeDot={false}
            />
          ) : null}
          <Area
            type="monotone"
            dataKey={dataKey}
            fill="url(#fibrosync-area)"
            stroke="transparent"
            activeDot={false}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3.2}
            dot={{ r: 0, strokeWidth: 0 }}
            activeDot={{
              r: 5,
              fill: color,
              stroke: '#fff',
              strokeWidth: 3,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
