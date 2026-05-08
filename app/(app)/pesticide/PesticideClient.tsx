'use client'
import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight, Download } from 'lucide-react'

interface Record {
  id: string
  field_id: string | null
  date: string
  type: '農薬' | '肥料'
  name: string
  amount: number | null
  unit: string | null
  purpose: string | null
  note: string | null
  fields?: { name: string } | null
}

interface Field { id: string; name: string }

const UNITS_PESTICIDE = ['L', 'mL', 'kg', 'g', '袋', '本']
const UNITS_FERTILIZER = ['kg', 'g', 'L', '袋', 't']

const emptyForm = {
  type: '農薬' as '農薬' | '肥料',
  field_id: '',
  date: new Date().toISOString().slice(0, 10),
  name: '',
  amount: '',
  unit: 'L',
  purpose: '',
  note: '',
}

export default function PesticideClient({ fields }: { fields: Field[] }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [records, setRecords] = useState<Record[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterType, setFilterType] = useState<'全て' | '農薬' | '肥料'>('全て')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/pesticide-records?year=${year}`)
      .then(r => r.json())
      .then(d => { setRecords(Array.isArray(d) ? d : []); setLoading(false) })
  }, [year])

  const filtered = useMemo(() =>
    filterType === '全て' ? records : records.filter(r => r.type === filterType),
    [records, filterType]
  )

  function setField(key: keyof typeof form, val: string) {
    setForm(f => {
      const next = { ...f, [key]: val }
      if (key === 'type') next.unit = val === '農薬' ? 'L' : 'kg'
      return next
    })
  }

  async function handleAdd() {
    if (!form.name || !form.date) return
    setSaving(true)
    const res = await fetch('/api/pesticide-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_id: form.field_id || null,
        date: form.date,
        type: form.type,
        name: form.name,
        amount: form.amount ? parseFloat(form.amount) : null,
        unit: form.unit || null,
        purpose: form.purpose || null,
        note: form.note || null,
      }),
    })
    if (res.ok) {
      const saved = await res.json()
      const field = fields.find(f => f.id === form.field_id)
      setRecords(prev => [{ ...saved, fields: field ? { name: field.name } : null }, ...prev])
      setForm({ ...emptyForm, type: form.type, unit: form.unit })
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('この記録を削除しますか？')) return
    await fetch(`/api/pesticide-records?id=${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
  }

  // CSV出力（農薬帳として提出できる形式）
  function downloadCSV() {
    const header = '使用日,種別,製品名,使用圃場,使用量,単位,使用目的,備考'
    const rows = filtered.map(r => [
      r.date,
      r.type,
      r.name,
      r.fields?.name ?? '全体',
      r.amount ?? '',
      r.unit ?? '',
      r.purpose ?? '',
      r.note ?? '',
    ].map(v => `"${v}"`).join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `農薬肥料記録_${year}年.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const units = form.type === '農薬' ? UNITS_PESTICIDE : UNITS_FERTILIZER

  return (
    <div className="space-y-4">
      {/* ヘッダー操作 */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-lg font-bold text-gray-800 w-16 text-center">{year}年</span>
        <button onClick={() => setYear(y => y + 1)} disabled={year >= currentYear} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
          <ChevronRight size={18} />
        </button>

        {/* タイプフィルター */}
        <div className="flex gap-1 ml-2">
          {(['全て', '農薬', '肥料'] as const).map(t => (
            <button key={t} onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterType === t ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="ml-auto flex gap-2">
          {filtered.length > 0 && (
            <button onClick={downloadCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              <Download size={14} /> CSV
            </button>
          )}
          <button onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            <Plus size={15} /> 記録を追加
          </button>
        </div>
      </div>

      {/* 入力フォーム */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3 border border-green-100">
          <div className="grid grid-cols-2 gap-3">
            {/* 種別 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">種別 *</label>
              <div className="flex gap-2">
                {(['農薬', '肥料'] as const).map(t => (
                  <button key={t} onClick={() => setField('type', t)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${form.type === t ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                    {t === '農薬' ? '🧪 農薬' : '🌿 肥料'}
                  </button>
                ))}
              </div>
            </div>
            {/* 日付 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">使用日 *</label>
              <input type="date" value={form.date} onChange={e => setField('date', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            {/* 製品名 */}
            <div className="col-span-2">
              <label className="text-xs text-gray-500 mb-1 block">製品名 *</label>
              <input type="text" placeholder="例: ジェット水和剤、NK化成" value={form.name}
                onChange={e => setField('name', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            {/* 使用量 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">使用量</label>
              <div className="flex gap-1">
                <input type="number" min="0" step="0.01" placeholder="例: 1.5" value={form.amount}
                  onChange={e => setField('amount', e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                <select value={form.unit} onChange={e => setField('unit', e.target.value)}
                  className="w-20 border rounded-lg px-2 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                  {units.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            {/* 使用圃場 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">使用圃場</label>
              <select value={form.field_id} onChange={e => setField('field_id', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                <option value="">全圃場（共通）</option>
                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            {/* 使用目的 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">使用目的・対象病害虫</label>
              <input type="text" placeholder="例: いもち病防除" value={form.purpose}
                onChange={e => setField('purpose', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            {/* 備考 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">備考</label>
              <input type="text" placeholder="希釈倍率など" value={form.note}
                onChange={e => setField('note', e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !form.name || !form.date}
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
              {saving ? '保存中...' : '記録を追加'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm) }}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 件数サマリー */}
      {!loading && records.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-red-700">{records.filter(r => r.type === '農薬').length}</div>
            <div className="text-xs text-red-500 mt-0.5">🧪 農薬使用回数</div>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-green-700">{records.filter(r => r.type === '肥料').length}</div>
            <div className="text-xs text-green-500 mt-0.5">🌿 肥料使用回数</div>
          </div>
        </div>
      )}

      {/* 記録一覧 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            {year}年の記録がありません
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map(r => (
              <div key={r.id} className="flex items-start gap-3 px-4 py-3">
                <span className="text-lg mt-0.5 flex-shrink-0">{r.type === '農薬' ? '🧪' : '🌿'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{r.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.type === '農薬' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {r.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 space-x-2">
                    <span>{r.date}</span>
                    {r.fields?.name && <span>· {r.fields.name}</span>}
                    {r.amount && <span>· {r.amount}{r.unit}</span>}
                    {r.purpose && <span>· {r.purpose}</span>}
                    {r.note && <span>· {r.note}</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(r.id)}
                  className="p-1.5 text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors mt-0.5">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
