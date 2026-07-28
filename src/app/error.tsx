"use client";

import { Brand } from "@/components/shared/brand";
import { ThemeMenu } from "@/components/shared/theme-menu";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-5">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeMenu />
        </div>
        <div className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow-sm)]">
          <p className="eyebrow text-[var(--danger)]">Unexpected error</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
            This page could not be loaded.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
            Try the request again. Your saved business data has not been
            changed.
          </p>
          <Button onClick={reset} className="mt-7">
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
