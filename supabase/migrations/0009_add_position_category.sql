-- 「職種カテゴリ」列を追加する。既存のposition(自由記述)はそのまま維持。
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table selections add column if not exists position_category text;

do $$
begin
  alter table selections add constraint selections_position_category_length check (
    position_category is null or char_length(position_category) <= 50
  );
exception when duplicate_object then null;
end $$;
