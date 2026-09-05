import type { NavItem } from "./nav.ts";

export interface NavListProps {
  items: NavItem[];
  currentPath: string;
  variant?: "vertical" | "horizontal";
}

const VERTICAL_BASE =
  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

const HORIZONTAL_BASE =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors";

export function NavList(
  { items, currentPath, variant = "vertical" }: NavListProps,
) {
  const isVertical = variant === "vertical";

  return (
    <ul
      role="navigation"
      aria-label="Navigasi utama"
      class={isVertical
        ? "flex flex-col gap-1"
        : "flex items-center gap-2 overflow-x-auto pb-1"}
    >
      {items.map((item) => {
        const active = !item.disabled && item.href === currentPath;
        const classes = isVertical ? VERTICAL_BASE : HORIZONTAL_BASE;

        if (item.disabled) {
          return (
            <li key={item.key}>
              <span
                aria-disabled="true"
                title={item.description}
                class={`${classes} cursor-not-allowed opacity-60 ${
                  isVertical
                    ? "text-content-muted"
                    : "border-border bg-surface text-content-muted"
                }`}
              >
                {item.label}
              </span>
            </li>
          );
        }

        const highlight = isVertical
          ? active
            ? "bg-primary/10 text-primary"
            : "text-content-muted hover:bg-surface-muted hover:text-content"
          : active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-surface text-content-muted hover:text-content";

        return (
          <li key={item.key}>
            <a
              href={item.href}
              aria-current={active ? "page" : undefined}
              class={`${classes} ${highlight}`}
            >
              <span
                class={`h-1.5 w-1.5 rounded-full ${
                  active ? "bg-primary" : "bg-border-strong"
                }`}
                aria-hidden="true"
              />
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
