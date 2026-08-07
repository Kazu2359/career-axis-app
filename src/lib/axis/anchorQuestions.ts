import type { AnchorScore, AnchorType } from "./types";

export const ANCHOR_LABELS: Record<AnchorType, string> = {
  competence: "専門・職能別コンピタンス",
  management: "全般管理コンピタンス",
  autonomy: "自律・独立",
  security: "保障・安定",
  entrepreneurial: "起業家的創造性",
  service: "奉仕・社会貢献",
  challenge: "純粋な挑戦",
  lifestyle: "生活様式（ワークライフバランス）",
};

export interface AnchorQuestion {
  id: number;
  anchor: AnchorType;
  prompt: string;
  optionA: string;
  optionB: string;
  /** どちらの選択肢がこのアンカーに強く紐づくか */
  alignedOption: "A" | "B";
}

export const ANCHOR_QUESTIONS: AnchorQuestion[] = [
  { id: 1, anchor: "competence", prompt: "新しい役割を選ぶなら？", optionA: "特定分野を極めてプロとして認められたい", optionB: "様々な役割を経験して視野を広げたい", alignedOption: "A" },
  { id: 2, anchor: "competence", prompt: "最も誇れる瞬間は？", optionA: "専門知識・技術で他にない成果を出せた時", optionB: "チームや組織全体を動かして成果を出せた時", alignedOption: "A" },
  { id: 3, anchor: "management", prompt: "昇進の打診があったら？", optionA: "マネジメント・経営に近づけるならぜひ挑戦したい", optionB: "プレイヤーとして専門性を発揮する方が自分らしい", alignedOption: "A" },
  { id: 4, anchor: "management", prompt: "複数部署が絡むプロジェクトで惹かれる役割は？", optionA: "全体を統括し意思決定する役割", optionB: "自分の担当領域で確実に成果を出す役割", alignedOption: "A" },
  { id: 5, anchor: "autonomy", prompt: "理想の働き方は？", optionA: "自分のペース・やり方で裁量を持って進める", optionB: "明確なルール・チームの中で安心して進める", alignedOption: "A" },
  { id: 6, anchor: "autonomy", prompt: "上司から細かく進め方を指示されたら？", optionA: "窮屈に感じ、任せてほしいと思う", optionB: "方向性が明確になって安心する", alignedOption: "A" },
  { id: 7, anchor: "security", prompt: "転職先選びで優先したいのは？", optionA: "多少挑戦的でも成長機会が大きい環境", optionB: "長く安定して働ける環境", alignedOption: "B" },
  { id: 8, anchor: "security", prompt: "予測できない大きな組織変化が起きたら？", optionA: "むしろ刺激になり前向きに捉えられる", optionB: "不安を感じ、落ち着いた環境を求めたくなる", alignedOption: "B" },
  { id: 9, anchor: "entrepreneurial", prompt: "「新しい事業をゼロから作る」機会があったら？", optionA: "ぜひ挑戦したい", optionB: "既にある仕組みを改善する方が向いている", alignedOption: "A" },
  { id: 10, anchor: "entrepreneurial", prompt: "アイデアを形にする過程で惹かれるのは？", optionA: "誰もやっていない新しいことを考えつくこと", optionB: "既存の仕組みを効率化・改善すること", alignedOption: "A" },
  { id: 11, anchor: "service", prompt: "仕事選びで事業の社会的意義は？", optionA: "誰かの役に立っている実感が最優先", optionB: "事業内容より働き方や成果そのものを重視", alignedOption: "A" },
  { id: 12, anchor: "service", prompt: "応援できない事業内容の会社から高待遇オファーが来たら？", optionA: "意義を感じられないなら受けない", optionB: "待遇が良ければ十分検討する", alignedOption: "A" },
  { id: 13, anchor: "challenge", prompt: "難易度の高い課題に直面したとき？", optionA: "燃える、解けるまで没頭したい", optionB: "ストレスに感じる、落ち着いて対応できる範囲がいい", alignedOption: "A" },
  { id: 14, anchor: "challenge", prompt: "「誰も解決できていない難問」を任されたら？", optionA: "ワクワクする", optionB: "できれば避けたい", alignedOption: "A" },
  { id: 15, anchor: "lifestyle", prompt: "キャリアと私生活のバランスは？", optionA: "両方大事にしたい、両立できる環境を優先", optionB: "今はキャリアに集中したい時期", alignedOption: "A" },
  { id: 16, anchor: "lifestyle", prompt: "残業や休日出勤が多くても成果が出せるなら？", optionA: "それでも私生活を優先したい", optionB: "キャリアのためなら一時的には許容できる", alignedOption: "A" },
];

export const ANCHOR_ORDER: AnchorType[] = [
  "competence",
  "management",
  "autonomy",
  "security",
  "entrepreneurial",
  "service",
  "challenge",
  "lifestyle",
];

export interface AnchorAnswer {
  questionId: number;
  choice: "A" | "B";
}

/** 16問の回答から8アンカー分のスコア(0〜2)を算出する */
export function scoreAnchorAnswers(answers: AnchorAnswer[]): AnchorScore[] {
  const byId = new Map(answers.map((a) => [a.questionId, a.choice]));
  return ANCHOR_ORDER.map((anchor) => {
    const questions = ANCHOR_QUESTIONS.filter((q) => q.anchor === anchor);
    const score = questions.reduce((sum, q) => {
      const choice = byId.get(q.id);
      return sum + (choice === q.alignedOption ? 1 : 0);
    }, 0);
    return { anchor, score };
  });
}

/** 上位スコアが3つ以上同点の場合、回答の一貫性を疑い再診断を促す */
export function needsRediagnosis(scores: AnchorScore[]): boolean {
  if (scores.length === 0) return false;
  const max = Math.max(...scores.map((s) => s.score));
  if (max === 0) return false;
  return scores.filter((s) => s.score === max).length >= 3;
}
