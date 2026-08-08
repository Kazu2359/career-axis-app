"use client";

import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
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
import { WideShell, ErrorBanner, SecondaryButton } from "@/components/axis/ui";
import {
  DEFAULT_SELECTION_SORT,
  SELECTION_SORT_OPTIONS,
  sortSelections,
  type SelectionSortKey,
} from "@/lib/selections/sort";
import { Celebration } from "./Celebration";

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

const CELEBRATION_LABELS: Partial<Record<SelectionStatus, string>> = {
  一次面接: "書類選考突破",
  二次面接: "一次面接突破",
  最終面接: "二次面接突破",
  内定: "内定",
};

function celebrationForTransition(
  from: SelectionStatus,
  to: SelectionStatus,
): string | null {
  const fromIdx = FUNNEL_STATUSES.indexOf(from);
  const toIdx = FUNNEL_STATUSES.indexOf(to);
  if (fromIdx === -1 || toIdx === -1 || toIdx <= fromIdx) return null;
  return CELEBRATION_LABELS[to] ?? null;
}

function startOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const monday = new Date(d.getTime() + diff * 86_400_000);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

interface Milestone {
  key: string;
  label: string;
  achieved: boolean;
  count?: number;
}

function computeQuestPath(selections: Selection[]): Milestone[] {
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
  ];
}

function computeBadges(selections: Selection[]): Milestone[] {
  function reachedAtLeastCount(status: SelectionStatus): number {
    const idx = FUNNEL_STATUSES.indexOf(status);
    return selections.filter((s) => FUNNEL_STATUSES.indexOf(s.status) >= idx)
      .length;
  }
  // 「突破」= 次の段階に進んだ数。書類選考突破は一次面接以降に進んだ数、
  // 一次面接突破は二次面接以降に進んだ数、二次面接突破は最終面接以降に進んだ数。
  const documentPassCount = reachedAtLeastCount("一次面接");
  const firstInterviewCount = reachedAtLeastCount("二次面接");
  const secondInterviewCount = reachedAtLeastCount("最終面接");
  const offerCount = selections.filter((s) => s.status === "内定").length;

  return [
    { key: "five-apps", label: "5社応募", achieved: selections.length >= 5 },
    { key: "ten-apps", label: "10社応募", achieved: selections.length >= 10 },
    {
      key: "thirty-apps",
      label: "30社応募",
      achieved: selections.length >= 30,
    },
    {
      key: "document-pass-count",
      label: "書類選考突破",
      achieved: documentPassCount > 0,
      count: documentPassCount,
    },
    {
      key: "first-interview-count",
      label: "一次面接突破",
      achieved: firstInterviewCount > 0,
      count: firstInterviewCount,
    },
    {
      key: "second-interview-count",
      label: "二次面接突破",
      achieved: secondInterviewCount > 0,
      count: secondInterviewCount,
    },
    {
      key: "offer-count",
      label: "内定",
      achieved: offerCount > 0,
      count: offerCount,
    },
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
  const [sortKey, setSortKey] = useState<SelectionSortKey>(DEFAULT_SELECTION_SORT);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetStatus, setBulkTargetStatus] =
    useState<SelectionStatus>("応募");
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const [celebration, setCelebration] = useState<string | null>(null);

  function toggleSelected(id: string) {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function applyBulkStatus() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setBulkUpdating(true);
    const prev = selections;
    const hasForwardMove = selections.some(
      (s) =>
        selectedIds.has(s.id) &&
        celebrationForTransition(s.status, bulkTargetStatus),
    );
    setSelections((cur) =>
      cur.map((s) =>
        selectedIds.has(s.id) ? { ...s, status: bulkTargetStatus } : s,
      ),
    );
    try {
      await Promise.all(
        ids.map((id) =>
          selectionsApi.update(id, { status: bulkTargetStatus }),
        ),
      );
      setSelectedIds(new Set());
      setSelectMode(false);
      if (hasForwardMove) {
        const label = CELEBRATION_LABELS[bulkTargetStatus];
        if (label) setCelebration(label);
      }
    } catch {
      setSelections(prev);
      setError("一括ステータス更新に失敗しました。");
    } finally {
      setBulkUpdating(false);
    }
  }

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

  function nextSchedule(
    selectionId: string,
  ): { schedule: Schedule; isPast: boolean } | null {
    const related = schedules
      .filter((s) => s.selectionId === selectionId)
      .sort((a, b) => a.eventDatetime.localeCompare(b.eventDatetime));
    const upcoming = related.find(
      (s) => new Date(s.eventDatetime).getTime() >= now,
    );
    if (upcoming) return { schedule: upcoming, isPast: false };
    const last = related[related.length - 1];
    return last ? { schedule: last, isPast: true } : null;
  }

  async function handleDrop(status: SelectionStatus, id: string) {
    const target = selections.find((s) => s.id === id);
    if (!target || target.status === status) return;

    const prevStatus = target.status;
    const prev = selections;
    setSelections((cur) =>
      cur.map((s) => (s.id === id ? { ...s, status } : s)),
    );
    try {
      await selectionsApi.update(id, { status });
      const label = celebrationForTransition(prevStatus, status);
      if (label) setCelebration(label);
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
  const rejectedCount = selections.filter((s) => s.status === "不採用").length;
  const declinedCount = selections.filter((s) => s.status === "辞退").length;

  const questPath = computeQuestPath(selections);
  const badges = computeBadges(selections);
  const questProgress = questPath.filter((m) => m.achieved).length;
  const currentQuestIndex = questPath.findIndex((m) => !m.achieved);

  return (
    <WideShell className="max-w-[1650px]">
      {celebration && (
        <Celebration title={celebration} onDone={() => setCelebration(null)} />
      )}
      <AppNav />
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-foreground">進捗ボード</h1>
        <div className="flex items-center gap-2">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SelectionSortKey)}
            className="w-fit rounded-lg border border-border bg-panel px-3 py-1.5 text-sm outline-none focus:border-accent"
          >
            {SELECTION_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <SecondaryButton
            type="button"
            onClick={() => {
              setSelectMode((v) => !v);
              setSelectedIds(new Set());
            }}
          >
            {selectMode ? "選択モードを終了" : "複数選択"}
          </SecondaryButton>
        </div>
      </div>

      {selectMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-panel px-4 py-3">
          <span className="text-sm text-foreground">
            {selectedIds.size}件選択中
          </span>
          <select
            value={bulkTargetStatus}
            onChange={(e) =>
              setBulkTargetStatus(e.target.value as SelectionStatus)
            }
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            {SELECTION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={selectedIds.size === 0 || bulkUpdating}
            onClick={applyBulkStatus}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {bulkUpdating ? "更新中…" : "選択した項目に適用"}
          </button>
        </div>
      )}

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
            {(rejectedCount > 0 || declinedCount > 0) && (
              <div className="mt-2 flex gap-4 text-xs text-muted">
                {rejectedCount > 0 && <span>不採用: {rejectedCount}件</span>}
                {declinedCount > 0 && <span>辞退: {declinedCount}件</span>}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-panel px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                選考クエストロード
              </h2>
              <span className="text-xs text-muted">
                {questProgress}/{questPath.length} クリア
              </span>
            </div>
            <div className="flex items-start">
              {questPath.map((m, i) => (
                <Fragment key={m.key}>
                  <div className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center">
                    <div
                      className={
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold " +
                        (m.achieved
                          ? "border-accent bg-accent text-white"
                          : i === currentQuestIndex
                            ? "animate-pulse border-accent bg-panel text-base ring-4 ring-accent-soft"
                            : "border-border bg-background text-muted")
                      }
                    >
                      {m.achieved ? "✓" : i === currentQuestIndex ? "🚩" : "🔒"}
                    </div>
                    <span
                      className={
                        "text-[11px] leading-tight " +
                        (m.achieved || i === currentQuestIndex
                          ? "font-medium text-foreground"
                          : "text-muted")
                      }
                    >
                      {m.label}
                    </span>
                  </div>
                  {i < questPath.length - 1 && (
                    <div
                      className={
                        "mt-5 h-1 flex-1 rounded transition-colors " +
                        (m.achieved ? "bg-accent" : "bg-border")
                      }
                    />
                  )}
                </Fragment>
              ))}
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-semibold text-muted">
                実績バッジ
              </h3>
              <div className="flex flex-wrap gap-3">
                {badges.map((b) => (
                  <div
                    key={b.key}
                    className={
                      "flex flex-col items-center gap-1 rounded-lg border px-4 py-3 text-center " +
                      (b.achieved
                        ? "border-accent bg-accent-soft"
                        : "border-border opacity-50")
                    }
                  >
                    <span className="text-2xl">{b.achieved ? "🏆" : "🔒"}</span>
                    <span
                      className={
                        "text-xs font-medium " +
                        (b.achieved ? "text-foreground" : "text-muted")
                      }
                    >
                      {b.label}
                    </span>
                    {b.count !== undefined && b.achieved && (
                      <span className="text-[10px] text-muted">{b.count}社</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {SELECTION_STATUSES.map((status) => {
          const items = sortSelections(
            selections.filter((s) => s.status === status),
            sortKey,
            wantCategories,
          );
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
                "flex w-48 shrink-0 flex-col gap-2 rounded-xl p-1.5 transition-colors " +
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
                  const selected = selectedIds.has(s.id);
                  const cardContent = (
                    <>
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
                        <span
                          className={
                            "font-mono text-xs " +
                            (next.isPast ? "text-muted" : "text-accent")
                          }
                        >
                          {formatDatetime(next.schedule.eventDatetime)}{" "}
                          {next.schedule.title}
                          {next.isPast && "（終了）"}
                        </span>
                      )}
                    </>
                  );

                  if (selectMode) {
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSelected(s.id)}
                        className={
                          "flex flex-col gap-1 rounded-lg border px-3 py-2.5 text-left transition-colors " +
                          (selected
                            ? "border-accent bg-accent-soft"
                            : "border-border bg-panel hover:border-accent")
                        }
                      >
                        {cardContent}
                      </button>
                    );
                  }

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
                      {cardContent}
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
