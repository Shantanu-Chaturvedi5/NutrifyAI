"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, BackendError } from "@/lib/backend";

export interface GroceryCartItemResponse {
  id: number;
  productId: number | null;
  productName: string | null;
  productImageUrl: string | null;
  rawItemName: string;
  quantity: number;
  unit: string;
}

export interface GroceryCartResponse {
  id: number;
  cartHealthScore: number | null;
  analyzedItemCount: number;
  uploadedAt: string;
  items: GroceryCartItemResponse[];
}

export interface ActionState {
  error?: string;
}

export async function getCurrentCartAction(): Promise<GroceryCartResponse> {
  return authedFetch<GroceryCartResponse>("/grocery-cart");
}

export async function addRawItemAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const rawItemName = String(formData.get("rawItemName") ?? "").trim();
  const unit = String(formData.get("unit") ?? "pack");
  const quantity = Number(formData.get("quantity") ?? 1) || 1;
  if (!rawItemName) return { error: "Type an item name first." };

  try {
    await authedFetch<GroceryCartResponse>("/grocery-cart/items", {
      method: "POST",
      body: JSON.stringify({ rawItemName, quantity, unit }),
    });
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Couldn't add that item." };
  }

  revalidatePath("/grocery");
  return {};
}

/** Used from the product detail page's "Add to grocery list" button. */
export async function addProductToCartAction(productId: number): Promise<void> {
  await authedFetch<GroceryCartResponse>("/grocery-cart/items", {
    method: "POST",
    body: JSON.stringify({ productId, quantity: 1 }),
  });
  revalidatePath("/grocery");
}

export async function updateQuantityAction(itemId: number, quantity: number): Promise<GroceryCartResponse> {
  const result = await authedFetch<GroceryCartResponse>(`/grocery-cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ quantity }),
  });
  revalidatePath("/grocery");
  return result;
}

export async function removeItemAction(itemId: number): Promise<GroceryCartResponse> {
  const result = await authedFetch<GroceryCartResponse>(`/grocery-cart/items/${itemId}`, { method: "DELETE" });
  revalidatePath("/grocery");
  return result;
}

export async function clearListAction(): Promise<GroceryCartResponse> {
  const result = await authedFetch<GroceryCartResponse>("/grocery-cart/clear", { method: "POST" });
  revalidatePath("/grocery");
  return result;
}