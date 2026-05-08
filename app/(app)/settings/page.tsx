import { createClient } from '@/lib/supabase/server'
import { Settings } from 'lucide-react'
import LineSettings from './LineSettings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  let { data: profile } = await supabase
    .from('profiles')
    .select('line_user_id, line_link_code')
    .eq('id', user.id)
    .single()

  // 連携コードが未生成なら生成して保存
  if (profile && !profile.line_link_code) {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase()
    await supabase.from('profiles').update({ line_link_code: code }).eq('id', user.id)
    profile = { ...profile, line_link_code: code }
  }

  const isLineConfigured = !!process.env.LINE_CHANNEL_ACCESS_TOKEN

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={22} className="text-green-700" />
        <h1 className="text-xl font-bold text-gray-800">設定</h1>
      </div>

      <LineSettings
        linkCode={profile?.line_link_code ?? null}
        isConnected={!!profile?.line_user_id}
        isConfigured={isLineConfigured}
      />
    </div>
  )
}
