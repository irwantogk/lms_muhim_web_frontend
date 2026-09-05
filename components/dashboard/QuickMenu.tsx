import type { QuickLink } from "../../lib/types.ts";
import { TONE_META } from "../../lib/roles.ts";
import { Card } from "../ui/Card.tsx";

export interface QuickMenuProps {
  items: QuickLink[];
}

export function QuickMenu({ items }: QuickMenuProps) {
  return (
    <Card title="Menu Cepat" description="Pintasan ke modul sesuai peran Anda">
      <ul class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => {
          const meta = TONE_META[item.tone];
          return (
            <li key={item.id}>
              <a
                href={item.href}
                class="flex w-full flex-col items-start gap-2 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span
                  class={`flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold text-white ${meta.solid}`}
                >
                  {item.monogram}
                </span>
                <span class="font-semibold text-content">{item.label}</span>
                <span class="text-xs text-content-muted">
                  {item.description}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
