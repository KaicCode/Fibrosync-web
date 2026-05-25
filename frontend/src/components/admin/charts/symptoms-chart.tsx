import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type SymptomPattern = {
  symptom: string
  frequency: number
  avgIntensity: number
}

type SymptomsChartProps = {
  data: SymptomPattern[]
}

export function SymptomsPatternsChart({ data }: SymptomsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
        <XAxis dataKey="symptom" fontSize={12} />
        <YAxis yAxisId="left" fontSize={12} />
        <YAxis yAxisId="right" orientation="right" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px',
          }}
        />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="frequency"
          stroke="#3b82f6"
          name="Frequência"
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="avgIntensity"
          stroke="#f59e0b"
          name="Intensidade Média"
          dot={{ fill: '#f59e0b', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
