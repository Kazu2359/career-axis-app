# 転職コンパス（仮称）

転職の軸を言語化し、選考機会を逃さず意思決定に迷わない状態を作るためのWebアプリ。

要件定義・決定ログのSSOTは [`docs/要件定義書.md`](./docs/要件定義書.md)。

## 開発環境セットアップ

```bash
npm install
cp .env.example .env.local  # Supabaseのプロジェクト作成後、値を埋める
npm run dev
```

[http://localhost:3000](http://localhost:3000) で確認。

## 技術スタック

Next.js（App Router） + TypeScript + Tailwind CSS + Supabase（Postgres/Auth）。詳細は要件定義書 §7・§8 を参照。

## デプロイ・本番設定（Supabase/Vercelダッシュボード側）

コードのpushだけでは反映されない、ダッシュボード側の手動設定。新規セットアップ時・環境再構築時に確認する。

- **DBマイグレーション**: `supabase/migrations/*.sql` をSupabase SQL Editorで実行（`0003_text_length_limits.sql` は自由入力テキストの文字数上限CHECK制約）
- **Auth > Sign In / Providers > Email**: Minimum password length を8に設定（Prevent use of leaked passwords はPro plan限定のため無料プランでは未設定）
- **Auth > Attack Protection**: Bot and Abuse Protection でCaptcha protectionを有効化し、Provider は Turnstile、SecretはCloudflare Turnstileのsecret keyを設定
- **Auth > Sign In / Providers > Email > SMTP Settings**: 独自ドメイン未取得のため、GmailアカウントのSMTPリレー（smtp.gmail.com:587 + Googleアプリパスワード）を使用。デフォルトのSupabase送信は送信数・到達率の制約があるため使わない
- **Vercel Environment Variables**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` を含む環境変数はProduction/Previewに設定し、追加後は再デプロイが必要（ビルド時に埋め込まれるため）
- **Cloudflare Turnstile**: ウィジェットのHostnamesに本番ドメインを追加済み。カスタムドメイン取得時はHostnamesへの追加が別途必要
