import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import WorkTypeFilter from './WorkTypeFilter'
import MapClient from '@/components/map/MapClient'

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ work_type?: string }>
}) {
  const { work_type } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [fieldsRes, workRecordsRes, workTypesRes] = await Promise.all([
    supabase.from('fields').select('*').eq('user_id', user!.id),
    supabase.from('work_records').select('*').eq('user_id', user!.id),
    supabase.from('work_types').select('*').eq('user_id', user!.id).order('sort_order'),
  ])

  const fields = fieldsRes.data ?? []
  const workRecords = workRecordsRes.data ?? []
  const workTypes = workTypesRes.data ?? []

  return (
    <div className="relative w-full h-[calc(100vh-56px)]">
      <Suspense>
        <WorkTypeFilter workTypes={workTypes} selectedId={work_type ?? null} />
      </Suspense>
      <MapClient
        fields={fields}
        workRecords={workRecords}
        workTypes={workTypes}
        selectedWorkTypeId={work_type ?? null}
      />
      {fields.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl shadow p-6 text-center pointer-events-auto">
            <p className="text-gray-500 mb-2">田んぼがまだ登録されていません</p>
            <a href="/fields" className="text-green-600 text-sm font-medium hover:underline">
              田んぼ一覧 → 筆ポリゴンデータを取込む
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
