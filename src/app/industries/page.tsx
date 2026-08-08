"use client";

import { useEffect, useState } from "react";
import { selectionsApi } from "@/lib/selections/api";
import type { Selection } from "@/lib/selections/types";
import { AppNav } from "@/components/app/AppNav";
import { WideShell, ErrorBanner } from "@/components/axis/ui";
import { IndustryMapView } from "./IndustryMapView";
import { PositionMapView } from "./PositionMapView";
import { HeatmapView } from "./HeatmapView";

type Tab = "industry" | "position" | "heatmap";

export default function IndustriesPage() {
  const [tab, setTab] = useState<Tab>("industry");
  const [selections, setSelections] = useState<Selection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    selectionsApi
      .list()
      .then(setSelections)
      .catch(() => setError("読み込みに失敗しました。"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <WideShell>
      <AppNav />
      <h1 className="text-xl font-bold text-foreground">業界・職種マップ</h1>

      <div className="flex w-fit gap-1 rounded-full border border-border bg-panel p-1">
        {(
          [
            { key: "industry", label: "業界" },
            { key: "position", label: "職種" },
            { key: "heatmap", label: "ヒートマップ" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
              (tab === t.key
                ? "bg-accent-soft text-foreground"
                : "text-muted hover:text-foreground")
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} />}

      {!loading && selections.length === 0 && (
        <p className="text-sm text-muted">
          まだ応募先が登録されていません。「選考プロセス」から追加してください。
        </p>
      )}

      {!loading && selections.length > 0 && (
        <div key={tab} className="animate-fade-in-up flex flex-col gap-6">
          {tab === "industry" && (
            <IndustryMapView
              selections={selections}
              setSelections={setSelections}
              setError={setError}
            />
          )}
          {tab === "position" && (
            <PositionMapView
              selections={selections}
              setSelections={setSelections}
              setError={setError}
            />
          )}
          {tab === "heatmap" && <HeatmapView selections={selections} />}
        </div>
      )}
    </WideShell>
  );
}
