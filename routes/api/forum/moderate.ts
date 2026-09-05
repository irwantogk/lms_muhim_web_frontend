import { define } from "@/utils.ts";
import { forumModerate } from "@/lib/server/backend.ts";

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
    if (session.user.role !== "guru") {
      return json(
        { ok: false, error: "Hanya guru yang dapat memoderasi" },
        403,
      );
    }

    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const kind = body?.kind;
    const id = typeof body?.id === "string" ? body.id : "";
    const action = body?.action;
    if (kind !== "topic" && kind !== "reply") {
      return json({ ok: false, error: "Jenis tidak valid" }, 400);
    }
    if (action !== "hide" && action !== "show" && action !== "delete") {
      return json({ ok: false, error: "Aksi tidak valid" }, 400);
    }
    if (!id) return json({ ok: false, error: "ID tidak valid" }, 400);

    try {
      const data = await forumModerate(session.accessToken, {
        kind,
        id,
        action,
      });
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal memoderasi";
      return json({ ok: false, error: message }, 400);
    }
  },
});
