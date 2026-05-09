'use client'
import { useState, useEffect } from 'react'
import { X, Smartphone, Share, PlusSquare } from 'lucide-react'

export default function InstallGuide() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)

  useEffect(() => {
    // すでにPWAとして起動中（standalone）は表示しない
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    if (isStandalone) return

    // 一度閉じたら7日間表示しない
    const dismissed = localStorage.getItem('install_guide_dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 3600 * 1000) return

    const ua = navigator.userAgent
    const ios = /iPad|iPhone|iPod/.test(ua)
    const android = /Android/.test(ua)

    if (ios || android) {
      setIsIOS(ios)
      setIsAndroid(android)
      // 3秒後に表示
      const t = setTimeout(() => setShow(true), 3000)
      return () => clearTimeout(t)
    }
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem('install_guide_dismissed', String(Date.now()))
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[2000] p-4" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="bg-green-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone size={18} />
            <span className="font-semibold text-sm">アプリとして使う</span>
          </div>
          <button onClick={dismiss} className="p-1.5 hover:bg-green-600 rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-4 py-3 space-y-3">
          <p className="text-xs text-gray-500">
            ホーム画面に追加するとアプリのように使えます
          </p>
          {isIOS && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Share size={16} className="text-blue-500 flex-shrink-0" />
                  <span>Safariの下の<strong>「共有」</strong>ボタンをタップ</span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <PlusSquare size={16} className="text-blue-500 flex-shrink-0" />
                  <span><strong>「ホーム画面に追加」</strong>を選ぶ</span>
                </div>
              </div>
            </div>
          )}
          {isAndroid && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-sm text-gray-700">Chromeの右上<strong>「⋮」</strong>をタップ</span>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-sm text-gray-700"><strong>「ホーム画面に追加」</strong>または<strong>「アプリをインストール」</strong>をタップ</span>
              </div>
            </div>
          )}
          <button
            onClick={dismiss}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            今は表示しない
          </button>
        </div>
      </div>
    </div>
  )
}
