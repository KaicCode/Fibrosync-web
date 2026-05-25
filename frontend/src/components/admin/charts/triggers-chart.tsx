import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type TriggersChartProps = {
  data: Array<{
    name: string
    count: number
  }>
}

export function TriggersBarChart({ data }: TriggersChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '8px',
          }}
          cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
        />
        <Bar dataKey="count" fill="#ec4899" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
