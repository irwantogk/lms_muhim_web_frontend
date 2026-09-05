import { page, type RouteConfig } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  ACCESS_COOKIE,
  ACCESS_MAX_AGE,
  cookieHeader,
  encodeUserCookie,
  loginRequest,
  REFRESH_COOKIE,
  REFRESH_MAX_AGE,
  USER_COOKIE,
} from "@/lib/server/backend.ts";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

interface LoginPageData {
  error: string | null;
}

export const handler = define.handlers({
  GET(ctx) {
    if (ctx.state.session) return ctx.redirect("/");
    const error = new URL(ctx.req.url).searchParams.get("error");
    return page({ error });
  },

  async POST(ctx) {
    if (ctx.state.session) return ctx.redirect("/");

    const form = await ctx.req.formData();
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (!identifier || !password) {
      return page({ error: "Email/NISN dan kata sandi wajib diisi." });
    }

    const result = await loginRequest(identifier, password);
    if (!result.ok) {
      return page({ error: result.message });
    }

    const { accessToken, refreshToken, user } = result.data;
    const headers = new Headers({ location: "/" });
    headers.append(
      "set-cookie",
      cookieHeader(ACCESS_COOKIE, accessToken, ACCESS_MAX_AGE),
    );
    headers.append(
      "set-cookie",
      cookieHeader(REFRESH_COOKIE, refreshToken, REFRESH_MAX_AGE),
    );
    headers.append(
      "set-cookie",
      cookieHeader(USER_COOKIE, encodeUserCookie(user), REFRESH_MAX_AGE),
    );
    return new Response(null, { status: 302, headers });
  },
});

export default define.page<typeof handler>(({ data }) => {
  const error = data.error;

  return (
    <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-role-admin/10 via-role-guru/5 to-role-ortu/10 px-4 py-10">
      <Head>
        <title>Masuk — SMA Muhammadiyah Imogiri</title>
      </Head>

      <div class="w-full max-w-md">
        <div class="text-center">
          <div class="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-role-admin to-role-guru px-5 py-2 text-sm font-bold text-white shadow-sm">
            <span class="flex h-6 w-6 items-center justify-center rounded-md bg-white/20 text-xs font-extrabold">
              LMS
            </span>
            SMA Muhammadiyah Imogiri
          </div>
          <h1 class="mt-6 text-3xl font-bold tracking-tight text-content">
            Masuk ke akun Anda
          </h1>
          <p class="mt-2 text-sm text-content-muted">
            Gunakan akun yang terdaftar — tampilan menyesuaikan peran Anda.
          </p>
        </div>

        <form
          method="post"
          action="/login"
          class="mt-8 rounded-xl border border-border bg-surface p-6 shadow-sm"
        >
          {error && (
            <div
              role="alert"
              class="mb-4 rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
            >
              {error}
            </div>
          )}

          <label
            class="block text-sm font-medium text-content"
            for="identifier"
          >
            Email / NISN (murid 10 digit)
          </label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            required
            autocomplete="username"
            placeholder="email@sekolah.sch.id atau NISN 10 digit"
            class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />

          <label
            class="mt-4 block text-sm font-medium text-content"
            for="password"
          >
            Kata sandi
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autocomplete="current-password"
            placeholder="••••••••"
            class="mt-1 w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          />

          <button
            type="submit"
            class="mt-6 w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            Masuk
          </button>
        </form>
      </div>
    </div>
  );
});
