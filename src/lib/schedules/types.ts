export const SCHEDULE_EVENT_TYPES = ["面接", "締切", "その他"] as const;
export type ScheduleEventType = (typeof SCHEDULE_EVENT_TYPES)[number];

export interface Schedule {
  id: string;
  selectionId: string | null;
  title: string;
  eventDatetime: string;
  eventType: ScheduleEventType;
  note: string | null;
}
