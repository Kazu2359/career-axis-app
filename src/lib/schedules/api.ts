"use client";

import type { Schedule } from "./types";

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

export const schedulesApi = {
  list: (params?: { selectionId?: string }) =>
    request<Schedule[]>(
      `/api/schedules${params?.selectionId ? `?selectionId=${encodeURIComponent(params.selectionId)}` : ""}`,
    ),
  create: (input: Omit<Schedule, "id">) =>
    request<Schedule>("/api/schedules", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  remove: (id: string) =>
    request<void>(`/api/schedules/${id}`, { method: "DELETE" }),
};
