"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectionsApi } from "@/lib/selections/api";
import { INDUSTRIES, guessIndustry } from "@/lib/selections/industry";
import { AppNav } from "@/components/app/AppNav";
import {
  AxisShell,
  ErrorBanner,
  Field,
  PrimaryButton,
  SecondaryButton,
  TextArea,
} from "@/components/axis/ui";

export default function NewSelectionPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [industry, setIndustry] = useState("");
  const [industryTouched, setIndustryTouched] = useState(false);
  const [companyUrl, setCompanyUrl] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCompanyNameBlur() {
    if (industryTouched || industry) return;
    const guessed = guessIndustry(companyName);
    if (guessed) setIndustry(guessed);
  }

  async function handleCreate() {
    if (!companyName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await selectionsApi.create({
        companyName,
        position,
        industry: industry || null,
        companyUrl: companyUrl || null,
        note: note || null,
      });
      router.push(`/selections/${created.id}`);
    } catch {
      setError("登録に失敗しました。");
      setSaving(false);
    }
  }

  return (
    <AxisShell>
      <AppNav />
      <h1 className="text-xl font-bold text-foreground">応募先を登録</h1>

      {error && <ErrorBanner message={error} />}

      <Field label="企業名">
        <input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          onBlur={handleCompanyNameBlur}
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </Field>
      <Field label="職種（任意）">
        <input
          value={position}
          onChange={(e) => setPosition(e.target.value)}
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </Field>
      <Field label="業界（任意・企業名から自動推定、変更可）">
        <select
          value={industry}
          onChange={(e) => {
            setIndustry(e.target.value);
            setIndustryTouched(true);
          }}
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">未設定</option>
          {INDUSTRIES.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </Field>
      <Field label="企業URL（任意・求人ページや企業サイトなど）">
        <input
          type="url"
          value={companyUrl}
          onChange={(e) => setCompanyUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </Field>
      <Field label="メモ（任意）">
        <TextArea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="仕事内容、面接の所感、選考の経緯など"
        />
      </Field>

      <div className="flex gap-2">
        <PrimaryButton
          className="flex-1"
          onClick={handleCreate}
          disabled={saving || !companyName.trim()}
        >
          登録する
        </PrimaryButton>
        <SecondaryButton onClick={() => router.push("/selections")}>
          キャンセル
        </SecondaryButton>
      </div>
    </AxisShell>
  );
}
