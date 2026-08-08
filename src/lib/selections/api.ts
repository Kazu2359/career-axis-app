"use client";

import type { Selection } from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error?.message ?? "通信エラーが発生しました");
  }
  return body as T;
}

export const selectionsApi = {
  list: (status?: string) =>
    request<Selection[]>(
      `/api/selections${status ? `?status=${encodeURIComponent(status)}` : ""}`,
    ),
  get: (id: string) => request<Selection>(`/api/selections/${id}`),
  create: (input: {
    companyName: string;
    position: string;
    industry?: string | null;
    companyUrl?: string | null;
    note?: string | null;
  }) =>
    request<Selection>("/api/selections", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  update: (
    id: string,
    input: Partial<
      Pick<
        Selection,
        "companyName" | "position" | "industry" | "companyUrl" | "note" | "status"
      >
    >,
  ) =>
    request<Selection>(`/api/selections/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    request<void>(`/api/selections/${id}`, { method: "DELETE" }),
  saveMustConditionCheck: (id: string, checks: Record<string, boolean>) =>
    request<Selection>(`/api/selections/${id}/check-must-conditions`, {
      method: "POST",
      body: JSON.stringify({ checks }),
    }),
  saveWantFitScores: (id: string, scores: Record<string, number>) =>
    request<Selection>(`/api/selections/${id}/want-fit`, {
      method: "POST",
      body: JSON.stringify({ scores }),
    }),
  import: (csv: string) =>
    request<{
      created: number;
      updated: number;
      errors: { line: number; message: string }[];
    }>("/api/selections/import", {
      method: "POST",
      body: JSON.stringify({ csv }),
    }),
};
