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
