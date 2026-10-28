"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, BackendError } from "@/lib/backend";

export type IntakeEntryType = "FOOD" | "WATER";

export interface IntakeLogEntryResponse {
  id: number;
  entryType: IntakeEntryType;
  description: string;
  calories: number | null;
  proteinG: number | null;
  waterMl: number | null;
  loggedAt: string;
}

export interface DailyIntakeSummaryResponse {
  date: string;
  calorieTarget: number | null;
  proteinTarget: number | null;
  waterTargetMl: number;
  consumedCalories: number;
  consumedProteinG: number;
  consumedWaterMl: number;
  remainingCalories: number | null;
  remainingProteinG: number | null;
  remainingWaterMl: number;
  targetsFromActivePlan: boolean;
  entries: IntakeLogEntryResponse[];
}

export interface ActionState {
  error?: string;
}

export async function getTodaySummaryAction(): Promise<DailyIntakeSummaryResponse> {
  return authedFetch<DailyIntakeSummaryResponse>("/intake/summary");
}

export async function logFoodAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const description = String(formData.get("description") ?? "").trim();
  const calories = Number(formData.get("calories") ?? "");
  const proteinG = formData.get("proteinG") ? Number(formData.get("proteinG")) : null;

  if (!description) return { error: "Type what you ate first." };
  if (!calories || calories <= 0) return { error: "Enter a calorie amount." };

  try {
    await authedFetch<DailyIntakeSummaryResponse>("/intake/food", {
      method: "POST",
      body: JSON.stringify({ description, calories, proteinG }),
    });
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Couldn't log that." };
  }

  revalidatePath("/track");
  return {};
}

/** Used from the product detail page's "Log to today's intake" button. */
export async function logProductAction(productId: number, quantity = 1): Promise<void> {
  await authedFetch<DailyIntakeSummaryResponse>("/intake/food", {
    method: "POST",
    body: JSON.stringify({ productId, quantity }),
  });
  revalidatePath("/track");
}

export async function logWaterAction(waterMl: number): Promise<DailyIntakeSummaryResponse> {
  const result = await authedFetch<DailyIntakeSummaryResponse>("/intake/water", {
    method: "POST",
    body: JSON.stringify({ waterMl }),
  });
  revalidatePath("/track");
  return result;
}

export async function deleteEntryAction(entryId: number): Promise<DailyIntakeSummaryResponse> {
  const result = await authedFetch<DailyIntakeSummaryResponse>(`/intake/${entryId}`, { method: "DELETE" });
  revalidatePath("/track");
  return result;
}