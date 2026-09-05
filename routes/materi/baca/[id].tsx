import { HttpError, page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getMaterialDetail } from "@/lib/server/backend.ts";
import { sanitizeHtml } from "@/lib/richtext.ts";
import { Badge } from "@/components/ui/Badge.tsx";
import RichContent from "@/islands/RichContent.tsx";

interface BacaData {
  id: string;
  className: string;
  subjectCode: string;
  subjectName: string;
  teacherName: string;
  title: string;
  content: string;
  createdAt: string;
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");

    try {
      const item = await getMaterialDetail(session.accessToken, ctx.params.id);
      if (!item.content) {
        throw new HttpError(404, "Materi ini tidak memiliki konten teks");
      }
      return page({
        id: item.id,
        className: item.className,
        subjectCode: item.subjectCode,
        subjectName: item.subjectName,
        teacherName: item.teacherName,
        title: item.title,
        content: item.content,
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
          </div>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-content">
            {data.title}
          </h1>
          <p class="mt-2 text-sm text-content-muted">
            {data.teacherName} • {date}
          </p>
        </header>

        <div class="mt-6 rounded-xl border border-border bg-surface p-6 shadow-xs">
          <RichContent content={sanitizeHtml(data.content)} />
        </div>
      </article>
    </>
  );
});
