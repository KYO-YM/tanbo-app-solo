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
  { href: '/records', label: '進捗管理' },
  { href: '/diary', label: '日誌' },
  { href: '/calendar', label: 'カレンダー' },
  { href: '/harvests', label: '収穫量' },
  { href: '/expenses', label: '費用管理' },
  { href: '/pesticide', label: '農薬・肥料記録' },
  { href: '/work-types', label: '作業マスタ' },
  { href: '/settings', label: '設定' },
  { href: '/guide', label: '使い方' },
]

export default function NavMenu({ userName }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* デスクトップ: ナビリンク */}
      <nav className="hidden sm:flex gap-3 text-sm">
        {links.map(l => (
          <Link key={l.href} href={l.href} className="hover:underline opacity-90 hover:opacity-100">
            {l.label}
          </Link>
        ))}
      </nav>

      {/* モバイル: ハンバーガーボタン */}
      <button
        className="sm:hidden p-2.5 rounded-lg hover:bg-green-600 transition-colors"
        onClick={() => setOpen(v => !v)}
        aria-label="メニューを開く"
      >
        <Menu size={22} />
      </button>

      {/* モバイル: ドロワー（右から） */}
      {open && (
        <>
          <div className="fixed inset-0 z-[1999] bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed top-0 right-0 z-[2000] h-full w-72 bg-white text-gray-800 shadow-2xl flex flex-col">
            {/* ドロワーヘッダー */}
            <div className="flex items-center justify-between px-4 py-4 bg-green-700 text-white">
              <div>
                <div className="font-bold text-base">🌾 みのり</div>
                <div className="text-xs text-green-200 mt-0.5">{userName}</div>
              </div>
              <button onClick={() => setOpen(false)} className="p-2 hover:bg-green-600 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            {/* ナビリンク */}
            <nav className="flex flex-col py-2 flex-1 overflow-y-auto">
              {links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center px-5 py-3.5 hover:bg-gray-50 text-sm font-medium transition-colors border-b border-gray-50"
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
