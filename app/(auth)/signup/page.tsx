'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  function validatePassword(pw: string): string {
    if (pw.length < 8) return 'パスワードは8文字以上で入力してください'
    if (!/[a-zA-Z]/.test(pw)) return 'パスワードに英字（a-z）を含めてください'
    if (!/[0-9]/.test(pw)) return 'パスワードに数字を含めてください'
    return ''
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(error.message === 'User already registered'
        ? 'このメールアドレスは既に登録されています'
        : '登録に失敗しました: ' + error.message)
      setLoading(false)
      return
    }

    // メール確認が不要（セッションが即時発行された）場合はそのままマップへ
    if (data.session) {
      router.push('/map')
      router.refresh()
    } else {
      // メール確認が必要な場合は案内画面を表示
      setDone(true)
    }
  }

  if (done) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center">
        <div className="text-4xl mb-4">📧</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">確認メールを送信しました</h2>
        <p className="text-sm text-gray-500 mb-4">
          <strong>{email}</strong> に確認メールを送りました。<br />
          メール内のリンクをクリックしてからログインしてください。
        </p>
        <Link href="/login" className="text-green-600 hover:underline text-sm font-medium">
          ログイン画面へ →
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
      <h1 className="text-2xl font-bold text-center mb-2 text-green-700">🌾 田んぼ管理</h1>
      <p className="text-center text-sm text-gray-400 mb-6">新規アカウント登録</p>
      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">お名前</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            required
            placeholder="例: 田中 太郎"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">パスワード（8文字以上・英字と数字を含む）</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {password && (
            <div className="mt-1.5 flex gap-3 text-xs">
              <span className={password.length >= 8 ? 'text-green-600' : 'text-gray-300'}>✓ 8文字以上</span>
              <span className={/[a-zA-Z]/.test(password) ? 'text-green-600' : 'text-gray-300'}>✓ 英字含む</span>
              <span className={/[0-9]/.test(password) ? 'text-green-600' : 'text-gray-300'}>✓ 数字含む</span>
            </div>
          )}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? '登録中...' : '無料で始める'}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        アカウントをお持ちの方は{' '}
        <Link href="/login" className="text-green-600 hover:underline font-medium">ログイン</Link>
      </p>
    </div>
  )
}
