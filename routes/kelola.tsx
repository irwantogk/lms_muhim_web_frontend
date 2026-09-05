import { page } from "fresh";
import { Head } from "fresh/runtime";
import { define } from "@/utils.ts";
import { greetingForHour, toDateLabel } from "@/lib/date.ts";
import { Card } from "@/components/ui/Card.tsx";
import type { Role } from "@/lib/types.ts";
import {
  addMembershipStudent,
  addMembershipTeacher,
  type AdminClass,
  type AdminSubject,
  changeMembershipTeacher,
  createAdminClass,
  createAdminSubject,
  createAdminUser,
  deleteAdminClass,
  deleteAdminSubject,
  getAdminClasses,
  getAdminSubjects,
  getAdminUser,
  getAdminUsers,
  getMembershipStudents,
  getMembershipTeachers,
  type ManagedUser,
  moveMembershipStudent,
  removeMembershipStudent,
  removeMembershipTeacher,
  type StudentMembershipApiData,
  type TeacherMembershipApiData,
  updateAdminClass,
  updateAdminSubject,
  updateAdminUser,
} from "@/lib/server/backend.ts";

const ROMAN: Record<number, string> = { 10: "X", 11: "XI", 12: "XII" };
const ROLE_LABEL: Record<string, string> = {
  admin: "Admin",
  guru: "Guru",
  murid: "Murid",
  orang_tua: "Orang Tua",
};
const USER_ROLE_OPTIONS = ["guru", "murid", "orang_tua"] as const;
const FILTER_ROLES: Role[] = ["admin", "guru", "murid", "orang_tua"];
const USER_PAGE_SIZE = 20;

type Tab = "kelas" | "mapel" | "pengguna" | "keanggotaan";
type RoleFilter = Role | null;
type StatusFilter = "aktif" | "nonaktif" | null;

interface KelolaData {
  userName: string;
  dateLabel: string;
  greeting: string;
  tab: Tab;
  classes: AdminClass[];
  subjects: AdminSubject[];
  users: ManagedUser[];
  roleFilter: RoleFilter;
  statusFilter: StatusFilter;
  userQ: string;
  userPage: number;
  userTotal: number;
  userLimit: number;
  editClass: AdminClass | null;
  editSubject: AdminSubject | null;
  editUser: ManagedUser | null;
  membershipClassId: string | null;
  studentMembership: StudentMembershipApiData | null;
  teacherMembership: TeacherMembershipApiData | null;
  error: string | null;
  ok: string | null;
}

const INPUT_CLASS =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40";

function romanGrade(grade: number): string {
  return ROMAN[grade] ?? String(grade);
}

function href(tab: Tab, over?: { ok?: string; error?: string }): string {
  const params = new URLSearchParams();
  if (tab !== "kelas") params.set("tab", tab);
  if (over?.ok) params.set("ok", over.ok);
  if (over?.error) params.set("error", over.error);
  const query = params.toString();
  return query ? `/kelola?${query}` : "/kelola";
}

function userListHref(opts: {
  role?: RoleFilter;
  status?: StatusFilter;
  q?: string;
  page?: number;
}): string {
  const params = new URLSearchParams({ tab: "pengguna" });
  if (opts.role) params.set("role", opts.role);
  if (opts.status) params.set("status", opts.status);
  if (opts.q) params.set("q", opts.q);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  return `/kelola?${params.toString()}`;
}

function memberHref(
  classId: string | null,
  over?: { ok?: string; error?: string },
): string {
  const params = new URLSearchParams({ tab: "keanggotaan" });
  if (classId) params.set("class", classId);
  if (over?.ok) params.set("ok", over.ok);
  if (over?.error) params.set("error", over.error);
  return `/kelola?${params.toString()}`;
}

function parseTab(value: string | null): Tab {
  if (value === "mapel") return "mapel";
  if (value === "pengguna") return "pengguna";
  if (value === "keanggotaan") return "keanggotaan";
  return "kelas";
}

export const handler = define.handlers({
  async GET(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "admin") return ctx.redirect("/");

    const url = new URL(ctx.req.url);
    const tab = parseTab(url.searchParams.get("tab"));
    const editId = url.searchParams.get("edit");

    const rawRole = url.searchParams.get("role");
    const roleFilter: RoleFilter =
      rawRole && FILTER_ROLES.includes(rawRole as Role)
        ? (rawRole as Role)
        : null;
    const rawStatus = url.searchParams.get("status");
    const statusFilter: StatusFilter =
      rawStatus === "aktif" || rawStatus === "nonaktif" ? rawStatus : null;

    let classes: AdminClass[] = [];
    let subjects: AdminSubject[] = [];
    let users: ManagedUser[] = [];
    let userTotal = 0;
    let error: string | null = url.searchParams.get("error");
    const ok: string | null = url.searchParams.get("ok");

    const userQ = url.searchParams.get("q") ?? "";
    const parsedPage = Number(url.searchParams.get("page"));
    const userPage = Number.isInteger(parsedPage) && parsedPage > 0
      ? parsedPage
      : 1;
    const userLimit = USER_PAGE_SIZE;
    const offset = (userPage - 1) * userLimit;

    try {
      const [classesRes, subjectsRes, userList] = await Promise.all([
        getAdminClasses(session.accessToken),
        getAdminSubjects(session.accessToken),
        getAdminUsers(session.accessToken, {
          role: roleFilter ?? undefined,
          status: statusFilter ?? undefined,
          q: userQ || undefined,
          limit: userLimit,
          offset,
        }),
      ]);
      classes = classesRes;
      subjects = subjectsRes;
      users = userList.items;
      userTotal = userList.total;
    } catch (err) {
      error = err instanceof Error
        ? err.message
        : "Gagal memuat data sekolah dari server";
    }

    let membershipClassId: string | null = null;
    let studentMembership: StudentMembershipApiData | null = null;
    let teacherMembership: TeacherMembershipApiData | null = null;
    if (tab === "keanggotaan" && classes.length > 0) {
      const requested = url.searchParams.get("class");
      const target = classes.find((c) => c.id === requested)?.id ??
        classes[0]!.id;
      membershipClassId = target;
      try {
        [studentMembership, teacherMembership] = await Promise.all([
          getMembershipStudents(session.accessToken, target),
          getMembershipTeachers(session.accessToken, target),
        ]);
      } catch (err) {
        error = err instanceof Error
          ? err.message
          : "Gagal memuat data keanggotaan";
      }
    }

    const now = new Date();
    const editClass = tab === "kelas" && editId
      ? classes.find((c) => c.id === editId) ?? null
      : null;
    const editSubject = tab === "mapel" && editId
      ? subjects.find((s) => s.id === editId) ?? null
      : null;
    let editUser: ManagedUser | null = tab === "pengguna" && editId
      ? users.find((u) => u.id === editId) ?? null
      : null;
    if (!editUser && editId) {
      try {
        editUser = await getAdminUser(session.accessToken, editId);
      } catch {
        // pengguna mungkin sudah dihapus
      }
    }

    return page({
      userName: session.user.name,
      dateLabel: toDateLabel(now),
      greeting: greetingForHour(now),
      tab,
      classes,
      subjects,
      users,
      roleFilter,
      statusFilter,
      userQ,
      userPage,
      userTotal,
      userLimit,
      editClass,
      editSubject,
      editUser,
      membershipClassId,
      studentMembership,
      teacherMembership,
      error,
      ok,
    });
  },

  async POST(ctx) {
    const session = ctx.state.session;
    if (!session) return ctx.redirect("/login");
    if (session.user.role !== "admin") return ctx.redirect("/");

    const form = await ctx.req.formData();
    const tab = parseTab(String(form.get("tab") ?? "kelas"));
    const action = String(form.get("action") ?? "create");

    const run = async (
      fn: () => Promise<unknown>,
      okMessage: string,
    ): Promise<Response> => {
      try {
        await fn();
        return ctx.redirect(href(tab, { ok: okMessage }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Operasi gagal";
        return ctx.redirect(href(tab, { error: message }));
      }
    };

    if (tab === "keanggotaan") {
      const classId = String(form.get("classId") ?? "").trim();
      const go = async (
        fn: () => Promise<unknown>,
        okMessage: string,
      ): Promise<Response> => {
        try {
          await fn();
          return ctx.redirect(memberHref(classId, { ok: okMessage }));
        } catch (err) {
          const message = err instanceof Error ? err.message : "Operasi gagal";
          return ctx.redirect(memberHref(classId, { error: message }));
        }
      };

      const studentId = String(form.get("studentId") ?? "").trim();
      const toClass = String(form.get("toClass") ?? "").trim();
      const rowId = String(form.get("id") ?? "").trim();
      const subjectId = String(form.get("subjectId") ?? "").trim();
      const teacherId = String(form.get("teacherId") ?? "").trim();

      if (action === "moveStudent" && studentId && toClass) {
        return go(
          () =>
            moveMembershipStudent(session.accessToken, {
              studentId,
              classId: toClass,
            }),
          "Murid dipindahkan ke kelas lain",
        );
      }
      if (action === "removeStudent" && classId && studentId) {
        return go(
          () =>
            removeMembershipStudent(
              session.accessToken,
              classId,
              studentId,
            ),
          "Murid dikeluarkan dari kelas",
        );
      }
      if (action === "addStudent" && classId && studentId) {
        return go(
          () => addMembershipStudent(session.accessToken, classId, studentId),
          "Murid ditambahkan ke kelas",
        );
      }
      if (action === "removeTeacher" && rowId) {
        return go(
          () => removeMembershipTeacher(session.accessToken, rowId),
          "Penugasan guru dihapus",
        );
      }
      if (action === "changeTeacher" && rowId && teacherId) {
        return go(
          () => changeMembershipTeacher(session.accessToken, rowId, teacherId),
          "Guru pengampu diperbarui",
        );
      }
      if (action === "addTeacher" && classId && subjectId && teacherId) {
        return go(
          () =>
            addMembershipTeacher(session.accessToken, {
              classId,
              subjectId,
              teacherId,
            }),
          "Guru pengampu ditetapkan",
        );
      }
      return ctx.redirect(
        memberHref(classId, { error: "Aksi tidak dikenali" }),
      );
    }

    if (tab === "pengguna") {
      const id = String(form.get("id") ?? "").trim();
      const fullName = String(form.get("fullName") ?? "").trim();
      const email = String(form.get("email") ?? "").trim();
      const nisn = String(form.get("nisn") ?? "").trim();
      const password = String(form.get("password") ?? "");
      const role = String(form.get("role") ?? "guru") as Role;

      if (action === "status" && id) {
        const target = String(form.get("target") ?? "aktif");
        return run(
          () =>
            updateAdminUser(session.accessToken, id, {
              isActive: target !== "nonaktif",
            }),
          target === "nonaktif" ? "Akun dinonaktifkan" : "Akun diaktifkan",
        );
      }
      if (action === "update" && id) {
        const isActive = String(form.get("isActive") ?? "") === "on";
        const body: {
          fullName: string;
          email?: string;
          nisn?: string;
          role: Role;
          isActive: boolean;
          password?: string;
        } = {
          fullName,
          role,
          isActive,
          ...(email ? { email } : {}),
          ...(nisn ? { nisn } : {}),
        };
        if (password) body.password = password;
        return run(
          () => updateAdminUser(session.accessToken, id, body),
          "Pengguna diperbarui",
        );
      }
      return run(
        () =>
          createAdminUser(session.accessToken, {
            fullName,
            email,
            nisn,
            password,
            role,
          }),
        "Pengguna ditambahkan",
      );
    }

    if (tab === "kelas") {
      const id = String(form.get("id") ?? "").trim();
      const name = String(form.get("name") ?? "").trim();
      const grade = Number(form.get("grade"));
      const academicYear = String(form.get("academicYear") ?? "").trim();
      const body = { name, grade, academicYear };

      if (action === "delete" && id) {
        return run(
          () => deleteAdminClass(session.accessToken, id),
          "Kelas dihapus",
        );
      }
      if (action === "update" && id) {
        return run(
          () => updateAdminClass(session.accessToken, id, body),
          "Kelas diperbarui",
        );
      }
      return run(
        () => createAdminClass(session.accessToken, body),
        "Kelas ditambahkan",
      );
    }

    const id = String(form.get("id") ?? "").trim();
    const code = String(form.get("code") ?? "").trim();
    const name = String(form.get("name") ?? "").trim();
    const body = { code, name };

    if (action === "delete" && id) {
      return run(
        () => deleteAdminSubject(session.accessToken, id),
        "Mapel dihapus",
      );
    }
    if (action === "update" && id) {
      return run(
        () => updateAdminSubject(session.accessToken, id, body),
        "Mapel diperbarui",
      );
    }
    return run(
      () => createAdminSubject(session.accessToken, body),
      "Mapel ditambahkan",
    );
  },
});

function Notice({ ok, error }: { ok: string | null; error: string | null }) {
  if (!ok && !error) return null;
  return (
    <div
      role="alert"
      class={`mb-4 rounded-md border px-3 py-2 text-sm ${
        error
          ? "border-status-sakit/30 bg-status-sakit/10 text-status-sakit"
          : "border-status-hadir/30 bg-status-hadir/10 text-status-hadir"
      }`}
    >
      {error ?? ok}
    </div>
  );
}

function TabNav({ tab }: { tab: Tab }) {
  const items: Array<{ label: string; href: string; tab: Tab }> = [
    { label: "Kelas", href: "/kelola", tab: "kelas" },
    { label: "Mata Pelajaran", href: "/kelola?tab=mapel", tab: "mapel" },
    { label: "Pengguna", href: "/kelola?tab=pengguna", tab: "pengguna" },
    {
      label: "Keanggotaan",
      href: "/kelola?tab=keanggotaan",
      tab: "keanggotaan",
    },
  ];
  return (
    <div class="mb-6 flex flex-wrap items-center gap-2 text-sm">
      {items.map((item) => (
        <a
          key={item.tab}
          href={item.href}
          aria-current={tab === item.tab ? "page" : undefined}
          class={`rounded-full border px-3.5 py-1.5 font-medium ${
            tab === item.tab
              ? "border-primary bg-primary/10 text-primary"
              : "border-border bg-surface text-content-muted hover:text-content"
          }`}
        >
          {item.label}
        </a>
      ))}
    </div>
  );
}

function ClassForm({
  editing,
  tab,
  ok,
  error,
}: {
  editing: AdminClass | null;
  tab: Tab;
  ok: string | null;
  error: string | null;
}) {
  const isEdit = editing !== null;
  return (
    <Card
      title={isEdit ? `Ubah Kelas — ${editing.name}` : "Tambah Kelas"}
      description="Kelas diisi tingkat (10/11/12) dan tahun ajaran"
      action={isEdit
        ? (
          <a
            href={href(tab)}
            class="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content-muted hover:text-content"
          >
            Batal
          </a>
        )
        : undefined}
    >
      <Notice ok={ok} error={error} />
      <form method="post" action="/kelola" class="grid gap-3">
        <input type="hidden" name="tab" value="kelas" />
        {isEdit && <input type="hidden" name="id" value={editing.id} />}
        <input
          type="hidden"
          name="action"
          value={isEdit ? "update" : "create"}
        />

        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
            Nama Kelas
          </span>
          <input
            type="text"
            name="name"
            required
            maxLength={120}
            defaultValue={editing?.name ?? ""}
            placeholder="contoh: XII IPA 1"
            class={INPUT_CLASS}
          />
        </label>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
              Tingkat
            </span>
            <input
              type="number"
              name="grade"
              required
              min={10}
              max={12}
              defaultValue={editing?.grade ?? 12}
              class={INPUT_CLASS}
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
              Tahun Ajaran
            </span>
            <input
              type="text"
              name="academicYear"
              required
              maxLength={20}
              defaultValue={editing?.academicYear ?? "2025/2026"}
              placeholder="contoh: 2025/2026"
              class={INPUT_CLASS}
            />
          </label>
        </div>

        <div>
          <button
            type="submit"
            class="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {isEdit ? "Simpan Perubahan" : "Tambah Kelas"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function SubjectForm({
  editing,
  tab,
  ok,
  error,
}: {
  editing: AdminSubject | null;
  tab: Tab;
  ok: string | null;
  error: string | null;
}) {
  const isEdit = editing !== null;
  return (
    <Card
      title={isEdit ? `Ubah Mapel — ${editing.name}` : "Tambah Mata Pelajaran"}
      description="Kode singkat (contoh: MTK) dan nama lengkap mapel"
      action={isEdit
        ? (
          <a
            href={href(tab)}
            class="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content-muted hover:text-content"
          >
            Batal
          </a>
        )
        : undefined}
    >
      <Notice ok={ok} error={error} />
      <form method="post" action="/kelola" class="grid gap-3">
        <input type="hidden" name="tab" value="mapel" />
        {isEdit && <input type="hidden" name="id" value={editing.id} />}
        <input
          type="hidden"
          name="action"
          value={isEdit ? "update" : "create"}
        />

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
              Kode
            </span>
            <input
              type="text"
              name="code"
              required
              maxLength={20}
              defaultValue={editing?.code ?? ""}
              placeholder="contoh: MTK"
              class={INPUT_CLASS}
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
              Nama Mapel
            </span>
            <input
              type="text"
              name="name"
              required
              maxLength={120}
              defaultValue={editing?.name ?? ""}
              placeholder="contoh: Matematika"
              class={INPUT_CLASS}
            />
          </label>
        </div>

        <div>
          <button
            type="submit"
            class="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {isEdit ? "Simpan Perubahan" : "Tambah Mapel"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function UserForm({
  editing,
  tab,
  ok,
  error,
}: {
  editing: ManagedUser | null;
  tab: Tab;
  ok: string | null;
  error: string | null;
}) {
  const isEdit = editing !== null;
  return (
    <Card
      title={isEdit ? `Ubah Pengguna — ${editing.fullName}` : "Tambah Pengguna"}
      description="Akun guru, murid, atau orang tua"
      action={isEdit
        ? (
          <a
            href={href(tab)}
            class="rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content-muted hover:text-content"
          >
            Batal
          </a>
        )
        : undefined}
    >
      <Notice ok={ok} error={error} />
      <form method="post" action="/kelola" class="grid gap-3">
        <input type="hidden" name="tab" value="pengguna" />
        {isEdit && <input type="hidden" name="id" value={editing.id} />}
        <input
          type="hidden"
          name="action"
          value={isEdit ? "update" : "create"}
        />

        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
            Nama Lengkap
          </span>
          <input
            type="text"
            name="fullName"
            required
            maxLength={120}
            defaultValue={editing?.fullName ?? ""}
            placeholder="Nama pengguna"
            class={INPUT_CLASS}
          />
        </label>

        <div class="grid gap-3 sm:grid-cols-2">
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
              Email{isEdit ? " (biarkan kosong bila tidak diubah)" : ""}
            </span>
            <input
              type="text"
              name="email"
              placeholder="nama@sekolah.sch.id"
              class={INPUT_CLASS}
            />
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
              Peran
            </span>
            <select
              name="role"
              required
              class={INPUT_CLASS}
              defaultValue={editing?.role ?? "guru"}
            >
              {USER_ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABEL[role]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
            NISN (murid — 10 digit){isEdit
              ? " • biarkan kosong bila tidak diubah"
              : ""}
          </span>
          <input
            type="text"
            name="nisn"
            maxLength={20}
            inputMode="numeric"
            placeholder="contoh: 1000000001"
            class={INPUT_CLASS}
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
            Kata Sandi{isEdit ? " (opsional)" : ""}
          </span>
          <input
            type="password"
            name="password"
            minLength={6}
            required={!isEdit}
            placeholder={isEdit
              ? "Biarkan kosong bila tidak diganti"
              : "Minimal 6 karakter"}
            class={INPUT_CLASS}
          />
        </label>

        {isEdit && (
          <label class="flex items-center gap-2 text-sm text-content">
            <input
              type="checkbox"
              name="isActive"
              checked={editing.isActive}
              class="h-4 w-4 accent-primary"
            />
            Akun aktif (bisa login)
          </label>
        )}

        <div>
          <button
            type="submit"
            class="inline-flex items-center rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {isEdit ? "Simpan Perubahan" : "Tambah Pengguna"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function UserFilters({
  roleFilter,
  statusFilter,
  q,
}: {
  roleFilter: RoleFilter;
  statusFilter: StatusFilter;
  q: string;
}) {
  const chip = (active: boolean) =>
    active
      ? "border-primary bg-primary/10 text-primary"
      : "border-border bg-surface text-content-muted hover:text-content";
  return (
    <div class="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-semibold uppercase tracking-wide text-content-muted">
          Peran
        </span>
        <a
          href={userListHref({ role: null, status: statusFilter, q })}
          class={`rounded-full border px-2.5 py-1 font-medium ${
            chip(!roleFilter)
          }`}
        >
          Semua
        </a>
        {FILTER_ROLES.map((role) => (
          <a
            key={role}
            href={userListHref({ role, status: statusFilter, q })}
            class={`rounded-full border px-2.5 py-1 font-medium ${
              chip(roleFilter === role)
            }`}
          >
            {ROLE_LABEL[role]}
          </a>
        ))}
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <span class="font-semibold uppercase tracking-wide text-content-muted">
          Status
        </span>
        <a
          href={userListHref({ role: roleFilter, status: null, q })}
          class={`rounded-full border px-2.5 py-1 font-medium ${
            chip(!statusFilter)
          }`}
        >
          Semua
        </a>
        <a
          href={userListHref({ role: roleFilter, status: "aktif", q })}
          class={`rounded-full border px-2.5 py-1 font-medium ${
            chip(statusFilter === "aktif")
          }`}
        >
          Aktif
        </a>
        <a
          href={userListHref({ role: roleFilter, status: "nonaktif", q })}
          class={`rounded-full border px-2.5 py-1 font-medium ${
            chip(statusFilter === "nonaktif")
          }`}
        >
          Nonaktif
        </a>
      </div>
    </div>
  );
}

export default define.page<typeof handler>(
  ({ data }: { data: KelolaData }) => {
    const tab = data.tab;
    const studentMembership = data.studentMembership;
    const teacherMembership = data.teacherMembership;
    const userOffset = (data.userPage - 1) * data.userLimit;
    const userTotalPages = Math.max(
      1,
      Math.ceil(data.userTotal / data.userLimit),
    );
    const userFrom = data.userTotal === 0 ? 0 : userOffset + 1;
    const userTo = Math.min(
      data.userTotal,
      userOffset + data.users.length,
    );

    return (
      <>
        <Head>
          <title>Kelola Data Sekolah — SMA Muhammadiyah Imogiri</title>
        </Head>

        <section class="mb-6">
          <p class="text-sm text-content-muted">{data.dateLabel}</p>
          <h1 class="mt-1 text-2xl font-bold tracking-tight text-content sm:text-3xl">
            Kelola Data Sekolah
          </h1>
          <p class="mt-1 text-sm text-content-muted">
            <span class="font-semibold text-primary">Admin</span> —{" "}
            {data.greeting},{" "}
            {data.userName.split(" ")[0]}. Kelola kelas, mata pelajaran, dan
            pengguna sekolah.
          </p>
        </section>

        <TabNav tab={tab} />

        {tab === "kelas" && (
          <div class="grid gap-6">
            <ClassForm
              editing={data.editClass}
              tab={tab}
              ok={data.ok}
              error={data.error}
            />
            <Card
              title="Daftar Kelas"
              description={`${data.classes.length} kelas tersimpan`}
            >
              {data.classes.length === 0
                ? (
                  <p class="py-8 text-center text-sm text-content-muted">
                    Belum ada kelas. Tambahkan kelas baru di atas.
                  </p>
                )
                : (
                  <div class="overflow-x-auto">
                    <table class="w-full min-w-[720px] border-collapse text-sm">
                      <thead>
                        <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
                          <th class="border-b border-border px-3 py-2 font-semibold">
                            Kelas
                          </th>
                          <th class="border-b border-border px-3 py-2 font-semibold">
                            Tingkat
                          </th>
                          <th class="border-b border-border px-3 py-2 font-semibold">
                            Tahun Ajaran
                          </th>
                          <th class="border-b border-border px-3 py-2 text-right font-semibold">
                            Murid
                          </th>
                          <th class="border-b border-border px-3 py-2 text-right font-semibold">
                            Mapel
                          </th>
                          <th class="border-b border-border px-3 py-2 text-right font-semibold">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.classes.map((klass) => (
                          <tr
                            key={klass.id}
                            class="border-b border-border align-top"
                          >
                            <td class="px-3 py-2 font-medium text-content">
                              {klass.name}
                            </td>
                            <td class="px-3 py-2 text-xs text-content-muted">
                              {romanGrade(klass.grade)}
                            </td>
                            <td class="px-3 py-2 text-xs text-content-muted">
                              {klass.academicYear}
                            </td>
                            <td class="px-3 py-2 text-right text-xs tabular-nums text-content">
                              {klass.studentCount}
                            </td>
                            <td class="px-3 py-2 text-right text-xs tabular-nums text-content">
                              {klass.subjectCount}
                            </td>
                            <td class="px-3 py-2">
                              <div class="flex items-center justify-end gap-2">
                                <a
                                  href={`/kelola?edit=${
                                    encodeURIComponent(klass.id)
                                  }`}
                                  class="rounded-md border border-border-strong bg-surface px-2 py-1 text-[11px] font-semibold text-content-muted hover:border-primary hover:text-primary"
                                >
                                  Ubah
                                </a>
                                <form method="post" action="/kelola">
                                  <input
                                    type="hidden"
                                    name="tab"
                                    value="kelas"
                                  />
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={klass.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="action"
                                    value="delete"
                                  />
                                  <button
                                    type="submit"
                                    class="rounded-md border border-status-sakit/30 bg-surface px-2 py-1 text-[11px] font-semibold text-status-sakit hover:bg-status-sakit/10"
                                  >
                                    Hapus
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </Card>
          </div>
        )}

        {tab === "mapel" && (
          <div class="grid gap-6">
            <SubjectForm
              editing={data.editSubject}
              tab={tab}
              ok={data.ok}
              error={data.error}
            />
            <Card
              title="Daftar Mata Pelajaran"
              description={`${data.subjects.length} mapel tersimpan`}
            >
              {data.subjects.length === 0
                ? (
                  <p class="py-8 text-center text-sm text-content-muted">
                    Belum ada mata pelajaran. Tambahkan mapel baru di atas.
                  </p>
                )
                : (
                  <div class="overflow-x-auto">
                    <table class="w-full min-w-[620px] border-collapse text-sm">
                      <thead>
                        <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
                          <th class="border-b border-border px-3 py-2 font-semibold">
                            Mapel
                          </th>
                          <th class="border-b border-border px-3 py-2 font-semibold">
                            Kode
                          </th>
                          <th class="border-b border-border px-3 py-2 text-right font-semibold">
                            Dipakai di
                          </th>
                          <th class="border-b border-border px-3 py-2 text-right font-semibold">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.subjects.map((subject) => (
                          <tr
                            key={subject.id}
                            class="border-b border-border align-top"
                          >
                            <td class="px-3 py-2 font-medium text-content">
                              {subject.name}
                            </td>
                            <td class="px-3 py-2 text-xs text-content-muted">
                              {subject.code}
                            </td>
                            <td class="px-3 py-2 text-right text-xs tabular-nums text-content">
                              {subject.usedCount} kelas
                            </td>
                            <td class="px-3 py-2">
                              <div class="flex items-center justify-end gap-2">
                                <a
                                  href={`/kelola?tab=mapel&edit=${
                                    encodeURIComponent(subject.id)
                                  }`}
                                  class="rounded-md border border-border-strong bg-surface px-2 py-1 text-[11px] font-semibold text-content-muted hover:border-primary hover:text-primary"
                                >
                                  Ubah
                                </a>
                                <form method="post" action="/kelola">
                                  <input
                                    type="hidden"
                                    name="tab"
                                    value="mapel"
                                  />
                                  <input
                                    type="hidden"
                                    name="id"
                                    value={subject.id}
                                  />
                                  <input
                                    type="hidden"
                                    name="action"
                                    value="delete"
                                  />
                                  <button
                                    type="submit"
                                    class="rounded-md border border-status-sakit/30 bg-surface px-2 py-1 text-[11px] font-semibold text-status-sakit hover:bg-status-sakit/10"
                                  >
                                    Hapus
                                  </button>
                                </form>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </Card>
          </div>
        )}

        {tab === "pengguna" && (
          <div class="grid gap-6">
            <UserForm
              editing={data.editUser}
              tab={tab}
              ok={data.ok}
              error={data.error}
            />
            <Card
              title="Daftar Pengguna"
              description={`${data.userTotal} pengguna ditemukan`}
            >
              <div class="grid gap-4">
                <UserFilters
                  roleFilter={data.roleFilter}
                  statusFilter={data.statusFilter}
                  q={data.userQ}
                />

                <form
                  method="get"
                  action="/kelola"
                  class="flex flex-wrap items-center gap-2"
                >
                  <input type="hidden" name="tab" value="pengguna" />
                  {data.roleFilter && (
                    <input
                      type="hidden"
                      name="role"
                      value={data.roleFilter}
                    />
                  )}
                  {data.statusFilter && (
                    <input
                      type="hidden"
                      name="status"
                      value={data.statusFilter}
                    />
                  )}
                  <input
                    type="search"
                    name="q"
                    defaultValue={data.userQ}
                    placeholder="Cari nama atau email…"
                    class="min-w-40 flex-1 rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  />
                  <button
                    type="submit"
                    class="rounded-md border border-border-strong bg-surface px-3 py-2 text-sm font-semibold text-content transition-colors hover:bg-surface-muted"
                  >
                    Cari
                  </button>
                  {data.userQ && (
                    <a
                      href={userListHref({
                        role: data.roleFilter,
                        status: data.statusFilter,
                      })}
                      class="text-xs font-semibold text-primary hover:text-primary-hover"
                    >
                      Reset
                    </a>
                  )}
                </form>

                <div class="overflow-x-auto">
                  <table class="w-full min-w-[760px] border-collapse text-sm">
                    <thead>
                      <tr class="text-left text-xs uppercase tracking-wide text-content-muted">
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Nama
                        </th>
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Email
                        </th>
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Peran
                        </th>
                        <th class="border-b border-border px-3 py-2 font-semibold">
                          Status
                        </th>
                        <th class="border-b border-border px-3 py-2 text-right font-semibold">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.users.map((user) => (
                        <tr
                          key={user.id}
                          class="border-b border-border align-top"
                        >
                          <td class="px-3 py-2">
                            <p class="font-medium text-content">
                              {user.fullName}
                            </p>
                            {user.nisn && (
                              <p class="mt-0.5 text-[11px] text-content-muted">
                                NISN {user.nisn}
                              </p>
                            )}
                          </td>
                          <td class="px-3 py-2 text-xs text-content-muted">
                            {user.email}
                          </td>
                          <td class="px-3 py-2 text-xs text-content">
                            {ROLE_LABEL[user.role] ?? user.role}
                          </td>
                          <td class="px-3 py-2">
                            <span
                              class={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                user.isActive
                                  ? "border-status-hadir/30 bg-status-hadir/10 text-status-hadir"
                                  : "border-status-sakit/30 bg-status-sakit/10 text-status-sakit"
                              }`}
                            >
                              {user.isActive ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>
                          <td class="px-3 py-2">
                            <div class="flex items-center justify-end gap-2">
                              <a
                                href={`/kelola?tab=pengguna&edit=${
                                  encodeURIComponent(user.id)
                                }`}
                                class="rounded-md border border-border-strong bg-surface px-2 py-1 text-[11px] font-semibold text-content-muted hover:border-primary hover:text-primary"
                              >
                                Ubah
                              </a>
                              <form method="post" action="/kelola">
                                <input
                                  type="hidden"
                                  name="tab"
                                  value="pengguna"
                                />
                                <input
                                  type="hidden"
                                  name="id"
                                  value={user.id}
                                />
                                <input
                                  type="hidden"
                                  name="action"
                                  value="status"
                                />
                                <input
                                  type="hidden"
                                  name="target"
                                  value={user.isActive ? "nonaktif" : "aktif"}
                                />
                                <button
                                  type="submit"
                                  class={`rounded-md border px-2 py-1 text-[11px] font-semibold ${
                                    user.isActive
                                      ? "border-status-sakit/30 bg-surface text-status-sakit hover:bg-status-sakit/10"
                                      : "border-status-hadir/30 bg-surface text-status-hadir hover:bg-status-hadir/10"
                                  }`}
                                >
                                  {user.isActive ? "Nonaktifkan" : "Aktifkan"}
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.users.length === 0 && (
                    <p class="py-6 text-center text-sm text-content-muted">
                      Tidak ada pengguna yang cocok.
                    </p>
                  )}
                </div>

                {data.userTotal > 0 && (
                  <div class="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <p class="text-xs text-content-muted">
                      Menampilkan {userFrom}–{userTo} dari {data.userTotal}
                    </p>
                    <div class="flex items-center gap-2">
                      <a
                        href={userListHref({
                          role: data.roleFilter,
                          status: data.statusFilter,
                          q: data.userQ || undefined,
                          page: data.userPage - 1,
                        })}
                        aria-disabled={data.userPage <= 1}
                        class={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                          data.userPage <= 1
                            ? "pointer-events-none border-border bg-surface text-content-muted opacity-50"
                            : "border-border-strong bg-surface text-content hover:border-primary hover:text-primary"
                        }`}
                      >
                        Sebelumnya
                      </a>
                      <span class="text-xs text-content-muted">
                        Halaman {data.userPage}/{userTotalPages}
                      </span>
                      <a
                        href={userListHref({
                          role: data.roleFilter,
                          status: data.statusFilter,
                          q: data.userQ || undefined,
                          page: data.userPage + 1,
                        })}
                        aria-disabled={data.userPage >= userTotalPages}
                        class={`rounded-md border px-3 py-1.5 text-xs font-semibold ${
                          data.userPage >= userTotalPages
                            ? "pointer-events-none border-border bg-surface text-content-muted opacity-50"
                            : "border-border-strong bg-surface text-content hover:border-primary hover:text-primary"
                        }`}
                      >
                        Berikutnya
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {tab === "keanggotaan" && (
          <div class="grid gap-6">
            <Notice ok={data.ok} error={data.error} />

            {data.classes.length === 0
              ? (
                <Card title="Keanggotaan">
                  <p class="py-8 text-center text-sm text-content-muted">
                    Belum ada kelas. Tambahkan kelas di tab Kelas terlebih
                    dahulu.
                  </p>
                </Card>
              )
              : (
                <>
                  <div class="flex flex-wrap items-center gap-2 text-xs">
                    <span class="font-semibold uppercase tracking-wide text-content-muted">
                      Kelas
                    </span>
                    {data.classes.map((klass) => (
                      <a
                        key={klass.id}
                        href={memberHref(klass.id)}
                        aria-current={data.membershipClassId === klass.id
                          ? "page"
                          : undefined}
                        class={`rounded-full border px-3 py-1 font-medium ${
                          data.membershipClassId === klass.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-surface text-content-muted hover:text-content"
                        }`}
                      >
                        {klass.name}
                      </a>
                    ))}
                  </div>

                  <Card
                    title="Murid di Kelas"
                    description={studentMembership
                      ? `${studentMembership.enrolled.length} murid terdaftar di ${studentMembership.class.name}`
                      : "Pilih kelas untuk melihat murid"}
                  >
                    {studentMembership && (
                      <div class="grid gap-6 lg:grid-cols-2">
                        <div>
                          <h3 class="mb-2 text-sm font-semibold text-content">
                            Murid terdaftar
                          </h3>
                          {studentMembership.enrolled.length === 0
                            ? (
                              <p class="text-sm text-content-muted">
                                Belum ada murid di kelas ini.
                              </p>
                            )
                            : (
                              <ul class="divide-y divide-border">
                                {(studentMembership?.enrolled ?? []).map((
                                  m,
                                ) => (
                                  <li
                                    key={m.id}
                                    class="flex flex-col gap-2 py-2"
                                  >
                                    <div class="flex items-center justify-between gap-3">
                                      <span class="min-w-0 flex-1 truncate text-sm text-content">
                                        {m.name}
                                      </span>
                                      <form method="post" action="/kelola">
                                        <input
                                          type="hidden"
                                          name="tab"
                                          value="keanggotaan"
                                        />
                                        <input
                                          type="hidden"
                                          name="classId"
                                          value={studentMembership?.class.id ??
                                            ""}
                                        />
                                        <input
                                          type="hidden"
                                          name="studentId"
                                          value={m.id}
                                        />
                                        <input
                                          type="hidden"
                                          name="action"
                                          value="removeStudent"
                                        />
                                        <button
                                          type="submit"
                                          class="rounded-md border border-status-sakit/30 bg-surface px-2 py-1 text-[11px] font-semibold text-status-sakit hover:bg-status-sakit/10"
                                        >
                                          Keluarkan
                                        </button>
                                      </form>
                                    </div>
                                    {data.classes.filter((klass) =>
                                          klass.id !==
                                            studentMembership?.class.id
                                        ).length > 0 && (
                                      <form
                                        method="post"
                                        action="/kelola"
                                        class="flex flex-wrap items-end gap-2"
                                      >
                                        <input
                                          type="hidden"
                                          name="tab"
                                          value="keanggotaan"
                                        />
                                        <input
                                          type="hidden"
                                          name="classId"
                                          value={studentMembership?.class.id ??
                                            ""}
                                        />
                                        <input
                                          type="hidden"
                                          name="studentId"
                                          value={m.id}
                                        />
                                        <input
                                          type="hidden"
                                          name="action"
                                          value="moveStudent"
                                        />
                                        <label class="block min-w-40 flex-1">
                                          <span class="mb-1 block text-xs font-medium text-content-muted">
                                            Pindahkan ke
                                          </span>
                                          <select
                                            name="toClass"
                                            class={INPUT_CLASS}
                                          >
                                            {data.classes
                                              .filter((klass) =>
                                                klass.id !==
                                                  studentMembership?.class.id
                                              )
                                              .map((klass) => (
                                                <option
                                                  key={klass.id}
                                                  value={klass.id}
                                                >
                                                  {klass.name}
                                                </option>
                                              ))}
                                          </select>
                                        </label>
                                        <button
                                          type="submit"
                                          class="rounded-md border border-border-strong bg-surface px-3 py-2 text-xs font-semibold text-content hover:border-primary hover:text-primary"
                                        >
                                          Pindah
                                        </button>
                                      </form>
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                        </div>
                        <div>
                          <h3 class="mb-2 text-sm font-semibold text-content">
                            Murid tanpa kelas (tambahkan)
                          </h3>
                          {studentMembership.candidates.length === 0
                            ? (
                              <p class="text-sm text-content-muted">
                                Semua murid sudah memiliki kelas.
                              </p>
                            )
                            : (
                              <ul class="divide-y divide-border">
                                {(studentMembership?.candidates ?? []).map((
                                  m,
                                ) => (
                                  <li
                                    key={m.id}
                                    class="flex items-center justify-between gap-3 py-2"
                                  >
                                    <span class="min-w-0 flex-1 truncate text-sm text-content">
                                      {m.name}
                                    </span>
                                    <form method="post" action="/kelola">
                                      <input
                                        type="hidden"
                                        name="tab"
                                        value="keanggotaan"
                                      />
                                      <input
                                        type="hidden"
                                        name="classId"
                                        value={studentMembership?.class.id ??
                                          ""}
                                      />
                                      <input
                                        type="hidden"
                                        name="studentId"
                                        value={m.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="action"
                                        value="addStudent"
                                      />
                                      <button
                                        type="submit"
                                        class="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-white hover:bg-primary-hover"
                                      >
                                        Tambahkan
                                      </button>
                                    </form>
                                  </li>
                                ))}
                              </ul>
                            )}
                        </div>
                      </div>
                    )}
                  </Card>

                  <Card
                    title="Guru Pengampu per Mapel"
                    description={teacherMembership
                      ? `${teacherMembership.assignments.length} penugasan di ${teacherMembership.class.name}`
                      : "Pilih kelas untuk melihat guru pengampu"}
                  >
                    {teacherMembership && (
                      <div class="grid gap-6 lg:grid-cols-2">
                        <div>
                          <h3 class="mb-2 text-sm font-semibold text-content">
                            Penugasan saat ini
                          </h3>
                          {teacherMembership.assignments.length === 0
                            ? (
                              <p class="text-sm text-content-muted">
                                Belum ada guru pengampu.
                              </p>
                            )
                            : (
                              <ul class="divide-y divide-border">
                                {(teacherMembership?.assignments ?? []).map((
                                  a,
                                ) => (
                                  <li
                                    key={a.id}
                                    class="py-2"
                                  >
                                    <div class="flex items-center justify-between gap-3">
                                      <div class="min-w-0">
                                        <p class="text-sm font-medium text-content">
                                          {a.subjectName}
                                          <span class="ml-1 text-xs text-content-muted">
                                            {a.subjectCode}
                                          </span>
                                        </p>
                                        <p class="text-xs text-content-muted">
                                          {a.teacherName}
                                        </p>
                                      </div>
                                      <form method="post" action="/kelola">
                                        <input
                                          type="hidden"
                                          name="tab"
                                          value="keanggotaan"
                                        />
                                        <input
                                          type="hidden"
                                          name="id"
                                          value={a.id}
                                        />
                                        <input
                                          type="hidden"
                                          name="action"
                                          value="removeTeacher"
                                        />
                                        <button
                                          type="submit"
                                          class="rounded-md border border-status-sakit/30 bg-surface px-2 py-1 text-[11px] font-semibold text-status-sakit hover:bg-status-sakit/10"
                                        >
                                          Hapus
                                        </button>
                                      </form>
                                    </div>
                                    <form
                                      method="post"
                                      action="/kelola"
                                      class="mt-2 flex flex-wrap items-end gap-2"
                                    >
                                      <input
                                        type="hidden"
                                        name="tab"
                                        value="keanggotaan"
                                      />
                                      <input
                                        type="hidden"
                                        name="id"
                                        value={a.id}
                                      />
                                      <input
                                        type="hidden"
                                        name="action"
                                        value="changeTeacher"
                                      />
                                      <label class="block min-w-40 flex-1">
                                        <span class="mb-1 block text-xs font-medium text-content-muted">
                                          Ganti guru
                                        </span>
                                        <select
                                          name="teacherId"
                                          class={INPUT_CLASS}
                                          defaultValue={a.teacherId}
                                        >
                                          {(teacherMembership?.teachers ?? [])
                                            .map(
                                              (t) => (
                                                <option key={t.id} value={t.id}>
                                                  {t.name}
                                                </option>
                                              ),
                                            )}
                                        </select>
                                      </label>
                                      <button
                                        type="submit"
                                        class="rounded-md border border-border-strong bg-surface px-3 py-2 text-xs font-semibold text-content hover:border-primary hover:text-primary"
                                      >
                                        Simpan
                                      </button>
                                    </form>
                                  </li>
                                ))}
                              </ul>
                            )}
                        </div>
                        <div>
                          <h3 class="mb-2 text-sm font-semibold text-content">
                            Tetapkan guru untuk mapel baru
                          </h3>
                          {teacherMembership.availableSubjects.length === 0
                            ? (
                              <p class="text-sm text-content-muted">
                                Semua mapel sudah memiliki guru pengampu di
                                kelas ini.
                              </p>
                            )
                            : (
                              <form
                                method="post"
                                action="/kelola"
                                class="grid gap-3"
                              >
                                <input
                                  type="hidden"
                                  name="tab"
                                  value="keanggotaan"
                                />
                                <input
                                  type="hidden"
                                  name="classId"
                                  value={teacherMembership?.class.id ?? ""}
                                />
                                <input
                                  type="hidden"
                                  name="action"
                                  value="addTeacher"
                                />
                                <label class="block">
                                  <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
                                    Mapel
                                  </span>
                                  <select
                                    name="subjectId"
                                    required
                                    class={INPUT_CLASS}
                                  >
                                    {teacherMembership.availableSubjects
                                      .map(
                                        (s) => (
                                          <option key={s.id} value={s.id}>
                                            {s.name}
                                          </option>
                                        ),
                                      )}
                                  </select>
                                </label>
                                <label class="block">
                                  <span class="mb-1 block text-xs font-semibold uppercase tracking-wide text-content-muted">
                                    Guru
                                  </span>
                                  <select
                                    name="teacherId"
                                    required
                                    class={INPUT_CLASS}
                                  >
                                    {(teacherMembership?.teachers ?? []).map(
                                      (t) => (
                                        <option key={t.id} value={t.id}>
                                          {t.name}
                                        </option>
                                      ),
                                    )}
                                  </select>
                                </label>
                                <div>
                                  <button
                                    type="submit"
                                    class="rounded-md bg-primary px-3.5 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                                  >
                                    Tetapkan
                                  </button>
                                </div>
                              </form>
                            )}
                        </div>
                      </div>
                    )}
                  </Card>
                </>
              )}
          </div>
        )}
      </>
    );
  },
);
