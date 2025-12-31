import Link from "next/link";
import type { Metadata } from "next";
import { hasDatabaseUrl } from "@/lib/db";
import { getAllTeams } from "@/lib/queries";
import { slugifyTeam } from "@/lib/slug";
import { buildCanonicalUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Teams",
  description: SITE_TAGLINE,
  alternates: {
    canonical: buildCanonicalUrl("/teams")
  },
  openGraph: {
    title: `Teams | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    url: buildCanonicalUrl("/teams"),
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
    title: `Teams | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    images: [buildCanonicalUrl("/api/og/site")]
  }
};

export default async function TeamsPage() {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const teams = await getAllTeams();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Teams</h2>
        <p className="text-sm text-white/70">
          Browse every active LockdownCL roster.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => (
          <Link
            key={team}
            href={`/teams/${slugifyTeam(team)}`}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white hover:bg-white/10"
          >
            <h3 className="text-lg font-semibold">{team}</h3>
            <p className="text-xs text-white/60">View roster and match history →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
