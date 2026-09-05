import type { RoleTone } from "../../lib/types.ts";
import { TONE_META } from "../../lib/roles.ts";

export type AvatarSize = "sm" | "md" | "lg";

const SIZES: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export interface AvatarProps {
  name: string;
  size?: AvatarSize;
  tone?: RoleTone;
  photoUrl?: string | null;
}

export function Avatar({
  name,
  size = "md",
  tone = "primary",
  photoUrl,
}: AvatarProps) {
  const meta = TONE_META[tone];
  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        class={`shrink-0 rounded-full object-cover ${SIZES[size]}`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      class={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${
        SIZES[size]
      } ${meta.solid}`}
    >
      {initials(name)}
    </span>
  );
}
