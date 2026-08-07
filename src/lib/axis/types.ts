export type AnchorType =
  | "competence"
  | "management"
  | "autonomy"
  | "security"
  | "entrepreneurial"
  | "service"
  | "challenge"
  | "lifestyle";

export type MotivationType = "defensive" | "growth" | "escape" | "challenge";

export const MOTIVATION_TYPES: {
  value: MotivationType;
  label: string;
  description: string;
}[] = [
  { value: "defensive", label: "防衛型", description: "将来の選択肢を失わないため" },
  { value: "growth", label: "成長型", description: "スキル・経験を伸ばすため" },
  { value: "escape", label: "脱出型", description: "今の環境から離れるため" },
  { value: "challenge", label: "挑戦型", description: "新しいことに挑むため" },
];

export const TRANSITION_TIMEFRAMES = ["3年後", "5年後", "10年後"] as const;
export type TransitionTimeframe = (typeof TRANSITION_TIMEFRAMES)[number];

export const TRANSITION_PATHS = ["社内異動", "副業", "資格取得", "転籍"] as const;
export type TransitionPath = (typeof TRANSITION_PATHS)[number];

export interface AxisProfile {
  willEnjoyText: string;
  willDrainText: string;
  canReliedText: string;
  canProudText: string;
  mustMarketText: string;
  approachStyleText: string;
  motivationType: MotivationType | null;
  motivationNote: string;
  entryStrengthText: string;
  northStarText: string;
  northStarTimeframe: TransitionTimeframe | null;
  allowedTransitionPaths: TransitionPath[];
  updatedAt: string | null;
}

export interface AnchorScore {
  anchor: AnchorType;
  score: number;
}

export interface MustCondition {
  id: string;
  categoryLabel: string;
  conditionText: string;
  thresholdValue: number | null;
}

export interface WantCategory {
  id: string;
  categoryName: string;
  weight: number;
  isCustom: boolean;
}

export interface AxisCard {
  profile: AxisProfile;
  anchorScores: AnchorScore[];
  needsRediagnosis: boolean;
  mustConditions: MustCondition[];
  wantCategories: WantCategory[];
}
