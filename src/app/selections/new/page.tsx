"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectionsApi } from "@/lib/selections/api";
import {
  INDUSTRIES,
  INDUSTRY_TYPES,
  guessIndustry,
  guessIndustryType,
} from "@/lib/selections/industry";
import { POSITION_CATEGORIES } from "@/lib/selections/position";
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
  const [positionCategory, setPositionCategory] = useState("");
  const [industryMajor, setIndustryMajor] = useState("");
  const [industryMajorTouched, setIndustryMajorTouched] = useState(false);
  const [industryTypeMajor, setIndustryTypeMajor] = useState("");
  const [industryTypeMajorTouched, setIndustryTypeMajorTouched] = useState(false);
  const [industryMinor, setIndustryMinor] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleCompanyNameBlur() {
    if (!industryMajorTouched && !industryMajor) {
      const guessed = guessIndustry(companyName, industryMinor);
      if (guessed) setIndustryMajor(guessed);
    }
    if (!industryTypeMajorTouched && !industryTypeMajor) {
      const guessedType = guessIndustryType(companyName, industryMinor);
      if (guessedType) setIndustryTypeMajor(guessedType);
    }
  }

  async function handleCreate() {
    if (!companyName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await selectionsApi.create({
        companyName,
        position: positionCategory,
        positionCategory: positionCategory || null,
        industryMajor: industryMajor || null,
        industryTypeMajor: industryTypeMajor || null,
        industryMinor: industryMinor || null,
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
      <Field label="職種（任意・候補から選ぶか自由入力）">
        <input
          list="position-category-options"
          value={positionCategory}
          onChange={(e) => setPositionCategory(e.target.value)}
          placeholder="候補から選ぶか、自由に入力"
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <datalist id="position-category-options">
          {POSITION_CATEGORIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </Field>
      <Field label="業界（任意・企業名から自動推定、変更可）">
        <select
          value={industryMajor}
          onChange={(e) => {
            setIndustryMajor(e.target.value);
            setIndustryMajorTouched(true);
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
      <Field label="業種・大分類（任意・企業名から自動推定、変更可）">
        <select
          value={industryTypeMajor}
          onChange={(e) => {
            setIndustryTypeMajor(e.target.value);
            setIndustryTypeMajorTouched(true);
          }}
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        >
          <option value="">未設定</option>
          {INDUSTRY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </Field>
      <Field label="業種・中分類（任意・より具体的な業種、自由記述）">
        <input
          value={industryMinor}
          onChange={(e) => setIndustryMinor(e.target.value)}
          placeholder="例：HRTech・SaaS"
          className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
        />
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
