'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Droplets, X } from 'lucide-react'

interface Props {
  fieldId: string
  nextWaterCheck: string | null
}

const PRESETS = [
  { label: '1時間', hours: 1 },
  { label: '2時間', hours: 2 },
  { label: '3時間', hours: 3 },
  { label: '4時間', hours: 4 },
  { label: '5時間', hours: 5 },
  { label: '6時間', hours: 6 },
  { label: '7時間', hours: 7 },
  { label: '8時間', hours: 8 },
  { label: '12時間', hours: 12 },
  { label: '24時間', hours: 24 },
]

function hoursUntil(isoStr: string | null): number | null {
  if (!isoStr) return null
  return (new Date(isoStr).getTime() - Date.now()) / 3600000
}

function badgeStyle(hours: number | null): { cls: string; label: string } {
  if (hours === null) return { cls: 'bg-gray-100 text-gray-500', label: '未設定' }
  if (hours < 0) {
    const h = Math.abs(hours)
    return { cls: 'bg-red-100 text-red-600', label: h < 1 ? '超過' : `${Math.floor(h)}時間超過` }
  }
  if (hours < 2) return { cls: 'bg-orange-100 text-orange-600', label: `あと${Math.round(hours * 60)}分` }
  if (hours < 6) return { cls: 'bg-yellow-100 text-yellow-700', label: `あと${Math.round(hours)}時間` }
  return { cls: 'bg-blue-50 text-blue-600', label: `あと${Math.round(hours)}時間` }
}

// リアルタイム更新バッジ（1分ごとに再計算）
export function WaterCheckBadge({ nextWaterCheck }: { nextWaterCheck: string | null }) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])
  const hours = hoursUntil(nextWaterCheck)
  const { cls, label } = badgeStyle(hours)
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${cls}`}>
      <Droplets size={10} />
      {label}
    </span>
  )
}

export default function WaterCheckSetter({ fieldId, nextWaterCheck }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dropPos, setDropPos] = useState<{ top: number; left: number } | null>(null)
  const [, setTick] = useState(0)
  const btnRef = useRef<HTMLButtonElement>(null)
  const router = useRouter()

  // 1分ごとにカウントダウンを再計算
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  const hours = hoursUntil(nextWaterCheck)
  const { cls, label } = badgeStyle(hours)

  function handleToggle() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setDropPos({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(v => !v)
  }

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    window.addEventListener('scroll', close, true)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  async function setCheck(h: number) {
    setLoading(true)
    const dt = new Date(Date.now() + h * 3600000).toISOString()
    await fetch('/api/fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fieldId, next_water_check: dt }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  async function clearCheck() {
    setLoading(true)
    await fetch('/api/fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: fieldId, next_water_check: null }),
    })
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  const dropdown = open && dropPos ? createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />
      <div
        className="fixed z-[9999] bg-white rounded-xl shadow-xl border p-3 w-56"
        style={{ top: dropPos.top, left: dropPos.left }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-600">次回チェックまで</span>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X size={13} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1 mb-2">
          {PRESETS.map(p => (
            <button
              key={p.hours}
              onClick={() => setCheck(p.hours)}
              className="text-xs px-1 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-colors text-center"
            >
              {p.label}
            </button>
          ))}
        </div>
        {nextWaterCheck && (
          <button
            onClick={clearCheck}
            className="w-full text-xs px-2 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
          >
            クリア
          </button>
        )}
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
        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition-opacity hover:opacity-80 disabled:opacity-50 ${cls}`}
        title="次回水管理チェック時刻を設定"
      >
        <Droplets size={10} />
        {label}
      </button>
      {dropdown}
    </div>
  )
}
