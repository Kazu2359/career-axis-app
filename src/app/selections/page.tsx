"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { selectionsApi } from "@/lib/selections/api";
import { buildSelectionsCsv, decodeCsvBuffer } from "@/lib/selections/csv";
import {
  SELECTION_STATUSES,
  computeWantFitScore,
  statusBadgeClasses,
  type Selection,
} from "@/lib/selections/types";
import { axisApi } from "@/lib/axis/api";
import type { WantCategory } from "@/lib/axis/types";
import { AppNav } from "@/components/app/AppNav";
import {
  AxisShell,
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
} from "@/components/axis/ui";

interface ImportResult {
  created: number;
  updated: number;
  errors: { line: number; message: string }[];
}

export default function SelectionsListPage() {
  const [selections, setSelections] = useState<Selection[]>([]);
  const [wantCategories, setWantCategories] = useState<WantCategory[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  function toggleSelected(id: string) {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!window.confirm(`選択した${ids.length}件を削除しますか？`)) return;

    setBulkDeleting(true);
    setError(null);
    try {
      await Promise.all(ids.map((id) => selectionsApi.remove(id)));
      setSelections((cur) => cur.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      setSelectMode(false);
    } catch {
      setError("一括削除に失敗しました。");
    } finally {
      setBulkDeleting(false);
    }
  }

  useEffect(() => {
    Promise.all([
      selectionsApi.list(statusFilter || undefined),
      axisApi.getWantCategories(),
    ])
      .then(([sel, wants]) => {
        setSelections(sel);
        setWantCategories(wants);
      })
      .catch(() => setError("読み込みに失敗しました。"))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  function handleExport() {
    const csv = buildSelectionsCsv(selections, wantCategories);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const a = document.createElement("a");
    a.href = url;
    a.download = `選考プロセス_${today}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const csv = decodeCsvBuffer(buffer);
      const result = await selectionsApi.import(csv);
      setImportResult(result);
      const refreshed = await selectionsApi.list(statusFilter || undefined);
      setSelections(refreshed);
    } catch {
      setError("インポートに失敗しました。");
    } finally {
      setImporting(false);
    }
  }

  return (
    <AxisShell>
      <AppNav />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">選考プロセス</h1>
        <div className="flex items-center gap-2">
          <SecondaryButton
            type="button"
            onClick={() => {
              setSelectMode((v) => !v);
              setSelectedIds(new Set());
            }}
          >
            {selectMode ? "選択モードを終了" : "複数選択"}
          </SecondaryButton>
          <SecondaryButton
            type="button"
            disabled={importing}
            onClick={() => fileInputRef.current?.click()}
          >
            {importing ? "インポート中…" : "CSVインポート"}
          </SecondaryButton>
          <SecondaryButton
            type="button"
            disabled={selections.length === 0}
            onClick={handleExport}
          >
            CSVエクスポート
          </SecondaryButton>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <Link href="/selections/new">
            <PrimaryButton>＋ 新規登録</PrimaryButton>
          </Link>
        </div>
      </div>
      <p className="-mt-4 text-xs text-muted">
        CSVは「企業名,職種,ステータス」の列（1行目はヘッダー）。企業名が一致する行は上書き更新されます。
        {wantCategories.length > 0 && (
          <>
            Want条件の列名（{wantCategories.map((c) => c.categoryName).join("・")}）を追加すると、1〜5の適合度評価も一緒に取り込めます。
          </>
        )}
      </p>

      {error && <ErrorBanner message={error} />}

      {selectMode && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-panel px-4 py-3">
          <span className="text-sm text-foreground">
            {selectedIds.size}件選択中
          </span>
          <button
            type="button"
            disabled={selectedIds.size === 0 || bulkDeleting}
            onClick={handleBulkDelete}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            {bulkDeleting ? "削除中…" : "選択した項目を削除"}
          </button>
        </div>
      )}

      {importResult && (
        <div className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground">
          <p>
            {importResult.created}件追加・{importResult.updated}件更新しました。
          </p>
          {importResult.errors.length > 0 && (
            <ul className="mt-1 list-disc pl-4 text-warn">
              {importResult.errors.map((e, i) => (
                <li key={i}>
                  {e.line}行目: {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="w-fit rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
      >
        <option value="">すべてのステータス</option>
        {SELECTION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {!loading && selections.length === 0 && (
        <p className="text-sm text-muted">
          まだ応募先が登録されていません。「＋ 新規登録」から追加してください。
        </p>
      )}

      <div className="flex flex-col gap-2">
        {selections.map((s) => {
          const fitScore = computeWantFitScore(wantCategories, s.wantFitScores);
          const leftContent = (
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {s.companyName}
              </span>
              {s.position && (
                <span className="text-xs text-muted">{s.position}</span>
              )}
            </div>
          );
          const rightContent = (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClasses(s.status)}`}
              >
                {s.status}
              </span>
              {fitScore !== null && (
                <span className="text-[11px] text-muted">
                  適合度 {fitScore}点
                </span>
              )}
            </div>
          );

          if (selectMode) {
            const selected = selectedIds.has(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleSelected(s.id)}
                className={
                  "flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition-colors " +
                  (selected
                    ? "border-accent bg-accent-soft"
                    : "border-border bg-panel hover:border-accent")
                }
              >
                <span className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className={
                      "flex h-4 w-4 shrink-0 items-center justify-center rounded border " +
                      (selected
                        ? "border-accent bg-accent text-white"
                        : "border-border")
                    }
                  >
                    {selected && "✓"}
                  </span>
                  {leftContent}
                </span>
                {rightContent}
              </button>
            );
          }

          return (
            <Link
              key={s.id}
              href={`/selections/${s.id}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-border bg-panel px-4 py-3 transition-colors hover:border-accent"
            >
              {leftContent}
              {rightContent}
            </Link>
          );
        })}
      </div>
    </AxisShell>
  );
}
