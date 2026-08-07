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

export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const selectionId = request.nextUrl.searchParams.get("selectionId");

  let query = supabase
    .from("schedules")
    .select("id, selection_id, title, event_datetime, event_type, note")
    .eq("user_id", user.id)
    .order("event_datetime", { ascending: true });

  if (from) query = query.gte("event_datetime", from);
  if (to) query = query.lte("event_datetime", to);
  if (selectionId) query = query.eq("selection_id", selectionId);

  const { data, error } = await query;
  if (error) return dbError(error);
  return NextResponse.json((data ?? []).map(rowToSchedule));
}

export async function POST(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return apiError("UNAUTHORIZED", "ログインが必要です");

  let body: Partial<Schedule>;
  try {
    body = await request.json();
  } catch {
    return apiError("VALIDATION_ERROR", "リクエストボディがJSONではありません");
  }

  if (!body.title?.trim() || !body.eventDatetime) {
    return apiError("VALIDATION_ERROR", "titleとeventDatetimeは必須です");
  }
  if (body.eventType && !SCHEDULE_EVENT_TYPES.includes(body.eventType)) {
    return apiError("VALIDATION_ERROR", "eventTypeの値が不正です");
  }
  const lengthError = findLengthViolation([
    ["title", body.title, 200],
    ["note", body.note ?? undefined, 2000],
  ]);
  if (lengthError) return apiError("VALIDATION_ERROR", lengthError);

  const { data, error } = await supabase
    .from("schedules")
    .insert({
      user_id: user.id,
      selection_id: body.selectionId ?? null,
      title: body.title,
      event_datetime: body.eventDatetime,
      event_type: body.eventType ?? "その他",
      note: body.note ?? null,
    })
    .select("id, selection_id, title, event_datetime, event_type, note")
    .single<ScheduleRow>();

  if (error) return dbError(error);
  return NextResponse.json(rowToSchedule(data));
}
