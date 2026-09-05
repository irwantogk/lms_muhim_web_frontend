import { define } from "@/utils.ts";
import { presignMyPhoto } from "@/lib/server/backend.ts";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const handler = define.handlers({
  async POST(ctx) {
    const session = ctx.state.session;
    if (!session) return json({ ok: false, error: "Belum masuk" }, 401);

    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const fileName = typeof body?.fileName === "string" ? body.fileName : "";
    const fileSize = typeof body?.fileSize === "number" ? body.fileSize : 0;
    if (!fileName || fileSize <= 0) {
      return json({ ok: false, error: "Data berkas tidak lengkap" }, 400);
    }

    try {
      const data = await presignMyPhoto(session.accessToken, {
        fileName,
        fileSize,
      });
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal presign";
      return json({ ok: false, error: message }, 400);
    }
  },
});
