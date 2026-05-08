'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, Pencil, Check, X } from 'lucide-react'

interface DiaryEntry {
  id: string
  date: string
  weather: string | null
  content: string
  created_at: string
}

const WEATHERS = [
  { value: '晴れ', emoji: '☀️' },
  { value: '曇り', emoji: '☁️' },
  { value: '雨', emoji: '🌧️' },
  { value: '雪', emoji: '❄️' },
  { value: '曇り時々晴れ', emoji: '⛅' },
  { value: '雨のち晴れ', emoji: '🌤️' },
]

export default function DiaryClient() {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [year, setYear] = useState(currentYear)
  const [month, setMonth] = useState(currentMonth)
  const [entries, setEntries] = useState<DiaryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    date: now.toISOString().slice(0, 10),
    weather: '',
    content: '',
  })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/work-diary?year=${year}&month=${month}`)
      .then(r => r.json())
      .then(d => { setEntries(Array.isArray(d) ? d : []); setLoading(false) })
  }, [year, month])

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    const isLatest = year === currentYear && month === currentMonth
    if (isLatest) return
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }
  const isLatest = year === currentYear && month === currentMonth

  async function handleAdd() {
    if (!form.content.trim() || !form.date) return
    setSaving(true)
    const res = await fetch('/api/work-diary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: form.date,
        weather: form.weather || null,
        content: form.content.trim(),
      }),
    })
    if (res.ok) {
      const saved = await res.json()
      setEntries(prev => [saved, ...prev].sort((a, b) => b.date.localeCompare(a.date)))
      setForm({ date: now.toISOString().slice(0, 10), weather: '', content: '' })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleUpdate(id: string) {
    if (!editContent.trim()) return
    const res = await fetch('/api/work-diary', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, content: editContent.trim() }),
    })
    if (res.ok) {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, content: editContent.trim() } : e))
      setEditId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('この日誌を削除しますか？')) return
    await fetch(`/api/work-diary?id=${id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* 月ナビゲーション */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-lg font-bold text-gray-800 w-24 text-center">
          {year}年{month}月
        </span>
        <button onClick={nextMonth} disabled={isLatest}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronRight size={18} />
        </button>
        <span className="ml-2 text-xs text-gray-400">{entries.length}件</span>
        <button onClick={() => setShowForm(v => !v)}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors">
          <Plus size={15} /> 日誌を書く
        </button>
      </div>

      {/* 入力フォーム */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3 border border-amber-100">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">日付 *</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">天気</label>
              <div className="flex flex-wrap gap-1">
                {WEATHERS.map(w => (
                  <button key={w.value} onClick={() => setForm(f => ({ ...f, weather: f.weather === w.value ? '' : w.value }))}
                    className={`px-2 py-1 rounded-lg text-xs border transition-colors ${form.weather === w.value ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                    title={w.value}>
                    {w.emoji} {w.value}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">今日の作業・気づき *</label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="例: 北の田んぼでいもち病の初発を確認。早急に薬剤散布を検討。水の色が少し濁っていたので排水溝を確認した。"
              rows={4}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !form.content.trim()}
              className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {saving ? '保存中...' : '記録する'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 日誌一覧 */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-4xl mb-3">📓</div>
          <div className="text-sm">{year}年{month}月の日誌がありません</div>
          <div className="text-xs mt-1">「日誌を書く」から記録してみましょう</div>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(entry => {
            const d = new Date(entry.date)
            const weekdays = ['日', '月', '火', '水', '木', '金', '土']
            const wd = weekdays[d.getDay()]
            const weatherObj = WEATHERS.find(w => w.value === entry.weather)
            const isEditing = editId === entry.id

            return (
              <div key={entry.id} className="bg-white rounded-xl shadow p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-800 leading-none">{d.getDate()}</div>
                      <div className={`text-xs font-medium ${d.getDay() === 0 ? 'text-red-500' : d.getDay() === 6 ? 'text-blue-500' : 'text-gray-400'}`}>
                        {wd}
                      </div>
                    </div>
                    {weatherObj && (
                      <span className="text-xl" title={weatherObj.value}>{weatherObj.emoji}</span>
                    )}
                    {entry.weather && !weatherObj && (
                      <span className="text-xs text-gray-500">{entry.weather}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <button onClick={() => { setEditId(entry.id); setEditContent(entry.content) }}
                        className="p-1.5 text-gray-300 hover:text-blue-500 transition-colors">
                        <Pencil size={14} />
                      </button>
                    )}
                    {isEditing && (
                      <>
                        <button onClick={() => handleUpdate(entry.id)}
                          className="p-1.5 text-green-500 hover:text-green-700 transition-colors">
                          <Check size={15} />
                        </button>
                        <button onClick={() => setEditId(null)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors">
                          <X size={15} />
                        </button>
                      </>
                    )}
                    {!isEditing && (
                      <button onClick={() => handleDelete(entry.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
