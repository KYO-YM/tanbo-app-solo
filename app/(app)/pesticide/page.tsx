import { createClient } from '@/lib/supabase/server'
import PesticideClient from './PesticideClient'

export default async function PesticidePage() {
  const supabase = await createClient()
  const { data: fields } = await supabase
    .from('fields')
    .select('id, name')
    .order('name')

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">🧪</span>
        <div>
          <h1 className="text-xl font-bold text-gray-800">農薬・肥料記録</h1>
          <p className="text-xs text-gray-400 mt-0.5">農薬取締法に基づく使用記録</p>
        </div>
      </div>
      <PesticideClient fields={fields ?? []} />
    </div>
  )
}
