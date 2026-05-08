'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WorkRecord, WorkType, WorkStatus } from '@/lib/supabase/types'
import { STATUS_LABELS } from '@/lib/constants'

interface Props {
  fieldId: string
  workTypes: WorkType[]
  existingRecords: WorkRecord[]
}

export default function WorkRecordForm({ fieldId, workTypes, existingRecords }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [memoEditing, setMemoEditing] = useState<string | null>(null)
  const [memoValue, setMemoValue] = useState('')
  const [dateEditing, setDateEditing] = useState<string | null>(null)
  const [dateValue, setDateValue] = useState('')
  const router = useRouter()

  async function updateStatus(workTypeId: string, status: WorkStatus) {
    setLoading(workTypeId)
    const record = existingRecords.find(r => r.work_type_id === workTypeId)
    await fetch('/api/work-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_id: fieldId,
        work_type_id: workTypeId,
        status,
        work_date: record?.work_date ?? null,
        memo: record?.memo ?? null,
      }),
    })
    setLoading(null)
    router.refresh()
  }

  async function saveMemo(workTypeId: string) {
    const record = existingRecords.find(r => r.work_type_id === workTypeId)
    await fetch('/api/work-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_id: fieldId,
        work_type_id: workTypeId,
        status: record?.status ?? 'pending',
        work_date: record?.work_date ?? null,
        memo: memoValue,
      }),
    })
    setMemoEditing(null)
    router.refresh()
  }

  async function saveDate(workTypeId: string) {
    const record = existingRecords.find(r => r.work_type_id === workTypeId)
    await fetch('/api/work-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_id: fieldId,
        work_type_id: workTypeId,
        status: record?.status ?? 'pending',
        work_date: dateValue || null,
        memo: record?.memo ?? null,
      }),
    })
    setDateEditing(null)
    router.refresh()
  }

  if (workTypes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow p-6 text-center text-gray-400 text-sm">
        作業種別がありません。
        <a href="/work-types" className="text-green-600 hover:underline ml-1">作業種別を追加する</a>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
          <tr>
            <th className="text-left px-4 py-3">作業種別</th>
            <th className="text-left px-4 py-3">状態</th>
            <th className="text-left px-4 py-3 hidden md:table-cell">実施日</th>
            <th className="text-left px-4 py-3 hidden sm:table-cell">メモ</th>
            <th className="px-4 py-3 w-28">変更</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {workTypes.map(wt => {
            const record = existingRecords.find(r => r.work_type_id === wt.id)
            const status: WorkStatus = record?.status ?? 'pending'
            const isMemoEditing = memoEditing === wt.id
            const isDateEditing = dateEditing === wt.id

            return (
              <tr key={wt.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: wt.color }} />
                    {wt.name}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    status === 'done'        ? 'bg-green-100 text-green-700' :
                    status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                                               'bg-gray-100 text-gray-600'
                  }`}>
                    {STATUS_LABELS[status]}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                  {isDateEditing ? (
                    <div className="flex gap-1 items-center">
                      <input
                        type="date"
                        value={dateValue}
                        onChange={e => setDateValue(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-0.5 text-xs"
                        autoFocus
                      />
                      <button onClick={() => saveDate(wt.id)} className="text-green-600 text-xs font-medium">保存</button>
                      <button onClick={() => setDateEditing(null)} className="text-gray-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setDateEditing(wt.id); setDateValue(record?.work_date ?? '') }}
                      className="text-left hover:text-green-600 min-w-[6rem]"
                    >
                      {record?.work_date
                        ? new Date(record.work_date).toLocaleDateString('ja-JP')
                        : <span className="text-gray-300">日付を追加...</span>}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell text-gray-500 max-w-xs">
                  {isMemoEditing ? (
                    <div className="flex gap-1">
                      <input
                        value={memoValue}
                        onChange={e => setMemoValue(e.target.value)}
                        className="flex-1 border border-gray-300 rounded px-2 py-0.5 text-xs"
                        autoFocus
                      />
                      <button onClick={() => saveMemo(wt.id)} className="text-green-600 text-xs font-medium">保存</button>
                      <button onClick={() => setMemoEditing(null)} className="text-gray-400 text-xs">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setMemoEditing(wt.id); setMemoValue(record?.memo ?? '') }}
                      className="text-left truncate w-full hover:text-green-600"
                    >
                      {record?.memo || <span className="text-gray-300">メモを追加...</span>}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <select
                    value={status}
                    disabled={loading === wt.id}
                    onChange={e => updateStatus(wt.id, e.target.value as WorkStatus)}
                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white disabled:opacity-50"
                  >
                    {(Object.entries(STATUS_LABELS) as [WorkStatus, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
