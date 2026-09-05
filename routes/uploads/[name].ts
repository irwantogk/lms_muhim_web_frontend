import { define } from "@/utils.ts";
import { API_BASE } from "@/lib/server/backend.ts";

/**
 * Proksi berkas: meneruskan GET /uploads/:name ke backend penyimpanan
 * (S3/MinIO) sehingga tautan relatif di halaman frontend tetap berfungsi.
 */
export const handler = define.handlers({
  async GET(ctx) {
    const name = ctx.params.name;
    if (!/^[0-9a-f]{32}\.[a-z0-9]{2,8}$/.test(name)) {
      return new Response("Not found", { status: 404 });
    }

    const response = await fetch(
      `${API_BASE}/uploads/${encodeURIComponent(name)}`,
    );
    if (!response.ok) {
      return new Response(response.body, {
        status: response.status,
        headers: {
          "content-type": response.headers.get("content-type") ?? "text/plain",
        },
      });
    }

    const headers = new Headers();
    const contentType = response.headers.get("content-type");
    const disposition = response.headers.get("content-disposition");
    const length = response.headers.get("content-length");
    if (contentType) headers.set("content-type", contentType);
    if (disposition) headers.set("content-disposition", disposition);
    if (length) headers.set("content-length", length);

    return new Response(response.body, { status: 200, headers });
  },
});
