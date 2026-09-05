import type { ComponentChildren } from "preact";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary/40",
  secondary:
    "border border-border-strong bg-surface text-content hover:bg-surface-muted focus-visible:ring-border-strong",
  ghost:
    "text-content-muted hover:bg-surface-muted hover:text-content focus-visible:ring-border-strong",
  danger:
    "bg-status-sakit text-white hover:bg-status-sakit/90 focus-visible:ring-status-sakit/40",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-2.5 py-1.5 text-xs",
  md: "px-3.5 py-2 text-sm",
  lg: "px-4 py-2.5 text-base",
};

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: "button" | "submit";
  disabled?: boolean;
  title?: string;
  class?: string;
  onClick?: (event: MouseEvent) => void;
  children?: ComponentChildren;
}

export function Button({
  variant = "primary",
  size = "md",
  type = "button",
  disabled,
  title,
  class: extraClass,
  onClick,
  children,
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      title={title}
      aria-disabled={disabled}
      onClick={onClick}
      class={[BASE, VARIANTS[variant], SIZES[size], extraClass].filter(Boolean)
        .join(" ")}
    >
      {children}
    </button>
  );
}
