import { createClient } from '@/lib/supabase/server'
import { Settings, MessageCircle } from 'lucide-react'
import ProfileSettings from './ProfileSettings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const currentName = profile?.name ?? user.email ?? ''

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={22} className="text-green-700" />
        <h1 className="text-xl font-bold text-gray-800">設定</h1>
      </div>

      <ProfileSettings currentName={currentName} />

      {/* LINE通知（準備中） */}
      <div className="bg-white rounded-xl shadow p-5 opacity-60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-500">LINE通知</h2>
          </div>
          <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">準備中</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">水管理アラートや作業スケジュールをLINEで通知できるようになります</p>
      </div>
    </div>
  )
}
