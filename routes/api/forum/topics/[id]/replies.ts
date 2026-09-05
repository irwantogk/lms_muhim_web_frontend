import { define } from "@/utils.ts";
import { createForumReplyRequest } from "@/lib/server/backend.ts";

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
    if (session.user.role !== "guru" && session.user.role !== "murid") {
      return json({ ok: false, error: "Tidak berhak membalas" }, 403);
    }

    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const text = typeof body?.body === "string" ? body.body.trim() : "";
    if (!text) return json({ ok: false, error: "Balasan kosong" }, 400);

    try {
      const data = await createForumReplyRequest(
        session.accessToken,
        ctx.params.id,
        text,
      );
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membalas";
      return json({ ok: false, error: message }, 400);
    }
  },
});
