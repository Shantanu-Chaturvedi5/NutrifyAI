"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, authedFetchMultipart, BackendError } from "@/lib/backend";
import type { ProductScanResponse } from "@/lib/types";

export interface ActionState {
  error?: string;
}

export async function uploadScanAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a photo of the label to upload." };
  }

  const backendForm = new FormData();
  backendForm.append("file", file, file.name);

  try {
    await authedFetchMultipart<ProductScanResponse>("/product-scans", backendForm);
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Upload failed." };
  }

  revalidatePath("/scan");
  return {};
}

/** Called from a client polling component — a plain server action, not tied to a form. */
export async function getScanStatusAction(scanId: number): Promise<ProductScanResponse> {
  return authedFetch<ProductScanResponse>(`/product-scans/${scanId}`);
}

export async function deleteScanAction(scanId: number): Promise<void> {
  await authedFetch<void>(`/product-scans/${scanId}`, { method: "DELETE" });
  revalidatePath("/scan");
}