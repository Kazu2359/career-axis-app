import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError } from "@/lib/api/errors";
import type { Selection } from "@/lib/selections/types";

interface SelectionRow {
  id: string;
  company_name: string;
  position: string;
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
    status: row.status as Selection["status"],
    mustConditionCheck: row.must_condition_check,
    wantFitScores: row.want_fit_scores,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

/**
 * Want条件ごとの満たし度（1〜5）を保存する。
 * 求人の構造化データが無く自動判定できないため、Must条件の照合と同様に手動評価方式にしている。
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: { scores?: Record<string, number> };
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  const scores = body.scores ?? {};
  for (const rating of Object.values(scores)) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return apiError("VALIDATION_ERROR", "評価は1〜5の整数で指定してください");
    }
  }

  const { data, error } = await supabase
    .from("selections")
    .update({
      want_fit_scores: scores,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, company_name, position, status, must_condition_check, want_fit_scores, created_at, updated_at",
    )
    .maybeSingle<SelectionRow>();

  if (error) return dbError(error);
  if (!data) return apiError("NOT_FOUND", "指定された応募先が見つかりません");
  return NextResponse.json(rowToSelection(data));
}
