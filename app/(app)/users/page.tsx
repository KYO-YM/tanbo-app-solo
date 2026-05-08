import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/lib/supabase/types'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: meData } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const me = meData as Pick<Profile, 'role'> | null
  if (me?.role !== 'admin') redirect('/map')

  const { data: profilesData } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')

  const profiles = (profilesData ?? []) as Profile[]

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">ユーザー管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          新しいメンバーを追加するには、
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline mx-1"
          >
            Supabase ダッシュボード
          </a>
          → Authentication → Users → 「Invite user」からメール招待してください。
        </p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">名前</th>
              <th className="text-left px-4 py-3">権限</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">登録日</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {profiles.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {p.name}
                  {p.id === user.id && (
                    <span className="ml-2 text-xs text-gray-400">（自分）</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.role === 'admin'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {p.role === 'admin' ? '管理者' : '作業者'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {new Date(p.created_at).toLocaleDateString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {profiles.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">ユーザーがいません</p>
        )}
      </div>
    </div>
  )
}
