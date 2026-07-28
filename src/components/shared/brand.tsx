import Link from "next/link";
import { cn } from "@/lib/cn";

export function Brand({
  href = "/",
  compact = false,
  className,
}: {
  href?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-sm font-semibold tracking-[-0.025em] text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
        className,
      )}
      aria-label="ResellHQ home"
    >
      <span
        className="relative grid size-8 place-items-center rounded-md bg-[var(--accent)]"
        aria-hidden="true"
      >
        <span className="size-3.5 rotate-45 border-2 border-[var(--accent-ink)]" />
        <span className="absolute size-1.5 bg-[var(--accent-ink)]" />
      </span>
      {!compact ? <span className="text-[17px]">ResellHQ</span> : null}
    </Link>
  );
}
