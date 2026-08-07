import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

export function apiError(
  code: ApiErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  return NextResponse.json(
    { error: { code, message, details: details ?? {} } },
    { status: STATUS_BY_CODE[code] },
  );
}

/**
 * DBエラーをそのままクライアントに返さない。
 * スキーマ情報(カラム名・制約名等)の漏えいを防ぐため、詳細はサーバーログにのみ出力する。
 */
export function dbError(error: { message: string }) {
  console.error("[db error]", error.message);
  return apiError("INTERNAL_ERROR", "サーバー内部でエラーが発生しました");
}

/** 自由入力テキストの文字数上限チェック。違反があれば最初のエラーメッセージを返す。 */
export function findLengthViolation(
  fields: Array<[label: string, value: string | undefined, max: number]>,
): string | null {
  for (const [label, value, max] of fields) {
    if (value != null && value.length > max) {
      return `${label}は${max}文字以内で入力してください`;
    }
  }
  return null;
}
