import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError } from "@/lib/api/errors";
import type { Selection } from "@/lib/selections/types";
import { CULTURE_QUESTIONS } from "@/lib/axis/cultureQuestions";

interface SelectionRow {
  id: string;
  company_name: string;
  position: string;
  position_category: string | null;
  industry_major: string | null;
  industry_type_major: string | null;
  industry_minor: string | null;
  company_url: string | null;
  note: string | null;
  status: string;
  must_condition_check: Record<string, boolean> | null;
  want_fit_scores: Record<string, number> | null;
  culture_answers: Record<string, "A" | "B"> | null;
  created_at: string;
  updated_at: string;
}

function rowToSelection(row: SelectionRow): Selection {
  return {
    id: row.id,
    companyName: row.company_name,
    position: row.position,
    positionCategory: row.position_category,
    industryMajor: row.industry_major,
    industryTypeMajor: row.industry_type_major,
    industryMinor: row.industry_minor,
    companyUrl: row.company_url,
    note: row.note,
    status: row.status as Selection["status"],
    mustConditionCheck: row.must_condition_check,
    wantFitScores: row.want_fit_scores,
    cultureAnswers: row.culture_answers,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

const VALID_IDS = new Set(CULTURE_QUESTIONS.map((q) => String(q.id)));

/**
 * 企業カルチャー診断(キャリアアンカーとの相性確認用)の回答を保存する。
 * ユーザー側のキャリアアンカー診断と対になる、企業・仕事の傾向を答える二択8問。
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: { answers?: Record<string, string> };
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  const answers = body.answers ?? {};
  for (const [key, value] of Object.entries(answers)) {
    if (!VALID_IDS.has(key) || (value !== "A" && value !== "B")) {
      return apiError("VALIDATION_ERROR", "回答の内容が不正です");
    }
  }

  const { data, error } = await supabase
    .from("selections")
    .update({
      culture_answers: answers,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, company_name, position, position_category, industry_major, industry_type_major, industry_minor, company_url, note, status, must_condition_check, want_fit_scores, culture_answers, created_at, updated_at",
    )
    .maybeSingle<SelectionRow>();

  if (error) return dbError(error);
  if (!data) return apiError("NOT_FOUND", "指定された応募先が見つかりません");
  return NextResponse.json(rowToSelection(data));
}
