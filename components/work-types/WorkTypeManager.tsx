'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WorkType } from '@/lib/supabase/types'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'

const PRESET_COLORS = [
  '#3b82f6', '#22c55e', '#eab308', '#f97316', '#ef4444',
  '#8b5cf6', '#06b6d4', '#ec4899', '#10b981', '#6b7280',
]

interface Props { workTypes: WorkType[] }

export default function WorkTypeManager({ workTypes }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [adding, setAdding] = useState(false)
  const router = useRouter()

  async function handleAdd() {
    if (!newName.trim()) return
    await fetch('/api/work-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor, sort_order: workTypes.length }),
    })
    setNewName('')
    setNewColor(PRESET_COLORS[0])
    setAdding(false)
    router.refresh()
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return
    await fetch('/api/work-types', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName.trim(), color: editColor }),
    })
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？この作業種別に関連する全ての記録も削除されます。`)) return
    await fetch('/api/work-types', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  const ColorPicker = ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
    <div className="flex gap-1 flex-wrap">
      {PRESET_COLORS.map(c => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className="w-5 h-5 rounded-full border-2 transition-transform hover:scale-110"
          style={{ backgroundColor: c, borderColor: value === c ? '#1f2937' : 'transparent' }}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-2">
      {workTypes.map(wt => (
        <div key={wt.id} className="bg-white rounded-lg shadow px-4 py-3 space-y-2">
          {editingId === wt.id ? (
            <>
              <ColorPicker value={editColor} onChange={setEditColor} />
              <div className="flex items-center gap-2">
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUpdate(wt.id)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                  autoFocus
                />
                <button onClick={() => handleUpdate(wt.id)} className="text-green-600 hover:text-green-700">
                  <Check size={16} />
                </button>
                <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600">
                  <X size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <span className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: wt.color }} />
              <span className="flex-1 font-medium text-gray-800">{wt.name}</span>
              <button
                onClick={() => { setEditingId(wt.id); setEditName(wt.name); setEditColor(wt.color) }}
                className="text-gray-400 hover:text-green-600"
              >
                <Pencil size={15} />
              </button>
              <button onClick={() => handleDelete(wt.id, wt.name)} className="text-gray-400 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      ))}

      {adding ? (
        <div className="bg-white rounded-lg shadow px-4 py-3 space-y-2">
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex items-center gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="作業名を入力..."
              className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
              autoFocus
            />
            <button onClick={handleAdd} className="text-green-600 hover:text-green-700">
              <Check size={16} />
            </button>
            <button onClick={() => setAdding(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium py-1"
        >
          <Plus size={16} /> 作業種別を追加
        </button>
      )}
    </div>
  )
}
