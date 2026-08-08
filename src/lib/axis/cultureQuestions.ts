import type { AnchorScore, AnchorType } from "./types";
import { ANCHOR_LABELS } from "./anchorQuestions";

export interface CultureQuestion {
  id: number;
  anchor: AnchorType;
  prompt: string;
  optionA: string;
  optionB: string;
  /** このアンカーの傾向が強いと判断する選択肢 */
  alignedOption: "A" | "B";
}

/**
 * ユーザー自身のキャリアアンカー診断(16問)と対になる、企業・仕事側の傾向を
 * 二択で答える診断。アンカーごとに1問、計8問。
 */
export const CULTURE_QUESTIONS: CultureQuestion[] = [
  {
    id: 1,
    anchor: "competence",
    prompt: "配属後のキャリアパスは？",
    optionA: "特定分野を極める専門特化型",
    optionB: "ジョブローテーションで幅広く経験",
    alignedOption: "A",
  },
  {
    id: 2,
    anchor: "management",
    prompt: "評価・昇進の仕組みは？",
    optionA: "マネジメント経験を重視し早期に管理職へ",
    optionB: "プレイヤーとしての専門性を重視",
    alignedOption: "A",
  },
  {
    id: 3,
    anchor: "autonomy",
    prompt: "働き方の裁量は？",
    optionA: "個人の裁量が大きい（進め方・時間が自由）",
    optionB: "チームでの協働・ルールに沿って進める",
    alignedOption: "A",
  },
  {
    id: 4,
    anchor: "security",
    prompt: "事業・組織の状態は？",
    optionA: "成長期のベンチャーで変化が多い",
    optionB: "安定した大手・老舗で腰を据えられる",
    alignedOption: "B",
  },
  {
    id: 5,
    anchor: "entrepreneurial",
    prompt: "求められる仕事のスタイルは？",
    optionA: "ゼロから新しい事業・仕組みを作ることが多い",
    optionB: "既存の仕組みを回す・改善することが多い",
    alignedOption: "A",
  },
  {
    id: 6,
    anchor: "service",
    prompt: "事業の性質は？",
    optionA: "社会的意義・ミッションを強く打ち出している",
    optionB: "社会的意義より収益性・効率を重視",
    alignedOption: "A",
  },
  {
    id: 7,
    anchor: "challenge",
    prompt: "日々の業務の難易度は？",
    optionA: "前例のない難しい課題に挑む機会が多い",
    optionB: "定型的で難易度が安定した業務が多い",
    alignedOption: "A",
  },
  {
    id: 8,
    anchor: "lifestyle",
    prompt: "働き方・残業の実態は？",
    optionA: "残業少なめでプライベートを両立しやすい",
    optionB: "繁忙期は残業や休日対応もある",
    alignedOption: "A",
  },
];

export type CultureAnswers = Record<string, "A" | "B">;

export interface CultureMatchItem {
  anchor: AnchorType;
  anchorLabel: string;
  question: CultureQuestion;
  companyHasTrait: boolean;
  match: "match" | "mismatch";
}

export interface CultureMatchResult {
  items: CultureMatchItem[];
  matchCount: number;
  mismatchCount: number;
  answeredCount: number;
}

/**
 * ユーザーが「重視している」と判断するアンカーの閾値。
 * 16問中そのアンカーの2問のうち少なくとも1問で一致していれば重視とみなす。
 */
const IMPORTANT_THRESHOLD = 1;

/** ユーザーのアンカースコアと企業カルチャー診断の回答を突き合わせる */
export function matchCultureWithAnchors(
  userScores: AnchorScore[],
  cultureAnswers: CultureAnswers,
): CultureMatchResult {
  const userByAnchor = new Map(userScores.map((s) => [s.anchor, s.score]));

  const items: CultureMatchItem[] = [];
  let answeredCount = 0;

  for (const q of CULTURE_QUESTIONS) {
    const answer = cultureAnswers[String(q.id)];
    if (!answer) continue;
    answeredCount++;

    const userScore = userByAnchor.get(q.anchor) ?? 0;
    if (userScore < IMPORTANT_THRESHOLD) continue;

    const companyHasTrait = answer === q.alignedOption;
    items.push({
      anchor: q.anchor,
      anchorLabel: ANCHOR_LABELS[q.anchor],
      question: q,
      companyHasTrait,
      match: companyHasTrait ? "match" : "mismatch",
    });
  }

  return {
    items,
    matchCount: items.filter((i) => i.match === "match").length,
    mismatchCount: items.filter((i) => i.match === "mismatch").length,
    answeredCount,
  };
}
