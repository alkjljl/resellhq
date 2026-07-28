import type { ReactNode } from "react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/cn";

export function Alert({
  children,
  tone = "error",
  className,
}: {
  children: ReactNode;
  tone?: "error" | "success" | "info";
  className?: string;
}) {
  const Icon = tone === "success" ? CircleCheck : CircleAlert;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-md border px-3.5 py-3 text-sm leading-5",
        tone === "error" &&
          "border-[var(--danger-line)] bg-[var(--danger-soft)] text-[var(--danger)]",
        tone === "success" &&
          "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--success)]",
        tone === "info" &&
          "border-[var(--line)] bg-[var(--surface-subtle)] text-[var(--ink-muted)]",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}
