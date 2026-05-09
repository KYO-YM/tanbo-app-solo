import { BookOpen, Map, Droplets, Sprout, Wheat, Wallet, MessageCircle, ClipboardList, BarChart2, NotebookPen, FlaskConical, Calculator } from 'lucide-react'
import Link from 'next/link'

const SETUP_STEPS = [
  {
    step: 1,
    icon: Map,
    color: 'text-green-600 bg-green-50',
    title: '田んぼを登録する',
    href: '/fields',
    linkLabel: '田んぼ一覧へ',
    desc: '「田んぼ一覧」ページの「筆ポリゴンデータ取込」から農林水産省の農地データ（GeoJSON形式）を読み込むと、地図上に田んぼが自動表示されます。',
    tips: ['ファイルは農林水産省「筆ポリゴンデータ」からダウンロードできます', '取り込み後、田んぼ名・面積・目標収量(kg/10a)を設定できます'],
  },
  {
    step: 2,
    icon: ClipboardList,
    color: 'text-blue-600 bg-blue-50',
    title: '作業種別を設定する',
    href: '/work-types',
    linkLabel: '作業種別へ',
    desc: '「作業種別管理」ページで代かき・田植え・除草など作業の種類を登録します。色を設定すると地図やカレンダーで色分け表示されます。新規登録時に6種類が自動で追加されます。',
    tips: ['よく使う作業をあらかじめ登録しておくと便利です', '後から追加・編集・削除もできます'],
  },
  {
    step: 3,
    icon: Sprout,
    color: 'text-emerald-600 bg-emerald-50',
    title: '作付け情報を登録する',
    href: '/fields',
    linkLabel: '田んぼ一覧へ',
    desc: '田んぼ一覧の「作付け未設定」をタップして品種と田植え日を入力します。すると中干し・穂肥・収穫目安がカレンダーに自動で表示されます。',
    tips: ['品種は10種類から選べます（コシヒカリ・あきたこまちなど）', 'カレンダーページで全田んぼのスケジュールを一覧確認できます'],
  },
  {
    step: 4,
    icon: Droplets,
    color: 'text-cyan-600 bg-cyan-50',
    title: '水管理タイマーをセットする',
    href: '/fields',
    linkLabel: '田んぼ一覧へ',
    desc: '田んぼ一覧の「次回水管理」をタップして、次に確認する時間（1〜24時間後）を選ぶだけです。時間が来るとダッシュボードにアラートが表示されます。',
    tips: ['超過するとダッシュボードに赤いアラートが表示されます', 'LINEと連携すると自動通知も届きます'],
  },
]

const DAILY_STEPS = [
  {
    icon: BarChart2,
    color: 'text-indigo-600',
    title: 'ダッシュボードで全体確認',
    desc: '7日間の天気予報・水管理アラート・今後の水稲作業スケジュール・全体の進捗率をまとめて確認できます。毎朝ここを見る習慣をつけると管理が楽になります。',
  },
  {
    icon: Map,
    color: 'text-green-600',
    title: '作業を記録する',
    desc: '地図上の田んぼをクリック →「詳細」→ 作業種別を選んで状態（未着手・進行中・完了）を更新します。LINEと連携している場合は「田んぼ名 作業名 完了」と送るだけでも記録できます。',
  },
  {
    icon: NotebookPen,
    color: 'text-amber-600',
    title: '作業日誌をつける',
    desc: '「作業日誌」ページでその日の作業内容・天気・メモを記録できます。天気は6種類から選択でき、月ごとに一覧表示されます。翌年の作業計画に役立ちます。',
  },
  {
    icon: FlaskConical,
    color: 'text-red-600',
    title: '農薬・肥料の使用を記録する',
    desc: '「農薬・肥料記録」ページで使用日・製品名・使用量・使用圃場を記録します。農薬取締法の使用記録として CSV出力もできます。年ごとに切り替えて過去の記録も確認できます。',
  },
  {
    icon: Wallet,
    color: 'text-purple-600',
    title: '費用を記録する',
    desc: '「費用管理」ページで農薬・肥料・労務費などを入力します。「収穫量」ページで単価を入力すると、費用との損益が自動計算されます。',
  },
]

const LINE_COMMANDS = [
  { cmd: '1号田 代かき 完了', desc: '作業記録' },
  { cmd: '2号田 水管理 3時間', desc: '水管理タイマー' },
  { cmd: 'ヘルプ', desc: 'コマンド一覧を表示' },
]

export default function GuidePage() {
  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div className="flex items-center gap-3">
        <BookOpen size={22} className="text-green-700" />
        <h1 className="text-xl font-bold text-gray-800">使い方ガイド</h1>
      </div>

      {/* はじめに */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-700 border-l-4 border-green-500 pl-3">🌱 はじめに（初期設定）</h2>
        <p className="text-sm text-gray-500">最初にこの4ステップを設定すると、すべての機能が使えるようになります。</p>
        <div className="space-y-3">
          {SETUP_STEPS.map(s => (
            <div key={s.step} className="bg-white rounded-xl shadow p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${s.color}`}>
                  <s.icon size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400">STEP {s.step}</span>
                    <span className="font-semibold text-gray-800 text-sm">{s.title}</span>
                  </div>
                </div>
                <Link href={s.href} className="text-xs text-green-600 font-medium hover:underline flex-shrink-0">
                  {s.linkLabel} →
                </Link>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed pl-11">{s.desc}</p>
              <ul className="pl-11 space-y-0.5">
                {s.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-start gap-1">
                    <span className="mt-0.5 flex-shrink-0">💡</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 日常の使い方 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-700 border-l-4 border-blue-500 pl-3">📋 日常の使い方</h2>
        <div className="space-y-3">
          {DAILY_STEPS.map((s, i) => (
            <div key={i} className="bg-white rounded-xl shadow p-4 flex gap-3">
              <div className={`flex-shrink-0 mt-0.5 ${s.color}`}>
                <s.icon size={18} />
              </div>
              <div>
                <div className="font-semibold text-gray-800 text-sm mb-1">{s.title}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 農薬稀釈計算ツール */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-700 border-l-4 border-red-400 pl-3">
          <Calculator size={16} className="inline mr-1 text-red-500" />
          農薬稀釈計算ツール
        </h2>
        <div className="bg-white rounded-xl shadow p-4 space-y-3 text-sm text-gray-600">
          <p>「農薬・肥料記録」ページ上部の<span className="font-semibold text-gray-800">「農薬稀釈計算ツール」</span>をタップすると展開します。</p>
          <div className="space-y-2">
            {[
              { label: '希釈倍率', desc: '農薬ラベルに記載の倍率（例: 1000倍）を入力。よく使う倍率はボタン一発で入力できます。' },
              { label: '10aあたり散布量', desc: '標準は100L/10a。動力噴霧器の場合は50〜150Lが目安です。' },
              { label: '散布面積', desc: '手入力（アール単位）または登録済みの田んぼから選択できます。' },
            ].map((item, i) => (
              <div key={i} className="flex gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-medium text-gray-700 flex-shrink-0 w-28">{item.label}</span>
                <span className="text-gray-500 text-xs">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            結果として農薬量（mL/L）・水の量・総散布液量が表示されます。
          </p>
          <Link href="/pesticide" className="block text-center text-xs text-green-600 font-medium py-2 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
            農薬・肥料記録ページへ →
          </Link>
        </div>
      </section>

      {/* 収穫・収支 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-700 border-l-4 border-yellow-500 pl-3">🌾 収穫後にやること</h2>
        <div className="bg-white rounded-xl shadow p-4 space-y-3 text-sm text-gray-600">
          <div className="flex gap-3">
            <Wheat size={18} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800 mb-1">収穫量を記録する</p>
              <p>「収穫量」ページで田んぼごとにkg数を入力します。1俵＝60kgで自動換算、10アールあたりの収量も計算されます。目標収量との比較もできます。</p>
            </div>
          </div>
          <div className="flex gap-3">
            <BarChart2 size={18} className="text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800 mb-1">年別グラフで推移を確認する</p>
              <p>2年分以上のデータがあると、収穫量の年別推移グラフが自動表示されます。今年は黄色でハイライトされます。</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Wallet size={18} className="text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-800 mb-1">損益を確認する</p>
              <p>「収穫量」ページ上部の「概算単価（円/kg）」に販売単価を入力すると、費用管理のデータと合わせて概算利益が自動計算されます。</p>
            </div>
          </div>
        </div>
      </section>

      {/* LINE連携 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-700 border-l-4 border-green-400 pl-3">
          <MessageCircle size={16} className="inline mr-1 text-green-500" />
          LINEで操作する（オプション）
        </h2>
        <div className="bg-white rounded-xl shadow p-4 space-y-3">
          <p className="text-sm text-gray-600">設定画面でLINE連携すると、LINEからメッセージを送るだけで作業記録や水管理タイマーの操作ができます。</p>
          <div className="space-y-2">
            {LINE_COMMANDS.map((c, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                <code className="text-sm font-mono text-green-700 flex-1">{c.cmd}</code>
                <span className="text-xs text-gray-400 flex-shrink-0">→ {c.desc}</span>
              </div>
            ))}
          </div>
          <Link href="/settings" className="block text-center text-xs text-green-600 font-medium py-2 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
            LINE連携を設定する →
          </Link>
        </div>
      </section>

      {/* ページ一覧 */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-gray-700 border-l-4 border-gray-400 pl-3">📌 各ページの役割</h2>
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {[
            { href: '/map',        label: '地図',          desc: '田んぼの位置確認・作業記録の登録' },
            { href: '/dashboard',  label: 'ダッシュボード', desc: '天気予報・水管理アラート・全体進捗の確認' },
            { href: '/fields',     label: '田んぼ一覧',    desc: '水管理タイマー・作付け設定・目標収量' },
            { href: '/records',    label: '作業記録',      desc: '全田んぼの作業一覧・フィルター・CSV出力' },
            { href: '/diary',      label: '作業日誌',      desc: '日々の作業内容・天気・メモの記録' },
            { href: '/calendar',   label: 'カレンダー',    desc: '作業記録と水稲スケジュールの月表示' },
            { href: '/harvests',   label: '収穫量',        desc: '年度別収穫量・グラフ・損益サマリー' },
            { href: '/expenses',   label: '費用管理',      desc: '農薬・肥料・労務費などのコスト記録' },
            { href: '/pesticide',  label: '農薬・肥料記録', desc: '使用記録・CSV出力・稀釈計算ツール' },
            { href: '/work-types', label: '作業種別',      desc: '作業の種類と色の設定' },
            { href: '/settings',   label: '設定',          desc: 'LINE連携・通知設定・プロフィール' },
          ].map(p => (
            <Link key={p.href} href={p.href} className="flex items-center gap-3 px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
              <span className="text-sm font-medium text-green-700 w-28 flex-shrink-0">{p.label}</span>
              <span className="text-sm text-gray-500">{p.desc}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
