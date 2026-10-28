"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, BackendError } from "@/lib/backend";
import type { RatingResponse, ReviewResponse } from "@/lib/types";

export interface ActionState {
  error?: string;
}

export async function createReviewAction(
  productId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await authedFetch<ReviewResponse>(`/products/${productId}/reviews`, {
      method: "POST",
      body: JSON.stringify({ reviewText: String(formData.get("reviewText") ?? "") }),
    });
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Could not post review." };
  }

  revalidatePath(`/products/${productId}`);
  return {};
}

export async function upsertRatingAction(
  productId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await authedFetch<RatingResponse>(`/products/${productId}/ratings`, {
      method: "PUT",
      body: JSON.stringify({
        tasteRating: Number(formData.get("tasteRating")),
        healthinessRating: Number(formData.get("healthinessRating")),
        digestibilityRating: Number(formData.get("digestibilityRating")),
        satisfactionRating: Number(formData.get("satisfactionRating")),
      }),
    });
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Could not save rating." };
  }

  revalidatePath(`/products/${productId}`);
  return {};
}
