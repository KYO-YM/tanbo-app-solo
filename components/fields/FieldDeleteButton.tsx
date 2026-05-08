'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface Props {
  fieldId: string
  fieldName: string
}

export default function FieldDeleteButton({ fieldId, fieldName }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDelete() {
    if (!confirm(`「${fieldName}」を削除しますか？\n作業記録も全て削除されます。`)) return
    setLoading(true)
    await fetch('/api/fields', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fieldId }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50 p-1"
      title="削除"
    >
      <Trash2 size={14} />
    </button>
  )
}
