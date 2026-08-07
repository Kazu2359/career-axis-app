import type {
  AxisProfile,
  MotivationType,
  TransitionPath,
  TransitionTimeframe,
} from "./types";

/** axis_profilesテーブルの1行の形（snake_case） */
export interface AxisProfileRow {
  user_id: string;
  will_enjoy_text: string | null;
  will_drain_text: string | null;
  can_relied_text: string | null;
  can_proud_text: string | null;
  must_market_text: string | null;
  approach_style_text: string | null;
  motivation_type: string | null;
  motivation_note: string | null;
  entry_strength_text: string | null;
  north_star_text: string | null;
  north_star_timeframe: string | null;
  allowed_transition_paths: string[] | null;
  updated_at: string | null;
}

export const EMPTY_AXIS_PROFILE: AxisProfile = {
  willEnjoyText: "",
  willDrainText: "",
  canReliedText: "",
  canProudText: "",
  mustMarketText: "",
  approachStyleText: "",
  motivationType: null,
  motivationNote: "",
  entryStrengthText: "",
  northStarText: "",
  northStarTimeframe: null,
  allowedTransitionPaths: [],
  updatedAt: null,
};

export function rowToAxisProfile(row: AxisProfileRow | null): AxisProfile {
  if (!row) return EMPTY_AXIS_PROFILE;
  return {
    willEnjoyText: row.will_enjoy_text ?? "",
    willDrainText: row.will_drain_text ?? "",
    canReliedText: row.can_relied_text ?? "",
    canProudText: row.can_proud_text ?? "",
    mustMarketText: row.must_market_text ?? "",
    approachStyleText: row.approach_style_text ?? "",
    motivationType: (row.motivation_type as MotivationType | null) ?? null,
    motivationNote: row.motivation_note ?? "",
    entryStrengthText: row.entry_strength_text ?? "",
    northStarText: row.north_star_text ?? "",
    northStarTimeframe:
      (row.north_star_timeframe as TransitionTimeframe | null) ?? null,
    allowedTransitionPaths: (row.allowed_transition_paths ??
      []) as TransitionPath[],
    updatedAt: row.updated_at,
  };
}

/** クライアントから送られてきた部分的なプロファイル更新をDBの行(snake_case)に変換する */
export function partialAxisProfileToRow(
  partial: Partial<AxisProfile>,
): Partial<AxisProfileRow> {
  const row: Partial<AxisProfileRow> = {};
  if (partial.willEnjoyText !== undefined) row.will_enjoy_text = partial.willEnjoyText;
  if (partial.willDrainText !== undefined) row.will_drain_text = partial.willDrainText;
  if (partial.canReliedText !== undefined) row.can_relied_text = partial.canReliedText;
  if (partial.canProudText !== undefined) row.can_proud_text = partial.canProudText;
  if (partial.mustMarketText !== undefined) row.must_market_text = partial.mustMarketText;
  if (partial.approachStyleText !== undefined) row.approach_style_text = partial.approachStyleText;
  if (partial.motivationType !== undefined) row.motivation_type = partial.motivationType;
  if (partial.motivationNote !== undefined) row.motivation_note = partial.motivationNote;
  if (partial.entryStrengthText !== undefined) row.entry_strength_text = partial.entryStrengthText;
  if (partial.northStarText !== undefined) row.north_star_text = partial.northStarText;
  if (partial.northStarTimeframe !== undefined) row.north_star_timeframe = partial.northStarTimeframe;
  if (partial.allowedTransitionPaths !== undefined) row.allowed_transition_paths = partial.allowedTransitionPaths;
  return row;
}
