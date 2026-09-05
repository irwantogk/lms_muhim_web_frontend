import { HttpError, page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { buildDashboardData } from "@/lib/server/dashboard.ts";
import { ROLE_META } from "@/lib/roles.ts";
import { AdminHome } from "@/components/dashboard/AdminHome.tsx";
import { GuruHome } from "@/components/dashboard/GuruHome.tsx";
import { MuridHome } from "@/components/dashboard/MuridHome.tsx";
import { OrtuHome } from "@/components/dashboard/OrtuHome.tsx";
import { QuickMenu } from "@/components/dashboard/QuickMenu.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    try {
      const data = await buildDashboardData(session.user, session.accessToken);
      return page(data);
    } catch (error) {
      console.error("[dashboard]", error);
      throw new HttpError(502, "Gagal mengambil data beranda dari server API");
    }
  },
});

export default define.page<typeof handler>(({ data }) => {
  const meta = ROLE_META[data.role];

  return (
    <>
      <Head>
        <title>Beranda — SMA Muahmmadiyah Imogiri</title>
      </Head>

      <section class="mb-6">
        <p class="text-sm text-content-muted">{data.today.dateLabel}</p>
        <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
          {data.greeting}, {data.user.name.split(" ")[0]}
        </h1>
        <p class="mt-1 text-sm text-content-muted">
          <span class={`font-semibold ${meta.text}`}>{meta.label}</span> —{" "}
          {data.user.subtitle}
        </p>
      </section>

      {data.role === "admin" && <AdminHome data={data} />}
      {data.role === "guru" && <GuruHome data={data} />}
      {data.role === "murid" && <MuridHome data={data} />}
      {data.role === "orang_tua" && <OrtuHome data={data} />}

      <section class="mt-6">
        <QuickMenu items={data.quickLinks} />
      </section>
    </>
  );
});
