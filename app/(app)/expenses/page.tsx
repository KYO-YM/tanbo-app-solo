import { createClient } from '@/lib/supabase/server'
import { Wallet } from 'lucide-react'
import type { Field } from '@/lib/supabase/types'
import ExpenseClient from './ExpenseClient'

export default async function ExpensesPage() {
  const supabase = await createClient()
  const { data: fieldsData } = await supabase.from('fields').select('id, name').order('name')
  const fields = (fieldsData ?? []) as Pick<Field, 'id' | 'name'>[]

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Wallet size={22} className="text-purple-600" />
        <h1 className="text-xl font-bold text-gray-800">費用管理</h1>
      </div>
      <ExpenseClient fields={fields} />
    </div>
  )
}
