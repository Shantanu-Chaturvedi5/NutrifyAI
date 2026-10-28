"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, authedFetchMultipart, authedFetchReadOnly, BackendError } from "@/lib/backend";
import type { PagedResponse, ProcessingStatus } from "@/lib/types";

export interface RestaurantMenuItemResponse {
  id: number;
  itemName: string;
  estimatedCalories: number | null;
  estimatedProteinG: number | null;
  isRecommended: boolean;
  recommendationReason: string | null;
}

export interface RestaurantMenuResponse {
  id: number;
  restaurantName: string | null;
  processingStatus: ProcessingStatus;
  failureReason: string | null;
  uploadedAt: string;
  items: RestaurantMenuItemResponse[];
}

export interface ActionState {
  error?: string;
}

export async function uploadMenuAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo of the menu to upload." };
  }

  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  try {
    await authedFetchMultipart<RestaurantMenuResponse>("/restaurant-menus", backendForm);
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Upload failed." };
  }

  revalidatePath("/restaurant-menu");
  return {};
}

export async function listMenusAction(): Promise<PagedResponse<RestaurantMenuResponse>> {
  return authedFetchReadOnly<PagedResponse<RestaurantMenuResponse>>("/restaurant-menus?size=20&sort=uploadedAt,desc");
}

export async function getMenuStatusAction(menuId: number): Promise<RestaurantMenuResponse> {
  return authedFetch<RestaurantMenuResponse>(`/restaurant-menus/${menuId}`);
}

export async function deleteMenuAction(menuId: number): Promise<void> {
  await authedFetch<void>(`/restaurant-menus/${menuId}`, { method: "DELETE" });
  revalidatePath("/restaurant-menu");
}