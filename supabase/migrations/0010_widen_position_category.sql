-- 職種欄を廃止し職種カテゴリ一本にまとめるため、文字数上限をposition(200)と揃える。
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table selections drop constraint if exists selections_position_category_length;

alter table selections
  add constraint selections_position_category_length check (
    position_category is null or char_length(position_category) <= 200
  );
