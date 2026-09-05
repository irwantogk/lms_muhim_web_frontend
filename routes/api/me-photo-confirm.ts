import { define } from "@/utils.ts";
import { updateMyProfile } from "@/lib/server/backend.ts";

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
    const photoUrl = typeof body?.photoUrl === "string" ? body.photoUrl : "";
    if (!photoUrl) {
      return json({ ok: false, error: "photoUrl kosong" }, 400);
    }

    try {
      const data = await updateMyProfile(session.accessToken, { photoUrl });
      return json({ ok: true, data });
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Gagal memperbarui foto";
      return json({ ok: false, error: message }, 400);
    }
  },
});
