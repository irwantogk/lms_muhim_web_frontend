import type { RoleTone } from "../../lib/types.ts";
import { TONE_META } from "../../lib/roles.ts";

export interface ProgressBarProps {
  value: number;
  max?: number;
  tone?: RoleTone;
  class?: string;
}

export function ProgressBar({
  value,
  max = 100,
  tone = "primary",
  class: extraClass,
}: ProgressBarProps) {
  const percent = max <= 0
    ? 0
    : Math.min(100, Math.max(0, (value / max) * 100));
  const meta = TONE_META[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      class={[
        "h-2 w-full overflow-hidden rounded-full bg-surface-muted",
        extraClass,
      ].filter(Boolean).join(" ")}
    >
      <div
        class={`h-full rounded-full ${meta.bar}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
