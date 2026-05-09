'use client'
import { useState, useMemo } from 'react'
import { List, X, Search, MapPin } from 'lucide-react'
import type { Field, WorkRecord } from '@/lib/supabase/types'
import { STATUS_COLORS } from '@/lib/constants'

interface Props {
  fields: Field[]
  workRecords: WorkRecord[]
  selectedWorkTypeId: string | null
  onSelect: (field: Field) => void
}

function getStatus(fieldId: string, workRecords: WorkRecord[], selectedWorkTypeId: string | null) {
  if (!selectedWorkTypeId) {
    const records = workRecords.filter(r => r.field_id === fieldId)
    if (records.length === 0) return 'none'
    if (records.some(r => r.status === 'pending')) return 'pending'
    if (records.some(r => r.status === 'in_progress')) return 'in_progress'
    return 'done'
  }
  const record = workRecords.find(r => r.field_id === fieldId && r.work_type_id === selectedWorkTypeId)
  return record?.status ?? 'none'
}

const STATUS_LABEL: Record<string, string> = {
  none: '未登録',
  pending: '未着手',
  in_progress: '進行中',
  done: '完了',
}

export default function FieldSelectorPanel({ fields, workRecords, selectedWorkTypeId, onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() =>
    fields.filter(f => f.name.includes(query) || (f.owner ?? '').includes(query)),
    [fields, query]
  )

  function handleSelect(field: Field) {
    onSelect(field)
    setOpen(false)
    setQuery('')
  }

  return (
    <>
      {/* 開くボタン */}
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-20 right-3 z-[1000] bg-white rounded-xl shadow-lg p-3 flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors border border-gray-200"
        title="田んぼ一覧から選択"
      >
        <List size={18} className="text-green-600" />
        <span className="hidden sm:inline text-xs">一覧から選択</span>
      </button>

      {/* パネル */}
      {open && (
        <>
          {/* 背景オーバーレイ */}
          <div className="fixed inset-0 z-[1001] bg-black/30" onClick={() => { setOpen(false); setQuery('') }} />

          {/* ボトムシート */}
          <div className="fixed bottom-0 left-0 right-0 z-[1002] bg-white rounded-t-2xl shadow-2xl max-h-[75vh] flex flex-col sm:absolute sm:bottom-4 sm:left-auto sm:right-16 sm:w-72 sm:rounded-xl sm:max-h-[70vh]">
            {/* ハンドル（モバイル） */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* ヘッダー */}
            <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-green-600" />
                <span className="font-semibold text-gray-800 text-sm">田んぼを選択</span>
                <span className="text-xs text-gray-400">{fields.length}枚</span>
              </div>
              <button
                onClick={() => { setOpen(false); setQuery('') }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 検索 */}
            <div className="px-4 py-2 border-b flex-shrink-0">
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <Search size={14} className="text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="田んぼ名で検索..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 placeholder-gray-400"
                  autoFocus
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-gray-400 hover:text-gray-600">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* 田んぼリスト */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  「{query}」に一致する田んぼがありません
                </div>
              ) : (
                filtered.map(field => {
                  const status = getStatus(field.id, workRecords, selectedWorkTypeId)
                  const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] ?? STATUS_COLORS.none
                  return (
                    <button
                      key={field.id}
                      onClick={() => handleSelect(field)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-green-50 transition-colors border-b border-gray-50 text-left"
                    >
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{field.name}</div>
                        {field.owner && (
                          <div className="text-xs text-gray-400 truncate">{field.owner}</div>
                        )}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">{STATUS_LABEL[status]}</span>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
