"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, authedFetchReadOnly, BackendError } from "@/lib/backend";

export type PlanType = "ONE_DAY" | "SEVEN_DAY" | "THIRTY_DAY";
export type PlanStatus = "ACTIVE" | "COMPLETED" | "ABANDONED";
export type ProcessingStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type MealType = "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK";

export interface DietPlanMealResponse {
  mealType: MealType;
  name: string;
  calories: number | null;
  proteinG: number | null;
  fatG: number | null;
  saturatedFatG: number | null;
  carbsG: number | null;
  sugarG: number | null;
  fiberG: number | null;
  sodiumMg: number | null;
  description: string | null;
}

export interface DietPlanDayResponse {
  dayNumber: number;
  planDate: string;
  meals: DietPlanMealResponse[];
}

export interface DietPlanResponse {
  id: number;
  planType: PlanType;
  calorieTarget: number | null;
  proteinTarget: number | null;
  startDate: string;
  endDate: string;
  status: PlanStatus;
  generationStatus: ProcessingStatus;
  failureReason: string | null;
  createdAt: string;
  days: DietPlanDayResponse[];
}

export interface ActionState {
  error?: string;
}

export async function generateDietPlanAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const planType = String(formData.get("planType") ?? "");
  if (!planType) return { error: "Choose a plan length first." };

  try {
    await authedFetch<DietPlanResponse>("/diet-plans/generate", {
      method: "POST",
      body: JSON.stringify({ planType }),
    });
  } catch (e) {
    return {
      error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Something went wrong.",
    };
  }

  revalidatePath("/diet-plan");
  return {};
}

/** Returns null rather than throwing when there's no active plan yet — the
 * page treats that as "show the generator form", not an error. */
export async function getActiveDietPlanAction(): Promise<DietPlanResponse | null> {
  try {
    return await authedFetchReadOnly<DietPlanResponse>("/diet-plans/active");
  } catch (e) {
    if (e instanceof BackendError && e.apiError?.code === "RESOURCE_NOT_FOUND") return null;
    throw e;
  }
}

export async function getDietPlanStatusAction(planId: number): Promise<DietPlanResponse> {
  return authedFetch<DietPlanResponse>(`/diet-plans/${planId}`);
}