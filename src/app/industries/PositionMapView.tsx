"use client";

import Link from "next/link";
import { useState } from "react";
import { selectionsApi } from "@/lib/selections/api";
import type { Selection } from "@/lib/selections/types";
import { statusBadgeClasses } from "@/lib/selections/types";
import { guessPositionCategory } from "@/lib/selections/position";
import { SecondaryButton } from "@/components/axis/ui";

const POSITION_COLORS: Record<string, string> = {
  "営業・セールス":
    "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  "エンジニア・開発":
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  コンサルタント:
    "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800",
  "PM・PMO":
    "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-800",
  "企画・マーケティング":
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-950 dark:text-fuchsia-200 dark:border-fuchsia-800",
  "人事・採用":
    "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800",
  "経理・財務":
    "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  "法務・知財":
    "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
  "カスタマーサクセス・サポート":
    "bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-950 dark:text-lime-200 dark:border-lime-800",
  "経営・管理職":
    "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800",
  "総務・バックオフィス":
    "bg-stone-200 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700",
  "研究・開発（技術職）":
    "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:border-violet-800",
  その他:
    "bg-neutral-200 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  未設定:
    "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700",
};

function colorFor(category: string) {
  return POSITION_COLORS[category] ?? POSITION_COLORS["未設定"];
}

const MIN_SIZE = 76;
const MAX_SIZE = 180;

export function PositionMapView({
  selections,
  setSelections,
  setError,
}: {
  selections: Selection[];
  setSelections: (updater: (cur: Selection[]) => Selection[]) => void;
  setError: (error: string | null) => void;
}) {
  const [guessing, setGuessing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const missingCategory = selections.filter((s) => !s.positionCategory);

  async function handleGuessMissingCategories() {
    if (missingCategory.length === 0) return;
    setGuessing(true);
    setError(null);
    try {
      const results = await Promise.all(
        missingCategory.map(async (s) => {
          const guessed = guessPositionCategory(s.position, s.companyName);
          if (!guessed) return null;
          return selectionsApi.update(s.id, { positionCategory: guessed });
        }),
      );
      setSelections((cur) =>
        cur.map((s) => {
          const updated = results.find((r) => r?.id === s.id);
          return updated ?? s;
        }),
      );
    } catch {
      setError("職種カテゴリの自動推定に失敗しました。");
    } finally {
      setGuessing(false);
    }
  }

  const groups = new Map<string, Selection[]>();
  for (const s of selections) {
    const key = s.positionCategory ?? "未設定";
    const list = groups.get(key);
    if (list) list.push(s);
    else groups.set(key, [s]);
  }

  const bubbles = Array.from(groups.entries())
    .map(([category, items]) => ({
      category,
      items,
      count: items.length,
      offerCount: items.filter((s) => s.status === "内定").length,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = Math.max(1, ...bubbles.map((b) => b.count));

  function sizeFor(count: number) {
    const ratio = Math.sqrt(count / maxCount);
    return Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * ratio);
  }

  const selectedBubble = bubbles.find((b) => b.category === selectedCategory);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          職種カテゴリ（職種名から自動推定・詳細画面で変更可）ごとに応募件数をバブルの大きさで表しています。「未設定」は職種カテゴリが入力されていない応募先です。
        </p>
        {missingCategory.length > 0 && (
          <SecondaryButton
            type="button"
            disabled={guessing}
            onClick={handleGuessMissingCategories}
            className="shrink-0"
          >
            {guessing
              ? "推定中…"
              : `未設定の職種カテゴリを自動推定（${missingCategory.length}件）`}
          </SecondaryButton>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 rounded-lg border border-border bg-panel px-4 py-10">
        {bubbles.map((b, i) => {
          const size = sizeFor(b.count);
          const isSelected = b.category === selectedCategory;
          return (
            <button
              key={b.category}
              type="button"
              onClick={() =>
                setSelectedCategory((cur) => (cur === b.category ? null : b.category))
              }
              title={`${b.category}：${b.count}件${b.offerCount > 0 ? `（内定${b.offerCount}件）` : ""}\nクリックで企業一覧を表示`}
              style={{ width: size, height: size, animationDelay: `${i * 30}ms` }}
              className={
                "animate-bubble-pop flex shrink-0 flex-col items-center justify-center rounded-full border-2 text-center shadow-sm transition-transform hover:scale-105 " +
                colorFor(b.category) +
                (isSelected ? " ring-4 ring-accent ring-offset-2 ring-offset-panel" : "")
              }
            >
              <span className="px-2 text-xs font-semibold leading-tight">
                {b.category}
              </span>
              <span className="text-lg font-bold">{b.count}</span>
            </button>
          );
        })}
      </div>

      {selectedBubble && (
        <div className="rounded-lg border border-accent bg-panel px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {selectedBubble.category}（{selectedBubble.count}件）
            </h2>
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="text-xs text-muted hover:text-foreground hover:underline"
            >
              閉じる
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {selectedBubble.items.map((s) => (
              <Link
                key={s.id}
                href={`/selections/${s.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:border-accent"
              >
                <span className="flex flex-col">
                  <span className="text-foreground">{s.companyName}</span>
                  {s.position && (
                    <span className="text-xs text-muted">{s.position}</span>
                  )}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClasses(s.status)}`}
                >
                  {s.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {bubbles.map((b) => (
          <div
            key={b.category}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-panel px-3 py-2 text-sm"
          >
            <span className="text-foreground">{b.category}</span>
            <span className="text-muted">
              {b.count}件
              {b.offerCount > 0 && `（内定${b.offerCount}）`}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
