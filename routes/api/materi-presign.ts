import { define } from "@/utils.ts";
import { presignMaterialUpload } from "@/lib/server/backend.ts";

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
        { ok: false, error: "Hanya guru yang dapat mengunggah" },
        403,
      );
    }

    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const classId = typeof body?.classId === "string" ? body.classId : "";
    const subjectId = typeof body?.subjectId === "string" ? body.subjectId : "";
    const fileName = typeof body?.fileName === "string" ? body.fileName : "";
    const fileSize = typeof body?.fileSize === "number" ? body.fileSize : 0;
    const title = typeof body?.title === "string" ? body.title : undefined;
    const description = typeof body?.description === "string"
      ? body.description
      : undefined;

    if (!classId || !subjectId || !fileName || fileSize <= 0) {
      return json({ ok: false, error: "Data unggahan tidak lengkap" }, 400);
    }

    try {
      const data = await presignMaterialUpload(session.accessToken, {
        classId,
        subjectId,
        fileName,
        fileSize,
        title,
        description,
      });
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal presign";
      return json({ ok: false, error: message }, 400);
    }
  },
});
