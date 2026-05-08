'use client'
import { useEffect, useState } from 'react'
import { WifiOff } from 'lucide-react'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    setOffline(!navigator.onLine)
    const on = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  if (!offline) return null
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-800 text-white text-xs text-center py-2.5 flex items-center justify-center gap-2">
      <WifiOff size={12} />
      オフライン中 — 最後に読み込んだデータを表示しています
    </div>
  )
}
