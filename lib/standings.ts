import type { MatchLog } from "@/lib/types";
import { type LeagueKey } from "@/lib/league";
import { getTeamLogo, getTeamsForLeague } from "@/lib/teams";

export type StandingRowWithMeta = {
  team: string;
  teamSlug: string;
  league: LeagueKey;
  logo: ReturnType<typeof getTeamLogo>;
  series_wins: number;
  series_losses: number;
  map_wins: number;
  map_losses: number;
  map_diff: number;
};

export const buildStandingsForLeague = (
  league: LeagueKey,
  matches: MatchLog[]
): StandingRowWithMeta[] => {
  const teams = getTeamsForLeague(league);
  const standings = new Map<string, StandingRowWithMeta>();

  teams.forEach((team) => {
    standings.set(team.displayName, {
      team: team.displayName,
      teamSlug: team.slug,
      league,
      logo: getTeamLogo(team.slug, league),
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

export const buildStandingsByLeague = (matches: MatchLog[]) => ({
  Lowers: buildStandingsForLeague("Lowers", matches),
  Uppers: buildStandingsForLeague("Uppers", matches),
  Legends: buildStandingsForLeague("Legends", matches),
  Womens: buildStandingsForLeague("Womens", matches)
});
