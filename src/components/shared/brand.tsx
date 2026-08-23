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
        "inline-flex min-h-11 min-w-11 items-center gap-2.5 rounded-sm text-sm font-semibold tracking-[-0.025em] text-[var(--ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
        className,
      )}
      aria-label="ResellHQ home"
    >
      <span
        className="relative grid size-7 place-items-center border border-[var(--accent-line)] bg-[var(--accent-soft)]"
        aria-hidden="true"
      >
        <span className="flex h-3.5 items-end gap-[2px]">
          <span className="h-2 w-[2px] bg-[var(--accent)]" />
          <span className="h-3.5 w-[2px] bg-[var(--accent)]" />
          <span className="h-2.5 w-[2px] bg-[var(--accent)]" />
        </span>
        <span className="absolute bottom-1.5 h-px w-3.5 bg-[var(--accent)]" />
      </span>
      {!compact ? (
        <span className="display-heading text-[18px] font-semibold">ResellHQ</span>
      ) : null}
    </Link>
  );
}
