import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type PredictionData = {
  date: string
  accuracy: number
  predictions: number
}

type PredictionHistoryChartProps = {
  data: PredictionData[]
}

export function PredictionHistoryChart({ data }: PredictionHistoryChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis yAxisId="left" fontSize={12} label={{ value: 'Acurácia (%)', angle: -90, position: 'insideLeft' }} />
        <YAxis yAxisId="right" orientation="right" fontSize={12} label={{ value: 'Previsões', angle: 90, position: 'insideRight' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px',
          }}
          formatter={(value) => {
            if (typeof value === 'number') {
              return value.toFixed(2)
            }
            return value
          }}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="accuracy"
          stroke="#06b6d4"
          name="Acurácia"
          dot={{ fill: '#06b6d4', r: 4 }}
          activeDot={{ r: 6 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="predictions"
          stroke="#6366f1"
          name="Total de Previsões"
          dot={{ fill: '#6366f1', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
