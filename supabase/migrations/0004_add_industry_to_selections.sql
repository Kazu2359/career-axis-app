-- selectionsに業界カラムを追加（業界マップ機能用）
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table selections add column industry text;

alter table selections
  add constraint selections_industry_length check (
    industry is null or char_length(industry) <= 50
  );
