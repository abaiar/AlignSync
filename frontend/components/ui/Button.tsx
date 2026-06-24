import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-black hover:bg-accent-hover border border-accent font-semibold",
  secondary:
    "bg-transparent text-fg-primary hover:bg-surface-elevated border border-border",
  danger:
    "bg-transparent text-danger hover:bg-danger/10 border border-danger/40",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex h-9 items-center justify-center gap-2 rounded px-4 font-sans text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
