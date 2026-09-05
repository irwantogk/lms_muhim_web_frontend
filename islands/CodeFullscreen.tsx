import { useEffect, useState } from "preact/hooks";

export default function CodeFullscreen({
  className,
}: {
  className?: string;
}) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    function onChange() {
      setActive(document.fullscreenElement !== null);
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  function toggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined);
    } else {
      document.documentElement.requestFullscreen().catch(() => undefined);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      class={className ??
        "inline-flex items-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"}
    >
      {active ? "Keluar layar penuh" : "Layar penuh"}
    </button>
  );
}
