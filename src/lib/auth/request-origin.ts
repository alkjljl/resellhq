import { headers } from "next/headers";

type RequestOriginInput = {
  configuredOrigin?: string;
  environment: string | undefined;
  forwardedHost?: string | null;
  host?: string | null;
  protocol?: string | null;
};

export function resolveRequestOrigin({
  configuredOrigin,
  environment,
  forwardedHost,
  host,
  protocol,
}: RequestOriginInput) {
  if (configuredOrigin) {
    const configuredUrl = new URL(configuredOrigin);
    if (!["http:", "https:"].includes(configuredUrl.protocol)) {
      throw new Error("The configured application origin must use HTTP or HTTPS.");
    }
    return configuredUrl.origin;
  }

  if (environment !== "development") {
    throw new Error("NEXT_PUBLIC_APP_URL is required outside development.");
  }

  const requestHost = forwardedHost ?? host;
  const requestProtocol = protocol ?? "http";
  if (!requestHost || !["http", "https"].includes(requestProtocol)) {
    throw new Error("The application origin is not configured.");
  }

  return `${requestProtocol}://${requestHost}`;
}

export async function getRequestOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) {
    return resolveRequestOrigin({
      configuredOrigin: configured,
      environment: process.env.NODE_ENV,
    });
  }

  const headerStore = await headers();
  return resolveRequestOrigin({
    environment: process.env.NODE_ENV,
    forwardedHost: headerStore.get("x-forwarded-host"),
    host: headerStore.get("host"),
    protocol: headerStore.get("x-forwarded-proto"),
  });
}
