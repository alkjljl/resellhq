import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const title = "ResellHQ — Operate every resale";
const description =
  "A worldwide business operating system for independent resale operators.";

export async function generateMetadata(): Promise<Metadata> {
  let origin = "http://localhost:3000";

  try {
    origin = await getRequestOrigin();
  } catch {
    // Local builds without request headers still receive valid absolute metadata.
  }

  const imageUrl = new URL("/og.png", origin).toString();

  return {
    metadataBase: new URL(origin),
    title: {
      default: title,
      template: "%s · ResellHQ",
    },
    description,
    openGraph: {
      type: "website",
      url: origin,
      siteName: "ResellHQ",
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "ResellHQ — Run the business behind every resale.",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f4f0" },
    { media: "(prefers-color-scheme: dark)", color: "#090a0c" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
