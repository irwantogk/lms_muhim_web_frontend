import { define } from "@/utils.ts";
import type { AuthUser } from "@/lib/types.ts";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  accessTokenExpiringSoon,
  clearCookieHeader,
  cookieHeader,
  decodeAccessToken,
  encodeUserCookie,
  isRole,
  parseUserCookie,
  readCookies,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  refreshRequest,
  USER_COOKIE,
} from "@/lib/server/backend.ts";

const LOGIN_PATH = "/login";
const LOGOUT_PATH = "/logout";

function isPublic(pathname: string): boolean {
  return pathname === LOGIN_PATH ||
    pathname === LOGOUT_PATH ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/favicon.");
}

function userFromAccess(token: string): AuthUser | null {
  const payload = decodeAccessToken(token);
  if (payload?.sub && isRole(payload.role)) {
    return {
      id: payload.sub,
      name: payload.sub.slice(0, 8),
      email: "",
      role: payload.role,
    };
  }
  return null;
}

function redirectLogin(requestUrl: string, message?: string): Response {
  const url = new URL(requestUrl);
  const dest = new URL(LOGIN_PATH, url.origin);
  if (message) dest.searchParams.set("error", message);
  return Response.redirect(dest, 302);
}

function withSetCookies(response: Response, cookies: string[]): Response {
  if (cookies.length === 0) return response;
  const headers = new Headers(response.headers);
  for (const cookie of cookies) headers.append("set-cookie", cookie);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function clearSessionCookies(): string[] {
  return [
    clearCookieHeader(ACCESS_COOKIE),
    clearCookieHeader(REFRESH_COOKIE),
    clearCookieHeader(USER_COOKIE),
  ];
}

/**
 * Sesi JWT (proxy ke backend Elysia):
 * 1. Baca access + refresh token dari cookie (HttpOnly).
 * 2. Tanpa refresh token -> redirect ke /login.
 * 3. Access token nyaris kedaluwarsa -> rotasi senyap via /auth/refresh.
 * 4. Sesi valid -> pasang ctx.state.session lalu lanjutkan render.
 */
export default define.middleware(async (ctx) => {
  const url = new URL(ctx.req.url);

  if (isPublic(url.pathname)) {
    const cookies = readCookies(ctx.req);
    const access = cookies[ACCESS_COOKIE];
    const rawUser = parseUserCookie(cookies[USER_COOKIE]);
    const fresh = access !== undefined && !accessTokenExpiringSoon(access);
    const user = rawUser ?? (fresh && access ? userFromAccess(access) : null);
    ctx.state.session = fresh && user ? { user, accessToken: access } : null;
    return ctx.next();
  }

  const cookies = readCookies(ctx.req);
  const refresh = cookies[REFRESH_COOKIE];
  if (!refresh) return redirectLogin(ctx.req.url);

  let access = cookies[ACCESS_COOKIE];
  let user = parseUserCookie(cookies[USER_COOKIE]);
  const pendingCookies: string[] = [];

  const needsRefresh = access === undefined || accessTokenExpiringSoon(access);
  if (needsRefresh) {
    const result = await refreshRequest(refresh);
    if (!result.ok) {
      pendingCookies.push(...clearSessionCookies());
      ctx.state.session = null;
      const response = await ctx.next();
      return withSetCookies(response, pendingCookies);
    }
    const { data } = result;
    access = data.accessToken;
    user = data.user;
    pendingCookies.push(
      cookieHeader(ACCESS_COOKIE, access, ACCESS_MAX_AGE),
      cookieHeader(REFRESH_COOKIE, data.refreshToken, REFRESH_MAX_AGE),
      cookieHeader(USER_COOKIE, encodeUserCookie(data.user), REFRESH_MAX_AGE),
    );
  } else if (!user) {
    user = access ? userFromAccess(access) : null;
  }

  if (!access || !user) {
    pendingCookies.push(...clearSessionCookies());
    ctx.state.session = null;
    const response = await ctx.next();
    return withSetCookies(response, pendingCookies);
  }

  ctx.state.session = { user, accessToken: access };
  const response = await ctx.next();
  return withSetCookies(response, pendingCookies);
});
