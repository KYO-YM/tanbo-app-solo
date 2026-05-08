-- 新規ユーザー登録時にprofileと初期作業種別を自動作成するトリガー

-- supabase_auth_adminへの権限付与（SECURITY DEFINERトリガーに必要）
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON public.profiles TO supabase_auth_admin;
GRANT ALL ON public.work_types TO supabase_auth_admin;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- プロフィール作成
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  -- 初期作業種別を作成
  INSERT INTO public.work_types (user_id, name, color, sort_order) VALUES
    (NEW.id, '代掻き',   '#3b82f6', 1),
    (NEW.id, '田植え',   '#22c55e', 2),
    (NEW.id, '除草',     '#eab308', 3),
    (NEW.id, '水管理',   '#06b6d4', 4),
    (NEW.id, '追肥',     '#a855f7', 5),
    (NEW.id, '収穫',     '#f97316', 6);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
