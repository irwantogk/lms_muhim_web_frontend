import type { SessionUser } from "../../lib/types.ts";
import { ROLE_META } from "../../lib/roles.ts";
import { Avatar } from "../ui/Avatar.tsx";
import { toDateLabel } from "../../lib/date.ts";

const TONE_BY_ROLE: Record<
  SessionUser["role"],
  "admin" | "guru" | "murid" | "ortu"
> = {
  admin: "admin",
  guru: "guru",
  murid: "murid",
  orang_tua: "ortu",
};

export interface TopbarProps {
  user: SessionUser;
}

export function Topbar({ user }: TopbarProps) {
  const meta = ROLE_META[user.role];
  return (
    <header
      class={`sticky top-0 z-20 border-b border-border/70 bg-gradient-to-r ${meta.gradient} text-white shadow-sm`}
    >
      <div class="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <a
            href="/"
            class="flex shrink-0 items-center gap-2 font-bold tracking-tight"
          >
            <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20 text-sm font-extrabold">
              LMS
            </span>
            <span class="hidden sm:inline">SMA Muahammadiya Immogiri</span>
          </a>
          <span class="hidden truncate text-sm text-white/80 md:inline">
            {toDateLabel(new Date())}
          </span>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <div class="flex items-center gap-2 rounded-full bg-white/15 py-1 pl-1 pr-3">
            <Avatar
              name={user.name}
              size="sm"
              tone={TONE_BY_ROLE[user.role]}
            />
            <span class="hidden text-sm font-medium text-white sm:inline">
              {user.name}
            </span>
          </div>
          <a
            href="/logout"
            class="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            Keluar
          </a>
        </div>
      </div>
    </header>
  );
}
