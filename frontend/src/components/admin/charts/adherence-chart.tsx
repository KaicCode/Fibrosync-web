import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

type AdherenceChartProps = {
  totalRecords: number
  completedRecords: number
}

export function AdherenceChart({ totalRecords, completedRecords }: AdherenceChartProps) {
  const adherenceRate = totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0
  const data = [
    { name: 'Completo', value: completedRecords },
    { name: 'Incompleto', value: Math.max(0, totalRecords - completedRecords) },
  ]

  const colors = ['#10b981', '#ef4444']

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 text-center">
        <p className="text-sm text-muted-foreground">Taxa de Adesão</p>
        <p className="text-3xl font-semibold text-foreground">{adherenceRate.toFixed(1)}%</p>
      </div>
    </div>
  )
}
