'use client'
import { useState, useEffect, useMemo } from 'react'
import { Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'

const CATEGORIES = ['農薬', '肥料', '労務費', '農機具', '燃料', 'その他'] as const
type Category = typeof CATEGORIES[number]

const CAT_COLOR: Record<Category, string> = {
  農薬: 'bg-red-100 text-red-700',
  肥料: 'bg-green-100 text-green-700',
  労務費: 'bg-blue-100 text-blue-700',
  農機具: 'bg-orange-100 text-orange-700',
  燃料: 'bg-yellow-100 text-yellow-700',
  その他: 'bg-gray-100 text-gray-600',
}

interface Expense {
  id: string
  field_id: string | null
  year: number
  date: string | null
  category: Category
  amount: number
  note: string | null
  fields?: { name: string } | null
}

interface Field { id: string; name: string }

const emptyForm = { field_id: '', date: '', category: '農薬' as Category, amount: '', note: '' }

export default function ExpenseClient({ fields }: { fields: Field[] }) {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/expenses?year=${year}`)
      .then(r => r.json())
      .then(d => { setExpenses(Array.isArray(d) ? d : []); setLoading(false) })
  }, [year])

  const totalAmount = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses])

  const byCategory = useMemo(() =>
    CATEGORIES.map(cat => ({
      cat,
      total: expenses.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    })).filter(x => x.total > 0),
    [expenses]
  )

  async function handleAdd() {
    if (!form.amount || !form.category) return
    setSaving(true)
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        field_id: form.field_id || null,
        year,
        date: form.date || null,
        category: form.category,
        amount: parseInt(form.amount),
        note: form.note || null,
      }),
    })
    if (res.ok) {
      const saved = await res.json()
      // fields joinがないので手動で付ける
      const field = fields.find(f => f.id === form.field_id)
      setExpenses(prev => [{ ...saved, fields: field ? { name: field.name } : null }, ...prev])
      setForm(emptyForm)
      setShowForm(false)
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' })
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div className="space-y-4">
      {/* 年度セレクター */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(y => y - 1)} className="p-2.5 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="text-lg font-bold text-gray-800 w-16 text-center">{year}年</span>
          <button onClick={() => setYear(y => y + 1)} disabled={year >= currentYear} className="p-2.5 rounded-lg hover:bg-gray-100 disabled:opacity-30 transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus size={15} /> 費用を追加
        </button>
      </div>

      {/* 入力フォーム */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">カテゴリ *</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Category }))}
                className="w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">金額（円）*</label>
              <input type="number" min="0" placeholder="例: 5000" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">田んぼ</label>
              <select value={form.field_id} onChange={e => setForm(f => ({ ...f, field_id: e.target.value }))}
                className="w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400">
                <option value="">全体（田んぼ指定なし）</option>
                {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">日付</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">メモ</label>
            <input type="text" placeholder="品名・備考など" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-purple-400" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving || !form.amount}
              className="flex-1 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {saving ? '保存中...' : '追加'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(emptyForm) }}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* サマリー */}
      {expenses.length > 0 && (
        <div className="space-y-3">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">¥{totalAmount.toLocaleString()}</div>
            <div className="text-xs text-purple-500 mt-0.5">{year}年 合計費用</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {byCategory.map(({ cat, total }) => (
              <div key={cat} className="bg-white rounded-xl shadow p-3 text-center">
                <div className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-1 ${CAT_COLOR[cat]}`}>{cat}</div>
                <div className="text-sm font-bold text-gray-800">¥{total.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 一覧 */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">読み込み中...</div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">費用の記録がありません</div>
        ) : (
          <div className="divide-y">
            {expenses.map(e => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${CAT_COLOR[e.category]}`}>
                  {e.category}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">¥{e.amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 truncate">
                    {e.fields?.name ?? '共通'}{e.note ? ` · ${e.note}` : ''}{e.date ? ` · ${e.date}` : ''}
                  </div>
                </div>
                <button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors">
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
