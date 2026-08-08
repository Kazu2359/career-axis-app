import {
  computeWantFitScore,
  type Selection,
  type WeightedCategory,
} from "./types";

export const SELECTION_SORT_OPTIONS = [
  { value: "fitScoreDesc", label: "適合度が高い順" },
  { value: "fitScoreAsc", label: "適合度が低い順" },
  { value: "companyNameAsc", label: "企業名順" },
  { value: "updatedDesc", label: "更新日が新しい順" },
  { value: "createdDesc", label: "登録日が新しい順" },
] as const;

export type SelectionSortKey = (typeof SELECTION_SORT_OPTIONS)[number]["value"];

export const DEFAULT_SELECTION_SORT: SelectionSortKey = "fitScoreDesc";

export function sortSelections(
  selections: Selection[],
  key: SelectionSortKey,
  wantCategories: WeightedCategory[],
): Selection[] {
  if (key === "fitScoreDesc" || key === "fitScoreAsc") {
    const scored = selections.map((s) => ({
      s,
      score: computeWantFitScore(wantCategories, s.wantFitScores),
    }));
    scored.sort((a, b) => {
      if (a.score == null) return 1;
      if (b.score == null) return -1;
      return key === "fitScoreDesc" ? b.score - a.score : a.score - b.score;
    });
    return scored.map((x) => x.s);
  }

  const sorted = [...selections];
  switch (key) {
    case "companyNameAsc":
      sorted.sort((a, b) => a.companyName.localeCompare(b.companyName, "ja"));
      break;
    case "updatedDesc":
      sorted.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      break;
    case "createdDesc":
      sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
  }
  return sorted;
}
