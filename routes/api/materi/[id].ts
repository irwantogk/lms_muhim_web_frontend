import { define } from "@/utils.ts";
import { getMaterialDetail } from "@/lib/server/backend.ts";

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return json({ ok: false, error: "Belum masuk" }, 401);

    try {
      const data = await getMaterialDetail(session.accessToken, ctx.params.id);
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Materi tidak ditemukan";
      return json({ ok: false, error: message }, 404);
    }
  },
});
