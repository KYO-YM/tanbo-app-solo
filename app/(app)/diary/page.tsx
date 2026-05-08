import DiaryClient from './DiaryClient'

export default function DiaryPage() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">📓</span>
        <div>
          <h1 className="text-xl font-bold text-gray-800">作業日誌</h1>
          <p className="text-xs text-gray-400 mt-0.5">日々の農作業を記録しておきましょう</p>
        </div>
      </div>
      <DiaryClient />
    </div>
  )
}
