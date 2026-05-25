import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type CorrelationData = {
  symptom1: string
  symptom2: string
  correlation: number
  frequency: number
}

type SymptomCorrelationProps = {
  data: CorrelationData[]
}

export function SymptomCorrelationChart({ data }: SymptomCorrelationProps) {
  // Transform data for visualization
  const chartData = data.map((item) => ({
    x: item.correlation * 100,
    y: item.frequency,
    pair: `${item.symptom1} ↔ ${item.symptom2}`,
  }))

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
          <XAxis
            dataKey="x"
            type="number"
            name="Correlação (%)"
            fontSize={12}
            domain={[0, 100]}
          />
          <YAxis dataKey="y" type="number" name="Frequência" fontSize={12} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '8px',
            }}
            formatter={(value) => {
              if (typeof value === 'number') {
                return value.toFixed(1)
              }
              return value
            }}
            labelFormatter={(value) => `Correlação: ${value}%`}
          />
          <Scatter name="Correlação de Sintomas" data={chartData} fill="#8b5cf6" />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-foreground">Pares Correlacionados:</p>
        <div className="grid gap-2">
          {data.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {item.symptom1} ↔ {item.symptom2}
              </span>
              <span className="font-semibold">{(item.correlation * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
