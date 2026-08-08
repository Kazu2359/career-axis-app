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

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { data, error } = await supabase
    .from("selections")
    .select(
      "id, company_name, position, industry_major, industry_type_major, industry_minor, company_url, note, status, must_condition_check, want_fit_scores, created_at, updated_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<SelectionRow>();

  if (error) return dbError(error);
  if (!data) return apiError("NOT_FOUND", "指定された応募先が見つかりません");
  return NextResponse.json(rowToSelection(data));
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: Partial<Selection>;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
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

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.companyName !== undefined) update.company_name = body.companyName;
  if (body.position !== undefined) update.position = body.position;
  if (body.industryMajor !== undefined) update.industry_major = body.industryMajor;
  if (body.industryTypeMajor !== undefined)
    update.industry_type_major = body.industryTypeMajor;
  if (body.industryMinor !== undefined) update.industry_minor = body.industryMinor;
  if (body.companyUrl !== undefined) update.company_url = body.companyUrl;
  if (body.note !== undefined) update.note = body.note;
  if (body.status !== undefined) update.status = body.status;

  const { data, error } = await supabase
    .from("selections")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, company_name, position, industry_major, industry_type_major, industry_minor, company_url, note, status, must_condition_check, want_fit_scores, created_at, updated_at",
    )
    .maybeSingle<SelectionRow>();

  if (error) return dbError(error);
  if (!data) return apiError("NOT_FOUND", "指定された応募先が見つかりません");
  return NextResponse.json(rowToSelection(data));
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { error, count } = await supabase
    .from("selections")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return dbError(error);
  if (!count) return apiError("NOT_FOUND", "指定された応募先が見つかりません");
  return new NextResponse(null, { status: 204 });
}
