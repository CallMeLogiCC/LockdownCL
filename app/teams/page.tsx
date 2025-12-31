import type { Metadata } from "next";
import Link from "next/link";
import { hasDatabaseUrl } from "@/lib/db";
import { getAllMatches } from "@/lib/queries";
import { LEAGUE_LABELS } from "@/lib/league";
import TeamLogo from "@/app/components/TeamLogo";
import { buildStandingsByLeague } from "@/lib/standings";
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

  const matches = await getAllMatches();
  const standings = buildStandingsByLeague(matches);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Teams</h2>
        <p className="text-sm text-white/70">
          Browse every active LockdownCL roster.
        </p>
      </div>

      <div className="grid gap-8">
        {LEAGUE_LABELS.map((league) => (
          <div key={league} className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">{league} League</h3>
              <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                {standings[league].length} squads
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {standings[league].map((team) => (
                <Link
                  key={team.team}
                  href={`/teams/${team.teamSlug}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-4">
                    <TeamLogo
                      teamSlug={team.teamSlug}
                      league={team.league}
                      alt={`${team.team} logo`}
                      size={48}
                      className="h-12 w-12 rounded-2xl border border-white/10 bg-black/40 object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="text-base font-semibold">{team.team}</h4>
                      <p className="mt-1 text-xs text-white/60">
                        Record {team.series_wins}-{team.series_losses} · Map diff {team.map_diff}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
