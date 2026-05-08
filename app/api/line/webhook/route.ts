import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  const channelSecret = process.env.LINE_CHANNEL_SECRET
  if (!channelSecret) return NextResponse.json({ ok: false }, { status: 500 })

  const body = await req.text()
  const signature = req.headers.get('x-line-signature') ?? ''
  const hash = crypto.createHmac('sha256', channelSecret).update(body).digest('base64')
  if (hash !== signature) return NextResponse.json({ error: 'invalid signature' }, { status: 401 })

  const events = JSON.parse(body).events ?? []
  const supabase = await createClient()

  for (const event of events) {
    if (event.type !== 'message' || event.message.type !== 'text') continue

    const lineUserId: string = event.source.userId
    const text: string = event.message.text.trim()

    // 連携コード（6文字英数字）
    if (/^[A-Z0-9]{6}$/i.test(text)) {
      const code = text.toUpperCase()
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('line_link_code', code)
        .single()

      if (profile) {
        await supabase.from('profiles').update({ line_user_id: lineUserId }).eq('id', profile.id)
        await pushMessage(lineUserId, '✅ LINE連携が完了しました！\n水管理アラートなどの通知をお送りします。\n\n「ヘルプ」と送ると使い方を確認できます。')
      } else {
        await pushMessage(lineUserId, '⚠️ コードが見つかりません。アプリの設定画面でコードを確認してください。')
      }
      continue
    }

    // ヘルプ
    if (text === 'ヘルプ' || text === 'help') {
      await pushMessage(lineUserId, [
        '📋 使い方',
        '',
        '【作業記録】',
        '田んぼ名 作業名 状態',
        '例: 1号田 代かき 完了',
        '　　2号田 田植え 進行中',
        '',
        '【水管理タイマー】',
        '田んぼ名 水管理 N時間',
        '例: 1号田 水管理 3時間',
        '',
        '状態: 完了 / 進行中 / 未着手',
      ].join('\n'))
      continue
    }

    // LINEユーザーの登録確認
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('line_user_id', lineUserId)
      .single()

    if (!userProfile) {
      await pushMessage(lineUserId, '⚠️ アプリとの連携が必要です。設定画面のコードをこちらに送ってください。')
      continue
    }

    // 「田んぼ名 水管理 N時間」
    const waterMatch = text.match(/^(.+?)\s+水管理\s+(\d+)時間$/)
    if (waterMatch) {
      const fieldName = waterMatch[1].trim()
      const hours = parseInt(waterMatch[2])
      const { data: field } = await supabase
        .from('fields')
        .select('id, name')
        .ilike('name', `%${fieldName}%`)
        .limit(1)
        .single()

      if (!field) {
        await pushMessage(lineUserId, `⚠️ 「${fieldName}」が見つかりません。`)
        continue
      }

      const dt = new Date(Date.now() + hours * 3600000).toISOString()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('fields') as any).update({ next_water_check: dt }).eq('id', field.id)
      const label = new Date(dt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      await pushMessage(lineUserId, `💧 ${field.name}\n水管理チェックを ${label} に設定しました。`)
      continue
    }

    // 「田んぼ名 作業名 状態」
    const workMatch = text.match(/^(.+?)\s+(.+?)\s+(完了|済|done|進行中|中|in_progress|未着手|まだ|pending)$/)
    if (workMatch) {
      const fieldName = workMatch[1].trim()
      const workTypeName = workMatch[2].trim()
      const statusRaw = workMatch[3]

      const statusMap: Record<string, string> = {
        完了: 'done', 済: 'done', done: 'done',
        進行中: 'in_progress', 中: 'in_progress', in_progress: 'in_progress',
        未着手: 'pending', まだ: 'pending', pending: 'pending',
      }
      const status = statusMap[statusRaw] ?? 'done'

      const [{ data: field }, { data: workType }] = await Promise.all([
        supabase.from('fields').select('id, name').ilike('name', `%${fieldName}%`).limit(1).single(),
        supabase.from('work_types').select('id, name').ilike('name', `%${workTypeName}%`).limit(1).single(),
      ])

      if (!field) { await pushMessage(lineUserId, `⚠️ 「${fieldName}」が見つかりません。`); continue }
      if (!workType) { await pushMessage(lineUserId, `⚠️ 作業種別「${workTypeName}」が見つかりません。`); continue }

      const today = new Date().toISOString().slice(0, 10)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('work_records') as any).insert({
        field_id: field.id,
        work_type_id: workType.id,
        status,
        work_date: today,
      })

      if (error) {
        await pushMessage(lineUserId, `⚠️ 記録に失敗しました: ${error.message}`)
      } else {
        const statusLabel: Record<string, string> = { done: '完了', in_progress: '進行中', pending: '未着手' }
        await pushMessage(lineUserId, `✅ 記録しました\n📍 ${field.name}\n🔧 ${workType.name}\n📊 ${statusLabel[status]}`)
      }
      continue
    }

    // 何にも該当しない
    await pushMessage(lineUserId, '「ヘルプ」と送ると使い方を確認できます。')
  }

  return NextResponse.json({ ok: true })
}

async function pushMessage(to: string, text: string) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  if (!token) return
  await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ to, messages: [{ type: 'text', text }] }),
  })
}
