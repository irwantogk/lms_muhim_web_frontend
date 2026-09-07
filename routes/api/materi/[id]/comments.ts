import { define } from "@/utils.ts";
import {
  addMaterialComment,
  getMaterialComments,
} from "@/lib/server/backend.ts";

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
      const data = await getMaterialComments(
        session.accessToken,
        ctx.params.id,
      );
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal memuat komentar";
      return json({ ok: false, error: message }, 400);
    }
  },

  async POST(ctx) {
    const session = ctx.state.session;
    if (!session) return json({ ok: false, error: "Belum masuk" }, 401);

    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    if (text.length < 3) {
      return json({ ok: false, error: "Komentar minimal 3 karakter" }, 400);
    }

    try {
      const data = await addMaterialComment(
        session.accessToken,
        ctx.params.id,
        text,
      );
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal mengirim komentar";
      return json({ ok: false, error: message }, 400);
    }
  },
});
