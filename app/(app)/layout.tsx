import Link from 'next/link'
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
        <div className="hidden sm:flex items-center gap-4">
          <NavMenu userName={userName} />
          <span className="text-sm opacity-80">{userName}</span>
          <LogoutButton />
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
