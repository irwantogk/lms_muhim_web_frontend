import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { ROLE_META } from "@/lib/roles.ts";
import { greetingForHour, toDateLabel } from "@/lib/date.ts";
import { Card } from "@/components/ui/Card.tsx";
import {
  changeMyPassword,
  getMyProfile,
  type MeProfile,
  updateMyProfile,
} from "@/lib/server/backend.ts";
import PhotoUpload from "@/islands/PhotoUpload.tsx";

interface ProfilData {
  profile: MeProfile | null;
  roleLabel: string;
  dateLabel: string;
  greeting: string;
  error: string | null;
  ok: string | null;
}

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function Notice({ ok, error }: { ok: string | null; error: string | null }) {
  if (!ok && !error) return null;
  return (
    <div
      role="alert"
      class={`rounded-md border px-3 py-2 text-sm ${
        error
          ? "border-status-sakit/30 bg-status-sakit/10 text-status-sakit"
          : "border-status-hadir/30 bg-status-hadir/10 text-status-hadir"
      }`}
    >
      {error ?? ok}
    </div>
  );
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");

    const now = new Date();
    let profile: MeProfile | null = null;
    let error: string | null = ctx.url.searchParams.get("error");
    const ok: string | null = ctx.url.searchParams.get("ok");
    try {
      profile = await getMyProfile(session.accessToken);
    } catch (err) {
      error = err instanceof Error ? err.message : "Gagal memuat profil";
    }

    if (!profile) {
      return page({
        profile: null,
        roleLabel: ROLE_META[session.user.role].label,
        dateLabel: toDateLabel(now),
        greeting: greetingForHour(now),
        error,
        ok,
      });
    }

    return page({
      profile,
      roleLabel: ROLE_META[session.user.role].label,
      dateLabel: toDateLabel(now),
      greeting: greetingForHour(now),
      error,
      ok,
    });
  },

  async POST(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");

    const form = await ctx.req.formData();
    const action = String(form.get("action") ?? "");
    const redirect = (ok?: string, error?: string) => {
      const params = new URLSearchParams();
      if (ok) params.set("ok", ok);
      if (error) params.set("error", error);
      const query = params.toString();
      return ctx.redirect(query ? `/profil?${query}` : "/profil");
    };

    try {
      if (action === "profile") {
        const fullName = String(form.get("fullName") ?? "").trim();
        await updateMyProfile(session.accessToken, { fullName });
        return redirect("Profil diperbarui");
      }
      if (action === "password") {
        const currentPassword = String(form.get("currentPassword") ?? "");
        const newPassword = String(form.get("newPassword") ?? "");
        const confirm = String(form.get("confirmPassword") ?? "");
        if (newPassword !== confirm) {
          return redirect(undefined, "Konfirmasi kata sandi baru tidak cocok");
        }
        await changeMyPassword(session.accessToken, {
          currentPassword,
          newPassword,
        });
        return redirect("Kata sandi diperbarui");
      }
      return redirect(undefined, "Aksi tidak dikenali");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Operasi gagal";
      return redirect(undefined, message);
    }
  },
});

export default define.page<typeof handler>(
  ({ data }: { data: ProfilData }) => {
    const profile = data.profile;

    return (
      <>
        <Head>
          <title>Profil Saya — SMA Muhammadiyah Imogiri</title>
        </Head>

        <section class="mb-6">
          <p class="text-sm text-content-muted">{data.dateLabel}</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Profil Saya
          </h1>
          <p class="mt-1 text-sm text-content-muted">
            <span class="font-semibold text-primary">{data.roleLabel}</span> —
            {" "}
            {data.greeting}. Kelola identitas dan keamanan akun Anda.
          </p>
        </section>

        {!profile && (
          <div
            role="alert"
            class="rounded-md border border-status-sakit/30 bg-status-sakit/10 px-3 py-2 text-sm text-status-sakit"
          >
            Profil tidak dapat dimuat dari server API ({data.error}).
          </div>
        )}

        {profile && (
          <div class="grid gap-6 lg:grid-cols-2">
            <div class="lg:col-span-2">
              <Notice ok={data.ok} error={data.error} />
            </div>

            {profile.role === "murid"
              ? (
                <>
                  <Card title="Data Diri">
                    <div class="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div class="rounded-lg border border-border bg-surface-subtle px-3 py-2">
                        <p class="text-xs text-content-muted">Email</p>
                        <p class="mt-0.5 break-words font-medium text-content">
                          {profile.email ?? "—"}
                        </p>
                      </div>
                      <div class="rounded-lg border border-border bg-surface-subtle px-3 py-2">
                        <p class="text-xs text-content-muted">Peran</p>
                        <p class="mt-0.5 font-medium text-content">
                          {data.roleLabel}
                        </p>
                      </div>
                      <div class="rounded-lg border border-border bg-surface-subtle px-3 py-2">
                        <p class="text-xs text-content-muted">NISN</p>
                        <p class="mt-0.5 font-medium text-content">
                          {profile.nisn ?? "—"}
                        </p>
                      </div>
                    </div>
                    <p class="text-sm text-content-muted">
                      Data akun murid dikelola oleh sekolah. Untuk perubahan
                      nama, foto, atau kata sandi, hubungi guru/wali kelas atau
                      admin.
                    </p>
                  </Card>
                  <Card title="Keamanan Akun">
                    <p class="text-sm text-content-muted">
                      Murid tidak dapat mengubah profil sendiri di aplikasi ini.
                    </p>
                  </Card>
                </>
              )
              : (
                <>
                  <Card
                    title="Foto Profil"
                    description="PNG/JPG/WEBP/GIF, maksimal 5 MB"
                  >
                    <div class="flex justify-center py-2">
                      <PhotoUpload photoUrl={profile.photoUrl} />
                    </div>
                  </Card>

                  <Card title="Data Diri" description="Informasi akun Anda">
                    <div class="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div class="rounded-lg border border-border bg-surface-subtle px-3 py-2">
                        <p class="text-xs text-content-muted">Email</p>
                        <p class="mt-0.5 break-words font-medium text-content">
                          {profile.email ?? "—"}
                        </p>
                      </div>
                      <div class="rounded-lg border border-border bg-surface-subtle px-3 py-2">
                        <p class="text-xs text-content-muted">Peran</p>
                        <p class="mt-0.5 font-medium text-content">
                          {data.roleLabel}
                        </p>
                      </div>
                    </div>

                    <form method="post" action="/profil" class="grid gap-3">
                      <input type="hidden" name="action" value="profile" />
                      <label class="block">
                        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
                          Nama Lengkap
                        </span>
                        <input
                          type="text"
                          name="fullName"
                          required
                          maxLength={120}
                          defaultValue={profile.name}
                          class={INPUT_CLASS}
                        />
                      </label>
                      <div>
                        <button
                          type="submit"
                          class="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                          Simpan Nama
                        </button>
                      </div>
                    </form>
                  </Card>

                  <Card
                    title="Ubah Kata Sandi"
                    description="Gunakan kata sandi lama untuk mengonfirmasi"
                  >
                    <form method="post" action="/profil" class="grid gap-3">
                      <input type="hidden" name="action" value="password" />
                      <label class="block">
                        <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
                          Kata Sandi Lama
                        </span>
                        <input
                          type="password"
                          name="currentPassword"
                          required
                          class={INPUT_CLASS}
                        />
                      </label>
                      <div class="grid gap-3 sm:grid-cols-2">
                        <label class="block">
                          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
                            Kata Sandi Baru
                          </span>
                          <input
                            type="password"
                            name="newPassword"
                            required
                            minLength={6}
                            class={INPUT_CLASS}
                          />
                        </label>
                        <label class="block">
                          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
                            Konfirmasi
                          </span>
                          <input
                            type="password"
                            name="confirmPassword"
                            required
                            minLength={6}
                            class={INPUT_CLASS}
                          />
                        </label>
                      </div>
                      <div>
                        <button
                          type="submit"
                          class="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                          Ubah Kata Sandi
                        </button>
                      </div>
                    </form>
                  </Card>
                </>
              )}
          </div>
        )}
      </>
    );
  },
);
