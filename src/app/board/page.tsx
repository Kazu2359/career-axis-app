"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { selectionsApi } from "@/lib/selections/api";
import { schedulesApi } from "@/lib/schedules/api";
import {
  SELECTION_STATUSES,
  computeWantFitScore,
  statusBadgeClasses,
  type Selection,
  type SelectionStatus,
} from "@/lib/selections/types";
import { axisApi } from "@/lib/axis/api";
import type { WantCategory } from "@/lib/axis/types";
import type { Schedule } from "@/lib/schedules/types";
import { AppNav } from "@/components/app/AppNav";
import { WideShell, ErrorBanner } from "@/components/axis/ui";

function formatDatetime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const FUNNEL_STATUSES: SelectionStatus[] = [
  "応募",
  "書類選考",
  "一次面接",
  "二次面接",
  "最終面接",
  "内定",
];

const STREAK_DAYS = 70;

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d.getTime() + diff * 86_400_000);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function dateKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

interface Milestone {
  key: string;
  label: string;
  achieved: boolean;
}

function computeMilestones(selections: Selection[]): Milestone[] {
  function reachedAtLeast(status: SelectionStatus): boolean {
    const idx = FUNNEL_STATUSES.indexOf(status);
    return selections.some((s) => FUNNEL_STATUSES.indexOf(s.status) >= idx);
  }
  return [
    { key: "first-app", label: "初応募", achieved: selections.length >= 1 },
    {
      key: "doc-pass",
      label: "書類選考突破",
      achieved: reachedAtLeast("一次面接"),
    },
    {
      key: "second-interview",
      label: "一次面接突破",
      achieved: reachedAtLeast("二次面接"),
    },
    {
      key: "final-interview",
      label: "最終面接到達",
      achieved: reachedAtLeast("最終面接"),
    },
    {
      key: "offer",
      label: "初内定",
      achieved: selections.some((s) => s.status === "内定"),
    },
    { key: "five-apps", label: "5社応募", achieved: selections.length >= 5 },
    { key: "ten-apps", label: "10社応募", achieved: selections.length >= 10 },
  ];
}

export default function BoardPage() {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [wantCategories, setWantCategories] = useState<WantCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now] = useState(() => Date.now());
  const [today] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<SelectionStatus | null>(
    null,
  );

  useEffect(() => {
    Promise.all([
      selectionsApi.list(),
      schedulesApi.list(),
      axisApi.getWantCategories(),
    ])
      .then(([sel, sch, wants]) => {
        setSelections(sel);
        setSchedules(sch);
        setWantCategories(wants);
      })
      .catch(() => setError("読み込みに失敗しました。"))
      .finally(() => setLoading(false));
  }, []);

  function nextSchedule(selectionId: string): Schedule | null {
    const upcoming = schedules
      .filter(
        (s) =>
          s.selectionId === selectionId &&
          new Date(s.eventDatetime).getTime() >= now,
      )
      .sort((a, b) => a.eventDatetime.localeCompare(b.eventDatetime));
    return upcoming[0] ?? null;
  }

  async function handleDrop(status: SelectionStatus, id: string) {
    const target = selections.find((s) => s.id === id);
    if (!target || target.status === status) return;

    const prev = selections;
    setSelections((cur) =>
      cur.map((s) => (s.id === id ? { ...s, status } : s)),
    );
    try {
      await selectionsApi.update(id, { status });
    } catch {
      setSelections(prev);
      setError("ステータスの更新に失敗しました。");
    }
  }

  const weekStart = startOfWeek(today);
  const weekEndExclusive = new Date(weekStart.getTime() + 7 * 86_400_000);

  const newApplicationsThisWeek = selections.filter((s) => {
    const t = new Date(s.createdAt).getTime();
    return t >= weekStart.getTime() && t < weekEndExclusive.getTime();
  }).length;

  const interviewsThisWeek = schedules.filter((s) => {
    const t = new Date(s.eventDatetime).getTime();
    return (
      s.eventType === "面接" &&
      t >= weekStart.getTime() &&
      t < weekEndExclusive.getTime()
    );
  }).length;

  const updatesThisWeek = selections.filter((s) => {
    const created = new Date(s.createdAt).getTime();
    const updated = new Date(s.updatedAt).getTime();
    return (
      updated !== created &&
      updated >= weekStart.getTime() &&
      updated < weekEndExclusive.getTime()
    );
  }).length;

  const funnelCounts = FUNNEL_STATUSES.map((status) => ({
    status,
    count: selections.filter((s) => s.status === status).length,
  }));
  const funnelMax = Math.max(1, ...funnelCounts.map((f) => f.count));
  const closedCount = selections.filter(
    (s) => s.status === "不採用" || s.status === "辞退",
  ).length;

  const streakDays = Array.from(
    { length: STREAK_DAYS },
    (_, i) => new Date(today.getTime() - (STREAK_DAYS - 1 - i) * 86_400_000),
  );
  const activityByDay = new Map<string, Set<string>>();
  for (const s of selections) {
    for (const iso of [s.createdAt, s.updatedAt]) {
      const key = dateKey(new Date(iso));
      const set = activityByDay.get(key);
      if (set) set.add(s.id);
      else activityByDay.set(key, new Set([s.id]));
    }
  }
  let currentStreak = 0;
  for (let i = streakDays.length - 1; i >= 0; i--) {
    const key = dateKey(streakDays[i]);
    if ((activityByDay.get(key)?.size ?? 0) > 0) currentStreak++;
    else break;
  }

  const milestones = computeMilestones(selections);

  return (
    <WideShell className="max-w-[1800px]">
      <AppNav />
      <h1 className="text-xl font-bold text-foreground">進捗ボード</h1>

      {error && <ErrorBanner message={error} />}

      {!loading && selections.length === 0 && (
        <p className="text-sm text-muted">
          まだ応募先が登録されていません。「選考プロセス」から追加してください。
        </p>
      )}

      {!loading && selections.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-panel px-4 py-3">
              <p className="text-xs text-muted">今週の新規応募</p>
              <p className="text-xl font-bold text-foreground">
                {newApplicationsThisWeek}件
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel px-4 py-3">
              <p className="text-xs text-muted">今週の面接予定</p>
              <p className="text-xl font-bold text-foreground">
                {interviewsThisWeek}件
              </p>
            </div>
            <div className="rounded-lg border border-border bg-panel px-4 py-3">
              <p className="text-xs text-muted">今週の更新</p>
              <p className="text-xl font-bold text-foreground">
                {updatesThisWeek}件
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-panel px-4 py-3">
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              選考ファネル
            </h2>
            <div className="flex flex-col gap-1.5">
              {funnelCounts.map(({ status, count }) => (
                <div key={status} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-xs text-muted">
                    {status}
                  </span>
                  <div className="h-5 flex-1 rounded bg-background">
                    <div
                      className={`h-5 rounded ${statusBadgeClasses(status)}`}
                      style={{ width: `${(count / funnelMax) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-xs text-foreground">
                    {count}
                  </span>
                </div>
              ))}
            </div>
            {closedCount > 0 && (
              <p className="mt-2 text-xs text-muted">
                不採用・辞退: {closedCount}件
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-panel px-4 py-3">
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              アクティビティ（連続{currentStreak}日）
            </h2>
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {streakDays.map((d) => {
                const key = dateKey(d);
                const count = activityByDay.get(key)?.size ?? 0;
                const level =
                  count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
                const levelClass = [
                  "bg-background",
                  "bg-accent-soft",
                  "bg-accent/60",
                  "bg-accent",
                ][level];
                return (
                  <div
                    key={key}
                    title={`${d.getMonth() + 1}/${d.getDate()}：${count}件`}
                    className={`h-3 w-3 rounded-sm ${levelClass}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-panel px-4 py-3">
            <h2 className="mb-2 text-sm font-semibold text-foreground">
              マイルストーン
            </h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {milestones.map((m) => (
                <div
                  key={m.key}
                  className={
                    "flex flex-col items-center gap-1 rounded-lg border px-3 py-3 text-center text-xs " +
                    (m.achieved
                      ? "border-accent bg-accent-soft text-foreground"
                      : "border-border text-muted opacity-50")
                  }
                >
                  <span className="font-medium">{m.label}</span>
                  <span className="text-[10px]">
                    {m.achieved ? "達成" : "未達成"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2">
        {SELECTION_STATUSES.map((status) => {
          const items = selections.filter((s) => s.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDragEnter={() => setDragOverStatus(status)}
              onDragLeave={() =>
                setDragOverStatus((cur) => (cur === status ? null : cur))
              }
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStatus(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id) handleDrop(status, id);
              }}
              className={
                "flex w-64 shrink-0 flex-col gap-2 rounded-xl p-1.5 transition-colors " +
                (dragOverStatus === status
                  ? "bg-accent-soft"
                  : "bg-transparent")
              }
            >
              <div className="flex items-center gap-2 px-1">
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(status)}`}
                >
                  {status}
                </span>
                <span className="text-xs text-muted">{items.length}</span>
              </div>
              <div className="flex flex-col gap-2">
                {items.map((s) => {
                  const next = nextSchedule(s.id);
                  const fitScore = computeWantFitScore(
                    wantCategories,
                    s.wantFitScores,
                  );
                  return (
                    <Link
                      key={s.id}
                      href={`/selections/${s.id}`}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", s.id);
                        e.dataTransfer.effectAllowed = "move";
                        setDraggingId(s.id);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      className={
                        "flex cursor-grab flex-col gap-1 rounded-lg border border-border bg-panel px-3 py-2.5 transition-colors hover:border-accent active:cursor-grabbing " +
                        (draggingId === s.id ? "opacity-40" : "")
                      }
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {s.companyName}
                        </span>
                        {fitScore !== null && (
                          <span className="shrink-0 text-[11px] text-muted">
                            適合度 {fitScore}
                          </span>
                        )}
                      </div>
                      {s.position && (
                        <span className="text-xs text-muted">
                          {s.position}
                        </span>
                      )}
                      {next && (
                        <span className="font-mono text-xs text-accent">
                          {formatDatetime(next.eventDatetime)} {next.title}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </WideShell>
  );
}
