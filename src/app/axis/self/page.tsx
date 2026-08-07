"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { axisApi } from "@/lib/axis/api";
import { StepProgress } from "@/components/axis/StepProgress";
import {
  AxisShell,
  ErrorBanner,
  Field,
  PrimaryButton,
  TextArea,
} from "@/components/axis/ui";

export default function WillCanMustPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [willEnjoyText, setWillEnjoyText] = useState("");
  const [willDrainText, setWillDrainText] = useState("");
  const [canReliedText, setCanReliedText] = useState("");
  const [canProudText, setCanProudText] = useState("");
  const [mustMarketText, setMustMarketText] = useState("");
  const [approachStyleText, setApproachStyleText] = useState("");

  useEffect(() => {
    axisApi
      .getProfile()
      .then((p) => {
        setWillEnjoyText(p.willEnjoyText);
        setWillDrainText(p.willDrainText);
        setCanReliedText(p.canReliedText);
        setCanProudText(p.canProudText);
        setMustMarketText(p.mustMarketText);
        setApproachStyleText(p.approachStyleText);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleNext() {
    setSaving(true);
    setError(null);
    try {
      await axisApi.saveProfile({
        willEnjoyText,
        willDrainText,
        canReliedText,
        canProudText,
        mustMarketText,
        approachStyleText,
      });
      router.push("/axis/self/anchors");
    } catch {
      setError("保存に失敗しました。しばらくしてからもう一度お試しください。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AxisShell>
      <StepProgress step={1} label="自己理解（1/3）" percent={8} />
      <h1 className="text-xl font-bold text-foreground">
        あなたの土台を言語化する
      </h1>

      {error && <ErrorBanner message={error} />}

      <Field label="Will &mdash; 今の仕事で「楽しい」「時間を忘れて没頭できる」と感じる瞬間は？">
        <TextArea
          value={willEnjoyText}
          onChange={(e) => setWillEnjoyText(e.target.value)}
          disabled={loading}
        />
      </Field>
      <Field label="Will &mdash; 逆に、苦痛・消耗すると感じる瞬間は？">
        <TextArea
          value={willDrainText}
          onChange={(e) => setWillDrainText(e.target.value)}
          disabled={loading}
        />
      </Field>
      <Field label="Can &mdash; 同僚や上司から「これは任せたい」と頼られることは？">
        <TextArea
          value={canReliedText}
          onChange={(e) => setCanReliedText(e.target.value)}
          disabled={loading}
        />
      </Field>
      <Field label="Can &mdash; 成果として誇れる経験は？">
        <TextArea
          value={canProudText}
          onChange={(e) => setCanProudText(e.target.value)}
          disabled={loading}
        />
      </Field>
      <Field label="Must &mdash; 自分のスキルセット・市場価値についての認識は？">
        <TextArea
          value={mustMarketText}
          onChange={(e) => setMustMarketText(e.target.value)}
          disabled={loading}
        />
      </Field>
      <Field label="アプローチスタイル &mdash; 得意な仕事の進め方（任意）">
        <TextArea
          value={approachStyleText}
          onChange={(e) => setApproachStyleText(e.target.value)}
          disabled={loading}
          className="min-h-16"
        />
      </Field>

      <PrimaryButton onClick={handleNext} disabled={loading || saving}>
        {saving ? "保存中..." : "次へ（キャリアアンカー診断）"}
      </PrimaryButton>
    </AxisShell>
  );
}
