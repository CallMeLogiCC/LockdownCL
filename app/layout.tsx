import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import JsonLd from "@/app/components/JsonLd";
import {
  BRAND_LOGO_PATH,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_URL,
  buildCanonicalUrl
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s | Lockdown CoD League"
  },
  description: SITE_TAGLINE,
  alternates: {
    canonical: SITE_URL
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en",
    url: SITE_URL,
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [
      {
        url: buildCanonicalUrl("/api/og/site"),
        width: 1200,
        height: 630,
        alt: SITE_NAME
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [buildCanonicalUrl("/api/og/site")]
  },
  icons: {
    icon: [{ url: "/icon.png" }],
    shortcut: [{ url: "/icon.png" }],
    apple: [{ url: "/icon.png" }]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-sm uppercase tracking-[0.3em] text-white/60">LockdownCL</span>
                <h1 className="text-3xl font-semibold text-white">LockdownCL Stats Hub</h1>
              </div>
              <nav className="flex flex-wrap gap-4 text-sm">
                <Link href="/">Home</Link>
                <Link href="/players">Players</Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 pt-6 text-sm text-white/50">
            Built for the LockdownCL community · Powered by Next.js &amp; Postgres
          </footer>
        </div>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "SportsOrganization",
            name: SITE_NAME,
            url: SITE_URL,
            logo: new URL(BRAND_LOGO_PATH, SITE_URL).toString()
          }}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
