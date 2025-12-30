import type { Metadata } from "next";
import { hasDatabaseUrl } from "@/lib/db";
import { getAllMatches, listPlayersWithStats } from "@/lib/queries";
import type { StandingRow } from "@/lib/types";
import { LEAGUE_TEAMS, LeagueKey } from "@/lib/league";
import PlayerLists from "@/app/components/PlayerLists";
import StandingsTabs from "@/app/components/StandingsTabs";
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

const buildStandings = (teams: string[], matches: Awaited<ReturnType<typeof getAllMatches>>) => {
  const standings = new Map<string, StandingRow>();

  teams.forEach((team) => {
    standings.set(team, {
      team,
      series_wins: 0,
      series_losses: 0,
      map_wins: 0,
      map_losses: 0,
      map_diff: 0
    });
  });

  matches.forEach((match) => {
    const homeTeam = match.home_team ?? "";
    const awayTeam = match.away_team ?? "";
    const homeWins = match.home_wins ?? 0;
    const awayWins = match.away_wins ?? 0;

    if (standings.has(homeTeam)) {
      const entry = standings.get(homeTeam)!;
      entry.map_wins += homeWins;
      entry.map_losses += awayWins;
      if (homeWins > awayWins) {
        entry.series_wins += 1;
      } else if (homeWins < awayWins) {
        entry.series_losses += 1;
      }
    }

    if (standings.has(awayTeam)) {
      const entry = standings.get(awayTeam)!;
      entry.map_wins += awayWins;
      entry.map_losses += homeWins;
      if (awayWins > homeWins) {
        entry.series_wins += 1;
      } else if (awayWins < homeWins) {
        entry.series_losses += 1;
      }
    }
  });

  return Array.from(standings.values())
    .map((entry) => ({
      ...entry,
      map_diff: entry.map_wins - entry.map_losses
    }))
    .sort((a, b) => {
      if (a.series_wins !== b.series_wins) {
        return b.series_wins - a.series_wins;
      }
      if (a.map_diff !== b.map_diff) {
        return b.map_diff - a.map_diff;
      }
      return a.team.localeCompare(b.team);
    });
};

export default async function HomePage() {
  if (!hasDatabaseUrl()) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
        Database is not configured. Please set <code>DATABASE_URL</code> in your Vercel
        environment variables and redeploy.
      </section>
    );
  }

  const [players, matches] = await Promise.all([listPlayersWithStats(), getAllMatches()]);

  const standings = (Object.keys(LEAGUE_TEAMS) as LeagueKey[]).reduce(
    (acc, league) => {
      acc[league] = buildStandings(LEAGUE_TEAMS[league], matches);
      return acc;
    },
    {} as Record<LeagueKey, StandingRow[]>
  );

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-8">
        <h2 className="text-2xl font-semibold text-white">LockdownCL Season Hub</h2>
        <p className="mt-3 max-w-2xl text-sm text-white/70">
          Current-season stats, rosters, and match results powered directly by the official
          LockdownCL database.
        </p>
      </section>

      <PlayerLists players={players} />
      <StandingsTabs standings={standings} />
    </div>
  );
}
