import { createClient } from '@/lib/supabase/server'
import FieldImporter from '@/components/fields/FieldImporter'
import FieldDeleteButton from '@/components/fields/FieldDeleteButton'
import FieldEditButton from '@/components/fields/FieldEditButton'
import FieldsCsvExport from '@/components/fields/FieldsCsvExport'
import WaterCheckSetter from '@/components/fields/WaterCheckSetter'
import RiceScheduleSetter from '@/components/fields/RiceScheduleSetter'
import Link from 'next/link'
import { MapPin } from 'lucide-react'
import type { Field } from '@/lib/supabase/types'
import { calcAreaM2, formatArea } from '@/lib/utils/geo'

export default async function FieldsPage() {
  const supabase = await createClient()
  const { data: fieldsData } = await supabase
    .from('fields')
    .select('*')
    .order('name')

  const fields = (fieldsData ?? []) as Field[]

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">田んぼ一覧</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{fields.length} 枚</span>
          <FieldsCsvExport fields={fields} />
        </div>
      </div>

      <FieldImporter />

      {fields.length === 0 && (
        <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow">
          <MapPin size={32} className="mx-auto mb-2 opacity-30" />
          <p>田んぼが登録されていません</p>
          <p className="text-xs mt-1">上の「筆ポリゴンデータ取込」からデータを読み込んでください</p>
        </div>
      )}

      {/* モバイル: カードリスト */}
      <div className="sm:hidden space-y-3">
        {fields.map(f => (
          <div key={f.id} className="bg-white rounded-xl shadow p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-800 text-base">{f.name}</div>
                {f.owner && <div className="text-xs text-gray-500 mt-0.5">{f.owner}</div>}
                <div className="text-xs text-gray-400 mt-0.5">{formatArea(calcAreaM2(f.geometry.coordinates))}</div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <FieldEditButton fieldId={f.id} fieldName={f.name} fieldOwner={f.owner} />
                <FieldDeleteButton fieldId={f.id} fieldName={f.name} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <WaterCheckSetter fieldId={f.id} nextWaterCheck={f.next_water_check} />
              <RiceScheduleSetter fieldId={f.id} transplantDate={f.transplant_date} variety={f.variety} />
            </div>
            <Link
              href={`/fields/${f.id}`}
              className="block text-center text-xs text-green-600 font-medium py-1.5 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              作業記録を見る →
            </Link>
          </div>
        ))}
      </div>

      {/* デスクトップ: テーブル */}
      <div className="hidden sm:block bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">田んぼ名</th>
              <th className="text-left px-4 py-3">所有者</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">面積</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">次回水管理</th>
              <th className="text-left px-4 py-3 hidden xl:table-cell">作付け</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {fields.map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                <td className="px-4 py-3 text-gray-500">{f.owner ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell text-xs">
                  {formatArea(calcAreaM2(f.geometry.coordinates))}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <WaterCheckSetter fieldId={f.id} nextWaterCheck={f.next_water_check} />
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  <RiceScheduleSetter fieldId={f.id} transplantDate={f.transplant_date} variety={f.variety} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <FieldEditButton fieldId={f.id} fieldName={f.name} fieldOwner={f.owner} />
                    <Link href={`/fields/${f.id}`} className="text-green-600 hover:underline text-xs font-medium px-1">
                      詳細
                    </Link>
                    <FieldDeleteButton fieldId={f.id} fieldName={f.name} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
