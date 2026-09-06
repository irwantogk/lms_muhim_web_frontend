import { useState } from "preact/hooks";
import { NavList } from "@/components/layout/NavList.tsx";
import type { NavItem } from "@/components/layout/nav.ts";

export interface MobileNavProps {
  items: NavItem[];
  currentPath: string;
}

export default function MobileNav({ items, currentPath }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <div class="lg:hidden">
      <button
        type="button"
        aria-label="Buka menu navigasi"
        onClick={() => setOpen(true)}
        class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          class="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div
          class="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
        >
          <div
            class="absolute inset-0 bg-black/45"
            onClick={() => setOpen(false)}
          />
          <aside class="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-surface shadow-2xl">
            <div class="flex items-center justify-between border-b border-border px-4 py-3">
              <span class="text-sm font-bold text-content">Menu</span>
              <button
                type="button"
                aria-label="Tutup menu navigasi"
                onClick={() => setOpen(false)}
                class="inline-flex h-8 w-8 items-center justify-center rounded-md text-content-muted transition-colors hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  class="h-5 w-5"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <nav class="flex-1 overflow-y-auto px-3 py-4">
              <NavList
                items={items}
                currentPath={currentPath}
                variant="vertical"
              />
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}
