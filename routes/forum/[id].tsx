import { HttpError, page } from "fresh";
import ForumReplyBox from "@/islands/ForumReplyBox.tsx";
import TopicModeration from "@/islands/TopicModeration.tsx";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import {
  type ForumReplyApi,
  type ForumTopicApi,
  getForumTopicDetail,
} from "@/lib/server/backend.ts";
import { Badge } from "@/components/ui/Badge.tsx";
import { Card } from "@/components/ui/Card.tsx";
import { timeAgoLabel, toDateTimeLabel } from "@/lib/date.ts";

interface DetailTopicData {
  topic: ForumTopicApi;
  replies: ForumReplyApi[];
  userRole: "guru" | "murid";
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "guru" && session.user.role !== "murid") {
      return ctx.redirect("/forum");
    }

    try {
      const data = await getForumTopicDetail(
        session.accessToken,
        ctx.params.id,
      );
      const userRole: "guru" | "murid" = session.user.role === "guru"
        ? "guru"
        : "murid";
      return page({
        topic: data.topic,
        replies: data.replies,
        userRole,
      });
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw new HttpError(404, "Topik tidak ditemukan");
    }
  },
});

export default define.page<typeof handler>(
  ({ data }: { data: DetailTopicData }) => {
    const { topic } = data;
    const canModerate = data.userRole === "guru";

    return (
      <>
        <Head>
          <title>{topic.title} — Forum</title>
        </Head>

        <a
          href="/forum"
          class="text-sm font-semibold text-primary hover:text-primary-hover"
        >
          ← Kembali ke Forum
        </a>

        <header class="mt-4">
          <div class="flex flex-wrap items-center gap-2">
            {topic.isHidden && <Badge tone="terlambat">Disembunyikan</Badge>}
            <span class="inline-flex items-center rounded bg-role-guru/10 px-1.5 py-0.5 text-[10px] font-bold text-role-guru">
              {topic.subjectCode}
            </span>
            <span class="text-xs text-content-muted">{topic.className}</span>
          </div>
          <h1 class="mt-2 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            {topic.title}
          </h1>
          <p class="mt-1 text-sm text-content-muted">
            {topic.subjectName} • {topic.authorName}
            {topic.authorRole === "guru" ? " (Guru)" : ""} •{" "}
            {timeAgoLabel(topic.createdAt)}
          </p>
          {canModerate && (
            <TopicModeration
              topicId={topic.id}
              title={topic.title}
              initialHidden={topic.isHidden}
            />
          )}
        </header>

        <div class="mt-6 grid gap-5">
          <Card title="Topik" description="Diskusi kelas">
            <p class="whitespace-pre-wrap text-sm leading-relaxed text-content">
              {topic.body}
            </p>
            <p class="mt-2 text-xs text-content-muted">
              Dibuat {toDateTimeLabel(topic.createdAt)}
            </p>
          </Card>

          <Card
            title="Balasan"
            description={`${data.replies.length} balasan`}
          >
            <ForumReplyBox
              canModerate={canModerate}
              topicId={topic.id}
              topicTitle={topic.title}
              initialReplies={data.replies}
            />
          </Card>
        </div>
      </>
    );
  },
);
