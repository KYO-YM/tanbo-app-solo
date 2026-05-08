import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return NextResponse.json({ error: 'LINE not configured' }, { status: 503 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 自分のLINE連携情報を取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('line_user_id')
    .eq('id', user.id)
    .single()

  if (!profile?.line_user_id) {
    return NextResponse.json({ sent: 0, message: 'LINE未連携' })
  }

  // 自分の水管理チェックが必要な田んぼを取得（RLSにより自分のデータのみ）
  const { data: fields } = await supabase
    .from('fields')
    .select('name, next_water_check')
    .lte('next_water_check', new Date().toISOString())
    .not('next_water_check', 'is', null)

  if (!fields || fields.length === 0) {
    return NextResponse.json({ sent: 0, message: '対象の田んぼなし' })
  }

  const fieldList = fields.map(f => {
    const dt = new Date(f.next_water_check!)
    const label = dt.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    return `・${f.name}（${label}）`
  }).join('\n')
  const message = `🌾 水管理チェックのお知らせ\n\n以下の田んぼの水管理を確認してください：\n${fieldList}`

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to: profile.line_user_id, messages: [{ type: 'text', text: message }] }),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'LINE送信失敗' }, { status: 500 })
  }

  return NextResponse.json({ sent: 1, fields: fields.length })
}
