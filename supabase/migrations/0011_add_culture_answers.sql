-- 企業カルチャー診断(キャリアアンカーとの相性確認用)の回答を保存する列を追加する。
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table selections add column if not exists culture_answers jsonb;
