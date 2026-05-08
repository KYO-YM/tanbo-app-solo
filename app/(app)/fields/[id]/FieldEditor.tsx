'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Field } from '@/lib/supabase/types'
import { Pencil, Trash2, X, Check } from 'lucide-react'

interface Props { field: Field }

export default function FieldEditor({ field }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(field.name)
  const [owner, setOwner] = useState(field.owner ?? '')
  const [notes, setNotes] = useState(field.notes ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave() {
    setLoading(true)
    await fetch('/api/fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: field.id, name, owner: owner || null, notes: notes || null }),
    })
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirm(`「${field.name}」を削除しますか？作業記録も全て削除されます。`)) return
    await fetch('/api/fields', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: field.id }),
    })
    router.push('/fields')
  }

  if (!editing) {
    return (
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={() => setEditing(true)} className="text-gray-400 hover:text-green-600">
          <Pencil size={16} />
        </button>
        <button onClick={handleDelete} className="text-gray-400 hover:text-red-500">
          <Trash2 size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">田んぼ情報を編集</h3>
          <button onClick={() => setEditing(false)} className="text-gray-400"><X size={18} /></button>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">田んぼ名</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">所有者</label>
          <input value={owner} onChange={e => setOwner(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm" placeholder="例: 田中農場" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">備考</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm resize-none" />
        </div>
        <button
          onClick={handleSave}
          disabled={loading || !name.trim()}
          className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <Check size={14} /> {loading ? '保存中...' : '保存する'}
        </button>
      </div>
    </div>
  )
}
