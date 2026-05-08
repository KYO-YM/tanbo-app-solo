'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'

interface Props {
  userName: string
}

const links = [
  { href: '/map', label: '地図' },
  { href: '/dashboard', label: 'ダッシュボード' },
  { href: '/fields', label: '田んぼ一覧' },
  { href: '/records', label: '作業記録' },
  { href: '/diary', label: '作業日誌' },
  { href: '/calendar', label: 'カレンダー' },
  { href: '/harvests', label: '収穫量' },
  { href: '/expenses', label: '費用管理' },
  { href: '/pesticide', label: '農薬・肥料記録' },
  { href: '/work-types', label: '作業種別' },
  { href: '/settings', label: '設定' },
  { href: '/guide', label: '使い方' },
]

export default function NavMenu({ userName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* デスクトップ */}
      <nav className="hidden sm:flex gap-3 text-sm">
        {links.map(l => (
          <Link key={l.href} href={l.href} className="hover:underline opacity-90 hover:opacity-100">
            {l.label}
          </Link>
        ))}
      </nav>

      {/* モバイル: ハンバーガーボタン */}
      <button
        className="sm:hidden p-1 rounded hover:bg-green-600 transition-colors"
        onClick={() => setOpen(v => !v)}
        aria-label="メニューを開く"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* モバイル: ドロワー */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed top-0 left-0 z-50 h-full w-64 bg-green-700 text-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-green-600">
              <span className="font-bold text-lg">🌾 田んぼ管理</span>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-green-600 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="px-3 py-2 text-sm text-green-200">{userName}</div>
            <nav className="flex flex-col px-2 py-2 gap-1 flex-1">
              {links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2.5 rounded-lg hover:bg-green-600 text-sm font-medium transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  )
}
