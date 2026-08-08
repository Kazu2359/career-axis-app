-- company_url未適用のケースに備え、company_urlも合わせて安全に(重複実行してもエラーにならない形で)適用する。
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table selections add column if not exists company_url text;
alter table selections add column if not exists note text;

do $$
begin
  alter table selections add constraint selections_company_url_length check (
    company_url is null or char_length(company_url) <= 500
  );
exception when duplicate_object then null;
end $$;

do $$
begin
  alter table selections add constraint selections_note_length check (
    note is null or char_length(note) <= 4000
  );
exception when duplicate_object then null;
end $$;
