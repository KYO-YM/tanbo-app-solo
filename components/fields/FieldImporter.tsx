'use client'
import { useState, useRef } from 'react'
import { parseFudeGeoJSON, calcAreaHa, type FudeFeature } from '@/lib/geojson'
import { Upload, CheckSquare, Square } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FieldImporter() {
  const [features, setFeatures] = useState<FudeFeature[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [defaultOwner, setDefaultOwner] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setDone(false)
    setError('')
    try {
      const text = await file.text()
      const parsed = parseFudeGeoJSON(text)
      setFeatures(parsed)
      setSelected(new Set(parsed.map((_, i) => i)))
    } catch {
      setError('GeoJSONファイルの読み込みに失敗しました。農水省からダウンロードしたファイルか確認してください。')
    }
    e.target.value = ''
  }

  async function handleImport() {
    setLoading(true)
    const targets = features.filter((_, i) => selected.has(i))
    const payload = targets.map(f => ({
      name: String(f.properties['筆ポリゴンID'] ?? `田んぼ_${Date.now()}`),
      area_ha: calcAreaHa(f.geometry),
      geometry: f.geometry,
      fude_id: String(f.properties['筆ポリゴンID'] ?? ''),
      owner: defaultOwner.trim() || null,
    }))
    await fetch('/api/fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setLoading(false)
    setFeatures([])
    setSelected(new Set())
    setDone(true)
    router.refresh()
  }

  function toggleAll() {
    if (selected.size === features.length) setSelected(new Set())
    else setSelected(new Set(features.map((_, i) => i)))
  }

  function toggle(i: number) {
    const next = new Set(selected)
    next.has(i) ? next.delete(i) : next.add(i)
    setSelected(next)
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">筆ポリゴンデータ取込</h2>
        <a
          href="https://open.fude.maff.go.jp/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-500 hover:underline"
        >
          データをダウンロード →
        </a>
      </div>

      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-400 hover:text-green-600 w-full justify-center transition-colors"
      >
        <Upload size={16} />
        GeoJSONファイルを選択（農水省 筆ポリゴン）
      </button>
      <input ref={fileRef} type="file" accept=".json,.geojson" onChange={handleFile} className="hidden" />

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {done && <p className="text-green-600 text-sm font-medium">✅ 取込が完了しました</p>}

      {features.length > 0 && (
        <>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">所有者（一括設定・任意）</label>
            <input
              type="text"
              value={defaultOwner}
              onChange={e => setDefaultOwner(e.target.value)}
              placeholder="例: 田中農場"
              className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">{features.length} 件の区画が見つかりました</p>
            <button onClick={toggleAll} className="text-xs text-green-600 hover:underline flex items-center gap-1">
              {selected.size === features.length
                ? <><Square size={12} /> 全解除</>
                : <><CheckSquare size={12} /> 全選択</>}
            </button>
          </div>
          <div className="max-h-52 overflow-y-auto border rounded-lg divide-y text-sm">
            {features.map((f, i) => (
              <label key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  className="accent-green-600"
                />
                <span className="text-gray-700 flex-1">{String(f.properties['筆ポリゴンID'] ?? `区画 ${i + 1}`)}</span>
                {f.properties['面積'] != null && (
                  <span className="text-gray-400">{Number(f.properties['面積']).toLocaleString()} m²</span>
                )}
              </label>
            ))}
          </div>
          <button
            onClick={handleImport}
            disabled={selected.size === 0 || loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? '取込中...' : `選択した ${selected.size} 件を取込む`}
          </button>
        </>
      )}
    </div>
  )
}
