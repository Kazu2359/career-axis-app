"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axisApi } from "@/lib/axis/api";
import type { MustCondition } from "@/lib/axis/types";
import { StepProgress } from "@/components/axis/StepProgress";
import { AxisShell, ErrorBanner, PrimaryButton, SecondaryButton } from "@/components/axis/ui";

export default function MustConditionsPage() {
  const router = useRouter();
  const [conditions, setConditions] = useState<MustCondition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newLabel, setNewLabel] = useState("");
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    axisApi
      .getMustConditions()
      .then(setConditions)
      .catch(() => setError("読み込みに失敗しました。"))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    if (!newLabel.trim() || !newText.trim()) return;
    setAdding(true);
    setError(null);
    try {
      const created = await axisApi.addMustCondition({
        categoryLabel: newLabel,
        conditionText: newText,
        thresholdValue: null,
      });
      setConditions((prev) => [...prev, created]);
      setNewLabel("");
      setNewText("");
      setShowForm(false);
    } catch {
      setError("条件の追加に失敗しました。");
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: string) {
    const prev = conditions;
    setConditions((cur) => cur.filter((c) => c.id !== id));
    try {
      await axisApi.deleteMustCondition(id);
    } catch {
      setConditions(prev);
      setError("削除に失敗しました。");
    }
  }

  return (
    <AxisShell>
      <StepProgress step={2} label="譲れない条件" percent={44} />
      <h1 className="text-xl font-bold text-foreground">
        これだけは譲れない条件
      </h1>

      {error && <ErrorBanner message={error} />}

      <div className="flex flex-col gap-2">
        {!loading && conditions.length === 0 && !showForm && (
          <p className="text-sm text-muted">
            まだ条件がありません。なければ空のまま次へ進めます。
          </p>
        )}
        {conditions.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-panel px-3 py-2.5"
          >
            <span className="w-20 shrink-0 text-xs font-medium text-muted">
              {c.categoryLabel}
            </span>
            <span className="flex-1 text-sm text-foreground">
              {c.conditionText}
            </span>
            <button
              onClick={() => handleDelete(c.id)}
              aria-label={`${c.categoryLabel}を削除`}
              className="shrink-0 text-sm text-muted hover:text-warn"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="ラベル（例：年収下限）"
            className="rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="条件の内容（例：450万円以上）"
            className="rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            <PrimaryButton
              className="flex-1"
              onClick={handleAdd}
              disabled={adding || !newLabel.trim() || !newText.trim()}
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
          ＋ 条件を追加
        </button>
      )}

      <PrimaryButton onClick={() => router.push("/axis/priorities")}>
        次へ（Want重み配分）
      </PrimaryButton>
    </AxisShell>
  );
}
