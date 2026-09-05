import { useEffect, useState } from "preact/hooks";

export interface CopyCodeProps {
  value: string;
  label?: string;
  className?: string;
}

export default function CopyCode({
  value,
  label = "Salin kode",
  className,
}: CopyCodeProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      class={className ??
        "inline-flex items-center rounded-md border border-border-strong bg-surface px-3 py-1.5 text-xs font-semibold text-content transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"}
    >
      {copied ? "Tersalin ✓" : label}
    </button>
  );
}
