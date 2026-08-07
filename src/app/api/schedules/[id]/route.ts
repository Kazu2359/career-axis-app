import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { apiError, dbError, findLengthViolation } from "@/lib/api/errors";
import { SCHEDULE_EVENT_TYPES, type Schedule } from "@/lib/schedules/types";

interface ScheduleRow {
  id: string;
  selection_id: string | null;
  title: string;
  event_datetime: string;
  event_type: string;
  note: string | null;
}

function rowToSchedule(row: ScheduleRow): Schedule {
  return {
    id: row.id,
    selectionId: row.selection_id,
    title: row.title,
    eventDatetime: row.event_datetime,
    eventType: row.event_type as Schedule["eventType"],
    note: row.note,
  };
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { data, error } = await supabase
    .from("schedules")
    .select("id, selection_id, title, event_datetime, event_type, note")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<ScheduleRow>();

  if (error) return dbError(error);
  if (!data) return apiError("NOT_FOUND", "指定された予定が見つかりません");
  return NextResponse.json(rowToSchedule(data));
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: Partial<Schedule>;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  if (body.eventType && !SCHEDULE_EVENT_TYPES.includes(body.eventType)) {
    return apiError("VALIDATION_ERROR", "eventTypeの値が不正です");
  }
  const lengthError = findLengthViolation([
    ["title", body.title, 200],
    ["note", body.note ?? undefined, 2000],
  ]);
  if (lengthError) return apiError("VALIDATION_ERROR", lengthError);

  const update: Record<string, unknown> = {};
  if (body.title !== undefined) update.title = body.title;
  if (body.eventDatetime !== undefined) update.event_datetime = body.eventDatetime;
  if (body.eventType !== undefined) update.event_type = body.eventType;
  if (body.note !== undefined) update.note = body.note;
  if (body.selectionId !== undefined) update.selection_id = body.selectionId;

  const { data, error } = await supabase
    .from("schedules")
    .update(update)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, selection_id, title, event_datetime, event_type, note")
    .maybeSingle<ScheduleRow>();

  if (error) return dbError(error);
  if (!data) return apiError("NOT_FOUND", "指定された予定が見つかりません");
  return NextResponse.json(rowToSchedule(data));
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const { error, count } = await supabase
    .from("schedules")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return dbError(error);
  if (!count) return apiError("NOT_FOUND", "指定された予定が見つかりません");
  return new NextResponse(null, { status: 204 });
}
