import type { Metadata } from "next";
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
          <header className="flex flex-col gap-2 border-b border-white/10 pb-6">
            <span className="text-sm uppercase tracking-[0.3em] text-white/60">LockdownCL</span>
            <h1 className="text-3xl font-semibold text-white">LockdownCL Stats Hub</h1>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-white/10 pt-6 text-sm text-white/50">
            Built for the LockdownCL community · Powered by Next.js &amp; Supabase-ready Postgres
          </footer>
        </div>
      </body>
    </html>
  );
}
