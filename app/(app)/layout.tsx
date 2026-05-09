import Link from 'next/link'
import { UserCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'
import NavMenu from './NavMenu'
import InstallGuide from '@/components/InstallGuide'
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  const userName = profile?.name ?? user.email ?? ''

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0" style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}>
        {/* ロゴ */}
        <Link href="/map" className="font-bold text-lg">🌾 みのり</Link>
        {/* デスクトップ: ナビリンク */}
        <div className="hidden sm:flex items-center gap-3">
          <NavMenu userName={userName} />
          {/* メニューとユーザー情報の区切り線 */}
          <div className="h-5 w-px bg-green-500 opacity-60" />
          {/* ユーザー情報 */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-green-800/60 border border-green-500/40 px-2.5 py-1 rounded-full">
              <UserCircle size={13} className="opacity-80" />
              <span className="text-xs">{userName}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
        {/* モバイル: ハンバーガー + ログアウト */}
        <div className="flex sm:hidden items-center gap-1">
          <LogoutButton />
          <NavMenu userName={userName} />
        </div>
      </header>
      <main className="flex-1 overflow-auto">{children}</main>
      <InstallGuide />
    </div>
  )
}
