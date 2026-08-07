import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError } from "@/lib/api/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { data: existing, error: fetchError } = await supabase
    .from("axis_want_categories")
    .select("id, is_custom")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<{ id: string; is_custom: boolean }>();

  if (fetchError) return dbError(fetchError);
  if (!existing) return apiError("NOT_FOUND", "指定されたカテゴリが見つかりません");
  if (!existing.is_custom) {
    return apiError("FORBIDDEN", "標準カテゴリは削除できません");
  }

  const { error: deleteError } = await supabase
    .from("axis_want_categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (deleteError) return dbError(deleteError);
  return new NextResponse(null, { status: 204 });
}
