"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { selectionsApi } from "@/lib/selections/api";
import { AppNav } from "@/components/app/AppNav";
import {
  AxisShell,
  ErrorBanner,
  Field,
  PrimaryButton,
  SecondaryButton,
} from "@/components/axis/ui";

export default function NewSelectionPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!companyName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const created = await selectionsApi.create({ companyName, position });
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
