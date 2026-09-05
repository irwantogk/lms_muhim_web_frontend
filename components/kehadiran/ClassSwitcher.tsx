export interface ClassSwitcherProps {
  classes: Array<{ id: string; name: string; isCurrent: boolean }>;
  baseHref?: string;
}

export function ClassSwitcher(
  { classes: options, baseHref = "/kehadiran" }: ClassSwitcherProps,
) {
  if (options.length <= 1) return null;
  return (
    <div class="flex flex-wrap items-center gap-2">
      <span class="text-xs font-semibold uppercase tracking-wide text-content-muted">
        Kelas
      </span>
      {options.map((klass) => {
        const current = klass.isCurrent
          ? "bg-primary text-white border-primary"
          : "bg-surface text-content-muted border-border hover:text-primary";
        return (
          <a
            key={klass.id}
            href={`${baseHref}?class=${klass.id}`}
            aria-current={klass.isCurrent ? "page" : undefined}
            class={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${current}`}
          >
            {klass.name}
          </a>
        );
      })}
    </div>
  );
}
