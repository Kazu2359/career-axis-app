-- 自由入力テキストへのCHECK制約（アプリ側バリデーションのバックストップ）
-- Supabaseダッシュボード > SQL Editor に貼り付けて実行する。

alter table axis_profiles
  add constraint axis_profiles_text_length check (
    char_length(will_enjoy_text) <= 4000 and
    char_length(will_drain_text) <= 4000 and
    char_length(can_relied_text) <= 4000 and
    char_length(can_proud_text) <= 4000 and
    char_length(must_market_text) <= 4000 and
    char_length(approach_style_text) <= 4000 and
    char_length(motivation_note) <= 4000 and
    char_length(entry_strength_text) <= 4000 and
    char_length(north_star_text) <= 4000
  );

alter table axis_must_conditions
  add constraint axis_must_conditions_text_length check (
    char_length(category_label) <= 100 and
    char_length(condition_text) <= 500
  );

alter table axis_want_categories
  add constraint axis_want_categories_text_length check (
    char_length(category_name) <= 100
  );

alter table selections
  add constraint selections_text_length check (
    char_length(company_name) <= 200 and
    char_length(position) <= 200
  );

alter table schedules
  add constraint schedules_text_length check (
    char_length(title) <= 200 and
    (note is null or char_length(note) <= 2000)
  );
