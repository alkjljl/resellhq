import * as React from "react";
import { cn } from "@/lib/cn";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full appearance-none rounded-md border border-[var(--line-strong)] bg-[var(--surface)] px-3.5 pr-9 text-sm text-[var(--ink)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus-soft)] disabled:cursor-not-allowed disabled:opacity-70 aria-[invalid=true]:border-[var(--danger)]",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";
