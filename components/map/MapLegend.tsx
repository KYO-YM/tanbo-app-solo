import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants'

export default function MapLegend() {
  return (
    <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow px-3 py-2 z-[1000] text-xs">
      <p className="font-medium text-gray-600 mb-1">進捗</p>
      {(Object.entries(STATUS_LABELS) as [keyof typeof STATUS_LABELS, string][]).map(([key, label]) => (
        <div key={key} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block w-3 h-3 rounded-sm border border-gray-200"
            style={{ backgroundColor: STATUS_COLORS[key] }}
          />
          <span className="text-gray-700">{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-2 py-0.5">
        <span
          className="inline-block w-3 h-3 rounded-sm border border-gray-200"
          style={{ backgroundColor: STATUS_COLORS.none }}
        />
        <span className="text-gray-400">未登録</span>
      </div>
    </div>
  )
}
