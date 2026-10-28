"use server";

import { redirect } from "next/navigation";
import { clearAuthCookies, getRefreshToken, setAuthCookies } from "@/lib/session";
import { BackendError, publicFetch } from "@/lib/backend";
import type { AuthResponse } from "@/lib/types";

export interface AuthActionState {
  error?: string;
}

export async function registerAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const phone = String(formData.get("phone") ?? "") || null;

  try {
    const auth = await publicFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, fullName, phone }),
    });
    await setAuthCookies(auth);
  } catch (e) {
    if (e instanceof BackendError) {
      return { error: e.apiError?.message ?? "Could not create your account." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  try {
    const auth = await publicFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await setAuthCookies(auth);
  } catch (e) {
    if (e instanceof BackendError) {
      return { error: e.apiError?.message ?? "Invalid email or password." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  redirect(next || "/dashboard");
}

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    // Best-effort — even if this fails, clearing our own cookies below is
    // what actually ends the session from the browser's point of view.
    try {
      await publicFetch("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // ignore
    }
  }

  await clearAuthCookies();
  redirect("/login");
}
