import { HttpError, page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { Card } from "@/components/ui/Card.tsx";
import ForumTopicForm from "@/islands/ForumTopicForm.tsx";
import { getForumMeta } from "@/lib/server/backend.ts";

interface BuatTopikData {
  classOptions: Array<{ id: string; name: string }>;
  subjectOptions: Array<{ id: string; name: string }>;
  fixedClass?: { id: string; name: string };
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "guru" && session.user.role !== "murid") {
      return ctx.redirect("/forum");
    }

    try {
      const meta = await getForumMeta(session.accessToken);
      const fixedClass = meta.classes.length === 1
        ? meta.classes[0]
        : undefined;
      return page({
        classOptions: fixedClass ? [] : meta.classes,
        subjectOptions: meta.subjects.map((s) => ({
          id: s.id,
          name: s.name,
        })),
        fixedClass,
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(500, "Gagal memuat pilihan kelas & mapel");
    }
  },
});

export default define.page<typeof handler>(
  ({ data }: { data: BuatTopikData }) => {
    return (
      <>
        <Head>
          <title>Tulis Topik — Forum</title>
        </Head>

        <section class="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="text-sm text-content-muted">Forum diskusi kelas</p>
            <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
              Tulis Topik Baru
            </h1>
          </div>
          <a
            href="/forum"
            class="inline-flex items-center rounded-md border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-content-muted transition-colors hover:text-content"
          >
            Kembali ke Forum
          </a>
        </section>

        <Card
          title="Form Topik"
          description="Mulai diskusi baru di forum kelas"
        >
          <ForumTopicForm
            classOptions={data.classOptions}
            subjectOptions={data.subjectOptions}
            fixedClass={data.fixedClass}
          />
        </Card>
      </>
    );
  },
);
