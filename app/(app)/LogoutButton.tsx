'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-1.5 bg-green-800 hover:bg-green-900 px-3 py-2 rounded-lg text-xs transition-colors"
      title="ログアウト"
    >
      <LogOut size={14} />
      <span className="hidden sm:inline">ログアウト</span>
    </button>
  )
}
