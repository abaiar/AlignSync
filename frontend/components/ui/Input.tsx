import { cn } from "@/lib/utils";

export function Input({
  label,
  id,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-mono text-xs uppercase tracking-wider text-fg-secondary"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          "h-9 rounded border border-border bg-surface-elevated px-3 font-sans text-sm text-fg-primary placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40",
          className,
        )}
        {...props}
      />
    </div>
  );
}
