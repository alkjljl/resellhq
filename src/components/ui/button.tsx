import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas)] disabled:pointer-events-none disabled:opacity-55",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] text-[var(--accent-ink)] hover:bg-[var(--accent-hover)]",
        secondary:
          "border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-subtle)]",
        ghost: "text-[var(--ink-muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)]",
        danger:
          "border border-[var(--danger-line)] bg-[var(--surface)] text-[var(--danger)] hover:bg-[var(--danger-soft)]",
      },
      size: {
        default: "h-11",
        sm: "h-11 px-3 text-xs",
        lg: "h-12 px-5",
        icon: "size-11 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
