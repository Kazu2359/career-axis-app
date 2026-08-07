"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axisApi } from "@/lib/axis/api";
import type { WantCategory } from "@/lib/axis/types";
import { WANT_WEIGHT_TOTAL } from "@/lib/axis/wantCategories";
import { StepProgress } from "@/components/axis/StepProgress";
import { AxisShell, ErrorBanner, PrimaryButton } from "@/components/axis/ui";

export default function WantWeightsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<WantCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    axisApi
      .getWantCategories()
      .then(setCategories)
      .catch(() => setError("読み込みに失敗しました。"))
      .finally(() => setLoading(false));
  }, []);

  const total = categories.reduce((sum, c) => sum + c.weight, 0);
  const isValidTotal = total === WANT_WEIGHT_TOTAL;

  function updateWeight(id: string, weight: number) {
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, weight } : c)),
    );
  }

  async function handleAddCategory() {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    setError(null);
    try {
      const created = await axisApi.addWantCategory(newCategoryName);
      setCategories((prev) => [...prev, created]);
      setNewCategoryName("");
    } catch {
      setError("カテゴリの追加に失敗しました。");
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleNext() {
    setSaving(true);
    setError(null);
    try {
      await axisApi.saveWantWeights(
        categories.map((c) => ({ id: c.id, weight: c.weight })),
      );
      router.push("/axis/priorities/transition");
    } catch {
      setError("保存に失敗しました。合計が100になっているか確認してください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AxisShell>
      <StepProgress step={3} label="優先条件と将来像（1/2）" percent={63} />
      <h1 className="text-xl font-bold text-foreground">
        何を優先するか、100点で配分する
      </h1>

      {error && <ErrorBanner message={error} />}

      <div className="flex flex-col gap-4">
        {categories.map((c) => (
          <div key={c.id} className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-foreground">{c.categoryName}</span>
              <span className="font-medium text-foreground">{c.weight}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={c.weight}
              disabled={loading}
              onChange={(e) => updateWeight(c.id, Number(e.target.value))}
              className="accent-accent"
            />
          </div>
        ))}
      </div>

      <div
        className={
          "flex items-center justify-between border-t border-dashed pt-3 text-sm font-medium " +
          (isValidTotal ? "border-border text-foreground" : "border-warn text-warn")
        }
      >
        <span>合計</span>
        <span>
          {total} / {WANT_WEIGHT_TOTAL}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="カテゴリを追加（例：技術スタック・開発文化）"
          className="flex-1 rounded-md border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          onClick={handleAddCategory}
          disabled={addingCategory || !newCategoryName.trim()}
          className="shrink-0 rounded-md border border-dashed border-border px-3 text-sm text-muted transition-colors hover:border-accent hover:text-foreground disabled:opacity-40"
        >
          ＋ 追加
        </button>
      </div>

      <PrimaryButton
        onClick={handleNext}
        disabled={loading || saving || !isValidTotal}
      >
        {saving ? "保存中..." : "次へ（キャリア移行戦略）"}
      </PrimaryButton>
    </AxisShell>
  );
}
