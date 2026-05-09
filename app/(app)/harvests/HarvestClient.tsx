'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Trash2, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Harvest } from '@/lib/supabase/types'

interface FieldWithArea {
  id: string
  name: string
  areaM2: number
  areaLabel: string
  target_kg_per_10a: number | null
}

interface Props {
  fields: FieldWithArea[]
  initialHarvests: Harvest[]
}

export default function HarvestClient({ fields, initialHarvests }: Props) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [harvests, setHarvests] = useState<Harvest[]>(initialHarvests)
  const [edits, setEdits] = useState<Record<string, { amount_kg: string; note: string }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [unitPrice, setUnitPrice] = useState<string>('') // 円/kg
  const [totalExpenses, setTotalExpenses] = useState<number | null>(null)
  const router = useRouter()

  // 単価をlocalStorageに保存
  useEffect(() => {
    const saved = localStorage.getItem('rice_unit_price')
    if (saved) setUnitPrice(saved)
  }, [])
  useEffect(() => {
    if (unitPrice) localStorage.setItem('rice_unit_price', unitPrice)
  }, [unitPrice])

  // 年度変更時に費用合計を取得
  useEffect(() => {
    fetch(`/api/expenses?year=${year}`)
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTotalExpenses(data.reduce((s: number, e: { amount: number }) => s + e.amount, 0))
        }
      })
      .catch(() => setTotalExpenses(null))
  }, [year])

  const yearHarvests = useMemo(() => harvests.filter(h => h.year === year), [harvests, year])

  function getHarvest(fieldId: string) { return yearHarvests.find(h => h.field_id === fieldId) }

  function getEdit(fieldId: string): { amount_kg: string; note: string } {
    if (edits[fieldId]) return edits[fieldId]
    const h = getHarvest(fieldId)
    return { amount_kg: h?.amount_kg?.toString() ?? '', note: h?.note ?? '' }
  }

  function setEdit(fieldId: string, key: 'amount_kg' | 'note', val: string) {
    setEdits(prev => ({ ...prev, [fieldId]: { ...getEdit(fieldId), [key]: val } }))
  }

  async function save(fieldId: string) {
    const edit = getEdit(fieldId)
    setSaving(prev => ({ ...prev, [fieldId]: true }))
    const res = await fetch('/api/harvests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_id: fieldId, year, amount_kg: edit.amount_kg ? parseFloat(edit.amount_kg) : null, note: edit.note || null }),
    })
    if (res.ok) {
      const saved: Harvest = await res.json()
      setHarvests(prev => [...prev.filter(h => !(h.field_id === fieldId && h.year === year)), saved])
      setEdits(prev => { const n = { ...prev }; delete n[fieldId]; return n })
    }
    setSaving(prev => ({ ...prev, [fieldId]: false }))
  }

  async function remove(fieldId: string) {
    const h = getHarvest(fieldId)
    if (!h) return
    setDeleting(prev => ({ ...prev, [fieldId]: true }))
    await fetch(`/api/harvests?id=${h.id}`, { method: 'DELETE' })
    setHarvests(prev => prev.filter(x => x.id !== h.id))
    setEdits(prev => { const n = { ...prev }; delete n[fieldId]; return n })
    setDeleting(prev => ({ ...prev, [fieldId]: false }))
  }

  const totalKg = yearHarvests.reduce((s, h) => s + (h.amount_kg ?? 0), 0)
  const totalBales = Math.floor(totalKg / 60)
  const totalArea = fields.reduce((s, f) => s + f.areaM2, 0)
  const yieldPer10a = totalArea > 0 && totalKg > 0 ? Math.round((totalKg / totalArea) * 1000) : null
  const revenue = unitPrice && totalKg > 0 ? Math.round(totalKg * parseFloat(unitPrice)) : null
  const profit = revenue !== null && totalExpenses !== null ? revenue - totalExpenses : null

  function isDirty(fieldId: string) {
    const h = getHarvest(fieldId)
    const e = edits[fieldId]
    if (!e) return false
    return e.amount_kg !== (h?.amount_kg?.toString() ?? '') || e.note !== (h?.note ?? '')
  }

  return (
    <div className="space-y-4">
      {/* 年度セレクター */}
      <div className="flex items-center gap-3">
        <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <span className="text-lg font-bold text-gray-800 w-16 text-center">{year}年</span>
        <button onClick={() => setYear(y => y + 1)} disabled={year >= currentYear} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 disabled:opacity-30 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 概算単価入力 */}
      <div className="bg-white rounded-xl shadow px-4 py-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
        <span className="text-sm text-gray-600 flex-shrink-0">概算単価（円/kg）</span>
        <input
          type="number" min="0" placeholder="例: 280"
          value={unitPrice}
          onChange={e => setUnitPrice(e.target.value)}
          className="w-full sm:w-32 border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        {unitPrice && <span className="text-xs text-gray-400">収益 = 収穫量 × 単価 で計算</span>}
      </div>

      {/* サマリー */}
      {totalKg > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-yellow-700">{totalKg.toFixed(0)}<span className="text-xs ml-1">kg</span></div>
            <div className="text-xs text-yellow-600 mt-0.5">合計収穫量</div>
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-amber-700">{totalBales}<span className="text-xs ml-1">俵</span></div>
            <div className="text-xs text-amber-600 mt-0.5">60kg換算</div>
          </div>
          {revenue !== null && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-center">
              <div className="text-xl font-bold text-blue-700">¥{revenue.toLocaleString()}</div>
              <div className="text-xs text-blue-500 mt-0.5">概算収益</div>
            </div>
          )}
          {profit !== null && (
            <div className={`border rounded-xl p-3 text-center ${profit >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
              <div className={`text-xl font-bold flex items-center justify-center gap-1 ${profit >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                {profit >= 0 ? <TrendingUp size={16} /> : profit === 0 ? <Minus size={16} /> : <TrendingDown size={16} />}
                ¥{Math.abs(profit).toLocaleString()}
              </div>
              <div className={`text-xs mt-0.5 ${profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {profit >= 0 ? '概算利益' : '概算赤字'}（費用¥{totalExpenses?.toLocaleString()}）
              </div>
            </div>
          )}
          {yieldPer10a && !revenue && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
              <div className="text-xl font-bold text-green-700">{yieldPer10a}<span className="text-xs ml-1">kg/10a</span></div>
              <div className="text-xs text-green-600 mt-0.5">10アール当たり</div>
            </div>
          )}
        </div>
      )}

      {/* モバイル: カード入力 */}
      <div className="sm:hidden space-y-3">
        {fields.map(f => {
          const edit = getEdit(f.id)
          const dirty = isDirty(f.id)
          const hasData = !!getHarvest(f.id)
          const bales = edit.amount_kg ? Math.floor(parseFloat(edit.amount_kg) / 60) : null
          const yieldVal = f.areaM2 > 0 && edit.amount_kg ? Math.round((parseFloat(edit.amount_kg) / f.areaM2) * 1000) : null

          return (
            <div key={f.id} className="bg-white rounded-xl shadow p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{f.name}</div>
                  <div className="text-xs text-gray-400">
                    {f.areaLabel}
                    {f.target_kg_per_10a && (
                      <span className="ml-2 text-amber-600">
                        目標: {f.target_kg_per_10a}kg/10a
                        {f.areaM2 > 0 && ` (計${Math.round(f.target_kg_per_10a * f.areaM2 / 1000)}kg)`}
                      </span>
                    )}
                  </div>
                </div>
                {hasData && !dirty && (
                  <button onClick={() => remove(f.id)} disabled={deleting[f.id]} className="p-2 text-gray-300 hover:text-red-500 disabled:opacity-50">
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">収穫量 (kg)</label>
                <input
                  type="number" min="0" step="0.1" placeholder="例: 480"
                  value={edit.amount_kg}
                  onChange={e => setEdit(f.id, 'amount_kg', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                {bales !== null && (
                  <div className="text-xs text-gray-400 mt-1">
                    ≈ {bales}俵{yieldVal ? ` · ${yieldVal} kg/10a` : ''}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">メモ（品種・備考）</label>
                <input
                  type="text" placeholder="コシヒカリなど"
                  value={edit.note}
                  onChange={e => setEdit(f.id, 'note', e.target.value)}
                  className="w-full border rounded-lg px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>
              {dirty && (
                <button
                  onClick={() => save(f.id)} disabled={saving[f.id]}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  <Save size={14} /> 保存
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* デスクトップ: テーブル */}
      <div className="hidden sm:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">田んぼ名</th>
              <th className="text-left px-4 py-3">面積</th>
              <th className="text-left px-4 py-3">収穫量 (kg)</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">メモ</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fields.map(f => {
              const edit = getEdit(f.id)
              const dirty = isDirty(f.id)
              const hasData = !!getHarvest(f.id)
              const bales = edit.amount_kg ? Math.floor(parseFloat(edit.amount_kg) / 60) : null
              const yieldVal = f.areaM2 > 0 && edit.amount_kg ? Math.round((parseFloat(edit.amount_kg) / f.areaM2) * 1000) : null

              return (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    <div>{f.areaLabel}</div>
                    {f.target_kg_per_10a && (
                      <div className="text-amber-600">目標{f.target_kg_per_10a}kg/10a</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-0.5">
                      <input
                        type="number" min="0" step="0.1" placeholder="例: 480"
                        value={edit.amount_kg}
                        onChange={e => setEdit(f.id, 'amount_kg', e.target.value)}
                        className="w-28 border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                      />
                      {bales !== null && <div className="text-xs text-gray-400">≈ {bales}俵{yieldVal ? ` / ${yieldVal} kg/10a` : ''}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <input
                      type="text" placeholder="品種・備考など"
                      value={edit.note}
                      onChange={e => setEdit(f.id, 'note', e.target.value)}
                      className="w-full border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {dirty && (
                        <button onClick={() => save(f.id)} disabled={saving[f.id]}
                          className="flex items-center gap-1 px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 transition-colors">
                          <Save size={12} /> 保存
                        </button>
                      )}
                      {hasData && !dirty && (
                        <button onClick={() => remove(f.id)} disabled={deleting[f.id]}
                          className="p-1.5 text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors" title="削除">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {fields.length === 0 && <div className="text-center py-12 text-gray-400 text-sm">田んぼが登録されていません</div>}
      </div>
    </div>
  )
}
