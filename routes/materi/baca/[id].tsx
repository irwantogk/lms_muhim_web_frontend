import { HttpError, page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getMaterialDetail } from "@/lib/server/backend.ts";
import { sanitizeHtml } from "@/lib/richtext.ts";
import { Badge } from "@/components/ui/Badge.tsx";
import RichContent from "@/islands/RichContent.tsx";
import MaterialComments from "@/islands/MaterialComments.tsx";

type MaterialKind = "pdf" | "video" | "dokumen" | "catatan";

interface BacaData {
  id: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  title: string;
  description: string | null;
  content: string | null;
  fileUrl: string;
  type: MaterialKind;
  createdAt: string;
}

const KIND_LABEL: Record<MaterialKind, string> = {
  pdf: "PDF",
  video: "Video",
  dokumen: "Dokumen",
  catatan: "Catatan",
};

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "guru" && session.user.role !== "murid") {
      return ctx.redirect("/materi");
    }

    try {
      const item = await getMaterialDetail(session.accessToken, ctx.params.id);
      return page({
        id: item.id,
        className: item.className,
        subjectCode: item.subjectCode,
        subjectName: item.subjectName,
        teacherName: item.teacherName,
        title: item.title,
        description: item.description,
        content: item.content,
        fileUrl: item.fileUrl,
        type: item.type,
        createdAt: item.createdAt,
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, "Materi tidak ditemukan");
    }
  },
});

export default define.page<typeof handler>(({ data }: { data: BacaData }) => {
  const date = new Date(data.createdAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <Head>
        <title>{data.title} — SMA Muhammadiyah Imogiri</title>
      </Head>

      <article class="mx-auto max-w-3xl">
        <a
          href="/materi"
          class="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Kembali ke Materi
        </a>

        <header class="mt-4">
          <div class="flex flex-wrap items-center gap-2">
            <Badge tone="guru">{data.subjectCode}</Badge>
            <span class="text-xs text-content-muted">{data.className}</span>
            <Badge tone="neutral">{KIND_LABEL[data.type]}</Badge>
          </div>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-content">
            {data.title}
          </h1>
          <p class="mt-2 text-sm text-content-muted">
            {data.subjectName} • {data.teacherName} • {date}
          </p>
        </header>

        {data.description && (
          <p class="mt-4 text-sm leading-relaxed text-content-muted">
            {data.description}
          </p>
        )}

        {data.type === "catatan"
          ? (
            <div class="mt-6 rounded-xl border border-border bg-surface p-6 shadow-xs">
              <RichContent content={sanitizeHtml(data.content ?? "")} />
            </div>
          )
          : (
            <div class="mt-6 rounded-xl border border-border bg-surface p-4 shadow-xs sm:p-6">
              {!data.fileUrl
                ? (
                  <p class="py-8 text-center text-sm text-content-muted">
                    Berkas tidak tersedia.
                  </p>
                )
                : data.type === "pdf"
                ? (
                  <iframe
                    src={data.fileUrl}
                    title={data.title}
                    class="h-[70vh] w-full rounded-md border border-border bg-white"
                  />
                )
                : data.type === "video"
                ? (
                  <video
                    controls
                    preload="metadata"
                    src={data.fileUrl}
                    class="w-full rounded-md border border-border bg-black"
                  >
                    Browser Anda tidak mendukung pemutar video.
                  </video>
                )
                : (
                  <div class="py-6 text-center">
                    <p class="text-sm text-content-muted">
                      Dokumen tersedia untuk diunduh.
                    </p>
                  </div>
                )}

              {data.fileUrl && (
                <div class="mt-4 flex justify-end">
                  <a
                    href={data.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    class="rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    Buka Berkas
                  </a>
                </div>
              )}
            </div>
          )}

        <section class="mt-6 rounded-xl border border-border bg-surface p-4 shadow-xs sm:p-6">
          <h2 class="text-lg font-semibold text-content">
            Komentar & Diskusi
          </h2>
          <p class="mt-0.5 text-sm text-content-muted">
            Tanyakan atau beri tanggapan tentang materi ini
          </p>
          <div class="mt-4">
            <MaterialComments materialId={data.id} />
          </div>
        </section>
      </article>
    </>
  );
});
