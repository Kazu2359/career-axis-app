-- 就活軸（Want条件）と企業のフィット評価機能
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table selections add column if not exists want_fit_scores jsonb;
