import { define } from "@/utils.ts";
import {
  deleteMaterialComment,
  setMaterialCommentHidden,
} from "@/lib/server/backend.ts";

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
    const hidden = typeof body?.hidden === "boolean" ? body.hidden : false;

    try {
      const data = await setMaterialCommentHidden(
        session.accessToken,
        ctx.params.id,
        ctx.params.commentId,
        hidden,
      );
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal memoderasi komentar";
      return json({ ok: false, error: message }, 400);
    }
  },

  async DELETE(ctx) {
    const session = ctx.state.session;
    if (!session) return json({ ok: false, error: "Belum masuk" }, 401);
    try {
      await deleteMaterialComment(
        session.accessToken,
        ctx.params.id,
        ctx.params.commentId,
      );
      return json({ ok: true });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal menghapus komentar";
      return json({ ok: false, error: message }, 400);
    }
  },
});
