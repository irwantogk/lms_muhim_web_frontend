import type { RoleTone } from "../../lib/types.ts";
import { TONE_META } from "../../lib/roles.ts";

export interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  tone?: RoleTone;
}

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
}: StatCardProps) {
  const meta = TONE_META[tone];
  return (
    <div class="relative overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-xs">
      <span class={`absolute inset-x-0 top-0 h-1 ${meta.bar}`} />
      <p class="text-sm text-content-muted">{label}</p>
      <p class="mt-1 text-3xl font-bold tabular-nums text-content">{value}</p>
      {hint && <p class="mt-1 text-xs text-content-muted">{hint}</p>}
    </div>
  );
}
