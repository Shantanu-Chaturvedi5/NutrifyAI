"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, authedFetchReadOnly, BackendError } from "@/lib/backend";

export interface NutritionTwinResponse {
  snapshotDate: string;
  healthTrendSummary: string;
  deficiencyTrendSummary: string;
  riskPredictionSummary: string;
}

export async function getLatestNutritionTwin(): Promise<NutritionTwinResponse | null> {
  try {
    return await authedFetchReadOnly<NutritionTwinResponse>("/nutrition-twin");
  } catch (e) {
    if (e instanceof BackendError && e.status === 404) return null;
    throw e;
  }
}

export interface ActionState {
  error?: string;
}

export async function generateNutritionTwinAction(): Promise<ActionState> {
  try {
    await authedFetch<NutritionTwinResponse>("/nutrition-twin/generate", { method: "POST" });
  } catch (e) {
    return {
      error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Could not generate nutrition twin.",
    };
  }
  revalidatePath("/nutrition-twin");
  return {};
}
