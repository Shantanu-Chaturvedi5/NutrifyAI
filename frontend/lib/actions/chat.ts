"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authedFetch, BackendError } from "@/lib/backend";

export interface ChatSessionResponse {
  id: number;
  title: string | null;
  startedAt: string;
  endedAt: string | null;
}

export interface ChatMessageResponse {
  id: number;
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  createdAt: string;
}

export interface ActionState {
  error?: string;
}

export async function createSessionAndRedirect(): Promise<void> {
  const session = await authedFetch<ChatSessionResponse>("/chat/sessions", {
    method: "POST",
    body: JSON.stringify({}),
  });
  revalidatePath("/chat");
  redirect(`/chat/${session.id}`);
}

export async function listSessions(): Promise<ChatSessionResponse[]> {
  const paged = await authedFetch<{ content: ChatSessionResponse[] }>("/chat/sessions?size=20");
  return paged.content;
}

export async function renameSessionAction(sessionId: number, title: string): Promise<void> {
  await authedFetch<ChatSessionResponse>(`/chat/sessions/${sessionId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
  revalidatePath("/chat");
}

export async function deleteSessionAction(sessionId: number): Promise<void> {
  await authedFetch<void>(`/chat/sessions/${sessionId}`, { method: "DELETE" });
  revalidatePath("/chat");
}

export async function getMessages(sessionId: number): Promise<ChatMessageResponse[]> {
  return authedFetch<ChatMessageResponse[]>(`/chat/sessions/${sessionId}/messages`);
}
// Non-redirecting counterparts of createSessionAndRedirect/sendMessageAction,
// for the floating chat popover (ChatBubble) which stays mounted across
// page navigation and manages its own state instead of a route.

export async function createSession(): Promise<ChatSessionResponse> {
  return authedFetch<ChatSessionResponse>("/chat/sessions", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function sendMessageToSession(
  sessionId: number,
  message: string
): Promise<ChatMessageResponse[]> {
  await authedFetch(`/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return getMessages(sessionId);
}

export async function sendMessageAction(
  sessionId: number,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Type a message first." };

  try {
    await authedFetch(`/chat/sessions/${sessionId}/messages`, {
      method: "POST",
      body: JSON.stringify({ message }),
    });
  } catch (e) {
    return {
      error:
        e instanceof BackendError
          ? e.apiError?.message ?? "The assistant didn't respond — is the AI service running?"
          : "Something went wrong.",
    };
  }

  revalidatePath(`/chat/${sessionId}`);
  return {};
}