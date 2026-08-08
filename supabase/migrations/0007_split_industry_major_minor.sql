-- 業界を大分類(industry_major)・中分類(industry_minor)の2階層に分割する。
-- 既存のindustry列は中分類として使う(データはそのまま維持)。
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table selections rename column industry to industry_minor;
alter table selections add column if not exists industry_major text;

do $$
begin
  alter table selections add constraint selections_industry_major_length check (
    industry_major is null or char_length(industry_major) <= 50
  );
exception when duplicate_object then null;
end $$;
