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
      className="flex items-center gap-1.5 border border-green-400/60 hover:bg-green-800 px-3 py-1.5 rounded-lg text-xs transition-colors opacity-80 hover:opacity-100"
      title="ログアウト"
    >
      <LogOut size={14} />
      <span className="hidden sm:inline">ログアウト</span>
    </button>
  )
}
