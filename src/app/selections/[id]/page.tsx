"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { selectionsApi } from "@/lib/selections/api";
import { schedulesApi } from "@/lib/schedules/api";
import {
  SELECTION_STATUSES,
  computeWantFitScore,
  type Selection,
} from "@/lib/selections/types";
import { axisApi } from "@/lib/axis/api";
import type { MustCondition, WantCategory } from "@/lib/axis/types";
import type { Schedule } from "@/lib/schedules/types";
import { AppNav } from "@/components/app/AppNav";
import {
  AxisShell,
  ErrorBanner,
  Field,
  PrimaryButton,
  SecondaryButton,
} from "@/components/axis/ui";

export default function SelectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [selection, setSelection] = useState<Selection | null>(null);
  const [mustConditions, setMustConditions] = useState<MustCondition[]>([]);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [wantCategories, setWantCategories] = useState<WantCategory[]>([]);
  const [wantScores, setWantScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleDatetime, setScheduleDatetime] = useState("");
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    Promise.all([
      selectionsApi.get(id),
      axisApi.getMustConditions(),
      axisApi.getWantCategories(),
      schedulesApi.list({ selectionId: id }),
    ])
      .then(([sel, conditions, wants, sched]) => {
        setSelection(sel);
        setMustConditions(conditions);
        setChecks(sel.mustConditionCheck ?? {});
        setWantCategories(wants);
        setWantScores(sel.wantFitScores ?? {});
        setSchedules(sched);
      })
      .catch(() => setError("読み込みに失敗しました。"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSaveDetails() {
    if (!selection) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await selectionsApi.update(id, {
        companyName: selection.companyName,
        position: selection.position,
        status: selection.status,
      });
      setSelection(updated);
      if (scheduleDatetime) {
        const created = await schedulesApi.create({
          title: updated.status,
          eventDatetime: new Date(scheduleDatetime).toISOString(),
          eventType: "面接",
          selectionId: updated.id,
          note: null,
        });
        setSchedules((cur) => [...cur, created]);
        setScheduleDatetime("");
      }
    } catch {
      setError("保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteSchedule(scheduleId: string) {
    try {
      await schedulesApi.remove(scheduleId);
      setSchedules((cur) => cur.filter((s) => s.id !== scheduleId));
    } catch {
      setError("予定の削除に失敗しました。");
    }
  }

  async function handleSaveChecks() {
    setSaving(true);
    setError(null);
    try {
      const updated = await selectionsApi.saveMustConditionCheck(id, checks);
      setSelection(updated);
    } catch {
      setError("Must条件の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveWantScores() {
    setSaving(true);
    setError(null);
    try {
      const updated = await selectionsApi.saveWantFitScores(id, wantScores);
      setSelection(updated);
    } catch {
      setError("適合度評価の保存に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("この応募先を削除しますか？")) return;
    try {
      await selectionsApi.remove(id);
      router.push("/selections");
    } catch {
      setError("削除に失敗しました。");
    }
  }

  if (loading || !selection) {
    return (
      <AxisShell>
        <AppNav />
        {error ? <ErrorBanner message={error} /> : <p className="text-sm text-muted">読み込み中...</p>}
      </AxisShell>
    );
  }

  return (
    <AxisShell>
      <AppNav />
      <h1 className="text-xl font-bold text-foreground">{selection.companyName}</h1>

      {error && <ErrorBanner message={error} />}

      <Field label="企業名">
        <input
          value={selection.companyName}
          onChange={(e) =>
            setSelection({ ...selection, companyName: e.target.value })
          }
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </Field>
      <Field label="職種">
        <input
          value={selection.position}
          onChange={(e) =>
            setSelection({ ...selection, position: e.target.value })
          }
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </Field>
      <Field label="ステータス">
        <select
          value={selection.status}
          onChange={(e) =>
            setSelection({
              ...selection,
              status: e.target.value as Selection["status"],
            })
          }
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        >
          {SELECTION_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field label="次の予定日時（任意）">
        <input
          type="datetime-local"
          value={scheduleDatetime}
          onChange={(e) => setScheduleDatetime(e.target.value)}
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <span className="text-xs text-muted">
          入力して保存すると、件名「{selection.status}」の予定としてスケジュールに追加されます。
        </span>
      </Field>

      {schedules.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">登録済みの予定</span>
          {[...schedules]
            .sort((a, b) => a.eventDatetime.localeCompare(b.eventDatetime))
            .map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel px-3 py-2 text-sm"
              >
                <span className="text-foreground">
                  {new Date(s.eventDatetime).toLocaleString("ja-JP", {
                    year: "numeric",
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <span className="ml-2 text-muted">{s.title}</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteSchedule(s.id)}
                  className="shrink-0 text-xs text-warn hover:underline"
                >
                  削除
                </button>
              </div>
            ))}
        </div>
      )}

      <PrimaryButton onClick={handleSaveDetails} disabled={saving}>
        保存する
      </PrimaryButton>

      <div className="flex flex-col gap-2 border-t border-border pt-5">
        <h2 className="text-sm font-semibold text-foreground">
          Must条件との照合
        </h2>
        {mustConditions.length === 0 ? (
          <p className="text-sm text-muted">
            Must条件が登録されていません（
            <a href="/axis/must" className="underline">
              Step2で登録
            </a>
            ）。
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-1.5">
              {mustConditions.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={checks[c.id] ?? false}
                    onChange={(e) =>
                      setChecks((prev) => ({ ...prev, [c.id]: e.target.checked }))
                    }
                    className="accent-accent"
                  />
                  <span className="text-muted">{c.categoryLabel}：</span>
                  <span className="text-foreground">{c.conditionText}</span>
                </label>
              ))}
            </div>
            <SecondaryButton onClick={handleSaveChecks} disabled={saving}>
              照合結果を保存
            </SecondaryButton>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-5">
        <h2 className="text-sm font-semibold text-foreground">
          就活軸との適合度（Want条件）
        </h2>
        {wantCategories.length === 0 ? (
          <p className="text-sm text-muted">
            Want条件が登録されていません（
            <a href="/axis/priorities" className="underline">
              Step3で登録
            </a>
            ）。
          </p>
        ) : (
          <>
            {(() => {
              const score = computeWantFitScore(wantCategories, wantScores);
              return score !== null ? (
                <p className="text-sm text-foreground">
                  現在の適合度スコア：
                  <span className="font-semibold">{score}点</span> / 100点
                  <span className="text-xs text-muted">
                    （評価済みのWant条件のみで算出）
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted">
                  各Want条件を1〜5で評価すると、重み配分に応じたスコアが表示されます。
                </p>
              );
            })()}
            <div className="flex flex-col gap-1.5">
              {wantCategories.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel px-3 py-2 text-sm"
                >
                  <span className="text-foreground">
                    {c.categoryName}
                    <span className="ml-1 text-xs text-muted">
                      （{c.weight}点）
                    </span>
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() =>
                          setWantScores((prev) => ({ ...prev, [c.id]: n }))
                        }
                        aria-label={`${c.categoryName}を${n}で評価`}
                        className={
                          "h-7 w-7 rounded-full border text-xs transition-colors " +
                          (wantScores[c.id] === n
                            ? "border-accent bg-accent text-accent-foreground"
                            : "border-border text-muted hover:border-accent")
                        }
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <SecondaryButton onClick={handleSaveWantScores} disabled={saving}>
              評価を保存
            </SecondaryButton>
          </>
        )}
      </div>

      <button
        onClick={handleDelete}
        className="mt-4 self-start text-sm text-warn hover:underline"
      >
        この応募先を削除する
      </button>
    </AxisShell>
  );
}
