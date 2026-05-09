'use client'
import { useState, useMemo } from 'react'
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react'

interface Field {
  id: string
  name: string
  area_ha?: number | null
}

interface Props {
  fields: Field[]
}

export default function DilutionCalculator({ fields }: Props) {
  const [open, setOpen] = useState(false)

  // 入力値
  const [dilution, setDilution] = useState('1000')       // 希釈倍率
  const [liquidPer10a, setLiquidPer10a] = useState('100') // 10aあたり散布量(L)
  const [areaMode, setAreaMode] = useState<'manual' | 'field'>('manual')
  const [manualArea, setManualArea] = useState('')         // 手入力面積(a)
  const [selectedFieldId, setSelectedFieldId] = useState('')

  // 選択田んぼの面積(a)
  const fieldArea = useMemo(() => {
    const f = fields.find(f => f.id === selectedFieldId)
    if (!f?.area_ha) return null
    return f.area_ha * 100 // ha → a
  }, [fields, selectedFieldId])

  const area = areaMode === 'field' ? fieldArea : (parseFloat(manualArea) || null)

  // 計算
  const result = useMemo(() => {
    const d = parseFloat(dilution)
    const lp = parseFloat(liquidPer10a)
    const a = area
    if (!d || d <= 0 || !lp || lp <= 0 || !a || a <= 0) return null

    const area10a = a / 10          // a → 10a(反)
    const totalLiquid = area10a * lp // 総散布液量(L)
    const pesticideL = totalLiquid / d      // 農薬量(L)
    const pesticideMl = pesticideL * 1000   // 農薬量(mL)
    const water = totalLiquid - pesticideL  // 水量(L)

    return { totalLiquid, pesticideL, pesticideMl, water, area10a }
  }, [dilution, liquidPer10a, area])

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      {/* ヘッダー（開閉） */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calculator size={16} className="text-green-600" />
          <span className="text-sm font-semibold text-gray-700">農薬稀釈計算ツール</span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
            {/* 希釈倍率 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">希釈倍率</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={dilution}
                  onChange={e => setDilution(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="例: 1000"
                />
                <span className="text-xs text-gray-400 flex-shrink-0">倍</span>
              </div>
              {/* よく使う倍率 */}
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[500, 1000, 2000, 3000].map(d => (
                  <button
                    key={d}
                    onClick={() => setDilution(String(d))}
                    className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${dilution === String(d) ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {d.toLocaleString()}倍
                  </button>
                ))}
              </div>
            </div>

            {/* 10aあたり散布量 */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">10aあたり散布量</label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="1"
                  value={liquidPer10a}
                  onChange={e => setLiquidPer10a(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="例: 100"
                />
                <span className="text-xs text-gray-400 flex-shrink-0">L/10a</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {[50, 100, 150, 200].map(l => (
                  <button
                    key={l}
                    onClick={() => setLiquidPer10a(String(l))}
                    className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${liquidPer10a === String(l) ? 'bg-green-600 text-white border-green-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                  >
                    {l}L
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 面積入力 */}
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">散布面積</label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setAreaMode('manual')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${areaMode === 'manual' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                手入力
              </button>
              <button
                onClick={() => setAreaMode('field')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${areaMode === 'field' ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
              >
                田んぼから選択
              </button>
            </div>
            {areaMode === 'manual' ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={manualArea}
                  onChange={e => setManualArea(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="例: 10"
                />
                <span className="text-xs text-gray-400">a（アール）</span>
              </div>
            ) : (
              <div>
                <select
                  value={selectedFieldId}
                  onChange={e => setSelectedFieldId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-400"
                >
                  <option value="">田んぼを選択</option>
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name}{f.area_ha ? ` (${(f.area_ha * 100).toFixed(1)}a)` : ' (面積未登録)'}
                    </option>
                  ))}
                </select>
                {selectedFieldId && !fieldArea && (
                  <p className="text-xs text-orange-500 mt-1">この田んぼの面積が登録されていません。田んぼ一覧から登録してください。</p>
                )}
              </div>
            )}
          </div>

          {/* 計算結果 */}
          {result ? (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wide">計算結果</h3>
              <div className="grid grid-cols-2 gap-3">
                <ResultCard
                  label="農薬量"
                  primary={result.pesticideMl >= 1000
                    ? `${result.pesticideL.toFixed(2)} L`
                    : `${Math.round(result.pesticideMl)} mL`}
                  secondary={result.pesticideMl >= 1000
                    ? `(${Math.round(result.pesticideMl)} mL)`
                    : `(${result.pesticideL.toFixed(3)} L)`}
                  color="red"
                />
                <ResultCard
                  label="水の量"
                  primary={`${result.water.toFixed(1)} L`}
                  secondary={`(${Math.round(result.water / 10) * 10}L 目安)`}
                  color="blue"
                />
              </div>
              <div className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2">
                <span className="text-gray-500">総散布液量</span>
                <span className="font-bold text-gray-800">{result.totalLiquid.toFixed(1)} L</span>
              </div>
              <div className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-2">
                <span className="text-gray-500">散布面積</span>
                <span className="font-bold text-gray-800">{area?.toFixed(1)} a（{result.area10a.toFixed(2)} 反）</span>
              </div>
              <p className="text-[10px] text-gray-400">
                ※ 計算式: 農薬量 = (面積 ÷ 10a × 散布量) ÷ 希釈倍率
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-gray-400">
              希釈倍率・散布量・面積を入力すると計算結果が表示されます
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResultCard({
  label, primary, secondary, color
}: {
  label: string
  primary: string
  secondary: string
  color: 'red' | 'blue'
}) {
  const colors = {
    red: 'bg-red-50 border-red-100 text-red-700',
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
  }
  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <div className="text-xs opacity-70 mb-1">{label}</div>
      <div className="text-lg font-bold">{primary}</div>
      <div className="text-[11px] opacity-60">{secondary}</div>
    </div>
  )
}
