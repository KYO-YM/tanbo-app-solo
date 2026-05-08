import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Supabaseからのリダイレクトを受け取り、セッションを確立するルート
// パスワードリセット・メール確認などで使用
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // パスワードリセットの場合は reset-password ページへ
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/reset-password`)
      }
      // メール確認の場合はマップページへ
      return NextResponse.redirect(`${origin}${next === '/' ? '/map' : next}`)
    }
  }

  // エラーの場合はログインページへ
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
