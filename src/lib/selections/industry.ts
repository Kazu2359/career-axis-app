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
  [/銀行|証券|保険|信用金庫|フィナンシャル|キャピタル/, "金融"],
  [/商事|物産|商会/, "商社"],
  [/不動産|ハウジング|エステート/, "不動産"],
  [/建設|工務店|ゼネコン|住宅/, "建設"],
  [/製薬|薬品|ファーマ|ヘルスケア|メディカル/, "医療・製薬"],
  [/食品|フーズ|フード/, "食品"],
  [/運輸|物流|ロジスティクス|運送/, "運輸・物流"],
  [/コンサル/, "コンサルティング"],
  [/システム|ソフト|テック|デジタル|データ|IT/i, "IT・ソフトウェア"],
  [/広告|マーケティング|メディア/, "広告・マーケティング"],
  [/人材|キャリア|リクルート/, "人材"],
  [/通信|モバイル|テレコム/, "通信"],
  [/教育|スクール|アカデミー/, "教育"],
];

export function guessIndustry(companyName: string): string | null {
  for (const [pattern, industry] of KEYWORD_RULES) {
    if (pattern.test(companyName)) return industry;
  }
  return null;
}
