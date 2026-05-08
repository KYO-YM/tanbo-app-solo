-- RLS 有効化
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE fields       ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_types   ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE harvests     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE field_photos ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のプロフィールのみ
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- fields: 自分のデータのみ
CREATE POLICY "fields_select" ON fields FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fields_insert" ON fields FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fields_update" ON fields FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fields_delete" ON fields FOR DELETE USING (auth.uid() = user_id);

-- work_types: 自分のデータのみ
CREATE POLICY "work_types_select" ON work_types FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "work_types_insert" ON work_types FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "work_types_update" ON work_types FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "work_types_delete" ON work_types FOR DELETE USING (auth.uid() = user_id);

-- work_records: 自分のデータのみ
CREATE POLICY "work_records_select" ON work_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "work_records_insert" ON work_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "work_records_update" ON work_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "work_records_delete" ON work_records FOR DELETE USING (auth.uid() = user_id);

-- harvests: 自分のデータのみ
CREATE POLICY "harvests_select" ON harvests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "harvests_insert" ON harvests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "harvests_update" ON harvests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "harvests_delete" ON harvests FOR DELETE USING (auth.uid() = user_id);

-- expenses: 自分のデータのみ
CREATE POLICY "expenses_select" ON expenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "expenses_insert" ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "expenses_update" ON expenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "expenses_delete" ON expenses FOR DELETE USING (auth.uid() = user_id);

-- field_photos: 自分のデータのみ
CREATE POLICY "field_photos_select" ON field_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "field_photos_insert" ON field_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "field_photos_delete" ON field_photos FOR DELETE USING (auth.uid() = user_id);

-- 農薬・肥料記録
ALTER TABLE pesticide_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "pesticide_select" ON pesticide_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "pesticide_insert" ON pesticide_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "pesticide_update" ON pesticide_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "pesticide_delete" ON pesticide_records FOR DELETE USING (auth.uid() = user_id);

-- 作業日誌
ALTER TABLE work_diary ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "diary_select" ON work_diary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "diary_insert" ON work_diary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "diary_update" ON work_diary FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "diary_delete" ON work_diary FOR DELETE USING (auth.uid() = user_id);
