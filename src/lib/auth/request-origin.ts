import { headers } from "next/headers";

export async function getRequestOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return new URL(configured).origin;

  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const protocol = headerStore.get("x-forwarded-proto") ?? "http";

  if (!host || !["http", "https"].includes(protocol)) {
    throw new Error("The application origin is not configured.");
  }

  return `${protocol}://${host}`;
}
