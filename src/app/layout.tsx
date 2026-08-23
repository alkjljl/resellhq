import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { getRequestOrigin } from "@/lib/auth/request-origin";
import { ThemeProvider } from "@/providers/theme-provider";
import "./globals.css";

const title = "ResellHQ — Operate every resale";
const description =
  "A worldwide business operating system for independent resale operators.";
const fontStylesheet =
  "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&f[]=gambetta@500,600&f[]=azeret-mono@400,500&display=swap";
const dataFontStylesheet =
  "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap";

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
    { media: "(prefers-color-scheme: light)", color: "#f3f0e8" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0d0a" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="preconnect"
          href="https://cdn.fontshare.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="stylesheet" href={fontStylesheet} />
        <link rel="stylesheet" href={dataFontStylesheet} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
