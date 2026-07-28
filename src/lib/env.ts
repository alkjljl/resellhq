export function getSupabaseEnvironment() {
  // These must remain direct property reads. Next.js replaces NEXT_PUBLIC_*
  // references in browser bundles at build time, but cannot inline dynamic
  // access such as process.env[name].
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const missing = [
    !url && "NEXT_PUBLIC_SUPABASE_URL",
    !publishableKey && "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ].filter((name): name is string => Boolean(name));

  if (missing.length > 0) {
    throw new Error(
      `Missing required application configuration: ${missing.join(", ")}`,
    );
  }

  return {
    url: url as string,
    publishableKey: publishableKey as string,
  };
}
