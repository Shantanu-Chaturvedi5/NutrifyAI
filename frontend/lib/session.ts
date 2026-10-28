// Server-only. Never import this from a Client Component — it reads/writes
// httpOnly cookies via next/headers, which only works in Server Actions,
// Route Handlers, and Server Components (read-only in the last case).
import { cookies } from "next/headers";
import type { AuthResponse } from "@/lib/types";

const ACCESS_TOKEN_COOKIE = "nutrifyai_access_token";
const REFRESH_TOKEN_COOKIE = "nutrifyai_refresh_token";

// Access token cookie expiry is set a little short of the backend's actual
// 15-minute JWT TTL so the cookie never outlives a token that's still
// technically valid but about to expire mid-request.
const ACCESS_TOKEN_MAX_AGE_SECONDS = 14 * 60;
const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export async function setAuthCookies(auth: Pick<AuthResponse, "accessToken" | "refreshToken">) {
  const cookieStore = await cookies();
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  cookieStore.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
    ...common,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, auth.refreshToken, {
    ...common,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  return Boolean(await getAccessToken());
}
