export const INDUSTRIES = [
  "IT・ソフトウェア",
  "コンサルティング",
  "金融",
  "商社",
  "メーカー・製造",
  "小売・流通",
  "不動産",
  "人材",
  "広告・マーケティング",
  "通信",
  "医療・製薬",
  "食品",
  "建設",
  "運輸・物流",
  "教育",
  "官公庁・団体",
  "その他",
] as const;

const KEYWORD_RULES: Array<[RegExp, (typeof INDUSTRIES)[number]]> = [
  [/銀行|証券|保険|信用金庫|フィナンシャル|キャピタル|fintech/i, "金融"],
  [/商事|物産|商会|ホールディングス/, "商社"],
  [/不動産|ハウジング|エステート/, "不動産"],
  [/建設|工務店|ゼネコン|住宅|建材/, "建設"],
  [/製薬|薬品|ファーマ|ヘルスケア|メディカル/, "医療・製薬"],
  [/食品|フーズ|フード|外食/, "食品"],
  [/運輸|物流|ロジスティクス|運送/, "運輸・物流"],
  [/コンサル|pmo/i, "コンサルティング"],
  [/広告|マーケティング|メディア|pr|プロモーション/i, "広告・マーケティング"],
  [/人材|キャリア|リクルート|採用支援/, "人材"],
  [/通信|モバイル|テレコム/, "通信"],
  [/教育|スクール|アカデミー/, "教育"],
  [/製造|素材|機械|ロボティクス|電機/, "メーカー・製造"],
  [
    /システム|ソフト|テック|デジタル|データ|セキュリティ|クラウド|erp|saas|dx|sier|\bit\b/i,
    "IT・ソフトウェア",
  ],
];

/**
 * 企業名や業種中分類のテキストから業界(大分類)を推定する。あくまで簡易的な
 * キーワード判定で精度は保証しないため、外れている場合は手動で修正する前提。
 */
export function guessIndustry(...texts: (string | null | undefined)[]): string | null {
  const combined = texts.filter(Boolean).join(" ");
  for (const [pattern, industry] of KEYWORD_RULES) {
    if (pattern.test(combined)) return industry;
  }
  return null;
}

export const INDUSTRY_TYPES = [
  "SaaS・ソフトウェア",
  "SIer・システム開発",
  "コンサルティング",
  "人材サービス",
  "広告・マーケティング",
  "BPO・アウトソーシング",
  "商社",
  "メーカー",
  "金融・FinTech",
  "その他",
] as const;

const INDUSTRY_TYPE_KEYWORD_RULES: Array<
  [RegExp, (typeof INDUSTRY_TYPES)[number]]
> = [
  [/sier|システム開発|受託開発/i, "SIer・システム開発"],
  [/コンサル|pmo/i, "コンサルティング"],
  [/人材|キャリア|リクルート|採用支援/, "人材サービス"],
  [/広告|マーケティング|メディア|pr|プロモーション/i, "広告・マーケティング"],
  [/bpo|アウトソーシング|施設運営/i, "BPO・アウトソーシング"],
  [/商事|物産|商会|商社|ホールディングス/, "商社"],
  [/製造|素材|機械|ロボティクス|電機|メーカー/, "メーカー"],
  [/fintech|銀行|証券|保険|フィナンシャル/i, "金融・FinTech"],
  [/saas|クラウド|erp/i, "SaaS・ソフトウェア"],
];

/**
 * 企業名や業種中分類のテキストから業種(大分類)を推定する。同様に精度は保証しない。
 */
export function guessIndustryType(
  ...texts: (string | null | undefined)[]
): string | null {
  const combined = texts.filter(Boolean).join(" ");
  for (const [pattern, type] of INDUSTRY_TYPE_KEYWORD_RULES) {
    if (pattern.test(combined)) return type;
  }
  return null;
}
