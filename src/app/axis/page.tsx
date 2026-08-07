"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { axisApi } from "@/lib/axis/api";
import { AxisShell, PrimaryButton, SecondaryButton } from "@/components/axis/ui";

const ROUTE_PREVIEW = [
  { step: "STEP1", title: "自己理解", desc: "Will-Can-Must・キャリアアンカー・動機タイプ" },
  { step: "STEP2", title: "譲れない条件", desc: "年収・勤務地などのMust条件" },
  { step: "STEP3", title: "優先条件と将来像", desc: "Want条件の重み配分・移行戦略" },
  { step: "STEP4", title: "軸カードの完成", desc: "ここまでの内容を1枚にまとめる" },
];

export default function AxisOnboardingPage() {
  const [hasStarted, setHasStarted] = useState<boolean | null>(null);

  useEffect(() => {
    axisApi
      .getProfile()
      .then((profile) => setHasStarted(profile.updatedAt !== null))
      .catch(() => setHasStarted(false));
  }, []);

  return (
    <AxisShell>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          転職コンパスへようこそ
        </h1>
        <p className="text-sm leading-relaxed text-muted">
          「転職の軸」を4つのステップで言語化し、選考機会を逃さない状態を作ります。所要時間の目安は15〜20分です。
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {ROUTE_PREVIEW.map((r) => (
          <div
            key={r.step}
            className="flex items-center gap-3 rounded-lg border border-border bg-panel px-4 py-3"
          >
            <span className="shrink-0 text-xs font-semibold tracking-wide text-accent">
              {r.step}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground">
                {r.title}
              </span>
              <span className="text-xs text-muted">{r.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <Link href="/axis/self">
          <PrimaryButton className="w-full" disabled={hasStarted === null}>
            {hasStarted ? "続きから再開する" : "診断をはじめる"}
          </PrimaryButton>
        </Link>
        <Link href="/selections">
          <SecondaryButton className="w-full">
            あとで（選考プロセス管理へ）
          </SecondaryButton>
        </Link>
      </div>
    </AxisShell>
  );
}
