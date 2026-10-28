"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, BackendError } from "@/lib/backend";
import type {
  ActivityLevel,
  DietaryPreference,
  Gender,
  HealthProfileResponse,
} from "@/lib/types";

export interface ActionState {
  error?: string;
}

const emptyToNull = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  return s === "" ? null : s;
};

export async function upsertHealthProfileAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const body = {
    age: formData.get("age") ? Number(formData.get("age")) : null,
    gender: (emptyToNull(formData.get("gender")) as Gender | null) ?? null,
    weightKg: formData.get("weightKg") ? Number(formData.get("weightKg")) : null,
    heightCm: formData.get("heightCm") ? Number(formData.get("heightCm")) : null,
    activityLevel: (emptyToNull(formData.get("activityLevel")) as ActivityLevel | null) ?? null,
    dietaryPreference:
      (emptyToNull(formData.get("dietaryPreference")) as DietaryPreference | null) ?? null,
  };

  try {
    await authedFetch<HealthProfileResponse>("/health-profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Could not save your profile." };
  }

  revalidatePath("/profile");
  return {};
}

export async function addConditionAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await authedFetch<HealthProfileResponse>("/health-profile/conditions", {
      method: "POST",
      body: JSON.stringify({
        conditionCode: String(formData.get("conditionCode")),
        severity: emptyToNull(formData.get("severity")),
        notes: emptyToNull(formData.get("notes")),
        diagnosedAt: emptyToNull(formData.get("diagnosedAt")),
      }),
    });
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Could not add condition." };
  }

  revalidatePath("/profile");
  return {};
}

export async function addGoalAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await authedFetch<HealthProfileResponse>("/health-profile/goals", {
      method: "POST",
      body: JSON.stringify({
        goalCode: String(formData.get("goalCode")),
        targetValue: formData.get("targetValue") ? Number(formData.get("targetValue")) : null,
        targetDate: emptyToNull(formData.get("targetDate")),
      }),
    });
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Could not add goal." };
  }

  revalidatePath("/profile");
  return {};
}

export async function addAllergyAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await authedFetch<HealthProfileResponse>("/health-profile/allergies", {
      method: "POST",
      body: JSON.stringify({ allergyName: String(formData.get("allergyName")) }),
    });
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Could not add allergy." };
  }

  revalidatePath("/profile");
  return {};
}
