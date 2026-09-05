import { define } from "@/utils.ts";
import {
  ACCESS_COOKIE,
  clearCookieHeader,
  REFRESH_COOKIE,
  USER_COOKIE,
} from "@/lib/server/backend.ts";

/** Logout: bersihkan cookie sesi lalu kembali ke halaman masuk. */
export const handler = define.handlers({
  GET() {
    const headers = new Headers();
    headers.set("location", "/login");
    headers.append("set-cookie", clearCookieHeader(ACCESS_COOKIE));
    headers.append("set-cookie", clearCookieHeader(REFRESH_COOKIE));
    headers.append("set-cookie", clearCookieHeader(USER_COOKIE));
    return new Response(null, { status: 302, headers });
  },
});
