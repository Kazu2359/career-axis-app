"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { axisApi } from "@/lib/axis/api";
import { MOTIVATION_TYPES, type MotivationType } from "@/lib/axis/types";
import { StepProgress } from "@/components/axis/StepProgress";
import {
  AxisShell,
  ErrorBanner,
  Field,
  PrimaryButton,
  TextArea,
} from "@/components/axis/ui";

export default function MotivationTypePage() {
  return (
    <Suspense fallback={null}>
      <MotivationTypePageInner />
    </Suspense>
  );
}

function MotivationTypePageInner() {
  const router = useRouter();
  const backToCard = useSearchParams().get("edit") === "1";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motivationType, setMotivationType] = useState<MotivationType | null>(
    null,
  );
  const [motivationNote, setMotivationNote] = useState("");

  useEffect(() => {
    axisApi
      .getProfile()
      .then((p) => {
        setMotivationType(p.motivationType);
        setMotivationNote(p.motivationNote);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleNext() {
    setSaving(true);
    setError(null);
    try {
      await axisApi.saveProfile({ motivationType, motivationNote });
      router.push(backToCard ? "/axis/card" : "/axis/must");
    } catch {
      setError("保存に失敗しました。しばらくしてからもう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AxisShell>
      <StepProgress step={1} label="自己理解（3/3）" percent={23} />
      <h1 className="text-xl font-bold text-foreground">
        今回の転職の、一番の動機は？
      </h1>

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-2 gap-2">
        {MOTIVATION_TYPES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMotivationType(m.value)}
            disabled={loading}
            className={
              "rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-40 " +
              (motivationType === m.value
                ? "border-accent bg-accent-soft"
                : "border-border bg-panel hover:border-accent")
            }
          >
            <div className="text-sm font-semibold text-foreground">
              {m.label}
            </div>
            <div className="text-xs text-muted">{m.description}</div>
          </button>
        ))}
      </div>

      <Field label="補足（任意）">
        <TextArea
          value={motivationNote}
          onChange={(e) => setMotivationNote(e.target.value)}
          disabled={loading}
          className="min-h-16"
        />
      </Field>

      <PrimaryButton
        onClick={handleNext}
        disabled={loading || saving || !motivationType}
      >
        {saving
          ? "保存中..."
          : backToCard
            ? "保存してカードに戻る"
            : "次へ（Must条件）"}
      </PrimaryButton>
    </AxisShell>
  );
}
