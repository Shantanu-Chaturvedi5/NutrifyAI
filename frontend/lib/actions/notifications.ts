"use server";

import { revalidatePath } from "next/cache";
import { authedFetch, authedFetchReadOnly } from "@/lib/backend";
import type { PagedResponse } from "@/lib/types";

export type NotificationType = "REPORT_READY" | "DEFICIENCY_ALERT" | "NEW_RECOMMENDATION" | "PLAN_REMINDER" | "SYSTEM";

export interface NotificationResponse {
  id: number;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export async function getUnreadCount(): Promise<number> {
  const result = await authedFetchReadOnly<{ unreadCount: number }>("/notifications/unread-count");
  return result.unreadCount;
}

export async function listNotificationsAction(): Promise<PagedResponse<NotificationResponse>> {
  return authedFetch<PagedResponse<NotificationResponse>>("/notifications?size=30&sort=createdAt,desc");
}

export async function markReadAction(notificationId: number): Promise<void> {
  await authedFetch<void>(`/notifications/${notificationId}/read`, { method: "PATCH" });
  revalidatePath("/notifications");
}

export async function markAllReadAction(): Promise<void> {
  await authedFetch<void>("/notifications/mark-all-read", { method: "POST" });
  revalidatePath("/notifications");
}