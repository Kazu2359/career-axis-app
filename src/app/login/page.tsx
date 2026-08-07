"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  AxisShell,
  ErrorBanner,
  Field,
  PrimaryButton,
  SecondaryButton,
} from "@/components/axis/ui";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signIn" | "signUp" | "forgotPassword">(
    "signIn",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedUpNotice, setSignedUpNotice] = useState(false);
  const [resetSentNotice, setResetSentNotice] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSignedUpNotice(false);
    setResetSentNotice(false);
    const supabase = createClient();

    if (mode === "forgotPassword") {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${window.location.origin}/reset-password` },
      );
      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }
      setResetSentNotice(true);
      setLoading(false);
      return;
    }

    if (mode === "signIn") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      router.push("/axis");
      router.refresh();
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }
    setSignedUpNotice(true);
    setLoading(false);
  }

  return (
    <AxisShell>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold text-foreground">
          {mode === "signIn"
            ? "ログイン"
            : mode === "signUp"
              ? "アカウント作成"
              : "パスワード再設定"}
        </h1>
        <p className="text-sm text-muted">転職コンパス</p>
      </div>

      {error && <ErrorBanner message={error} />}
      {signedUpNotice && (
        <div className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground">
          確認メールを送信しました。メール内のリンクを開いてからログインしてください。
        </div>
      )}
      {resetSentNotice && (
        <div className="rounded-lg border border-border bg-panel px-3 py-2 text-sm text-foreground">
          パスワード再設定用のメールを送信しました。メール内のリンクを開いて新しいパスワードを設定してください。
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="メールアドレス">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
          />
        </Field>
        {mode !== "forgotPassword" && (
          <Field label="パスワード">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-border bg-panel px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </Field>
        )}
        <PrimaryButton type="submit" disabled={loading}>
          {loading
            ? "処理中..."
            : mode === "signIn"
              ? "ログイン"
              : mode === "signUp"
                ? "アカウントを作成"
                : "再設定メールを送信"}
        </PrimaryButton>
      </form>

      {mode === "signIn" && (
        <button
          onClick={() => {
            setMode("forgotPassword");
            setError(null);
            setSignedUpNotice(false);
            setResetSentNotice(false);
          }}
          className="self-start text-sm text-muted hover:text-foreground hover:underline"
        >
          パスワードをお忘れですか？
        </button>
      )}

      <SecondaryButton
        onClick={() => {
          setMode(mode === "signIn" ? "signUp" : "signIn");
          setError(null);
          setSignedUpNotice(false);
          setResetSentNotice(false);
        }}
      >
        {mode === "signIn" ? "初めての方はアカウント作成" : "ログインに戻る"}
      </SecondaryButton>
    </AxisShell>
  );
}
