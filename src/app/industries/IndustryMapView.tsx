"use client";

import Link from "next/link";
import { useState } from "react";
import { selectionsApi } from "@/lib/selections/api";
import type { Selection } from "@/lib/selections/types";
import { statusBadgeClasses } from "@/lib/selections/types";
import { guessIndustry, guessIndustryType } from "@/lib/selections/industry";
import { SecondaryButton } from "@/components/axis/ui";

const INDUSTRY_COLORS: Record<string, string> = {
  "IT・ソフトウェア":
    "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800",
  コンサルティング:
    "bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-200 dark:border-indigo-800",
  金融: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
  商社: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
  "メーカー・製造":
    "bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
  "小売・流通":
    "bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950 dark:text-pink-200 dark:border-pink-800",
  不動産:
    "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800",
  人材: "bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-200 dark:border-teal-800",
  "広告・マーケティング":
    "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-950 dark:text-fuchsia-200 dark:border-fuchsia-800",
  通信: "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-200 dark:border-cyan-800",
  "医療・製薬":
    "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800",
  食品: "bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-950 dark:text-lime-200 dark:border-lime-800",
  建設: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-200 dark:border-yellow-800",
  "運輸・物流":
    "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-200 dark:border-sky-800",
  教育: "bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-200 dark:border-violet-800",
  "官公庁・団体":
    "bg-stone-200 text-stone-800 border-stone-300 dark:bg-stone-800 dark:text-stone-200 dark:border-stone-700",
  その他:
    "bg-neutral-200 text-neutral-800 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700",
  未設定:
    "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-700",
};

function colorFor(industry: string) {
  return INDUSTRY_COLORS[industry] ?? INDUSTRY_COLORS["未設定"];
}

const MIN_SIZE = 76;
const MAX_SIZE = 180;

export function IndustryMapView({
  selections,
  setSelections,
  setError,
}: {
  selections: Selection[];
  setSelections: (updater: (cur: Selection[]) => Selection[]) => void;
  setError: (error: string | null) => void;
}) {
  const [guessing, setGuessing] = useState(false);
  const [drilledMajor, setDrilledMajor] = useState<string | null>(null);
  const [drilledType, setDrilledType] = useState<string | null>(null);
  const [selectedMinor, setSelectedMinor] = useState<string | null>(null);

  const missingMajor = selections.filter(
    (s) => !s.industryMajor || !s.industryTypeMajor,
  );

  async function handleGuessMissingMajors() {
    if (missingMajor.length === 0) return;
    setGuessing(true);
    setError(null);
    try {
      const results = await Promise.all(
        missingMajor.map(async (s) => {
          const guessedMajor = s.industryMajor
            ? null
            : guessIndustry(s.companyName, s.industryMinor);
          const guessedTypeMajor = s.industryTypeMajor
            ? null
            : guessIndustryType(s.companyName, s.industryMinor);
          if (!guessedMajor && !guessedTypeMajor) return null;
          return selectionsApi.update(s.id, {
            ...(guessedMajor && { industryMajor: guessedMajor }),
            ...(guessedTypeMajor && { industryTypeMajor: guessedTypeMajor }),
          });
        }),
      );
      setSelections((cur) =>
        cur.map((s) => {
          const updated = results.find((r) => r?.id === s.id);
          return updated ?? s;
        }),
      );
    } catch {
      setError("業界・業種の自動推定に失敗しました。");
    } finally {
      setGuessing(false);
    }
  }

  const groups = new Map<string, Selection[]>();
  for (const s of selections) {
    const key = s.industryMajor ?? "未設定";
    const list = groups.get(key);
    if (list) list.push(s);
    else groups.set(key, [s]);
  }

  const bubbles = Array.from(groups.entries())
    .map(([industry, items]) => {
      const minorCounts = new Map<string, number>();
      for (const item of items) {
        const key = item.industryMinor?.trim() || null;
        if (!key) continue;
        minorCounts.set(key, (minorCounts.get(key) ?? 0) + 1);
      }
      const minorBreakdown = Array.from(minorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => (count > 1 ? `${name}(${count})` : name));

      return {
        industry,
        items,
        count: items.length,
        offerCount: items.filter((s) => s.status === "内定").length,
        minorBreakdown,
      };
    })
    .sort((a, b) => b.count - a.count);

  function sizeFor(count: number, maxCount: number) {
    const ratio = Math.sqrt(count / maxCount);
    return Math.round(MIN_SIZE + (MAX_SIZE - MIN_SIZE) * ratio);
  }

  const majorMaxCount = Math.max(1, ...bubbles.map((b) => b.count));

  const drilledBubble = bubbles.find((b) => b.industry === drilledMajor);

  const typeBubbles = drilledBubble
    ? (() => {
        const byType = new Map<string, Selection[]>();
        for (const item of drilledBubble.items) {
          const key = item.industryTypeMajor?.trim() || "未設定";
          const list = byType.get(key);
          if (list) list.push(item);
          else byType.set(key, [item]);
        }
        return Array.from(byType.entries())
          .map(([type, items]) => ({ type, items, count: items.length }))
          .sort((a, b) => b.count - a.count);
      })()
    : [];
  const typeMaxCount = Math.max(1, ...typeBubbles.map((b) => b.count));

  const drilledTypeBubble = typeBubbles.find((b) => b.type === drilledType);

  const minorBubbles = drilledTypeBubble
    ? (() => {
        const byMinor = new Map<string, Selection[]>();
        for (const item of drilledTypeBubble.items) {
          const key = item.industryMinor?.trim() || "詳細未設定";
          const list = byMinor.get(key);
          if (list) list.push(item);
          else byMinor.set(key, [item]);
        }
        return Array.from(byMinor.entries())
          .map(([minor, items]) => ({ minor, items, count: items.length }))
          .sort((a, b) => b.count - a.count);
      })()
    : [];
  const minorMaxCount = Math.max(1, ...minorBubbles.map((b) => b.count));

  const selectedMinorBubble = minorBubbles.find((b) => b.minor === selectedMinor);

  const companyList = selectedMinorBubble
    ? { label: selectedMinorBubble.minor, items: selectedMinorBubble.items }
    : drilledTypeBubble
      ? { label: drilledTypeBubble.type, items: drilledTypeBubble.items }
      : drilledBubble
        ? { label: drilledBubble.industry, items: drilledBubble.items }
        : null;

  function handleDrillMajor(industry: string) {
    setDrilledMajor(industry);
    setDrilledType(null);
    setSelectedMinor(null);
  }

  function handleDrillType(type: string) {
    setDrilledType(type);
    setSelectedMinor(null);
  }

  function handleBackToMajor() {
    setDrilledMajor(null);
    setDrilledType(null);
    setSelectedMinor(null);
  }

  function handleBackToType() {
    setDrilledType(null);
    setSelectedMinor(null);
  }

  const breadcrumb: { label: string; onClick?: () => void }[] = [
    {
      label: "業界一覧",
      onClick: drilledMajor ? handleBackToMajor : undefined,
    },
  ];
  if (drilledBubble) {
    breadcrumb.push({
      label: drilledBubble.industry,
      onClick: drilledType ? handleBackToType : undefined,
    });
  }
  if (drilledTypeBubble) {
    breadcrumb.push({
      label: drilledTypeBubble.type,
      onClick: selectedMinor ? () => setSelectedMinor(null) : undefined,
    });
  }
  if (selectedMinorBubble) {
    breadcrumb.push({ label: selectedMinorBubble.minor });
  }

  return (
    <>
      {breadcrumb.length > 1 && (
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-border">/</span>}
              {b.onClick ? (
                <button
                  type="button"
                  onClick={b.onClick}
                  className="text-muted hover:text-foreground hover:underline"
                >
                  {b.label}
                </button>
              ) : (
                <span className="font-medium text-foreground">{b.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          業界（17分類、企業名から自動推定・詳細画面で変更可）ごとに応募件数をバブルの大きさで表しています。業種・中分類（自由記述の詳細業種）は各バブル内・一覧表の内訳に表示されます。「未設定」は業界が入力されていない応募先です。
        </p>
        {missingMajor.length > 0 && (
          <SecondaryButton
            type="button"
            disabled={guessing}
            onClick={handleGuessMissingMajors}
            className="shrink-0"
          >
            {guessing
              ? "推定中…"
              : `未設定の業界・業種大分類を自動推定（${missingMajor.length}件）`}
          </SecondaryButton>
        )}
      </div>

      <div className="min-h-[260px] rounded-lg border border-border bg-panel px-4 py-10">
        {!drilledBubble ? (
          <div key="major" className="flex flex-wrap items-center justify-center gap-4">
            {bubbles.map((b, i) => {
              const size = sizeFor(b.count, majorMaxCount);
              return (
                <button
                  key={b.industry}
                  type="button"
                  onClick={() => handleDrillMajor(b.industry)}
                  title={`${b.industry}：${b.count}件${b.offerCount > 0 ? `（内定${b.offerCount}件）` : ""}${b.minorBreakdown.length > 0 ? `\n内訳：${b.minorBreakdown.join("、")}` : ""}\nクリックで業種・大分類の内訳を表示`}
                  style={{ width: size, height: size, animationDelay: `${i * 30}ms` }}
                  className={
                    "animate-bubble-pop flex shrink-0 flex-col items-center justify-center rounded-full border-2 text-center shadow-sm transition-transform hover:scale-105 " +
                    colorFor(b.industry)
                  }
                >
                  <span className="px-2 text-xs font-semibold leading-tight">
                    {b.industry}
                  </span>
                  <span className="text-lg font-bold">{b.count}</span>
                </button>
              );
            })}
          </div>
        ) : !drilledTypeBubble ? (
          <div key={`type-${drilledBubble.industry}`} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleBackToMajor}
                className="animate-bubble-pop flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-dashed border-muted text-center text-muted shadow-sm transition-transform hover:scale-105 hover:text-foreground"
              >
                <span className="text-lg">←</span>
                <span className="text-[10px]">戻る</span>
              </button>
              {typeBubbles.map((b, i) => {
                const size = sizeFor(b.count, typeMaxCount);
                return (
                  <button
                    key={b.type}
                    type="button"
                    onClick={() => handleDrillType(b.type)}
                    title={`${b.type}：${b.count}件\nクリックで業種・中分類の内訳を表示`}
                    style={{
                      width: size,
                      height: size,
                      animationDelay: `${(i + 1) * 30}ms`,
                    }}
                    className={
                      "animate-bubble-pop flex shrink-0 flex-col items-center justify-center rounded-full border-2 text-center shadow-sm transition-transform hover:scale-105 " +
                      colorFor(drilledBubble.industry)
                    }
                  >
                    <span className="px-2 text-xs font-semibold leading-tight">
                      {b.type}
                    </span>
                    <span className="text-lg font-bold">{b.count}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted">
              {drilledBubble.industry}（{drilledBubble.count}件）の業種・大分類内訳
            </p>
          </div>
        ) : (
          <div
            key={`minor-${drilledBubble.industry}-${drilledTypeBubble.type}`}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                onClick={handleBackToType}
                className="animate-bubble-pop flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-full border-2 border-dashed border-muted text-center text-muted shadow-sm transition-transform hover:scale-105 hover:text-foreground"
              >
                <span className="text-lg">←</span>
                <span className="text-[10px]">戻る</span>
              </button>
              {minorBubbles.map((b, i) => {
                const size = sizeFor(b.count, minorMaxCount);
                const isSelected = b.minor === selectedMinor;
                return (
                  <button
                    key={b.minor}
                    type="button"
                    onClick={() =>
                      setSelectedMinor((cur) => (cur === b.minor ? null : b.minor))
                    }
                    title={`${b.minor}：${b.count}件\nクリックで企業一覧を表示`}
                    style={{
                      width: size,
                      height: size,
                      animationDelay: `${(i + 1) * 30}ms`,
                    }}
                    className={
                      "animate-bubble-pop flex shrink-0 flex-col items-center justify-center rounded-full border-2 text-center shadow-sm transition-transform hover:scale-105 " +
                      colorFor(drilledBubble.industry) +
                      (isSelected
                        ? " ring-4 ring-accent ring-offset-2 ring-offset-panel"
                        : "")
                    }
                  >
                    <span className="px-2 text-xs font-semibold leading-tight">
                      {b.minor}
                    </span>
                    <span className="text-lg font-bold">{b.count}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs text-muted">
              {drilledBubble.industry} ／ {drilledTypeBubble.type}（
              {drilledTypeBubble.count}件）の業種・中分類内訳
            </p>
          </div>
        )}
      </div>

      {companyList && (
        <div className="rounded-lg border border-accent bg-panel px-4 py-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              {companyList.label}（{companyList.items.length}件）
            </h2>
            {selectedMinorBubble && (
              <button
                type="button"
                onClick={() => setSelectedMinor(null)}
                className="text-xs text-muted hover:text-foreground hover:underline"
              >
                絞り込み解除
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            {companyList.items.map((s) => (
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

      {!drilledBubble && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {bubbles.map((b) => (
            <div
              key={b.industry}
              className="flex flex-col gap-1 rounded-lg border border-border bg-panel px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground">{b.industry}</span>
                <span className="shrink-0 text-muted">
                  {b.count}件
                  {b.offerCount > 0 && `（内定${b.offerCount}）`}
                </span>
              </div>
              {b.minorBreakdown.length > 0 && (
                <p className="text-xs text-muted">{b.minorBreakdown.join("、")}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
