export default function ApplicationLoading() {
  return (
    <div
      className="mx-auto max-w-[1180px] animate-pulse px-4 py-8 sm:px-6 lg:px-8"
      role="status"
      aria-label="Loading workspace"
    >
      <div className="h-3 w-24 rounded bg-[var(--surface-strong)]" />
      <div className="mt-3 h-8 w-64 rounded bg-[var(--surface-strong)]" />
      <div className="mt-8 h-44 rounded-lg border border-[var(--line)] bg-[var(--surface)]" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
