-- profiles
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  line_user_id TEXT,
  line_token   TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- fields（田んぼ）
CREATE TABLE fields (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  owner            TEXT,
  area_ha          NUMERIC(6,4),
  geometry         JSONB NOT NULL,
  fude_id          TEXT,
  notes            TEXT,
  next_water_check TIMESTAMPTZ,
  transplant_date  DATE,
  variety          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- work_types（作業種別）
CREATE TABLE work_types (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6b7280',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- work_records（作業記録）
CREATE TABLE work_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id     UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  work_type_id UUID NOT NULL REFERENCES work_types(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'in_progress', 'done')),
  work_date    DATE,
  memo         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, work_type_id)
);

-- harvests（収穫量）
CREATE TABLE harvests (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id   UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  year       INTEGER NOT NULL,
  amount_kg  NUMERIC(8,1),
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(field_id, year)
);

-- expenses（費用管理）
CREATE TABLE expenses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id   UUID REFERENCES fields(id) ON DELETE SET NULL,
  year       INTEGER NOT NULL,
  date       DATE,
  category   TEXT NOT NULL,
  amount     INTEGER NOT NULL,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- field_photos（田んぼ写真）
CREATE TABLE field_photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_id   UUID NOT NULL REFERENCES fields(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  caption    TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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

-- line_link_code（LINE連携コード）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS line_link_code TEXT UNIQUE;
