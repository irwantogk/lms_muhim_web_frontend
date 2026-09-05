import { define } from "@/utils.ts";
import { Topbar } from "@/components/layout/Topbar.tsx";
import { NavList } from "@/components/layout/NavList.tsx";
import { NAV_ITEMS } from "@/components/layout/nav.ts";
import { sessionUserOf } from "@/lib/server/dashboard.ts";

export default define.layout(({ Component, state, url }) => {
  const session = state.session;
  if (!session) return <Component />;

  const user = sessionUserOf(session.user);
  const items = NAV_ITEMS[session.user.role];

  return (
    <div class="min-h-screen bg-surface-subtle">
      <Topbar user={user} />

      {/* Navigasi horizontal untuk layar kecil */}
      <div class="border-b border-border bg-surface px-4 py-2 lg:hidden">
        <div class="mx-auto max-w-7xl">
          <NavList
            items={items}
            currentPath={url.pathname}
            variant="horizontal"
          />
        </div>
      </div>

      <div class="mx-auto flex max-w-7xl gap-6 px-4 py-5 sm:px-6 lg:py-8">
        {/* Sidebar desktop */}
        <aside class="hidden w-64 shrink-0 lg:block">
          <div class="sticky top-20 flex flex-col gap-4">
            <div
              class={`rounded-xl border border-border bg-surface p-4 shadow-xs`}
            >
              <p class="text-xs font-semibold uppercase tracking-wide text-content-muted">
                Menu
              </p>
              <div class="mt-3">
                <NavList
                  items={items}
                  currentPath={url.pathname}
                  variant="vertical"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Konten */}
        <main class="min-w-0 flex-1">
          <Component />
        </main>
      </div>
    </div>
  );
});
