import { createClient } from '@/lib/supabase/server'
import WorkTypeManager from '@/components/work-types/WorkTypeManager'

export default async function WorkTypesPage() {
  const supabase = await createClient()
  const { data: workTypes } = await supabase
    .from('work_types')
    .select('*')
    .order('sort_order')

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">作業種別管理</h1>
        <p className="text-sm text-gray-500 mt-1">作業の種類を自由に追加・編集・削除できます。各作業に色を設定すると地図上で色分け表示されます。</p>
      </div>
      <WorkTypeManager workTypes={workTypes ?? []} />
    </div>
  )
}
