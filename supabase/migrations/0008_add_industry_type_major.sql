-- 「業種・大分類」列を追加する。
-- industry_major(業界)・industry_minor(業種・中分類)は既存のまま、業種の大分類だけ新設する。
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table selections add column if not exists industry_type_major text;

do $$
begin
  alter table selections add constraint selections_industry_type_major_length check (
    industry_type_major is null or char_length(industry_type_major) <= 50
  );
exception when duplicate_object then null;
end $$;
