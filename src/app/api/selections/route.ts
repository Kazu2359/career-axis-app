import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError, findLengthViolation } from "@/lib/api/errors";
import { SELECTION_STATUSES, type Selection } from "@/lib/selections/types";

interface SelectionRow {
  id: string;
  company_name: string;
  position: string;
  industry_major: string | null;
  industry_type_major: string | null;
  industry_minor: string | null;
  company_url: string | null;
  note: string | null;
  status: string;
  must_condition_check: Record<string, boolean> | null;
  want_fit_scores: Record<string, number> | null;
  created_at: string;
  updated_at: string;
}

function rowToSelection(row: SelectionRow): Selection {
  return {
    id: row.id,
    companyName: row.company_name,
    position: row.position,
    industryMajor: row.industry_major,
    industryTypeMajor: row.industry_type_major,
    industryMinor: row.industry_minor,
    companyUrl: row.company_url,
    note: row.note,
    status: row.status as Selection["status"],
    mustConditionCheck: row.must_condition_check,
    wantFitScores: row.want_fit_scores,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const status = request.nextUrl.searchParams.get("status");

  let query = supabase
    .from("selections")
    .select(
      "id, company_name, position, industry_major, industry_type_major, industry_minor, company_url, note, status, must_condition_check, want_fit_scores, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return dbError(error);
  return NextResponse.json((data ?? []).map(rowToSelection));
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: Partial<Selection>;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  if (!body.companyName?.trim()) {
    return apiError("VALIDATION_ERROR", "companyNameは必須です");
  }
  if (body.status && !SELECTION_STATUSES.includes(body.status)) {
    return apiError("VALIDATION_ERROR", "statusの値が不正です");
  }
  const lengthError = findLengthViolation([
    ["companyName", body.companyName, 200],
    ["position", body.position, 200],
    ["industryMajor", body.industryMajor ?? undefined, 50],
    ["industryTypeMajor", body.industryTypeMajor ?? undefined, 50],
    ["industryMinor", body.industryMinor ?? undefined, 50],
    ["companyUrl", body.companyUrl ?? undefined, 500],
    ["note", body.note ?? undefined, 4000],
  ]);
  if (lengthError) return apiError("VALIDATION_ERROR", lengthError);

  const { data, error } = await supabase
    .from("selections")
    .insert({
      user_id: user.id,
      company_name: body.companyName,
      position: body.position ?? "",
      industry_major: body.industryMajor ?? null,
      industry_type_major: body.industryTypeMajor ?? null,
      industry_minor: body.industryMinor ?? null,
      company_url: body.companyUrl ?? null,
      note: body.note ?? null,
      status: body.status ?? "応募",
    })
    .select(
      "id, company_name, position, industry_major, industry_type_major, industry_minor, company_url, note, status, must_condition_check, want_fit_scores, created_at, updated_at",
    )
    .single<SelectionRow>();

  if (error) return dbError(error);
  return NextResponse.json(rowToSelection(data));
}
