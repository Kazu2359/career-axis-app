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

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { data, error } = await supabase
    .from("axis_must_conditions")
    .select("id, category_label, condition_text, threshold_value")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return dbError(error);
  return NextResponse.json((data ?? []).map(rowToMustCondition));
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: Partial<MustCondition>;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  if (!body.categoryLabel?.trim() || !body.conditionText?.trim()) {
    return apiError("VALIDATION_ERROR", "categoryLabelとconditionTextは必須です");
  }
  const lengthError = findLengthViolation([
    ["categoryLabel", body.categoryLabel, 100],
    ["conditionText", body.conditionText, 500],
  ]);
  if (lengthError) return apiError("VALIDATION_ERROR", lengthError);

  const { data, error } = await supabase
    .from("axis_must_conditions")
    .insert({
      user_id: user.id,
      category_label: body.categoryLabel,
      condition_text: body.conditionText,
      threshold_value: body.thresholdValue ?? null,
    })
    .select("id, category_label, condition_text, threshold_value")
    .single<MustConditionRow>();

  if (error) return dbError(error);
  return NextResponse.json(rowToMustCondition(data));
}
