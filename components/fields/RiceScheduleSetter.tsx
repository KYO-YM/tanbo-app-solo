'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Sprout, X, Save } from 'lucide-react'
import { VARIETIES, currentPhase } from '@/lib/utils/rice'

interface Props {
  fieldId: string
  transplantDate: string | null
  variety: string | null
}

export default function RiceScheduleSetter({ fieldId, transplantDate, variety }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editDate, setEditDate] = useState(transplantDate ?? '')
  const [editVariety, setEditVariety] = useState(variety ?? '')
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  useEffect(() => {
    setEditDate(transplantDate ?? '')
    setEditVariety(variety ?? '')
  }, [transplantDate, variety])

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => { window.removeEventListener('scroll', close, true); window.removeEventListener('resize', close) }
  }, [open])

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(v => !v)
  }

  async function save() {
    setLoading(true)
    await fetch('/api/fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: fieldId,
        transplant_date: editDate || null,
        variety: editVariety || null,
      }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function clear() {
    setLoading(true)
    await fetch('/api/fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fieldId, transplant_date: null, variety: null }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  // バッジラベル
  let badgeLabel = '作付け未設定'
  let badgeCls = 'bg-gray-100 text-gray-500'
  if (transplantDate && variety) {
    const phase = currentPhase(transplantDate, variety)
    const mm = transplantDate.slice(5, 7).replace(/^0/, '')
    const dd = transplantDate.slice(8, 10).replace(/^0/, '')
    const vName = VARIETIES.find(v => v.id === variety)?.name ?? variety
    badgeLabel = phase ? `${phase}` : `${vName} ${mm}/${dd}移植`
    badgeCls = 'bg-green-50 text-green-700'
  }

  const dropdown = open && dropPos ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[9999] bg-white rounded-xl shadow-xl border p-4 w-64 space-y-3"
        style={{ top: dropPos.top, left: dropPos.left }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-600 flex items-center gap-1">
            <Sprout size={12} /> 作付け設定
          </span>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">品種</label>
            <select
              value={editVariety}
              onChange={e => setEditVariety(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              <option value="">-- 品種を選択 --</option>
              {VARIETIES.map(v => (
                <option key={v.id} value={v.id}>
                  {v.name}（{v.region}）
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">田植え日</label>
            <input
              type="date"
              value={editDate}
              onChange={e => setEditDate(e.target.value)}
              className="w-full border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={loading || !editDate || !editVariety}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
          >
            <Save size={12} /> 保存
          </button>
          {transplantDate && (
            <button
              onClick={clear}
              disabled={loading}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg text-xs transition-colors"
            >
              クリア
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={handleToggle}
        disabled={loading}
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80 disabled:opacity-50 ${badgeCls}`}
        title="作付け・スケジュールを設定"
      >
        <Sprout size={10} />
        {badgeLabel}
      </button>
      {dropdown}
    </div>
  )
}
