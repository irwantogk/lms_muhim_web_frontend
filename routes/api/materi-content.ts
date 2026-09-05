import { define } from "@/utils.ts";
import { createMaterialContent } from "@/lib/server/backend.ts";

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
        { ok: false, error: "Hanya guru yang dapat membuat materi" },
        403,
      );
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
    const description = typeof body?.description === "string"
      ? body.description
      : undefined;

    if (!classId || !subjectId || !title || !content) {
      return json({
        ok: false,
        error: "Judul, kelas, mapel, dan isi wajib diisi",
      }, 400);
    }

    try {
      const data = await createMaterialContent(session.accessToken, {
        classId,
        subjectId,
        title,
        description,
        content,
      });
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal menyimpan materi";
      return json({ ok: false, error: message }, 400);
    }
  },
});
