import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError } from "@/lib/api/errors";
import { parseSelectionsCsv, type SelectionRowError } from "@/lib/selections/csv";

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: { csv?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  if (!body.csv?.trim()) {
    return apiError("VALIDATION_ERROR", "csvは必須です");
  }

  const MAX_IMPORT_ROWS = 500;
  const lineCount = body.csv.split("\n").length;
  if (lineCount > MAX_IMPORT_ROWS + 1) {
    return apiError(
      "VALIDATION_ERROR",
      `CSVは最大${MAX_IMPORT_ROWS}行までです（ヘッダー行を除く）`,
    );
  }

  const { data: wantCategories, error: wantError } = await supabase
    .from("axis_want_categories")
    .select("id, category_name")
    .eq("user_id", user.id);

  if (wantError) return dbError(wantError);

  const {
    rows,
    errors,
    hasPositionColumn,
    hasStatusColumn,
    hasIndustryColumn,
    hasCompanyUrlColumn,
    hasNoteColumn,
  } = parseSelectionsCsv(
      body.csv,
      (wantCategories ?? []).map((c) => ({
        id: c.id,
        categoryName: c.category_name,
      })),
    );
  const rowErrors: SelectionRowError[] = [...errors];

  const { data: existing, error: fetchError } = await supabase
    .from("selections")
    .select("id, company_name, want_fit_scores")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (fetchError) return dbError(fetchError);

  interface ExistingSelection {
    id: string;
    wantFitScores: Record<string, number> | null;
  }

  const byCompany = new Map<string, ExistingSelection>();
  for (const row of existing ?? []) {
    if (!byCompany.has(row.company_name)) {
      byCompany.set(row.company_name, {
        id: row.id,
        wantFitScores: row.want_fit_scores,
      });
    }
  }

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existingSelection = byCompany.get(row.companyName);
    if (existingSelection) {
      const update: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (hasPositionColumn) update.position = row.position;
      if (hasStatusColumn) update.status = row.status;
      if (hasIndustryColumn) update.industry = row.industry || null;
      if (hasCompanyUrlColumn) update.company_url = row.companyUrl || null;
      if (hasNoteColumn) update.note = row.note || null;
      if (Object.keys(row.wantScores).length > 0) {
        update.want_fit_scores = {
          ...(existingSelection.wantFitScores ?? {}),
          ...row.wantScores,
        };
      }

      const { error } = await supabase
        .from("selections")
        .update(update)
        .eq("id", existingSelection.id)
        .eq("user_id", user.id);

      if (error) {
        console.error("[db error]", error.message);
        rowErrors.push({ line: row.line, message: "更新に失敗しました" });
        continue;
      }
      updated++;
    } else {
      const { data, error } = await supabase
        .from("selections")
        .insert({
          user_id: user.id,
          company_name: row.companyName,
          position: row.position,
          industry: row.industry || null,
          company_url: row.companyUrl || null,
          note: row.note || null,
          status: row.status,
          want_fit_scores: row.wantScores,
        })
        .select("id")
        .single<{ id: string }>();

      if (error) {
        console.error("[db error]", error.message);
        rowErrors.push({ line: row.line, message: "登録に失敗しました" });
        continue;
      }
      byCompany.set(row.companyName, { id: data.id, wantFitScores: row.wantScores });
      created++;
    }
  }

  return NextResponse.json({ created, updated, errors: rowErrors });
}
