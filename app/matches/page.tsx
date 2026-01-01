import type { Metadata } from "next";
import { hasDatabaseUrl } from "@/lib/db";
import { getMatchesBySeason } from "@/lib/queries";
import { buildCanonicalUrl, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import { SEASON_LABELS } from "@/lib/seasons";
import type { MatchLog, SeasonNumber } from "@/lib/types";
import MatchesFiltersClient from "@/app/matches/MatchesFiltersClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Matches",
  description: SITE_TAGLINE,
  alternates: {
    canonical: buildCanonicalUrl("/matches")
  },
  openGraph: {
    title: `Matches | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    url: buildCanonicalUrl("/matches"),
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
    title: `Matches | ${SITE_NAME}`,
    description: SITE_TAGLINE,
    images: [buildCanonicalUrl("/api/og/site")]
  }
};

export default async function MatchesPage() {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const matchesBySeasonEntries = await Promise.all(
    SEASON_LABELS.map(async (season) => {
      const matches = await getMatchesBySeason(season.value);
      return [season.value, matches] as const;
    })
  );
  const matchesBySeason = Object.fromEntries(matchesBySeasonEntries) as Record<
    SeasonNumber,
    MatchLog[]
  >;

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Matches</h2>
        <p className="text-sm text-white/70">
          Explore every recorded series for the selected season.
        </p>
      </div>

      <MatchesFiltersClient matchesBySeason={matchesBySeason} />
    </section>
  );
}
