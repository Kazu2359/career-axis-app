"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AxisShell,
  ErrorBanner,
  Field,
  PrimaryButton,
} from "@/components/axis/ui";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    setDone(true);
    setLoading(false);
  }

  return (
    <AxisShell>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">パスワード再設定</h1>
        <p className="text-sm text-muted">転職コンパス</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {done ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-foreground">
            パスワードを更新しました。
          </p>
          <PrimaryButton onClick={() => router.push("/axis")}>
            アプリを開く
          </PrimaryButton>
        </div>
      ) : ready ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="新しいパスワード">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "処理中..." : "パスワードを更新する"}
          </PrimaryButton>
        </form>
      ) : (
        <p className="text-sm text-muted">
          リンクを確認しています…
          このまま進まない場合は、メール内のリンクの有効期限が切れている可能性があります。もう一度リセットメールを送信してください。
        </p>
      )}
    </AxisShell>
  );
}
