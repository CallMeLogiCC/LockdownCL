import Link from "next/link";
import type { Metadata } from "next";
import { hasDatabaseUrl } from "@/lib/db";
import { getMatchesBySeason } from "@/lib/queries";
import { buildCanonicalUrl, formatMatchDateDisplay, SITE_NAME, SITE_TAGLINE } from "@/lib/seo";
import {
  DEFAULT_SEASON,
  SEASON_LABELS,
  getMatchLeague,
  getSeasonLeagueOptions,
  isSeasonValue
} from "@/lib/seasons";

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

export default async function MatchesPage({
  searchParams
}: {
  searchParams?: { season?: string; league?: string; team?: string };
}) {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const seasonValue = Number(searchParams?.season ?? DEFAULT_SEASON);
  const selectedSeason = isSeasonValue(seasonValue) ? seasonValue : DEFAULT_SEASON;
  const leagueFilter = (searchParams?.league ?? "all").toLowerCase();
  const teamFilter = (searchParams?.team ?? "").trim();

  const matches = await getMatchesBySeason(selectedSeason);
  const matchesWithLeague = matches.map((match) => ({
    ...match,
    league: getMatchLeague(selectedSeason, match.home_team, match.away_team)
  }));

  const filteredMatches = matchesWithLeague.filter((match) => {
    if (leagueFilter !== "all" && match.league.toLowerCase() !== leagueFilter) {
      return false;
    }
    if (teamFilter) {
      const query = teamFilter.toLowerCase();
      const home = (match.home_team ?? "").toLowerCase();
      const away = (match.away_team ?? "").toLowerCase();
      if (!home.includes(query) && !away.includes(query)) {
        return false;
      }
    }
    return true;
  });

  const leagueOptions = getSeasonLeagueOptions(selectedSeason);

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Matches</h2>
        <p className="text-sm text-white/70">
          Explore every recorded series for the selected season.
        </p>
      </div>

      <form className="rounded-2xl border border-white/10 bg-white/5 p-4" method="get">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
            Season
            <select
              name="season"
              defaultValue={String(selectedSeason)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              {SEASON_LABELS.map((season) => (
                <option key={season.value} value={season.value}>
                  {season.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
            League
            <select
              name="league"
              defaultValue={leagueFilter}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            >
              <option value="all">All leagues</option>
              {leagueOptions.map((league) => (
                <option key={league} value={league.toLowerCase()}>
                  {league}
                </option>
              ))}
              <option value="unknown">Unknown</option>
            </select>
          </label>

          <label className="flex flex-col gap-2 text-xs uppercase tracking-[0.3em] text-white/50">
            Team name
            <input
              type="text"
              name="team"
              defaultValue={teamFilter}
              placeholder="Search by team"
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            />
          </label>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <button
            type="submit"
            className="rounded-full border border-white/10 bg-white/10 px-5 py-2 text-xs uppercase tracking-[0.3em] text-white transition hover:bg-white/20"
          >
            Apply filters
          </button>
        </div>
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Series results</h3>
          <span className="text-xs uppercase tracking-[0.3em] text-white/50">
            {filteredMatches.length} matches
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {filteredMatches.length === 0 ? (
            <p className="text-sm text-white/60">No matches found for these filters.</p>
          ) : (
            filteredMatches.map((match) => {
              const scoreline = `${match.home_wins ?? 0}-${match.away_wins ?? 0}`;
              const winner =
                (match.home_wins ?? 0) > (match.away_wins ?? 0)
                  ? match.home_team
                  : match.away_team;

              return (
                <Link
                  key={match.match_id}
                  href={`/matches/${match.match_id}`}
                  className="block rounded-xl border border-white/10 bg-black/20 p-4 text-sm transition hover:bg-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-white">
                        {match.home_team ?? "TBD"} vs {match.away_team ?? "TBD"}
                      </p>
                      <p className="text-xs text-white/60">
                        {formatMatchDateDisplay(match.match_date)} · League: {match.league}
                      </p>
                    </div>
                    <div className="text-xs text-white/60">
                      Score: {scoreline} · Winner: {winner ?? "TBD"}
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
