-- selectionsに企業URL列を追加
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table selections add column company_url text;

alter table selections
  add constraint selections_company_url_length check (
    company_url is null or char_length(company_url) <= 500
  );
