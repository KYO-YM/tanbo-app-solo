'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { year: number; kg: number }[]
}

export default function HarvestChart({ data }: Props) {
  const maxKg = Math.max(...data.map(d => d.kg))
  const currentYear = new Date().getFullYear()

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="text-sm font-semibold text-gray-700 mb-4">年別収穫量推移</h2>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            tickFormatter={v => `${v}年`}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickFormatter={v => `${v}kg`}
            width={60}
          />
          <Tooltip
            formatter={(value: number) => [`${value.toLocaleString()} kg`, '収穫量']}
            labelFormatter={label => `${label}年`}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="kg" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell
                key={entry.year}
                fill={entry.year === currentYear ? '#eab308' : '#fde68a'}
                stroke={entry.year === currentYear ? '#ca8a04' : '#fbbf24'}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex justify-end gap-4 mt-2 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-yellow-500 inline-block" />今年
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-yellow-200 inline-block" />過去年
        </span>
      </div>
    </div>
  )
}
