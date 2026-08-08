"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ANCHOR_QUESTIONS } from "@/lib/axis/anchorQuestions";
import { axisApi } from "@/lib/axis/api";
import { StepProgress } from "@/components/axis/StepProgress";
import { AxisShell, ErrorBanner, GhostButton, PrimaryButton } from "@/components/axis/ui";

type Choice = "A" | "B";

export default function AnchorDiagnosisPage() {
  return (
    <Suspense fallback={null}>
      <AnchorDiagnosisPageInner />
    </Suspense>
  );
}

function AnchorDiagnosisPageInner() {
  const router = useRouter();
  const backToCard = useSearchParams().get("edit") === "1";
  const [answers, setAnswers] = useState<Record<number, Choice>>({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rediagnosisPrompt, setRediagnosisPrompt] = useState(false);

  const question = ANCHOR_QUESTIONS[index];
  const isLast = index === ANCHOR_QUESTIONS.length - 1;

  async function submit(finalAnswers: Record<number, Choice>) {
    setSubmitting(true);
    setError(null);
    try {
      const payload = ANCHOR_QUESTIONS.map((q) => ({
        questionId: q.id,
        choice: finalAnswers[q.id],
      }));
      const result = await axisApi.submitAnchorAnswers(payload);
      if (result.needsRediagnosis) {
        setRediagnosisPrompt(true);
      } else {
        router.push(backToCard ? "/axis/card" : "/axis/self/motivation");
      }
    } catch {
      setError("送信に失敗しました。しばらくしてからもう一度お試しください。");
    } finally {
      setSubmitting(false);
    }
  }

  function choose(choice: Choice) {
    const next = { ...answers, [question.id]: choice };
    setAnswers(next);
    if (isLast) {
      submit(next);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function restart() {
    setAnswers({});
    setIndex(0);
    setRediagnosisPrompt(false);
  }

  if (rediagnosisPrompt) {
    return (
      <AxisShell>
        <StepProgress step={1} label="自己理解（2/3）" percent={19} />
        <div className="rounded-lg border border-warn bg-warn-soft px-4 py-4 text-sm text-warn">
          回答に迷いがあったようです（上位の価値観が3つ以上並びました）。もう一度落ち着いて診断しますか？
        </div>
        <div className="flex gap-2">
          <PrimaryButton className="flex-1" onClick={restart}>
            再診断する
          </PrimaryButton>
          <GhostButton
            className="flex-1 border border-border"
            onClick={() => router.push("/axis/self/motivation")}
          >
            このまま進む
          </GhostButton>
        </div>
      </AxisShell>
    );
  }

  return (
    <AxisShell>
      <StepProgress
        step={1}
        label="自己理解（2/3）"
        percent={8 + ((index + 1) / ANCHOR_QUESTIONS.length) * 15}
      />
      <div className="flex items-center justify-between text-xs text-muted">
        <span>
          Q{index + 1} / {ANCHOR_QUESTIONS.length}
        </span>
      </div>

      {error && <ErrorBanner message={error} />}

      <h1 className="text-lg font-bold text-foreground">{question.prompt}</h1>
      <p className="text-xs text-muted">近い方を選んでください。</p>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => choose("A")}
          disabled={submitting}
          className="rounded-lg border border-border bg-panel px-4 py-4 text-left text-sm text-foreground transition-colors hover:border-accent disabled:opacity-40"
        >
          <span className="mb-1 block text-xs font-semibold text-accent">A</span>
          {question.optionA}
        </button>
        <button
          onClick={() => choose("B")}
          disabled={submitting}
          className="rounded-lg border border-border bg-panel px-4 py-4 text-left text-sm text-foreground transition-colors hover:border-accent disabled:opacity-40"
        >
          <span className="mb-1 block text-xs font-semibold text-accent">B</span>
          {question.optionB}
        </button>
      </div>

      <div className="flex flex-wrap gap-1">
        {ANCHOR_QUESTIONS.map((q, i) => (
          <span
            key={q.id}
            className={
              "h-1.5 w-1.5 rounded-full " +
              (i < index
                ? "bg-accent"
                : i === index
                  ? "bg-foreground"
                  : "bg-border")
            }
          />
        ))}
      </div>

      {index > 0 && (
        <GhostButton
          className="self-start"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={submitting}
        >
          ← 前の質問
        </GhostButton>
      )}
    </AxisShell>
  );
}
