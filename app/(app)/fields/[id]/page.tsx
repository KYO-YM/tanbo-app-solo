import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import WorkRecordForm from '@/components/fields/WorkRecordForm'
import FieldEditor from './FieldEditor'
import FieldPhotoUpload from '@/components/fields/FieldPhotoUpload'
import { ChevronLeft, Sprout, Wheat, Camera } from 'lucide-react'
import type { Field, WorkType, WorkRecord, Profile, Harvest } from '@/lib/supabase/types'
import { calcAreaM2, formatArea } from '@/lib/utils/geo'
import { calcRiceSchedule, VARIETIES } from '@/lib/utils/rice'

export default async function FieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [fieldRes, workTypesRes, recordsRes, userRes, harvestsRes] = await Promise.all([
    supabase.from('fields').select('*').eq('id', id).single(),
    supabase.from('work_types').select('*').order('sort_order'),
    supabase.from('work_records').select('*').eq('field_id', id),
    supabase.auth.getUser(),
    supabase.from('harvests').select('*').eq('field_id', id).order('year', { ascending: false }),
  ])

  const field = fieldRes.data as Field | null
  if (!field) notFound()

  const workTypes = (workTypesRes.data ?? []) as WorkType[]
  const records = (recordsRes.data ?? []) as WorkRecord[]
  const harvests = (harvestsRes.data ?? []) as Harvest[]

  const { data: profileData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userRes.data.user?.id ?? '')
    .single()

  const profile = profileData as Pick<Profile, 'role'> | null
  const isAdmin = profile?.role === 'admin'

  // 面積計算
  const areaM2 = calcAreaM2(field.geometry.coordinates)
  const areaLabel = formatArea(areaM2)

  // 水稲スケジュール
  const riceEvents = field.transplant_date && field.variety
    ? calcRiceSchedule(field.id, field.name, field.transplant_date, field.variety)
    : []
  const varietyName = VARIETIES.find(v => v.id === field.variety)?.name ?? field.variety
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Link href="/fields" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> 田んぼ一覧に戻る
      </Link>

      {/* 基本情報 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-gray-800">{field.name}</h1>
            <div className="text-sm text-gray-500 space-y-0.5">
              {field.owner && <p>所有者: {field.owner}</p>}
              <p>面積: {areaLabel}</p>
              {field.fude_id && <p className="text-xs text-gray-400">筆ID: {field.fude_id}</p>}
            </div>
            {field.notes && <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">{field.notes}</p>}
          </div>
          {isAdmin && <FieldEditor field={field} />}
        </div>
      </div>

      {/* 水稲スケジュール */}
      {riceEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sprout size={16} className="text-green-600" />
            <h2 className="font-semibold text-gray-700">水稲スケジュール</h2>
            <span className="text-xs text-gray-400 ml-auto">{varietyName} · {field.transplant_date?.replace(/-/g, '/').slice(5)} 移植</span>
          </div>
          <div className="space-y-1.5">
            {riceEvents.map((e, i) => {
              const isPast = e.date < today
              const isToday = e.date === today
              return (
                <div key={i} className={`flex items-center gap-3 text-sm rounded-lg px-3 py-2
                  ${isToday ? 'bg-green-50 border border-green-200' : isPast ? 'opacity-40' : 'bg-gray-50'}`}>
                  <span>{e.emoji}</span>
                  <span className={`font-medium ${isToday ? 'text-green-700' : 'text-gray-700'}`}>{e.label}</span>
                  <span className="ml-auto text-xs text-gray-500">{e.date.replace(/-/g, '/').slice(5)}</span>
                  {isToday && <span className="text-xs text-green-600 font-bold">今日</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 収穫量履歴 */}
      {harvests.length > 0 && (
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <Wheat size={16} className="text-yellow-600" />
            <h2 className="font-semibold text-gray-700">収穫量履歴</h2>
            <Link href="/harvests" className="text-xs text-green-600 hover:underline ml-auto">編集 →</Link>
          </div>
          <div className="space-y-2">
            {harvests.map(h => {
              const bales = h.amount_kg ? Math.floor(h.amount_kg / 60) : null
              const yieldPer10a = areaM2 > 0 && h.amount_kg ? Math.round((h.amount_kg / areaM2) * 1000) : null
              return (
                <div key={h.id} className="flex items-center gap-3 text-sm bg-gray-50 rounded-lg px-3 py-2">
                  <span className="font-bold text-gray-700">{h.year}年</span>
                  {h.amount_kg ? (
                    <>
                      <span className="text-gray-800">{h.amount_kg.toFixed(0)} kg</span>
                      {bales !== null && <span className="text-gray-500">({bales}俵)</span>}
                      {yieldPer10a && <span className="text-xs text-gray-400">{yieldPer10a} kg/10a</span>}
                    </>
                  ) : <span className="text-gray-400">記録なし</span>}
                  {h.note && <span className="ml-auto text-xs text-gray-400">{h.note}</span>}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 写真 */}
      <div className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center gap-2 mb-3">
          <Camera size={16} className="text-blue-500" />
          <h2 className="font-semibold text-gray-700">写真</h2>
        </div>
        <FieldPhotoUpload fieldId={id} />
      </div>

      {/* 作業記録 */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">作業進捗</h2>
        <Link href="/work-types" className="text-xs text-green-600 hover:underline">
          作業種別を管理 →
        </Link>
      </div>
      <WorkRecordForm fieldId={id} workTypes={workTypes} existingRecords={records} />
    </div>
  )
}
