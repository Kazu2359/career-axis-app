"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axisApi } from "@/lib/axis/api";
import {
  TRANSITION_PATHS,
  TRANSITION_TIMEFRAMES,
  type TransitionPath,
  type TransitionTimeframe,
} from "@/lib/axis/types";
import { StepProgress } from "@/components/axis/StepProgress";
import {
  AxisShell,
  ErrorBanner,
  Field,
  PrimaryButton,
  TextArea,
} from "@/components/axis/ui";

export default function TransitionStrategyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entryStrengthText, setEntryStrengthText] = useState("");
  const [northStarText, setNorthStarText] = useState("");
  const [northStarTimeframe, setNorthStarTimeframe] =
    useState<TransitionTimeframe | null>(null);
  const [allowedTransitionPaths, setAllowedTransitionPaths] = useState<
    TransitionPath[]
  >([]);

  useEffect(() => {
    axisApi
      .getProfile()
      .then((p) => {
        setEntryStrengthText(p.entryStrengthText);
        setNorthStarText(p.northStarText);
        setNorthStarTimeframe(p.northStarTimeframe);
        setAllowedTransitionPaths(p.allowedTransitionPaths);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function togglePath(path: TransitionPath) {
    setAllowedTransitionPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  }

  async function handleNext() {
    setSaving(true);
    setError(null);
    try {
      await axisApi.saveProfile({
        entryStrengthText,
        northStarText,
        northStarTimeframe,
        allowedTransitionPaths,
      });
      router.push("/axis/card");
    } catch {
      setError("保存に失敗しました。しばらくしてからもう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AxisShell>
      <StepProgress step={3} label="優先条件と将来像（2/2）" percent={75} />
      <h1 className="text-xl font-bold text-foreground">今と、その先</h1>

      {error && <ErrorBanner message={error} />}

      <Field label="入口の武器 &mdash; 今すぐ評価される強みは？">
        <TextArea
          value={entryStrengthText}
          onChange={(e) => setEntryStrengthText(e.target.value)}
          disabled={loading}
        />
      </Field>
      <Field label="将来像（North Star） &mdash; どうなっていたい？">
        <TextArea
          value={northStarText}
          onChange={(e) => setNorthStarText(e.target.value)}
          disabled={loading}
        />
      </Field>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">時間軸</span>
        <div className="grid grid-cols-3 gap-2">
          {TRANSITION_TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setNorthStarTimeframe(tf)}
              disabled={loading}
              className={
                "rounded-lg border px-2 py-2 text-sm transition-colors disabled:opacity-40 " +
                (northStarTimeframe === tf
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border bg-panel text-muted hover:border-accent")
              }
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm text-muted">
          許容できる移行パス（複数選択可）
        </span>
        <div className="flex flex-wrap gap-2">
          {TRANSITION_PATHS.map((path) => (
            <button
              key={path}
              onClick={() => togglePath(path)}
              disabled={loading}
              className={
                "rounded-full border px-3 py-1.5 text-xs transition-colors disabled:opacity-40 " +
                (allowedTransitionPaths.includes(path)
                  ? "border-accent bg-accent-soft text-foreground"
                  : "border-border bg-panel text-muted hover:border-accent")
              }
            >
              {path}
            </button>
          ))}
        </div>
      </div>

      <PrimaryButton onClick={handleNext} disabled={loading || saving}>
        {saving ? "保存中..." : "軸カードを完成させる"}
      </PrimaryButton>
    </AxisShell>
  );
}
