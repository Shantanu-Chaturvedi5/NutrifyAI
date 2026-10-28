"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, BackendError } from "@/lib/backend";
import type { HealthProfileResponse } from "@/lib/types";

export type ItemResult = { error?: string };

async function run(fn: () => Promise<unknown>): Promise<ItemResult> {
  try {
    await fn();
    revalidatePath("/profile");
    return {};
  } catch (e) {
    return { error: e instanceof BackendError ? e.message : "Something went wrong. Try again." };
  }
}

const BASE = "/health-profile";

export async function removeConditionAction(code: string) {
  return run(() => authedFetch<HealthProfileResponse>(`${BASE}/conditions/by-code/${encodeURIComponent(code)}`, { method: "DELETE" }));
}

export async function updateConditionAction(code: string, severity: string | null, notes: string | null) {
  return run(() =>
    authedFetch<HealthProfileResponse>(`${BASE}/conditions/by-code/${encodeURIComponent(code)}`, {
      method: "PUT",
      body: JSON.stringify({ conditionCode: code, severity: severity || null, notes: notes || null }),
    })
  );
}

export async function removeGoalAction(code: string) {
  return run(() => authedFetch<HealthProfileResponse>(`${BASE}/goals/by-code/${encodeURIComponent(code)}`, { method: "DELETE" }));
}

export async function updateGoalAction(code: string, targetValue: number | null, targetDate: string | null) {
  return run(() =>
    authedFetch<HealthProfileResponse>(`${BASE}/goals/by-code/${encodeURIComponent(code)}`, {
      method: "PUT",
      body: JSON.stringify({ goalCode: code, targetValue, targetDate: targetDate || null }),
    })
  );
}

export async function removeAllergyAction(name: string) {
  return run(() => authedFetch<HealthProfileResponse>(`${BASE}/allergies?name=${encodeURIComponent(name)}`, { method: "DELETE" }));
}

export async function renameAllergyAction(oldName: string, newName: string) {
  return run(() =>
    authedFetch<HealthProfileResponse>(`${BASE}/allergies?name=${encodeURIComponent(oldName)}`, {
      method: "PUT",
      body: JSON.stringify({ allergyName: newName.trim() }),
    })
  );
}