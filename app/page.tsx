import type { Metadata } from "next";
import Link from "next/link";
import { buildCanonicalUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: SITE_NAME },
  description: SITE_TAGLINE,
  alternates: {
    canonical: buildCanonicalUrl("/")
  },
  openGraph: {
    title: SITE_NAME,
    description: SITE_TAGLINE,
    url: buildCanonicalUrl("/"),
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
  }
};

export default async function HomePage() {
  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">LockdownCL Season Hub</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Current-season stats, rosters, and match results powered directly by the official
          LockdownCL database.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Players", href: "/players", detail: "Search every registered player." },
            { label: "Teams", href: "/teams", detail: "View rosters and team cards." },
            { label: "Standings", href: "/standings", detail: "Series W-L and map diff." },
            { label: "Matches", href: "/matches", detail: "Browse match history." },
            { label: "Account/Profile", href: "/account", detail: "Manage your profile." }
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-2xl border border-white/10 bg-black/30 p-4 text-left text-white/80 transition hover:border-white/30 hover:bg-black/40"
            >
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-2 text-xs text-white/60">{item.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">League overview</h3>
            <p className="text-sm text-white/70">
              Lowers, Uppers, Legends, and Womens divisions each track their own standings and
              match history.
            </p>
          </div>
          <Link
            href="/standings"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white/70 hover:border-white/60"
          >
            View standings
          </Link>
        </div>
      </section>
    </div>
  );
}
