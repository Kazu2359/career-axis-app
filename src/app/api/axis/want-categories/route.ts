import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError, findLengthViolation } from "@/lib/api/errors";
import { STANDARD_WANT_CATEGORIES, WANT_WEIGHT_TOTAL } from "@/lib/axis/wantCategories";
import type { WantCategory } from "@/lib/axis/types";

interface WantCategoryRow {
  id: string;
  category_name: string;
  weight: number;
  is_custom: boolean;
}

function rowToWantCategory(row: WantCategoryRow): WantCategory {
  return {
    id: row.id,
    categoryName: row.category_name,
    weight: row.weight,
    isCustom: row.is_custom,
  };
}

export async function GET() {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { data, error } = await supabase
    .from("axis_want_categories")
    .select("id, category_name, weight, is_custom")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) return dbError(error);

  if (data && data.length > 0) {
    return NextResponse.json(data.map(rowToWantCategory));
  }

  // 初回アクセス時は標準7カテゴリを重み0で自動生成する
  const { data: seeded, error: seedError } = await supabase
    .from("axis_want_categories")
    .insert(
      STANDARD_WANT_CATEGORIES.map((name) => ({
        user_id: user.id,
        category_name: name,
        weight: 0,
        is_custom: false,
      })),
    )
    .select("id, category_name, weight, is_custom");

  if (seedError) return dbError(seedError);
  return NextResponse.json((seeded ?? []).map(rowToWantCategory));
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: { categoryName?: string };
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  if (!body.categoryName?.trim()) {
    return apiError("VALIDATION_ERROR", "categoryNameは必須です");
  }
  const lengthError = findLengthViolation([["categoryName", body.categoryName, 100]]);
  if (lengthError) return apiError("VALIDATION_ERROR", lengthError);

  const { data, error } = await supabase
    .from("axis_want_categories")
    .insert({
      user_id: user.id,
      category_name: body.categoryName,
      weight: 0,
      is_custom: true,
    })
    .select("id, category_name, weight, is_custom")
    .single<WantCategoryRow>();

  if (error) return dbError(error);
  return NextResponse.json(rowToWantCategory(data));
}

export async function PUT(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: { weights?: { id: string; weight: number }[] };
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  const weights = body.weights ?? [];
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  if (total !== WANT_WEIGHT_TOTAL) {
    return apiError(
      "VALIDATION_ERROR",
      `Want重み配分の合計が${WANT_WEIGHT_TOTAL}になっていません（現在: ${total}）`,
      { total },
    );
  }

  const updated: WantCategoryRow[] = [];
  for (const w of weights) {
    const { data, error } = await supabase
      .from("axis_want_categories")
      .update({ weight: w.weight })
      .eq("id", w.id)
      .eq("user_id", user.id)
      .select("id, category_name, weight, is_custom")
      .maybeSingle<WantCategoryRow>();
    if (error) return dbError(error);
    if (!data) return apiError("NOT_FOUND", `カテゴリが見つかりません: ${w.id}`);
    updated.push(data);
  }

  return NextResponse.json(updated.map(rowToWantCategory));
}
