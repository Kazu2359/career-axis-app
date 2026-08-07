import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError } from "@/lib/api/errors";
import { needsRediagnosis } from "@/lib/axis/anchorQuestions";
import { rowToAxisProfile, type AxisProfileRow } from "@/lib/axis/mappers";
import type { AnchorType, MustCondition, WantCategory } from "@/lib/axis/types";

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const [profileRes, anchorRes, mustRes, wantRes] = await Promise.all([
    supabase
      .from("axis_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle<AxisProfileRow>(),
    supabase
      .from("axis_anchor_scores")
      .select("anchor_type, score")
      .eq("user_id", user.id),
    supabase
      .from("axis_must_conditions")
      .select("id, category_label, condition_text, threshold_value")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("axis_want_categories")
      .select("id, category_name, weight, is_custom")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ]);

  const firstError =
    profileRes.error || anchorRes.error || mustRes.error || wantRes.error;
  if (firstError) return dbError(firstError);

  const anchorScores = (anchorRes.data ?? []).map((row) => ({
    anchor: row.anchor_type as AnchorType,
    score: row.score as number,
  }));

  const mustConditions: MustCondition[] = (mustRes.data ?? []).map((row) => ({
    id: row.id,
    categoryLabel: row.category_label,
    conditionText: row.condition_text,
    thresholdValue: row.threshold_value,
  }));

  const wantCategories: WantCategory[] = (wantRes.data ?? []).map((row) => ({
    id: row.id,
    categoryName: row.category_name,
    weight: row.weight,
    isCustom: row.is_custom,
  }));

  return NextResponse.json({
    profile: rowToAxisProfile(profileRes.data),
    anchorScores,
    needsRediagnosis: needsRediagnosis(anchorScores),
    mustConditions,
    wantCategories,
  });
}
