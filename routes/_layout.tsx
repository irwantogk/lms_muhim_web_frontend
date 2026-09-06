import { define } from "@/utils.ts";
import { Topbar } from "@/components/layout/Topbar.tsx";
import { NavList } from "@/components/layout/NavList.tsx";
import { NAV_ITEMS } from "@/components/layout/nav.ts";
import { sessionUserOf } from "@/lib/server/dashboard.ts";
import MobileNav from "@/islands/MobileNav.tsx";

export default define.layout(({ Component, state, url }) => {
  const session = state.session;
  if (!session) return <Component />;

  const user = sessionUserOf(session.user);
  const items = NAV_ITEMS[session.user.role];

  return (
    <div class="min-h-screen bg-surface-subtle lg:flex">
      {/* Sidebar penuh (desktop) */}
      <aside class="hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-72 lg:shrink-0 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-border lg:bg-surface">
        <div class="flex h-16 shrink-0 items-center gap-2.5 border-b border-border px-5">
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-role-admin text-sm font-extrabold text-white">
            LMS
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-bold text-content">
              SMA Muhammadiyah Imogiri
            </p>
            <p class="text-[11px] text-content-muted">{user.name}</p>
          </div>
        </div>
        <nav class="flex-1 px-3 py-4">
          <p class="px-2 text-xs font-semibold uppercase tracking-wide text-content-muted">
            Navigasi
          </p>
          <div class="mt-2">
            <NavList
              items={items}
              currentPath={url.pathname}
              variant="vertical"
            />
          </div>
        </nav>
      </aside>

      {/* Konten utama */}
      <div class="flex min-w-0 flex-1 flex-col">
        <Topbar
          user={user}
          leading={<MobileNav items={items} currentPath={url.pathname} />}
        />
        <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <Component />
        </main>
      </div>
    </div>
  );
});
