import { define } from "@/utils.ts";
import { gradeAssignmentSubmission } from "@/lib/server/backend.ts";

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
      return json({ ok: false, error: "Hanya guru yang dapat menilai" }, 403);
    }

    const body = await ctx.req.json().catch(() => null) as
      | Record<string, unknown>
      | null;
    const score = typeof body?.score === "number" ? body.score : NaN;
    const feedback = typeof body?.feedback === "string"
      ? body.feedback
      : undefined;

    if (!Number.isInteger(score) || score < 0 || score > 100) {
      return json({ ok: false, error: "Nilai harus 0–100" }, 400);
    }

    try {
      const data = await gradeAssignmentSubmission(
        session.accessToken,
        ctx.params.id,
        ctx.params.submissionId,
        { score, feedback },
      );
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal menyimpan nilai";
      return json({ ok: false, error: message }, 400);
    }
  },
});
