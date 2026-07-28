import Link from "next/link";
import { Brand } from "@/components/shared/brand";
import { ThemeMenu } from "@/components/shared/theme-menu";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-5">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between">
          <Brand />
          <ThemeMenu />
        </div>
        <div className="mt-8 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-8 shadow-[var(--shadow-sm)]">
          <p className="eyebrow">404</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">
            Page not found
          </h1>
          <p className="mt-3 text-sm leading-6 text-[var(--ink-muted)]">
            The address may be wrong, or the page may have moved.
          </p>
          <Link href="/" className={`${buttonVariants()} mt-7`}>
            Return home
          </Link>
        </div>
      </div>
    </main>
  );
}
