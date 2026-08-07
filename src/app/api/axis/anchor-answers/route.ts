import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError } from "@/lib/api/errors";
import {
  ANCHOR_QUESTIONS,
  needsRediagnosis,
  scoreAnchorAnswers,
  type AnchorAnswer,
} from "@/lib/axis/anchorQuestions";

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: { answers?: AnchorAnswer[] };
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  const answers = body.answers ?? [];
  if (answers.length !== ANCHOR_QUESTIONS.length) {
    return apiError(
      "VALIDATION_ERROR",
      `16問すべての回答が必要です（受信: ${answers.length}件）`,
    );
  }
  const validIds = new Set(ANCHOR_QUESTIONS.map((q) => q.id));
  const isValid = answers.every(
    (a) =>
      validIds.has(a.questionId) && (a.choice === "A" || a.choice === "B"),
  );
  if (!isValid) {
    return apiError("VALIDATION_ERROR", "回答の形式が不正です");
  }

  const scores = scoreAnchorAnswers(answers);

  const { error: deleteError } = await supabase
    .from("axis_anchor_scores")
    .delete()
    .eq("user_id", user.id);
  if (deleteError) return dbError(deleteError);

  const { error: insertError } = await supabase
    .from("axis_anchor_scores")
    .insert(
      scores.map((s) => ({
        user_id: user.id,
        anchor_type: s.anchor,
        score: s.score,
      })),
    );
  if (insertError) return dbError(insertError);

  return NextResponse.json({
    scores,
    needsRediagnosis: needsRediagnosis(scores),
  });
}
