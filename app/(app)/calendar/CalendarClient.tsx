'use client'
import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { RiceEvent } from '@/lib/utils/rice'

const STATUS_LABEL: Record<string, string> = {
  pending: '未着手',
  in_progress: '進行中',
  done: '完了',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
}
const DOT_COLOR: Record<string, string> = {
  pending: 'bg-gray-400',
  in_progress: 'bg-yellow-400',
  done: 'bg-green-500',
}

interface WorkEntry {
  id: string
  work_date: string
  status: string
  fields: { name: string } | null
  work_types: { name: string; color: string } | null
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarClient({
  records,
  riceEvents,
}: {
  records: WorkEntry[]
  riceEvents: RiceEvent[]
}) {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showRice, setShowRice] = useState(true)

  const daysInMonth = getDaysInMonth(year, month)
  const firstDow = getFirstDayOfWeek(year, month)

  const byDate: Record<string, WorkEntry[]> = {}
  for (const r of records) {
    if (!byDate[r.work_date]) byDate[r.work_date] = []
    byDate[r.work_date].push(r)
  }

  const riceByDate: Record<string, RiceEvent[]> = {}
  for (const e of riceEvents) {
    if (!riceByDate[e.date]) riceByDate[e.date] = []
    riceByDate[e.date].push(e)
  }

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
    setSelectedDate(null)
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
    setSelectedDate(null)
  }

  const selectedRecords = selectedDate ? (byDate[selectedDate] ?? []) : []
  const selectedRice = selectedDate ? (riceByDate[selectedDate] ?? []) : []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-white rounded-xl shadow px-4 py-3">
        <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-semibold text-gray-800 text-lg">{year}年 {month + 1}月</h2>
        <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 表示切替 */}
      <div className="flex gap-2 text-xs">
        <button
          onClick={() => setShowRice(v => !v)}
          className={`px-3 py-1.5 rounded-full font-medium transition-colors border ${showRice ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-400'}`}
        >
          🌾 水稲スケジュール {showRice ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="grid grid-cols-7 border-b">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
            <div
              key={d}
              className={`text-center text-xs font-medium py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-500'}`}
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[60px] border-b border-r border-gray-50" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayRecords = byDate[dateStr] ?? []
            const dayRice = showRice ? (riceByDate[dateStr] ?? []) : []
            const isToday = dateStr === today.toISOString().slice(0, 10)
            const isSelected = dateStr === selectedDate
            const col = (firstDow + i) % 7

            return (
              <div
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`min-h-[60px] border-b border-r border-gray-50 p-1.5 cursor-pointer transition-colors
                  ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'} active:bg-green-50`}
              >
                <div className={`text-xs font-medium w-7 h-7 flex items-center justify-center rounded-full mb-0.5
                  ${isToday ? 'bg-green-600 text-white' : col === 0 ? 'text-red-500' : col === 6 ? 'text-blue-500' : 'text-gray-700'}`}>
                  {day}
                </div>
                <div className="flex flex-wrap gap-0.5">
                  {dayRecords.slice(0, 2).map(r => (
                    <span key={r.id} className={`w-2 h-2 rounded-full ${DOT_COLOR[r.status] ?? 'bg-gray-300'}`} />
                  ))}
                  {dayRecords.length > 2 && <span className="text-gray-400 text-[9px] leading-none">+{dayRecords.length - 2}</span>}
                  {dayRice.slice(0, 2).map((e, idx) => (
                    <span key={idx} className="text-[10px] leading-none">{e.emoji}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {selectedDate && (selectedRecords.length > 0 || selectedRice.length > 0) && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">{selectedDate}</h3>

          {selectedRice.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-green-700">🌾 水稲スケジュール</p>
              {selectedRice.map((e, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm bg-green-50 rounded-lg px-3 py-2">
                  <span>{e.emoji}</span>
                  <span className="font-medium text-gray-800">{e.fieldName}</span>
                  <span className="text-gray-500">{e.label}</span>
                  <span className="ml-auto text-xs text-green-600">{e.variety}</span>
                </div>
              ))}
            </div>
          )}

          {selectedRecords.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-600">作業記録 ({selectedRecords.length}件)</p>
              {selectedRecords.map(r => (
                <div key={r.id} className="flex items-center gap-3 text-sm">
                  {r.work_types && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: r.work_types.color }} />}
                  <span className="font-medium text-gray-800">{r.fields?.name ?? '-'}</span>
                  <span className="text-gray-500">{r.work_types?.name ?? '-'}</span>
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[r.status] ?? ''}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-4 text-xs text-gray-500 justify-center flex-wrap">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />完了</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />進行中</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />未着手</span>
        <span className="flex items-center gap-1">🌾 水稲イベント</span>
      </div>
    </div>
  )
}
