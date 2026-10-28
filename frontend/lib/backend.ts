import { redirect } from "next/navigation";
import { clearAuthCookies, getAccessToken, getRefreshToken, setAuthCookies } from "@/lib/session";
import type { ApiError, AuthResponse } from "@/lib/types";

// Server-only. This is the ONE place that knows the backend's real network
// address — everything else calls the functions below, never fetch()
// directly against the backend.
const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080/api/v1";

export class BackendError extends Error {
  constructor(public status: number, public apiError: ApiError | null) {
    super(apiError?.message ?? `Backend request failed with status ${status}`);
  }
}

async function parseErrorBody(response: Response): Promise<ApiError | null> {
  try {
    return (await response.json()) as ApiError;
  } catch {
    return null;
  }
}

/** For endpoints that don't need auth — product browsing/search, public catalog reads. */
export async function publicFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new BackendError(response.status, await parseErrorBody(response));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return false;

  const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
    cache: "no-store",
  });

  if (!response.ok) return false;

  const auth = (await response.json()) as AuthResponse;
  await setAuthCookies(auth);
  return true;
}

/**
 * For use in Server Actions and Route Handlers ONLY — retries once after a
 * transparent token refresh, which requires writing cookies (not possible
 * from a Server Component render). If refresh also fails, clears cookies
 * and redirects to /login rather than surfacing a raw 401.
 */
export async function authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const attempt = async (): Promise<Response> => {
    const accessToken = await getAccessToken();
    return fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...init?.headers,
      },
      cache: "no-store",
    });
  };

  let response = await attempt();

  if (response.status === 401) {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      await clearAuthCookies();
      redirect("/login");
    }
    response = await attempt();
  }

  if (!response.ok) {
    throw new BackendError(response.status, await parseErrorBody(response));
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

/**
 * Multipart variant of authedFetch, for file uploads (medical reports).
 * Content-Type is deliberately left unset — fetch sets the multipart
 * boundary itself when the body is a FormData instance.
 */
export async function authedFetchMultipart<T>(path: string, formData: FormData): Promise<T> {
  const attempt = async (): Promise<Response> => {
    const accessToken = await getAccessToken();
    return fetch(`${BACKEND_URL}${path}`, {
      method: "POST",
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: formData,
      cache: "no-store",
    });
  };

  let response = await attempt();

  if (response.status === 401) {
    const refreshed = await refreshTokens();
    if (!refreshed) {
      await clearAuthCookies();
      redirect("/login");
    }
    response = await attempt();
  }

  if (!response.ok) {
    throw new BackendError(response.status, await parseErrorBody(response));
  }

  return response.json() as Promise<T>;
}

/** For use in Server Components (read-only rendering) — no cookie writes,
 * so no refresh-and-retry. In practice middleware.ts keeps the access
 * token fresh before a protected page ever renders; this is the fallback
 * if a token still somehow expires mid-render.
 */
export async function authedFetchReadOnly<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    redirect("/login");
  }

  if (!response.ok) {
    throw new BackendError(response.status, await parseErrorBody(response));
  }

  return response.json() as Promise<T>;
}

/**
 * For public pages that show extra authenticated content (personalized
 * scores) only when logged in — returns null on any failure (no token,
 * expired token, 404, whatever) instead of throwing or redirecting.
 */
export async function authedFetchOptional<T>(path: string): Promise<T | null> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return null;

    const response = await fetch(`${BACKEND_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

/**
 * For public pages (product browsing) that render differently for logged-in
 * vs. anonymous visitors, but should never force a redirect either way.
 */
export async function getCurrentUserOptional<T>(): Promise<T | null> {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) return null;

    const response = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
