export const POSITION_CATEGORIES = [
  "営業・セールス",
  "エンジニア・開発",
  "コンサルタント",
  "PM・PMO",
  "企画・マーケティング",
  "人事・採用",
  "経理・財務",
  "法務・知財",
  "カスタマーサクセス・サポート",
  "経営・管理職",
  "総務・バックオフィス",
  "研究・開発（技術職）",
  "その他",
] as const;

const KEYWORD_RULES: Array<[RegExp, (typeof POSITION_CATEGORIES)[number]]> = [
  [/経理|財務|会計|ifrs/i, "経理・財務"],
  [/法務|知財|コンプライアンス/, "法務・知財"],
  [/人事|採用|\bhr\b/i, "人事・採用"],
  [/カスタマーサクセス|カスタマーサポート|\bcs\b/i, "カスタマーサクセス・サポート"],
  [/pmo|プロジェクトマネ/i, "PM・PMO"],
  [/コンサル/, "コンサルタント"],
  [/マーケティング|広報|\bpr\b|企画/i, "企画・マーケティング"],
  [/総務|バックオフィス|一般事務/, "総務・バックオフィス"],
  [/経営|coo|cfo|ceo|事業責任者/i, "経営・管理職"],
  [/研究開発|r&d/i, "研究・開発（技術職）"],
  [/エンジニア|開発|プログラマ|\bse\b/i, "エンジニア・開発"],
  [/営業|セールス|sales/i, "営業・セールス"],
];

/**
 * 職種テキストから職種カテゴリを推定する。あくまで簡易的なキーワード判定で
 * 精度は保証しないため、外れている場合は手動で修正する前提。
 */
export function guessPositionCategory(
  ...texts: (string | null | undefined)[]
): string | null {
  const combined = texts.filter(Boolean).join(" ");
  for (const [pattern, category] of KEYWORD_RULES) {
    if (pattern.test(combined)) return category;
  }
  return null;
}
