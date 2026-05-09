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
    <div className="relative w-full h-[calc(100svh-56px)]">
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
          <div className="bg-white rounded-xl shadow-lg p-8 text-center pointer-events-auto max-w-sm mx-4">
            <div className="text-4xl mb-3">🌾</div>
            <h2 className="text-gray-800 font-bold text-lg mb-2">はじめに田んぼを登録しましょう</h2>
            <p className="text-gray-500 text-sm mb-6">農水省の筆ポリゴンデータを取込むと、地図上に田んぼが表示されます</p>
            <div className="flex flex-col gap-3">
              <a
                href="/guide"
                className="block bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-green-800 transition-colors"
              >
                使い方ガイドを見る
              </a>
              <a
                href="/fields"
                className="block border border-green-700 text-green-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-green-50 transition-colors"
              >
                田んぼを登録する
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
