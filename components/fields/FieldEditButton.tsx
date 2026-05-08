'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X } from 'lucide-react'

interface Props {
  fieldId: string
  fieldName: string
  fieldOwner: string | null
}

export default function FieldEditButton({ fieldId, fieldName, fieldOwner }: Props) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(fieldName)
  const [owner, setOwner] = useState(fieldOwner ?? '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSave() {
    if (!name.trim()) return
    setLoading(true)
    await fetch('/api/fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fieldId, name: name.trim(), owner: owner.trim() || null }),
    })
    setLoading(false)
    setEditing(false)
    router.refresh()
  }

  function handleCancel() {
    setName(fieldName)
    setOwner(fieldOwner ?? '')
    setEditing(false)
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-gray-300 hover:text-blue-500 transition-colors p-1"
        title="編集"
      >
        <Pencil size={14} />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        className="border rounded px-1.5 py-0.5 text-xs w-28 focus:outline-none focus:ring-1 focus:ring-blue-400"
        placeholder="田んぼ名"
        autoFocus
      />
      <input
        value={owner}
        onChange={e => setOwner(e.target.value)}
        className="border rounded px-1.5 py-0.5 text-xs w-24 focus:outline-none focus:ring-1 focus:ring-blue-400"
        placeholder="所有者"
      />
      <button
        onClick={handleSave}
        disabled={loading || !name.trim()}
        className="text-green-600 hover:text-green-700 disabled:opacity-40 p-0.5"
        title="保存"
      >
        <Check size={14} />
      </button>
      <button
        onClick={handleCancel}
        className="text-gray-400 hover:text-gray-600 p-0.5"
        title="キャンセル"
      >
        <X size={14} />
      </button>
    </div>
  )
}
