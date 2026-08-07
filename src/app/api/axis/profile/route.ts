import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError, findLengthViolation } from "@/lib/api/errors";
import {
  type AxisProfileRow,
  partialAxisProfileToRow,
  rowToAxisProfile,
} from "@/lib/axis/mappers";
import type { AxisProfile } from "@/lib/axis/types";
import {
  MOTIVATION_TYPES,
  TRANSITION_PATHS,
  TRANSITION_TIMEFRAMES,
} from "@/lib/axis/types";

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { data, error } = await supabase
    .from("axis_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<AxisProfileRow>();

  if (error) return dbError(error);
  return NextResponse.json(rowToAxisProfile(data));
}

const MOTIVATION_VALUES = new Set(MOTIVATION_TYPES.map((m) => m.value));

export async function PUT(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: Partial<AxisProfile>;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  if (
    body.motivationType != null &&
    !MOTIVATION_VALUES.has(body.motivationType)
  ) {
    return apiError("VALIDATION_ERROR", "motivationTypeの値が不正です");
  }
  if (
    body.northStarTimeframe != null &&
    !TRANSITION_TIMEFRAMES.includes(body.northStarTimeframe)
  ) {
    return apiError("VALIDATION_ERROR", "northStarTimeframeの値が不正です");
  }
  if (
    body.allowedTransitionPaths != null &&
    !body.allowedTransitionPaths.every((p) =>
      (TRANSITION_PATHS as readonly string[]).includes(p),
    )
  ) {
    return apiError("VALIDATION_ERROR", "allowedTransitionPathsに不正な値が含まれています");
  }
  const lengthError = findLengthViolation([
    ["willEnjoyText", body.willEnjoyText, 4000],
    ["willDrainText", body.willDrainText, 4000],
    ["canReliedText", body.canReliedText, 4000],
    ["canProudText", body.canProudText, 4000],
    ["mustMarketText", body.mustMarketText, 4000],
    ["approachStyleText", body.approachStyleText, 4000],
    ["motivationNote", body.motivationNote, 4000],
    ["entryStrengthText", body.entryStrengthText, 4000],
    ["northStarText", body.northStarText, 4000],
  ]);
  if (lengthError) return apiError("VALIDATION_ERROR", lengthError);

  const row = partialAxisProfileToRow(body);
  const { data, error } = await supabase
    .from("axis_profiles")
    .upsert({ user_id: user.id, ...row }, { onConflict: "user_id" })
    .select("*")
    .single<AxisProfileRow>();

  if (error) return dbError(error);
  return NextResponse.json(rowToAxisProfile(data));
}
