import { define } from "@/utils.ts";
import { submitAssignmentAnswer } from "@/lib/server/backend.ts";

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
    if (session.user.role !== "murid") {
      return json(
        { ok: false, error: "Hanya murid yang dapat mengumpulkan" },
        403,
      );
    }

    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const answers = Array.isArray(body?.answers)
      ? (body.answers as number[])
      : undefined;
    const text = typeof body?.text === "string" ? body.text : undefined;
    const fileName = typeof body?.fileName === "string"
      ? body.fileName
      : undefined;

    if (answers === undefined && text === undefined && fileName === undefined) {
      return json({ ok: false, error: "Jawaban kosong" }, 400);
    }

    try {
      const data = await submitAssignmentAnswer(
        session.accessToken,
        ctx.params.id,
        {
          answers,
          text,
          fileName,
        },
      );
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal mengumpulkan";
      return json({ ok: false, error: message }, 400);
    }
  },
});
