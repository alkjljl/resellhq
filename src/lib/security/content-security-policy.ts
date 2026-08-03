export function createContentSecurityPolicy(environment: string | undefined) {
  const development = environment === "development";
  const scriptSources = ["'self'", "'unsafe-inline'"];
  const connectSources = [
    "'self'",
    "https://*.supabase.co",
    "wss://*.supabase.co",
  ];

  if (development) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push(
      "http://127.0.0.1:*",
      "ws://127.0.0.1:*",
      "http://localhost:*",
      "ws://localhost:*",
    );
  }

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
    "font-src 'self' data: https://api.fontshare.com https://cdn.fontshare.com",
    "img-src 'self' data: blob:",
    `connect-src ${connectSources.join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];

  if (!development) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
