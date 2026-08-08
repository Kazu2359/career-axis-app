"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { schedulesApi } from "@/lib/schedules/api";
import { SCHEDULE_EVENT_TYPES, type Schedule } from "@/lib/schedules/types";
import { selectionsApi } from "@/lib/selections/api";
import { statusBadgeClasses, type Selection } from "@/lib/selections/types";
import { AppNav } from "@/components/app/AppNav";
import {
  WideShell,
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
} from "@/components/axis/ui";

const DAY_COUNT = 28;
const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];
const DEFAULT_HOUR_START = 9;
const DEFAULT_HOUR_END = 19;

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildCalendarCells(schedules: Schedule[], days: Date[]) {
  const rangeStart = days[0].getTime();
  const rangeEndExclusive = days[days.length - 1].getTime() + 86_400_000;

  const inRange = schedules.filter((s) => {
    const t = new Date(s.eventDatetime).getTime();
    return t >= rangeStart && t < rangeEndExclusive;
  });

  const cells = new Map<string, Schedule[]>();
  for (const s of inRange) {
    const d = new Date(s.eventDatetime);
    const key = `${dateKey(d)}_${d.getHours()}`;
    const list = cells.get(key);
    if (list) list.push(s);
    else cells.set(key, [s]);
  }

  return { inRange, cells };
}

function computeHourRange(schedules: Schedule[]): {
  start: number;
  end: number;
} {
  const hours = schedules.map((s) => new Date(s.eventDatetime).getHours());
  const start = Math.min(DEFAULT_HOUR_START, ...hours);
  const end = Math.max(DEFAULT_HOUR_END, ...hours) + 1;
  return { start, end };
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null,
  );
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [title, setTitle] = useState("");
  const [eventDatetime, setEventDatetime] = useState("");
  const [eventType, setEventType] = useState<Schedule["eventType"]>("面接");
  const [selectionId, setSelectionId] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    Promise.all([schedulesApi.list(), selectionsApi.list()])
      .then(([s, sel]) => {
        setSchedules(s);
        setSelections(sel);
      })
      .catch(() => setError("読み込みに失敗しました。"))
      .finally(() => setLoading(false));
  }, []);

  function selectionOf(id: string | null): Selection | null {
    if (!id) return null;
    return selections.find((s) => s.id === id) ?? null;
  }

  function selectionLabel(id: string | null) {
    if (!id) return "（応募先未紐付け）";
    return selectionOf(id)?.companyName ?? "（削除済み）";
  }

  async function handleAdd() {
    if (!title.trim() || !eventDatetime) return;
    setAdding(true);
    setError(null);
    try {
      const created = await schedulesApi.create({
        title,
        eventDatetime: new Date(eventDatetime).toISOString(),
        eventType,
        selectionId: selectionId || null,
        note: null,
      });
      setSchedules((prev) =>
        [...prev, created].sort((a, b) =>
          a.eventDatetime.localeCompare(b.eventDatetime),
        ),
      );
      setTitle("");
      setEventDatetime("");
      setSelectionId("");
      setShowForm(false);
    } catch {
      setError("予定の追加に失敗しました。");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = schedules;
    setSchedules((cur) => cur.filter((s) => s.id !== id));
    try {
      await schedulesApi.remove(id);
    } catch {
      setSchedules(prev);
      setError("削除に失敗しました。");
    }
  }

  const days = Array.from(
    { length: DAY_COUNT },
    (_, i) => new Date(today.getTime() + i * 86_400_000),
  );
  const todayKey = dateKey(today);
  const { inRange, cells } = buildCalendarCells(schedules, days);
  const { start: hourStart, end: hourEnd } = computeHourRange(inRange);
  const hours = Array.from(
    { length: hourEnd - hourStart },
    (_, i) => hourStart + i,
  );

  return (
    <WideShell>
      <AppNav />
      <h1 className="text-xl font-bold text-foreground">スケジュール</h1>

      {error && <ErrorBanner message={error} />}

      {!loading && schedules.length === 0 && !showForm && (
        <p className="text-sm text-muted">まだ予定がありません。</p>
      )}

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-14 border-r border-b border-border bg-panel px-2 py-2 text-left font-medium text-foreground">
                時刻
              </th>
              {days.map((d) => {
                const isToday = dateKey(d) === todayKey;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <th
                    key={dateKey(d)}
                    className={
                      "w-20 border-r border-b border-border px-1 py-2 text-center font-normal " +
                      (isToday
                        ? "bg-accent-soft font-medium text-foreground"
                        : isWeekend
                          ? "bg-background text-muted"
                          : "text-muted")
                    }
                  >
                    {d.getMonth() + 1}/{d.getDate()}
                    <div className="text-[10px]">
                      {WEEKDAY_LABELS[d.getDay()]}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h}>
                <td className="sticky left-0 z-10 w-14 border-r border-b border-border bg-panel px-2 py-2 text-foreground">
                  {h}:00
                </td>
                {days.map((d) => {
                  const items = cells.get(`${dateKey(d)}_${h}`) ?? [];
                  return (
                    <td
                      key={dateKey(d)}
                      className="w-20 border-r border-b border-border p-1 align-top"
                    >
                      <div className="flex flex-col gap-0.5">
                        {items.map((it) => {
                          const sel = selectionOf(it.selectionId);
                          const company = selectionLabel(it.selectionId);
                          const chipClass = sel
                            ? statusBadgeClasses(sel.status)
                            : "bg-accent-soft text-foreground";
                          return (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() => setSelectedSchedule(it)}
                              title="クリックで詳細を表示"
                              className={`block w-full rounded px-1 py-0.5 text-left text-[10px] leading-tight transition-opacity hover:opacity-70 ${chipClass}`}
                            >
                              <span className="block truncate font-medium">
                                {formatTime(it.eventDatetime)} {it.title}
                              </span>
                              <span className="block truncate opacity-80">
                                {company}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {inRange.length === 0 && (
              <tr>
                <td
                  colSpan={DAY_COUNT + 1}
                  className="px-3 py-6 text-center text-sm text-muted"
                >
                  今後4週間の予定はありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm ? (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="件名（例：一次面接）"
            className="rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            type="datetime-local"
            step={300}
            value={eventDatetime}
            onChange={(e) => setEventDatetime(e.target.value)}
            className="rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <select
              value={eventType}
              onChange={(e) =>
                setEventType(e.target.value as Schedule["eventType"])
              }
              className="flex-1 rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {SCHEDULE_EVENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={selectionId}
              onChange={(e) => setSelectionId(e.target.value)}
              className="flex-1 rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="">応募先と紐付けない</option>
              {selections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.companyName}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <PrimaryButton
              className="flex-1"
              onClick={handleAdd}
              disabled={adding || !title.trim() || !eventDatetime}
            >
              追加する
            </PrimaryButton>
            <SecondaryButton onClick={() => setShowForm(false)}>
              キャンセル
            </SecondaryButton>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg border border-dashed border-border py-3 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
        >
          ＋ 予定を追加
        </button>
      )}

      {selectedSchedule &&
        (() => {
          const sel = selectionOf(selectedSchedule.selectionId);
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              onClick={() => setSelectedSchedule(null)}
            >
              <div
                className="w-full max-w-sm rounded-lg border border-border bg-panel p-5 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-foreground">
                    {selectedSchedule.title}
                  </h2>
                  <button
                    onClick={() => setSelectedSchedule(null)}
                    aria-label="閉じる"
                    className="shrink-0 text-muted hover:text-foreground"
                  >
                    ×
                  </button>
                </div>
                <dl className="mt-3 flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">日時</dt>
                    <dd className="text-foreground">
                      {new Date(
                        selectedSchedule.eventDatetime,
                      ).toLocaleString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        weekday: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">種別</dt>
                    <dd className="text-foreground">
                      {selectedSchedule.eventType}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-muted">応募先</dt>
                    <dd className="text-foreground">
                      {selectedSchedule.selectionId ? (
                        <Link
                          href={`/selections/${selectedSchedule.selectionId}`}
                          className="underline"
                        >
                          {selectionLabel(selectedSchedule.selectionId)}
                        </Link>
                      ) : (
                        "（応募先未紐付け）"
                      )}
                    </dd>
                  </div>
                  {sel && (
                    <div className="flex items-center justify-between gap-2">
                      <dt className="text-muted">ステータス</dt>
                      <dd>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClasses(sel.status)}`}
                        >
                          {sel.status}
                        </span>
                      </dd>
                    </div>
                  )}
                </dl>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      handleDelete(selectedSchedule.id);
                      setSelectedSchedule(null);
                    }}
                    className="text-sm text-warn hover:underline"
                  >
                    この予定を削除する
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </WideShell>
  );
}
