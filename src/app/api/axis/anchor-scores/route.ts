import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError } from "@/lib/api/errors";
import { needsRediagnosis } from "@/lib/axis/anchorQuestions";
import type { AnchorType } from "@/lib/axis/types";

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { data, error } = await supabase
    .from("axis_anchor_scores")
    .select("anchor_type, score")
    .eq("user_id", user.id);

  if (error) return dbError(error);

  const scores = (data ?? []).map((row) => ({
    anchor: row.anchor_type as AnchorType,
    score: row.score as number,
  }));

  return NextResponse.json({
    scores,
    needsRediagnosis: needsRediagnosis(scores),
  });
}
