import { define } from "@/utils.ts";
import {
  createAssignmentRequest,
  type TaskKind,
  type TaskQuestion,
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
    if (session.user.role !== "guru") {
      return json(
        { ok: false, error: "Hanya guru yang dapat membuat tugas" },
        403,
      );
    }

    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const classId = typeof body?.classId === "string" ? body.classId : "";
    const subjectId = typeof body?.subjectId === "string" ? body.subjectId : "";
    const title = typeof body?.title === "string" ? body.title.trim() : "";
    const instruction = typeof body?.instruction === "string"
      ? body.instruction.trim()
      : "";
    const deadline = typeof body?.deadline === "string" ? body.deadline : "";
    const type = body?.type;
    if (type !== "pilihan_ganda" && type !== "esai" && type !== "upload") {
      return json({ ok: false, error: "Jenis tugas tidak valid" }, 400);
    }

    const questions = Array.isArray(body?.questions)
      ? (body.questions as TaskQuestion[])
      : undefined;

    if (!classId || !subjectId || !title || !instruction || !deadline) {
      return json({ ok: false, error: "Data tugas tidak lengkap" }, 400);
    }

    try {
      const data = await createAssignmentRequest(session.accessToken, {
        classId,
        subjectId,
        title,
        instruction,
        type: type as TaskKind,
        deadline,
        questions,
      });
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal menyimpan tugas";
      return json({ ok: false, error: message }, 400);
    }
  },
});
