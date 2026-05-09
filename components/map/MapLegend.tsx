import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants'

export default function MapLegend() {
  return (
    <div className="absolute bottom-4 right-3 bg-white/90 backdrop-blur-sm rounded-lg shadow px-2.5 py-2 z-[1000] text-xs">
      <p className="font-medium text-gray-500 mb-1 text-[10px] uppercase tracking-wide">進捗</p>
      {(Object.entries(STATUS_LABELS) as [keyof typeof STATUS_LABELS, string][]).map(([key, label]) => (
        <div key={key} className="flex items-center gap-1.5 py-0.5">
          <span
            className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: STATUS_COLORS[key] }}
          />
          <span className="text-gray-700 text-[11px]">{label}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5 py-0.5">
        <span
          className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
          style={{ backgroundColor: STATUS_COLORS.none }}
        />
        <span className="text-gray-400 text-[11px]">未登録</span>
      </div>
    </div>
  )
}
