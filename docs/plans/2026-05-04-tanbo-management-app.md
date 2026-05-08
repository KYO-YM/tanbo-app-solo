# 田んぼ管理アプリ 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 農水省の筆ポリゴンデータを使い、田んぼの所有区画と作業進捗を地図上で複数人が管理できるWebアプリを構築する。

**Architecture:** Next.js App Router でフロントエンド・APIを一体管理し、Supabase で認証・DB・リアルタイム同期を担う。地図は Leaflet.js でポリゴン描画し、田んぼ選択・進捗更新をインタラクティブに操作できる。

**Tech Stack:** Next.js 14 (App Router) / TypeScript / Tailwind CSS / Leaflet.js / Supabase (PostgreSQL + Auth + Realtime) / Vercel

---

## 全体アーキテクチャ

```
tanbo-app/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          # ログイン画面
│   │   └── layout.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # 認証済みレイアウト（ナビゲーション）
│   │   ├── page.tsx                # ホーム → /map にリダイレクト
│   │   ├── map/page.tsx            # メイン地図画面
│   │   ├── fields/
│   │   │   ├── page.tsx            # 田んぼ一覧
│   │   │   └── [id]/page.tsx       # 田んぼ詳細・作業記録
│   │   ├── work-types/page.tsx     # 作業種別管理
│   │   └── users/page.tsx          # ユーザー管理（管理者のみ）
│   └── api/
│       ├── fields/route.ts         # 田んぼ CRUD
│       ├── work-types/route.ts     # 作業種別 CRUD
│       ├── work-records/route.ts   # 作業記録 CRUD
│       └── users/route.ts          # ユーザー管理
├── components/
│   ├── map/
│   │   ├── MapView.tsx             # Leaflet地図本体（dynamic import）
│   │   ├── FieldPolygon.tsx        # 田んぼポリゴン1枚分
│   │   ├── FieldPanel.tsx          # クリック時の詳細パネル
│   │   └── MapLegend.tsx           # 凡例（色と作業種別の対応）
│   ├── fields/
│   │   ├── FieldList.tsx           # 田んぼ一覧テーブル
│   │   ├── FieldImporter.tsx       # 筆ポリゴンGeoJSON取込UI
│   │   └── WorkRecordForm.tsx      # 作業記録入力フォーム
│   ├── work-types/
│   │   └── WorkTypeManager.tsx     # 作業種別の追加・編集・削除
│   └── ui/
│       ├── Button.tsx
│       ├── Modal.tsx
│       └── StatusBadge.tsx         # 進捗バッジ（色付き）
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # ブラウザ用Supabaseクライアント
│   │   ├── server.ts               # サーバー用Supabaseクライアント
│   │   └── types.ts                # DB型定義（自動生成）
│   ├── geojson.ts                  # GeoJSON変換ユーティリティ
│   └── constants.ts                # デフォルトカラー等の定数
├── hooks/
│   ├── useFields.ts                # 田んぼデータのfetch・更新
│   ├── useWorkRecords.ts           # 作業記録のfetch・更新
│   └── useRealtimeSync.ts          # Supabase Realtimeの購読
├── supabase/
│   └── migrations/
│       ├── 001_create_tables.sql   # テーブル定義
│       ├── 002_rls_policies.sql    # Row Level Security
│       └── 003_seed_work_types.sql # 初期作業種別データ
└── public/
    └── data/                       # （任意）ローカルGeoJSONサンプル
```

---

## データベース設計

### テーブル一覧

```sql
-- 田んぼ
fields (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,           -- 例: "第3区画"
  owner         TEXT,                    -- 所有者名
  area_ha       NUMERIC(6,4),            -- 面積（ヘクタール）
  geometry      JSONB NOT NULL,          -- GeoJSON Polygon
  fude_id       TEXT,                    -- 筆ポリゴンの元ID（参照用）
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
)

-- 作業種別（自由に追加可能）
work_types (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL UNIQUE,   -- 例: "田植え"
  color         TEXT NOT NULL,          -- 地図表示色 例: "#22c55e"
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)

-- 作業記録（田んぼ × 作業種別 の進捗）
work_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id      UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  work_type_id  UUID NOT NULL REFERENCES work_types(id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('pending','in_progress','done')),
  assigned_to   UUID REFERENCES auth.users(id),
  scheduled_at  DATE,                   -- 予定日
  completed_at  DATE,                   -- 完了日
  memo          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, work_type_id)        -- 1田んぼ × 1作業種別 = 1レコード
)

-- ユーザープロフィール（auth.usersと1:1）
profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id),
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'worker'
                CHECK (role IN ('admin','worker')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
```

### 進捗ステータスの色定義

| status | 意味 | 地図上の表示 |
|--------|------|-------------|
| `pending` | 未着手 | グレー |
| `in_progress` | 進行中 | 黄色 |
| `done` | 完了 | 緑 |
| （記録なし） | 作業対象外 | 薄いグレー |

> 作業種別ごとにフィルタリングして地図を色分け表示する。

---

## 画面設計

### ① 地図画面（メイン）

```
┌─────────────────────────────────────────┐
│ [≡] 田んぼ管理  [作業種別フィルタ ▼]  [👤]│  ← ヘッダー
├─────────────────────────────────────────┤
│                                         │
│   🗺️  Leaflet 地図                      │
│                                         │
│  ┌──┐   ← 田んぼポリゴン（色分け）       │
│  │🟡│  クリック↓                        │
│  └──┘                                   │
│                                         │
│  ┌──────────────────────┐               │
│  │ 第3区画（田中農場）   │  ← 詳細パネル  │
│  │ 面積: 0.25ha         │               │
│  │ 田植え: 🟡 進行中    │               │
│  │ 除草:  ⚪ 未着手     │               │
│  │ [詳細を見る]         │               │
│  └──────────────────────┘               │
├─────────────────────────────────────────┤
│ 凡例: ⚫未着手 🟡進行中 🟢完了           │
└─────────────────────────────────────────┘
```

### ② 田んぼ詳細画面

```
田んぼ: 第3区画
所有者: 田中農場  面積: 0.25ha

作業進捗
┌────────────┬──────────┬────────┬──────────┐
│ 作業種別   │ 状態     │ 担当   │ 予定日   │
├────────────┼──────────┼────────┼──────────┤
│ 代掻き     │ ✅完了   │ 田中   │ 5/1      │
│ 田植え     │ 🟡進行中 │ 鈴木   │ 5/10     │
│ 除草       │ ⚪未着手 │ -      │ -        │
└────────────┴──────────┴────────┴──────────┘
[+ 作業を追加]
```

### ③ 作業種別管理画面

```
作業種別一覧
[+ 新しい作業を追加]

■ 代掻き   🔵  [編集][削除]
■ 田植え   🟢  [編集][削除]
■ 除草     🟡  [編集][削除]
■ 収穫     🟠  [編集][削除]
```

---

## Task 1: プロジェクト初期セットアップ

**Files:**
- Create: `tanbo-app/` (Next.js プロジェクト全体)
- Create: `tanbo-app/.env.local`

- [ ] **Step 1: Next.js プロジェクト作成**

```bash
cd ~/Desktop
npx create-next-app@latest tanbo-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=no \
  --import-alias="@/*"
cd tanbo-app
```

- [ ] **Step 2: 依存パッケージをインストール**

```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  leaflet \
  react-leaflet \
  @types/leaflet \
  lucide-react
```

- [ ] **Step 3: Supabase プロジェクトを作成**

1. https://supabase.com にアクセスしてアカウント作成
2. 「New project」→ プロジェクト名: `tanbo-app`、リージョン: `Northeast Asia (Tokyo)`
3. Settings → API から `URL` と `anon key` をコピー

- [ ] **Step 4: 環境変数を設定**

`.env.local` を作成：

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

- [ ] **Step 5: 起動確認**

```bash
npm run dev
# ブラウザで http://localhost:3000 を開きデフォルト画面が表示されることを確認
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: initial Next.js setup with Supabase and Leaflet"
```

---

## Task 2: Supabase テーブル作成とRLS設定

**Files:**
- Create: `supabase/migrations/001_create_tables.sql`
- Create: `supabase/migrations/002_rls_policies.sql`
- Create: `supabase/migrations/003_seed_work_types.sql`

- [ ] **Step 1: テーブル作成SQLを書く**

`supabase/migrations/001_create_tables.sql`:

```sql
-- profiles
CREATE TABLE profiles (
  id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name  TEXT NOT NULL,
  role  TEXT NOT NULL DEFAULT 'worker'
        CHECK (role IN ('admin', 'worker')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- fields（田んぼ）
CREATE TABLE fields (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  owner      TEXT,
  area_ha    NUMERIC(6,4),
  geometry   JSONB NOT NULL,
  fude_id    TEXT,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_types（作業種別）
CREATE TABLE work_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  color      TEXT NOT NULL DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_records（作業記録）
CREATE TABLE work_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id     UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  work_type_id UUID NOT NULL REFERENCES work_types(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'in_progress', 'done')),
  assigned_to  UUID REFERENCES auth.users(id),
  scheduled_at DATE,
  completed_at DATE,
  memo         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, work_type_id)
);

-- updated_at 自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fields_updated_at
  BEFORE UPDATE ON fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER work_records_updated_at
  BEFORE UPDATE ON work_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Step 2: RLS ポリシーを設定**

`supabase/migrations/002_rls_policies.sql`:

```sql
-- RLS 有効化
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields      ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types  ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のプロフィールのみ更新可。全員が読める
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- fields: ログイン済みユーザーは全て読める。adminのみ作成・更新・削除
CREATE POLICY "fields_select" ON fields FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "fields_insert" ON fields FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "fields_update" ON fields FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "fields_delete" ON fields FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- work_types: 全員が読める。adminのみ変更
CREATE POLICY "work_types_select" ON work_types FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "work_types_insert" ON work_types FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "work_types_update" ON work_types FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "work_types_delete" ON work_types FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- work_records: 全員が読める。全員が更新可（担当者が進捗を変えられる）
CREATE POLICY "work_records_select" ON work_records FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "work_records_insert" ON work_records FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "work_records_update" ON work_records FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "work_records_delete" ON work_records FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
```

- [ ] **Step 3: 初期作業種別データを投入**

`supabase/migrations/003_seed_work_types.sql`:

```sql
INSERT INTO work_types (name, color, sort_order) VALUES
  ('代掻き',   '#3b82f6', 1),
  ('田植え',   '#22c55e', 2),
  ('除草',     '#eab308', 3),
  ('水管理',   '#06b6d4', 4),
  ('収穫',     '#f97316', 5);
```

- [ ] **Step 4: Supabase ダッシュボードで SQL を実行**

1. https://supabase.com → プロジェクト → SQL Editor を開く
2. `001_create_tables.sql` の内容を貼り付けて実行
3. `002_rls_policies.sql` の内容を貼り付けて実行
4. `003_seed_work_types.sql` の内容を貼り付けて実行
5. Table Editor で `fields`, `work_types`, `work_records`, `profiles` テーブルが存在することを確認

- [ ] **Step 5: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema, RLS policies, and seed data"
```

---

## Task 3: Supabase クライアント設定と型定義

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/types.ts`

- [ ] **Step 1: ブラウザ用クライアントを作成**

`lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 2: サーバー用クライアントを作成**

`lib/supabase/server.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(
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
}
```

- [ ] **Step 3: DB型定義を作成**

`lib/supabase/types.ts`:

```typescript
export type WorkStatus = 'pending' | 'in_progress' | 'done'
export type UserRole = 'admin' | 'worker'

export interface Field {
  id: string
  name: string
  owner: string | null
  area_ha: number | null
  geometry: GeoJSONPolygon
  fude_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface GeoJSONPolygon {
  type: 'Polygon'
  coordinates: number[][][]
}

export interface WorkType {
  id: string
  name: string
  color: string
  sort_order: number
  created_at: string
}

export interface WorkRecord {
  id: string
  field_id: string
  work_type_id: string
  status: WorkStatus
  assigned_to: string | null
  scheduled_at: string | null
  completed_at: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  name: string
  role: UserRole
  created_at: string
}

// Supabase Database型（RLSクライアントで使用）
export interface Database {
  public: {
    Tables: {
      fields: { Row: Field; Insert: Omit<Field, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<Field, 'id'>> }
      work_types: { Row: WorkType; Insert: Omit<WorkType, 'id' | 'created_at'>; Update: Partial<Omit<WorkType, 'id'>> }
      work_records: { Row: WorkRecord; Insert: Omit<WorkRecord, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Omit<WorkRecord, 'id'>> }
      profiles: { Row: Profile; Insert: Omit<Profile, 'created_at'>; Update: Partial<Omit<Profile, 'id'>> }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/
git commit -m "feat: add Supabase client configuration and type definitions"
```

---

## Task 4: 認証（ログイン・ログアウト・ミドルウェア）

**Files:**
- Create: `middleware.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/(auth)/layout.tsx`
- Create: `app/(app)/layout.tsx`

- [ ] **Step 1: ミドルウェアで未認証リダイレクトを設定**

`middleware.ts`:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const isLoginPage = request.nextUrl.pathname.startsWith('/login')

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/map', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

- [ ] **Step 2: ログイン画面を作成**

`app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      {children}
    </div>
  )
}
```

`app/(auth)/login/page.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
      setLoading(false)
    } else {
      router.push('/map')
    }
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
      <h1 className="text-2xl font-bold text-center mb-6 text-green-700">
        🌾 田んぼ管理
      </h1>
      <form onSubmit={handleLogin} className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 3: 認証済みレイアウト（ナビゲーション）を作成**

`app/(app)/layout.tsx`:

```tsx
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LogoutButton from './LogoutButton'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">🌾 田んぼ管理</span>
          <nav className="hidden sm:flex gap-3 text-sm">
            <Link href="/map" className="hover:underline">地図</Link>
            <Link href="/fields" className="hover:underline">田んぼ一覧</Link>
            <Link href="/work-types" className="hover:underline">作業種別</Link>
            {profile?.role === 'admin' && (
              <Link href="/users" className="hover:underline">ユーザー管理</Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span>{profile?.name ?? user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="h-[calc(100vh-56px)]">{children}</main>
    </div>
  )
}
```

`app/(app)/LogoutButton.tsx`:

```tsx
'use client'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="bg-green-800 hover:bg-green-900 px-3 py-1 rounded text-xs"
    >
      ログアウト
    </button>
  )
}
```

- [ ] **Step 4: 動作確認**

```bash
npm run dev
# 1. http://localhost:3000 にアクセス → /login にリダイレクトされることを確認
# 2. Supabase ダッシュボードの Authentication → Users で手動でユーザーを1人作成
#    → profilesテーブルに手動でレコードを追加 (id=上記UUID, name='管理者', role='admin')
# 3. 作成したユーザーでログインできることを確認
# 4. ログアウトボタンで /login に戻ることを確認
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add authentication with login/logout and route protection"
```

---

## Task 5: 地図画面 - 筆ポリゴン表示

**Files:**
- Create: `app/(app)/map/page.tsx`
- Create: `components/map/MapView.tsx`
- Create: `components/map/FieldPolygon.tsx`
- Create: `components/map/MapLegend.tsx`
- Create: `lib/constants.ts`

- [ ] **Step 1: 定数ファイルを作成**

`lib/constants.ts`:

```typescript
export const STATUS_COLORS = {
  pending:     '#9ca3af',  // グレー
  in_progress: '#fbbf24',  // 黄色
  done:        '#22c55e',  // 緑
  none:        '#e5e7eb',  // 作業記録なし
} as const

export const STATUS_LABELS = {
  pending:     '未着手',
  in_progress: '進行中',
  done:        '完了',
} as const

// 初期地図中心（必要に応じて変更）
export const DEFAULT_MAP_CENTER: [number, number] = [36.2048, 138.2529]
export const DEFAULT_MAP_ZOOM = 13
```

- [ ] **Step 2: 地図コンポーネントを作成**

`components/map/MapView.tsx`:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Field, WorkRecord, WorkType } from '@/lib/supabase/types'
import { STATUS_COLORS, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '@/lib/constants'
import FieldPanel from './FieldPanel'

interface Props {
  fields: Field[]
  workRecords: WorkRecord[]
  workTypes: WorkType[]
  selectedWorkTypeId: string | null
}

export default function MapView({ fields, workRecords, workTypes, selectedWorkTypeId }: Props) {
  const mapRef = useRef<L.Map | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const layersRef = useRef<L.Layer[]>([])
  const [selectedField, setSelectedField] = useState<Field | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    mapRef.current = L.map(containerRef.current).setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapRef.current)
  }, [])

  useEffect(() => {
    if (!mapRef.current) return
    layersRef.current.forEach(l => l.remove())
    layersRef.current = []

    fields.forEach(field => {
      const color = getFieldColor(field.id, workRecords, workTypes, selectedWorkTypeId)
      const polygon = L.geoJSON(field.geometry as GeoJSON.Geometry, {
        style: {
          fillColor: color,
          fillOpacity: 0.6,
          color: '#374151',
          weight: 1.5,
        },
      })
      .on('click', () => setSelectedField(field))
      .addTo(mapRef.current!)
      layersRef.current.push(polygon)
    })
  }, [fields, workRecords, workTypes, selectedWorkTypeId])

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      {selectedField && (
        <FieldPanel
          field={selectedField}
          workRecords={workRecords.filter(r => r.field_id === selectedField.id)}
          workTypes={workTypes}
          onClose={() => setSelectedField(null)}
        />
      )}
    </div>
  )
}

function getFieldColor(
  fieldId: string,
  workRecords: WorkRecord[],
  workTypes: WorkType[],
  selectedWorkTypeId: string | null
): string {
  if (!selectedWorkTypeId) {
    // フィルタなし：最も遅れている作業のステータスを表示
    const records = workRecords.filter(r => r.field_id === fieldId)
    if (records.length === 0) return STATUS_COLORS.none
    if (records.some(r => r.status === 'pending')) return STATUS_COLORS.pending
    if (records.some(r => r.status === 'in_progress')) return STATUS_COLORS.in_progress
    return STATUS_COLORS.done
  }
  const record = workRecords.find(
    r => r.field_id === fieldId && r.work_type_id === selectedWorkTypeId
  )
  if (!record) return STATUS_COLORS.none
  return STATUS_COLORS[record.status]
}
```

- [ ] **Step 3: 詳細パネルコンポーネントを作成**

`components/map/FieldPanel.tsx`:

```tsx
import Link from 'next/link'
import type { Field, WorkRecord, WorkType } from '@/lib/supabase/types'
import { STATUS_LABELS } from '@/lib/constants'
import { X } from 'lucide-react'

interface Props {
  field: Field
  workRecords: WorkRecord[]
  workTypes: WorkType[]
  onClose: () => void
}

export default function FieldPanel({ field, workRecords, workTypes, onClose }: Props) {
  return (
    <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-white rounded-xl shadow-lg p-4 z-[1000]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="font-bold text-gray-800">{field.name}</h2>
          {field.owner && <p className="text-sm text-gray-500">{field.owner}</p>}
          {field.area_ha && (
            <p className="text-sm text-gray-500">{(field.area_ha * 100).toFixed(1)} アール</p>
          )}
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>
      <div className="space-y-1 mb-3">
        {workTypes.slice(0, 4).map(wt => {
          const record = workRecords.find(r => r.work_type_id === wt.id)
          const status = record?.status ?? 'none'
          return (
            <div key={wt.id} className="flex items-center justify-between text-sm">
              <span className="text-gray-700">{wt.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                status === 'done' ? 'bg-green-100 text-green-700' :
                status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                status === 'pending' ? 'bg-gray-100 text-gray-600' :
                'bg-gray-50 text-gray-400'
              }`}>
                {status === 'none' ? '-' : STATUS_LABELS[status]}
              </span>
            </div>
          )
        })}
      </div>
      <Link
        href={`/fields/${field.id}`}
        className="block text-center text-sm text-green-700 font-medium hover:underline"
      >
        詳細を見る →
      </Link>
    </div>
  )
}
```

- [ ] **Step 4: 凡例コンポーネントを作成**

`components/map/MapLegend.tsx`:

```tsx
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/constants'

export default function MapLegend() {
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow px-3 py-2 z-[1000] text-xs">
      {(Object.entries(STATUS_LABELS) as [keyof typeof STATUS_LABELS, string][]).map(([key, label]) => (
        <div key={key} className="flex items-center gap-2 py-0.5">
          <span
            className="inline-block w-3 h-3 rounded-sm border border-gray-300"
            style={{ backgroundColor: STATUS_COLORS[key] }}
          />
          <span className="text-gray-700">{label}</span>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: 地図ページを作成**

`app/(app)/map/page.tsx`:

```tsx
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/server'
import WorkTypeFilter from './WorkTypeFilter'

const MapView = dynamic(() => import('@/components/map/MapView'), { ssr: false })

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ work_type?: string }>
}) {
  const { work_type } = await searchParams
  const supabase = await createClient()

  const [fieldsRes, workRecordsRes, workTypesRes] = await Promise.all([
    supabase.from('fields').select('*'),
    supabase.from('work_records').select('*'),
    supabase.from('work_types').select('*').order('sort_order'),
  ])

  const fields = fieldsRes.data ?? []
  const workRecords = workRecordsRes.data ?? []
  const workTypes = workTypesRes.data ?? []

  return (
    <div className="relative w-full h-full">
      <WorkTypeFilter workTypes={workTypes} selectedId={work_type ?? null} />
      <MapView
        fields={fields}
        workRecords={workRecords}
        workTypes={workTypes}
        selectedWorkTypeId={work_type ?? null}
      />
    </div>
  )
}
```

`app/(app)/map/WorkTypeFilter.tsx`:

```tsx
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { WorkType } from '@/lib/supabase/types'

interface Props {
  workTypes: WorkType[]
  selectedId: string | null
}

export default function WorkTypeFilter({ workTypes, selectedId }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function select(id: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (id) params.set('work_type', id)
    else params.delete('work_type')
    router.push(`/map?${params.toString()}`)
  }

  return (
    <div className="absolute top-4 left-4 z-[1000] flex gap-2 flex-wrap max-w-[calc(100%-4rem)]">
      <button
        onClick={() => select(null)}
        className={`px-3 py-1 rounded-full text-xs font-medium border ${
          !selectedId ? 'bg-green-700 text-white border-green-700' : 'bg-white text-gray-700 border-gray-300'
        }`}
      >
        すべて
      </button>
      {workTypes.map(wt => (
        <button
          key={wt.id}
          onClick={() => select(wt.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium border ${
            selectedId === wt.id ? 'text-white border-transparent' : 'bg-white text-gray-700 border-gray-300'
          }`}
          style={selectedId === wt.id ? { backgroundColor: wt.color, borderColor: wt.color } : {}}
        >
          {wt.name}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: 動作確認**

```bash
npm run dev
# 1. /map にアクセスして地図が表示されることを確認
# 2. Supabase の SQL Editor で以下のテストデータを投入：
```

```sql
INSERT INTO fields (name, owner, area_ha, geometry) VALUES
('第1区画', '田中農場', 0.25, '{
  "type": "Polygon",
  "coordinates": [[[138.25, 36.20], [138.253, 36.20], [138.253, 36.203], [138.25, 36.203], [138.25, 36.20]]]
}');
```

```bash
# 3. 地図上にポリゴンが表示されることを確認
# 4. ポリゴンをクリックして詳細パネルが出ることを確認
# 5. 作業種別フィルタボタンが表示されることを確認
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add interactive map with field polygons and work status filter"
```

---

## Task 6: 筆ポリゴンデータの取込機能

**Files:**
- Create: `app/(app)/fields/page.tsx`
- Create: `components/fields/FieldImporter.tsx`
- Create: `lib/geojson.ts`
- Create: `app/api/fields/route.ts`

- [ ] **Step 1: GeoJSON ユーティリティを作成**

`lib/geojson.ts`:

```typescript
import type { GeoJSONPolygon } from './supabase/types'

export interface FudeFeature {
  type: 'Feature'
  properties: {
    筆ポリゴンID?: string
    地目?: string
    面積?: number
    [key: string]: unknown
  }
  geometry: GeoJSONPolygon
}

export function parseFudeGeoJSON(text: string): FudeFeature[] {
  const json = JSON.parse(text)
  if (json.type !== 'FeatureCollection') throw new Error('FeatureCollectionではありません')
  return json.features.filter(
    (f: FudeFeature) => f.geometry?.type === 'Polygon'
  )
}

export function calcAreaHa(geometry: GeoJSONPolygon): number {
  // 簡易計算（平面近似）
  const coords = geometry.coordinates[0]
  let area = 0
  for (let i = 0; i < coords.length - 1; i++) {
    area += (coords[i][0] * coords[i + 1][1]) - (coords[i + 1][0] * coords[i][1])
  }
  const areaInDegrees = Math.abs(area) / 2
  // 1度 ≈ 111km → 平方メートル換算 → ヘクタール
  return (areaInDegrees * 111000 * 111000) / 10000
}
```

- [ ] **Step 2: 田んぼAPIを作成**

`app/api/fields/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase.from('fields').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase.from('fields').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: 筆ポリゴン取込コンポーネントを作成**

`components/fields/FieldImporter.tsx`:

```tsx
'use client'
import { useState, useRef } from 'react'
import { parseFudeGeoJSON, calcAreaHa, type FudeFeature } from '@/lib/geojson'
import { Upload } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FieldImporter() {
  const [features, setFeatures] = useState<FudeFeature[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseFudeGeoJSON(text)
      setFeatures(parsed)
      setSelected(new Set(parsed.map((_, i) => i)))
      setError('')
    } catch {
      setError('GeoJSONファイルの読み込みに失敗しました')
    }
  }

  async function handleImport() {
    setLoading(true)
    const targets = features.filter((_, i) => selected.has(i))
    for (const f of targets) {
      await fetch('/api/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.properties['筆ポリゴンID'] ?? '田んぼ',
          area_ha: calcAreaHa(f.geometry),
          geometry: f.geometry,
          fude_id: String(f.properties['筆ポリゴンID'] ?? ''),
        }),
      })
    }
    setLoading(false)
    setFeatures([])
    router.refresh()
  }

  function toggleAll() {
    if (selected.size === features.length) setSelected(new Set())
    else setSelected(new Set(features.map((_, i) => i)))
  }

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <h2 className="font-semibold text-gray-700 mb-3">筆ポリゴンデータ取込</h2>
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-green-400 hover:text-green-600 w-full justify-center"
      >
        <Upload size={16} />
        GeoJSONファイルを選択
      </button>
      <input ref={fileRef} type="file" accept=".json,.geojson" onChange={handleFile} className="hidden" />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      {features.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">{features.length} 件の区画が見つかりました</p>
            <button onClick={toggleAll} className="text-xs text-green-600 underline">
              {selected.size === features.length ? '全解除' : '全選択'}
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
            {features.map((f, i) => (
              <label key={i} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => {
                    const next = new Set(selected)
                    next.has(i) ? next.delete(i) : next.add(i)
                    setSelected(next)
                  }}
                />
                <span className="text-sm text-gray-700">
                  {f.properties['筆ポリゴンID'] ?? `区画 ${i + 1}`}
                  {f.properties['面積'] && (
                    <span className="text-gray-400 ml-2">{f.properties['面積']} m²</span>
                  )}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={handleImport}
            disabled={selected.size === 0 || loading}
            className="mt-3 w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? '取込中...' : `${selected.size} 件を取込む`}
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 田んぼ一覧ページを作成**

`app/(app)/fields/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import FieldImporter from '@/components/fields/FieldImporter'
import Link from 'next/link'

export default async function FieldsPage() {
  const supabase = await createClient()
  const { data: fields } = await supabase.from('fields').select('*').order('name')

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <h1 className="text-xl font-bold text-gray-800">田んぼ一覧</h1>
      <FieldImporter />
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">名前</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">所有者</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">面積</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(fields ?? []).map(f => (
              <tr key={f.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{f.name}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{f.owner ?? '-'}</td>
                <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                  {f.area_ha ? `${(f.area_ha * 100).toFixed(1)} a` : '-'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/fields/${f.id}`} className="text-green-600 hover:underline text-xs">
                    詳細
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!fields || fields.length === 0) && (
          <p className="text-center py-8 text-gray-400">田んぼが登録されていません</p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add field list page with GeoJSON import from MAFF fude polygon data"
```

---

## Task 7: 田んぼ詳細・作業記録管理

**Files:**
- Create: `app/(app)/fields/[id]/page.tsx`
- Create: `components/fields/WorkRecordForm.tsx`
- Create: `app/api/work-records/route.ts`

- [ ] **Step 1: 作業記録 API を作成**

`app/api/work-records/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('work_records')
    .upsert(body, { onConflict: 'field_id,work_type_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: 作業記録フォームコンポーネントを作成**

`components/fields/WorkRecordForm.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WorkRecord, WorkType, WorkStatus } from '@/lib/supabase/types'
import { STATUS_LABELS } from '@/lib/constants'

interface Props {
  fieldId: string
  workTypes: WorkType[]
  existingRecords: WorkRecord[]
}

export default function WorkRecordForm({ fieldId, workTypes, existingRecords }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  async function updateStatus(workTypeId: string, status: WorkStatus) {
    setLoading(workTypeId)
    await fetch('/api/work-records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ field_id: fieldId, work_type_id: workTypeId, status }),
    })
    setLoading(null)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-4 py-3">作業種別</th>
            <th className="text-left px-4 py-3">状態</th>
            <th className="px-4 py-3">変更</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {workTypes.map(wt => {
            const record = existingRecords.find(r => r.work_type_id === wt.id)
            const status = record?.status ?? 'pending'
            return (
              <tr key={wt.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: wt.color }} />
                  {wt.name}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    status === 'done' ? 'bg-green-100 text-green-700' :
                    status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {STATUS_LABELS[status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <select
                    value={status}
                    disabled={loading === wt.id}
                    onChange={e => updateStatus(wt.id, e.target.value as WorkStatus)}
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {(Object.entries(STATUS_LABELS) as [WorkStatus, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 3: 田んぼ詳細ページを作成**

`app/(app)/fields/[id]/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import WorkRecordForm from '@/components/fields/WorkRecordForm'
import { ChevronLeft } from 'lucide-react'

export default async function FieldDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [fieldRes, workTypesRes, recordsRes] = await Promise.all([
    supabase.from('fields').select('*').eq('id', id).single(),
    supabase.from('work_types').select('*').order('sort_order'),
    supabase.from('work_records').select('*').eq('field_id', id),
  ])

  if (!fieldRes.data) notFound()
  const field = fieldRes.data
  const workTypes = workTypesRes.data ?? []
  const records = recordsRes.data ?? []

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <Link href="/fields" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> 田んぼ一覧に戻る
      </Link>
      <div className="bg-white rounded-xl shadow p-4">
        <h1 className="text-xl font-bold text-gray-800">{field.name}</h1>
        <div className="mt-2 text-sm text-gray-500 space-y-1">
          {field.owner && <p>所有者: {field.owner}</p>}
          {field.area_ha && <p>面積: {(field.area_ha * 100).toFixed(1)} アール</p>}
          {field.notes && <p>備考: {field.notes}</p>}
        </div>
      </div>
      <h2 className="font-semibold text-gray-700">作業進捗</h2>
      <WorkRecordForm fieldId={id} workTypes={workTypes} existingRecords={records} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add field detail page with work record management"
```

---

## Task 8: 作業種別管理画面

**Files:**
- Create: `app/(app)/work-types/page.tsx`
- Create: `components/work-types/WorkTypeManager.tsx`
- Create: `app/api/work-types/route.ts`

- [ ] **Step 1: 作業種別 API を作成**

`app/api/work-types/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const body = await req.json()
  const { data, error } = await supabase.from('work_types').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { id, ...body } = await req.json()
  const { data, error } = await supabase.from('work_types').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { id } = await req.json()
  const { error } = await supabase.from('work_types').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: 作業種別管理コンポーネントを作成**

`components/work-types/WorkTypeManager.tsx`:

```tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { WorkType } from '@/lib/supabase/types'
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react'

const PRESET_COLORS = [
  '#3b82f6','#22c55e','#eab308','#f97316','#ef4444',
  '#8b5cf6','#06b6d4','#ec4899','#10b981','#6b7280',
]

interface Props { workTypes: WorkType[] }

export default function WorkTypeManager({ workTypes }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [adding, setAdding] = useState(false)
  const router = useRouter()

  async function handleAdd() {
    if (!newName.trim()) return
    await fetch('/api/work-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), color: newColor, sort_order: workTypes.length }),
    })
    setNewName('')
    setAdding(false)
    router.refresh()
  }

  async function handleUpdate(id: string) {
    await fetch('/api/work-types', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name: editName, color: editColor }),
    })
    setEditingId(null)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('この作業種別を削除しますか？関連する作業記録も削除されます。')) return
    await fetch('/api/work-types', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  return (
    <div className="space-y-2">
      {workTypes.map(wt => (
        <div key={wt.id} className="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-3">
          {editingId === wt.id ? (
            <>
              <div className="flex gap-1">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setEditColor(c)}
                    className="w-5 h-5 rounded-full border-2"
                    style={{ backgroundColor: c, borderColor: editColor === c ? '#374151' : 'transparent' }}
                  />
                ))}
              </div>
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
              />
              <button onClick={() => handleUpdate(wt.id)} className="text-green-600"><Check size={16} /></button>
              <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={16} /></button>
            </>
          ) : (
            <>
              <span className="w-4 h-4 rounded-full" style={{ backgroundColor: wt.color }} />
              <span className="flex-1 font-medium text-gray-800">{wt.name}</span>
              <button onClick={() => { setEditingId(wt.id); setEditName(wt.name); setEditColor(wt.color) }}
                className="text-gray-400 hover:text-green-600"><Pencil size={16} /></button>
              <button onClick={() => handleDelete(wt.id)}
                className="text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
            </>
          )}
        </div>
      ))}

      {adding ? (
        <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-5 h-5 rounded-full border-2"
                style={{ backgroundColor: c, borderColor: newColor === c ? '#374151' : 'transparent' }}
              />
            ))}
          </div>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="作業名を入力..."
            className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
            autoFocus
          />
          <button onClick={handleAdd} className="text-green-600"><Check size={16} /></button>
          <button onClick={() => setAdding(false)} className="text-gray-400"><X size={16} /></button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 font-medium"
        >
          <Plus size={16} /> 作業種別を追加
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 作業種別ページを作成**

`app/(app)/work-types/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import WorkTypeManager from '@/components/work-types/WorkTypeManager'

export default async function WorkTypesPage() {
  const supabase = await createClient()
  const { data: workTypes } = await supabase.from('work_types').select('*').order('sort_order')

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">作業種別管理</h1>
      <p className="text-sm text-gray-500">作業の種類を自由に追加・編集できます。</p>
      <WorkTypeManager workTypes={workTypes ?? []} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add work type management with custom colors"
```

---

## Task 9: リアルタイム同期

**Files:**
- Create: `hooks/useRealtimeSync.ts`
- Modify: `components/map/MapView.tsx`

- [ ] **Step 1: リアルタイム同期フックを作成**

`hooks/useRealtimeSync.ts`:

```typescript
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function useRealtimeSync(tables: string[]) {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase.channel('realtime-sync')
    tables.forEach(table => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        () => router.refresh()
      )
    })
    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])
}
```

- [ ] **Step 2: 地図画面にリアルタイム同期を追加**

`components/map/MapView.tsx` の先頭に追加：

```tsx
// 既存の import の後に追加
import { useRealtimeSync } from '@/hooks/useRealtimeSync'

// MapView コンポーネント内の useEffect の後に追加
useRealtimeSync(['work_records', 'fields'])
```

- [ ] **Step 3: Supabase でリアルタイムを有効化**

1. Supabase ダッシュボード → Database → Replication
2. `work_records` と `fields` テーブルの Replication を ON にする

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add realtime sync for work records and fields"
```

---

## Task 10: ユーザー招待管理（管理者のみ）

**Files:**
- Create: `app/(app)/users/page.tsx`
- Create: `app/api/users/route.ts`

- [ ] **Step 1: ユーザー API を作成**

`app/api/users/route.ts`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { id, role } = await req.json()
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
```

- [ ] **Step 2: ユーザー管理ページを作成**

`app/(app)/users/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UsersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: me } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') redirect('/map')

  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at')

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-800">ユーザー管理</h1>
      <p className="text-sm text-gray-500">
        新しいメンバーを追加するには、Supabase ダッシュボード →
        Authentication → Users から招待してください。
        招待後にここで権限を設定できます。
      </p>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">名前</th>
              <th className="text-left px-4 py-3">権限</th>
              <th className="text-left px-4 py-3">登録日</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(profiles ?? []).map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    p.role === 'admin' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {p.role === 'admin' ? '管理者' : '作業者'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(p.created_at).toLocaleDateString('ja-JP')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add user management page for admins"
```

---

## Task 11: Vercel デプロイ

- [ ] **Step 1: GitHubにリポジトリを作成してプッシュ**

```bash
git remote add origin https://github.com/YOUR_USERNAME/tanbo-app.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Vercel にデプロイ**

1. https://vercel.com にアクセスしてGitHubアカウントでログイン
2. 「Add New Project」→ `tanbo-app` リポジトリを選択
3. Environment Variables に `.env.local` の内容を入力：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. 「Deploy」をクリック

- [ ] **Step 3: Supabase の認証URLを更新**

1. Supabase ダッシュボード → Authentication → URL Configuration
2. `Site URL` に `https://your-app.vercel.app` を設定
3. `Redirect URLs` に `https://your-app.vercel.app/**` を追加

- [ ] **Step 4: 本番動作確認**

```
✅ ログインできる
✅ 地図が表示される
✅ 田んぼのポリゴンが表示される
✅ 作業進捗の更新が地図に反映される
✅ スマホで操作できる
```

---

## コスト見積もり

| サービス | 無料枠 | 超過時 |
|---------|--------|--------|
| Vercel | 無料（商用も可） | 月$20〜 |
| Supabase | DB 500MB、50,000 MAU | 月$25〜 |
| OpenStreetMap | 完全無料 | - |

**→ 数十人規模・数百件データなら無料枠で運用可能**

---

## 農水省 筆ポリゴンデータの入手先

**https://open.fude.maff.go.jp/**

1. 都道府県を選択
2. 市区町村を選択
3. 「GeoJSON」形式でダウンロード
4. アプリの「田んぼ一覧」→「筆ポリゴンデータ取込」からアップロード
