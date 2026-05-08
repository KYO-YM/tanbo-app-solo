'use client'
import { useState } from 'react'
import { MessageCircle, Copy, Check, Send, Sprout } from 'lucide-react'

interface Props {
  linkCode: string | null
  isConnected: boolean
  isConfigured: boolean
}

export default function LineSettings({ linkCode, isConnected, isConfigured }: Props) {
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<string | null>(null)
  const [sendingRice, setSendingRice] = useState(false)
  const [riceResult, setRiceResult] = useState<string | null>(null)

  async function copyCode() {
    if (!linkCode) return
    await navigator.clipboard.writeText(linkCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function sendWaterNotify() {
    setSending(true)
    setSendResult(null)
    const res = await fetch('/api/line/notify', { method: 'POST' })
    const json = await res.json()
    if (res.ok) {
      setSendResult(`✅ ${json.sent}名に通知しました（対象: ${json.fields}田んぼ）`)
    } else {
      setSendResult(`⚠️ ${json.message ?? json.error}`)
    }
    setSending(false)
  }

  async function sendRiceNotify() {
    setSendingRice(true)
    setRiceResult(null)
    const res = await fetch('/api/cron/rice-notify')
    const json = await res.json()
    if (res.ok) {
      if (json.sent > 0) {
        setRiceResult(`✅ ${json.sent}名に通知しました（イベント: ${json.events}件）`)
      } else {
        setRiceResult(`ℹ️ ${json.message ?? '明日の水稲イベントはありません'}`)
      }
    } else {
      setRiceResult(`⚠️ ${json.error}`)
    }
    setSendingRice(false)
  }

  return (
    <div className="bg-white rounded-xl shadow p-5 space-y-5">
      <div className="flex items-center gap-2">
        <MessageCircle size={18} className="text-green-500" />
        <h2 className="font-semibold text-gray-800">LINE通知</h2>
        {isConnected && (
          <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            連携済み
          </span>
        )}
      </div>

      {!isConfigured ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium text-amber-800">LINE Botの設定が必要です</p>
          <ol className="text-amber-700 space-y-1 list-decimal list-inside text-xs">
            <li><a href="https://developers.line.biz/" target="_blank" rel="noopener" className="underline">LINE Developersコンソール</a>でMessaging APIチャンネルを作成</li>
            <li>「チャンネルアクセストークン」と「チャンネルシークレット」を取得</li>
            <li>VercelのEnvironment Variablesに追加：<br />
              <code className="bg-amber-100 px-1 rounded">LINE_CHANNEL_ACCESS_TOKEN</code><br />
              <code className="bg-amber-100 px-1 rounded">LINE_CHANNEL_SECRET</code>
            </li>
            <li>WebhookURLを設定：<br />
              <code className="bg-amber-100 px-1 rounded text-[11px]">https://tanbo-app-psi.vercel.app/api/line/webhook</code>
            </li>
          </ol>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-gray-700 font-medium">LINE Botと連携する手順</p>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>LINE BotをQRコードで友だち追加</li>
              <li>Botに以下のコードを送信してください</li>
            </ol>
          </div>

          {linkCode && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-100 rounded-lg px-4 py-3 font-mono text-2xl font-bold tracking-widest text-center text-gray-800">
                {linkCode}
              </div>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                {copied ? 'コピー済' : 'コピー'}
              </button>
            </div>
          )}

          {isConnected && (
            <div className="border-t pt-4 space-y-4">
              {/* 水管理通知 */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">💧 水管理アラートを手動送信</p>
                <p className="text-xs text-gray-500">チェック時刻を超過している田んぼを通知します</p>
                <button
                  onClick={sendWaterNotify}
                  disabled={sending}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <Send size={14} />
                  {sending ? '送信中...' : '水管理通知を送信'}
                </button>
                {sendResult && (
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{sendResult}</p>
                )}
              </div>

              {/* 水稲スケジュール通知 */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                  <Sprout size={14} className="text-green-600" />
                  水稲スケジュール通知を手動送信
                </p>
                <p className="text-xs text-gray-500">明日の作業（中干し・穂肥・収穫など）をLINE通知します</p>
                <button
                  onClick={sendRiceNotify}
                  disabled={sendingRice}
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  <Sprout size={14} />
                  {sendingRice ? '送信中...' : '水稲通知を送信'}
                </button>
                {riceResult && (
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2">{riceResult}</p>
                )}
              </div>

              {/* GitHub Actions説明 */}
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                <p className="font-medium text-gray-600">⚙️ 自動通知（毎朝6時）の設定方法</p>
                <p>GitHubリポジトリの Settings → Secrets に以下を追加：</p>
                <ul className="list-disc list-inside space-y-0.5 pl-1">
                  <li><code className="bg-white px-1 rounded border">CRON_SECRET</code>（任意の文字列）</li>
                  <li><code className="bg-white px-1 rounded border">APP_URL</code>（例: https://tanbo-app-psi.vercel.app）</li>
                </ul>
                <p>設定後、GitHub Actionsが毎朝6時に自動送信します（無料）</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
