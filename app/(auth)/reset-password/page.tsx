'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

function validatePassword(password: string): string {
  if (password.length < 8) return 'パスワードは8文字以上で入力してください'
  if (!/[a-zA-Z]/.test(password)) return 'パスワードに英字を含めてください'
  if (!/[0-9]/.test(password)) return 'パスワードに数字を含めてください'
  return ''
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const validationError = validatePassword(password)
    if (validationError) { setError(validationError); return }
    if (password !== confirm) { setError('パスワードが一致しません'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError('パスワードの更新に失敗しました。もう一度お試しください。')
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => router.push('/map'), 2000)
    }
  }

  if (done) {
    return (
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">パスワードを変更しました</h2>
        <p className="text-sm text-gray-500">まもなくトップページに移動します...</p>
      </div>
    )
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
      <h1 className="text-2xl font-bold text-center mb-2 text-green-700">🌾 みのり</h1>
      <p className="text-center text-sm text-gray-400 mb-6">新しいパスワードを設定</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            新しいパスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            placeholder="8文字以上・英字と数字を含む"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <PasswordStrength password={password} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            パスワード（確認）
          </label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            placeholder="もう一度入力してください"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? '更新中...' : 'パスワードを変更する'}
        </button>
      </form>
    </div>
  )
}

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null
  const hasLength = password.length >= 8
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const score = [hasLength, hasLetter, hasNumber].filter(Boolean).length

  const colors = ['', 'bg-red-400', 'bg-yellow-400', 'bg-green-500']
  const labels = ['', '弱い', 'まあまあ', '強い']

  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= score ? colors[score] : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex gap-3 text-xs text-gray-400">
        <span className={hasLength ? 'text-green-600' : ''}>✓ 8文字以上</span>
        <span className={hasLetter ? 'text-green-600' : ''}>✓ 英字含む</span>
        <span className={hasNumber ? 'text-green-600' : ''}>✓ 数字含む</span>
      </div>
      {score === 3 && <p className="text-xs text-green-600 font-medium">{labels[score]}</p>}
    </div>
  )
}
