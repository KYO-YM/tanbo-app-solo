'use client'
import { useState } from 'react'
import { User, Check, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  currentName: string
}

export default function ProfileSettings({ currentName }: Props) {
  const [name, setName] = useState(currentName)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', (await supabase.auth.getUser()).data.user!.id)
    if (err) {
      setError('保存に失敗しました')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-4">
      <div className="flex items-center gap-2">
        <User size={18} className="text-green-600" />
        <h2 className="font-semibold text-gray-800">プロフィール</h2>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-gray-600 font-medium">表示名</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="名前を入力"
            maxLength={20}
          />
          <button
            onClick={handleSave}
            disabled={saving || !name.trim() || name === currentName}
            className="flex items-center gap-1.5 px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
            {saved ? '保存済み' : '保存'}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <p className="text-xs text-gray-400">ヘッダーに表示される名前です（最大20文字）</p>
      </div>
    </div>
  )
}
