import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// ソロ版ではユーザー管理ページは不要。/map にリダイレクト
export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  redirect('/map')
}
