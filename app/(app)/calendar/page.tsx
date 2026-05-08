import { createClient } from '@/lib/supabase/server'
import CalendarClient from './CalendarClient'
import { CalendarDays } from 'lucide-react'
import { calcRiceSchedule } from '@/lib/utils/rice'
import type { Field } from '@/lib/supabase/types'

export default async function CalendarPage() {
  const supabase = await createClient()

  const [{ data: rawRecords }, { data: fieldsData }] = await Promise.all([
    supabase
      .from('work_records')
      .select('id, work_date, status, fields(name), work_types(name, color)')
      .not('work_date', 'is', null)
      .order('work_date', { ascending: false }),
    supabase.from('fields').select('id, name, transplant_date, variety'),
  ])

  const records = (rawRecords ?? []) as unknown as {
    id: string
    work_date: string
    status: string
    fields: { name: string } | null
    work_types: { name: string; color: string } | null
  }[]

  const fields = (fieldsData ?? []) as Pick<Field, 'id' | 'name' | 'transplant_date' | 'variety'>[]

  const riceEvents = fields.flatMap(f => {
    if (!f.transplant_date || !f.variety) return []
    return calcRiceSchedule(f.id, f.name, f.transplant_date, f.variety)
  })

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <CalendarDays size={22} className="text-green-700" />
        <h1 className="text-xl font-bold text-gray-800">カレンダー</h1>
      </div>
      <CalendarClient records={records} riceEvents={riceEvents} />
    </div>
  )
}
