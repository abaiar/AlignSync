import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "info" | "muted";

const tones: Record<Tone, string> = {
  success: "status-badge-success",
  warning: "status-badge-warning",
  danger: "status-badge-danger",
  info: "status-badge-info",
  muted: "status-badge-muted",
};

export function Badge({
  tone = "muted",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("status-badge", tones[tone], className)}>{children}</span>
  );
}
