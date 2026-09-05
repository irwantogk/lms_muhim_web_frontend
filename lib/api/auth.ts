import type { Role, SessionUser } from "../types.ts";
import { users } from "../mock/db.ts";

const ROLE_TO_DEMO_USER_ID: Record<Role, string> = {
  admin: "a1",
  guru: "g1",
  murid: "m1",
  orang_tua: "p1",
};

const SUBTITLE: Record<Role, string> = {
  admin: "Administrator Sekolah",
  guru: "Guru Matematika • XII IPA 1 & 2",
  murid: "Kelas XII IPA 1",
  orang_tua: "Wali dari Rani Aulia (XII IPA 1)",
};

export function getSessionUser(role: Role): SessionUser {
  const demoId = ROLE_TO_DEMO_USER_ID[role];
  const user = users.find((u) => u.id === demoId) ?? users[0];
  return {
    id: user.id,
    name: user.full_name,
    role: user.role,
    subtitle: SUBTITLE[role],
    photoUrl: user.photo_url ?? null,
  };
}
