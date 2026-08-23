"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const sections = [
  ["Profile", "/settings/profile"],
  ["Business", "/settings/business"],
  ["Team members", "/settings/team"],
  ["Preferences", "/settings/preferences"],
  ["Security", "/settings/security"],
] as const;

export function SettingsNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex max-w-full gap-1 overflow-x-auto overscroll-x-contain pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
      aria-label="Settings"
      data-bounded-scroll="settings-navigation"
    >
      {sections.map(([label, href]) => {
        const current = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "min-h-11 shrink-0 rounded-md px-3 py-2.5 text-sm font-medium text-[var(--ink-muted)] outline-none hover:bg-[var(--surface-subtle)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
              current && "bg-[var(--nav-active)] text-[var(--ink)]",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
