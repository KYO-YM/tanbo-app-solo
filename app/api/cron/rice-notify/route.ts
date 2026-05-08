import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { calcRiceSchedule } from '@/lib/utils/rice'
import type { Field } from '@/lib/supabase/types'

export async function GET(req: Request) {
  // CRON_SECRET による認証（未設定の場合は常に拒否）
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return NextResponse.json({ skipped: 'LINE not configured' })

  const supabase = await createClient()

  // 作付け設定済みの田んぼを取得
  const { data: fieldsData } = await supabase
    .from('fields')
    .select('id, name, transplant_date, variety')
    .not('transplant_date', 'is', null)
    .not('variety', 'is', null)

  const fields = (fieldsData ?? []) as Pick<Field, 'id' | 'name' | 'transplant_date' | 'variety'>[]

  // 明日の日付（JST）
  const jstNow = new Date(Date.now() + 9 * 3600000)
  const tomorrow = new Date(jstNow)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  // 明日に該当する水稲イベントを収集
  const hits: { fieldName: string; label: string; emoji: string }[] = []
  for (const f of fields) {
    if (!f.transplant_date || !f.variety) continue
    const events = calcRiceSchedule(f.id, f.name, f.transplant_date, f.variety)
    for (const e of events) {
      if (e.date === tomorrowStr) {
        hits.push({ fieldName: f.name, label: e.label, emoji: e.emoji })
      }
    }
  }

  if (hits.length === 0) {
    return NextResponse.json({ sent: 0, message: '明日の水稲イベントなし' })
  }

  // LINE連携済みユーザーを取得
  const { data: profiles } = await supabase
    .from('profiles')
    .select('line_user_id')
    .not('line_user_id', 'is', null)

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, message: 'LINE連携ユーザーなし' })
  }

  const list = hits.map(h => `${h.emoji} ${h.fieldName}：${h.label}`).join('\n')
  const message = `🌾 明日の水稲作業お知らせ\n\n${list}\n\n忘れずに確認してください！`

  let sent = 0
  for (const p of profiles) {
    if (!p.line_user_id) continue
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to: p.line_user_id, messages: [{ type: 'text', text: message }] }),
    })
    if (res.ok) sent++
  }

  return NextResponse.json({ sent, events: hits.length })
}
