import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { getAttendanceOptions } from "@/lib/server/backend.ts";
import { Card } from "@/components/ui/Card.tsx";
import MaterialEditor from "@/islands/MaterialEditor.tsx";

interface TulisMateriData {
  classOptions: Array<{ id: string; name: string }>;
  subjectOptions: Array<{ id: string; name: string }>;
  error: string | null;
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "guru") return ctx.redirect("/materi");

    const classOptions: Array<{ id: string; name: string }> = [];
    const subjectOptions: Array<{ id: string; name: string }> = [];
    let error: string | null = null;

    try {
      const options = await getAttendanceOptions(session.accessToken);
      const classMap = new Map<string, { id: string; name: string }>();
      const subjectMap = new Map<string, { id: string; name: string }>();
      for (const option of options) {
        classMap.set(option.classId, {
          id: option.classId,
          name: option.className,
        });
        subjectMap.set(option.subjectId, {
          id: option.subjectId,
          name: option.subjectName,
        });
      }
      classOptions.push(...classMap.values());
      subjectOptions.push(...subjectMap.values());
    } catch {
      error = "Gagal memuat opsi kelas/mapel.";
    }

    return page({ classOptions, subjectOptions, error });
  },
});

export default define.page<typeof handler>(
  ({ data }: { data: TulisMateriData }) => {
    return (
      <>
        <Head>
          <title>Tulis Materi — SMA Muhammadiyah Imogiri</title>
        </Head>

        <section class="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm text-content-muted">Editor materi langsung</p>
            <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
              Tulis Materi
            </h1>
          </div>
          <a
            href="/materi"
            class="inline-flex items-center rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-content-muted transition-colors hover:text-content"
          >
            Kembali ke Materi
          </a>
        </section>

        {data.error && (
          <div
            role="alert"
            class="mb-4 rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
          >
            {data.error}
          </div>
        )}

        <Card
          title="Editor Konten"
          description="Materi tersimpan langsung tanpa berkas (tipe catatan) — mirip editor dokumen"
        >
          <MaterialEditor
            classOptions={data.classOptions}
            subjectOptions={data.subjectOptions}
          />
        </Card>
      </>
    );
  },
);
