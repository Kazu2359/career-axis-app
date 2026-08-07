import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError, findLengthViolation } from "@/lib/api/errors";
import type { MustCondition } from "@/lib/axis/types";

interface MustConditionRow {
  id: string;
  category_label: string;
  condition_text: string;
  threshold_value: number | null;
}

function rowToMustCondition(row: MustConditionRow): MustCondition {
  return {
    id: row.id,
    categoryLabel: row.category_label,
    conditionText: row.condition_text,
    thresholdValue: row.threshold_value,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: Partial<MustCondition>;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  const lengthError = findLengthViolation([
    ["categoryLabel", body.categoryLabel, 100],
    ["conditionText", body.conditionText, 500],
  ]);
  if (lengthError) return apiError("VALIDATION_ERROR", lengthError);

  const update: Record<string, unknown> = {};
  if (body.categoryLabel !== undefined) update.category_label = body.categoryLabel;
  if (body.conditionText !== undefined) update.condition_text = body.conditionText;
  if (body.thresholdValue !== undefined) update.threshold_value = body.thresholdValue;

  const { data, error } = await supabase
    .from("axis_must_conditions")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, category_label, condition_text, threshold_value")
    .maybeSingle<MustConditionRow>();

  if (error) return dbError(error);
  if (!data) return apiError("NOT_FOUND", "指定された条件が見つかりません");
  return NextResponse.json(rowToMustCondition(data));
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { error, count } = await supabase
    .from("axis_must_conditions")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return dbError(error);
  if (!count) return apiError("NOT_FOUND", "指定された条件が見つかりません");
  return new NextResponse(null, { status: 204 });
}
