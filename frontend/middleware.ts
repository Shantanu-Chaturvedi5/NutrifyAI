import { NextResponse, type NextRequest } from "next/server";
import { isExpired } from "@/lib/jwt";
import type { AuthResponse } from "@/lib/types";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:8080/api/v1";
const ACCESS_TOKEN_COOKIE = "nutrifyai_access_token";
const REFRESH_TOKEN_COOKIE = "nutrifyai_refresh_token";

const PROTECTED_PREFIXES = ["/dashboard", "/profile", "/reports", "/chat", "/nutrition-twin"];
const AUTH_PAGES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (!isProtected && !isAuthPage) {
    return NextResponse.next();
  }

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  let response = NextResponse.next();

  const needsRefresh = (!accessToken || isExpired(accessToken)) && Boolean(refreshToken);

  if (needsRefresh) {
    try {
      const refreshResponse = await fetch(`${BACKEND_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });

      if (refreshResponse.ok) {
        const auth = (await refreshResponse.json()) as AuthResponse;
        accessToken = auth.accessToken;

        response.cookies.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 14 * 60,
        });
        response.cookies.set(REFRESH_TOKEN_COOKIE, auth.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        });
      } else {
        accessToken = undefined;
      }
    } catch {
      accessToken = undefined;
    }
  }

  const isAuthenticated = Boolean(accessToken && !isExpired(accessToken));

  if (isProtected && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/reports/:path*",
    "/chat/:path*",
    "/nutrition-twin/:path*",
    "/login",
    "/register",
  ],
};
