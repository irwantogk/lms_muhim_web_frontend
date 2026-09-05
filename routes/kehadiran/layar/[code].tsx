import { HttpError, page, type RouteConfig } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getTodaySessions } from "@/lib/server/backend.ts";
import { formatTimeLabel } from "@/lib/date.ts";
import CodeFullscreen from "@/islands/CodeFullscreen.tsx";
import CopyCode from "@/islands/CopyCode.tsx";
import QrCodeCanvas from "@/islands/QrCodeCanvas.tsx";

export const config: RouteConfig = {
  skipInheritedLayouts: true,
};

interface LayarKodeData {
  code: string;
  className: string;
  subjectName: string;
  expiresAt: string;
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "guru") return ctx.redirect("/kehadiran");

    const sessions = await getTodaySessions(session.accessToken);
    const match = sessions.find((s) => s.code === ctx.params.code);
    if (!match) {
      throw new HttpError(404, "Kode presensi tidak ditemukan");
    }

    return page({
      code: match.code,
      className: match.className,
      subjectName: match.subjectName,
      expiresAt: match.expiresAt,
    });
  },
});

export default define.page<typeof handler>(
  ({ data }: { data: LayarKodeData }) => {
    return (
      <div class="flex min-h-screen flex-col bg-gradient-to-br from-role-guru via-slate-900 to-role-murid text-white">
        <Head>
          <title>Kode Presensi — {data.code}</title>
        </Head>

        <header class="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div class="text-sm font-semibold text-white/90">
            SMA Muhammadiyah Imogiri — Kode Presensi
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <CopyCode
              value={data.code}
              label="Salin kode"
              className="inline-flex items-center rounded-md border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            />
            <CodeFullscreen className="inline-flex items-center rounded-md border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20" />
            <a
              href="/kehadiran"
              class="inline-flex items-center rounded-md border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            >
              Keluar tampilan
            </a>
          </div>
        </header>

        <main class="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p class="text-sm font-medium uppercase tracking-[0.3em] text-white/70">
            {data.subjectName} • {data.className}
          </p>
          <p class="mt-6 font-mono text-[clamp(3rem,16vw,11rem)] font-bold leading-none tracking-[0.2em]">
            {data.code}
          </p>

          <div class="mt-8 w-full max-w-xs">
            <QrCodeCanvas value={data.code} size={280} />
          </div>

          <p class="mt-6 text-sm text-white/80">
            Minta murid membuka "Pindai Kode (Kamera)" lalu arahkan ke kode di
            atas, atau masukkan kode secara manual.
          </p>
          <p class="mt-2 text-xs text-white/60">
            Berlaku sampai {formatTimeLabel(data.expiresAt)}
          </p>
        </main>
      </div>
    );
  },
);
