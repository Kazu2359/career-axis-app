"use client";

import type { AnchorAnswer } from "./anchorQuestions";
import type { AnchorScore, AxisCard, AxisProfile, MustCondition, WantCategory } from "./types";

export class ApiClientError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const code = body?.error?.code ?? "INTERNAL_ERROR";
    const message = body?.error?.message ?? "通信エラーが発生しました";
    throw new ApiClientError(code, message);
  }
  return body as T;
}

export const axisApi = {
  getProfile: () => request<AxisProfile>("/api/axis/profile"),
  saveProfile: (partial: Partial<AxisProfile>) =>
    request<AxisProfile>("/api/axis/profile", {
      method: "PUT",
      body: JSON.stringify(partial),
    }),

  submitAnchorAnswers: (answers: AnchorAnswer[]) =>
    request<{ scores: AnchorScore[]; needsRediagnosis: boolean }>(
      "/api/axis/anchor-answers",
      { method: "POST", body: JSON.stringify({ answers }) },
    ),
  getAnchorScores: () =>
    request<{ scores: AnchorScore[]; needsRediagnosis: boolean }>(
      "/api/axis/anchor-scores",
    ),

  getMustConditions: () => request<MustCondition[]>("/api/axis/must-conditions"),
  addMustCondition: (input: Omit<MustCondition, "id">) =>
    request<MustCondition>("/api/axis/must-conditions", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateMustCondition: (id: string, input: Partial<Omit<MustCondition, "id">>) =>
    request<MustCondition>(`/api/axis/must-conditions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteMustCondition: (id: string) =>
    request<void>(`/api/axis/must-conditions/${id}`, { method: "DELETE" }),

  getWantCategories: () => request<WantCategory[]>("/api/axis/want-categories"),
  addWantCategory: (categoryName: string) =>
    request<WantCategory>("/api/axis/want-categories", {
      method: "POST",
      body: JSON.stringify({ categoryName }),
    }),
  saveWantWeights: (weights: { id: string; weight: number }[]) =>
    request<WantCategory[]>("/api/axis/want-categories", {
      method: "PUT",
      body: JSON.stringify({ weights }),
    }),
  deleteWantCategory: (id: string) =>
    request<void>(`/api/axis/want-categories/${id}`, { method: "DELETE" }),

  getCard: () => request<AxisCard>("/api/axis/card"),
};
