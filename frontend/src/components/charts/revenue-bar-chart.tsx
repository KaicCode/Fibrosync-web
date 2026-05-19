import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis } from 'recharts'

type RevenueBarChartProps = {
  data: Array<{ label: string; value: number }>
}

const palette = ['#DCCBFF', '#D0BCFF', '#C5ADFF', '#BA9EFF', '#AF8FFF', '#A480FF', '#7B4DFF']

export function RevenueBarChart({ data }: RevenueBarChartProps) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 18, left: -24, right: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#8A8498', fontSize: 12 }}
          />
          <YAxis hide />
          <Bar dataKey="value" radius={[999, 999, 999, 999]} barSize={18}>
            {data.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={palette[index] ?? '#7B4DFF'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
