import { createClient } from '@/lib/supabase/server'
import RecordsClient from './RecordsClient'
import { ClipboardList } from 'lucide-react'

export default async function RecordsPage() {
  const supabase = await createClient()

  const { data: rawRecords } = await supabase
    .from('work_records')
    .select('*, fields(name), work_types(name, color)')
    .order('work_date', { ascending: false, nullsFirst: false })

  const records = (rawRecords ?? []) as {
    id: string
    field_id: string
    work_type_id: string
    status: string
    work_date: string | null
    memo: string | null
    fields: { name: string } | null
    work_types: { name: string; color: string } | null
  }[]

  const fieldNames = [...new Set(records.map(r => r.fields?.name).filter(Boolean))] as string[]
  const workTypeNames = [...new Set(records.map(r => r.work_types?.name).filter(Boolean))] as string[]

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList size={22} className="text-green-700" />
        <h1 className="text-xl font-bold text-gray-800">作業記録一覧</h1>
      </div>
      <RecordsClient
        records={records}
        fieldNames={fieldNames}
        workTypeNames={workTypeNames}
      />
    </div>
  )
}
