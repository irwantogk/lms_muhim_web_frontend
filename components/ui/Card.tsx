import type { ComponentChildren } from "preact";

export interface CardProps {
  title?: string;
  description?: string;
  action?: ComponentChildren;
  class?: string;
  children?: ComponentChildren;
}

export function Card({
  title,
  description,
  action,
  class: extraClass,
  children,
}: CardProps) {
  return (
    <section
      class={[
        "rounded-xl border border-border bg-surface shadow-xs",
        extraClass,
      ].filter(Boolean).join(" ")}
    >
      {(title || action) && (
        <header class="flex items-start justify-between gap-4 border-b border-border px-4 py-3 sm:px-6">
          <div class="min-w-0">
            {title && (
              <h2 class="font-semibold text-lg text-content">{title}</h2>
            )}
            {description && (
              <p class="mt-0.5 text-sm text-content-muted">{description}</p>
            )}
          </div>
          {action && <div class="shrink-0">{action}</div>}
        </header>
      )}
      <div class="px-4 py-4 sm:px-6">{children}</div>
    </section>
  );
}
