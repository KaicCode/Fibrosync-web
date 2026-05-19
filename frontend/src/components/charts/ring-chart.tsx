import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

type RingChartProps = {
  data: Array<{ label: string; value: number; color: string }>
}

export function RingChart({ data }: RingChartProps) {
  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              borderRadius: 18,
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 16px 36px rgba(123,77,255,0.14)',
              background: 'rgba(255,255,255,0.95)',
            }}
          />
          <Pie
            data={data}
            dataKey="value"
            innerRadius={54}
            outerRadius={82}
            paddingAngle={4}
            stroke="transparent"
          >
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
