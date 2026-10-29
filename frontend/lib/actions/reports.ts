"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, authedFetchMultipart, BackendError } from "@/lib/backend";
import type {
  MedicalReportResponse,
  ReportExtractedValueResponse,
  ReportType,
} from "@/lib/types";

export interface ActionState {
  error?: string;
}

export async function uploadReportAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const file = formData.get("file");
  const reportType = String(formData.get("reportType") ?? "");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  const backendForm = new FormData();
  backendForm.append("file", file, file.name);
  backendForm.append(
    "metadata",
    new Blob([JSON.stringify({ reportType: reportType as ReportType })], {
      type: "application/json",
    })
  );

  try {
    await authedFetchMultipart<MedicalReportResponse>("/reports", backendForm);
  } catch (e) {
    return { error: e instanceof BackendError ? e.apiError?.message ?? e.message : "Upload failed." };
  }

  revalidatePath("/reports");
  return {};
}

/** Called from a client polling component — a plain server action, not tied to a form. */
export async function getReportStatusAction(reportId: number): Promise<MedicalReportResponse> {
  return authedFetch<MedicalReportResponse>(`/reports/${reportId}`);
}

export async function getReportValuesAction(reportId: number): Promise<ReportExtractedValueResponse[]> {
  return authedFetch<ReportExtractedValueResponse[]>(`/reports/${reportId}/values`);
}

export async function deleteReportAction(reportId: number): Promise<void> {
  await authedFetch<void>(`/reports/${reportId}`, { method: "DELETE" });
  revalidatePath("/reports");
}