import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LockdownCL Stats",
  description: "Stats hub for the LockdownCL esports league"
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
        <Analytics />
      </body>
    </html>
  );
}
