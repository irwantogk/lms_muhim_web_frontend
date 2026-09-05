import { define } from "@/utils.ts";
import { createForumTopicRequest } from "@/lib/server/backend.ts";

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
      return json({ ok: false, error: "Tidak berhak membuat topik" }, 403);
    }

    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const classId = typeof body?.classId === "string" ? body.classId : "";
    const subjectId = typeof body?.subjectId === "string" ? body.subjectId : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const content = typeof body?.content === "string"
      ? body.content.trim()
      : "";
    if (!classId || !subjectId || !title || !content) {
      return json({ ok: false, error: "Data topik tidak lengkap" }, 400);
    }

    try {
      const data = await createForumTopicRequest(session.accessToken, {
        classId,
        subjectId,
        title,
        content,
      });
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal membuat topik";
      return json({ ok: false, error: message }, 400);
    }
  },
});
