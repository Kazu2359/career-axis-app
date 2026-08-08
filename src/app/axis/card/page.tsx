"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { axisApi } from "@/lib/axis/api";
import { ANCHOR_LABELS } from "@/lib/axis/anchorQuestions";
import { MOTIVATION_TYPES } from "@/lib/axis/types";
import type { AxisCard } from "@/lib/axis/types";
import { StepProgress } from "@/components/axis/StepProgress";
import { AppNav } from "@/components/app/AppNav";
import { AxisShell, ErrorBanner, PrimaryButton, SecondaryButton } from "@/components/axis/ui";

function MiniPanel({
  label,
  editHref,
  children,
}: {
  label: string;
  editHref?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-panel p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-semibold tracking-wide text-accent">
          {label}
        </span>
        {editHref && (
          <Link
            href={editHref}
            className="text-xs text-muted hover:text-foreground hover:underline"
          >
            編集
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

export default function AxisCardPage() {
  const [card, setCard] = useState<AxisCard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axisApi
      .getCard()
      .then(setCard)
      .catch(() => setError("軸カードの読み込みに失敗しました。"));
  }, []);

  if (error) {
    return (
      <AxisShell>
        <ErrorBanner message={error} />
      </AxisShell>
    );
  }

  if (!card) {
    return (
      <AxisShell>
        <p className="text-sm text-muted">読み込み中...</p>
      </AxisShell>
    );
  }

  const motivation = MOTIVATION_TYPES.find(
    (m) => m.value === card.profile.motivationType,
  );
  const topAnchors = [...card.anchorScores]
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);
  const maxWeight = Math.max(1, ...card.wantCategories.map((c) => c.weight));

  return (
    <AxisShell>
      <AppNav />
      <StepProgress step={4} label="完成" percent={100} />
      <h1 className="text-xl font-bold text-foreground">あなたの軸カード</h1>

      <div className="grid grid-cols-2 gap-3">
        <MiniPanel label="MUST条件" editHref="/axis/must?edit=1">
          {card.mustConditions.length === 0 ? (
            <p className="text-sm text-muted">未登録</p>
          ) : (
            <ul className="flex flex-col gap-1 text-sm text-foreground">
              {card.mustConditions.map((c) => (
                <li key={c.id}>
                  {c.categoryLabel}: {c.conditionText}
                </li>
              ))}
            </ul>
          )}
        </MiniPanel>
        <MiniPanel label="動機タイプ" editHref="/axis/self/motivation?edit=1">
          {motivation ? (
            <>
              <div className="text-base font-bold text-foreground">
                {motivation.label}
              </div>
              <div className="text-xs text-muted">{motivation.description}</div>
            </>
          ) : (
            <p className="text-sm text-muted">未診断</p>
          )}
        </MiniPanel>
      </div>

      <MiniPanel label="WANT重み配分" editHref="/axis/priorities?edit=1">
        {card.wantCategories.length === 0 ? (
          <p className="text-sm text-muted">未設定</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {[...card.wantCategories]
              .sort((a, b) => b.weight - a.weight)
              .map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0 text-muted">
                    {c.categoryName}
                  </span>
                  <div className="h-1.5 flex-1 rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${(c.weight / maxWeight) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-6 shrink-0 text-right text-foreground">
                    {c.weight}
                  </span>
                </div>
              ))}
          </div>
        )}
      </MiniPanel>

      <div className="grid grid-cols-2 gap-3">
        <MiniPanel label="キャリアアンカー 上位" editHref="/axis/self/anchors?edit=1">
          {topAnchors.length === 0 ? (
            <p className="text-sm text-muted">未診断</p>
          ) : (
            <ol className="flex flex-col gap-1 text-sm text-foreground">
              {topAnchors.map((a, i) => (
                <li key={a.anchor}>
                  {i + 1}. {ANCHOR_LABELS[a.anchor]}
                </li>
              ))}
            </ol>
          )}
        </MiniPanel>
        <MiniPanel label="キャリア移行戦略" editHref="/axis/priorities/transition?edit=1">
          <div className="flex flex-col gap-1 text-xs text-foreground">
            <span>
              <b className="text-muted">入口：</b>
              {card.profile.entryStrengthText || "未入力"}
            </span>
            <span>
              <b className="text-muted">
                将来像（{card.profile.northStarTimeframe ?? "-"}）：
              </b>
              {card.profile.northStarText || "未入力"}
            </span>
            <span>
              <b className="text-muted">移行パス：</b>
              {card.profile.allowedTransitionPaths.join("・") || "未選択"}
            </span>
          </div>
        </MiniPanel>
      </div>

      <MiniPanel
        label="短期MUST / 中長期NORTH STAR"
        editHref="/axis/priorities/transition?edit=1"
      >
        <div className="flex flex-col gap-1.5 text-sm text-foreground">
          <span>
            <b className="text-accent">今回：</b>
            {card.mustConditions.map((c) => c.conditionText).join("・") ||
              "未設定"}
          </span>
          <span>
            <b className="text-accent">
              {card.profile.northStarTimeframe ?? "将来"}：
            </b>
            {card.profile.northStarText || "未設定"}
          </span>
        </div>
      </MiniPanel>

      <p className="text-xs text-muted">
        各項目右上の「編集」から、その項目だけをすぐに編集できます。
      </p>

      <div className="flex gap-2">
        <Link href="/axis/self?edit=1" className="flex-1">
          <SecondaryButton className="w-full">
            土台（Will/Can/Must）を編集
          </SecondaryButton>
        </Link>
        <Link href="/selections" className="flex-1">
          <PrimaryButton className="w-full">
            選考プロセス管理へ進む
          </PrimaryButton>
        </Link>
      </div>
    </AxisShell>
  );
}
