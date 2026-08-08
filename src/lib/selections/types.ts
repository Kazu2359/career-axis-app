export const SELECTION_STATUSES = [
  "応募",
  "書類選考",
  "一次面接",
  "二次面接",
  "最終面接",
  "内定",
  "不採用",
  "辞退",
] as const;

export type SelectionStatus = (typeof SELECTION_STATUSES)[number];

const STATUS_BADGE_CLASSES: Record<SelectionStatus, string> = {
  応募: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  書類選考: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  一次面接:
    "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  二次面接:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
  最終面接:
    "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  内定: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  不採用: "bg-slate-700 text-slate-100 dark:bg-slate-950 dark:text-slate-500",
  辞退: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
};

export function statusBadgeClasses(status: SelectionStatus): string {
  return STATUS_BADGE_CLASSES[status];
}

export interface Selection {
  id: string;
  companyName: string;
  position: string;
  industry: string | null;
  companyUrl: string | null;
  status: SelectionStatus;
  mustConditionCheck: Record<string, boolean> | null;
  wantFitScores: Record<string, number> | null;
  createdAt: string;
  updatedAt: string;
}

interface WeightedCategory {
  id: string;
  weight: number;
}

/**
 * Want条件は求人の構造化データがまだ無く自動判定できないため、
 * カテゴリごとに1〜5で手動評価した値を重み配分で加重平均し0〜100点に正規化する。
 * 未評価のカテゴリは分母（重み）から除外し、評価済み分だけで採点する。
 */
export function computeWantFitScore(
  wantCategories: WeightedCategory[],
  scores: Record<string, number> | null,
): number | null {
  if (!scores) return null;

  let ratedWeight = 0;
  let earned = 0;
  for (const c of wantCategories) {
    const rating = scores[c.id];
    if (rating == null) continue;
    ratedWeight += c.weight;
    earned += c.weight * (rating / 5);
  }

  if (ratedWeight === 0) return null;
  return Math.round((earned / ratedWeight) * 100);
}
